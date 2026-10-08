import Link from "next/link";
import { createClient } from "@/lib/supabase/server";

export const dynamic = "force-dynamic";

export default async function Home() {
  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();

  return (
    <main className="hero">
      <p className="hero-kicker">● Declassified NYC Archive</p>

      <h1>
        NYC <span className="accent">VAULT</span>
      </h1>

      <p className="hero-sub">
        An AI-generated, community-verified archive of places worth visiting in
        New York. Unlock the vault to browse intel, generate new location
        dossiers, and rate the best spots in the city.
      </p>

      <nav className="hero-nav">
        {user ? (
          <>
            <Link className="hero-link hero-link--primary" href="/vault">
              Enter the vault →
            </Link>
            <Link className="hero-link" href="/generate">
              Generate a dossier
            </Link>
          </>
        ) : (
          <>
            <Link className="hero-link hero-link--primary" href="/login">
              Authenticate to unlock →
            </Link>
            <Link className="hero-link" href="/locations">
              Preview the archive
            </Link>
          </>
        )}
      </nav>
    </main>
  );
}
