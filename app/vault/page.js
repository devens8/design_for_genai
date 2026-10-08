import Link from "next/link";
import { redirect } from "next/navigation";
import { createClient } from "@/lib/supabase/server";
import VoteButtons from "./VoteButtons";

export const metadata = {
  title: "The Vault",
  description: "Declassified NYC location dossiers.",
};

export const dynamic = "force-dynamic";

function authorHandle(d) {
  const name = [d.author_first, d.author_last].filter(Boolean).join(" ").trim();
  return name || "anonymous";
}

export default async function VaultPage({ searchParams }) {
  const params = await searchParams;
  const sort = params?.sort === "top" ? "top" : "new";

  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();
  if (!user) redirect("/login?next=/vault");

  // Feed rows (with vote tallies + author) from the security_invoker view.
  const { data: dossiers, error } = await supabase
    .from("generation_feed")
    .select("*")
    .order(sort === "top" ? "score" : "created_at", { ascending: false });

  // This user's own votes, so the buttons render in the right state.
  const { data: myVotes } = await supabase
    .from("votes")
    .select("generation_id, value")
    .eq("user_id", user.id);

  const voteMap = new Map((myVotes ?? []).map((v) => [v.generation_id, v.value]));
  const rows = dossiers ?? [];

  return (
    <main className="page">
      <header className="page-header">
        <h1>The Vault</h1>
        <p className="subtitle">
          // {rows.length} location dossier{rows.length === 1 ? "" : "s"}{" "}
          declassified
        </p>
      </header>

      <div className="vault-toolbar">
        <div className="sort-tabs">
          <Link href="/vault?sort=new" className={sort === "new" ? "active" : ""}>
            Latest
          </Link>
          <Link href="/vault?sort=top" className={sort === "top" ? "active" : ""}>
            Top rated
          </Link>
        </div>
        <Link className="primary-btn" href="/generate">
          + New dossier
        </Link>
      </div>

      {error && (
        <p className="error">Could not load the vault: {error.message}</p>
      )}

      {!error && rows.length === 0 && (
        <p className="empty">
          The vault is empty. <Link href="/generate">Generate the first dossier →</Link>
        </p>
      )}

      <ul className="dossier-list">
        {rows.map((d, i) => (
          <li key={d.id} className="dossier">
            <VoteButtons
              generationId={d.id}
              score={d.score}
              myVote={voteMap.get(d.id) ?? 0}
            />

            <div>
              {sort === "top" && <span className="dossier-rank">#{i + 1}</span>}
              <div className="dossier-head">
                <span className="dossier-name">{d.place_name}</span>
                <span className="tag tag--area">{d.neighborhood}</span>
                <span className="tag tag--cat">{d.category}</span>
              </div>
              <p className="dossier-blurb">{d.blurb}</p>
              <div className="dossier-foot">
                <span>filed by @{authorHandle(d)}</span>
                <span className="dossier-prompt">
                  ▲ {d.upvotes} · ▼ {d.downvotes}
                </span>
              </div>
            </div>
          </li>
        ))}
      </ul>

      <Link className="back-link center" href="/">
        ← vault door
      </Link>
    </main>
  );
}
