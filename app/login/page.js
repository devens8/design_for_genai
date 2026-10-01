"use client";

import { Suspense, useState } from "react";
import Link from "next/link";
import { useSearchParams } from "next/navigation";
import { createClient } from "@/lib/supabase/client";

function LoginInner() {
  const [loading, setLoading] = useState(false);
  const searchParams = useSearchParams();
  const next = searchParams.get("next") ?? "/dashboard";
  const authError = searchParams.get("error");

  async function signInWithGoogle() {
    setLoading(true);
    const supabase = createClient();
    const redirectTo = `${window.location.origin}/auth/callback?next=${encodeURIComponent(
      next
    )}`;
    const { error } = await supabase.auth.signInWithOAuth({
      provider: "google",
      options: { redirectTo },
    });
    if (error) {
      setLoading(false);
      alert(`Sign-in failed: ${error.message}`);
    }
    // On success the browser is redirected to Google, so no further UI needed.
  }

  return (
    <main className="auth">
      <div className="auth-card">
        <h1>Welcome</h1>
        <p className="auth-sub">Sign in to continue</p>

        {authError && (
          <p className="auth-error">
            Something went wrong signing you in. Please try again.
          </p>
        )}

        <button
          className="google-btn"
          onClick={signInWithGoogle}
          disabled={loading}
        >
          <svg width="18" height="18" viewBox="0 0 48 48" aria-hidden="true">
            <path
              fill="#EA4335"
              d="M24 9.5c3.54 0 6.71 1.22 9.21 3.6l6.85-6.85C35.9 2.38 30.47 0 24 0 14.62 0 6.51 5.38 2.56 13.22l7.98 6.19C12.43 13.72 17.74 9.5 24 9.5z"
            />
            <path
              fill="#4285F4"
              d="M46.98 24.55c0-1.57-.15-3.09-.38-4.55H24v9.02h12.94c-.58 2.96-2.26 5.48-4.78 7.18l7.73 6c4.51-4.18 7.09-10.36 7.09-17.65z"
            />
            <path
              fill="#FBBC05"
              d="M10.53 28.59c-.48-1.45-.76-2.99-.76-4.59s.27-3.14.76-4.59l-7.98-6.19C.92 16.46 0 20.12 0 24c0 3.88.92 7.54 2.56 10.78l7.97-6.19z"
            />
            <path
              fill="#34A853"
              d="M24 48c6.48 0 11.93-2.13 15.89-5.81l-7.73-6c-2.15 1.45-4.92 2.3-8.16 2.3-6.26 0-11.57-4.22-13.47-9.91l-7.98 6.19C6.51 42.62 14.62 48 24 48z"
            />
          </svg>
          {loading ? "Redirecting…" : "Continue with Google"}
        </button>

        <Link className="auth-back" href="/">
          ← back home
        </Link>
      </div>
    </main>
  );
}

export default function LoginPage() {
  return (
    <Suspense fallback={<main className="auth" />}>
      <LoginInner />
    </Suspense>
  );
}
