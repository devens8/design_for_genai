import { redirect } from "next/navigation";
import { createClient } from "@/lib/supabase/server";
import GenerateForm from "./GenerateForm";

export const metadata = {
  title: "Find a new spot",
  description: "Ask the AI for a NYC spot.",
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
        <h1>Find a new spot</h1>
        <p className="subtitle">
          Pick a neighborhood and a vibe. The AI suggests one real place and
          adds it to the vault so others can vote on it.
        </p>
      </header>

      <GenerateForm />
    </main>
  );
}
