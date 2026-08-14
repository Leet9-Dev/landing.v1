import { ImageResponse } from "next/og";
import { NextResponse } from "next/server";

export const runtime = "edge";

export async function GET(request) {
  const { searchParams } = new URL(request.url);

  const p1name = searchParams.get("p1name") || "Player 1";
  const p1avatar = searchParams.get("p1avatar") || "";
  const p1hours = searchParams.get("p1hours") || "0";
  const p1games = searchParams.get("p1games") || "0";

  const p2name = searchParams.get("p2name") || "Player 2";
  const p2avatar = searchParams.get("p2avatar") || "";
  const p2hours = searchParams.get("p2hours") || "0";
  const p2games = searchParams.get("p2games") || "0";

  const p1h = parseInt(p1hours, 10);
  const p2h = parseInt(p2hours, 10);
  const p1wins = p1h >= p2h;

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
      }}
    >
      {/* Background glow left */}
      <div style={{
        position: "absolute", top: -80, left: -80,
        width: 500, height: 500, borderRadius: "50%",
        background: "radial-gradient(circle, rgba(200,255,0,0.1) 0%, transparent 65%)",
        display: "flex",
      }} />
      {/* Background glow right */}
      <div style={{
        position: "absolute", bottom: -80, right: -80,
        width: 500, height: 500, borderRadius: "50%",
        background: "radial-gradient(circle, rgba(124,58,237,0.1) 0%, transparent 65%)",
        display: "flex",
      }} />

      {/* Top bar: LEET9 logo */}
      <div style={{
        padding: "36px 56px",
        display: "flex",
        alignItems: "center",
        gap: 12,
      }}>
        <div style={{
          width: 36, height: 36, borderRadius: 8,
          background: "linear-gradient(135deg, #C8FF00, #7C3AED)",
          display: "flex", alignItems: "center", justifyContent: "center",
          fontSize: 16, fontWeight: 900, color: "#07080F",
        }}>L9</div>
        <span style={{ fontSize: 15, fontWeight: 700, color: "rgba(241,243,249,0.4)", letterSpacing: "0.12em" }}>
          1 VS 1 BATTLE
        </span>
      </div>

      {/* Player cards row */}
      <div style={{
        flex: 1,
        display: "flex",
        alignItems: "center",
        padding: "0 56px",
        gap: 0,
      }}>
        {/* Player 1 */}
        <div style={{
          flex: 1,
          display: "flex",
          flexDirection: "column",
          alignItems: "flex-start",
          gap: 16,
        }}>
          {p1avatar && (
            <img src={p1avatar} width={80} height={80} style={{ borderRadius: 16, border: `3px solid ${p1wins ? "#C8FF00" : "rgba(255,255,255,0.15)"}` }} />
          )}
          <div style={{ display: "flex", flexDirection: "column", gap: 6 }}>
            <span style={{ fontSize: 34, fontWeight: 900, color: "#F1F3F9", letterSpacing: "-0.02em" }}>{p1name}</span>
            {p1wins && (
              <span style={{
                fontSize: 11, fontWeight: 800, letterSpacing: "0.1em",
                color: "#C8FF00", background: "rgba(200,255,0,0.12)",
                border: "1px solid rgba(200,255,0,0.3)",
                padding: "3px 10px", borderRadius: 99,
                display: "flex", width: "fit-content",
              }}>WINNER</span>
            )}
          </div>
          <div style={{ display: "flex", gap: 20 }}>
            <div style={{ display: "flex", flexDirection: "column", gap: 2 }}>
              <span style={{ fontSize: 28, fontWeight: 900, color: p1wins ? "#C8FF00" : "#F1F3F9" }}>{parseInt(p1hours).toLocaleString()}h</span>
              <span style={{ fontSize: 13, color: "rgba(241,243,249,0.4)" }}>playtime</span>
            </div>
            <div style={{ display: "flex", flexDirection: "column", gap: 2 }}>
              <span style={{ fontSize: 28, fontWeight: 900, color: "#F1F3F9" }}>{p1games}</span>
              <span style={{ fontSize: 13, color: "rgba(241,243,249,0.4)" }}>games</span>
            </div>
          </div>
        </div>

        {/* VS */}
        <div style={{
          display: "flex",
          flexDirection: "column",
          alignItems: "center",
          padding: "0 40px",
        }}>
          <div style={{
            fontSize: 72, fontWeight: 900, color: "rgba(255,255,255,0.06)",
            letterSpacing: "-0.04em",
          }}>VS</div>
        </div>

        {/* Player 2 */}
        <div style={{
          flex: 1,
          display: "flex",
          flexDirection: "column",
          alignItems: "flex-end",
          gap: 16,
        }}>
          {p2avatar && (
            <img src={p2avatar} width={80} height={80} style={{ borderRadius: 16, border: `3px solid ${!p1wins ? "#C8FF00" : "rgba(255,255,255,0.15)"}` }} />
          )}
          <div style={{ display: "flex", flexDirection: "column", alignItems: "flex-end", gap: 6 }}>
            <span style={{ fontSize: 34, fontWeight: 900, color: "#F1F3F9", letterSpacing: "-0.02em" }}>{p2name}</span>
            {!p1wins && (
              <span style={{
                fontSize: 11, fontWeight: 800, letterSpacing: "0.1em",
                color: "#C8FF00", background: "rgba(200,255,0,0.12)",
                border: "1px solid rgba(200,255,0,0.3)",
                padding: "3px 10px", borderRadius: 99,
                display: "flex", width: "fit-content",
              }}>WINNER</span>
            )}
          </div>
          <div style={{ display: "flex", gap: 20 }}>
            <div style={{ display: "flex", flexDirection: "column", alignItems: "flex-end", gap: 2 }}>
              <span style={{ fontSize: 28, fontWeight: 900, color: "#F1F3F9" }}>{p2games}</span>
              <span style={{ fontSize: 13, color: "rgba(241,243,249,0.4)" }}>games</span>
            </div>
            <div style={{ display: "flex", flexDirection: "column", alignItems: "flex-end", gap: 2 }}>
              <span style={{ fontSize: 28, fontWeight: 900, color: !p1wins ? "#C8FF00" : "#F1F3F9" }}>{parseInt(p2hours).toLocaleString()}h</span>
              <span style={{ fontSize: 13, color: "rgba(241,243,249,0.4)" }}>playtime</span>
            </div>
          </div>
        </div>
      </div>

      {/* Bottom bar */}
      <div style={{
        padding: "24px 56px",
        display: "flex",
        alignItems: "center",
        justifyContent: "space-between",
      }}>
        <span style={{ fontSize: 13, color: "rgba(241,243,249,0.25)", fontWeight: 500 }}>leet9.com</span>
        <span style={{ fontSize: 13, color: "rgba(241,243,249,0.25)", fontWeight: 500 }}>Powered by Steam</span>
      </div>
    </div>,
    { width: 1200, height: 630 }
  );
}
