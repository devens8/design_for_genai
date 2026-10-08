import Link from "next/link";
import { createClient } from "@/lib/supabase/server";

// Persistent top nav. Reads the session so it can show the ACCESS status chip
// and gate the member-only links. Rendered from the root layout on every page.
export default async function NavBar() {
  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();

  return (
    <header className="nav">
      <Link href="/" className="nav-brand">
        <span className="nav-lock" aria-hidden="true">
          {user ? "⬡" : "⬣"}
        </span>
        <span className="nav-wordmark">
          NYC<span className="nav-dot">·</span>VAULT
        </span>
      </Link>

      {/* Members only: no content links until you authenticate. */}
      {user && (
        <nav className="nav-links">
          <Link href="/vault">Vault</Link>
          <Link href="/generate">Generate</Link>
          <Link href="/vault?sort=top">Leaderboard</Link>
          <Link href="/locations">Archive</Link>
          <Link href="/profile">Profile</Link>
        </nav>
      )}

      <div className="nav-access">
        {user ? (
          <>
            <span className="chip chip--granted" title={user.email}>
              <span className="chip-dot" /> ACCESS GRANTED
            </span>
            <form action="/auth/signout" method="post">
              <button type="submit" className="nav-btn">
                Lock
              </button>
            </form>
          </>
        ) : (
          <>
            <span className="chip chip--locked">
              <span className="chip-dot" /> LOCKED
            </span>
            <Link href="/login" className="nav-btn nav-btn--accent">
              Authenticate
            </Link>
          </>
        )}
      </div>
    </header>
  );
}
