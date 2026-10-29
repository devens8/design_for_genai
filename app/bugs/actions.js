"use server";

import { headers } from "next/headers";
import { createClient } from "@/lib/supabase/server";

const SEVERITIES = ["low", "medium", "high"];

// File a bug report as the signed-in member. RLS pins user_id to auth.uid();
// admins triage reports in the admin app.
export async function reportBug(prevState, formData) {
  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();
  if (!user) return { ok: false, message: "Sign in to report a bug." };

  const title = formData.get("title")?.toString().trim() ?? "";
  const description = formData.get("description")?.toString().trim() ?? "";
  const severity = formData.get("severity")?.toString();
  const pageUrl = formData.get("page_url")?.toString().slice(0, 500) || null;

  if (title.length < 3 || title.length > 120) {
    return { ok: false, message: "Give it a short title (3–120 characters)." };
  }
  if (description.length < 5 || description.length > 2000) {
    return { ok: false, message: "Describe what happened (up to 2000 characters)." };
  }
  if (!SEVERITIES.includes(severity)) {
    return { ok: false, message: "Pick how bad it is." };
  }

  const { error } = await supabase.from("bug_reports").insert({
    user_id: user.id,
    title,
    description,
    severity,
    page_url: pageUrl,
    user_agent: (await headers()).get("user-agent")?.slice(0, 400) ?? null,
  });
  if (error) return { ok: false, message: `Couldn't send that: ${error.message}` };

  return { ok: true, message: "Thanks! The team will take a look.", stamp: Date.now() };
}
