"use server";

import { refresh } from "next/cache";
import { getCurrentUser } from "@/lib/auth";
import { createClient } from "@/lib/supabase/server";
import { fieldErrors, profileSchema } from "@/lib/validation/auth";
import type { FormState } from "@/app/(auth)/actions";

export async function updateProfile(_prev: FormState, formData: FormData): Promise<FormState> {
  // Re-check the user inside the action: never trust the browser.
  const user = await getCurrentUser();

  const raw = {
    displayName: String(formData.get("displayName") ?? ""),
    targetExamDate: String(formData.get("targetExamDate") ?? ""),
    showRussian: formData.get("showRussian") === "on",
  };
  const parsed = profileSchema.safeParse(raw);
  if (!parsed.success) {
    return {
      status: "error",
      fields: fieldErrors(parsed.error),
      values: { displayName: raw.displayName, targetExamDate: raw.targetExamDate },
    };
  }

  const supabase = await createClient();
  const { error } = await supabase
    .from("profiles")
    .update({
      display_name: parsed.data.displayName,
      target_exam_date: parsed.data.targetExamDate,
      show_russian: parsed.data.showRussian,
    })
    .eq("id", user.id);

  if (error) return { status: "error", message: "We couldn't save your changes. Please try again." };
  refresh();
  return { status: "success", message: "Saved." };
}
