// Small display helpers shared by the vault feed, saved list and dashboard.

// Google Maps search link for a dossier — lets users go straight from "this
// sounds good" to directions.
export function mapsUrl(placeName, neighborhood) {
  const q = `${placeName}, ${neighborhood}, New York, NY`;
  return `https://www.google.com/maps/search/?api=1&query=${encodeURIComponent(q)}`;
}

// "3h ago" style relative time for feed timestamps.
export function timeAgo(iso) {
  const secs = Math.max(0, (Date.now() - new Date(iso).getTime()) / 1000);
  const steps = [
    [60, "s"],
    [60, "m"],
    [24, "h"],
    [7, "d"],
    [4.35, "w"],
    [12, "mo"],
  ];
  let n = secs;
  for (const [size, unit] of steps) {
    if (n < size) return unit === "s" ? "just now" : `${Math.floor(n)}${unit} ago`;
    n /= size;
  }
  return `${Math.floor(n)}y ago`;
}

export function authorName(d) {
  const name = [d.author_first, d.author_last].filter(Boolean).join(" ").trim();
  return name || "anonymous";
}
