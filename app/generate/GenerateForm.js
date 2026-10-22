"use client";

import { useActionState, useEffect, useRef, useState } from "react";
import Link from "next/link";
import { createDossier } from "./actions";
import { mapsUrl } from "@/lib/places";

const NEIGHBORHOODS = [
  "Lower East Side",
  "East Village",
  "West Village",
  "SoHo",
  "Chinatown",
  "Harlem",
  "Upper West Side",
  "Williamsburg",
  "Bushwick",
  "DUMBO",
  "Park Slope",
  "Astoria",
];

const CATEGORIES = [
  "Hidden Gem",
  "Eats",
  "Coffee",
  "Views",
  "Nightlife",
  "Culture",
  "Outdoors",
  "Date Night",
  "Cheap Thrills",
];

const OTHER = "__other__";
const initialState = { ok: false, message: "", dossier: null };
const pickRandom = (list) => list[Math.floor(Math.random() * list.length)];

// The free AI tier takes ~15-30s, so show what's happening and how long it's
// been rather than leaving the user staring at a disabled button.
function GenerateProgress({ area }) {
  const [secs, setSecs] = useState(0);
  useEffect(() => {
    const id = setInterval(() => setSecs((s) => s + 1), 1000);
    return () => clearInterval(id);
  }, []);

  const step =
    secs < 6
      ? `Scouting ${area}…`
      : secs < 14
        ? "Narrowing it down to one real place…"
        : secs < 24
          ? "Writing the pitch and an insider tip…"
          : "Almost there. The free AI tier is busy right now…";

  return (
    <div className="gen-progress" role="status" aria-live="polite">
      <div className="gen-progress-bar">
        <span style={{ width: `${Math.min(95, (secs / 30) * 100)}%` }} />
      </div>
      <p className="hint">
        {step} <span className="gen-progress-secs">{secs}s</span>
      </p>
      <p className="hint">This usually takes 15–30 seconds.</p>
    </div>
  );
}

export default function GenerateForm() {
  const [state, formAction, pending] = useActionState(
    createDossier,
    initialState
  );
  const [neighborhood, setNeighborhood] = useState(NEIGHBORHOODS[0]);
  const [customArea, setCustomArea] = useState("");
  const [category, setCategory] = useState(CATEGORIES[0]);
  const formRef = useRef(null);
  const resultRef = useRef(null);

  const area = neighborhood === OTHER ? customArea.trim() : neighborhood;

  // Bring the new spot into view once it's generated (it renders below the form).
  useEffect(() => {
    if (state.ok && state.dossier) {
      resultRef.current?.scrollIntoView({ behavior: "smooth", block: "start" });
    }
  }, [state]);

  function surpriseMe() {
    setNeighborhood(pickRandom(NEIGHBORHOODS));
    setCategory(pickRandom(CATEGORIES));
    // Submit after React applies the new hidden-field values.
    setTimeout(() => formRef.current?.requestSubmit(), 0);
  }

  return (
    <>
      <form ref={formRef} action={formAction} className="gen-form">
        {/* chip pickers drive these hidden fields that actually get submitted */}
        <input type="hidden" name="neighborhood" value={area} />
        <input type="hidden" name="category" value={category} />

        <fieldset className="field" disabled={pending}>
          <legend>1. Neighborhood</legend>
          <div className="chip-row">
            {NEIGHBORHOODS.map((n) => (
              <button
                type="button"
                key={n}
                className={`pick ${neighborhood === n ? "active" : ""}`}
                onClick={() => setNeighborhood(n)}
                aria-pressed={neighborhood === n}
              >
                {n}
              </button>
            ))}
            <button
              type="button"
              className={`pick ${neighborhood === OTHER ? "active" : ""}`}
              onClick={() => setNeighborhood(OTHER)}
              aria-pressed={neighborhood === OTHER}
            >
              Other…
            </button>
          </div>
          {neighborhood === OTHER && (
            <input
              className="text-input"
              type="text"
              value={customArea}
              onChange={(e) => setCustomArea(e.target.value)}
              placeholder="e.g. Greenpoint, Jackson Heights, Red Hook"
              maxLength={40}
              aria-label="Neighborhood name"
              autoFocus
            />
          )}
        </fieldset>

        <fieldset className="field" disabled={pending}>
          <legend>2. Vibe</legend>
          <div className="chip-row">
            {CATEGORIES.map((c) => (
              <button
                type="button"
                key={c}
                className={`pick ${category === c ? "active" : ""}`}
                onClick={() => setCategory(c)}
                aria-pressed={category === c}
              >
                {c}
              </button>
            ))}
          </div>
        </fieldset>

        <label className="field">
          <span>3. Anything else? (optional)</span>
          <textarea
            name="notes"
            rows={2}
            maxLength={200}
            disabled={pending}
            placeholder="e.g. quiet, open late, under $20, good for a rainy day…"
          />
        </label>

        {state.message && !state.ok && (
          <p className="form-error" role="alert">
            {state.message}
          </p>
        )}

        <div className="gen-actions">
          <button
            type="submit"
            className="primary-btn"
            disabled={pending || !area}
          >
            {pending ? "Finding a spot…" : `Find a spot in ${area || "…"}`}
          </button>
          <button
            type="button"
            className="secondary-btn"
            onClick={surpriseMe}
            disabled={pending}
          >
            🎲 Surprise me
          </button>
        </div>
        {pending && <GenerateProgress area={area} />}
      </form>

      {state.ok && state.dossier && (
        <div className="gen-result" ref={resultRef} aria-live="polite">
          <p className="gen-result-label">● Added to the vault</p>
          <div className="dossier-head">
            <h2 className="dossier-name">{state.dossier.place_name}</h2>
            <span className="tag tag--area">{state.dossier.neighborhood}</span>
            <span className="tag tag--cat">{state.dossier.category}</span>
          </div>
          <p className="dossier-blurb">{state.dossier.blurb}</p>
          <div className="dossier-actions">
            <a
              className="card-action card-action--primary"
              href={mapsUrl(state.dossier.place_name, state.dossier.neighborhood)}
              target="_blank"
              rel="noopener noreferrer"
            >
              ↗ Directions
            </a>
            <Link className="card-action" href={`/vault#spot-${state.dossier.id}`}>
              Vote &amp; save it in the vault →
            </Link>
          </div>
          <p className="hint">Not feeling it? Change your picks above and try again.</p>
        </div>
      )}
    </>
  );
}
