import Link from "next/link";
import { createClient } from "@/lib/supabase/server";
import NavLinks from "./NavLinks";

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
    <header className={`nav ${user ? "nav--member" : ""}`}>
      <div className="nav-top">
        <Link href={user ? "/vault" : "/"} className="nav-brand">
          <span className="nav-lock" aria-hidden="true">
            {user ? "⬡" : "⬣"}
          </span>
          <span className="nav-wordmark">
            NYC<span className="nav-dot">·</span>VAULT
          </span>
        </Link>

        {/* Members only: no content links until you sign in. */}
        {user && <NavLinks />}

        <div className="nav-access">
          {user ? (
            <>
              <Link
                href="/dashboard"
                className="nav-avatar"
                title={`My activity (${user.email})`}
                aria-label="My activity"
              >
                {initial}
              </Link>
              <form action="/auth/signout" method="post">
                <button type="submit" className="nav-btn">
                  Sign out
                </button>
              </form>
            </>
          ) : (
            <Link href="/login" className="nav-btn nav-btn--accent">
              Sign in
            </Link>
          )}
        </div>
      </div>
    </header>
  );
}
