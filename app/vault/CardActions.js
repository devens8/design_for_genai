"use client";

import { useOptimistic, useState, useTransition } from "react";
import { deleteDossier, toggleSave } from "./actions";

// Save toggle (want-to-go list) with optimistic UI.
export function SaveButton({ generationId, saved }) {
  const [isPending, startTransition] = useTransition();
  const [error, setError] = useState("");
  const [optimisticSaved, setOptimisticSaved] = useOptimistic(saved);

  function toggle() {
    setError("");
    const next = !optimisticSaved;
    startTransition(async () => {
      setOptimisticSaved(next);
      const res = await toggleSave(generationId, next);
      if (!res?.ok) setError(res?.message || "Could not save — try again.");
    });
  }

  return (
    <>
      <button
        type="button"
        className={`card-action ${optimisticSaved ? "card-action--on" : ""}`}
        onClick={toggle}
        disabled={isPending}
        aria-pressed={optimisticSaved}
      >
        {optimisticSaved ? "★ Saved" : "☆ Save"}
      </button>
      {error && (
        <span className="vote-error" role="alert">
          {error}
        </span>
      )}
    </>
  );
}

// Delete your own dossier, with a confirm step so it can't happen by accident.
export function DeleteButton({ generationId, placeName }) {
  const [isPending, startTransition] = useTransition();
  const [error, setError] = useState("");

  function remove() {
    if (!window.confirm(`Delete "${placeName}" from the vault? This can't be undone.`)) {
      return;
    }
    setError("");
    startTransition(async () => {
      const res = await deleteDossier(generationId);
      if (!res?.ok) setError(res?.message || "Could not delete — try again.");
    });
  }

  return (
    <>
      <button
        type="button"
        className="card-action card-action--danger"
        onClick={remove}
        disabled={isPending}
      >
        {isPending ? "Deleting…" : "Delete"}
      </button>
      {error && (
        <span className="vote-error" role="alert">
          {error}
        </span>
      )}
    </>
  );
}

// Long AI blurbs are clamped to a few lines with a "Read more" toggle so the
// feed stays scannable.
export function Blurb({ text }) {
  const [open, setOpen] = useState(false);
  const long = text.length > 260;

  return (
    <div className="dossier-blurb-wrap">
      <p className={`dossier-blurb ${long && !open ? "clamped" : ""}`}>{text}</p>
      {long && (
        <button type="button" className="read-more" onClick={() => setOpen(!open)}>
          {open ? "Show less" : "Read more"}
        </button>
      )}
    </div>
  );
}
