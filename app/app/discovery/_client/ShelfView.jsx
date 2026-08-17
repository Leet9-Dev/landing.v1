"use client";
import { useState, useEffect, useRef, useCallback } from "react";
import { useRouter } from "next/navigation";

const ACTIVE_W = 152;
const ACTIVE_H = 218;
const SPINE_W = 22;
const SPINE_H = 196;
const GAP = 4;
const LIFT = 48;
const SHELF_H = 32;

// Platform bar styles — anni 2000 console aesthetic
const PLATFORM_STYLE = {
  steam: { barBg: "#1B2838", barText: "STEAM", barColor: "#A8C5E0", spineBg: "#0F1820" },
  psn:   { barBg: "#003087", barText: "PLAYSTATION", barColor: "#FFFFFF", spineBg: "#001A4A" },
  xbox:  { barBg: "#107C10", barText: "XBOX", barColor: "#FFFFFF", spineBg: "#073A07" },
  epic:  { barBg: "#1F1F1F", barText: "EPIC GAMES", barColor: "#CCCCCC", spineBg: "#111111" },
  gog:   { barBg: "#5612A0", barText: "GOG", barColor: "#FFFFFF", spineBg: "#2D0A60" },
};
const DEFAULT_PLATFORM = { barBg: "#1A1830", barText: "PC", barColor: "rgba(200,200,255,0.6)", spineBg: "#0D0D20" };

function getPlatformStyle(sourcePlatforms) {
  if (!sourcePlatforms?.length) return DEFAULT_PLATFORM;
  const priority = ["psn", "xbox", "steam", "gog", "epic"];
  for (const p of priority) {
    if (sourcePlatforms.includes(p)) return PLATFORM_STYLE[p] ?? DEFAULT_PLATFORM;
  }
  return DEFAULT_PLATFORM;
}

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

  const computeStripX = useCallback((idx, containerW) => {
    let xBefore = 0;
    for (let i = 0; i < idx; i++) xBefore += SPINE_W + GAP;
    const activeCenterX = xBefore + ACTIVE_W / 2;
    const target = containerW * 0.56;
    return target - activeCenterX;
  }, []);

  useEffect(() => {
    const el = containerRef.current;
    if (!el) return;
    const { width } = el.getBoundingClientRect();
    setStripX(computeStripX(selectedIdx, width));
  }, [selectedIdx, computeStripX]);

  useEffect(() => {
    const onKey = (e) => {
      if (e.key === "ArrowRight") setSelectedIdx((i) => Math.min(i + 1, games.length - 1));
      else if (e.key === "ArrowLeft") setSelectedIdx((i) => Math.max(i - 1, 0));
    };
    window.addEventListener("keydown", onKey);
    return () => window.removeEventListener("keydown", onKey);
  }, [games.length]);

  useEffect(() => {
    const el = containerRef.current;
    if (!el) return;
    const onWheel = (e) => {
      e.preventDefault();
      wheelAcc.current += e.deltaX || e.deltaY;
      clearTimeout(wheelTimer.current);
      wheelTimer.current = setTimeout(() => {
        if (wheelAcc.current > 40) setSelectedIdx((i) => Math.min(i + 1, games.length - 1));
        else if (wheelAcc.current < -40) setSelectedIdx((i) => Math.max(i - 1, 0));
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

  const onPointerUp = () => {
    if (!dragActive.current) return;
    dragActive.current = false;
    setDragging(false);

    const el = containerRef.current;
    if (!el) return;
    const { width } = el.getBoundingClientRect();
    const target = width * 0.56;
    const offsetInStrip = target - stripX;

    let best = 0, bestDist = Infinity;
    for (let i = 0; i < games.length; i++) {
      let caseLeft = 0;
      for (let j = 0; j < i; j++) caseLeft += SPINE_W + GAP;
      const caseCenter = caseLeft + (i === selectedIdx ? ACTIVE_W : SPINE_W) / 2;
      const d = Math.abs(caseCenter - offsetInStrip);
      if (d < bestDist) { bestDist = d; best = i; }
    }
    setSelectedIdx(best);
  };

  const selected = games[selectedIdx];
  const selectedPlatform = getPlatformStyle(selected?.sourcePlatforms);

  return (
    <div
      ref={containerRef}
      onPointerDown={onPointerDown}
      onPointerMove={onPointerMove}
      onPointerUp={onPointerUp}
      style={{
        position: "relative",
        height: "calc(100vh - 56px)",
        background: "#07080F",
        overflow: "hidden",
        userSelect: "none",
        cursor: dragging ? "grabbing" : "default",
        fontFamily: "'Outfit', system-ui, sans-serif",
      }}
    >
      {/* Ambient shelf glow — illuminates the cases from below */}
      <div style={{
        position: "absolute",
        bottom: SHELF_H,
        left: "30%",
        right: "10%",
        height: 200,
        background: "radial-gradient(ellipse at center bottom, rgba(200,160,60,0.08) 0%, transparent 70%)",
        pointerEvents: "none",
        zIndex: 1,
      }} />

      {/* Top header */}
      <div style={{
        position: "absolute",
        top: 0, left: 0, right: 0,
        padding: "18px 36px",
        display: "flex",
        justifyContent: "space-between",
        alignItems: "center",
        zIndex: 10,
        pointerEvents: "none",
        borderBottom: "1px solid rgba(255,255,255,0.04)",
      }}>
        <span style={{ fontSize: 9, fontWeight: 700, letterSpacing: "0.2em", color: "rgba(241,243,249,0.2)", fontFamily: "monospace" }}>
          GAME SHELF — INTERACTIVE LIBRARY
        </span>
        <span style={{ fontSize: 9, fontWeight: 700, letterSpacing: "0.2em", color: "rgba(241,243,249,0.2)", fontFamily: "monospace" }}>
          {String(games.length).padStart(2, "0")} TITLES / CONTINUOUS SHELF
        </span>
      </div>

      {/* Left info panel */}
      <div style={{
        position: "absolute",
        left: 52,
        top: "50%",
        transform: "translateY(-54%)",
        maxWidth: 260,
        zIndex: 20,
        paddingBottom: 72,
        pointerEvents: "none",
      }}>
        <div style={{
          fontSize: 9,
          fontWeight: 700,
          letterSpacing: "0.16em",
          color: selectedPlatform.barBg === "#003087"
            ? "rgba(100,140,255,0.7)"
            : selectedPlatform.barBg === "#107C10"
              ? "rgba(100,220,100,0.7)"
              : "rgba(200,160,60,0.7)",
          fontFamily: "monospace",
          marginBottom: 14,
          transition: "color 0.3s",
        }}>
          {String(selectedIdx + 1).padStart(2, "0")} / {String(games.length).padStart(2, "0")}
        </div>

        <h2 style={{
          fontSize: 42,
          fontWeight: 800,
          color: "#F1F3F9",
          lineHeight: 1.06,
          letterSpacing: "-0.03em",
          marginBottom: 12,
          textWrap: "balance",
        }}>
          {selected?.canonicalTitle ?? ""}
        </h2>

        {selected?.studio && (
          <div style={{
            fontSize: 11,
            fontWeight: 600,
            color: "rgba(241,243,249,0.35)",
            letterSpacing: "0.06em",
            textTransform: "uppercase",
            fontFamily: "monospace",
            marginBottom: 16,
          }}>
            {selected.studio}
          </div>
        )}

        {selected?.communityRating != null && (
          <div style={{ fontSize: 13, color: "#C8FF00", marginBottom: 22, fontWeight: 700, letterSpacing: "-0.01em" }}>
            ★ {selected.communityRating.toFixed(1)}
            <span style={{ fontSize: 10, color: "rgba(241,243,249,0.3)", fontWeight: 500, marginLeft: 8 }}>
              community rating
            </span>
          </div>
        )}

        <div style={{ display: "flex", gap: 8, flexWrap: "wrap", pointerEvents: "auto" }}>
          <button
            onClick={() => router.push(`/app/discovery/${selected?.id}`)}
            style={{
              fontSize: 11,
              fontWeight: 800,
              letterSpacing: "0.08em",
              color: "#07080F",
              background: "#C8FF00",
              border: "none",
              borderRadius: 6,
              padding: "8px 16px",
              cursor: "pointer",
              fontFamily: "'Outfit', sans-serif",
            }}
          >
            INSPECT ↗
          </button>
          {selected?.sourcePlatforms?.length > 0 && (
            <div style={{
              display: "flex",
              alignItems: "center",
              gap: 6,
              padding: "8px 12px",
              borderRadius: 6,
              border: "1px solid rgba(255,255,255,0.08)",
              background: "rgba(255,255,255,0.03)",
            }}>
              {selected.sourcePlatforms.slice(0, 3).map((p) => (
                <PlatformDot key={p} platform={p} />
              ))}
            </div>
          )}
        </div>
      </div>

      {/* Shelf + cases */}
      <div style={{
        position: "absolute",
        bottom: 0, left: 0, right: 0,
        height: ACTIVE_H + LIFT + 24 + SHELF_H,
        pointerEvents: "none",
        zIndex: 5,
      }}>
        {/* Cases strip */}
        <div style={{
          position: "absolute",
          bottom: SHELF_H,
          left: 0,
          display: "flex",
          alignItems: "flex-end",
          gap: GAP,
          transform: `translateX(${stripX}px)`,
          transition: dragging ? "none" : "transform 0.4s cubic-bezier(0.25, 0.46, 0.45, 0.94)",
          pointerEvents: "auto",
          willChange: "transform",
        }}>
          {games.map((game, i) => (
            <GameCase
              key={game.id}
              game={game}
              isActive={i === selectedIdx}
              dragDist={dragDist}
              onClick={() => setSelectedIdx(i)}
            />
          ))}
        </div>

        {/* Shelf plank */}
        <div style={{
          position: "absolute",
          bottom: 0, left: 0, right: 0,
          height: SHELF_H,
          background: "linear-gradient(180deg, #4A2E0A 0%, #2E1A04 55%, #1C0E02 100%)",
          boxShadow: "0 6px 32px rgba(0,0,0,0.8), inset 0 1px 0 rgba(180,120,40,0.25)",
          zIndex: 6,
        }}>
          <div style={{
            position: "absolute",
            top: 0, left: 0, right: 0, height: 1,
            background: "linear-gradient(90deg, transparent, rgba(200,140,40,0.4), transparent)",
          }} />
          <div style={{
            position: "absolute",
            top: 1, left: 0, right: 0, height: 1,
            background: "linear-gradient(90deg, transparent, rgba(200,140,40,0.15), transparent)",
          }} />
        </div>
      </div>

      {/* Controls hint */}
      <div style={{
        position: "absolute",
        bottom: 10,
        left: "50%",
        transform: "translateX(-50%)",
        fontSize: 8,
        fontWeight: 700,
        letterSpacing: "0.2em",
        color: "rgba(255,255,255,0.15)",
        fontFamily: "monospace",
        zIndex: 10,
        pointerEvents: "none",
        whiteSpace: "nowrap",
      }}>
        DRAG • SCROLL • ARROW KEYS
      </div>
    </div>
  );
}

function GameCase({ game, isActive, dragDist, onClick }) {
  const [hovered, setHovered] = useState(false);
  const platform = getPlatformStyle(game.sourcePlatforms);

  const handleClick = () => {
    if (dragDist.current > 8) return;
    onClick();
  };

  const lift = isActive ? LIFT : hovered ? 12 : 0;
  const w = isActive ? ACTIVE_W : SPINE_W;
  const h = isActive ? ACTIVE_H : hovered ? SPINE_H + 12 : SPINE_H;

  if (isActive) {
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
          transition: "all 0.35s cubic-bezier(0.34, 1.1, 0.64, 1)",
          cursor: "pointer",
          borderRadius: "3px 3px 0 0",
          overflow: "hidden",
          boxShadow: "0 20px 60px rgba(0,0,0,0.8), 0 4px 16px rgba(0,0,0,0.5), inset -1px 0 0 rgba(255,255,255,0.04)",
        }}
      >
        {/* Cover art or fallback */}
        {game.coverImageUrl ? (
          <img
            src={game.coverImageUrl}
            alt={game.canonicalTitle}
            draggable={false}
            style={{ width: "100%", height: "100%", objectFit: "cover", display: "block" }}
          />
        ) : (
          <div style={{
            width: "100%",
            height: "100%",
            background: `linear-gradient(160deg, ${platform.spineBg} 0%, ${platform.barBg} 100%)`,
            display: "flex",
            flexDirection: "column",
            alignItems: "center",
            justifyContent: "center",
            padding: "16px 12px",
          }}>
            <div style={{
              fontSize: 12,
              fontWeight: 800,
              color: "rgba(255,255,255,0.85)",
              textAlign: "center",
              letterSpacing: "-0.01em",
              lineHeight: 1.3,
            }}>
              {game.canonicalTitle}
            </div>
          </div>
        )}

        {/* Platform bar at top — anni 2000 style */}
        <div style={{
          position: "absolute",
          top: 0, left: 0, right: 0,
          height: 20,
          background: platform.barBg,
          display: "flex",
          alignItems: "center",
          padding: "0 7px",
          gap: 5,
        }}>
          <PlatformLogoMark platform={game.sourcePlatforms?.[0]} color={platform.barColor} />
          <span style={{
            fontSize: 6,
            fontWeight: 800,
            color: platform.barColor,
            letterSpacing: "0.18em",
            fontFamily: "monospace",
            opacity: 0.9,
          }}>
            {platform.barText}
          </span>
        </div>

        {/* Right edge shadow for 3D depth */}
        <div style={{
          position: "absolute",
          top: 0, right: 0, bottom: 0,
          width: 10,
          background: "linear-gradient(90deg, transparent, rgba(0,0,0,0.55))",
          pointerEvents: "none",
        }} />
        {/* Left edge highlight */}
        <div style={{
          position: "absolute",
          top: 0, left: 0, bottom: 0,
          width: 3,
          background: "linear-gradient(90deg, rgba(255,255,255,0.07), transparent)",
          pointerEvents: "none",
        }} />
        {/* Bottom edge */}
        <div style={{
          position: "absolute",
          bottom: 0, left: 0, right: 0,
          height: 4,
          background: "linear-gradient(180deg, transparent, rgba(0,0,0,0.4))",
          pointerEvents: "none",
        }} />
      </div>
    );
  }

  // Spine view (inactive)
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
        transition: "all 0.3s cubic-bezier(0.34, 1.1, 0.64, 1)",
        cursor: "pointer",
        borderRadius: "2px 2px 0 0",
        overflow: "hidden",
        background: platform.spineBg,
        boxShadow: hovered
          ? "0 8px 20px rgba(0,0,0,0.6), 1px 0 0 rgba(255,255,255,0.06)"
          : "0 4px 8px rgba(0,0,0,0.5), 1px 0 0 rgba(255,255,255,0.04)",
      }}
    >
      {/* Platform color bar at top */}
      <div style={{
        position: "absolute",
        top: 0, left: 0, right: 0,
        height: 18,
        background: platform.barBg,
      }} />

      {/* Spine title */}
      <div style={{
        position: "absolute",
        inset: 0,
        top: 18,
        display: "flex",
        alignItems: "center",
        justifyContent: "center",
        overflow: "hidden",
      }}>
        <span style={{
          writingMode: "vertical-rl",
          transform: "rotate(180deg)",
          fontSize: 7,
          fontWeight: 700,
          color: "rgba(255,255,255,0.65)",
          letterSpacing: "0.04em",
          fontFamily: "monospace",
          overflow: "hidden",
          textOverflow: "ellipsis",
          whiteSpace: "nowrap",
          maxHeight: "85%",
          lineHeight: 1,
        }}>
          {game.canonicalTitle}
        </span>
      </div>

      {/* Right edge highlight — makes it look like a separate disc case */}
      <div style={{
        position: "absolute",
        top: 0, right: 0, bottom: 0,
        width: 1,
        background: "rgba(255,255,255,0.06)",
        pointerEvents: "none",
      }} />
    </div>
  );
}

function PlatformLogoMark({ platform, color }) {
  const marks = {
    psn: "✦",
    xbox: "⊕",
    steam: "⊗",
    gog: "◈",
    epic: "◆",
  };
  return (
    <span style={{ fontSize: 8, color, opacity: 0.8, lineHeight: 1 }}>
      {marks[platform] ?? "◉"}
    </span>
  );
}

function PlatformDot({ platform }) {
  const colors = {
    steam: "#A8C5E0",
    psn: "#4A7FD4",
    xbox: "#52B043",
    gog: "#9B5FE0",
    epic: "#AAAAAA",
  };
  const labels = {
    steam: "Steam",
    psn: "PSN",
    xbox: "Xbox",
    gog: "GOG",
    epic: "Epic",
  };
  return (
    <div style={{ display: "flex", alignItems: "center", gap: 4 }}>
      <div style={{
        width: 6,
        height: 6,
        borderRadius: "50%",
        background: colors[platform] ?? "rgba(255,255,255,0.3)",
        flexShrink: 0,
      }} />
      <span style={{
        fontSize: 10,
        color: colors[platform] ?? "rgba(255,255,255,0.4)",
        fontWeight: 600,
        fontFamily: "monospace",
        letterSpacing: "0.04em",
      }}>
        {labels[platform] ?? platform.toUpperCase()}
      </span>
    </div>
  );
}
