"use client";
import { useState, useEffect, useCallback } from "react";
import { RankingFilters } from "@/components/rankings/RankingFilters";
import { RankingRow } from "@/components/rankings/RankingRow";
import { RankingStat } from "@/components/rankings/RankingStat";
import { RankingPanel } from "@/components/rankings/RankingPanel";

const SCOPES = [
  { id: "global", label: "Global" },
  { id: "friends", label: "Friends" },
  { id: "tribe", label: "Tribe" },
];

const TREND_ICON = { up: "▲", down: "▼", flat: "–" };
const TREND_COLOR = { up: "#C8FF00", down: "#f87171", flat: "rgba(241,243,249,0.3)" };

export function PlayerRankings() {
  const [scope, setScope] = useState("global");
  const [rankings, setRankings] = useState([]);
  const [loading, setLoading] = useState(true);

  const load = useCallback(async () => {
    setLoading(true);
    const res = await fetch(`/api/rankings/players?scope=${scope}`);
    const json = await res.json();
    if (json.ok) setRankings(json.data.rankings);
    setLoading(false);
  }, [scope]);

  useEffect(() => {
    const t = setTimeout(load, 0);
    return () => clearTimeout(t);
  }, [load]);

  return (
    <div>
      <style>{`
        @media (max-width: 639px) {
          .l9-rank-col-hide { display: none !important; }
          .l9-player-meta { display: none !important; }
        }
      `}</style>
      <RankingFilters groups={[{ value: scope, onChange: setScope, options: SCOPES }]} />

      <RankingPanel
        loading={loading}
        isEmpty={rankings.length === 0}
        emptyIcon="◈"
        emptyTitle="No players in this scope yet"
        emptyText="Try a different scope or check back later."
      >
        {rankings.map((p) => (
          <RankingRow
            key={p.userId}
            rank={p.rank}
            highlight={p.isCurrentUser}
            leading={<PlayerIdentity player={p} />}
          >
            <RankingStat label="L9 Points" value={p.l9Points.toLocaleString()} accent width={88} />
            <RankingStat label="Level" value={p.level} width={48} className="l9-rank-col-hide" />
            <RankingStat label="Games" value={p.gamesCount} width={52} />
            <RankingStat label="Ach" value={p.achievementsCount} width={52} className="l9-rank-col-hide" />
            <div className="l9-rank-col-hide" style={{ width: 22, textAlign: "right", flexShrink: 0, fontSize: 11, fontWeight: 700, color: TREND_COLOR[p.trend] }}>
              {TREND_ICON[p.trend]}
            </div>
          </RankingRow>
        ))}
      </RankingPanel>
    </div>
  );
}

function PlayerIdentity({ player }) {
  return (
    <div style={{ display: "flex", alignItems: "center", gap: 12 }}>
      <div style={{
        width: 34,
        height: 34,
        borderRadius: "50%",
        background: "linear-gradient(135deg,#C8FF00,#7C3AED)",
        display: "flex",
        alignItems: "center",
        justifyContent: "center",
        fontSize: 12,
        fontWeight: 800,
        color: "#07080F",
        flexShrink: 0,
        border: player.isCurrentUser ? "2px solid rgba(200,255,0,0.5)" : "2px solid transparent",
      }}>
        {player.avatarInitials}
      </div>
      <div style={{ minWidth: 0 }}>
        <div style={{
          fontSize: 13,
          fontWeight: player.isCurrentUser ? 800 : 700,
          color: player.isCurrentUser ? "#C8FF00" : "#F1F3F9",
          letterSpacing: "-0.01em",
          display: "flex",
          alignItems: "center",
          gap: 8,
        }}>
          {player.gamerTag}
          {player.isCurrentUser && (
            <span style={{ fontSize: 9, fontWeight: 700, color: "#07080F", background: "#C8FF00", padding: "1px 6px", borderRadius: 99 }}>
              YOU
            </span>
          )}
        </div>
        <div className="l9-player-meta" style={{ display: "flex", alignItems: "center", gap: 8, marginTop: 2 }}>
          {player.tribeTag && (
            <span style={{ fontSize: 10, color: "rgba(241,243,249,0.4)", fontWeight: 600 }}>
              [{player.tribeTag}]
            </span>
          )}
          <div style={{ display: "flex", gap: 4 }}>
            {player.platforms.map((p) => (
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
