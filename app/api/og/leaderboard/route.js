import { ImageResponse } from "next/og";

export const runtime = "edge";

export async function GET(request) {
  const { searchParams } = new URL(request.url);
  const name = searchParams.get("name") || "Gamer";
  const rank = searchParams.get("rank") || "?";
  const points = searchParams.get("points") || "0";
  const avatar = searchParams.get("avatar") || "";

  return new ImageResponse(
    <div
      style={{
        width: 1200,
        height: 630,
        background: "#07080F",
        display: "flex",
        flexDirection: "column",
        fontFamily: "system-ui, sans-serif",
        overflow: "hidden",
        position: "relative",
        alignItems: "center",
        justifyContent: "center",
      }}
    >
      {/* Background glow */}
      <div style={{
        position: "absolute", top: -100, left: -100,
        width: 600, height: 600, borderRadius: "50%",
        background: "radial-gradient(circle, rgba(200,255,0,0.08) 0%, transparent 65%)",
        display: "flex",
      }} />
      <div style={{
        position: "absolute", bottom: -100, right: -100,
        width: 600, height: 600, borderRadius: "50%",
        background: "radial-gradient(circle, rgba(124,58,237,0.1) 0%, transparent 65%)",
        display: "flex",
      }} />

      {/* Leet9 wordmark */}
      <div style={{
        position: "absolute", top: 40, left: 52,
        fontSize: 18, fontWeight: 900,
        color: "rgba(241,243,249,0.25)",
        letterSpacing: "0.12em",
        display: "flex",
      }}>
        LEET9
      </div>

      {/* Main content */}
      <div style={{
        display: "flex",
        flexDirection: "column",
        alignItems: "center",
        gap: 0,
      }}>
        {/* Rank badge */}
        <div style={{
          fontSize: 22,
          fontWeight: 900,
          color: "#C8FF00",
          letterSpacing: "0.14em",
          marginBottom: 28,
          display: "flex",
          background: "rgba(200,255,0,0.08)",
          border: "1px solid rgba(200,255,0,0.3)",
          borderRadius: 999,
          padding: "8px 24px",
        }}>
          #{rank} LEADERBOARD
        </div>

        {/* Avatar + name row */}
        <div style={{ display: "flex", alignItems: "center", gap: 28, marginBottom: 28 }}>
          {avatar ? (
            <img
              src={avatar}
              width={96}
              height={96}
              style={{ borderRadius: 20, border: "3px solid #C8FF00" }}
            />
          ) : (
            <div style={{
              width: 96, height: 96, borderRadius: 20,
              background: "rgba(200,255,0,0.15)",
              border: "3px solid #C8FF00",
              display: "flex",
              alignItems: "center",
              justifyContent: "center",
              fontSize: 40,
            }}>
              🎮
            </div>
          )}
          <div style={{ display: "flex", flexDirection: "column", gap: 6 }}>
            <div style={{ fontSize: 52, fontWeight: 900, color: "#F1F3F9", letterSpacing: "-0.03em", display: "flex" }}>
              {name}
            </div>
            <div style={{ fontSize: 20, color: "rgba(241,243,249,0.4)", fontWeight: 600, display: "flex" }}>
              {parseInt(points).toLocaleString()} L9 Points
            </div>
          </div>
        </div>

        {/* Challenge text */}
        <div style={{
          fontSize: 32,
          fontWeight: 800,
          color: "#F1F3F9",
          letterSpacing: "-0.02em",
          textAlign: "center",
          display: "flex",
          maxWidth: 700,
        }}>
          Hai il coraggio di sfidarmi?
        </div>

        {/* CTA */}
        <div style={{
          marginTop: 36,
          fontSize: 18,
          fontWeight: 700,
          color: "#07080F",
          background: "#C8FF00",
          borderRadius: 12,
          padding: "14px 36px",
          letterSpacing: "-0.01em",
          display: "flex",
        }}>
          Sfidami su Leet9 →
        </div>
      </div>
    </div>,
    { width: 1200, height: 630 }
  );
}
