import Link from "next/link";
import { redirect } from "next/navigation";
import { createClient } from "@/lib/supabase/server";
import ProfileForm from "./ProfileForm";

export const metadata = {
  title: "Profile",
  description: "Manage your profile.",
};

export const dynamic = "force-dynamic";

export default async function ProfilePage({ searchParams }) {
  const params = await searchParams;
  const welcome = params?.welcome === "1";

  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();

  // Middleware already guards this route, but be defensive.
  if (!user) redirect("/login?next=/profile");

  const { data: profile } = await supabase
    .from("profiles")
    .select("first_name, last_name, bio, avatar_url, email")
    .eq("id", user.id)
    .single();

  const needsName = !profile?.first_name || !profile?.last_name;

  return (
    <main className="page profile-page">
      <header className="page-hero">
        <p className="eyebrow">Your profile</p>
        <h1 className="page-title">
          About <em>you</em>
        </h1>
        <p className="page-sub">{profile?.email ?? user.email}</p>
        <nav className="page-nav">
          <Link className="back-link" href="/dashboard">
            ← My activity
          </Link>
        </nav>
      </header>

      {(welcome || needsName) && (
        <p className="welcome-banner">
          👋 Welcome! Add your name so people know who found each spot. Then
          you&apos;re ready to explore.
        </p>
      )}

      <ProfileForm profile={profile} />
    </main>
  );
}
