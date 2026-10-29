"use client";

import { useOptimistic, useState, useTransition } from "react";
import { castVote } from "./actions";

// Compact horizontal vote pill (▲ score ▼) with optimistic UI. The
// authoritative score comes back when the server action revalidates the page;
// until then we show the optimistic value so the click feels instant. If the
// server rejects the vote the optimistic state rolls back and we show why.
export default function VoteButtons({ generationId, score, upvotes, downvotes, myVote }) {
  const [isPending, startTransition] = useTransition();
  const [error, setError] = useState("");

  const [optimistic, setOptimistic] = useOptimistic(
    { score, myVote },
    (state, pressed) => {
      // Clicking your current vote clears it; otherwise it becomes your vote.
      const nextVote = state.myVote === pressed ? 0 : pressed;
      return {
        myVote: nextVote,
        score: state.score - state.myVote + nextVote,
      };
    }
  );

  function vote(pressed) {
    setError("");
    startTransition(async () => {
      setOptimistic(pressed);
      const res = await castVote(generationId, pressed);
      if (!res?.ok) setError(res?.message || "Vote failed. Try again.");
    });
  }

  return (
    <div className="vote-wrap">
      <div
        className={`vote ${optimistic.myVote ? "vote--voted" : ""}`}
        title={`${upvotes} said worth it · ${downvotes} said skip it`}
      >
        <button
          type="button"
          className={`vote-btn ${optimistic.myVote === 1 ? "active" : ""}`}
          onClick={() => vote(1)}
          disabled={isPending}
          aria-label={optimistic.myVote === 1 ? "Remove upvote" : "Upvote: worth the trip"}
          aria-pressed={optimistic.myVote === 1}
        >
          ▲
        </button>
        <span className="vote-score" aria-label={`Score ${optimistic.score}`}>
          {optimistic.score}
        </span>
        <button
          type="button"
          className={`vote-btn ${optimistic.myVote === -1 ? "active" : ""}`}
          onClick={() => vote(-1)}
          disabled={isPending}
          aria-label={optimistic.myVote === -1 ? "Remove downvote" : "Downvote: skip it"}
          aria-pressed={optimistic.myVote === -1}
        >
          ▼
        </button>
      </div>
      {error && (
        <span className="inline-error" role="alert">
          {error}
        </span>
      )}
    </div>
  );
}
