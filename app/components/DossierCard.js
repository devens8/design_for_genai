import VoteButtons from "@/app/vault/VoteButtons";
import { Blurb, DeleteButton, SaveButton } from "@/app/vault/CardActions";
import { authorName, mapsUrl, timeAgo } from "@/lib/places";

// One AI-generated spot in a feed: vote control, name + tags, blurb, and the
// actions a user actually wants (directions, save, delete-if-mine).
export default function DossierCard({ d, myVote, saved, isMine, rank }) {
  return (
    <li className="dossier" id={`spot-${d.id}`}>
      <VoteButtons
        generationId={d.id}
        score={d.score}
        upvotes={d.upvotes}
        downvotes={d.downvotes}
        myVote={myVote}
      />

      <div className="dossier-body">
        <div className="dossier-head">
          {rank && <span className="dossier-rank">#{rank}</span>}
          <h2 className="dossier-name">{d.place_name}</h2>
          <span className="tag tag--area">{d.neighborhood}</span>
          <span className="tag tag--cat">{d.category}</span>
        </div>

        <Blurb text={d.blurb} />

        <div className="dossier-actions">
          <a
            className="card-action card-action--primary"
            href={mapsUrl(d.place_name, d.neighborhood)}
            target="_blank"
            rel="noopener noreferrer"
          >
            ↗ Directions
          </a>
          <SaveButton generationId={d.id} saved={saved} />
          {isMine && <DeleteButton generationId={d.id} placeName={d.place_name} />}
        </div>

        <div className="dossier-foot">
          <span>
            {isMine ? "added by you" : `added by ${authorName(d)}`} · {timeAgo(d.created_at)}
          </span>
          <span className="ai-badge" title={`Written by ${d.model}`}>
            AI-written
          </span>
        </div>
      </div>
    </li>
  );
}
