"use client";

import { useActionState, useEffect, useRef, useState } from "react";
import { usePathname } from "next/navigation";
import { reportBug } from "@/app/bugs/actions";

const initial = { ok: false, message: "" };

// "Report a bug" button + dialog. Captures the page you were on so admins can
// reproduce it.
export default function ReportBug() {
  const [state, formAction, pending] = useActionState(reportBug, initial);
  const [url, setUrl] = useState("");
  const dialogRef = useRef(null);
  const formRef = useRef(null);
  const pathname = usePathname();

  useEffect(() => {
    if (state.ok) formRef.current?.reset();
  }, [state]);

  function open() {
    setUrl(window.location.pathname + window.location.search);
    dialogRef.current?.showModal();
  }

  return (
    <>
      <button type="button" className="bug-link" onClick={open}>
        <svg viewBox="0 0 24 24" aria-hidden="true">
          <path d="M8 9a4 4 0 0 1 8 0v5a4 4 0 0 1-8 0z M12 9v9 M4 12h4 M16 12h4 M5 7l3 2 M19 7l-3 2 M5 18l3-2 M19 18l-3-2 M10 5 9 3 M14 5l1-2" />
        </svg>
        Report a bug
      </button>

      <dialog
        ref={dialogRef}
        className="bug-dialog"
        aria-labelledby="bug-title"
        onClick={(e) => e.target === dialogRef.current && dialogRef.current.close()}
      >
        <form ref={formRef} action={formAction} className="bug-form">
          <div className="bug-head">
            <h2 id="bug-title">
              Spotted a <em>bug</em>?
            </h2>
            <button type="button" className="icon-btn" aria-label="Close" onClick={() => dialogRef.current?.close()}>
              ✕
            </button>
          </div>
          <p className="hint">
            Tell us what went wrong. We&apos;ll attach the page you&apos;re on (<code>{url || pathname}</code>).
          </p>
          <input type="hidden" name="page_url" value={url || pathname} />

          <label className="field">
            <span>What happened?</span>
            <input name="title" required minLength={3} maxLength={120} placeholder="e.g. Save button doesn't stick" />
          </label>
          <label className="field">
            <span>Details</span>
            <textarea
              name="description"
              rows={4}
              required
              minLength={5}
              maxLength={2000}
              placeholder="What did you click, what did you expect, what happened instead?"
            />
          </label>
          <fieldset className="bug-severity">
            <legend>How bad is it?</legend>
            {[
              ["low", "Small annoyance"],
              ["medium", "Gets in the way"],
              ["high", "Something's broken"],
            ].map(([v, label]) => (
              <label key={v} className="chip">
                <input type="radio" name="severity" value={v} defaultChecked={v === "medium"} />
                {label}
              </label>
            ))}
          </fieldset>

          {state.message && (
            <p className={state.ok ? "form-success" : "form-error"} role="status">
              {state.message}
            </p>
          )}
          <div className="bug-actions">
            <button type="button" className="btn btn--ghost btn--sm" onClick={() => dialogRef.current?.close()}>
              {state.ok ? "Done" : "Cancel"}
            </button>
            <button type="submit" className="btn btn--primary btn--sm" disabled={pending}>
              {pending ? "Sending…" : "Send report"}
            </button>
          </div>
        </form>
      </dialog>
    </>
  );
}
