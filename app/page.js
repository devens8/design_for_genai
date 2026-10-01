import Link from "next/link";
import { createClient } from "@/lib/supabase/server";

export const dynamic = "force-dynamic";

export default async function Home() {
  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();

  return (
    <main className="hero">
      <h1>Hello World</h1>

      <nav className="hero-nav">
        <Link className="hero-link" href="/books">
          Reading list →
        </Link>
        {user ? (
          <Link className="hero-link" href="/dashboard">
            My dashboard →
          </Link>
        ) : (
          <Link className="hero-link" href="/login">
            Sign in →
          </Link>
        )}
      </nav>
    </main>
  );
}
