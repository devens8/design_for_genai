import VoteButtons from "./VoteButtons";
import { Blurb, SaveButton } from "./CardActions";
import { mapsUrl } from "@/lib/places";
import { splitBlurb, vibe } from "@/app/components/vibes";

// Top Rated gets its own layout: a podium for #1–#3 and a menu-card list (with
// dotted leaders to the score) for everything after.
function Podium({ d, rank, myVote, saved }) {
  const v = vibe(d.category);
  return (
    <li className={`podium-card podium-card--${rank} reveal`} id={`spot-${d.id}`}>
      <div className="podium-band" style={{ "--from": v.from, "--to": v.to }}>
        <span className="podium-n">{rank}</span>
        <span className="podium-icon" aria-hidden="true">
          {v.icon}
        </span>
      </div>
      <div className="podium-body">
        <h2 className="spot-name">{d.place_name}</h2>
        <div className="tags">
          <span className="tag tag--area">{d.neighborhood}</span>
          <span className="tag tag--vibe">
            <span aria-hidden="true">{v.icon}</span> {d.category}
          </span>
        </div>
        <p className="podium-hook">{splitBlurb(d.blurb).hook}</p>
        <div className="spot-actions">
          <VoteButtons generationId={d.id} score={d.score} upvotes={d.upvotes} downvotes={d.downvotes} myVote={myVote} />
          <div className="spot-actions-right">
            <SaveButton generationId={d.id} saved={saved} />
            <a className="dir-link" href={mapsUrl(d.place_name, d.neighborhood)} target="_blank" rel="noopener noreferrer">
              Directions ↗
            </a>
          </div>
        </div>
      </div>
    </li>
  );
}

function MenuRow({ d, rank, myVote, saved }) {
  return (
    <li className="menu-row reveal" id={`spot-${d.id}`}>
      <details>
        <summary>
          <span className="menu-rank">{rank}</span>
          <span className="menu-name">
            <strong>{d.place_name}</strong>
            <span>
              {d.neighborhood} · {d.category}
            </span>
          </span>
          <span className="menu-leader" aria-hidden="true" />
          <span className="menu-score">{d.score > 0 ? `+${d.score}` : d.score}</span>
        </summary>
        <div className="menu-detail">
          <Blurb text={d.blurb} startOpen />
          <div className="spot-actions">
            <VoteButtons generationId={d.id} score={d.score} upvotes={d.upvotes} downvotes={d.downvotes} myVote={myVote} />
            <div className="spot-actions-right">
              <SaveButton generationId={d.id} saved={saved} withLabel />
              <a className="dir-link" href={mapsUrl(d.place_name, d.neighborhood)} target="_blank" rel="noopener noreferrer">
                Directions ↗
              </a>
            </div>
          </div>
        </div>
      </details>
    </li>
  );
}

export default function TopRated({ rows, voteMap, savedSet }) {
  const podium = rows.slice(0, 3);
  // Visual order puts #1 in the middle on wide screens.
  const ordered = podium.length === 3 ? [podium[1], podium[0], podium[2]] : podium;
  const rest = rows.slice(3);
  const props = (d) => ({ d, myVote: voteMap.get(d.id) ?? 0, saved: savedSet.has(d.id) });

  return (
    <>
      <ol className="podium">
        {ordered.map((d) => (
          <Podium key={d.id} rank={rows.indexOf(d) + 1} {...props(d)} />
        ))}
      </ol>
      {rest.length > 0 && (
        <section className="menu-card reveal" aria-label="More favorites">
          <h2 className="menu-title">The rest of the list</h2>
          <ol className="menu-list" start={4}>
            {rest.map((d, i) => (
              <MenuRow key={d.id} rank={i + 4} {...props(d)} />
            ))}
          </ol>
        </section>
      )}
    </>
  );
}
