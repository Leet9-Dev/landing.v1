"use client";
import { useState, useEffect, useCallback } from "react";
import { RankingRow } from "@/components/rankings/RankingRow";
import { RankingStat } from "@/components/rankings/RankingStat";
import { RankingPanel } from "@/components/rankings/RankingPanel";

export function TribeRankings() {
  const [rankings, setRankings] = useState([]);
  const [loading, setLoading] = useState(true);

  const load = useCallback(async () => {
    setLoading(true);
    const res = await fetch("/api/rankings/tribes");
    const json = await res.json();
    if (json.ok) setRankings(json.data.rankings);
    setLoading(false);
  }, []);

  useEffect(() => {
    const t = setTimeout(load, 0);
    return () => clearTimeout(t);
  }, [load]);

  return (
    <div>
      <style>{`
        @media (max-width: 639px) {
          .l9-rank-col-hide { display: none !important; }
        }
      `}</style>
      <p style={{ fontSize: 12, color: "rgba(241,243,249,0.35)", marginBottom: 16, lineHeight: 1.6, maxWidth: 560 }}>
        A preview of the Leet9 community layer. Full tribe profiles, membership, and
        management are coming in a later phase.
      </p>

      <RankingPanel
        loading={loading}
        isEmpty={rankings.length === 0}
        emptyIcon="⬡"
        emptyTitle="No tribes ranked yet"
        emptyText="Tribe rankings will appear as communities form."
      >
        {rankings.map((t) => (
          <RankingRow
            key={t.tribeId}
            rank={t.rank}
            highlight={t.isCurrentUserTribe}
            leading={<TribeIdentity tribe={t} />}
          >
            <RankingStat label="L9 Points" value={formatCompact(t.totalL9Points)} accent width={84} />
            <RankingStat label="Members" value={t.membersCount} width={64} className="l9-rank-col-hide" />
            <RankingStat label="Games" value={t.gamesCount} width={56} />
            <RankingStat label="Ach" value={formatCompact(t.achievementsCount)} width={56} className="l9-rank-col-hide" />
          </RankingRow>
        ))}
      </RankingPanel>
    </div>
  );
}

function TribeIdentity({ tribe }) {
  return (
    <div style={{ display: "flex", alignItems: "center", gap: 12 }}>
      <div style={{
        width: 36,
        height: 36,
        borderRadius: 9,
        background: tribe.emblem?.gradient || "linear-gradient(135deg,#C8FF00,#7C3AED)",
        display: "flex",
        alignItems: "center",
        justifyContent: "center",
        fontSize: 12,
        fontWeight: 800,
        color: "#F1F3F9",
        flexShrink: 0,
        border: tribe.isCurrentUserTribe ? "2px solid rgba(200,255,0,0.5)" : "2px solid transparent",
      }}>
        {tribe.emblem?.initials}
      </div>
      <div style={{ minWidth: 0 }}>
        <div style={{ display: "flex", alignItems: "center", gap: 8 }}>
          <span style={{
            fontSize: 13,
            fontWeight: tribe.isCurrentUserTribe ? 800 : 700,
            color: tribe.isCurrentUserTribe ? "#C8FF00" : "#F1F3F9",
            letterSpacing: "-0.01em",
          }}>
            {tribe.name}
          </span>
          {tribe.isCurrentUserTribe && (
            <span style={{ fontSize: 9, fontWeight: 700, color: "#07080F", background: "#C8FF00", padding: "1px 6px", borderRadius: 99 }}>
              YOUR TRIBE
            </span>
          )}
        </div>
        <div style={{ fontSize: 10, color: "rgba(241,243,249,0.4)", fontWeight: 600, marginTop: 2 }}>
          [{tribe.tag}]
        </div>
      </div>
    </div>
  );
}

function formatCompact(n) {
  if (n >= 1000) return `${(n / 1000).toFixed(0)}K`;
  return `${n}`;
}
