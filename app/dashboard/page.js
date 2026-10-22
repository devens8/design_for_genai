import Link from "next/link";
import { redirect } from "next/navigation";
import { createClient } from "@/lib/supabase/server";
import { loadFeed } from "@/lib/feed";
import DossierCard from "@/app/components/DossierCard";

export const metadata = {
  title: "My activity",
  description: "Your spots, votes and saved list.",
};

export const dynamic = "force-dynamic";

export default async function DashboardPage() {
  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();

  // Guarded by middleware too, but keep the server check as a backstop.
  if (!user) redirect("/login?next=/dashboard");

  const [{ data: profile }, feed] = await Promise.all([
    supabase
      .from("profiles")
      .select("first_name, last_name, avatar_url")
      .eq("id", user.id)
      .single(),
    loadFeed(supabase, user, { mine: true }),
  ]);

  const { rows: mine, voteMap, savedSet } = feed;
  const name = profile?.first_name
    ? `${profile.first_name} ${profile.last_name ?? ""}`.trim()
    : user.email;
  const pointsEarned = mine.reduce((sum, d) => sum + d.score, 0);

  const stats = [
    { label: "Spots added", value: mine.length, href: "#my-spots" },
    { label: "Votes cast", value: voteMap.size, href: "/vault" },
    { label: "Saved", value: savedSet.size, href: "/saved" },
    { label: "Score on your spots", value: pointsEarned, href: "#my-spots" },
  ];

  return (
    <main className="page dashboard-page">
      <section className="dash-card">
        <div className="dash-top">
          {profile?.avatar_url ? (
            // eslint-disable-next-line @next/next/no-img-element
            <img className="dash-avatar" src={profile.avatar_url} alt="" />
          ) : (
            <div className="dash-avatar dash-avatar--empty">
              {(profile?.first_name?.[0] ?? user.email?.[0] ?? "?").toUpperCase()}
            </div>
          )}
          <div>
            <h1 className="dash-hello">Hi, {name}</h1>
            <p className="dash-email">{user.email}</p>
          </div>
        </div>

        <div className="stat-grid">
          {stats.map((s) => (
            <Link key={s.label} className="stat" href={s.href}>
              <span className="stat-value">{s.value}</span>
              <span className="stat-label">{s.label}</span>
            </Link>
          ))}
        </div>

        <div className="dash-actions">
          <Link className="primary-btn" href="/generate">
            Find a new spot
          </Link>
          <Link className="secondary-btn" href="/profile">
            Edit profile
          </Link>
          <form action="/auth/signout" method="post">
            <button type="submit" className="secondary-btn">
              Sign out
            </button>
          </form>
        </div>
      </section>

      <h2 className="section-title" id="my-spots">
        Spots you added
      </h2>
      {mine.length === 0 ? (
        <div className="empty">
          <p>You haven&apos;t added any spots yet.</p>
          <Link className="primary-btn" href="/generate">
            Generate your first →
          </Link>
        </div>
      ) : (
        <ul className="dossier-list">
          {mine.map((d) => (
            <DossierCard
              key={d.id}
              d={d}
              myVote={voteMap.get(d.id) ?? 0}
              saved={savedSet.has(d.id)}
              isMine
            />
          ))}
        </ul>
      )}
    </main>
  );
}
