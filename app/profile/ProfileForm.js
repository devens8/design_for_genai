"use client";

import { useActionState, useRef, useState } from "react";
import { updateProfile } from "./actions";

const initialState = { ok: false, message: "" };

export default function ProfileForm({ profile }) {
  const [state, formAction, pending] = useActionState(
    updateProfile,
    initialState
  );
  const fileRef = useRef(null);
  const [preview, setPreview] = useState(profile?.avatar_url ?? null);

  function onPickFile(e) {
    const file = e.target.files?.[0];
    if (file) setPreview(URL.createObjectURL(file));
  }

  const initials =
    `${profile?.first_name?.[0] ?? ""}${profile?.last_name?.[0] ?? ""}`.toUpperCase();

  return (
    <form action={formAction} className="profile-form">
      <div className="avatar-row">
        <div className="avatar">
          {preview ? (
            // eslint-disable-next-line @next/next/no-img-element
            <img src={preview} alt="Profile photo" />
          ) : (
            <span className="avatar-placeholder">{initials || "?"}</span>
          )}
        </div>
        <div className="avatar-actions">
          <button
            type="button"
            className="secondary-btn"
            onClick={() => fileRef.current?.click()}
          >
            Choose photo
          </button>
          <input
            ref={fileRef}
            type="file"
            name="avatar"
            accept="image/*"
            onChange={onPickFile}
            hidden
          />
          <p className="hint">JPG or PNG, up to 5 MB.</p>
        </div>
      </div>

      <label className="field">
        <span>First name</span>
        <input
          type="text"
          name="first_name"
          defaultValue={profile?.first_name ?? ""}
          placeholder="Ada"
          required
        />
      </label>

      <label className="field">
        <span>Last name</span>
        <input
          type="text"
          name="last_name"
          defaultValue={profile?.last_name ?? ""}
          placeholder="Lovelace"
          required
        />
      </label>

      <label className="field">
        <span>Bio (optional)</span>
        <textarea
          name="bio"
          rows={3}
          defaultValue={profile?.bio ?? ""}
          placeholder="A little about you…"
        />
      </label>

      {state.message && (
        <p className={state.ok ? "form-success" : "form-error"}>
          {state.message}
        </p>
      )}

      <button type="submit" className="primary-btn" disabled={pending}>
        {pending ? "Saving…" : "Save profile"}
      </button>
    </form>
  );
}
