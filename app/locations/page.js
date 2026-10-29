import Link from "next/link";
import { redirect } from "next/navigation";
import { createClient } from "@/lib/supabase/server";
import { mapsUrl } from "@/lib/places";
import { CoffeeCup, LeafSprig, WineGlass } from "@/app/components/Art";
import { vibe } from "@/app/components/vibes";

// Always fetch fresh data from Supabase on each request.
export const dynamic = "force-dynamic";

export const metadata = {
  title: "NYC Classics",
  description: "Hand-picked NYC classics.",
};

const ART = [LeafSprig, CoffeeCup, WineGlass];

export default async function LocationsPage() {
  // Members only: gated by middleware, enforced again here as a backstop.
  const server = await createClient();
  const {
    data: { user },
  } = await server.auth.getUser();
  if (!user) redirect("/login?next=/locations");

  const { data: locations, error } = await server
    .from("locations")
    .select("id, name, neighborhood, category, description")
    .order("created_at", { ascending: true });

  return (
    <main className="page">
      <header className="page-hero">
        <LeafSprig className="page-hero-art" />
        <p className="eyebrow">The guidebook</p>
        <h1 className="page-title">
          NYC <em>Classics</em>
        </h1>
        <p className="page-sub">
          {locations?.length ?? 0} can&apos;t-miss New York places, picked by
          hand. For new finds, head to Discover.
        </p>
      </header>

      {error && <p className="form-error">Could not load the classics: {error.message}</p>}
      {!error && locations?.length === 0 && <p className="empty">No classics yet.</p>}

      <ol className="guide">
        {locations?.map((loc, i) => {
          const v = vibe(loc.category);
          const Art = ART[i % ART.length];
          return (
            <li key={loc.id} className={`guide-row reveal ${i % 2 ? "guide-row--flip" : ""}`}>
              <div className="guide-plate" style={{ "--from": v.from, "--to": v.to }}>
                <span className="guide-num">{String(i + 1).padStart(2, "0")}</span>
                <Art className="guide-art" />
              </div>
              <div className="guide-text">
                <h2 className="guide-name">{loc.name}</h2>
                <div className="tags">
                  <span className="tag tag--area">{loc.neighborhood}</span>
                  <span className="tag tag--vibe">
                    <span aria-hidden="true">{v.icon}</span> {loc.category}
                  </span>
                </div>
                <p>{loc.description}</p>
                <a className="dir-link" href={mapsUrl(loc.name, loc.neighborhood)} target="_blank" rel="noopener noreferrer">
                  Directions ↗
                </a>
              </div>
            </li>
          );
        })}
      </ol>

      <div className="center-cta">
        <Link className="btn btn--primary" href="/vault">
          Discover more spots
        </Link>
      </div>
    </main>
  );
}
