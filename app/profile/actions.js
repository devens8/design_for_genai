"use server";

import { revalidatePath } from "next/cache";
import { createClient } from "@/lib/supabase/server";
import { createAdminClient } from "@/lib/supabase/admin";

// Update the signed-in user's profile: first name, last name, optional bio, and
// an optional avatar photo. The photo goes to the "avatars" storage bucket
// (NOT the database) and only its public URL is stored on the row.
export async function updateProfile(prevState, formData) {
  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();

  if (!user) {
    return { ok: false, message: "You must be signed in." };
  }

  const firstName = formData.get("first_name")?.toString().trim() || null;
  const lastName = formData.get("last_name")?.toString().trim() || null;
  const bio = formData.get("bio")?.toString().trim() || null;

  if (!firstName || !lastName) {
    return { ok: false, message: "First and last name are required." };
  }

  const update = {
    id: user.id,
    email: user.email,
    first_name: firstName,
    last_name: lastName,
    bio,
    updated_at: new Date().toISOString(),
  };

  // Handle the uploaded photo, if any.
  const file = formData.get("avatar");
  if (file && typeof file !== "string" && file.size > 0) {
    if (!file.type.startsWith("image/")) {
      return { ok: false, message: "Please upload an image file." };
    }
    if (file.size > 5 * 1024 * 1024) {
      return { ok: false, message: "Image must be under 5 MB." };
    }

    const admin = createAdminClient();
    const ext = (file.name.split(".").pop() || "jpg").toLowerCase();
    const path = `${user.id}/avatar.${ext}`;
    const bytes = new Uint8Array(await file.arrayBuffer());

    const { error: uploadError } = await admin.storage
      .from("avatars")
      .upload(path, bytes, { contentType: file.type, upsert: true });

    if (uploadError) {
      return { ok: false, message: `Upload failed: ${uploadError.message}` };
    }

    const {
      data: { publicUrl },
    } = admin.storage.from("avatars").getPublicUrl(path);

    // Cache-bust so a replaced photo shows immediately.
    update.avatar_url = `${publicUrl}?v=${Date.now()}`;
  }

  const { error } = await supabase.from("profiles").upsert(update);
  if (error) {
    return { ok: false, message: `Could not save: ${error.message}` };
  }

  revalidatePath("/profile");
  revalidatePath("/dashboard");
  return { ok: true, message: "Profile saved." };
}
