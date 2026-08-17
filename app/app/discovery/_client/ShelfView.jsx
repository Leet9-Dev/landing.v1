"use client";
import { useState, useEffect, useRef, useCallback } from "react";
import { useRouter } from "next/navigation";

const FRONT_W = 198;
const FRONT_H = 278;
const SIDE_W = 24;
const ACTIVE_W = FRONT_W + SIDE_W;
const ACTIVE_H = FRONT_H;
const SPINE_W = 34;
const SPINE_H = 254;
const GAP = 5;
const LIFT = 64;
const SHELF_H = 38;

const PLATFORM_STYLE = {
  steam: { barBg: "#1B2838", barText: "STEAM",       barColor: "#C7D5E0", spineBg: "#101820", sideColor: "#0A1018" },
  psn:   { barBg: "#003087", barText: "PLAYSTATION",  barColor: "#FFFFFF", spineBg: "#001A55", sideColor: "#000E35" },
  xbox:  { barBg: "#0E6B0E", barText: "XBOX",         barColor: "#FFFFFF", spineBg: "#073507", sideColor: "#041F04" },
  epic:  { barBg: "#202020", barText: "EPIC GAMES",   barColor: "#CCCCCC", spineBg: "#141414", sideColor: "#0A0A0A" },
  gog:   { barBg: "#4A12A0", barText: "GOG",          barColor: "#FFFFFF", spineBg: "#280A60", sideColor: "#180640" },
};
const DEFAULT_PLATFORM = { barBg: "#181828", barText: "PC", barColor: "rgba(180,180,255,0.7)", spineBg: "#0D0D20", sideColor: "#070712" };

// Steam header.jpg is landscape — swap to portrait library_600x900.jpg for game cases
function getPortraitCover(url) {
  if (!url) return null;
  if (url.includes("steamstatic.com") && url.includes("/header.jpg")) {
    return url.replace("/header.jpg", "/library_600x900.jpg");
  }
  return url;
}

function getPlatform(sourcePlatforms) {
  if (!sourcePlatforms?.length) return DEFAULT_PLATFORM;
  for (const p of ["psn", "xbox", "steam", "gog", "epic"]) {
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
    return containerW * 0.56 - activeCenterX;
  }, []);

  useEffect(() => {
    const el = containerRef.current;
    if (!el) return;
    setStripX(computeStripX(selectedIdx, el.getBoundingClientRect().width));
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
  const selPlatform = getPlatform(selected?.sourcePlatforms);

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
      {/* Ambient glow under shelf */}
      <div style={{
        position: "absolute",
        bottom: SHELF_H,
        left: "20%",
        right: "5%",
        height: 280,
        background: "radial-gradient(ellipse at 60% 100%, rgba(180,140,50,0.1) 0%, transparent 65%)",
        pointerEvents: "none",
        zIndex: 1,
      }} />

      {/* Header */}
      <div style={{
        position: "absolute",
        top: 0, left: 0, right: 0,
        padding: "18px 36px",
        display: "flex",
        justifyContent: "space-between",
        zIndex: 10,
        pointerEvents: "none",
        borderBottom: "1px solid rgba(255,255,255,0.04)",
      }}>
        <span style={{ fontSize: 9, fontWeight: 700, letterSpacing: "0.2em", color: "rgba(241,243,249,0.18)", fontFamily: "monospace" }}>
          GAME SHELF — INTERACTIVE LIBRARY
        </span>
        <span style={{ fontSize: 9, fontWeight: 700, letterSpacing: "0.2em", color: "rgba(241,243,249,0.18)", fontFamily: "monospace" }}>
          {String(games.length).padStart(2, "0")} TITLES
        </span>
      </div>

      {/* Left info panel */}
      <div style={{
        position: "absolute",
        left: 52,
        top: "50%",
        transform: "translateY(-52%)",
        maxWidth: 260,
        zIndex: 20,
        paddingBottom: 80,
        pointerEvents: "none",
      }}>
        <div style={{
          fontSize: 9,
          fontWeight: 700,
          letterSpacing: "0.16em",
          color: selPlatform.barBg === "#003087" ? "rgba(120,160,255,0.8)"
            : selPlatform.barBg === "#0E6B0E" ? "rgba(100,220,100,0.8)"
            : "rgba(200,160,60,0.7)",
          fontFamily: "monospace",
          marginBottom: 14,
          transition: "color 0.3s",
        }}>
          {String(selectedIdx + 1).padStart(2, "0")} / {String(games.length).padStart(2, "0")}
        </div>

        <h2 style={{
          fontSize: 44,
          fontWeight: 800,
          color: "#F1F3F9",
          lineHeight: 1.05,
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
            color: "rgba(241,243,249,0.32)",
            letterSpacing: "0.07em",
            textTransform: "uppercase",
            fontFamily: "monospace",
            marginBottom: 16,
          }}>
            {selected.studio}
          </div>
        )}

        {selected?.communityRating != null && (
          <div style={{ fontSize: 13, color: "#C8FF00", marginBottom: 22, fontWeight: 700 }}>
            ★ {selected.communityRating.toFixed(1)}
            <span style={{ fontSize: 11, color: "rgba(241,243,249,0.28)", fontWeight: 500, marginLeft: 8 }}>
              community
            </span>
          </div>
        )}

        <button
          onClick={() => router.push(`/app/discovery/${selected?.id}`)}
          style={{
            pointerEvents: "auto",
            fontSize: 12,
            fontWeight: 800,
            letterSpacing: "0.06em",
            color: "#07080F",
            background: "#C8FF00",
            border: "none",
            borderRadius: 8,
            padding: "10px 20px",
            cursor: "pointer",
            fontFamily: "'Outfit', sans-serif",
          }}
        >
          INSPECT ↗
        </button>
      </div>

      {/* Shelf + cases */}
      <div style={{
        position: "absolute",
        bottom: 0, left: 0, right: 0,
        height: ACTIVE_H + LIFT + 32 + SHELF_H,
        pointerEvents: "none",
        zIndex: 5,
      }}>
        {/* Sliding strip */}
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
          background: "linear-gradient(180deg, #52340C 0%, #321E06 55%, #1C1002 100%)",
          boxShadow: "0 8px 40px rgba(0,0,0,0.9), inset 0 1px 0 rgba(200,140,40,0.3), inset 0 2px 0 rgba(200,140,40,0.12)",
          zIndex: 6,
        }}>
          <div style={{
            position: "absolute",
            top: 0, left: 0, right: 0, height: 1,
            background: "linear-gradient(90deg, transparent 0%, rgba(210,150,50,0.5) 40%, rgba(210,150,50,0.5) 60%, transparent 100%)",
          }} />
        </div>
      </div>

      {/* Controls hint */}
      <div style={{
        position: "absolute",
        bottom: 11,
        left: "50%",
        transform: "translateX(-50%)",
        fontSize: 8,
        fontWeight: 700,
        letterSpacing: "0.2em",
        color: "rgba(255,255,255,0.12)",
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
  const [imgSrc, setImgSrc] = useState(() => getPortraitCover(game.coverImageUrl));
  const platform = getPlatform(game.sourcePlatforms);

  const handleClick = () => {
    if (dragDist.current > 8) return;
    onClick();
  };

  if (isActive) {
    return (
      <div
        onClick={handleClick}
        style={{
          flexShrink: 0,
          width: ACTIVE_W,
          height: ACTIVE_H,
          display: "flex",
          alignItems: "stretch",
          transform: `translateY(-${LIFT}px)`,
          transition: "transform 0.38s cubic-bezier(0.34, 1.1, 0.64, 1)",
          cursor: "pointer",
          filter: "drop-shadow(0 24px 48px rgba(0,0,0,0.9)) drop-shadow(0 8px 16px rgba(0,0,0,0.6))",
        }}
      >
        {/* Front face */}
        <div style={{
          width: FRONT_W,
          height: FRONT_H,
          flexShrink: 0,
          position: "relative",
          overflow: "hidden",
          borderRadius: "3px 0 0 0",
          background: platform.spineBg,
        }}>
          {/* Cover image or fallback */}
          {imgSrc ? (
            <img
              src={imgSrc}
              alt={game.canonicalTitle}
              draggable={false}
              onError={() => {
                // portrait not available — try original URL, then fallback
                if (imgSrc !== game.coverImageUrl) setImgSrc(game.coverImageUrl);
                else setImgSrc(null);
              }}
              style={{ width: "100%", height: "100%", objectFit: "cover", display: "block" }}
            />
          ) : (
            <FallbackCover game={game} platform={platform} />
          )}

          {/* Platform bar at top */}
          <div style={{
            position: "absolute",
            top: 0, left: 0, right: 0,
            height: 22,
            background: platform.barBg,
            display: "flex",
            alignItems: "center",
            padding: "0 8px",
            gap: 5,
          }}>
            <span style={{ fontSize: 7, fontWeight: 900, color: platform.barColor, letterSpacing: "0.2em", fontFamily: "monospace", opacity: 0.9 }}>
              {platform.barText}
            </span>
          </div>

          {/* Left edge highlight */}
          <div style={{
            position: "absolute",
            top: 0, left: 0, bottom: 0, width: 2,
            background: "linear-gradient(90deg, rgba(255,255,255,0.12), transparent)",
            pointerEvents: "none",
          }} />
          {/* Bottom edge shadow */}
          <div style={{
            position: "absolute",
            bottom: 0, left: 0, right: 0, height: 6,
            background: "linear-gradient(180deg, transparent, rgba(0,0,0,0.5))",
            pointerEvents: "none",
          }} />
        </div>

        {/* Side face (spine / 3D depth) */}
        <div style={{
          width: SIDE_W,
          height: FRONT_H,
          flexShrink: 0,
          background: `linear-gradient(90deg, ${platform.sideColor} 0%, #000 100%)`,
          borderRadius: "0 3px 0 0",
          display: "flex",
          flexDirection: "column",
          alignItems: "center",
          overflow: "hidden",
          position: "relative",
        }}>
          {/* Platform bar continuation */}
          <div style={{
            width: "100%",
            height: 22,
            background: platform.barBg,
            filter: "brightness(0.65)",
            flexShrink: 0,
          }} />
          {/* Title on spine */}
          <div style={{
            flex: 1,
            display: "flex",
            alignItems: "center",
            justifyContent: "center",
            overflow: "hidden",
            padding: "4px 2px",
          }}>
            <span style={{
              writingMode: "vertical-rl",
              transform: "rotate(180deg)",
              fontSize: 7,
              fontWeight: 700,
              color: "rgba(255,255,255,0.4)",
              letterSpacing: "0.06em",
              fontFamily: "monospace",
              overflow: "hidden",
              textOverflow: "ellipsis",
              whiteSpace: "nowrap",
              maxHeight: "80%",
              lineHeight: 1,
            }}>
              {game.canonicalTitle}
            </span>
          </div>
          {/* Right edge shadow */}
          <div style={{
            position: "absolute",
            top: 0, right: 0, bottom: 0, width: 2,
            background: "rgba(0,0,0,0.6)",
          }} />
        </div>
      </div>
    );
  }

  // Inactive spine
  const lift = hovered ? 14 : 0;
  const h = hovered ? SPINE_H + 14 : SPINE_H;

  return (
    <div
      onClick={handleClick}
      onMouseEnter={() => setHovered(true)}
      onMouseLeave={() => setHovered(false)}
      style={{
        flexShrink: 0,
        width: SPINE_W,
        height: h,
        position: "relative",
        transform: `translateY(-${lift}px)`,
        transition: "all 0.28s cubic-bezier(0.34, 1.1, 0.64, 1)",
        cursor: "pointer",
        borderRadius: "2px 2px 0 0",
        overflow: "hidden",
        background: platform.spineBg,
        boxShadow: hovered
          ? "0 12px 28px rgba(0,0,0,0.7), 1px 0 0 rgba(255,255,255,0.07)"
          : "0 4px 10px rgba(0,0,0,0.6), 1px 0 0 rgba(255,255,255,0.04)",
      }}
    >
      {/* Platform bar at top */}
      <div style={{
        position: "absolute",
        top: 0, left: 0, right: 0,
        height: 22,
        background: platform.barBg,
      }} />

      {/* Game title — vertical */}
      <div style={{
        position: "absolute",
        inset: 0,
        top: 22,
        display: "flex",
        alignItems: "center",
        justifyContent: "center",
        overflow: "hidden",
      }}>
        <span style={{
          writingMode: "vertical-rl",
          transform: "rotate(180deg)",
          fontSize: 8,
          fontWeight: 700,
          color: "rgba(255,255,255,0.6)",
          letterSpacing: "0.05em",
          fontFamily: "monospace",
          overflow: "hidden",
          textOverflow: "ellipsis",
          whiteSpace: "nowrap",
          maxHeight: "82%",
          lineHeight: 1,
        }}>
          {game.canonicalTitle}
        </span>
      </div>

      {/* Right edge separator */}
      <div style={{
        position: "absolute",
        top: 0, right: 0, bottom: 0, width: 1,
        background: "rgba(255,255,255,0.05)",
      }} />
    </div>
  );
}

function FallbackCover({ game, platform }) {
  return (
    <div style={{
      width: "100%",
      height: "100%",
      background: `linear-gradient(145deg, ${platform.spineBg} 0%, ${platform.barBg} 60%, ${platform.sideColor} 100%)`,
      display: "flex",
      flexDirection: "column",
      alignItems: "center",
      justifyContent: "space-between",
      padding: "32px 16px 20px",
      position: "relative",
      overflow: "hidden",
    }}>
      {/* Decorative background shape */}
      <div style={{
        position: "absolute",
        top: "20%",
        left: "50%",
        transform: "translateX(-50%)",
        width: 120,
        height: 120,
        borderRadius: "50%",
        background: "rgba(255,255,255,0.03)",
        border: "1px solid rgba(255,255,255,0.06)",
      }} />
      <div style={{
        position: "absolute",
        top: "25%",
        left: "50%",
        transform: "translateX(-50%)",
        width: 80,
        height: 80,
        borderRadius: "50%",
        border: "1px solid rgba(255,255,255,0.05)",
      }} />

      {/* Game title — big */}
      <div style={{
        position: "relative",
        zIndex: 1,
        marginTop: "auto",
        textAlign: "center",
      }}>
        <div style={{
          fontSize: 18,
          fontWeight: 900,
          color: "rgba(255,255,255,0.92)",
          lineHeight: 1.15,
          letterSpacing: "-0.02em",
          fontFamily: "'Outfit', sans-serif",
          textShadow: "0 2px 8px rgba(0,0,0,0.5)",
        }}>
          {game.canonicalTitle}
        </div>
        {game.studio && (
          <div style={{
            fontSize: 9,
            fontWeight: 600,
            color: "rgba(255,255,255,0.35)",
            letterSpacing: "0.1em",
            textTransform: "uppercase",
            fontFamily: "monospace",
            marginTop: 8,
          }}>
            {game.studio}
          </div>
        )}
      </div>
    </div>
  );
}
