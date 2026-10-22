import Link from "next/link";
import { redirect } from "next/navigation";
import { createClient } from "@/lib/supabase/server";
import { loadFeed } from "@/lib/feed";
import DossierCard from "@/app/components/DossierCard";

export const metadata = {
  title: "The Vault",
  description: "AI-generated NYC spots, rated by the community.",
};

export const dynamic = "force-dynamic";

// Build a /vault URL that keeps the other active filters.
function vaultHref(current, change) {
  const params = new URLSearchParams();
  const next = { ...current, ...change };
  for (const [k, v] of Object.entries(next)) {
    if (v && !(k === "sort" && v === "new")) params.set(k, v);
  }
  const qs = params.toString();
  return qs ? `/vault?${qs}` : "/vault";
}

export default async function VaultPage({ searchParams }) {
  const params = await searchParams;
  const sort = params?.sort === "top" ? "top" : "new";
  const area = params?.area ?? "";
  const cat = params?.cat ?? "";

  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();
  if (!user) redirect("/login?next=/vault");

  const { rows: all, error, voteMap, savedSet } = await loadFeed(supabase, user, { sort });

  // Filter options come from what's actually in the vault, so no dead ends.
  const areas = [...new Set(all.map((d) => d.neighborhood))].sort();
  const cats = [...new Set(all.map((d) => d.category))].sort();
  const rows = all.filter(
    (d) => (!area || d.neighborhood === area) && (!cat || d.category === cat)
  );
  const current = { sort, area, cat };
  const filtering = Boolean(area || cat);

  return (
    <main className="page">
      <header className="page-header">
        <h1>{sort === "top" ? "Top rated" : "The Vault"}</h1>
        <p className="subtitle">
          {sort === "top"
            ? "The spots the community says are most worth the trip."
            : "AI-written picks for places to go in NYC. Vote on whether each one is worth the trip, and save the ones you want to try."}
        </p>
      </header>

      <div className="vault-toolbar">
        <div className="sort-tabs" role="tablist" aria-label="Sort">
          <Link
            href={vaultHref(current, { sort: "new" })}
            className={sort === "new" ? "active" : ""}
            aria-current={sort === "new" ? "page" : undefined}
          >
            Newest
          </Link>
          <Link
            href={vaultHref(current, { sort: "top" })}
            className={sort === "top" ? "active" : ""}
            aria-current={sort === "top" ? "page" : undefined}
          >
            Top rated
          </Link>
        </div>
        <Link className="primary-btn" href="/generate">
          + Find a new spot
        </Link>
      </div>

      {all.length > 0 && (
        <div className="filters">
          <div className="filter-row">
            <span className="filter-label">Area</span>
            <Link
              className={`pick ${!area ? "active" : ""}`}
              href={vaultHref(current, { area: "" })}
            >
              All
            </Link>
            {areas.map((a) => (
              <Link
                key={a}
                className={`pick ${area === a ? "active" : ""}`}
                href={vaultHref(current, { area: a })}
              >
                {a}
              </Link>
            ))}
          </div>
          <div className="filter-row">
            <span className="filter-label">Vibe</span>
            <Link
              className={`pick ${!cat ? "active" : ""}`}
              href={vaultHref(current, { cat: "" })}
            >
              All
            </Link>
            {cats.map((c) => (
              <Link
                key={c}
                className={`pick ${cat === c ? "active" : ""}`}
                href={vaultHref(current, { cat: c })}
              >
                {c}
              </Link>
            ))}
          </div>
        </div>
      )}

      {error && (
        <p className="error">Could not load the vault: {error.message}</p>
      )}

      {!error && all.length === 0 && (
        <div className="empty">
          <p>The vault is empty. Be the first to add a spot.</p>
          <Link className="primary-btn" href="/generate">
            Find a spot →
          </Link>
        </div>
      )}

      {!error && all.length > 0 && rows.length === 0 && (
        <div className="empty">
          <p>No spots match those filters yet.</p>
          <div className="empty-actions">
            <Link className="secondary-btn" href={vaultHref(current, { area: "", cat: "" })}>
              Clear filters
            </Link>
            <Link className="primary-btn" href="/generate">
              Generate one →
            </Link>
          </div>
        </div>
      )}

      {rows.length > 0 && (
        <p className="result-count">
          {rows.length} spot{rows.length === 1 ? "" : "s"}
          {filtering && (
            <>
              {" · "}
              <Link href={vaultHref(current, { area: "", cat: "" })}>clear filters</Link>
            </>
          )}
        </p>
      )}

      <ul className="dossier-list">
        {rows.map((d, i) => (
          <DossierCard
            key={d.id}
            d={d}
            myVote={voteMap.get(d.id) ?? 0}
            saved={savedSet.has(d.id)}
            isMine={d.user_id === user.id}
            rank={sort === "top" ? i + 1 : null}
          />
        ))}
      </ul>
    </main>
  );
}
