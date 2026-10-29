// Presentation helpers for the redesign (no data access). Each vibe gets an
// icon, a one-line description and a two-tone gradient for card headers.

export const VIBES = {
  "Hidden Gem": { icon: "💎", blurb: "the places only regulars know", from: "#2F4A36", to: "#6E8B5A" },
  Eats: { icon: "🍜", blurb: "the plate you'll talk about for a week", from: "#A47148", to: "#C2633F" },
  Coffee: { icon: "☕", blurb: "a good cup and a window seat", from: "#6B4A2E", to: "#A47148" },
  Views: { icon: "🌇", blurb: "skyline, water, golden hour", from: "#6E8B5A", to: "#C9A86A" },
  Nightlife: { icon: "🍸", blurb: "low lights and a late last call", from: "#2B241C", to: "#6B4A2E" },
  Culture: { icon: "🎭", blurb: "galleries, stages and old stories", from: "#6B4A2E", to: "#6E8B5A" },
  Outdoors: { icon: "🌿", blurb: "green space and fresh air", from: "#2F4A36", to: "#8FA876" },
  "Date Night": { icon: "🍷", blurb: "dim lights, good wine, a corner booth", from: "#7A3B2E", to: "#C2633F" },
  "Cheap Thrills": { icon: "🎟️", blurb: "big fun for under $20", from: "#A47148", to: "#6E8B5A" },
};

const FALLBACK = { icon: "📍", blurb: "somewhere worth the trip", from: "#6B4A2E", to: "#6E8B5A" };

export function vibe(name) {
  return VIBES[name] ?? FALLBACK;
}

// Split an AI blurb into a one-line hook, the rest, and (if the last sentence
// reads like advice) an insider tip.
const TIP = /^(insider tip|tip|pro tip|grab|ask|go|get|try|order|skip|come|bring|sit|book|head)\b/i;

export function splitBlurb(text = "") {
  const sentences = text.match(/[^.!?]+[.!?]+["”’)]*\s*|[^.!?]+$/g)?.map((s) => s.trim()).filter(Boolean) ?? [text];
  const hook = sentences[0] ?? "";
  let rest = sentences.slice(1);
  let tip = null;
  const last = rest[rest.length - 1];
  if (last && (TIP.test(last) || /\btip\b/i.test(last))) {
    tip = last.replace(/^(insider tip|pro tip|tip)\s*[:—-]\s*/i, "");
    rest = rest.slice(0, -1);
  }
  return { hook, rest: rest.join(" "), tip };
}
