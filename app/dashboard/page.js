import Link from "next/link";
import { redirect } from "next/navigation";
import { createClient } from "@/lib/supabase/server";

export const metadata = {
  title: "Dashboard",
  description: "Members-only area.",
};

export const dynamic = "force-dynamic";

export default async function DashboardPage() {
  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();

  // Guarded by middleware too, but keep the server check as a backstop.
  if (!user) redirect("/login?next=/dashboard");

  const { data: profile } = await supabase
    .from("profiles")
    .select("first_name, last_name, avatar_url")
    .eq("id", user.id)
    .single();

  const name = profile?.first_name
    ? `${profile.first_name} ${profile.last_name ?? ""}`.trim()
    : user.email;

  return (
    <main className="page dashboard-page">
      <header className="page-header">
        <h1>Dashboard</h1>
        <p className="subtitle">This page is only visible when you’re signed in.</p>
      </header>

      <section className="dash-card">
        <div className="dash-top">
          {profile?.avatar_url ? (
            // eslint-disable-next-line @next/next/no-img-element
            <img className="dash-avatar" src={profile.avatar_url} alt="You" />
          ) : (
            <div className="dash-avatar dash-avatar--empty">
              {(profile?.first_name?.[0] ?? user.email?.[0] ?? "?").toUpperCase()}
            </div>
          )}
          <div>
            <h2 className="dash-hello">Welcome back, {name} 👋</h2>
            <p className="dash-email">{user.email}</p>
          </div>
        </div>

        <div className="dash-actions">
          <Link className="primary-btn" href="/profile">
            Edit profile
          </Link>
          <Link className="secondary-btn" href="/books">
            Reading list
          </Link>
          <form action="/auth/signout" method="post">
            <button type="submit" className="secondary-btn">
              Sign out
            </button>
          </form>
        </div>
      </section>

      <Link className="back-link center" href="/">
        ← back home
      </Link>
    </main>
  );
}
