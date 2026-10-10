import { NextResponse, type NextRequest } from "next/server";
import { createServerClient } from "@supabase/ssr";
import { supabaseEnv } from "./env";

/** Pages that need a signed-in user. */
const PROTECTED_PREFIXES = [
  "/dashboard",
  "/practice",
  "/review",
  "/bookmarks",
  "/mock-exams",
  "/terminology",
  "/analytics",
  "/tutor",
  "/questions",
  "/settings",
  "/reset-password",
];

/** Sign-in pages a signed-in user doesn't need to see. */
const GUEST_ONLY = ["/login", "/signup", "/forgot-password"];

function matches(pathname: string, prefixes: string[]) {
  return prefixes.some((p) => pathname === p || pathname.startsWith(p + "/"));
}

/**
 * Runs before every page request:
 * 1. refreshes the Supabase session cookie if it's about to expire;
 * 2. sends signed-out visitors on protected pages to /login (optimistic check —
 *    every server data access re-checks the user, see src/lib/auth.ts).
 */
export async function updateSession(request: NextRequest) {
  const { url, key } = supabaseEnv();
  let response = NextResponse.next({ request });

  const supabase = createServerClient(url, key, {
    cookies: {
      getAll() {
        return request.cookies.getAll();
      },
      setAll(cookiesToSet, headers) {
        for (const { name, value } of cookiesToSet) request.cookies.set(name, value);
        response = NextResponse.next({ request });
        for (const { name, value, options } of cookiesToSet) response.cookies.set(name, value, options);
        for (const [k, v] of Object.entries(headers)) response.headers.set(k, v);
      },
    },
  });

  // Don't put code between createServerClient and getClaims: getClaims is what
  // validates (and if needed refreshes) the session.
  const { data } = await supabase.auth.getClaims();
  const signedIn = !!data?.claims;
  const { pathname, search } = request.nextUrl;

  const redirectTo = (path: string) => {
    const target = request.nextUrl.clone();
    target.pathname = path;
    target.search = "";
    if (path === "/login") target.searchParams.set("next", pathname + search);
    const res = NextResponse.redirect(target);
    // Keep any refreshed session cookies on the redirect.
    for (const c of response.cookies.getAll()) res.cookies.set(c);
    return res;
  };

  if (!signedIn && matches(pathname, PROTECTED_PREFIXES)) return redirectTo("/login");
  if (signedIn && matches(pathname, GUEST_ONLY)) return redirectTo("/dashboard");

  return response;
}
