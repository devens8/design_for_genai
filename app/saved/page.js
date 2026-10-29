import Link from "next/link";
import { redirect } from "next/navigation";
import { createClient } from "@/lib/supabase/server";
import { loadFeed, loadSavedIds } from "@/lib/feed";
import DossierCard from "@/app/components/DossierCard";
import { LeafSprig } from "@/app/components/Art";

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
      <header className="page-hero">
        <LeafSprig className="page-hero-art" />
        <p className="eyebrow">Saved</p>
        <h1 className="page-title">
          Your <em>list</em>
        </h1>
        <p className="page-sub">
          Places you want to try. Tap the heart on any spot to add it here.
        </p>
      </header>

      {error && <p className="form-error">Could not load your list: {error.message}</p>}

      {!error && rows.length === 0 && (
        <div className="empty reveal">
          <LeafSprig className="empty-art" />
          <h2>Nothing saved yet</h2>
          <p>Find a few places that sound good and tap the heart.</p>
          <Link className="btn btn--primary" href="/vault">
            Discover spots
          </Link>
        </div>
      )}

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
    </main>
  );
}
