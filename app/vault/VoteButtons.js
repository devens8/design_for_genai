"use client";

import { useOptimistic, useTransition } from "react";
import { castVote } from "./actions";

// Up/down vote control with optimistic UI. The authoritative score comes back
// when the server action revalidates /vault; until then we show the optimistic
// value so the click feels instant.
export default function VoteButtons({ generationId, score, myVote }) {
  const [isPending, startTransition] = useTransition();

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
    startTransition(async () => {
      setOptimistic(pressed);
      await castVote(generationId, pressed);
    });
  }

  return (
    <div className="vote">
      <button
        type="button"
        className={`vote-btn up ${optimistic.myVote === 1 ? "active" : ""}`}
        onClick={() => vote(1)}
        disabled={isPending}
        aria-label="Upvote"
        aria-pressed={optimistic.myVote === 1}
      >
        ▲
      </button>
      <span className="vote-score">{optimistic.score}</span>
      <button
        type="button"
        className={`vote-btn down ${optimistic.myVote === -1 ? "active" : ""}`}
        onClick={() => vote(-1)}
        disabled={isPending}
        aria-label="Downvote"
        aria-pressed={optimistic.myVote === -1}
      >
        ▼
      </button>
    </div>
  );
}
