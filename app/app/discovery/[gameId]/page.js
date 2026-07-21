"use client";
import { useState, useEffect, use } from "react";
import { useRouter } from "next/navigation";

export default function GameDeepDivePage({ params }) {
  const { gameId } = use(params);
  const router = useRouter();
  const [data, setData] = useState(null);
  const [loading, setLoading] = useState(true);
  const [inProfile, setInProfile] = useState(false);
  const [adding, setAdding] = useState(false);
  const [toast, setToast] = useState(null);

  useEffect(() => {
    fetch(`/api/games/${gameId}`)
      .then((r) => r.json())
      .then((json) => {
        if (json.ok) {
          setData(json.data);
          setInProfile(json.data.currentUserGame?.inProfile ?? false);
        }
        setLoading(false);
      });
  }, [gameId]);

  async function handleAddToProfile() {
    if (inProfile || adding) return;
    setAdding(true);
    const res = await fetch(`/api/me/games/${gameId}/add`, { method: "POST" });
    const json = await res.json();
    if (json.ok) {
      setInProfile(true);
      showToast(`${data.game.canonicalTitle} added to your Profile!`);
    }
    setAdding(false);
  }

  function showToast(msg) {
    setToast(msg);
    setTimeout(() => setToast(null), 3500);
  }

  if (loading) return <LoadingState />;
  if (!data) return <NotFoundState onBack={() => router.push("/app/discovery")} />;

  const { game, externalSources, currentUserGame } = data;

  return (
    <div style={{ fontFamily: "'Outfit', sans-serif", minHeight: "100vh" }}>
      {/* Toast */}
      {toast && (
        <div style={{
          position: "fixed",
          bottom: 28,
          right: 28,
          zIndex: 100,
          padding: "12px 20px",
          borderRadius: 12,
          background: "#C8FF00",
          color: "#07080F",
          fontWeight: 700,
          fontSize: 13,
          boxShadow: "0 4px 24px rgba(200,255,0,0.35)",
          animation: "slideUp 0.3s ease",
        }}>
          {toast}
        </div>
      )}
      <style>{`
        @keyframes slideUp { from { transform: translateY(20px); opacity:0; } to { transform: none; opacity:1; } }
        .game-detail-content { padding: 32px 36px; max-width: 960px; }
        .game-detail-grid { display: grid; grid-template-columns: 1fr 320px; gap: 32px; }
        .game-action-card { border-radius: 16px; border: 1px solid rgba(255,255,255,0.08); background: rgba(255,255,255,0.02); padding: 22px; position: sticky; top: 80px; }
        @media (max-width: 640px) {
          .game-detail-content { padding: 20px 16px; }
          .game-detail-grid { grid-template-columns: 1fr; gap: 24px; }
          .game-action-card { position: static; }
          .game-hero { padding: 20px 16px !important; }
          .game-back-btn { left: 16px !important; }
          .game-title { font-size: 26px !important; }
        }
      `}</style>

      {/* Hero */}
      <div style={{
        height: 260,
        background: game.heroGradient,
        position: "relative",
        display: "flex",
        flexDirection: "column",
        justifyContent: "flex-end",
        padding: "28px 36px",
      }}>
        {/* Back */}
        <button
          onClick={() => router.push("/app/discovery")}
          style={{
            position: "absolute",
            top: 20,
            left: 36,
            padding: "6px 14px",
            borderRadius: 8,
            border: "1px solid rgba(255,255,255,0.15)",
            background: "rgba(0,0,0,0.35)",
            color: "rgba(241,243,249,0.7)",
            fontFamily: "'Outfit', sans-serif",
            fontSize: 12,
            fontWeight: 600,
            cursor: "pointer",
            backdropFilter: "blur(8px)",
          }}
        >
          ← Discovery
        </button>

        {/* Badges */}
        <div style={{ display: "flex", gap: 8, marginBottom: 14 }}>
          {game.trendingRank !== null && (
            <Badge color="lime">#{game.trendingRank} Trending</Badge>
          )}
          {game.recentlyDetected && (
            <Badge color="indigo">Recently Detected</Badge>
          )}
          {game.sourcePlatforms.map((p) => (
            <Badge key={p} color="dark">{p === "steam" ? "Steam" : "PSN"}</Badge>
          ))}
        </div>

        <h1 style={{ fontSize: 34, fontWeight: 900, color: "#F1F3F9", letterSpacing: "-0.03em", textShadow: "0 2px 16px rgba(0,0,0,0.6)", marginBottom: 4 }}>
          {game.canonicalTitle}
        </h1>
        <div style={{ fontSize: 14, color: "rgba(241,243,249,0.55)", fontWeight: 500 }}>
          {game.studio} · {game.publisher}
        </div>
      </div>

      {/* Content */}
      <div className="game-detail-content">
        <div className="game-detail-grid">
          {/* Left */}
          <div>
            {/* Description */}
            <p style={{ fontSize: 14, color: "rgba(241,243,249,0.65)", lineHeight: 1.7, marginBottom: 24 }}>
              {game.description}
            </p>

            {/* Genres + Tags */}
            <div style={{ display: "flex", flexWrap: "wrap", gap: 6, marginBottom: 28 }}>
              {game.genres.map((g) => (
                <span key={g} style={{
                  padding: "4px 10px",
                  borderRadius: 6,
                  border: "1px solid rgba(255,255,255,0.1)",
                  background: "rgba(255,255,255,0.04)",
                  fontSize: 12,
                  color: "rgba(241,243,249,0.55)",
                  fontWeight: 500,
                }}>{g}</span>
              ))}
              {game.tags.map((t) => (
                <span key={t} style={{
                  padding: "4px 10px",
                  borderRadius: 6,
                  border: "1px solid rgba(200,255,0,0.12)",
                  background: "rgba(200,255,0,0.03)",
                  fontSize: 12,
                  color: "rgba(200,255,0,0.55)",
                  fontWeight: 500,
                }}>{t}</span>
              ))}
            </div>

            {/* Community Stats */}
            <div style={{ marginBottom: 28 }}>
              <SectionLabel>Community Stats</SectionLabel>
              <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: 10 }}>
                <StatBox label="Community Rating" value={`★ ${game.communityRating.toFixed(1)}`} accent />
                <StatBox label="Active Players" value={game.communityPlayerCount.toLocaleString()} />
                <StatBox label="Total Hours" value={`${(game.communityHours / 1000).toFixed(0)}K`} />
                <StatBox label="L9 Points Earned" value={(game.communityL9Points / 1000).toFixed(0) + "K"} />
              </div>
            </div>

            {/* External sources */}
            {externalSources.length > 0 && (
              <div>
                <SectionLabel>Where to Play</SectionLabel>
                <div style={{ display: "flex", flexDirection: "column", gap: 8 }}>
                  {externalSources.map((s) => {
                    const storeUrl = s.platform === "steam"
                      ? `https://store.steampowered.com/app/${s.externalId}/`
                      : `https://store.playstation.com/product/${s.externalId}`;
                    const isSteam = s.platform === "steam";
                    return (
                      <a
                        key={s.platform + s.externalId}
                        href={storeUrl}
                        target="_blank"
                        rel="noopener noreferrer"
                        style={{
                          display: "block",
                          width: "100%",
                          padding: "13px 20px",
                          borderRadius: 11,
                          border: `1px solid ${isSteam ? "rgba(185,216,245,0.3)" : "rgba(200,170,255,0.3)"}`,
                          background: isSteam ? "rgba(185,216,245,0.08)" : "rgba(200,170,255,0.08)",
                          color: isSteam ? "#b9d8f5" : "#c8aaff",
                          fontSize: 14,
                          fontWeight: 800,
                          textDecoration: "none",
                          fontFamily: "'Outfit', sans-serif",
                          letterSpacing: "-0.01em",
                          textAlign: "center",
                          boxSizing: "border-box",
                        }}
                      >
                        {isSteam ? "Play on Steam →" : "Play on PlayStation →"}
                      </a>
                    );
                  })}
                </div>
              </div>
            )}
          </div>

          {/* Right — action card */}
          <div>
            <div className="game-action-card">
              {/* User's stats if in library */}
              {currentUserGame && (
                <div style={{ marginBottom: 20 }}>
                  <SectionLabel>Your Stats</SectionLabel>
                  <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: 8, marginBottom: 12 }}>
                    <StatBox label="Hours" value={currentUserGame.hoursPlayed.toFixed(0)} small />
                    <StatBox label="L9 Points" value={currentUserGame.l9Points.toLocaleString()} small accent />
                    <StatBox label="Achievements" value={`${currentUserGame.achievementsUnlocked}/${currentUserGame.achievementsTotal}`} small />
                    <StatBox label="Mastery" value={`${currentUserGame.masteryPct.toFixed(0)}%`} small />
                  </div>
                  <div style={{ height: 1, background: "rgba(255,255,255,0.06)", marginBottom: 18 }} />
                </div>
              )}

              {/* Add to Profile CTA */}
              <button
                onClick={handleAddToProfile}
                disabled={inProfile || adding}
                style={{
                  width: "100%",
                  padding: "13px 20px",
                  borderRadius: 11,
                  border: "none",
                  background: inProfile
                    ? "rgba(200,255,0,0.08)"
                    : "linear-gradient(135deg, #C8FF00, #a3e600)",
                  color: inProfile ? "#C8FF00" : "#07080F",
                  fontFamily: "'Outfit', sans-serif",
                  fontSize: 14,
                  fontWeight: 800,
                  cursor: inProfile ? "default" : adding ? "wait" : "pointer",
                  letterSpacing: "-0.01em",
                  border: inProfile ? "1px solid rgba(200,255,0,0.25)" : "none",
                  transition: "all 0.18s",
                  opacity: adding ? 0.7 : 1,
                }}
              >
                {inProfile ? "✓ In Profile" : adding ? "Adding…" : "+ Add to Profile"}
              </button>

              {!inProfile && (
                <p style={{ fontSize: 11, color: "rgba(241,243,249,0.25)", textAlign: "center", marginTop: 10, lineHeight: 1.5 }}>
                  Adds this game to your public Leet9 profile
                </p>
              )}
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}

function Badge({ color, children }) {
  const styles = {
    lime: { background: "rgba(200,255,0,0.15)", border: "1px solid rgba(200,255,0,0.3)", color: "#C8FF00" },
    indigo: { background: "rgba(99,102,241,0.2)", border: "1px solid rgba(99,102,241,0.35)", color: "#a5b4fc" },
    dark: { background: "rgba(0,0,0,0.35)", border: "1px solid rgba(255,255,255,0.12)", color: "rgba(241,243,249,0.55)" },
  };
  return (
    <span style={{
      padding: "3px 10px",
      borderRadius: 6,
      fontSize: 11,
      fontWeight: 700,
      letterSpacing: "0.04em",
      backdropFilter: "blur(6px)",
      ...styles[color],
    }}>
      {children}
    </span>
  );
}

function SectionLabel({ children }) {
  return (
    <div style={{
      fontSize: 10,
      fontWeight: 700,
      color: "rgba(241,243,249,0.3)",
      letterSpacing: "0.12em",
      textTransform: "uppercase",
      marginBottom: 10,
    }}>
      {children}
    </div>
  );
}

function StatBox({ label, value, accent, small }) {
  return (
    <div style={{
      padding: small ? "8px 10px" : "10px 12px",
      borderRadius: 9,
      border: `1px solid ${accent ? "rgba(200,255,0,0.12)" : "rgba(255,255,255,0.06)"}`,
      background: accent ? "rgba(200,255,0,0.03)" : "rgba(255,255,255,0.02)",
    }}>
      <div style={{ fontSize: small ? 10 : 11, color: "rgba(241,243,249,0.3)", marginBottom: 3 }}>{label}</div>
      <div style={{ fontSize: small ? 14 : 16, fontWeight: 800, color: accent ? "#C8FF00" : "#F1F3F9", letterSpacing: "-0.02em" }}>
        {value}
      </div>
    </div>
  );
}

function LoadingState() {
  return (
    <div style={{
      minHeight: "100vh",
      display: "flex",
      alignItems: "center",
      justifyContent: "center",
      fontFamily: "'Outfit', sans-serif",
    }}>
      <div style={{ textAlign: "center" }}>
        <div style={{ width: 8, height: 8, borderRadius: "50%", background: "#C8FF00", margin: "0 auto 12px", animation: "pulse 1s ease infinite" }} />
        <div style={{ fontSize: 13, color: "rgba(241,243,249,0.3)" }}>Loading game…</div>
      </div>
      <style>{`@keyframes pulse { 0%,100%{opacity:1;} 50%{opacity:0.3;} }`}</style>
    </div>
  );
}

function NotFoundState({ onBack }) {
  return (
    <div style={{
      minHeight: "100vh",
      display: "flex",
      alignItems: "center",
      justifyContent: "center",
      fontFamily: "'Outfit', sans-serif",
    }}>
      <div style={{ textAlign: "center" }}>
        <div style={{ fontSize: 13, color: "rgba(241,243,249,0.3)", marginBottom: 16 }}>Game not found</div>
        <button
          onClick={onBack}
          style={{
            padding: "7px 16px",
            borderRadius: 8,
            border: "1px solid rgba(255,255,255,0.12)",
            background: "transparent",
            color: "rgba(241,243,249,0.5)",
            fontFamily: "'Outfit', sans-serif",
            fontSize: 13,
            cursor: "pointer",
          }}
        >
          ← Back to Discovery
        </button>
      </div>
    </div>
  );
}
