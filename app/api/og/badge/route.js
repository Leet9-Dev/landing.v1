import { ImageResponse } from "@vercel/og";

export const runtime = "edge";
export const revalidate = 3600;

const TIER_COLORS = {
  gold:   { glow: "rgba(255,200,0,0.18)",   chip: "rgba(255,200,0,0.12)",   border: "rgba(255,200,0,0.3)",   label: "#FFD84D" },
  silver: { glow: "rgba(180,200,220,0.18)", chip: "rgba(180,200,220,0.1)",  border: "rgba(180,200,220,0.3)", label: "#C4D4E0" },
  bronze: { glow: "rgba(200,130,60,0.18)",  chip: "rgba(200,130,60,0.1)",   border: "rgba(200,130,60,0.28)", label: "#D4935A" },
};

const TIER_LABELS = { gold: "Gold", silver: "Silver", bronze: "Bronze" };

export async function GET(request) {
  const { searchParams } = new URL(request.url);
  const username  = searchParams.get("username")  || "Gamer";
  const badgeName = searchParams.get("badgeName") || "Badge";
  const tier      = searchParams.get("tier")      || "bronze";
  const game      = searchParams.get("game")      || "";
  const icon      = searchParams.get("icon")      || "🏆";

  const [bebasFont, outfitFont, logoData] = await Promise.all([
    fetch(new URL("/fonts/BebasNeue-Regular.ttf", request.url)).then((r) => r.arrayBuffer()).catch(() => null),
    fetch(new URL("/fonts/Outfit-Bold.ttf", request.url)).then((r) => r.arrayBuffer()).catch(() => null),
    fetch(new URL("/logo-icon.png", request.url)).then((r) => r.arrayBuffer()).catch(() => null),
  ]);

  const logoSrc = logoData
    ? `data:image/png;base64,${Buffer.from(logoData).toString("base64")}`
    : null;

  const fonts = [];
  if (bebasFont) fonts.push({ name: "BebasNeue", data: bebasFont, weight: 400 });
  if (outfitFont) fonts.push({ name: "Outfit", data: outfitFont, weight: 700 });

  const tc = TIER_COLORS[tier] ?? TIER_COLORS.bronze;
  const tierLabel = TIER_LABELS[tier] ?? "Bronze";

  return new ImageResponse(
    <div
      style={{
        width: "100%",
        height: "100%",
        display: "flex",
        flexDirection: "column",
        justifyContent: "space-between",
        background: "#090A12",
        padding: "88px 104px",
        position: "relative",
        overflow: "hidden",
      }}
    >
      {/* Background glow — purple */}
      <div
        style={{
          position: "absolute",
          top: "38%",
          left: "50%",
          transform: "translate(-50%, -50%)",
          width: 1040,
          height: 680,
          background: `radial-gradient(ellipse, ${tc.glow} 0%, transparent 70%)`,
          pointerEvents: "none",
        }}
      />

      {/* Top row: logo + eyebrow chip */}
      <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center" }}>
        {logoSrc ? (
          <img src={logoSrc} width={72} height={72} style={{ objectFit: "contain" }} />
        ) : (
          <div style={{ width: 72, height: 72 }} />
        )}
        <div
          style={{
            background: "rgba(200,170,255,0.1)",
            border: "1px solid rgba(200,170,255,0.3)",
            borderRadius: 16,
            padding: "10px 28px",
            color: "#c8aaff",
            fontFamily: "Outfit",
            fontSize: 26,
            fontWeight: 700,
            letterSpacing: "0.06em",
            textTransform: "uppercase",
          }}
        >
          Badge Unlocked
        </div>
      </div>

      {/* Center: icon + badge name */}
      <div style={{ display: "flex", flexDirection: "column", alignItems: "center", gap: 0 }}>
        <div style={{ fontSize: 144, lineHeight: 1 }}>{icon}</div>
        <div
          style={{
            fontFamily: "BebasNeue",
            fontSize: 144,
            color: "#F1F3F9",
            lineHeight: 1.05,
            letterSpacing: "0.01em",
            marginTop: 24,
            textAlign: "center",
          }}
        >
          {badgeName}
        </div>
        {game ? (
          <div
            style={{
              fontFamily: "Outfit",
              fontSize: 30,
              color: "rgba(241,243,249,0.4)",
              letterSpacing: "0.04em",
              textTransform: "uppercase",
              marginTop: 12,
            }}
          >
            {game}
          </div>
        ) : null}
        {/* Tier rarity pill */}
        <div
          style={{
            marginTop: 36,
            background: tc.chip,
            border: `1px solid ${tc.border}`,
            borderRadius: 40,
            padding: "12px 40px",
            color: tc.label,
            fontFamily: "Outfit",
            fontSize: 28,
            fontWeight: 700,
            letterSpacing: "0.04em",
            textTransform: "uppercase",
          }}
        >
          {tierLabel}
        </div>
      </div>

      {/* Bottom row: username + URL */}
      <div style={{ display: "flex", justifyContent: "space-between", alignItems: "flex-end" }}>
        <div style={{ display: "flex", flexDirection: "column", gap: 6 }}>
          <div style={{ fontFamily: "Outfit", fontSize: 36, fontWeight: 700, color: "#F1F3F9" }}>
            {username}
          </div>
          <div style={{ fontFamily: "Outfit", fontSize: 26, color: "rgba(241,243,249,0.3)" }}>
            {`leet9.com/${username}`}
          </div>
        </div>
        <div style={{ fontFamily: "Outfit", fontSize: 24, color: "rgba(241,243,249,0.2)", letterSpacing: "0.04em" }}>
          LEET9.COM
        </div>
      </div>
    </div>,
    { width: 1600, height: 836, fonts }
  );
}
