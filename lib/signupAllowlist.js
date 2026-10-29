import "server-only";
import { createAdminClient } from "@/lib/supabase/admin";

// Who may sign in (Week 7). Managed in the admin app: an email is allowed if
// its domain is in allowed_signup_domains OR the exact address is in
// whitelisted_emails. Both tables are server-only (no client grants), so this
// reads them with the service-role key. If both lists are empty the app is
// open to everyone, so a fresh database can't lock out its first admin.
export async function isEmailAllowed(email) {
  const addr = email?.trim().toLowerCase();
  if (!addr || !addr.includes("@")) return false;
  const domain = addr.split("@").pop();

  const db = createAdminClient();
  const [domains, emails] = await Promise.all([
    db.from("allowed_signup_domains").select("domain"),
    db.from("whitelisted_emails").select("email"),
  ]);
  // Fail closed if the lists can't be read.
  if (domains.error || emails.error) return false;
  if (!domains.data.length && !emails.data.length) return true;

  return (
    domains.data.some((d) => d.domain === domain) ||
    emails.data.some((e) => e.email === addr)
  );
}
