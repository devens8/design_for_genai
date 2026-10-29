import VoteButtons from "@/app/vault/VoteButtons";
import { Blurb, DeleteButton, SaveButton } from "@/app/vault/CardActions";
import { authorName, mapsUrl, timeAgo } from "@/lib/places";
import { Sparkle } from "./Art";
import { vibe } from "./vibes";

// One AI-found spot in a grid: illustrated vibe band, name + tags, a one-line
// hook (rest expands), then vote / save / directions. Delete-if-mine lives in
// the "⋯" menu.
export default function DossierCard({ d, myVote, saved, isMine }) {
  const v = vibe(d.category);
  return (
    <li className="spot reveal" id={`spot-${d.id}`}>
      <div className="spot-band" style={{ "--from": v.from, "--to": v.to }}>
        <span className="spot-icon" aria-hidden="true">
          {v.icon}
        </span>
        {isMine && <DeleteButton generationId={d.id} placeName={d.place_name} />}
      </div>

      <div className="spot-body">
        <h2 className="spot-name">{d.place_name}</h2>
        <div className="tags">
          <span className="tag tag--area">{d.neighborhood}</span>
          <span className="tag tag--vibe">
            <span aria-hidden="true">{v.icon}</span> {d.category}
          </span>
        </div>

        <Blurb text={d.blurb} />

        <div className="spot-actions">
          <VoteButtons
            generationId={d.id}
            score={d.score}
            upvotes={d.upvotes}
            downvotes={d.downvotes}
            myVote={myVote}
          />
          <div className="spot-actions-right">
            <SaveButton generationId={d.id} saved={saved} />
            <a
              className="dir-link"
              href={mapsUrl(d.place_name, d.neighborhood)}
              target="_blank"
              rel="noopener noreferrer"
            >
              <svg viewBox="0 0 24 24" aria-hidden="true">
                <path d="M12 21s-6-5.3-6-11a6 6 0 0 1 12 0c0 5.7-6 11-6 11z" />
                <circle cx="12" cy="10" r="2.2" />
              </svg>
              Directions
            </a>
          </div>
        </div>

        <p className="spot-meta">
          {isMine ? "added by you" : `added by ${authorName(d)}`} · {timeAgo(d.created_at)}
          <span className="ai-mark" title={`Written by AI (${d.model})`} aria-label="AI-written">
            <Sparkle />
          </span>
        </p>
      </div>
    </li>
  );
}
