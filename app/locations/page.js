import Link from "next/link";
import { redirect } from "next/navigation";
import { createClient } from "@/lib/supabase/server";

// Always fetch fresh data from Supabase on each request.
export const dynamic = "force-dynamic";

export const metadata = {
  title: "Field Archive",
  description: "Established NYC locations — members only.",
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
        <h1>Field Archive</h1>
        <p className="subtitle">
          // {locations?.length ?? 0} verified NYC locations · public record
        </p>
      </header>

      {error && (
        <p className="error">Could not load the archive: {error.message}</p>
      )}

      {!error && locations?.length === 0 && (
        <p className="empty">The archive is empty.</p>
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
            <p className="dossier-blurb" style={{ marginBottom: 0 }}>
              {loc.description}
            </p>
          </li>
        ))}
      </ul>

      <div className="vault-toolbar" style={{ marginTop: "2.5rem", justifyContent: "center" }}>
        <Link className="primary-btn" href="/vault">
          Enter the vault →
        </Link>
      </div>

      <Link className="back-link center" href="/">
        ← vault door
      </Link>
    </main>
  );
}
