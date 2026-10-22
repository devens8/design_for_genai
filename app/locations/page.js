import Link from "next/link";
import { redirect } from "next/navigation";
import { createClient } from "@/lib/supabase/server";
import { mapsUrl } from "@/lib/places";

// Always fetch fresh data from Supabase on each request.
export const dynamic = "force-dynamic";

export const metadata = {
  title: "NYC Classics",
  description: "Hand-picked NYC classics.",
};

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
      <header className="page-header">
        <h1>NYC Classics</h1>
        <p className="subtitle">
          {locations?.length ?? 0} hand-picked, can&apos;t-miss New York spots.
          For AI-found hidden gems, head to the vault.
        </p>
      </header>

      {error && (
        <p className="error">Could not load the classics: {error.message}</p>
      )}

      {!error && locations?.length === 0 && (
        <p className="empty">No classics yet.</p>
      )}

      <ul className="card-grid">
        {locations?.map((loc) => (
          <li key={loc.id} className="card">
            <div className="dossier-head">
              <span className="card-title">{loc.name}</span>
            </div>
            <div className="dossier-head" style={{ marginBottom: "0.75rem" }}>
              <span className="tag tag--area">{loc.neighborhood}</span>
              <span className="tag tag--cat">{loc.category}</span>
            </div>
            <p className="dossier-blurb">{loc.description}</p>
            <a
              className="card-action card-action--primary"
              href={mapsUrl(loc.name, loc.neighborhood)}
              target="_blank"
              rel="noopener noreferrer"
            >
              ↗ Directions
            </a>
          </li>
        ))}
      </ul>

      <div className="vault-toolbar" style={{ marginTop: "2.5rem", justifyContent: "center" }}>
        <Link className="primary-btn" href="/vault">
          Browse the vault →
        </Link>
      </div>
    </main>
  );
}
