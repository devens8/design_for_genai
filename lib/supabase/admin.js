import { createClient } from "@supabase/supabase-js";

// Service-role Supabase client. Bypasses RLS — use ONLY on the server (Server
// Actions / Route Handlers), never in a Client Component. Used for avatar
// uploads to the storage bucket.
export function createAdminClient() {
  const serviceKey =
    process.env.SUPABASE_SERVICE_ROLE_KEY || process.env.SUPABASE_SECRET_KEY;

  if (!serviceKey) {
    throw new Error("Missing SUPABASE_SERVICE_ROLE_KEY env var.");
  }

  return createClient(process.env.NEXT_PUBLIC_SUPABASE_URL, serviceKey, {
    auth: { autoRefreshToken: false, persistSession: false },
  });
}
