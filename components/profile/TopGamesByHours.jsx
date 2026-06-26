"use client";
import { useRouter } from "next/navigation";
import { SectionLabel } from "@/components/profile/sectionPrimitives";

export function TopGamesByHours({ topGamesByHours }) {
  const router = useRouter();
  if (!topGamesByHours?.length) return null;

  const maxHours = Math.max(...topGamesByHours.map((g) => g.hours), 1);

  return (
    <div style={{ marginBottom: 28 }}>
      <SectionLabel>Top Games by Hours</SectionLabel>
      <div style={{
        borderRadius: 12,
        border: "1px solid rgba(255,255,255,0.07)",
        background: "rgba(255,255,255,0.02)",
        padding: 18,
        display: "flex",
        flexDirection: "column",
        gap: 14,
      }}>
        {topGamesByHours.map((g) => (
          <div
            key={g.gameId}
            onClick={() => router.push(`/app/discovery/${g.gameId}`)}
            style={{ cursor: "pointer" }}
          >
            <div style={{ display: "flex", alignItems: "center", gap: 10, marginBottom: 6 }}>
              <div style={{ width: 22, height: 22, borderRadius: 5, background: g.coverGradient || "rgba(255,255,255,0.1)", flexShrink: 0 }} />
              <span style={{ fontSize: 13, fontWeight: 700, color: "#F1F3F9", flex: 1, minWidth: 0 }}>{g.gameTitle}</span>
              <span style={{ fontSize: 12, fontWeight: 700, color: "rgba(241,243,249,0.55)" }}>
                {g.hours.toLocaleString()}h
              </span>
            </div>
            <div style={{ height: 6, borderRadius: 99, background: "rgba(255,255,255,0.06)", overflow: "hidden", marginLeft: 32 }}>
              <div style={{
                height: "100%",
                width: `${(g.hours / maxHours) * 100}%`,
                background: "linear-gradient(90deg, #C8FF00, #a3e600)",
                borderRadius: 99,
                minWidth: 4,
              }} />
            </div>
          </div>
        ))}
      </div>
    </div>
  );
}
