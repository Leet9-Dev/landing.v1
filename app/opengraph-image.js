import { ImageResponse } from "next/og";

export const runtime = "edge";
export const alt = "Leet9 — Your gaming identity, finally visible.";
export const size = { width: 1200, height: 630 };
export const contentType = "image/png";

export default function Image() {
  return new ImageResponse(
    <div
      style={{
        width: 1200,
        height: 630,
        background: "#07080F",
        display: "flex",
        flexDirection: "column",
        alignItems: "flex-start",
        justifyContent: "flex-end",
        padding: "72px 80px",
        position: "relative",
        fontFamily: "system-ui, sans-serif",
        overflow: "hidden",
      }}
    >
      {/* Background glow */}
      <div
        style={{
          position: "absolute",
          top: -120,
          right: -80,
          width: 600,
          height: 600,
          borderRadius: "50%",
          background: "radial-gradient(circle, rgba(200,255,0,0.12) 0%, transparent 70%)",
        }}
      />
      <div
        style={{
          position: "absolute",
          bottom: -100,
          left: -60,
          width: 480,
          height: 480,
          borderRadius: "50%",
          background: "radial-gradient(circle, rgba(124,58,237,0.1) 0%, transparent 70%)",
        }}
      />

      {/* Floating stat chips */}
      {[
        { text: "+1,280 L9", top: 60, right: 160, color: "#C8FF00", bg: "rgba(200,255,0,0.1)" },
        { text: "Diamond", top: 130, right: 80, color: "#a5b4fc", bg: "rgba(99,102,241,0.15)" },
        { text: "842h", top: 200, right: 200, color: "#F1F3F9", bg: "rgba(255,255,255,0.07)" },
        { text: "Rank #128", top: 280, right: 120, color: "#C8FF00", bg: "rgba(200,255,0,0.08)" },
      ].map((chip) => (
        <div
          key={chip.text}
          style={{
            position: "absolute",
            top: chip.top,
            right: chip.right,
            padding: "6px 16px",
            borderRadius: 99,
            background: chip.bg,
            border: `1px solid ${chip.color}33`,
            color: chip.color,
            fontSize: 14,
            fontWeight: 700,
            letterSpacing: "0.02em",
            display: "flex",
          }}
        >
          {chip.text}
        </div>
      ))}

      {/* Logo mark */}
      <div
        style={{
          width: 48,
          height: 48,
          borderRadius: 12,
          background: "linear-gradient(135deg, #C8FF00, #7C3AED)",
          marginBottom: 28,
          display: "flex",
          alignItems: "center",
          justifyContent: "center",
          fontSize: 24,
          fontWeight: 900,
          color: "#07080F",
        }}
      >
        L9
      </div>

      {/* Headline */}
      <div
        style={{
          fontSize: 60,
          fontWeight: 900,
          color: "#F1F3F9",
          letterSpacing: "-0.03em",
          lineHeight: 1.1,
          marginBottom: 20,
          display: "flex",
          flexDirection: "column",
        }}
      >
        <span>Your gaming identity,</span>
        <span style={{ color: "#C8FF00" }}>finally visible.</span>
      </div>

      {/* Subline */}
      <div
        style={{
          fontSize: 22,
          color: "rgba(241,243,249,0.5)",
          fontWeight: 400,
          letterSpacing: "-0.01em",
          maxWidth: 620,
          display: "flex",
        }}
      >
        Connect Steam & PSN · Earn L9 Points · Climb the ranks
      </div>
    </div>,
    { ...size }
  );
}
