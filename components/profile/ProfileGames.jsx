"use client";
import { useState, useEffect, useCallback } from "react";
import { useRouter } from "next/navigation";

const SORTS = [
  { id: "lastPlayed", label: "Last Played" },
  { id: "l9Points", label: "L9 Points" },
  { id: "hoursPlayed", label: "Hours" },
  { id: "mastery", label: "Mastery" },
];

const SOURCES = [
  { id: "", label: "All Platforms" },
  { id: "steam", label: "Steam" },
  { id: "psn", label: "PSN" },
];

export function ProfileGames() {
  const router = useRouter();
  const [games, setGames] = useState([]);
  const [loading, setLoading] = useState(true);
  const [q, setQ] = useState("");
  const [source, setSource] = useState("");
  const [sort, setSort] = useState("lastPlayed");

  const fetchGames = useCallback(async () => {
    setLoading(true);
    const params = new URLSearchParams({ sort, inProfile: "true" });
    if (q) params.set("q", q);
    if (source) params.set("source", source);
    const res = await fetch(`/api/me/games?${params}`);
    const json = await res.json();
    if (json.ok) setGames(json.data.games);
    setLoading(false);
  }, [q, source, sort]);

  useEffect(() => {
    const t = setTimeout(fetchGames, q ? 300 : 0);
    return () => clearTimeout(t);
  }, [fetchGames, q]);

  return (
    <div>
      {/* Filters */}
      <div style={{ display: "flex", gap: 10, marginBottom: 20, flexWrap: "wrap", alignItems: "center" }}>
        <div style={{ position: "relative", flex: "1 1 220px", maxWidth: 320 }}>
          <span style={{ position: "absolute", left: 12, top: "50%", transform: "translateY(-50%)", fontSize: 14, opacity: 0.3 }}>⌕</span>
          <input
            type="text"
            placeholder="Search your games…"
            value={q}
            onChange={(e) => setQ(e.target.value)}
            style={{
              width: "100%",
              padding: "9px 12px 9px 34px",
              borderRadius: 9,
              border: "1px solid rgba(255,255,255,0.1)",
              background: "rgba(255,255,255,0.04)",
              color: "#F1F3F9",
              fontFamily: "'Outfit', sans-serif",
              fontSize: 13,
              outline: "none",
            }}
          />
        </div>

        {SOURCES.map((s) => (
          <FilterChip key={s.id} active={source === s.id} onClick={() => setSource(s.id)}>
            {s.label}
          </FilterChip>
        ))}

        <div style={{ width: 1, height: 24, background: "rgba(255,255,255,0.08)" }} />

        {SORTS.map((s) => (
          <FilterChip key={s.id} active={sort === s.id} onClick={() => setSort(s.id)}>
            {s.label}
          </FilterChip>
        ))}
      </div>

      {loading ? (
        <LoadingGrid />
      ) : games.length === 0 ? (
        <EmptyState query={q} />
      ) : (
        <div style={{ display: "grid", gridTemplateColumns: "repeat(auto-fill, minmax(260px, 1fr))", gap: 14 }}>
          {games.map((ug) => (
            <ProfileGameCard key={ug.gameId} userGame={ug} onClick={() => router.push(`/app/discovery/${ug.gameId}`)} />
          ))}
        </div>
      )}
    </div>
  );
}

function ProfileGameCard({ userGame, onClick }) {
  const { game } = userGame;
  return (
    <div
      onClick={onClick}
      style={{
        borderRadius: 12,
        overflow: "hidden",
        cursor: "pointer",
        border: "1px solid rgba(255,255,255,0.07)",
        background: "#0A0C14",
        transition: "border-color 0.15s",
      }}
      onMouseEnter={(e) => (e.currentTarget.style.borderColor = "rgba(200,255,0,0.2)")}
      onMouseLeave={(e) => (e.currentTarget.style.borderColor = "rgba(255,255,255,0.07)")}
    >
      <div style={{
        height: 64,
        background: game.coverGradient,
        display: "flex",
        alignItems: "flex-end",
        justifyContent: "flex-end",
        padding: "8px 10px",
        gap: 4,
      }}>
        {userGame.sourcePlatforms.map((p) => (
          <span key={p} style={{
            fontSize: 9,
            fontWeight: 700,
            padding: "2px 6px",
            borderRadius: 4,
            background: "rgba(0,0,0,0.45)",
            color: p === "steam" ? "#b9d8f5" : "#c8aaff",
            letterSpacing: "0.06em",
          }}>
            {p === "steam" ? "STEAM" : "PSN"}
          </span>
        ))}
      </div>

      <div style={{ padding: "12px 14px 14px" }}>
        <div style={{ fontSize: 13, fontWeight: 700, color: "#F1F3F9", marginBottom: 10, letterSpacing: "-0.01em" }}>
          {game.canonicalTitle}
        </div>

        <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: 8, marginBottom: 10 }}>
          <Stat label="L9 Points" value={userGame.l9Points.toLocaleString()} accent />
          <Stat label="Hours" value={userGame.hoursPlayed.toFixed(0)} />
          <Stat label="Achievements" value={`${userGame.achievementsUnlocked}/${userGame.achievementsTotal}`} />
          <Stat label="Mastery" value={`${userGame.masteryPct.toFixed(0)}%`} />
        </div>

        <div style={{ fontSize: 10, color: "rgba(241,243,249,0.25)" }}>
          Last played {new Date(userGame.lastPlayedAt).toLocaleDateString()}
        </div>
      </div>
    </div>
  );
}

function Stat({ label, value, accent }) {
  return (
    <div>
      <div style={{ fontSize: 13, fontWeight: 800, color: accent ? "#C8FF00" : "#F1F3F9", letterSpacing: "-0.01em" }}>
        {value}
      </div>
      <div style={{ fontSize: 9, color: "rgba(241,243,249,0.3)", fontWeight: 600, letterSpacing: "0.04em", textTransform: "uppercase" }}>
        {label}
      </div>
    </div>
  );
}

function FilterChip({ active, onClick, children }) {
  return (
    <button
      onClick={onClick}
      style={{
        padding: "7px 14px",
        borderRadius: 99,
        border: `1px solid ${active ? "rgba(200,255,0,0.4)" : "rgba(255,255,255,0.09)"}`,
        background: active ? "rgba(200,255,0,0.08)" : "transparent",
        color: active ? "#C8FF00" : "rgba(241,243,249,0.45)",
        fontFamily: "'Outfit', sans-serif",
        fontSize: 12,
        fontWeight: active ? 700 : 500,
        cursor: "pointer",
        transition: "all 0.15s",
      }}
    >
      {children}
    </button>
  );
}

function LoadingGrid() {
  return (
    <div style={{ display: "grid", gridTemplateColumns: "repeat(auto-fill, minmax(260px, 1fr))", gap: 14 }}>
      {Array.from({ length: 3 }).map((_, i) => (
        <div key={i} style={{
          height: 180,
          borderRadius: 12,
          border: "1px solid rgba(255,255,255,0.07)",
          background: "#0A0C14",
          animation: "pulse 1.4s ease infinite",
          animationDelay: `${i * 0.1}s`,
        }} />
      ))}
      <style>{`@keyframes pulse { 0%,100%{opacity:1;} 50%{opacity:0.5;} }`}</style>
    </div>
  );
}

function EmptyState({ query }) {
  return (
    <div style={{
      textAlign: "center",
      padding: "72px 40px",
      border: "1px dashed rgba(255,255,255,0.08)",
      borderRadius: 16,
    }}>
      <div style={{ fontSize: 32, marginBottom: 12, opacity: 0.2 }}>◉</div>
      <div style={{ fontSize: 16, fontWeight: 700, color: "rgba(241,243,249,0.5)", marginBottom: 6 }}>
        No games in your profile yet
      </div>
      <div style={{ fontSize: 13, color: "rgba(241,243,249,0.25)" }}>
        {query ? `No results for "${query}"` : "Add games to your profile from Discovery."}
      </div>
    </div>
  );
}
