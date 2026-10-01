import { NextResponse } from "next/server";
import { createClient } from "@/lib/supabase/server";

// OAuth redirect target. Google sends the user back here with a `code` that we
// exchange for a session. Set this exact path (/auth/callback) as the redirect
// URL in both Supabase Auth and the Google OAuth client.
export async function GET(request) {
  const { searchParams, origin } = new URL(request.url);
  const code = searchParams.get("code");
  const next = searchParams.get("next") ?? "/dashboard";

  if (code) {
    const supabase = await createClient();
    const { error } = await supabase.auth.exchangeCodeForSession(code);

    if (!error) {
      // If this user hasn't filled in their name yet, send them to the profile
      // page to complete it; otherwise go to their intended destination.
      let dest = next;
      const {
        data: { user },
      } = await supabase.auth.getUser();

      if (user) {
        const { data: profile } = await supabase
          .from("profiles")
          .select("first_name, last_name")
          .eq("id", user.id)
          .single();

        if (!profile?.first_name || !profile?.last_name) {
          dest = "/profile?welcome=1";
        }
      }

      // Respect the proxy host when deployed behind Vercel's load balancer.
      const forwardedHost = request.headers.get("x-forwarded-host");
      const isLocalEnv = process.env.NODE_ENV === "development";

      if (isLocalEnv) {
        return NextResponse.redirect(`${origin}${dest}`);
      } else if (forwardedHost) {
        return NextResponse.redirect(`https://${forwardedHost}${dest}`);
      }
      return NextResponse.redirect(`${origin}${dest}`);
    }
  }

  return NextResponse.redirect(`${origin}/login?error=auth`);
}
