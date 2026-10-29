"use client";

import { useEffect, useOptimistic, useRef, useState, useTransition } from "react";
import { deleteDossier, toggleSave } from "./actions";
import { splitBlurb } from "@/app/components/vibes";

// Save toggle (want-to-go list) with optimistic UI, shown as a heart.
export function SaveButton({ generationId, saved, withLabel = false }) {
  const [isPending, startTransition] = useTransition();
  const [error, setError] = useState("");
  const [optimisticSaved, setOptimisticSaved] = useOptimistic(saved);

  function toggle() {
    setError("");
    const next = !optimisticSaved;
    startTransition(async () => {
      setOptimisticSaved(next);
      const res = await toggleSave(generationId, next);
      if (!res?.ok) setError(res?.message || "Could not save. Try again.");
    });
  }

  return (
    <>
      <button
        type="button"
        className={`icon-btn save-btn ${optimisticSaved ? "on" : ""}`}
        onClick={toggle}
        disabled={isPending}
        aria-pressed={optimisticSaved}
        aria-label={optimisticSaved ? "Saved. Remove from your list" : "Save to your list"}
        title={optimisticSaved ? "Saved" : "Save"}
      >
        <svg viewBox="0 0 24 24" aria-hidden="true">
          <path d="M12 20s-7-4.4-7-10a4 4 0 0 1 7-2.6A4 4 0 0 1 19 10c0 5.6-7 10-7 10z" />
        </svg>
        {withLabel && <span>{optimisticSaved ? "Saved" : "Save"}</span>}
      </button>
      {error && (
        <span className="inline-error" role="alert">
          {error}
        </span>
      )}
    </>
  );
}

// Delete your own spot, tucked into a small "⋯" menu with a confirm step so it
// can't happen by accident.
export function DeleteButton({ generationId, placeName }) {
  const [isPending, startTransition] = useTransition();
  const [error, setError] = useState("");
  const [open, setOpen] = useState(false);
  const ref = useRef(null);

  useEffect(() => {
    if (!open) return;
    const close = (e) => {
      if (!ref.current?.contains(e.target)) setOpen(false);
    };
    const esc = (e) => e.key === "Escape" && setOpen(false);
    document.addEventListener("pointerdown", close);
    document.addEventListener("keydown", esc);
    return () => {
      document.removeEventListener("pointerdown", close);
      document.removeEventListener("keydown", esc);
    };
  }, [open]);

  function remove() {
    setOpen(false);
    if (!window.confirm(`Delete "${placeName}"? This can't be undone.`)) return;
    setError("");
    startTransition(async () => {
      const res = await deleteDossier(generationId);
      if (!res?.ok) setError(res?.message || "Could not delete. Try again.");
    });
  }

  return (
    <div className="more" ref={ref}>
      <button
        type="button"
        className="icon-btn"
        aria-haspopup="menu"
        aria-expanded={open}
        aria-label="More options"
        onClick={() => setOpen(!open)}
        disabled={isPending}
      >
        {isPending ? "…" : "⋯"}
      </button>
      {open && (
        <div className="more-menu" role="menu">
          <button type="button" role="menuitem" className="more-danger" onClick={remove}>
            Delete this spot
          </button>
        </div>
      )}
      {error && (
        <span className="inline-error" role="alert">
          {error}
        </span>
      )}
    </div>
  );
}

// Shows only the one-line hook; "Read more" smoothly expands the rest plus an
// insider-tip callout when the blurb ends with one.
export function Blurb({ text, startOpen = false }) {
  const [open, setOpen] = useState(startOpen);
  const { hook, rest, tip } = splitBlurb(text);
  const more = Boolean(rest || tip);

  return (
    <div className="blurb">
      <p className={`blurb-hook ${open ? "" : "clamp-2"}`}>{hook}</p>
      {more && (
        <>
          <div className={`blurb-more ${open ? "open" : ""}`} aria-hidden={!open}>
            <div>
              {rest && <p>{rest}</p>}
              {tip && (
                <p className="tip">
                  <span className="tip-label">💡 Insider tip</span>
                  {tip}
                </p>
              )}
            </div>
          </div>
          <button
            type="button"
            className="read-more"
            onClick={() => setOpen(!open)}
            aria-expanded={open}
          >
            {open ? "Show less" : "Read more"}
          </button>
        </>
      )}
    </div>
  );
}
