"use server";

import { revalidatePath } from "next/cache";
import { createClient } from "@/lib/supabase/server";
import { generateDossier } from "@/lib/gemini";

// Generate a new location dossier with Gemini and insert it into the DB.
// Mutating data requires auth: we re-check the session server-side (the RLS
// insert policy also enforces user_id = auth.uid() as a backstop).
export async function createDossier(prevState, formData) {
  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();

  if (!user) {
    return { ok: false, message: "You must be signed in to generate." };
  }

  const neighborhood = formData.get("neighborhood")?.toString().trim();
  const category = formData.get("category")?.toString().trim();
  const notes = formData.get("notes")?.toString().trim() || null;

  if (!neighborhood || !category) {
    return { ok: false, message: "Pick a neighborhood and a category." };
  }

  let dossier;
  try {
    dossier = await generateDossier({ neighborhood, category, notes });
  } catch (err) {
    return { ok: false, message: err.message || "Generation failed." };
  }

  const { data: row, error } = await supabase
    .from("generations")
    .insert({
      user_id: user.id,
      prompt: dossier.prompt,
      neighborhood,
      category,
      place_name: dossier.place_name,
      blurb: dossier.blurb,
      model: dossier.model,
    })
    .select("id, place_name, neighborhood, category, blurb")
    .single();

  if (error) {
    return { ok: false, message: `Could not save: ${error.message}` };
  }

  // The vault feed reads fresh on each request, but revalidate to be safe.
  revalidatePath("/vault");

  return { ok: true, message: "Dossier declassified and filed.", dossier: row };
}
