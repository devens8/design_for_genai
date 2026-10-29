import Link from "next/link";
import { redirect } from "next/navigation";
import { createClient } from "@/lib/supabase/server";
import { loadFeed } from "@/lib/feed";
import DossierCard from "@/app/components/DossierCard";
import { Laurel, LeafSprig } from "@/app/components/Art";
import { vibe } from "@/app/components/vibes";
import TopRated from "./TopRated";

export const metadata = {
  title: "Discover",
  description: "AI-found NYC spots, rated by the community.",
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

  // Filter options come from what's actually in the list, so no dead ends.
  const areas = [...new Set(all.map((d) => d.neighborhood))].sort();
  const cats = [...new Set(all.map((d) => d.category))].sort();
  const rows = all.filter(
    (d) => (!area || d.neighborhood === area) && (!cat || d.category === cat)
  );
  const current = { sort, area, cat };
  const top = sort === "top";

  return (
    <main className={`page ${top ? "page--top" : ""}`}>
      <header className={`page-hero ${top ? "page-hero--center" : ""}`}>
        {top ? <Laurel className="laurel" /> : <LeafSprig className="page-hero-art" />}
        <p className="eyebrow">{top ? "Voted by members" : "Discover"}</p>
        <h1 className="page-title">
          {top ? (
            <>
              The city&apos;s <em>favorites</em>
            </>
          ) : (
            <>
              Spots worth <em>the trip</em>
            </>
          )}
        </h1>
        <p className="page-sub">
          {top
            ? "The places members say are most worth going to, ranked."
            : "AI-found places around the city. Vote on each one, save the ones you want to try."}
        </p>
      </header>

      <div className="toolbar">
        <div className="segmented" aria-label="Sort">
          <Link href={vaultHref(current, { sort: "new" })} className={!top ? "active" : ""} aria-current={!top ? "page" : undefined}>
            Newest
          </Link>
          <Link href={vaultHref(current, { sort: "top" })} className={top ? "active" : ""} aria-current={top ? "page" : undefined}>
            Top rated
          </Link>
        </div>
        <Link className="btn btn--primary btn--sm" href="/generate">
          + Find a spot
        </Link>
      </div>

      {all.length > 0 && (
        <div className={`filter-bar ${top ? "filter-bar--compact" : ""}`}>
          <div className="filter-group">
            <span className="filter-label">Area</span>
            <div className="chip-scroll">
              <Link className={`chip ${!area ? "active" : ""}`} href={vaultHref(current, { area: "" })}>
                All
              </Link>
              {areas.map((a) => (
                <Link key={a} className={`chip ${area === a ? "active" : ""}`} href={vaultHref(current, { area: a })}>
                  {a}
                </Link>
              ))}
            </div>
          </div>
          <div className="filter-group">
            <span className="filter-label">Vibe</span>
            <div className="chip-scroll">
              <Link className={`chip ${!cat ? "active" : ""}`} href={vaultHref(current, { cat: "" })}>
                All
              </Link>
              {cats.map((c) => (
                <Link key={c} className={`chip ${cat === c ? "active" : ""}`} href={vaultHref(current, { cat: c })}>
                  <span aria-hidden="true">{vibe(c).icon}</span> {c}
                </Link>
              ))}
            </div>
          </div>
        </div>
      )}

      {(area || cat) && (
        <div className="active-filters">
          <span>
            {rows.length} spot{rows.length === 1 ? "" : "s"} ·
          </span>
          {area && (
            <Link className="pill-x" href={vaultHref(current, { area: "" })} aria-label={`Remove area filter ${area}`}>
              {area} <span aria-hidden="true">×</span>
            </Link>
          )}
          {cat && (
            <Link className="pill-x" href={vaultHref(current, { cat: "" })} aria-label={`Remove vibe filter ${cat}`}>
              {cat} <span aria-hidden="true">×</span>
            </Link>
          )}
          <Link className="text-link" href={vaultHref(current, { area: "", cat: "" })}>
            Clear all
          </Link>
        </div>
      )}

      {error && <p className="form-error">Could not load spots: {error.message}</p>}

      {!error && all.length === 0 && (
        <div className="empty reveal">
          <LeafSprig className="empty-art" />
          <h2>Nothing here yet</h2>
          <p>Be the first to find a spot.</p>
          <Link className="btn btn--primary" href="/generate">
            Find a spot
          </Link>
        </div>
      )}

      {!error && all.length > 0 && rows.length === 0 && (
        <div className="empty reveal">
          <LeafSprig className="empty-art" />
          <h2>No spots match yet</h2>
          <p>Try another area or vibe, or ask for one.</p>
          <div className="empty-actions">
            <Link className="btn btn--ghost" href={vaultHref(current, { area: "", cat: "" })}>
              Clear filters
            </Link>
            <Link className="btn btn--primary" href="/generate">
              Find one
            </Link>
          </div>
        </div>
      )}

      {rows.length > 0 &&
        (top ? (
          <TopRated rows={rows} voteMap={voteMap} savedSet={savedSet} />
        ) : (
          <ul className="spot-grid">
            {rows.map((d) => (
              <DossierCard
                key={d.id}
                d={d}
                myVote={voteMap.get(d.id) ?? 0}
                saved={savedSet.has(d.id)}
                isMine={d.user_id === user.id}
              />
            ))}
          </ul>
        ))}
    </main>
  );
}
