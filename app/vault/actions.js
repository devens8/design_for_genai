"use server";

import { revalidatePath } from "next/cache";
import { createClient } from "@/lib/supabase/server";

// Pages that render dossier cards and so need fresh data after a mutation.
function revalidateFeeds() {
  revalidatePath("/vault");
  revalidatePath("/saved");
  revalidatePath("/dashboard");
}

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

  revalidateFeeds();
  return { ok: true };
}

// Add / remove a dossier from the user's "Saved" want-to-go list.
export async function toggleSave(generationId, save) {
  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();

  if (!user) {
    return { ok: false, message: "You must be signed in to save spots." };
  }

  const { error } = save
    ? await supabase
        .from("saves")
        .upsert(
          { user_id: user.id, generation_id: generationId },
          { onConflict: "user_id,generation_id", ignoreDuplicates: true }
        )
    : await supabase
        .from("saves")
        .delete()
        .eq("user_id", user.id)
        .eq("generation_id", generationId);

  if (error) {
    return { ok: false, message: error.message };
  }

  revalidateFeeds();
  return { ok: true };
}

// Delete one of your own dossiers. RLS only allows deleting rows you own; the
// explicit user_id filter makes that intent obvious here too.
export async function deleteDossier(generationId) {
  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();

  if (!user) {
    return { ok: false, message: "You must be signed in." };
  }

  const { error, count } = await supabase
    .from("generations")
    .delete({ count: "exact" })
    .eq("id", generationId)
    .eq("user_id", user.id);

  if (error) {
    return { ok: false, message: error.message };
  }
  if (!count) {
    return { ok: false, message: "You can only delete your own spots." };
  }

  revalidateFeeds();
  return { ok: true };
}
