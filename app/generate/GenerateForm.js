"use client";

import { useActionState, useEffect, useRef, useState } from "react";
import Link from "next/link";
import { createDossier } from "./actions";
import { mapsUrl } from "@/lib/places";
import { Blurb, SaveButton } from "@/app/vault/CardActions";
import { CoffeeCup } from "@/app/components/Art";
import { VIBES, vibe } from "@/app/components/vibes";

const BOROUGHS = [
  {
    name: "Manhattan",
    areas: [
      ["Lower East Side", "dive bars, dumplings & old tenements"],
      ["East Village", "punk history & late-night noodles"],
      ["West Village", "cobblestones & candlelit bistros"],
      ["SoHo", "cast-iron lofts & gallery hopping"],
      ["Chinatown", "dim sum, bakeries & busy sidewalks"],
      ["Harlem", "soul food, jazz & brownstones"],
      ["Upper West Side", "park walks & classic delis"],
    ],
  },
  {
    name: "Brooklyn",
    areas: [
      ["Williamsburg", "rooftops, vintage & waterfront"],
      ["Bushwick", "murals, warehouses & odd little bars"],
      ["DUMBO", "bridge views & cobbled streets"],
      ["Park Slope", "stoops, brunch & Prospect Park"],
    ],
  },
  {
    name: "Queens",
    areas: [["Astoria", "Greek tavernas & beer gardens"]],
  },
];

const NEIGHBORHOODS = BOROUGHS.flatMap((b) => b.areas.map(([n]) => n));
const CATEGORIES = Object.keys(VIBES);
const SUGGESTIONS = [
  "open late",
  "under $20",
  "quiet",
  "outdoor seating",
  "good for groups",
  "rainy day",
  "first date",
  "vegetarian-friendly",
];
const STEPS = ["Where", "What vibe", "Anything else", "Your spot"];

const OTHER = "__other__";
const initialState = { ok: false, message: "", dossier: null };
const pickRandom = (list) => list[Math.floor(Math.random() * list.length)];

// The free AI tier takes ~15-30s, so show what's happening and how long it's
// been instead of a frozen screen.
function GenerateProgress({ area }) {
  const [secs, setSecs] = useState(0);
  useEffect(() => {
    const id = setInterval(() => setSecs((s) => s + 1), 1000);
    return () => clearInterval(id);
  }, []);

  const step =
    secs < 6
      ? `Wandering around ${area}…`
      : secs < 14
        ? "Narrowing it down to one real place…"
        : secs < 24
          ? "Writing it up, plus an insider tip…"
          : "Almost there. The free AI is a little busy…";

  return (
    <div className="brewing" role="status" aria-live="polite">
      <div className="cup" aria-hidden="true">
        <CoffeeCup className="cup-art" />
        <span className="cup-fill" style={{ "--fill": `${Math.min(92, (secs / 28) * 100)}%` }} />
      </div>
      <p className="brewing-title">{step}</p>
      <p className="brewing-sub">
        This usually takes 15–30 seconds · <span className="tabular">{secs}s</span>
      </p>
    </div>
  );
}

function Progress({ step }) {
  return (
    <ol className="wiz-progress" aria-label="Progress">
      {STEPS.map((label, i) => (
        <li key={label} className={i < step ? "done" : i === step ? "current" : ""} aria-current={i === step ? "step" : undefined}>
          <span className="wiz-leaf" aria-hidden="true">
            <svg viewBox="0 0 24 24">
              <path d="M5 19 C5 10 11 5 20 4 C20 13 14 19 5 19Z" />
            </svg>
          </span>
          <span className="wiz-label">{label}</span>
        </li>
      ))}
    </ol>
  );
}

export default function GenerateForm() {
  const [state, formAction, pending] = useActionState(createDossier, initialState);
  const [step, setStep] = useState(0);
  const [neighborhood, setNeighborhood] = useState("");
  const [customArea, setCustomArea] = useState("");
  const [category, setCategory] = useState("");
  const [notes, setNotes] = useState("");
  const [shuffling, setShuffling] = useState(false);
  const formRef = useRef(null);

  const area = neighborhood === OTHER ? customArea.trim() : neighborhood;
  const canNext = step === 0 ? Boolean(area) : step === 1 ? Boolean(category) : true;

  function submit() {
    setStep(3);
    // Submit after React applies the hidden-field values.
    setTimeout(() => formRef.current?.requestSubmit(), 0);
  }

  function next() {
    if (!canNext) return;
    if (step === 2) submit();
    else setStep(step + 1);
  }

  // Enter = next (except inside the notes box, where it's a newline).
  function onKeyDown(e) {
    if (e.key !== "Enter" || e.target.tagName === "TEXTAREA" || step > 2) return;
    e.preventDefault();
    next();
  }

  // Shuffle through the cards for a moment, then land and go.
  function surpriseMe() {
    if (shuffling) return;
    setShuffling(true);
    const reduce = window.matchMedia("(prefers-reduced-motion: reduce)").matches;
    let ticks = reduce ? 1 : 9;
    const id = setInterval(() => {
      setNeighborhood(pickRandom(NEIGHBORHOODS));
      setCategory(pickRandom(CATEGORIES));
      if (--ticks <= 0) {
        clearInterval(id);
        setShuffling(false);
        submit();
      }
    }, 110);
  }

  function addSuggestion(s) {
    setNotes((n) => {
      if (n.toLowerCase().includes(s)) return n;
      const joined = n.trim() ? `${n.trim().replace(/[,.]$/, "")}, ${s}` : s;
      return joined.slice(0, 200);
    });
  }

  function startOver() {
    setStep(0);
    setNeighborhood("");
    setCustomArea("");
    setCategory("");
    setNotes("");
  }

  const done = step === 3 && !pending;

  return (
    <form ref={formRef} action={formAction} className="wizard" onKeyDown={onKeyDown}>
      {/* the cards drive these hidden fields that actually get submitted */}
      <input type="hidden" name="neighborhood" value={area} />
      <input type="hidden" name="category" value={category} />
      <input type="hidden" name="notes" value={notes} />

      <Progress step={step} />

      <div className="wiz-stage" key={step}>
        {step === 0 && (
          <section className="wiz-step" aria-labelledby="q-where">
            <h1 id="q-where" className="wiz-q">
              Where in the <em>city</em>?
            </h1>
            {BOROUGHS.map((b) => (
              <div key={b.name} className="borough">
                <h2 className="borough-name">{b.name}</h2>
                <div className="pick-grid">
                  {b.areas.map(([n, d]) => (
                    <button
                      type="button"
                      key={n}
                      className={`pick-card ${neighborhood === n ? "selected" : ""}`}
                      onClick={() => setNeighborhood(n)}
                      aria-pressed={neighborhood === n}
                    >
                      <strong>{n}</strong>
                      <span>{d}</span>
                    </button>
                  ))}
                </div>
              </div>
            ))}
            <div className="borough">
              <h2 className="borough-name">Somewhere else</h2>
              <div className="pick-grid">
                <div className={`pick-card pick-card--other ${neighborhood === OTHER ? "selected" : ""}`}>
                  <button type="button" onClick={() => setNeighborhood(OTHER)} aria-pressed={neighborhood === OTHER}>
                    <strong>Other…</strong>
                    <span>Greenpoint, Red Hook, Flushing…</span>
                  </button>
                  {neighborhood === OTHER && (
                    <input
                      className="text-input"
                      type="text"
                      value={customArea}
                      onChange={(e) => setCustomArea(e.target.value)}
                      placeholder="Type a neighborhood"
                      maxLength={40}
                      aria-label="Neighborhood name"
                      autoFocus
                    />
                  )}
                </div>
              </div>
            </div>
          </section>
        )}

        {step === 1 && (
          <section className="wiz-step" aria-labelledby="q-vibe">
            <h1 id="q-vibe" className="wiz-q">
              What&apos;s the <em>vibe</em>?
            </h1>
            <div className="pick-grid pick-grid--vibes">
              {CATEGORIES.map((c) => {
                const v = vibe(c);
                return (
                  <button
                    type="button"
                    key={c}
                    className={`pick-card vibe-card ${category === c ? "selected" : ""}`}
                    onClick={() => setCategory(c)}
                    aria-pressed={category === c}
                    style={{ "--from": v.from, "--to": v.to }}
                  >
                    <span className="vibe-icon" aria-hidden="true">
                      {v.icon}
                    </span>
                    <strong>{c}</strong>
                    <span>{v.blurb}</span>
                  </button>
                );
              })}
            </div>
          </section>
        )}

        {step === 2 && (
          <section className="wiz-step wiz-step--narrow" aria-labelledby="q-else">
            <h1 id="q-else" className="wiz-q">
              Anything <em>else</em>?
            </h1>
            <p className="wiz-hint">Optional. Tap a few, or write your own.</p>
            <div className="suggest">
              {SUGGESTIONS.map((s) => (
                <button type="button" key={s} className={`chip ${notes.toLowerCase().includes(s) ? "active" : ""}`} onClick={() => addSuggestion(s)}>
                  + {s}
                </button>
              ))}
            </div>
            <label className="field">
              <span className="sr-only">Notes</span>
              <textarea
                rows={3}
                maxLength={200}
                value={notes}
                onChange={(e) => setNotes(e.target.value)}
                placeholder="e.g. somewhere quiet enough to talk, under $40"
              />
            </label>
            <p className="summary">
              A <strong>{category.toLowerCase()}</strong> spot in <strong>{area}</strong>
              {notes.trim() ? <> — {notes.trim()}</> : ""}.
            </p>
          </section>
        )}

        {step === 3 && (
          <section className="wiz-step wiz-step--narrow" aria-live="polite">
            {pending && <GenerateProgress area={area} />}

            {done && state.message && !state.ok && (
              <div className="wiz-error">
                <h1 className="wiz-q">
                  Hmm, <em>no luck</em>
                </h1>
                <p className="form-error" role="alert">
                  {state.message}
                </p>
                <div className="wiz-actions">
                  <button type="button" className="btn btn--primary" onClick={submit}>
                    Try again
                  </button>
                  <button type="button" className="btn btn--ghost" onClick={() => setStep(2)}>
                    Back
                  </button>
                </div>
              </div>
            )}

            {done && state.ok && state.dossier && (
              <article className="reveal-card">
                <div className="reveal-band" style={{ "--from": vibe(state.dossier.category).from, "--to": vibe(state.dossier.category).to }}>
                  <span aria-hidden="true">{vibe(state.dossier.category).icon}</span>
                </div>
                <div className="reveal-body">
                  <p className="eyebrow">Your spot</p>
                  <h1 className="reveal-name">{state.dossier.place_name}</h1>
                  <div className="tags">
                    <span className="tag tag--area">{state.dossier.neighborhood}</span>
                    <span className="tag tag--vibe">
                      <span aria-hidden="true">{vibe(state.dossier.category).icon}</span> {state.dossier.category}
                    </span>
                  </div>
                  <Blurb text={state.dossier.blurb} />
                  <div className="reveal-actions">
                    <a
                      className="btn btn--primary"
                      href={mapsUrl(state.dossier.place_name, state.dossier.neighborhood)}
                      target="_blank"
                      rel="noopener noreferrer"
                    >
                      Get directions
                    </a>
                    <SaveButton generationId={state.dossier.id} saved={false} withLabel />
                  </div>
                  <div className="reveal-links">
                    <button type="button" className="text-link" onClick={submit}>
                      ↻ Try another
                    </button>
                    <button type="button" className="text-link" onClick={startOver}>
                      Start over
                    </button>
                    <Link className="text-link" href={`/vault#spot-${state.dossier.id}`}>
                      See it in Discover →
                    </Link>
                  </div>
                </div>
              </article>
            )}
          </section>
        )}
      </div>

      {step < 3 && (
        <div className="wiz-nav">
          <button type="button" className="btn btn--ghost" onClick={() => setStep(step - 1)} disabled={step === 0}>
            ← Back
          </button>
          {step < 2 && (
            <button type="button" className={`dice ${shuffling ? "rolling" : ""}`} onClick={surpriseMe} disabled={shuffling}>
              <span aria-hidden="true">🎲</span> Surprise<span className="dice-label">&nbsp;me</span>
            </button>
          )}
          <button type="button" className="btn btn--primary" onClick={next} disabled={!canNext}>
            {step === 2 ? "Find my spot" : "Next →"}
          </button>
        </div>
      )}
    </form>
  );
}
