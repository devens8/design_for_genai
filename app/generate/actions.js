"use server";

import { revalidatePath } from "next/cache";
import { createClient } from "@/lib/supabase/server";
import { createAdminClient } from "@/lib/supabase/admin";
import { runGeneration } from "@/lib/pipeline";

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
    return { ok: false, message: "Pick a neighborhood and a vibe." };
  }
  if (neighborhood.length > 40 || category.length > 40 || (notes?.length ?? 0) > 200) {
    return { ok: false, message: "That's a bit long — keep it short and try again." };
  }

  // Prompt chain, model, glossary and examples all come from the DB (managed
  // in the admin app); the service-role client writes the request/LLM logs.
  const logDb = createAdminClient();
  let dossier;
  try {
    dossier = await runGeneration(logDb, {
      userId: user.id,
      source: "app",
      neighborhood,
      category,
      notes,
    });
  } catch (err) {
    console.error("runGeneration failed:", err);
    return {
      ok: false,
      message: "The AI couldn't come up with a spot just now. Please try again in a few seconds.",
    };
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
    await dossier.finish({ status: "failed", error: `Save failed: ${error.message}` });
    return { ok: false, message: `Found a spot but couldn't save it: ${error.message}` };
  }
  await dossier.finish({ status: "succeeded", generation_id: row.id });

  // The vault feed reads fresh on each request, but revalidate to be safe.
  revalidatePath("/vault");
  revalidatePath("/dashboard");

  return { ok: true, message: "Dossier declassified and filed.", dossier: row };
}
