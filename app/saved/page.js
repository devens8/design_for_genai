import Link from "next/link";
import { redirect } from "next/navigation";
import { createClient } from "@/lib/supabase/server";
import { loadFeed, loadSavedIds } from "@/lib/feed";
import DossierCard from "@/app/components/DossierCard";

export const metadata = {
  title: "Saved",
  description: "Your want-to-go list.",
};

export const dynamic = "force-dynamic";

export default async function SavedPage() {
  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();
  if (!user) redirect("/login?next=/saved");

  const ids = await loadSavedIds(supabase, user);
  const { rows: unordered, error, voteMap, savedSet } = await loadFeed(supabase, user, { ids });

  // Most recently saved first.
  const order = new Map(ids.map((id, i) => [id, i]));
  const rows = [...unordered].sort((a, b) => order.get(a.id) - order.get(b.id));

  return (
    <main className="page">
      <header className="page-header">
        <h1>Saved</h1>
        <p className="subtitle">
          Your want-to-go list. Tap ★ on any spot in the vault to add it here.
        </p>
      </header>

      {error && <p className="error">Could not load your list: {error.message}</p>}

      {!error && rows.length === 0 && (
        <div className="empty">
          <p>Nothing saved yet.</p>
          <Link className="primary-btn" href="/vault">
            Browse the vault →
          </Link>
        </div>
      )}

      <ul className="dossier-list">
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
    </main>
  );
}
