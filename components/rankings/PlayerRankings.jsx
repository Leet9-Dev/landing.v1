"use client";
import { useState, useEffect, useCallback } from "react";
import { useRouter } from "next/navigation";
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
  const router = useRouter();
  const [scope, setScope] = useState("global");
  const [rankings, setRankings] = useState([]);
  const [loading, setLoading] = useState(true);
  const [followingIds, setFollowingIds] = useState(new Set());

  // Load who the current user follows.
  useEffect(() => {
    fetch("/api/me/followers?type=following")
      .then((r) => r.json())
      .then((json) => {
        if (json.ok) setFollowingIds(new Set(json.data.users.map((u) => u.id)));
      })
      .catch(() => {});
  }, []);

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

  function handleFollowToggle(targetUserId, nowFollowing) {
    setFollowingIds((prev) => {
      const next = new Set(prev);
      if (nowFollowing) next.add(targetUserId);
      else next.delete(targetUserId);
      return next;
    });
  }

  return (
    <div>
      <style>{`
        @media (max-width: 639px) {
          .l9-rank-col-hide { display: none !important; }
          .l9-player-meta { display: none !important; }
        }
      `}</style>
      <RankingFilters groups={[{ value: scope, onChange: setScope, options: SCOPES }]} />

      {scope === "tribe" ? (
        <p style={{ fontSize: 12, color: "rgba(241,243,249,0.35)", marginBottom: 16, lineHeight: 1.6, maxWidth: 560 }}>
          A preview of the Leet9 community layer. Full tribe profiles, membership, and
          management are coming in a later phase.
        </p>
      ) : (
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
            onClick={() => router.push(p.isCurrentUser ? "/app/profile" : `/app/profile/${p.userId}`)}
            leading={<PlayerIdentity player={p} />}
          >
            <RankingStat label="L9 Points" value={p.l9Points.toLocaleString()} accent width={88} />
            <RankingStat label="Level" value={p.level} width={48} className="l9-rank-col-hide" />
            <RankingStat label="Games" value={p.gamesCount} width={52} />
            <RankingStat label="Ach" value={p.achievementsCount} width={52} className="l9-rank-col-hide" />
            <div className="l9-rank-col-hide" style={{ width: 22, textAlign: "right", flexShrink: 0, fontSize: 11, fontWeight: 700, color: TREND_COLOR[p.trend] }}>
              {TREND_ICON[p.trend]}
            </div>
            <div style={{ width: 72, flexShrink: 0 }}>
              {!p.isCurrentUser && (
                <FollowButton
                  userId={p.userId}
                  isFollowing={followingIds.has(p.userId)}
                  onToggle={handleFollowToggle}
                />
              )}
            </div>
          </RankingRow>
        ))}
      </RankingPanel>
      )}
    </div>
  );
}

function FollowButton({ userId, isFollowing, onToggle }) {
  const [hovered, setHovered] = useState(false);
  const [pending, setPending] = useState(false);

  async function handleClick(e) {
    e.stopPropagation();
    if (pending) return;
    setPending(true);
    try {
      const method = isFollowing ? "DELETE" : "POST";
      const res = await fetch(`/api/me/follow/${userId}`, { method });
      if (res.ok) onToggle(userId, !isFollowing);
    } catch {}
    setPending(false);
  }

  const showUnfollow = isFollowing && hovered;
  const label = showUnfollow ? "Unfollow" : isFollowing ? "Following" : "Follow";
  const color = showUnfollow ? "#f87171" : isFollowing ? "#C8FF00" : "#F1F3F9";
  const borderColor = showUnfollow
    ? "rgba(248,113,113,0.4)"
    : isFollowing
    ? "rgba(200,255,0,0.35)"
    : "rgba(241,243,249,0.25)";
  const bg = isFollowing ? "rgba(200,255,0,0.06)" : "transparent";

  return (
    <button
      onClick={handleClick}
      onMouseEnter={() => setHovered(true)}
      onMouseLeave={() => setHovered(false)}
      style={{
        padding: "3px 11px",
        borderRadius: 99,
        border: `1px solid ${borderColor}`,
        background: bg,
        color,
        fontFamily: "'Outfit', sans-serif",
        fontSize: 11,
        fontWeight: 700,
        letterSpacing: "0.02em",
        cursor: pending ? "wait" : "pointer",
        transition: "all 0.15s",
        flexShrink: 0,
        whiteSpace: "nowrap",
      }}
    >
      {label}
    </button>
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
        overflow: "hidden",
        position: "relative",
      }}>
        {player.avatarUrl
          ? <img src={player.avatarUrl} alt={player.gamerTag} style={{ position: "absolute", inset: 0, width: "100%", height: "100%", objectFit: "cover" }} />
          : player.avatarInitials
        }
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
        {player.tribeTag && (
          <div className="l9-player-meta" style={{ display: "flex", alignItems: "center", gap: 8, marginTop: 2 }}>
            <span style={{ fontSize: 10, color: "rgba(241,243,249,0.4)", fontWeight: 600 }}>
              [{player.tribeTag}]
            </span>
          </div>
        )}
      </div>
    </div>
  );
}
