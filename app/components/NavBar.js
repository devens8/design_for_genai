import Link from "next/link";
import { createClient } from "@/lib/supabase/server";
import NavLinks from "./NavLinks";
import { LeafMark } from "./Art";

// Persistent top nav. Reads the session so it can show the member links and
// the signed-in user. Rendered from the root layout on every page.
export default async function NavBar() {
  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();

  let initial = "?";
  if (user) {
    const { data: profile } = await supabase
      .from("profiles")
      .select("first_name")
      .eq("id", user.id)
      .maybeSingle();
    initial = (profile?.first_name?.[0] ?? user.email?.[0] ?? "?").toUpperCase();
  }

  return (
    <header className="nav">
      <div className="nav-top">
        <Link href={user ? "/vault" : "/"} className="logo" aria-label="Little Spots NYC home">
          <LeafMark />
          <span className="logo-little">Little</span>
          <span className="logo-spots">SPOTS</span>
          <span className="logo-nyc">nyc</span>
        </Link>

        {/* Members only: no content links until you sign in. */}
        {user ? (
          <NavLinks initial={initial} email={user.email} />
        ) : (
          <div className="nav-access">
            <Link href="/login" className="btn btn--primary btn--sm">
              Sign in
            </Link>
          </div>
        )}
      </div>
    </header>
  );
}
