"use client";
import { useState, useEffect, useCallback } from "react";
import { useRouter } from "next/navigation";

const SORTS = [
  { id: "trending", label: "Trending" },
  { id: "rating", label: "Top Rated" },
  { id: "players", label: "Most Played" },
  { id: "recent", label: "Recently Detected" },
];

const SOURCES = [
  { id: "", label: "All Platforms" },
  { id: "steam", label: "Steam" },
  { id: "psn", label: "PSN" },
];

export default function DiscoveryPage() {
  const router = useRouter();
  const [games, setGames] = useState([]);
  const [stats, setStats] = useState(null);
  const [loading, setLoading] = useState(true);
  const [q, setQ] = useState("");
  const [source, setSource] = useState("");
  const [sort, setSort] = useState("trending");
  const [recentOnly, setRecentOnly] = useState(false);

  const fetchGames = useCallback(async () => {
    setLoading(true);
    const params = new URLSearchParams({ sort });
    if (q) params.set("q", q);
    if (source) params.set("source", source);
    if (recentOnly) params.set("recentOnly", "true");
    const res = await fetch(`/api/discovery/games?${params}`);
    const json = await res.json();
    if (json.ok) {
      setGames(json.data.games);
      setStats(json.data.stats);
    }
    setLoading(false);
  }, [q, source, sort, recentOnly]);

  useEffect(() => {
    const t = setTimeout(fetchGames, q ? 300 : 0);
    return () => clearTimeout(t);
  }, [fetchGames, q]);

  const trending = games.filter((g) => g.trendingRank !== null);
  const recent = games.filter((g) => g.recentlyDetected && g.trendingRank === null);
  const rest = games.filter((g) => !g.recentlyDetected && g.trendingRank === null);
  const isFiltered = !!(q || source || recentOnly);

  return (
    <div style={{ padding: "36px 32px", fontFamily: "'Outfit', sans-serif" }}>
      {/* Header */}
      <div style={{ marginBottom: 28 }}>
        <h1 style={{ fontSize: 26, fontWeight: 800, color: "#F1F3F9", letterSpacing: "-0.02em", marginBottom: 6 }}>
          Discovery
        </h1>
        {stats && (
          <p style={{ fontSize: 13, color: "rgba(241,243,249,0.38)", fontWeight: 500 }}>
            {stats.totalGames} games in catalogue · community stats from Steam & PSN
          </p>
        )}
      </div>

      {/* Filters */}
      <div style={{ display: "flex", gap: 10, marginBottom: 28, flexWrap: "wrap", alignItems: "center" }}>
        {/* Search */}
        <div style={{ position: "relative", flex: "1 1 240px", maxWidth: 340 }}>
          <span style={{ position: "absolute", left: 12, top: "50%", transform: "translateY(-50%)", fontSize: 14, opacity: 0.3 }}>⌕</span>
          <input
            type="text"
            placeholder="Search games, studios, genres…"
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

        {/* Platform filter */}
        {SOURCES.map((s) => (
          <FilterChip key={s.id} active={source === s.id} onClick={() => setSource(s.id)}>
            {s.label}
          </FilterChip>
        ))}

        <div style={{ width: 1, height: 24, background: "rgba(255,255,255,0.08)" }} />

        {/* Sort */}
        {SORTS.map((s) => (
          <FilterChip key={s.id} active={sort === s.id} onClick={() => setSort(s.id)} accent>
            {s.label}
          </FilterChip>
        ))}

        <div style={{ width: 1, height: 24, background: "rgba(255,255,255,0.08)" }} />

        {/* Recently detected toggle */}
        <FilterChip active={recentOnly} onClick={() => setRecentOnly((v) => !v)} accent={false} dot>
          New Detections
        </FilterChip>
      </div>

      {loading ? (
        <LoadingGrid />
      ) : games.length === 0 ? (
        <EmptyState query={q} />
      ) : isFiltered ? (
        <GameGrid games={games} onSelect={(g) => router.push(`/app/discovery/${g.id}`)} />
      ) : (
        <>
          {trending.length > 0 && (
            <Section title="Trending Now" badge={`${trending.length}`}>
              <GameGrid games={trending} onSelect={(g) => router.push(`/app/discovery/${g.id}`)} />
            </Section>
          )}
          {recent.length > 0 && (
            <Section title="Recently Detected" badge="New">
              <GameGrid games={recent} onSelect={(g) => router.push(`/app/discovery/${g.id}`)} />
            </Section>
          )}
          {rest.length > 0 && (
            <Section title="All Games">
              <GameGrid games={rest} onSelect={(g) => router.push(`/app/discovery/${g.id}`)} />
            </Section>
          )}
        </>
      )}
    </div>
  );
}

function FilterChip({ active, onClick, children, accent, dot }) {
  return (
    <button
      onClick={onClick}
      style={{
        padding: "7px 14px",
        borderRadius: 99,
        border: `1px solid ${active ? (accent === false ? "rgba(200,255,0,0.4)" : "rgba(200,255,0,0.4)") : "rgba(255,255,255,0.09)"}`,
        background: active ? "rgba(200,255,0,0.08)" : "transparent",
        color: active ? "#C8FF00" : "rgba(241,243,249,0.45)",
        fontFamily: "'Outfit', sans-serif",
        fontSize: 12,
        fontWeight: active ? 700 : 500,
        cursor: "pointer",
        transition: "all 0.15s",
        display: "flex",
        alignItems: "center",
        gap: 5,
      }}
    >
      {dot && (
        <span style={{
          width: 6,
          height: 6,
          borderRadius: "50%",
          background: active ? "#C8FF00" : "rgba(200,255,0,0.3)",
          flexShrink: 0,
        }} />
      )}
      {children}
    </button>
  );
}

function Section({ title, badge, children }) {
  return (
    <div style={{ marginBottom: 40 }}>
      <div style={{ display: "flex", alignItems: "center", gap: 10, marginBottom: 16 }}>
        <h2 style={{ fontSize: 15, fontWeight: 700, color: "rgba(241,243,249,0.8)", letterSpacing: "-0.01em" }}>
          {title}
        </h2>
        {badge && (
          <span style={{
            padding: "2px 8px",
            borderRadius: 99,
            background: "rgba(200,255,0,0.08)",
            border: "1px solid rgba(200,255,0,0.2)",
            fontSize: 10,
            fontWeight: 700,
            color: "#C8FF00",
            letterSpacing: "0.08em",
          }}>
            {badge}
          </span>
        )}
        <div style={{ flex: 1, height: 1, background: "rgba(255,255,255,0.05)" }} />
      </div>
      {children}
    </div>
  );
}

function GameGrid({ games, onSelect }) {
  return (
    <div style={{
      display: "grid",
      gridTemplateColumns: "repeat(auto-fill, minmax(200px, 1fr))",
      gap: 14,
    }}>
      {games.map((game) => (
        <GameCard key={game.id} game={game} onClick={() => onSelect(game)} />
      ))}
    </div>
  );
}

function GameCard({ game, onClick }) {
  const [hovered, setHovered] = useState(false);

  return (
    <div
      onClick={onClick}
      onMouseEnter={() => setHovered(true)}
      onMouseLeave={() => setHovered(false)}
      style={{
        borderRadius: 12,
        overflow: "hidden",
        cursor: "pointer",
        border: `1px solid ${hovered ? "rgba(200,255,0,0.2)" : "rgba(255,255,255,0.07)"}`,
        transform: hovered ? "translateY(-2px)" : "none",
        transition: "all 0.18s",
        background: "#0A0C14",
      }}
    >
      {/* Cover gradient */}
      <div style={{
        height: 110,
        background: game.coverGradient,
        position: "relative",
        display: "flex",
        alignItems: "flex-end",
        padding: "10px 12px",
      }}>
        {game.trendingRank !== null && (
          <div style={{
            position: "absolute",
            top: 10,
            left: 10,
            padding: "2px 7px",
            borderRadius: 6,
            background: "rgba(200,255,0,0.15)",
            border: "1px solid rgba(200,255,0,0.3)",
            fontSize: 10,
            fontWeight: 800,
            color: "#C8FF00",
            letterSpacing: "0.06em",
          }}>
            #{game.trendingRank}
          </div>
        )}
        {game.recentlyDetected && (
          <div style={{
            position: "absolute",
            top: 10,
            right: 10,
            padding: "2px 7px",
            borderRadius: 6,
            background: "rgba(99,102,241,0.25)",
            border: "1px solid rgba(99,102,241,0.4)",
            fontSize: 9,
            fontWeight: 700,
            color: "#a5b4fc",
            letterSpacing: "0.08em",
          }}>
            NEW
          </div>
        )}
        {/* Platform badges */}
        <div style={{ display: "flex", gap: 4, marginLeft: "auto" }}>
          {game.sourcePlatforms.map((p) => (
            <PlatformBadge key={p} platform={p} />
          ))}
        </div>
      </div>

      {/* Info */}
      <div style={{ padding: "10px 12px 12px" }}>
        <div style={{ fontSize: 13, fontWeight: 700, color: "#F1F3F9", marginBottom: 2, letterSpacing: "-0.01em", lineHeight: 1.3 }}>
          {game.canonicalTitle}
        </div>
        <div style={{ fontSize: 11, color: "rgba(241,243,249,0.35)", marginBottom: 8 }}>
          {game.studio}
        </div>
        <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between" }}>
          <div style={{ fontSize: 11, color: "rgba(200,255,0,0.7)", fontWeight: 600 }}>
            ★ {game.communityRating.toFixed(1)}
          </div>
          <div style={{ fontSize: 11, color: "rgba(241,243,249,0.28)", fontWeight: 500 }}>
            {game.communityPlayerCount.toLocaleString()} players
          </div>
        </div>
      </div>
    </div>
  );
}

function PlatformBadge({ platform }) {
  return (
    <span style={{
      fontSize: 9,
      fontWeight: 700,
      padding: "2px 6px",
      borderRadius: 4,
      background: "rgba(0,0,0,0.45)",
      color: platform === "steam" ? "#b9d8f5" : "#c8aaff",
      letterSpacing: "0.06em",
      backdropFilter: "blur(4px)",
    }}>
      {platform === "steam" ? "STEAM" : "PSN"}
    </span>
  );
}

function LoadingGrid() {
  return (
    <div style={{
      display: "grid",
      gridTemplateColumns: "repeat(auto-fill, minmax(200px, 1fr))",
      gap: 14,
    }}>
      {Array.from({ length: 6 }).map((_, i) => (
        <div key={i} style={{
          borderRadius: 12,
          overflow: "hidden",
          border: "1px solid rgba(255,255,255,0.07)",
          background: "#0A0C14",
          animation: "pulse 1.4s ease infinite",
          animationDelay: `${i * 0.1}s`,
        }}>
          <div style={{ height: 110, background: "rgba(255,255,255,0.04)" }} />
          <div style={{ padding: "10px 12px 12px" }}>
            <div style={{ height: 13, borderRadius: 4, background: "rgba(255,255,255,0.06)", marginBottom: 6, width: "70%" }} />
            <div style={{ height: 11, borderRadius: 4, background: "rgba(255,255,255,0.04)", width: "45%" }} />
          </div>
        </div>
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
      <div style={{ fontSize: 32, marginBottom: 12, opacity: 0.2 }}>⊕</div>
      <div style={{ fontSize: 16, fontWeight: 700, color: "rgba(241,243,249,0.5)", marginBottom: 6 }}>
        No games found
      </div>
      <div style={{ fontSize: 13, color: "rgba(241,243,249,0.25)" }}>
        {query ? `No results for "${query}"` : "Try adjusting your filters"}
      </div>
    </div>
  );
}
