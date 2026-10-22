import { NextResponse } from "next/server";
import { AUTH_HOME, isAllowedRelayTarget } from "@/lib/authRelay";

// Bounces an OAuth `code` back to the deployment that started the login (see
// lib/authRelay.js). Never exchanges the code here.
export async function GET(request) {
  const { searchParams } = new URL(request.url);
  const to = searchParams.get("to") ?? "";

  if (!isAllowedRelayTarget(to)) {
    return NextResponse.redirect(`${AUTH_HOME}/login?error=auth`);
  }

  // Forward everything Supabase sent (code, or error + error_description).
  const forward = new URLSearchParams(searchParams);
  forward.delete("to");
  return NextResponse.redirect(`${to}/auth/callback?${forward.toString()}`);
}
