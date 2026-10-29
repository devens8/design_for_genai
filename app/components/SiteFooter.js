import { createClient } from "@/lib/supabase/server";
import { LeafMark } from "./Art";
import ReportBug from "./ReportBug";

// Footer on every page. Members get the bug-report button.
export default async function SiteFooter() {
  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();

  return (
    <footer className="site-footer">
      <span className="footer-brand">
        <LeafMark /> <em>Little</em> Spots NYC
      </span>
      {user && <ReportBug />}
    </footer>
  );
}
