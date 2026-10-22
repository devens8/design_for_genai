// Google sign-in on preview / commit-specific URLs.
//
// Supabase only honors OAuth redirects on allow-listed URLs, and that list
// covers the production domain but not every per-commit Vercel URL (or the
// separate admin app). So deployments that aren't production send the OAuth
// round-trip through production's /auth/relay, which immediately bounces the
// `code` back to the deployment that started the login. That deployment then
// exchanges the code itself, using the PKCE verifier cookie it set — the code
// is useless anywhere else.

export const AUTH_HOME = "https://designforgenai.vercel.app";

// Only our own deployments may receive a relayed code.
const ALLOWED_ORIGINS = [
  /^https:\/\/designforgenai(-[a-z0-9-]+)?\.vercel\.app$/,
  /^https:\/\/designforgenai-[a-z0-9]+-deven-seths-projects\.vercel\.app$/,
  /^https:\/\/nyc-vault-admin(-[a-z0-9-]+)?\.vercel\.app$/,
  /^http:\/\/localhost:\d+$/,
];

export function isAllowedRelayTarget(origin) {
  return ALLOWED_ORIGINS.some((re) => re.test(origin));
}

// Where Supabase should send the browser after Google, for a login started on
// `origin` that wants to end up at `next`.
export function oauthRedirectFor(origin, next) {
  const callback = `${origin}/auth/callback?next=${encodeURIComponent(next)}`;
  if (origin === AUTH_HOME || origin.startsWith("http://localhost")) return callback;
  return `${AUTH_HOME}/auth/relay?to=${encodeURIComponent(origin)}&next=${encodeURIComponent(next)}`;
}
