import Link from "next/link";
import { redirect } from "next/navigation";
import { createClient } from "@/lib/supabase/server";
import GenerateForm from "./GenerateForm";

export const metadata = {
  title: "Generate a Dossier",
  description: "Declassify a new NYC location with AI.",
};

export const dynamic = "force-dynamic";

export default async function GeneratePage() {
  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();
  if (!user) redirect("/login?next=/generate");

  return (
    <main className="page">
      <header className="page-header">
        <h1>Generate a Dossier</h1>
        <p className="subtitle">
          // feed the vault a neighborhood and let the AI surface a spot
        </p>
      </header>

      <GenerateForm />

      <Link className="back-link center" href="/vault">
        ← back to the vault
      </Link>
    </main>
  );
}
