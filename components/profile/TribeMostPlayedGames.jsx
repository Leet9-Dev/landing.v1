"use client";
import { useRouter } from "next/navigation";
import { SectionLabel } from "@/components/profile/sectionPrimitives";

export function TribeMostPlayedGames({ games }) {
  const router = useRouter();
  if (!games?.length) return null;

  return (
    <div style={{ marginBottom: 28 }}>
      <SectionLabel>Most-Played Games</SectionLabel>
      <div style={{
        display: "grid",
        gridTemplateColumns: "repeat(auto-fill, minmax(240px, 1fr))",
        gap: 12,
      }}>
        {games.map((g) => (
          <div
            key={g.gameId}
            onClick={() => router.push(`/app/discovery/${g.gameId}`)}
            style={{
              borderRadius: 12,
              border: "1px solid rgba(255,255,255,0.07)",
              background: "#0A0C14",
              overflow: "hidden",
              cursor: "pointer",
              transition: "border-color 0.15s",
            }}
            onMouseEnter={(e) => (e.currentTarget.style.borderColor = "rgba(200,255,0,0.2)")}
            onMouseLeave={(e) => (e.currentTarget.style.borderColor = "rgba(255,255,255,0.07)")}
          >
            <div style={{
              height: 56,
              background: g.coverGradient || "rgba(255,255,255,0.08)",
              display: "flex",
              alignItems: "flex-end",
              justifyContent: "flex-end",
              padding: "8px 10px",
              gap: 4,
            }}>
              {(g.sourcePlatforms || []).map((p) => (
                <span key={p} style={{
                  fontSize: 8,
                  fontWeight: 700,
                  padding: "1px 5px",
                  borderRadius: 3,
                  background: "rgba(0,0,0,0.45)",
                  color: p === "steam" ? "#b9d8f5" : "#c8aaff",
                  letterSpacing: "0.06em",
                }}>
                  {p === "steam" ? "STEAM" : "PSN"}
                </span>
              ))}
            </div>
            <div style={{ padding: "10px 12px 12px" }}>
              <div style={{ fontSize: 13, fontWeight: 700, color: "#F1F3F9", marginBottom: 8, letterSpacing: "-0.01em" }}>
                {g.title}
              </div>
              <div style={{ display: "flex", justifyContent: "space-between", fontSize: 11 }}>
                <span style={{ color: "rgba(241,243,249,0.4)" }}>{g.membersCount} members</span>
                <span style={{ color: "rgba(200,255,0,0.7)", fontWeight: 700 }}>
                  {(g.tribeL9Points / 1000).toFixed(0)}K L9
                </span>
              </div>
            </div>
          </div>
        ))}
      </div>
    </div>
  );
}
