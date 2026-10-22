import Link from "next/link";
import { createClient } from "@/lib/supabase/server";

export const dynamic = "force-dynamic";

const STEPS = [
  {
    n: "01",
    title: "Pick a neighborhood and a vibe",
    body: "Coffee in Astoria, a view in DUMBO, something cheap and weird in Bushwick. Add notes like “open late” or “good for a date.”",
  },
  {
    n: "02",
    title: "AI finds you a real spot",
    body: "Gemini writes a short pitch for one specific place, with an insider tip. It's added to the shared vault for everyone.",
  },
  {
    n: "03",
    title: "Vote, save, and go",
    body: "Vote on whether each spot is worth the trip, save the ones you want to try, and get directions in one tap.",
  },
];

export default async function Home() {
  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();

  return (
    <main>
      <section className="hero">
        <p className="hero-kicker">● NYC, rated by locals</p>

        <h1>
          NYC <span className="accent">VAULT</span>
        </h1>

        <p className="hero-sub">
          Tell the AI what you&apos;re in the mood for and it finds you a specific
          place in New York. The community votes on which picks are actually
          worth the trip.
        </p>

        <nav className="hero-nav">
          {user ? (
            <>
              <Link className="hero-link hero-link--primary" href="/vault">
                Browse the vault →
              </Link>
              <Link className="hero-link" href="/generate">
                Find a new spot
              </Link>
            </>
          ) : (
            <Link className="hero-link hero-link--primary" href="/login">
              Sign in with Google →
            </Link>
          )}
        </nav>
        {!user && (
          <p className="hero-note">Free. Sign in to browse, vote and save spots.</p>
        )}
      </section>

      <section className="steps" aria-labelledby="how-it-works">
        <h2 id="how-it-works" className="section-title">
          How it works
        </h2>
        <ol className="step-grid">
          {STEPS.map((s) => (
            <li key={s.n} className="step">
              <span className="step-n">{s.n}</span>
              <h3>{s.title}</h3>
              <p>{s.body}</p>
            </li>
          ))}
        </ol>
      </section>
    </main>
  );
}
