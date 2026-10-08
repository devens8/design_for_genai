"use client";

import { useActionState, useState } from "react";
import Link from "next/link";
import { createDossier } from "./actions";

const NEIGHBORHOODS = [
  "Lower East Side",
  "Williamsburg",
  "Harlem",
  "Astoria",
  "West Village",
  "Chinatown",
  "Bushwick",
  "Upper West Side",
];

const CATEGORIES = [
  "Hidden Gem",
  "Eats",
  "Views",
  "Nightlife",
  "Coffee",
  "Culture",
  "Outdoors",
  "Cheap Thrills",
];

const initialState = { ok: false, message: "", dossier: null };

export default function GenerateForm() {
  const [state, formAction, pending] = useActionState(
    createDossier,
    initialState
  );
  const [neighborhood, setNeighborhood] = useState(NEIGHBORHOODS[0]);
  const [category, setCategory] = useState(CATEGORIES[0]);

  return (
    <>
      <form action={formAction} className="gen-form">
        {/* chip pickers drive these hidden fields that actually get submitted */}
        <input type="hidden" name="neighborhood" value={neighborhood} />
        <input type="hidden" name="category" value={category} />

        <div className="field">
          <span>Neighborhood</span>
          <div className="chip-row">
            {NEIGHBORHOODS.map((n) => (
              <button
                type="button"
                key={n}
                className={`pick ${neighborhood === n ? "active" : ""}`}
                onClick={() => setNeighborhood(n)}
              >
                {n}
              </button>
            ))}
          </div>
        </div>

        <div className="field">
          <span>Category</span>
          <div className="chip-row">
            {CATEGORIES.map((c) => (
              <button
                type="button"
                key={c}
                className={`pick ${category === c ? "active" : ""}`}
                onClick={() => setCategory(c)}
              >
                {c}
              </button>
            ))}
          </div>
        </div>

        <label className="field">
          <span>Extra intel (optional)</span>
          <textarea
            name="notes"
            rows={3}
            placeholder="e.g. somewhere quiet, open late, good for a rainy day…"
          />
        </label>

        {state.message && !state.ok && (
          <p className="form-error">{state.message}</p>
        )}

        <button type="submit" className="primary-btn" disabled={pending}>
          {pending ? "Declassifying…" : "Declassify a location"}
        </button>
      </form>

      {state.ok && state.dossier && (
        <div className="gen-result">
          <p className="gen-result-label">● New intel filed</p>
          <div className="dossier-head">
            <span className="dossier-name">{state.dossier.place_name}</span>
            <span className="tag tag--area">{state.dossier.neighborhood}</span>
            <span className="tag tag--cat">{state.dossier.category}</span>
          </div>
          <p className="dossier-blurb">{state.dossier.blurb}</p>
          <Link className="secondary-btn" href="/vault">
            View it in the vault →
          </Link>
        </div>
      )}
    </>
  );
}
