import "server-only";

import { io } from "next/cache";
import { cookies } from "next/headers";
import { createServerClient } from "@supabase/ssr";
import type { Database } from "./database.types";
import { supabaseEnv } from "./env";

/**
 * Supabase client for Server Components, Server Actions and Route Handlers.
 * Create a new one per request — never share it between requests.
 */
export async function createClient() {
  const { url, key } = supabaseEnv();
  const cookieStore = await cookies();
  // The auth client checks token expiry against the clock as soon as it's
  // created. io() tells Next.js that time-dependent work follows, so it isn't
  // baked into a prerendered page.
  await io();

  return createServerClient<Database>(url, key, {
    cookies: {
      getAll() {
        return cookieStore.getAll();
      },
      setAll(cookiesToSet) {
        try {
          for (const { name, value, options } of cookiesToSet) cookieStore.set(name, value, options);
        } catch {
          // Server Components can't set cookies. That's fine: the proxy
          // (src/proxy.ts) refreshes the session cookie on every request.
        }
      },
    },
  });
}
