import Link from "next/link";
import { createClient } from "@/lib/supabase/server";
import { CoffeeCup, LeafSprig, WineGlass, Wave } from "./components/Art";
import { vibe, splitBlurb } from "./components/vibes";

export const dynamic = "force-dynamic";

const STEPS = [
  {
    n: "①",
    Art: LeafSprig,
    title: "Pick a neighborhood and a mood",
    body: "Coffee in Astoria, a view in DUMBO, something cheap and a little odd in Bushwick.",
  },
  {
    n: "②",
    Art: CoffeeCup,
    title: "We find you one real place",
    body: "AI suggests a specific spot with a short pitch and an insider tip, and adds it to the list for everyone.",
  },
  {
    n: "③",
    Art: WineGlass,
    title: "Vote, save, and go",
    body: "Say whether it's worth the trip, save the ones you want to try, and get directions in one tap.",
  },
];

export default async function Home() {
  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();

  // Members get a peek at the latest finds (the feed is members-only).
  let latest = [];
  if (user) {
    const { data } = await supabase
      .from("generation_feed")
      .select("id, place_name, neighborhood, category, blurb, score")
      .order("created_at", { ascending: false })
      .limit(3);
    latest = data ?? [];
  }

  return (
    <main>
      <section className="hero">
        <span className="blob blob--a" aria-hidden="true" />
        <span className="blob blob--b" aria-hidden="true" />
        <LeafSprig className="hero-art hero-art--left" />
        <WineGlass className="hero-art hero-art--right" />

        <p className="eyebrow">A little guide to New York</p>
        <h1 className="hero-title">
          Where to go <em>tonight</em>,
          <br /> in New York.
        </h1>
        <p className="hero-sub">
          Tell us the neighborhood and the mood. We&apos;ll find you one real,
          specific place, and the people who&apos;ve been will tell you if
          it&apos;s worth the trip.
        </p>

        <div className="hero-actions">
          {user ? (
            <>
              <Link className="btn btn--primary" href="/vault">
                Discover spots
              </Link>
              <Link className="btn btn--ghost" href="/generate">
                Find me somewhere
              </Link>
            </>
          ) : (
            <Link className="btn btn--primary" href="/login">
              Sign in with Google
            </Link>
          )}
        </div>
        {!user && <p className="hero-note">Free for Columbia &amp; Barnard. Sign in to browse, vote and save.</p>}
      </section>

      <Wave className="divider" />

      <section className="how reveal" aria-labelledby="how-it-works">
        <p className="eyebrow">How it works</p>
        <h2 id="how-it-works" className="section-heading">
          Three steps to <em>somewhere good</em>
        </h2>
        <ol className="how-grid">
          {STEPS.map(({ n, Art, title, body }) => (
            <li key={n} className="how-card reveal">
              <span className="how-n">{n}</span>
              <Art className="how-art" />
              <h3>{title}</h3>
              <p>{body}</p>
            </li>
          ))}
        </ol>
      </section>

      {latest.length > 0 && (
        <section className="latest reveal" aria-labelledby="latest">
          <div className="section-row">
            <h2 id="latest" className="section-heading">
              Fresh <em>finds</em>
            </h2>
            <Link href="/vault" className="text-link">
              See all spots →
            </Link>
          </div>
          <ul className="mini-grid">
            {latest.map((d) => {
              const v = vibe(d.category);
              return (
                <li key={d.id}>
                  <Link href={`/vault#spot-${d.id}`} className="mini-card">
                    <span className="mini-band" style={{ "--from": v.from, "--to": v.to }}>
                      <span aria-hidden="true">{v.icon}</span>
                    </span>
                    <span className="mini-body">
                      <span className="mini-name">{d.place_name}</span>
                      <span className="mini-meta">
                        {d.neighborhood} · {d.category}
                      </span>
                      <span className="mini-hook">{splitBlurb(d.blurb).hook}</span>
                    </span>
                  </Link>
                </li>
              );
            })}
          </ul>
        </section>
      )}
    </main>
  );
}
