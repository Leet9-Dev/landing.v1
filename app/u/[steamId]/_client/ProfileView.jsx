"use client";
import { useState } from "react";

const BASE_URL =
  typeof window !== "undefined"
    ? window.location.origin
    : process.env.NEXT_PUBLIC_BASE_URL || "https://leet9.com";

export default function ProfileView({ profile }) {
  const [copied, setCopied] = useState(false);

  function copyProfileLink() {
    const url = `${BASE_URL}/u/${profile.steamId}`;
    navigator.clipboard.writeText(url).then(() => {
      setCopied(true);
      setTimeout(() => setCopied(false), 2000);
    });
  }

  const scoreColor =
    profile.l9Score >= 70 ? "#C8FF00" : profile.l9Score >= 40 ? "#a78bfa" : "#F1F3F9";

  return (
    <div
      style={{
        minHeight: "100vh",
        background: "#07080F",
        fontFamily: "'Outfit', system-ui, sans-serif",
        color: "#F1F3F9",
      }}
    >
      {/* Header */}
      <div
        style={{
          borderBottom: "1px solid rgba(255,255,255,0.06)",
          padding: "18px 32px",
          display: "flex",
          alignItems: "center",
          justifyContent: "space-between",
        }}
      >
        <a href="/" style={{ textDecoration: "none" }}>
          <img src="/logo-full-whitegradient.png" alt="Leet9" style={{ height: 28, display: "block" }} />
        </a>
        <a
          href="/signup"
          style={{
            display: "inline-flex",
            alignItems: "center",
            padding: "8px 18px",
            borderRadius: 8,
            background: "#C8FF00",
            color: "#07080F",
            fontSize: 13,
            fontWeight: 800,
            textDecoration: "none",
          }}
        >
          Join Leet9 — free →
        </a>
      </div>

      <div style={{ maxWidth: 720, margin: "0 auto", padding: "64px 32px 96px" }}>
        {profile.isPrivate ? (
          <div style={{ textAlign: "center", padding: "80px 0" }}>
            <div style={{ fontSize: 48, marginBottom: 16 }}>🔒</div>
            <div style={{ fontSize: 22, fontWeight: 800, marginBottom: 8 }}>Profile is private</div>
            <div style={{ fontSize: 14, color: "rgba(241,243,249,0.4)" }}>
              This Steam profile is set to private. Stats are hidden.
            </div>
          </div>
        ) : (
          <>
            {/* Profile header */}
            <div style={{ display: "flex", alignItems: "center", gap: 24, marginBottom: 40 }}>
              {profile.avatarUrl && (
                <img
                  src={profile.avatarUrl}
                  alt={profile.name}
                  width={88}
                  height={88}
                  style={{
                    borderRadius: 18,
                    border: `3px solid ${scoreColor}`,
                    flexShrink: 0,
                  }}
                />
              )}
              <div>
                <div
                  style={{
                    fontSize: 11,
                    fontWeight: 700,
                    color: "rgba(241,243,249,0.3)",
                    letterSpacing: "0.1em",
                    textTransform: "uppercase",
                    marginBottom: 6,
                  }}
                >
                  Leet9 Gaming Profile
                </div>
                <div
                  style={{
                    fontSize: 30,
                    fontWeight: 900,
                    letterSpacing: "-0.02em",
                    lineHeight: 1.1,
                    marginBottom: 8,
                  }}
                >
                  {profile.name}
                </div>
                <a
                  href={profile.profileUrl}
                  target="_blank"
                  rel="noopener noreferrer"
                  style={{
                    fontSize: 12,
                    color: "rgba(241,243,249,0.25)",
                    textDecoration: "none",
                    borderBottom: "1px solid rgba(255,255,255,0.07)",
                    paddingBottom: 1,
                  }}
                >
                  Steam profile ↗
                </a>
              </div>
            </div>

            {/* L9 Score — hero number */}
            <div
              style={{
                borderRadius: 20,
                border: `1px solid ${scoreColor}22`,
                background: "#0D0F1A",
                padding: "32px 36px",
                marginBottom: 20,
                display: "flex",
                alignItems: "center",
                justifyContent: "space-between",
                flexWrap: "wrap",
                gap: 24,
              }}
            >
              <div>
                <div
                  style={{
                    fontSize: 11,
                    fontWeight: 700,
                    color: "rgba(241,243,249,0.3)",
                    letterSpacing: "0.1em",
                    textTransform: "uppercase",
                    marginBottom: 8,
                  }}
                >
                  L9 Score
                </div>
                <div
                  style={{
                    fontSize: 72,
                    fontWeight: 900,
                    color: scoreColor,
                    letterSpacing: "-0.04em",
                    lineHeight: 1,
                  }}
                >
                  {profile.l9Score}
                </div>
                <div style={{ fontSize: 12, color: "rgba(241,243,249,0.3)", marginTop: 6 }}>
                  out of 100
                </div>
              </div>
              <div style={{ display: "flex", flexDirection: "column", gap: 16 }}>
                <Stat label="Achievement Rate" value={`${profile.achievementRatePct}%`} accent={scoreColor} />
                <Stat label="Avg Hours / Game" value={`${profile.avgHoursPerGame}h`} />
                <Stat label="Total Playtime" value={`${profile.totalPlaytimeHours.toLocaleString()}h`} />
                <Stat label="Games Owned" value={profile.totalGames.toLocaleString()} />
              </div>
            </div>

            {/* Top games */}
            {profile.topGames?.length > 0 && (
              <div
                style={{
                  borderRadius: 16,
                  border: "1px solid rgba(255,255,255,0.06)",
                  background: "#0D0F1A",
                  padding: "22px 24px",
                  marginBottom: 20,
                }}
              >
                <div
                  style={{
                    fontSize: 11,
                    fontWeight: 700,
                    color: "rgba(241,243,249,0.25)",
                    letterSpacing: "0.08em",
                    textTransform: "uppercase",
                    marginBottom: 16,
                  }}
                >
                  Top Games
                </div>
                {profile.topGames.map((g, i) => (
                  <div
                    key={g.appId}
                    style={{
                      display: "flex",
                      alignItems: "center",
                      gap: 12,
                      marginBottom: i < profile.topGames.length - 1 ? 12 : 0,
                    }}
                  >
                    {g.iconUrl && (
                      <img src={g.iconUrl} alt={g.name} width={28} height={28} style={{ borderRadius: 4, flexShrink: 0 }} />
                    )}
                    <div style={{ flex: 1, fontSize: 13, fontWeight: 600, color: "#F1F3F9", overflow: "hidden", textOverflow: "ellipsis", whiteSpace: "nowrap" }}>
                      {g.name}
                    </div>
                    <div style={{ fontSize: 12, fontWeight: 700, color: "rgba(200,255,0,0.55)", flexShrink: 0 }}>
                      {g.playtimeHours}h
                    </div>
                  </div>
                ))}
              </div>
            )}

            {/* CTAs */}
            <div style={{ display: "flex", gap: 12, flexWrap: "wrap" }}>
              <a
                href={`/1v1?p1=${profile.steamId}`}
                style={{
                  flex: "1 1 200px",
                  display: "flex",
                  alignItems: "center",
                  justifyContent: "center",
                  padding: "14px 28px",
                  borderRadius: 10,
                  background: "#C8FF00",
                  color: "#07080F",
                  fontSize: 14,
                  fontWeight: 800,
                  textDecoration: "none",
                  letterSpacing: "-0.01em",
                  boxShadow: "0 0 28px rgba(200,255,0,0.2)",
                }}
              >
                Challenge {profile.name} →
              </a>
              <button
                onClick={copyProfileLink}
                style={{
                  flex: "1 1 160px",
                  padding: "14px 28px",
                  borderRadius: 10,
                  border: "1px solid rgba(255,255,255,0.1)",
                  background: copied ? "rgba(200,255,0,0.08)" : "transparent",
                  color: copied ? "#C8FF00" : "rgba(241,243,249,0.6)",
                  fontFamily: "'Outfit', system-ui, sans-serif",
                  fontSize: 14,
                  fontWeight: 700,
                  cursor: "pointer",
                  transition: "all 0.15s",
                }}
              >
                {copied ? "✓ Link copied!" : "Copy profile link"}
              </button>
            </div>

            {/* Claim CTA */}
            <div
              style={{
                marginTop: 32,
                padding: "24px 28px",
                borderRadius: 14,
                border: "1px solid rgba(255,255,255,0.06)",
                background: "#0D0F1A",
                textAlign: "center",
              }}
            >
              <div style={{ fontSize: 13, color: "rgba(241,243,249,0.35)", marginBottom: 6 }}>
                Don&apos;t have your own Leet9 profile yet?
              </div>
              <div style={{ fontSize: 16, fontWeight: 800, color: "#F1F3F9", marginBottom: 14 }}>
                Claim yours for €1 — get 500 L9 Points included.
              </div>
              <a
                href="/1v1"
                style={{
                  fontSize: 13,
                  fontWeight: 700,
                  color: "#C8FF00",
                  textDecoration: "none",
                  borderBottom: "1px solid rgba(200,255,0,0.3)",
                  paddingBottom: 1,
                }}
              >
                Start with a 1v1 battle →
              </a>
            </div>
          </>
        )}
      </div>
    </div>
  );
}

function Stat({ label, value, accent }) {
  return (
    <div style={{ display: "flex", gap: 12, alignItems: "baseline" }}>
      <div style={{ fontSize: 18, fontWeight: 900, color: accent || "#F1F3F9", letterSpacing: "-0.02em", minWidth: 60, textAlign: "right" }}>
        {value}
      </div>
      <div style={{ fontSize: 11, fontWeight: 600, color: "rgba(241,243,249,0.3)", letterSpacing: "0.04em", textTransform: "uppercase" }}>
        {label}
      </div>
    </div>
  );
}
