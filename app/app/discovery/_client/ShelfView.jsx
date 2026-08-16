"use client";
import { useState, useEffect, useRef, useCallback } from "react";
import { useRouter } from "next/navigation";

const ACTIVE_W = 156;
const ACTIVE_H = 220;
const SPINE_W = 26;
const SPINE_H = 198;
const GAP = 3;
const LIFT = 46;
const SHELF_H = 30;

const PALETTES = [
  ["#6B1818", "#B02020"],
  ["#122B4A", "#1E5F99"],
  ["#143320", "#1D6B3B"],
  ["#3A1550", "#7B2FBE"],
  ["#5C2800", "#C05000"],
  ["#0A2D4A", "#0F5C8A"],
  ["#242424", "#3D3D3D"],
  ["#4D1020", "#9B1F42"],
  ["#192B1A", "#2D5E30"],
  ["#3B1200", "#7A2800"],
  ["#0D1B45", "#1A3A8C"],
  ["#2A0A40", "#5E1FA0"],
];

export default function ShelfView({ games }) {
  const router = useRouter();
  const containerRef = useRef(null);
  const [selectedIdx, setSelectedIdx] = useState(0);
  const [stripX, setStripX] = useState(0);
  const [dragging, setDragging] = useState(false);

  const dragActive = useRef(false);
  const dragStartX = useRef(0);
  const dragStartStripX = useRef(0);
  const dragDist = useRef(0);
  const wheelAcc = useRef(0);
  const wheelTimer = useRef(null);

  const computeStripX = useCallback(
    (idx, containerW) => {
      let xBefore = 0;
      for (let i = 0; i < idx; i++) xBefore += SPINE_W + GAP;
      const activeCenterX = xBefore + ACTIVE_W / 2;
      const target = containerW * 0.56;
      return target - activeCenterX;
    },
    []
  );

  // Re-center on selection change
  useEffect(() => {
    const el = containerRef.current;
    if (!el) return;
    const { width } = el.getBoundingClientRect();
    setStripX(computeStripX(selectedIdx, width));
  }, [selectedIdx, computeStripX]);

  // Arrow keys
  useEffect(() => {
    const onKey = (e) => {
      if (e.key === "ArrowRight")
        setSelectedIdx((i) => Math.min(i + 1, games.length - 1));
      else if (e.key === "ArrowLeft")
        setSelectedIdx((i) => Math.max(i - 1, 0));
    };
    window.addEventListener("keydown", onKey);
    return () => window.removeEventListener("keydown", onKey);
  }, [games.length]);

  // Wheel — debounced snap
  useEffect(() => {
    const el = containerRef.current;
    if (!el) return;
    const onWheel = (e) => {
      e.preventDefault();
      wheelAcc.current += e.deltaX || e.deltaY;
      clearTimeout(wheelTimer.current);
      wheelTimer.current = setTimeout(() => {
        if (wheelAcc.current > 40)
          setSelectedIdx((i) => Math.min(i + 1, games.length - 1));
        else if (wheelAcc.current < -40)
          setSelectedIdx((i) => Math.max(i - 1, 0));
        wheelAcc.current = 0;
      }, 60);
    };
    el.addEventListener("wheel", onWheel, { passive: false });
    return () => el.removeEventListener("wheel", onWheel);
  }, [games.length]);

  const onPointerDown = (e) => {
    if (e.button !== 0) return;
    dragActive.current = true;
    dragDist.current = 0;
    dragStartX.current = e.clientX;
    dragStartStripX.current = stripX;
    setDragging(true);
    e.currentTarget.setPointerCapture(e.pointerId);
  };

  const onPointerMove = (e) => {
    if (!dragActive.current) return;
    const dx = e.clientX - dragStartX.current;
    dragDist.current = Math.abs(dx);
    setStripX(dragStartStripX.current + dx);
  };

  const onPointerUp = (e) => {
    if (!dragActive.current) return;
    dragActive.current = false;
    setDragging(false);

    // Snap to nearest case
    const el = containerRef.current;
    if (!el) return;
    const { width } = el.getBoundingClientRect();
    const target = width * 0.56;
    const offsetInStrip = target - stripX;

    let best = 0;
    let bestDist = Infinity;
    for (let i = 0; i < games.length; i++) {
      let caseLeft = 0;
      for (let j = 0; j < i; j++) caseLeft += SPINE_W + GAP;
      const caseCenter = caseLeft + (i === selectedIdx ? ACTIVE_W : SPINE_W) / 2;
      const d = Math.abs(caseCenter - offsetInStrip);
      if (d < bestDist) {
        bestDist = d;
        best = i;
      }
    }
    setSelectedIdx(best);
  };

  const selected = games[selectedIdx];

  return (
    <div
      ref={containerRef}
      onPointerDown={onPointerDown}
      onPointerMove={onPointerMove}
      onPointerUp={onPointerUp}
      style={{
        position: "relative",
        height: "calc(100vh - 56px)",
        background: "#E8E3D8",
        overflow: "hidden",
        userSelect: "none",
        cursor: dragging ? "grabbing" : "default",
        fontFamily: "Georgia, 'Times New Roman', serif",
      }}
    >
      {/* Subtle paper texture overlay */}
      <div
        style={{
          position: "absolute",
          inset: 0,
          background:
            "radial-gradient(ellipse at 30% 40%, rgba(255,240,200,0.18) 0%, transparent 65%)",
          pointerEvents: "none",
          zIndex: 1,
        }}
      />

      {/* Top header strip */}
      <div
        style={{
          position: "absolute",
          top: 0,
          left: 0,
          right: 0,
          padding: "20px 36px",
          display: "flex",
          justifyContent: "space-between",
          alignItems: "center",
          zIndex: 10,
          pointerEvents: "none",
          borderBottom: "1px solid rgba(90,65,30,0.12)",
        }}
      >
        <span
          style={{
            fontSize: 8,
            fontWeight: 700,
            letterSpacing: "0.22em",
            color: "#9A7E56",
            fontFamily: "monospace",
          }}
        >
          GAME SHELF — AN INTERACTIVE GAME LIBRARY
        </span>
        <span
          style={{
            fontSize: 8,
            fontWeight: 700,
            letterSpacing: "0.22em",
            color: "#9A7E56",
            fontFamily: "monospace",
          }}
        >
          {String(games.length).padStart(2, "0")} VOLUMES / 01 CONTINUOUS SHELF
        </span>
      </div>

      {/* Left info panel */}
      <div
        style={{
          position: "absolute",
          left: 52,
          top: "50%",
          transform: "translateY(-54%)",
          maxWidth: 270,
          zIndex: 20,
          paddingBottom: 64,
        }}
      >
        <div
          style={{
            fontSize: 9,
            fontWeight: 700,
            letterSpacing: "0.16em",
            color: "#B8955C",
            fontFamily: "monospace",
            marginBottom: 14,
          }}
        >
          {String(selectedIdx + 1).padStart(2, "0")} / {String(games.length).padStart(2, "0")}
        </div>

        <h2
          style={{
            fontSize: 46,
            fontWeight: 400,
            color: "#1A0E05",
            lineHeight: 1.04,
            letterSpacing: "-0.03em",
            marginBottom: 14,
            textWrap: "balance",
          }}
        >
          {selected?.canonicalTitle ?? ""}
        </h2>

        {selected?.studio && (
          <div
            style={{
              fontSize: 10,
              fontWeight: 700,
              color: "#B8955C",
              letterSpacing: "0.12em",
              textTransform: "uppercase",
              fontFamily: "monospace",
              marginBottom: 18,
            }}
          >
            {selected.studio}
          </div>
        )}

        {selected?.communityRating != null && (
          <div
            style={{
              fontSize: 13,
              color: "#4A3010",
              marginBottom: 22,
              letterSpacing: "0.01em",
            }}
          >
            ★{" "}{selected.communityRating.toFixed(1)}
            <span
              style={{
                fontSize: 10,
                color: "#B8955C",
                fontFamily: "monospace",
                marginLeft: 8,
                letterSpacing: "0.08em",
              }}
            >
              COMMUNITY
            </span>
          </div>
        )}

        <button
          onClick={() => router.push(`/app/discovery/${selected?.id}`)}
          style={{
            fontSize: 9,
            fontWeight: 700,
            letterSpacing: "0.16em",
            color: "#1A0E05",
            background: "none",
            border: "none",
            borderBottom: "1px solid rgba(26,14,5,0.35)",
            paddingBottom: 2,
            padding: "0 0 2px",
            cursor: "pointer",
            fontFamily: "monospace",
          }}
        >
          INSPECT GAME ↗
        </button>
      </div>

      {/* Shelf + cases container */}
      <div
        style={{
          position: "absolute",
          bottom: 0,
          left: 0,
          right: 0,
          height: ACTIVE_H + LIFT + 24 + SHELF_H,
          pointerEvents: "none",
        }}
      >
        {/* Sliding cases strip */}
        <div
          style={{
            position: "absolute",
            bottom: SHELF_H,
            left: 0,
            display: "flex",
            alignItems: "flex-end",
            gap: GAP,
            transform: `translateX(${stripX}px)`,
            transition: dragging
              ? "none"
              : "transform 0.42s cubic-bezier(0.25, 0.46, 0.45, 0.94)",
            pointerEvents: "auto",
            willChange: "transform",
          }}
        >
          {games.map((game, i) => (
            <GameCase
              key={game.id}
              game={game}
              isActive={i === selectedIdx}
              palette={PALETTES[i % PALETTES.length]}
              dragDist={dragDist}
              onClick={() => setSelectedIdx(i)}
            />
          ))}
        </div>

        {/* Wooden shelf plank */}
        <div
          style={{
            position: "absolute",
            bottom: 0,
            left: 0,
            right: 0,
            height: SHELF_H,
            background:
              "linear-gradient(180deg, #A67C32 0%, #7C5814 50%, #5A3E08 100%)",
            boxShadow:
              "0 8px 28px rgba(0,0,0,0.4), inset 0 1px 0 rgba(255,210,90,0.25)",
            zIndex: 6,
          }}
        >
          <div
            style={{
              position: "absolute",
              top: 0,
              left: 0,
              right: 0,
              height: 2,
              background:
                "linear-gradient(90deg, transparent, rgba(255,215,80,0.5), transparent)",
            }}
          />
        </div>
      </div>

      {/* Bottom controls hint */}
      <div
        style={{
          position: "absolute",
          bottom: 9,
          left: "50%",
          transform: "translateX(-50%)",
          fontSize: 7,
          fontWeight: 700,
          letterSpacing: "0.22em",
          color: "rgba(255,255,255,0.55)",
          fontFamily: "monospace",
          zIndex: 10,
          pointerEvents: "none",
        }}
      >
        DRAG • SCROLL • ARROW KEYS
      </div>
    </div>
  );
}

function GameCase({ game, isActive, palette, dragDist, onClick }) {
  const [hovered, setHovered] = useState(false);

  const handleClick = () => {
    if (dragDist.current > 8) return;
    onClick();
  };

  const lift = isActive ? LIFT : hovered ? 10 : 0;
  const w = isActive ? ACTIVE_W : SPINE_W;
  const h = isActive ? ACTIVE_H : hovered ? SPINE_H + 10 : SPINE_H;

  return (
    <div
      onClick={handleClick}
      onMouseEnter={() => setHovered(true)}
      onMouseLeave={() => setHovered(false)}
      style={{
        flexShrink: 0,
        width: w,
        height: h,
        position: "relative",
        transform: `translateY(-${lift}px)`,
        transition: "all 0.32s cubic-bezier(0.34, 1.12, 0.64, 1)",
        cursor: "pointer",
        borderRadius: isActive ? "3px 3px 0 0" : "2px 2px 0 0",
        boxShadow: isActive
          ? "8px 0 28px rgba(0,0,0,0.55), -4px 0 10px rgba(0,0,0,0.22), inset -3px 0 8px rgba(0,0,0,0.2)"
          : hovered
            ? "4px 0 14px rgba(0,0,0,0.35)"
            : "2px 0 6px rgba(0,0,0,0.28)",
        overflow: "hidden",
        background:
          isActive && game.coverImageUrl
            ? "#000"
            : `linear-gradient(162deg, ${palette[0]} 0%, ${palette[1]} 100%)`,
      }}
    >
      {isActive ? (
        game.coverImageUrl ? (
          <>
            <img
              src={game.coverImageUrl}
              alt={game.canonicalTitle}
              draggable={false}
              style={{
                width: "100%",
                height: "100%",
                objectFit: "cover",
                display: "block",
              }}
            />
            {/* Subtle spine shadow on right edge */}
            <div
              style={{
                position: "absolute",
                top: 0,
                right: 0,
                width: 10,
                height: "100%",
                background:
                  "linear-gradient(90deg, transparent, rgba(0,0,0,0.35))",
                pointerEvents: "none",
              }}
            />
          </>
        ) : (
          <div
            style={{
              width: "100%",
              height: "100%",
              display: "flex",
              flexDirection: "column",
              alignItems: "center",
              justifyContent: "flex-end",
              padding: "14px 10px",
              background: `linear-gradient(162deg, ${palette[0]}, ${palette[1]})`,
            }}
          >
            <div
              style={{
                fontSize: 11,
                fontWeight: 700,
                color: "rgba(255,255,255,0.9)",
                textAlign: "center",
                fontFamily: "Georgia, serif",
                lineHeight: 1.3,
              }}
            >
              {game.canonicalTitle}
            </div>
          </div>
        )
      ) : (
        /* Spine */
        <div
          style={{
            position: "absolute",
            inset: 0,
            display: "flex",
            alignItems: "center",
            justifyContent: "center",
            overflow: "hidden",
          }}
        >
          <span
            style={{
              writingMode: "vertical-rl",
              transform: "rotate(180deg)",
              fontSize: 7,
              fontWeight: 700,
              color: "rgba(255,255,255,0.75)",
              letterSpacing: "0.06em",
              fontFamily: "monospace",
              textAlign: "center",
              overflow: "hidden",
              textOverflow: "ellipsis",
              whiteSpace: "nowrap",
              maxHeight: "80%",
              lineHeight: 1,
            }}
          >
            {game.canonicalTitle}
          </span>
        </div>
      )}
    </div>
  );
}
