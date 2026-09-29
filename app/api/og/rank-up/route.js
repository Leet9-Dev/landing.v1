import { ImageResponse } from "@vercel/og";

export const runtime = "edge";

// Cache for 1 hour — cards are tied to a specific rank snapshot, so params are unique.
export const revalidate = 3600;

export async function GET(request) {
  const { searchParams } = new URL(request.url);
  const rank = searchParams.get("rank") || "?";
  const delta = searchParams.get("delta") || null;
  const username = searchParams.get("username") || "Gamer";
  const platform = searchParams.get("platform") || "Steam";

  // Load fonts and logo in parallel.
  const [bebasFont, outfitFont, logoData] = await Promise.all([
    fetch(new URL("/fonts/BebasNeue-Regular.ttf", request.url)).then((r) =>
      r.arrayBuffer()
    ).catch(() => null),
    fetch(new URL("/fonts/Outfit-Bold.ttf", request.url)).then((r) =>
      r.arrayBuffer()
    ).catch(() => null),
    fetch(new URL("/logo-icon.png", request.url)).then((r) =>
      r.arrayBuffer()
    ).catch(() => null),
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
      {/* Background glow */}
      <div
        style={{
          position: "absolute",
          top: "30%",
          left: "50%",
          transform: "translate(-50%, -50%)",
          width: 480,
          height: 320,
          background:
            "radial-gradient(ellipse, rgba(200,255,0,0.13) 0%, transparent 70%)",
          pointerEvents: "none",
        }}
      />

      {/* Top row: logo + tag */}
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
          Rank Up
        </div>
      </div>

      {/* Center: rank number */}
      <div style={{ display: "flex", flexDirection: "column", alignItems: "center", gap: 0 }}>
        <div
          style={{
            fontFamily: "BebasNeue",
            fontSize: 140,
            color: "#F1F3F9",
            lineHeight: 1,
            letterSpacing: "-0.02em",
          }}
        >
          {`#${rank}`}
        </div>
        <div
          style={{
            fontFamily: "Outfit",
            fontSize: 16,
            color: "rgba(241,243,249,0.45)",
            letterSpacing: "0.04em",
            textTransform: "uppercase",
            marginTop: 4,
          }}
        >
          {`worldwide · ${platform}`}
        </div>
        {delta && (
          <div
            style={{
              marginTop: 16,
              background: "rgba(200,255,0,0.12)",
              border: "1px solid rgba(200,255,0,0.2)",
              borderRadius: 8,
              padding: "6px 18px",
              color: "#C8FF00",
              fontFamily: "Outfit",
              fontSize: 15,
              fontWeight: 700,
            }}
          >
            {`↑ ${delta} places`}
          </div>
        )}
      </div>

      {/* Bottom row: username + URL */}
      <div style={{ display: "flex", justifyContent: "space-between", alignItems: "flex-end" }}>
        <div style={{ display: "flex", flexDirection: "column", gap: 3 }}>
          <div
            style={{
              fontFamily: "Outfit",
              fontSize: 18,
              fontWeight: 700,
              color: "#F1F3F9",
            }}
          >
            {username}
          </div>
          <div
            style={{
              fontFamily: "Outfit",
              fontSize: 13,
              color: "rgba(241,243,249,0.3)",
            }}
          >
            {`leet9.com/${username}`}
          </div>
        </div>
        <div
          style={{
            fontFamily: "Outfit",
            fontSize: 12,
            color: "rgba(241,243,249,0.2)",
            letterSpacing: "0.04em",
          }}
        >
          LEET9.COM
        </div>
      </div>
    </div>,
    {
      width: 800,
      height: 418,
      fonts,
    }
  );
}
