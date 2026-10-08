"use server";

import { revalidatePath } from "next/cache";
import { createClient } from "@/lib/supabase/server";

// Cast (or change / remove) a vote on a dossier. `value` is the button the user
// pressed: 1 (upvote) or -1 (downvote). Clicking the same value again removes
// the vote (toggle off). Auth is required — enforced here AND by RLS.
export async function castVote(generationId, value) {
  if (value !== 1 && value !== -1) {
    return { ok: false, message: "Invalid vote." };
  }

  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();

  if (!user) {
    return { ok: false, message: "You must be signed in to vote." };
  }

  // Do we already have a vote on this dossier?
  const { data: existing } = await supabase
    .from("votes")
    .select("id, value")
    .eq("generation_id", generationId)
    .eq("user_id", user.id)
    .maybeSingle();

  let error;
  if (!existing) {
    ({ error } = await supabase.from("votes").insert({
      generation_id: generationId,
      user_id: user.id,
      value,
    }));
  } else if (existing.value === value) {
    // Same button pressed again → remove the vote.
    ({ error } = await supabase.from("votes").delete().eq("id", existing.id));
  } else {
    // Flip the vote.
    ({ error } = await supabase
      .from("votes")
      .update({ value })
      .eq("id", existing.id));
  }

  if (error) {
    return { ok: false, message: error.message };
  }

  revalidatePath("/vault");
  return { ok: true };
}
