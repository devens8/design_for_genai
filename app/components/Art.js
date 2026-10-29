// Hand-drawn style line art used as decoration. Purely presentational, always
// aria-hidden. Strokes use currentColor so CSS sets the tone.

const base = {
  fill: "none",
  stroke: "currentColor",
  strokeWidth: 1.5,
  strokeLinecap: "round",
  strokeLinejoin: "round",
  "aria-hidden": true,
  focusable: "false",
};

export function LeafSprig({ className = "" }) {
  return (
    <svg viewBox="0 0 120 160" className={`art ${className}`} {...base}>
      <path d="M60 155 C58 120 62 80 70 10" />
      <path d="M62 120 C40 112 28 96 26 78 C44 80 58 94 62 120Z" />
      <path d="M64 95 C84 88 96 72 98 54 C80 56 66 70 64 95Z" />
      <path d="M66 68 C48 60 40 46 40 30 C56 34 66 48 66 68Z" />
      <path d="M68 42 C80 36 86 26 86 14 C76 16 68 26 68 42Z" />
      <path d="M44 86 L58 112 M82 64 L67 90 M48 40 L64 63" opacity=".6" />
    </svg>
  );
}

export function CoffeeCup({ className = "" }) {
  return (
    <svg viewBox="0 0 120 120" className={`art ${className}`} {...base}>
      <path d="M22 50 H86 V74 C86 92 72 104 54 104 C36 104 22 92 22 74Z" />
      <path d="M86 58 C100 56 104 66 100 74 C96 82 88 82 86 80" />
      <path d="M14 108 H96" />
      <path d="M40 40 C34 32 46 26 40 16 M56 40 C50 32 62 26 56 16 M72 40 C66 32 78 26 72 16" opacity=".7" />
    </svg>
  );
}

export function WineGlass({ className = "" }) {
  return (
    <svg viewBox="0 0 100 140" className={`art ${className}`} {...base}>
      <path d="M26 12 H74 C76 44 66 66 50 68 C34 66 24 44 26 12Z" />
      <path d="M28 34 C40 38 60 30 72 34" opacity=".7" />
      <path d="M50 68 V120 M32 124 C40 120 60 120 68 124" />
    </svg>
  );
}

export function Laurel({ className = "" }) {
  const leaves = [0, 1, 2, 3, 4];
  return (
    <svg viewBox="0 0 200 80" className={`art ${className}`} {...base}>
      <path d="M100 74 C70 72 40 56 24 20" />
      <path d="M100 74 C130 72 160 56 176 20" />
      {leaves.map((i) => {
        const t = 30 + i * 13;
        return (
          <g key={i}>
            <path d={`M${t} ${58 - i * 8} c-12 -4 -16 -14 -14 -22 c10 2 16 10 14 22z`} />
            <path d={`M${200 - t} ${58 - i * 8} c12 -4 16 -14 14 -22 c-10 2 -16 10 -14 22z`} />
          </g>
        );
      })}
    </svg>
  );
}

export function Wave({ className = "" }) {
  return (
    <svg viewBox="0 0 600 24" preserveAspectRatio="none" className={`wave ${className}`} {...base}>
      <path d="M0 12 C50 2 100 22 150 12 S250 2 300 12 S400 22 450 12 S550 2 600 12" />
    </svg>
  );
}

export function LeafMark({ className = "" }) {
  return (
    <svg viewBox="0 0 24 24" className={`leaf-mark ${className}`} {...base} strokeWidth={1.6}>
      <path d="M5 19 C5 10 11 5 20 4 C20 13 14 19 5 19Z" />
      <path d="M5 19 L14 10" />
    </svg>
  );
}

export function Sparkle({ className = "" }) {
  return (
    <svg viewBox="0 0 24 24" className={`sparkle ${className}`} fill="currentColor" aria-hidden="true">
      <path d="M12 2 L13.8 9.2 L21 11 L13.8 12.8 L12 20 L10.2 12.8 L3 11 L10.2 9.2Z" />
    </svg>
  );
}
