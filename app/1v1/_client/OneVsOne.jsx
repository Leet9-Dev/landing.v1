"use client";
import { useState, useEffect, Suspense } from "react";
import { useSearchParams, useRouter } from "next/navigation";

const BASE_URL =
  typeof window !== "undefined"
    ? window.location.origin
    : process.env.NEXT_PUBLIC_BASE_URL || "https://leet9.com";

function OneVsOnePage() {
  const router = useRouter();
  const searchParams = useSearchParams();

  const [p1Input, setP1Input] = useState(searchParams.get("p1") || "");
  const [p2Input, setP2Input] = useState(searchParams.get("p2") || "");
  const [loading, setLoading] = useState(false);
  const [result, setResult] = useState(null);
  const [cacheKey, setCacheKey] = useState(searchParams.get("t") || "");
  const [error, setError] = useState(null);
  const [copied, setCopied] = useState(false);

  const hasParams = searchParams.get("p1") && searchParams.get("p2");

  useEffect(() => {
    if (hasParams) {
      runComparison(searchParams.get("p1"), searchParams.get("p2"));
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  async function runComparison(p1, p2) {
    setLoading(true);
    setError(null);
    setResult(null);
    trackEvent("1v1_started", { p1, p2 });
    try {
      const res = await fetch("/api/1v1/compare", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ p1, p2 }),
      });
      const json = await res.json();
      if (json.ok) {
        setResult(json.data);
        const key = json.data.cacheKey || "";
        setCacheKey(key);
        const params = new URLSearchParams({ p1, p2, ...(key && { t: key }) });
        router.replace(`/1v1?${params}`, { scroll: false });
        trackEvent("1v1_completed", { p1, p2 });
      } else {
        setError(json.error || "Something went wrong.");
      }
    } catch {
      setError("Network error. Please try again.");
    }
    setLoading(false);
  }

  function handleSubmit(e) {
    e.preventDefault();
    if (!p1Input.trim() || !p2Input.trim()) return;
    runComparison(p1Input.trim(), p2Input.trim());
  }

  function copyShareLink() {
    if (!result) return;
    const params = new URLSearchParams({ p1: p1Input, p2: p2Input, ...(cacheKey && { t: cacheKey }) });
    const url = `${BASE_URL}/1v1?${params}`;
    navigator.clipboard.writeText(url).then(() => {
      setCopied(true);
      setTimeout(() => setCopied(false), 2000);
      trackEvent("share_clicked", { p1: p1Input, p2: p2Input });
    });
  }

  function trackEvent(name, props) {
    if (typeof window !== "undefined" && window.plausible) {
      window.plausible(name, { props });
    }
  }

  useEffect(() => {
    if (result) trackEvent("1v1_result_viewed", { hasResult: true });
  }, [result]);

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
        <a href="/" style={{ textDecoration: "none", display: "flex", alignItems: "center" }}>
          <img src="/logo-full-whitegradient.png" alt="Leet9" style={{ height: 28, width: "auto", display: "block" }} />
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
            letterSpacing: "-0.01em",
          }}
        >
          Join Leet9 — free →
        </a>
      </div>

      <div style={{ maxWidth: 860, margin: "0 auto", padding: "64px 32px 96px" }}>
        {/* Hero */}
        <div style={{ textAlign: "center", marginBottom: 52 }}>
          <div
            style={{
              display: "inline-block",
              padding: "4px 14px",
              borderRadius: 99,
              background: "rgba(255,255,255,0.04)",
              border: "1px solid rgba(255,255,255,0.1)",
              fontSize: 11,
              fontWeight: 700,
              color: "rgba(241,243,249,0.45)",
              letterSpacing: "0.12em",
              marginBottom: 24,
            }}
          >
            STEAM · 1 VS 1
          </div>
          <h1
            style={{
              fontSize: 56,
              fontWeight: 900,
              letterSpacing: "-0.035em",
              lineHeight: 1.05,
              margin: "0 0 20px",
            }}
          >
            Who&apos;s the better gamer?{" "}
            <span style={{ color: "#C8FF00" }}>Find out.</span>
          </h1>
          <p
            style={{
              fontSize: 17,
              color: "rgba(241,243,249,0.4)",
              maxWidth: 460,
              margin: "0 auto",
              lineHeight: 1.65,
              fontWeight: 400,
            }}
          >
            Two profiles. One answer. The data doesn&apos;t lie.
          </p>
        </div>

        {/* Input form */}
        <form onSubmit={handleSubmit}>
          <div
            style={{
              display: "flex",
              gap: 12,
              alignItems: "stretch",
              flexWrap: "wrap",
            }}
          >
            <SteamInput
              placeholder="Your Steam ID or profile URL"
              value={p1Input}
              onChange={setP1Input}
              accent="#C8FF00"
            />
            <div
              style={{
                display: "flex",
                alignItems: "center",
                justifyContent: "center",
                padding: "0 4px",
                fontSize: 12,
                fontWeight: 900,
                color: "rgba(255,255,255,0.14)",
                letterSpacing: "0.1em",
                flexShrink: 0,
              }}
            >
              VS
            </div>
            <SteamInput
              placeholder="Their Steam ID or profile URL"
              value={p2Input}
              onChange={setP2Input}
              accent="#a78bfa"
            />
            <button
              type="submit"
              disabled={loading || !p1Input.trim() || !p2Input.trim()}
              onClick={() => trackEvent("1v1_compare_clicked", {})}
              style={{
                padding: "12px 28px",
                borderRadius: 10,
                border: "none",
                background:
                  loading || !p1Input.trim() || !p2Input.trim()
                    ? "rgba(200,255,0,0.25)"
                    : "#C8FF00",
                color: "#07080F",
                fontFamily: "'Outfit', system-ui, sans-serif",
                fontSize: 14,
                fontWeight: 800,
                cursor:
                  loading || !p1Input.trim() || !p2Input.trim()
                    ? "not-allowed"
                    : "pointer",
                transition: "all 0.15s",
                whiteSpace: "nowrap",
                flexShrink: 0,
              }}
            >
              {loading ? "Running the numbers…" : "Settle it →"}
            </button>
          </div>
          <p
            style={{
              fontSize: 12,
              color: "rgba(241,243,249,0.18)",
              marginTop: 10,
              textAlign: "center",
            }}
          >
            Paste a SteamID64, vanity name, or full profile URL
          </p>
        </form>

        {error && (
          <div
            style={{
              marginTop: 24,
              padding: "14px 18px",
              borderRadius: 10,
              background: "rgba(239,68,68,0.08)",
              border: "1px solid rgba(239,68,68,0.2)",
              color: "#fca5a5",
              fontSize: 14,
              textAlign: "center",
            }}
          >
            {error}
          </div>
        )}

        {loading && <ComparisonSkeleton />}
        {!loading && result && (
          <ComparisonResult
            player1={result.player1}
            player2={result.player2}
            onShare={copyShareLink}
            copied={copied}
            p1Input={p1Input}
            p2Input={p2Input}
          />
        )}
      </div>
    </div>
  );
}


function SteamInput({ placeholder, value, onChange, accent }) {
  const [focused, setFocused] = useState(false);
  return (
    <input
      type="text"
      placeholder={placeholder}
      value={value}
      onChange={(e) => onChange(e.target.value)}
      onFocus={() => setFocused(true)}
      onBlur={() => setFocused(false)}
      style={{
        flex: "1 1 220px",
        padding: "12px 16px",
        borderRadius: 10,
        border: `1px solid ${focused ? `${accent}55` : "rgba(255,255,255,0.09)"}`,
        background: "rgba(255,255,255,0.03)",
        color: "#F1F3F9",
        fontFamily: "'Outfit', system-ui, sans-serif",
        fontSize: 14,
        outline: "none",
        transition: "border-color 0.15s",
      }}
    />
  );
}

function ComparisonSkeleton() {
  return (
    <div style={{ marginTop: 48 }}>
      <style>{`@keyframes shimmer{0%,100%{opacity:1}50%{opacity:0.4}}`}</style>
      <div
        style={{
          display: "grid",
          gridTemplateColumns: "1fr auto 1fr",
          gap: 20,
          alignItems: "start",
          marginTop: 40,
        }}
      >
        {[0, 1].map((i) => (
          <div
            key={i}
            style={{
              borderRadius: 16,
              border: "1px solid rgba(255,255,255,0.07)",
              background: "#0D0F1A",
              padding: 24,
              animation: "shimmer 1.4s ease infinite",
              animationDelay: `${i * 0.15}s`,
            }}
          >
            <div style={{ display: "flex", gap: 16, alignItems: "center", marginBottom: 24 }}>
              <div style={{ width: 56, height: 56, borderRadius: 12, background: "rgba(255,255,255,0.06)" }} />
              <div>
                <div style={{ width: 120, height: 16, borderRadius: 4, background: "rgba(255,255,255,0.08)", marginBottom: 8 }} />
                <div style={{ width: 80, height: 12, borderRadius: 4, background: "rgba(255,255,255,0.04)" }} />
              </div>
            </div>
            {[60, 45, 35].map((w, j) => (
              <div key={j} style={{ display: "flex", justifyContent: "space-between", marginBottom: 16, alignItems: "center" }}>
                <div style={{ width: `${w}%`, height: 12, borderRadius: 4, background: "rgba(255,255,255,0.06)" }} />
                <div style={{ width: 40, height: 12, borderRadius: 4, background: "rgba(255,255,255,0.04)" }} />
              </div>
            ))}
          </div>
        ))}
        <div style={{ display: "flex", alignItems: "center", justifyContent: "center", padding: "0 8px" }}>
          <div style={{ fontSize: 36, fontWeight: 900, color: "rgba(255,255,255,0.05)", letterSpacing: "-0.04em" }}>VS</div>
        </div>
      </div>
    </div>
  );
}

function ComparisonResult({ player1, player2, onShare, copied, p1Input, p2Input }) {
  const p1Score = player1?.l9Score ?? 0;
  const p2Score = player2?.l9Score ?? 0;
  const p1Wins = p1Score >= p2Score;
  const p1winsGames = (player1?.totalGames ?? 0) >= (player2?.totalGames ?? 0);
  const winner = p1Wins ? player1 : player2;
  const loser = p1Wins ? player2 : player1;

  const [email, setEmail] = useState("");
  const [emailSubmitting, setEmailSubmitting] = useState(false);
  const [emailCaptured, setEmailCaptured] = useState(false);
  const [emailError, setEmailError] = useState(null);

  const hasError = player1?.error || player2?.error;
  const hasPrivate = player1?.isPrivate || player2?.isPrivate;
  const showPaywall = !hasError && !hasPrivate;

  async function captureEmail(e) {
    e.preventDefault();
    if (!email.trim()) return;
    setEmailSubmitting(true);
    setEmailError(null);
    try {
      const res = await fetch("/api/1v1/capture-email", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          email: email.trim(),
          p1Input,
          p2Input,
          winnerName: winner?.name ?? null,
          l9Score1: player1?.l9Score ?? null,
          l9Score2: player2?.l9Score ?? null,
        }),
      });
      const json = await res.json();
      if (json.ok) {
        setEmailCaptured(true);
      } else {
        setEmailError("Something went wrong. Try again.");
      }
    } catch {
      setEmailError("Network error. Try again.");
    }
    setEmailSubmitting(false);
  }

  if (hasError) {
    return (
      <div style={{ marginTop: 52 }}>
        <div style={{ display: "grid", gridTemplateColumns: "1fr auto 1fr", gap: 24, alignItems: "start" }}>
          <PlayerCard player={player1} winner={false} side="left" />
          <VsDivider />
          <PlayerCard player={player2} winner={false} side="right" />
        </div>
      </div>
    );
  }

  return (
    <div style={{ marginTop: 52 }}>
      {/* Verdict + Share */}
      <div style={{ textAlign: "center", marginBottom: 36 }}>
        <div
          style={{
            fontSize: 13,
            fontWeight: 700,
            color: "rgba(241,243,249,0.3)",
            letterSpacing: "0.1em",
            textTransform: "uppercase",
            marginBottom: 10,
          }}
        >
          Verdict
        </div>
        <div
          style={{
            fontSize: 28,
            fontWeight: 900,
            color: "#F1F3F9",
            letterSpacing: "-0.02em",
            marginBottom: 28,
          }}
        >
          {hasPrivate ? (
            "One profile is private. Set it public on Steam to battle."
          ) : (
            <>
              <span style={{ color: "#C8FF00" }}>{winner?.name}</span>{" "}
              is the better gamer. No debate.
            </>
          )}
        </div>

        {/* Referral share block */}
        <div
          style={{
            display: "inline-block",
            padding: "20px 28px 22px",
            borderRadius: 16,
            border: "1px solid rgba(200,255,0,0.15)",
            background: "rgba(200,255,0,0.04)",
            maxWidth: 420,
            width: "100%",
            textAlign: "left",
            marginBottom: 4,
          }}
        >
          <div
            style={{
              fontSize: 11,
              fontWeight: 700,
              color: "#C8FF00",
              letterSpacing: "0.1em",
              textTransform: "uppercase",
              marginBottom: 6,
            }}
          >
            Share & earn
          </div>
          <div
            style={{
              fontSize: 15,
              fontWeight: 700,
              color: "#F1F3F9",
              marginBottom: 6,
              letterSpacing: "-0.01em",
              lineHeight: 1.4,
            }}
          >
            Send this result to your rival.
          </div>
          <div
            style={{
              fontSize: 13,
              color: "rgba(241,243,249,0.45)",
              lineHeight: 1.6,
              marginBottom: 18,
            }}
          >
            When they open your link and unlock the full stats, you earn{" "}
            <span style={{ color: "#C8FF00", fontWeight: 700 }}>1,000 bonus L9 Points</span>{" "}
            — automatically.
          </div>
          <button
            onClick={onShare}
            style={{
              display: "inline-flex",
              alignItems: "center",
              gap: 10,
              padding: "13px 28px",
              borderRadius: 10,
              border: "none",
              background: copied ? "rgba(200,255,0,0.15)" : "#C8FF00",
              color: copied ? "#C8FF00" : "#07080F",
              fontFamily: "'Outfit', system-ui, sans-serif",
              fontSize: 14,
              fontWeight: 800,
              cursor: "pointer",
              transition: "all 0.15s",
              letterSpacing: "-0.01em",
              boxShadow: copied ? "none" : "0 0 24px rgba(200,255,0,0.2)",
              width: "100%",
              justifyContent: "center",
            }}
          >
            {copied ? "✓ Link copied!" : "Copy link & earn 1,000 points →"}
          </button>
        </div>
      </div>

      {/* Winner card — visible, no numbers */}
      {showPaywall && <WinnerCard player={winner} />}

      {/* Private fallback — show both cards as-is */}
      {hasPrivate && (
        <div style={{ display: "grid", gridTemplateColumns: "1fr auto 1fr", gap: 24, alignItems: "start" }}>
          <PlayerCard player={player1} winner={p1Wins} side="left" />
          <VsDivider />
          <PlayerCard player={player2} winner={!p1Wins} side="right" />
        </div>
      )}

      {/* Blurred paywall section */}
      {showPaywall && (
        <div style={{ position: "relative", marginTop: 24 }}>
          {/* Blurred content */}
          <div style={{ filter: "blur(7px)", userSelect: "none", pointerEvents: "none", opacity: 0.6 }}>
            {/* VS cards teaser */}
            <div style={{ display: "grid", gridTemplateColumns: "1fr auto 1fr", gap: 24, alignItems: "start" }}>
              <PlayerCard player={winner} winner={true} side="left" />
              <VsDivider />
              <PlayerCard player={loser} winner={false} side="right" />
            </div>
            {/* Stats */}
            <div style={{ marginTop: 28, borderRadius: 14, border: "1px solid rgba(255,255,255,0.07)", background: "#0D0F1A", overflow: "hidden" }}>
              <StatRow
                label="L9 Score"
                v1={`${player1?.l9Score ?? 0}`}
                v2={`${player2?.l9Score ?? 0}`}
                p1Wins={p1Wins}
              />
              <StatRow
                label="Achievement Rate"
                v1={`${player1?.achievementRatePct ?? 0}%`}
                v2={`${player2?.achievementRatePct ?? 0}%`}
                p1Wins={(player1?.achievementRatePct ?? 0) >= (player2?.achievementRatePct ?? 0)}
              />
              <StatRow
                label="Avg Hours / Game"
                v1={`${player1?.avgHoursPerGame ?? 0}h`}
                v2={`${player2?.avgHoursPerGame ?? 0}h`}
                p1Wins={(player1?.avgHoursPerGame ?? 0) >= (player2?.avgHoursPerGame ?? 0)}
              />
              <StatRow
                label="Total Playtime"
                v1={`${player1?.totalPlaytimeHours?.toLocaleString() ?? 0}h`}
                v2={`${player2?.totalPlaytimeHours?.toLocaleString() ?? 0}h`}
                p1Wins={(player1?.totalPlaytimeHours ?? 0) >= (player2?.totalPlaytimeHours ?? 0)}
              />
              <StatRow
                label="Games Owned"
                v1={player1?.totalGames?.toLocaleString() ?? "0"}
                v2={player2?.totalGames?.toLocaleString() ?? "0"}
                p1Wins={p1winsGames}
                divider={false}
              />
            </div>
            {/* Top games */}
            <div style={{ marginTop: 20, display: "grid", gridTemplateColumns: "1fr 1fr", gap: 16 }}>
              <TopGames games={player1?.topGames ?? []} name={player1?.name} />
              <TopGames games={player2?.topGames ?? []} name={player2?.name} />
            </div>
          </div>

          {/* Paywall overlay */}
          <div
            style={{
              position: "absolute",
              inset: 0,
              display: "flex",
              alignItems: "center",
              justifyContent: "center",
              background: "linear-gradient(to bottom, transparent 0%, rgba(7,8,15,0.7) 30%, rgba(7,8,15,0.85) 60%)",
            }}
          >
            <div
              style={{
                textAlign: "center",
                padding: "36px 40px",
                borderRadius: 20,
                background: "rgba(13,15,26,0.92)",
                border: "1px solid rgba(200,255,0,0.15)",
                backdropFilter: "blur(12px)",
                maxWidth: 420,
              }}
            >
              <div style={{ fontSize: 28, marginBottom: 10 }}>🔒</div>
              <div
                style={{
                  fontSize: 19,
                  fontWeight: 900,
                  color: "#F1F3F9",
                  letterSpacing: "-0.02em",
                  marginBottom: 6,
                }}
              >
                See the full breakdown
              </div>
              <div
                style={{
                  fontSize: 13,
                  color: "rgba(241,243,249,0.4)",
                  lineHeight: 1.6,
                  marginBottom: 20,
                }}
              >
                €1 one-time · <span style={{ color: "#C8FF00", fontWeight: 700 }}>500 L9 Points</span> · Full access to Leet9
              </div>

              {!emailCaptured ? (
                <form onSubmit={captureEmail} style={{ width: "100%" }}>
                  <div style={{ fontSize: 12, fontWeight: 700, color: "rgba(241,243,249,0.35)", letterSpacing: "0.06em", textTransform: "uppercase", marginBottom: 8 }}>
                    Save your score first
                  </div>
                  <div style={{ display: "flex", gap: 8, flexDirection: "column" }}>
                    <input
                      type="email"
                      placeholder="your@email.com"
                      value={email}
                      onChange={(e) => setEmail(e.target.value)}
                      required
                      style={{
                        width: "100%",
                        padding: "11px 14px",
                        borderRadius: 8,
                        border: "1px solid rgba(255,255,255,0.12)",
                        background: "rgba(255,255,255,0.04)",
                        color: "#F1F3F9",
                        fontFamily: "'Outfit', system-ui, sans-serif",
                        fontSize: 14,
                        outline: "none",
                        boxSizing: "border-box",
                      }}
                    />
                    <button
                      type="submit"
                      disabled={emailSubmitting}
                      style={{
                        padding: "12px 24px",
                        borderRadius: 8,
                        border: "none",
                        background: emailSubmitting ? "rgba(200,255,0,0.4)" : "#C8FF00",
                        color: "#07080F",
                        fontFamily: "'Outfit', system-ui, sans-serif",
                        fontSize: 14,
                        fontWeight: 800,
                        cursor: emailSubmitting ? "not-allowed" : "pointer",
                        width: "100%",
                      }}
                    >
                      {emailSubmitting ? "Saving…" : "Save my score →"}
                    </button>
                  </div>
                  {emailError && (
                    <div style={{ fontSize: 12, color: "#fca5a5", marginTop: 8 }}>{emailError}</div>
                  )}
                </form>
              ) : (
                <>
                  <div style={{ fontSize: 13, color: "rgba(200,255,0,0.8)", marginBottom: 16, fontWeight: 600 }}>
                    ✓ Score saved — check your inbox.
                  </div>
                  <button
                    disabled
                    style={{
                      display: "inline-flex",
                      alignItems: "center",
                      gap: 8,
                      padding: "13px 32px",
                      borderRadius: 10,
                      border: "none",
                      background: "#C8FF00",
                      color: "#07080F",
                      fontFamily: "'Outfit', system-ui, sans-serif",
                      fontSize: 14,
                      fontWeight: 800,
                      cursor: "not-allowed",
                      opacity: 0.6,
                      width: "100%",
                      justifyContent: "center",
                    }}
                  >
                    Unlock for €1 — coming soon
                  </button>
                </>
              )}
              <div style={{ marginTop: 14 }}>
                <a
                  href="/signup"
                  style={{
                    fontSize: 12,
                    color: "rgba(241,243,249,0.3)",
                    textDecoration: "none",
                    borderBottom: "1px solid rgba(255,255,255,0.08)",
                    paddingBottom: 1,
                  }}
                >
                  Just want your profile? Join free →
                </a>
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}

function WinnerCard({ player }) {
  return (
    <div
      style={{
        display: "flex",
        flexDirection: "column",
        alignItems: "center",
        gap: 16,
        padding: "28px 24px",
        borderRadius: 16,
        border: "1px solid rgba(200,255,0,0.2)",
        background: "#0D0F1A",
        boxShadow: "0 0 40px rgba(200,255,0,0.06)",
      }}
    >
      {player?.avatarUrl && (
        <img
          src={player.avatarUrl}
          alt={player.name}
          width={72}
          height={72}
          style={{
            borderRadius: 14,
            border: "2px solid #C8FF00",
          }}
        />
      )}
      <div style={{ textAlign: "center" }}>
        <div
          style={{
            fontSize: 20,
            fontWeight: 900,
            color: "#F1F3F9",
            letterSpacing: "-0.01em",
            marginBottom: 8,
          }}
        >
          {player?.name}
        </div>
        <span
          style={{
            display: "inline-block",
            fontSize: 11,
            fontWeight: 800,
            letterSpacing: "0.12em",
            color: "#C8FF00",
            background: "rgba(200,255,0,0.1)",
            border: "1px solid rgba(200,255,0,0.25)",
            padding: "4px 14px",
            borderRadius: 99,
          }}
        >
          WINNER
        </span>
      </div>
    </div>
  );
}

function PlayerCard({ player, winner, side }) {
  if (!player || player.error) {
    const isSteamDown = player?.error === "steam_offline";
    return (
      <div
        style={{
          borderRadius: 16,
          border: "1px solid rgba(239,68,68,0.15)",
          background: "#0D0F1A",
          padding: 24,
        }}
      >
        <div style={{ fontSize: 14, color: "rgba(239,68,68,0.6)", fontWeight: 600 }}>
          {isSteamDown ? "Steam is unreachable right now" : "Profile not found"}
        </div>
        <div style={{ fontSize: 12, color: "rgba(241,243,249,0.25)", marginTop: 4 }}>
          {isSteamDown
            ? "Steam API is offline. Give it a minute and try again."
            : "Double-check the Steam ID or profile URL."}
        </div>
      </div>
    );
  }

  return (
    <div
      style={{
        borderRadius: 16,
        border: `1px solid ${winner ? "rgba(200,255,0,0.18)" : "rgba(255,255,255,0.07)"}`,
        background: "#0D0F1A",
        padding: 24,
        textAlign: side === "right" ? "right" : "left",
      }}
    >
      <div
        style={{
          display: "flex",
          gap: 14,
          alignItems: "center",
          flexDirection: side === "right" ? "row-reverse" : "row",
          marginBottom: 18,
        }}
      >
        {player.avatarUrl && (
          <img
            src={player.avatarUrl}
            alt={player.name}
            width={56}
            height={56}
            style={{
              borderRadius: 12,
              border: `2px solid ${winner ? "#C8FF00" : "rgba(255,255,255,0.08)"}`,
              flexShrink: 0,
            }}
          />
        )}
        <div>
          <div
            style={{
              fontSize: 16,
              fontWeight: 800,
              color: "#F1F3F9",
              letterSpacing: "-0.01em",
              marginBottom: 5,
            }}
          >
            {player.name}
          </div>
          {winner && (
            <span
              style={{
                display: "inline-block",
                fontSize: 10,
                fontWeight: 800,
                letterSpacing: "0.1em",
                color: "#C8FF00",
                background: "rgba(200,255,0,0.1)",
                border: "1px solid rgba(200,255,0,0.2)",
                padding: "2px 8px",
                borderRadius: 99,
              }}
            >
              WINNER
            </span>
          )}
          {player.isPrivate && (
            <span
              style={{
                display: "inline-block",
                fontSize: 10,
                fontWeight: 700,
                color: "rgba(241,243,249,0.35)",
                background: "rgba(255,255,255,0.05)",
                border: "1px solid rgba(255,255,255,0.09)",
                padding: "2px 8px",
                borderRadius: 99,
              }}
            >
              PRIVATE
            </span>
          )}
        </div>
      </div>

      {player.isPrivate ? (
        <div
          style={{
            padding: "12px 0",
            borderTop: "1px solid rgba(255,255,255,0.05)",
          }}
        >
          <div style={{ fontSize: 13, color: "rgba(241,243,249,0.35)", marginBottom: 6 }}>
            Profile is set to private — no data available.
          </div>
          <a
            href="https://steamcommunity.com/my/privacy/settings"
            target="_blank"
            rel="noopener noreferrer"
            style={{
              fontSize: 11,
              color: "rgba(99,102,241,0.7)",
              textDecoration: "none",
              borderBottom: "1px solid rgba(99,102,241,0.3)",
              paddingBottom: 1,
            }}
          >
            Make profile public on Steam ↗
          </a>
        </div>
      ) : (
        <>
          <div
            style={{
              fontSize: 36,
              fontWeight: 900,
              color: winner ? "#C8FF00" : "#F1F3F9",
              letterSpacing: "-0.03em",
              lineHeight: 1,
              marginBottom: 4,
            }}
          >
            {player.totalPlaytimeHours?.toLocaleString()}h
          </div>
          <div
            style={{
              fontSize: 12,
              color: "rgba(241,243,249,0.3)",
              marginBottom: 14,
            }}
          >
            total playtime · {player.totalGames} games
          </div>
          <a
            href={player.profileUrl}
            target="_blank"
            rel="noopener noreferrer"
            style={{
              fontSize: 11,
              color: "rgba(241,243,249,0.25)",
              textDecoration: "none",
              borderBottom: "1px solid rgba(255,255,255,0.07)",
              paddingBottom: 1,
            }}
          >
            Steam profile ↗
          </a>
        </>
      )}
    </div>
  );
}

function VsDivider() {
  return (
    <div
      style={{
        display: "flex",
        alignItems: "center",
        justifyContent: "center",
        padding: "24px 0",
      }}
    >
      <div
        style={{
          fontSize: 40,
          fontWeight: 900,
          color: "rgba(255,255,255,0.05)",
          letterSpacing: "-0.04em",
          lineHeight: 1,
        }}
      >
        VS
      </div>
    </div>
  );
}

function StatRow({ label, v1, v2, p1Wins, p1Private, p2Private, divider = true }) {
  return (
    <div
      style={{
        display: "grid",
        gridTemplateColumns: "1fr auto 1fr",
        alignItems: "center",
        padding: "18px 24px",
        borderBottom: divider ? "1px solid rgba(255,255,255,0.05)" : "none",
      }}
    >
      <div
        style={{
          fontSize: 22,
          fontWeight: 900,
          color: !p1Private && p1Wins ? "#C8FF00" : p1Private ? "rgba(241,243,249,0.15)" : "#F1F3F9",
          letterSpacing: "-0.02em",
        }}
      >
        {p1Private ? "—" : v1}
      </div>
      <div
        style={{
          fontSize: 11,
          fontWeight: 700,
          color: "rgba(241,243,249,0.2)",
          letterSpacing: "0.08em",
          textAlign: "center",
          padding: "0 20px",
          textTransform: "uppercase",
        }}
      >
        {label}
      </div>
      <div
        style={{
          fontSize: 22,
          fontWeight: 900,
          color: !p2Private && !p1Wins ? "#C8FF00" : p2Private ? "rgba(241,243,249,0.15)" : "#F1F3F9",
          letterSpacing: "-0.02em",
          textAlign: "right",
        }}
      >
        {p2Private ? "—" : v2}
      </div>
    </div>
  );
}

function TopGames({ games, name }) {
  if (!games?.length) return null;
  return (
    <div
      style={{
        borderRadius: 14,
        border: "1px solid rgba(255,255,255,0.06)",
        background: "#0D0F1A",
        padding: "20px 22px",
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
        {name}&apos;s arsenal
      </div>
      {games.slice(0, 5).map((g, i) => (
        <div
          key={g.appId}
          style={{
            display: "flex",
            alignItems: "center",
            gap: 12,
            marginBottom: i < games.length - 1 ? 12 : 0,
          }}
        >
          {g.iconUrl && (
            <img
              src={g.iconUrl}
              alt={g.name}
              width={28}
              height={28}
              style={{ borderRadius: 4, flexShrink: 0 }}
            />
          )}
          <div style={{ flex: 1, minWidth: 0 }}>
            <div
              style={{
                fontSize: 13,
                fontWeight: 600,
                color: "#F1F3F9",
                overflow: "hidden",
                textOverflow: "ellipsis",
                whiteSpace: "nowrap",
              }}
            >
              {g.name}
            </div>
          </div>
          <div
            style={{
              fontSize: 12,
              fontWeight: 700,
              color: "rgba(200,255,0,0.55)",
              flexShrink: 0,
            }}
          >
            {g.playtimeHours}h
          </div>
        </div>
      ))}
    </div>
  );
}

export default OneVsOnePage;
