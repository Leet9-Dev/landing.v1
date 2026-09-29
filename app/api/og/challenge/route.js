import { ImageResponse } from "@vercel/og";

export const runtime = "edge";
export const revalidate = 3600;

export async function GET(request) {
  const { searchParams } = new URL(request.url);
  const username     = searchParams.get("username")     || "You";
  const opponentName = searchParams.get("opponentName") || "Opponent";
  const userScore    = searchParams.get("userScore")    || "0";
  const opponentScore = searchParams.get("opponentScore") || "0";
  const game         = searchParams.get("game")         || "";

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

  return new ImageResponse(
    <div
      style={{
        width: "100%",
        height: "100%",
        display: "flex",
        flexDirection: "column",
        justifyContent: "space-between",
        background: "#090A12",
        padding: "44px 52px",
        position: "relative",
        overflow: "hidden",
      }}
    >
      {/* Background glow — lime */}
      <div
        style={{
          position: "absolute",
          top: "38%",
          left: "50%",
          transform: "translate(-50%, -50%)",
          width: 520,
          height: 340,
          background: "radial-gradient(ellipse, rgba(200,255,0,0.12) 0%, transparent 70%)",
          pointerEvents: "none",
        }}
      />

      {/* Top row: logo + eyebrow chip */}
      <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center" }}>
        {logoSrc ? (
          <img src={logoSrc} width={36} height={36} style={{ objectFit: "contain" }} />
        ) : (
          <div style={{ width: 36, height: 36 }} />
        )}
        <div
          style={{
            background: "rgba(200,255,0,0.1)",
            border: "1px solid rgba(200,255,0,0.3)",
            borderRadius: 8,
            padding: "5px 14px",
            color: "#C8FF00",
            fontFamily: "Outfit",
            fontSize: 13,
            fontWeight: 700,
            letterSpacing: "0.06em",
            textTransform: "uppercase",
          }}
        >
          Challenge Won
        </div>
      </div>

      {/* Center: VS scoreboard */}
      <div style={{ display: "flex", alignItems: "center", justifyContent: "center", gap: 0 }}>
        {/* Winner (user) side */}
        <div style={{ display: "flex", flexDirection: "column", alignItems: "center", flex: 1 }}>
          <div
            style={{
              fontFamily: "BebasNeue",
              fontSize: 100,
              color: "#C8FF00",
              lineHeight: 1,
              letterSpacing: "-0.01em",
            }}
          >
            {userScore}
          </div>
          <div
            style={{
              fontFamily: "Outfit",
              fontSize: 15,
              fontWeight: 700,
              color: "#F1F3F9",
              marginTop: 6,
            }}
          >
            {username}
          </div>
          <div
            style={{
              marginTop: 8,
              background: "rgba(200,255,0,0.12)",
              border: "1px solid rgba(200,255,0,0.25)",
              borderRadius: 6,
              padding: "4px 12px",
              color: "#C8FF00",
              fontFamily: "Outfit",
              fontSize: 12,
              fontWeight: 700,
              letterSpacing: "0.05em",
              textTransform: "uppercase",
            }}
          >
            Winner
          </div>
        </div>

        {/* VS divider */}
        <div
          style={{
            display: "flex",
            flexDirection: "column",
            alignItems: "center",
            padding: "0 28px",
          }}
        >
          <div
            style={{
              fontFamily: "BebasNeue",
              fontSize: 44,
              color: "rgba(241,243,249,0.2)",
              lineHeight: 1,
              letterSpacing: "0.04em",
            }}
          >
            VS
          </div>
          {game ? (
            <div
              style={{
                fontFamily: "Outfit",
                fontSize: 11,
                color: "rgba(241,243,249,0.3)",
                letterSpacing: "0.06em",
                textTransform: "uppercase",
                marginTop: 8,
                textAlign: "center",
                maxWidth: 100,
              }}
            >
              {game}
            </div>
          ) : null}
        </div>

        {/* Loser side */}
        <div style={{ display: "flex", flexDirection: "column", alignItems: "center", flex: 1 }}>
          <div
            style={{
              fontFamily: "BebasNeue",
              fontSize: 100,
              color: "rgba(241,243,249,0.25)",
              lineHeight: 1,
              letterSpacing: "-0.01em",
            }}
          >
            {opponentScore}
          </div>
          <div
            style={{
              fontFamily: "Outfit",
              fontSize: 15,
              fontWeight: 700,
              color: "rgba(241,243,249,0.5)",
              marginTop: 6,
            }}
          >
            {opponentName}
          </div>
        </div>
      </div>

      {/* Bottom row: username + URL */}
      <div style={{ display: "flex", justifyContent: "space-between", alignItems: "flex-end" }}>
        <div style={{ display: "flex", flexDirection: "column", gap: 3 }}>
          <div style={{ fontFamily: "Outfit", fontSize: 18, fontWeight: 700, color: "#F1F3F9" }}>
            {username}
          </div>
          <div style={{ fontFamily: "Outfit", fontSize: 13, color: "rgba(241,243,249,0.3)" }}>
            {`leet9.com/${username}`}
          </div>
        </div>
        <div style={{ fontFamily: "Outfit", fontSize: 12, color: "rgba(241,243,249,0.2)", letterSpacing: "0.04em" }}>
          LEET9.COM
        </div>
      </div>
    </div>,
    { width: 800, height: 418, fonts }
  );
}
