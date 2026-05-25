import React, { useState } from "react";
import { useLang } from "../context/LangContext";

/*
 * Road section 1800 × 540:
 *   y=  0– 40  curb tiles
 *   y= 40–284  UPPER LANE  (244 px)
 *   y=284–296  lane markings
 *   y=296–540  LOWER LANE  (244 px)
 *
 * Each review occupies one SLOT:
 *   [ COMPACT_W ][ INNER_GAP ][ EXPANDED_W ][ OUTER_GAP ]
 *       340            60          340            80
 *   ─────────────────────────────────────────────────────
 *   SLOT_W = 820 px
 *
 * Expanded card appears in its reserved gap right after the compact truck,
 * on the SAME lane, only when that review is selected.
 * Compact truck is NEVER dimmed.
 *
 * Even-indexed reviews → upper lane
 * Odd-indexed  reviews → lower lane
 */

const COMPACT_W  = 340;
const EXPANDED_W = 340;
const INNER_GAP  = 60;    // gap between compact and its expanded slot
const OUTER_GAP  = 80;    // gap after expanded slot → next truck
const SLOT_W     = COMPACT_W + INNER_GAP + EXPANDED_W + OUTER_GAP; // 820
const SPEED      = 100;   // px / s  (= road: 1800 px / 18 s)

const COMPACT_H  = Math.round(COMPACT_W  * 199 / 416); // ≈ 163 px
const EXPANDED_H = Math.round(EXPANDED_W * 271 / 416); // ≈ 221 px

// Vertically centred inside each 244 px lane
const UPPER_COMPACT_TOP  = 40  + Math.round((244 - COMPACT_H)  / 2); // ≈ 81
const LOWER_COMPACT_TOP  = 296 + Math.round((244 - COMPACT_H)  / 2); // ≈ 337
const UPPER_EXPANDED_TOP = 40  + Math.round((244 - EXPANDED_H) / 2); // ≈ 52
const LOWER_EXPANDED_TOP = 296 + Math.round((244 - EXPANDED_H) / 2); // ≈ 308

export default function ReviewsBlock() {
  const { t }   = useLang();
  const reviews = t.reviews.items;
  const [selected, setSelected] = useState(null);

  const doubled   = [...reviews, ...reviews];
  const ONE_SET_W = reviews.length * SLOT_W;
  const duration  = ONE_SET_W / SPEED; // seconds

  return (
    <section
      id="reviews"
      className="relative overflow-hidden"
      style={{ height: 540 }}
    >
      {/* Exact-pixel keyframe – zero jump on loop */}
      <style>{`
        @keyframes truck-scroll {
          from { transform: translateX(0); }
          to   { transform: translateX(-${ONE_SET_W}px); }
        }
      `}</style>

      {/* ── Road — background-repeat so it tiles on any screen width ── */}
      <div
        className="absolute inset-0"
        style={{
          backgroundImage:    "url('/road.svg')",
          backgroundRepeat:   "repeat-x",
          backgroundSize:     "1800px 100%",
          backgroundPosition: "0 0",
          animation:          "road-scroll 18s linear infinite",
        }}
      />

      {/* ── Scrolling convoy strip ── */}
      <div
        className="absolute z-10"
        style={{
          top: 0, left: 0,
          width: ONE_SET_W * 2,
          height: 540,
          animation: `truck-scroll ${duration}s linear infinite`,
          willChange: "transform",
        }}
      >
        {doubled.map((review, i) => {
          const ri         = i % reviews.length;
          const isUpper    = ri % 2 === 0;
          const isSelected = selected === ri;

          const compactTop  = isUpper ? UPPER_COMPACT_TOP  : LOWER_COMPACT_TOP;
          const expandedTop = isUpper ? UPPER_EXPANDED_TOP : LOWER_EXPANDED_TOP;
          const xCompact    = i * SLOT_W;
          const xExpanded   = xCompact + COMPACT_W + INNER_GAP;

          return (
            <React.Fragment key={i}>

              {/* Compact truck — always visible, never dimmed */}
              <button
                className="absolute focus:outline-none cursor-pointer hover:brightness-110 transition-[filter] duration-150"
                style={{ left: xCompact, top: compactTop, width: COMPACT_W }}
                onClick={() => setSelected(isSelected ? null : ri)}
                title={review.author}
              >
                <div className="relative w-full">
                  <img
                    src="/review-card.svg"
                    alt={`Отзыв — ${review.author}`}
                    className="w-full"
                    draggable={false}
                  />
                  {/* Text overlay in cargo rectangle (x=150–410, y=6–133 in 416×199 SVG) */}
                  <div
                    className="absolute flex flex-col justify-between overflow-hidden pointer-events-none"
                    style={{
                      left:    "37.5%",
                      top:     "5%",
                      width:   "58%",
                      height:  "60%",
                      padding: "5px 9px",
                    }}
                  >
                    <p className="font-mont text-charcoal text-[11px] leading-snug overflow-hidden"
                      style={{ display: "-webkit-box", WebkitLineClamp: 4, WebkitBoxOrient: "vertical" }}>
                      &ldquo;{review.text}&rdquo;
                    </p>
                    <p className="font-mont font-bold text-charcoal/50 text-[9px] tracking-widest uppercase text-right shrink-0 mt-0.5">
                      — {review.author}
                    </p>
                  </div>
                </div>
              </button>

              {/* Expanded cargo — slides into the reserved gap, same lane */}
              {isSelected && (
                <button
                  className="absolute focus:outline-none cursor-pointer"
                  style={{ left: xExpanded, top: expandedTop, width: EXPANDED_W }}
                  onClick={() => setSelected(null)}
                  title="Закрыть отзыв"
                >
                  <div className="relative w-full">
                    <img
                      src="/review-card-expanded.svg"
                      alt=""
                      className="w-full"
                      draggable={false}
                    />
                    {/* Text overlay (x=6–410, y=6–202 in 416×271 SVG) */}
                    <div
                      className="absolute flex flex-col justify-between overflow-hidden pointer-events-none"
                      style={{
                        left:            "3%",
                        top:             "3%",
                        width:           "93%",
                        height:          "70%",
                        backgroundColor: "#FCF9E9",
                        padding:         "8px 12px",
                      }}
                    >
                      <p className="font-mont text-charcoal text-[12px] leading-snug overflow-hidden"
                        style={{ display: "-webkit-box", WebkitLineClamp: 8, WebkitBoxOrient: "vertical" }}>
                        &ldquo;{review.text}&rdquo;
                      </p>
                      <p className="font-mont font-bold text-charcoal/50 text-[10px] tracking-widest uppercase text-right shrink-0 mt-1">
                        — {review.author}
                      </p>
                    </div>
                  </div>
                </button>
              )}

            </React.Fragment>
          );
        })}
      </div>
    </section>
  );
}
