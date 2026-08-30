"use client";

import { cn } from "@/lib/utils";

type MoodValue = 1 | 2 | 3 | 4 | 5;

interface FaceConfig {
  bg: string;
  eyes: "dot" | "happy";
  brows?: boolean;
  mouth: string;
  mouthFill?: boolean;
}

// Filled, color-coded faces (dark red -> red -> orange -> amber -> green),
// each with its own eyebrow/eye/mouth treatment rather than one shared
// formula, so the angriest and happiest ends of the scale read distinctly
// at a glance instead of just "frown vs. smile".
const FACES: Record<MoodValue, FaceConfig> = {
  1: {
    bg: "#c0272d",
    eyes: "dot",
    brows: true,
    mouth: "M30,70 Q50,58 70,70",
  },
  2: {
    bg: "#e8544b",
    eyes: "dot",
    mouth: "M32,68 Q50,59 68,68",
  },
  3: {
    bg: "#ef9439",
    eyes: "dot",
    mouth: "M33,66 L67,66",
  },
  4: {
    bg: "#f0bc3c",
    eyes: "dot",
    mouth: "M32,58 Q50,74 68,58",
  },
  5: {
    bg: "#77c14a",
    eyes: "happy",
    mouth: "M28,55 Q50,80 72,55 Q50,68 28,55 Z",
    mouthFill: true,
  },
};

const INK = "#20201f";

export function MoodFace({ value, active, size = 40 }: { value: MoodValue; active?: boolean; size?: number }) {
  const cfg = FACES[value];

  return (
    <svg
      width={size}
      height={size}
      viewBox="0 0 100 100"
      className={cn("transition-transform duration-200", active && "scale-110")}
    >
      <circle cx="50" cy="50" r="48" fill={cfg.bg} />

      {cfg.brows && (
        <>
          <line x1="24" y1="30" x2="40" y2="37" stroke={INK} strokeWidth="4.5" strokeLinecap="round" />
          <line x1="76" y1="30" x2="60" y2="37" stroke={INK} strokeWidth="4.5" strokeLinecap="round" />
        </>
      )}

      {cfg.eyes === "dot" ? (
        <>
          <circle cx="36" cy="45" r="5.5" fill={INK} />
          <circle cx="64" cy="45" r="5.5" fill={INK} />
        </>
      ) : (
        <>
          <path d="M28,42 Q36,34 44,42" stroke={INK} strokeWidth="4.5" strokeLinecap="round" fill="none" />
          <path d="M56,42 Q64,34 72,42" stroke={INK} strokeWidth="4.5" strokeLinecap="round" fill="none" />
        </>
      )}

      {cfg.mouthFill ? (
        <path d={cfg.mouth} fill={INK} />
      ) : (
        <path d={cfg.mouth} stroke={INK} strokeWidth="4.5" strokeLinecap="round" fill="none" />
      )}
    </svg>
  );
}
