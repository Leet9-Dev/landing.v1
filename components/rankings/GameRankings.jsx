"use client";
import { useState, useEffect, useCallback } from "react";
import { useRouter } from "next/navigation";
import { RankingFilters } from "@/components/rankings/RankingFilters";
import { RankingRow } from "@/components/rankings/RankingRow";
import { RankingStat } from "@/components/rankings/RankingStat";
import { RankingPanel } from "@/components/rankings/RankingPanel";

const SORTS = [
  { id: "l9Points", label: "L9 Points" },
  { id: "players", label: "Players" },
  { id: "achievements", label: "Achievements" },
  { id: "hours", label: "Hours" },
  { id: "trending", label: "Trending" },
];

const SOURCES = [
  { id: "", label: "All Platforms" },
  { id: "steam", label: "Steam" },
  { id: "psn", label: "PSN" },
];

export function GameRankings() {
  const router = useRouter();
  const [sort, setSort] = useState("l9Points");
  const [source, setSource] = useState("");
  const [rankings, setRankings] = useState([]);
  const [loading, setLoading] = useState(true);

  const load = useCallback(async () => {
    setLoading(true);
    const params = new URLSearchParams({ sort });
    if (source) params.set("source", source);
    const res = await fetch(`/api/rankings/games?${params}`);
    const json = await res.json();
    if (json.ok) setRankings(json.data.rankings);
    setLoading(false);
  }, [sort, source]);

  useEffect(() => {
    const t = setTimeout(load, 0);
    return () => clearTimeout(t);
  }, [load]);

  return (
    <div>
      <RankingFilters groups={[
        { value: source, onChange: setSource, options: SOURCES },
        { value: sort, onChange: setSort, options: SORTS },
      ]} />

      <RankingPanel
        loading={loading}
        isEmpty={rankings.length === 0}
        emptyIcon="◆"
        emptyTitle="No games match this filter"
        emptyText="Try a different platform or sort."
      >
        {rankings.map((r) => (
          <RankingRow
            key={r.gameId}
            rank={r.rank}
            onClick={() => router.push(`/app/discovery/${r.gameId}`)}
            leading={<GameIdentity entry={r} />}
          >
            <RankingStat label="L9 Points" value={formatCompact(r.l9Points)} accent width={80} />
            <RankingStat label="Players" value={r.playerCount.toLocaleString()} width={70} />
            <RankingStat label="Ach" value={formatCompact(r.achievementsCount)} width={56} />
            <RankingStat label="Hours" value={formatCompact(r.hoursPlayed)} width={56} />
          </RankingRow>
        ))}
      </RankingPanel>
    </div>
  );
}

function GameIdentity({ entry }) {
  const { game } = entry;
  return (
    <div style={{ display: "flex", alignItems: "center", gap: 12 }}>
      <div style={{
        width: 38,
        height: 38,
        borderRadius: 8,
        background: game.coverGradient,
        flexShrink: 0,
      }} />
      <div style={{ minWidth: 0 }}>
        <div style={{ display: "flex", alignItems: "center", gap: 8 }}>
          <span style={{ fontSize: 13, fontWeight: 700, color: "#F1F3F9", letterSpacing: "-0.01em" }}>
            {game.canonicalTitle}
          </span>
          {entry.trendingRank != null && (
            <Tag color="lime">#{entry.trendingRank} Trending</Tag>
          )}
          {entry.recentlyDetected && <Tag color="indigo">NEW</Tag>}
        </div>
        <div style={{ display: "flex", alignItems: "center", gap: 8, marginTop: 2 }}>
          <span style={{ fontSize: 10, color: "rgba(241,243,249,0.4)" }}>{game.studio}</span>
          {entry.rating != null && (
            <span style={{ fontSize: 10, color: "rgba(200,255,0,0.7)", fontWeight: 600 }}>★ {entry.rating.toFixed(1)}</span>
          )}
          <div style={{ display: "flex", gap: 4 }}>
            {game.sourcePlatforms.map((p) => (
              <span key={p} style={{
                fontSize: 8,
                fontWeight: 700,
                padding: "1px 5px",
                borderRadius: 3,
                background: "rgba(255,255,255,0.05)",
                color: p === "steam" ? "#b9d8f5" : "#c8aaff",
                letterSpacing: "0.06em",
              }}>
                {p === "steam" ? "STEAM" : "PSN"}
              </span>
            ))}
          </div>
        </div>
      </div>
    </div>
  );
}

function Tag({ color, children }) {
  const styles = {
    lime: { background: "rgba(200,255,0,0.12)", border: "1px solid rgba(200,255,0,0.3)", color: "#C8FF00" },
    indigo: { background: "rgba(99,102,241,0.2)", border: "1px solid rgba(99,102,241,0.4)", color: "#a5b4fc" },
  };
  return (
    <span style={{
      padding: "1px 6px",
      borderRadius: 4,
      fontSize: 8,
      fontWeight: 800,
      letterSpacing: "0.06em",
      ...styles[color],
    }}>
      {children}
    </span>
  );
}

function formatCompact(n) {
  if (n >= 1000) return `${(n / 1000).toFixed(0)}K`;
  return `${n}`;
}
