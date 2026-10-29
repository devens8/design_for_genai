import { redirect } from "next/navigation";
import { createClient } from "@/lib/supabase/server";
import GenerateForm from "./GenerateForm";

export const metadata = {
  title: "Find a spot",
  description: "Tell us where and what mood; we'll find you a NYC spot.",
};

export const dynamic = "force-dynamic";

export default async function GeneratePage() {
  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();
  if (!user) redirect("/login?next=/generate");

  return (
    <main className="wizard-page">
      <GenerateForm />
    </main>
  );
}
