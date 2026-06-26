"use client";
import { useRouter } from "next/navigation";
import { SectionLabel } from "@/components/profile/sectionPrimitives";

export function SignatureGames({ signatureGames }) {
  const router = useRouter();

  if (!signatureGames?.length) return null;

  return (
    <div style={{ marginBottom: 28 }}>
      <SectionLabel>Signature Games</SectionLabel>
      <div style={{ display: "grid", gridTemplateColumns: "repeat(auto-fill, minmax(220px, 1fr))", gap: 12 }}>
        {signatureGames.map((sg) => (
          <div
            key={sg.gameId}
            onClick={() => router.push(`/app/discovery/${sg.gameId}`)}
            style={{
              borderRadius: 12,
              border: "1px solid rgba(255,255,255,0.07)",
              background: "#0A0C14",
              padding: 14,
              cursor: "pointer",
              transition: "border-color 0.15s",
            }}
            onMouseEnter={(e) => (e.currentTarget.style.borderColor = "rgba(200,255,0,0.2)")}
            onMouseLeave={(e) => (e.currentTarget.style.borderColor = "rgba(255,255,255,0.07)")}
          >
            <div style={{
              fontSize: 9,
              fontWeight: 700,
              color: "#C8FF00",
              letterSpacing: "0.08em",
              textTransform: "uppercase",
              marginBottom: 6,
            }}>
              {sg.role}
            </div>
            <div style={{ fontSize: 14, fontWeight: 700, color: "#F1F3F9", marginBottom: 6, letterSpacing: "-0.01em" }}>
              {sg.game.canonicalTitle}
            </div>
            <div style={{ fontSize: 11, color: "rgba(241,243,249,0.35)", lineHeight: 1.5, marginBottom: 10 }}>
              {sg.why}
            </div>
            <div style={{ display: "flex", justifyContent: "space-between", fontSize: 11 }}>
              <span style={{ color: "rgba(200,255,0,0.7)", fontWeight: 700 }}>{sg.l9Points.toLocaleString()} L9</span>
              <span style={{ color: "rgba(241,243,249,0.3)" }}>{sg.masteryPct.toFixed(0)}% mastery</span>
            </div>
          </div>
        ))}
      </div>
    </div>
  );
}
