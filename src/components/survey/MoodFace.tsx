"use client";

import { cn } from "@/lib/utils";

/**
 * Custom SVG mood face for the 1-5 satisfaction scale. Mouth curvature and
 * eyebrow angle are derived from `value` so expressions read as a single
 * consistent, progressively-more-positive family instead of mismatched emoji.
 */
export function MoodFace({ value, active, size = 40 }: { value: 1 | 2 | 3 | 4 | 5; active?: boolean; size?: number }) {
  // SVG y grows downward, so a smile (endpoints higher than midpoint) needs a
  // *positive* offset added to the midpoint as value increases toward 5.
  const curve = (value - 3) * 3.2;
  const browTilt = value <= 2 ? 3 : value >= 4 ? -1.5 : 0;
  const color = active ? "var(--accent)" : "#9ca3af";

  return (
    <svg width={size} height={size} viewBox="0 0 24 24" fill="none" className={cn("transition-transform duration-200", active && "scale-110")}>
      <circle cx="12" cy="12" r="10.5" stroke={color} strokeWidth="1.6" />
      {/* eyebrows */}
      <line x1="6.6" y1={9 - browTilt} x2="9.6" y2={9 + browTilt} stroke={color} strokeWidth="1.4" strokeLinecap="round" />
      <line x1="14.4" y1={9 + browTilt} x2="17.4" y2={9 - browTilt} stroke={color} strokeWidth="1.4" strokeLinecap="round" />
      {/* eyes */}
      <circle cx="8.6" cy="11.6" r="1.15" fill={color} />
      <circle cx="15.4" cy="11.6" r="1.15" fill={color} />
      {/* mouth */}
      <path
        d={`M7.5,15.2 Q12,${15.2 + curve} 16.5,15.2`}
        stroke={color}
        strokeWidth="1.7"
        strokeLinecap="round"
        fill="none"
      />
    </svg>
  );
}
