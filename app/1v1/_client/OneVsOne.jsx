"use client";
import { useState, useEffect, Suspense } from "react";
import { useSearchParams, useRouter } from "next/navigation";
import { makeComparisonKey } from "@/lib/billing-utils";

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
  const [unlocked, setUnlocked] = useState(false);
  const [unlockLoading, setUnlockLoading] = useState(false);
  const [unlockError, setUnlockError] = useState(null);

  const hasParams = searchParams.get("p1") && searchParams.get("p2");
  const stripeSessionId = searchParams.get("session_id");

  useEffect(() => {
    if (hasParams) {
      runComparison(searchParams.get("p1"), searchParams.get("p2"));
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  // Check unlock status once we have both steamIds resolved
  useEffect(() => {
    if (!result?.player1?.steamId || !result?.player2?.steamId) return;
    const key = makeComparisonKey(result.player1.steamId, result.player2.steamId);
    const params = new URLSearchParams({ key });
    if (stripeSessionId) params.set("session_id", stripeSessionId);
    fetch(`/api/billing/unlock-status?${params}`)
      .then((r) => r.json())
      .then((json) => { if (json.ok && json.data?.unlocked) setUnlocked(true); })
      .catch(() => {});
  }, [result, stripeSessionId]);

  async function runComparison(p1, p2) {
    setLoading(true);
    setError(null);
    setResult(null);
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

  async function handleUnlock() {
    if (!result?.player1?.steamId || !result?.player2?.steamId) return;
    setUnlockLoading(true);
    setUnlockError(null);
    try {
      const res = await fetch("/api/billing/checkout", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          p1SteamId: result.player1.steamId,
          p2SteamId: result.player2.steamId,
          p1Name: result.player1.name,
          p2Name: result.player2.name,
        }),
      });
      const json = await res.json();
      if (json.ok && json.url) {
        window.location.href = json.url;
        return; // don't reset loading — we're navigating away
      }
      setUnlockError(json.error?.message || "Qualcosa è andato storto. Riprova.");
    } catch {
      setUnlockError("Errore di rete. Riprova tra qualche secondo.");
    }
    setUnlockLoading(false);
  }

  function copyShareLink() {
    if (!result) return;
    const params = new URLSearchParams({ p1: p1Input, p2: p2Input, ...(cacheKey && { t: cacheKey }) });
    const url = `${BASE_URL}/1v1?${params}`;
    navigator.clipboard.writeText(url).then(() => {
      setCopied(true);
      setTimeout(() => setCopied(false), 2000);
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
        <span
          style={{
            fontSize: 12,
            fontWeight: 500,
            color: "rgba(241,243,249,0.25)",
            letterSpacing: "0.04em",
          }}
        >
          Your gaming identity, finally visible.
        </span>
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
            You think you game more.{" "}
            <span style={{ color: "#C8FF00" }}>Prove it.</span>
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
            Two profiles. One verdict. The numbers have no mercy.
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
              {loading ? "Pulling data…" : "Settle it →"}
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
            Accepts: SteamID64 · steamcommunity.com/id/username · steamcommunity.com/profiles/ID
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
            unlocked={unlocked}
            onUnlock={handleUnlock}
            unlockLoading={unlockLoading}
            unlockError={unlockError}
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

function ComparisonResult({ player1, player2, onShare, copied, unlocked, onUnlock, unlockLoading, unlockError }) {
  const p1h = player1?.totalPlaytimeHours ?? 0;
  const p2h = player2?.totalPlaytimeHours ?? 0;
  const p1winsHours = p1h >= p2h;
  const p1winsGames = (player1?.totalGames ?? 0) >= (player2?.totalGames ?? 0);

  return (
    <div style={{ marginTop: 52 }}>
      {/* Verdict banner */}
      {!player1?.error && !player2?.error && !player1?.isPrivate && !player2?.isPrivate && (
        <div
          style={{
            textAlign: "center",
            marginBottom: 36,
          }}
        >
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
            The verdict is in
          </div>
          <div
            style={{
              fontSize: 28,
              fontWeight: 900,
              color: "#F1F3F9",
              letterSpacing: "-0.02em",
            }}
          >
            <span style={{ color: "#C8FF00" }}>
              {p1winsHours ? player2?.name : player1?.name}
            </span>{" "}
            has no excuses to make.
          </div>
        </div>
      )}

      {/* Share button */}
      <div style={{ display: "flex", justifyContent: "flex-end", marginBottom: 20 }}>
        <button
          onClick={onShare}
          style={{
            padding: "8px 20px",
            borderRadius: 99,
            border: "1px solid rgba(255,255,255,0.1)",
            background: copied ? "rgba(200,255,0,0.07)" : "transparent",
            color: copied ? "#C8FF00" : "rgba(241,243,249,0.4)",
            fontFamily: "'Outfit', system-ui, sans-serif",
            fontSize: 13,
            fontWeight: 600,
            cursor: "pointer",
            transition: "all 0.15s",
          }}
        >
          {copied ? "✓ Link copied!" : "Send this to them →"}
        </button>
      </div>

      <div
        style={{
          display: "grid",
          gridTemplateColumns: "1fr auto 1fr",
          gap: 24,
          alignItems: "start",
        }}
      >
        <PlayerCard player={player1} winner={p1winsHours} side="left" />
        <VsDivider />
        <PlayerCard player={player2} winner={!p1winsHours} side="right" />
      </div>

      {/* Stats comparison */}
      <div
        style={{
          marginTop: 28,
          borderRadius: 14,
          border: "1px solid rgba(255,255,255,0.07)",
          background: "#0D0F1A",
          overflow: "hidden",
        }}
      >
        <StatRow
          label="Total Playtime"
          v1={`${player1?.totalPlaytimeHours?.toLocaleString() ?? 0}h`}
          v2={`${player2?.totalPlaytimeHours?.toLocaleString() ?? 0}h`}
          p1Wins={p1winsHours}
          p1Private={player1?.isPrivate}
          p2Private={player2?.isPrivate}
        />
        <StatRow
          label="Games Owned"
          v1={player1?.totalGames?.toLocaleString() ?? "0"}
          v2={player2?.totalGames?.toLocaleString() ?? "0"}
          p1Wins={p1winsGames}
          p1Private={player1?.isPrivate}
          p2Private={player2?.isPrivate}
          divider={false}
        />
      </div>

      {/* Top games */}
      {!player1?.isPrivate && !player2?.isPrivate && (
        <div
          style={{
            marginTop: 20,
            display: "grid",
            gridTemplateColumns: "1fr 1fr",
            gap: 16,
          }}
        >
          <div>
            {(player1?.topGames?.length ?? 0) > 0 && (
              <TopGames games={player1.topGames} name={player1.name} />
            )}
          </div>
          <div>
            {(player2?.topGames?.length ?? 0) > 0 && (
              <TopGames games={player2.topGames} name={player2.name} />
            )}
          </div>
        </div>
      )}

      {/* Paid details section */}
      {!player1?.error && !player2?.error && !player1?.isPrivate && !player2?.isPrivate && (
        <PaidDetailsSection
          player1={player1}
          player2={player2}
          unlocked={unlocked}
          onUnlock={onUnlock}
          unlockLoading={unlockLoading}
          unlockError={unlockError}
        />
      )}

      {/* What is Leet9 + CTA */}
      <div
        style={{
          marginTop: 44,
          borderRadius: 16,
          border: "1px solid rgba(255,255,255,0.07)",
          background: "#0D0F1A",
          overflow: "hidden",
        }}
      >
        {/* What is Leet9 */}
        <div
          style={{
            padding: "32px 36px 28px",
            borderBottom: "1px solid rgba(255,255,255,0.05)",
          }}
        >
          <div
            style={{
              display: "flex",
              alignItems: "center",
              gap: 12,
              marginBottom: 16,
            }}
          >
            <img src="/logo-full-whitegradient.png" alt="Leet9" style={{ height: 20, width: "auto", display: "block", opacity: 0.6 }} />
            <span
              style={{
                fontSize: 13,
                fontWeight: 600,
                color: "rgba(241,243,249,0.35)",
                letterSpacing: "0.04em",
              }}
            >
              What is Leet9?
            </span>
          </div>
          <p
            style={{
              fontSize: 15,
              color: "rgba(241,243,249,0.5)",
              lineHeight: 1.7,
              margin: 0,
              maxWidth: 540,
            }}
          >
            Leet9 is your One Gamer ID — a single profile that connects every game
            you play on every platform: PC, console, mobile. Real stats, live.
            Earn L9 Points not just for hours logged, but for every achievement
            earned, every competition won, every milestone reached. The gaming
            identity that finally reflects the real gamer you actually are.
          </p>
        </div>

        {/* CTA */}
        <div style={{ padding: "28px 36px 32px", textAlign: "center" }}>
          <div
            style={{
              fontSize: 11,
              fontWeight: 700,
              color: "rgba(241,243,249,0.2)",
              letterSpacing: "0.1em",
              textTransform: "uppercase",
              marginBottom: 12,
            }}
          >
            Your hours are on record. Are you?
          </div>
          <div
            style={{
              fontSize: 22,
              fontWeight: 900,
              color: "#F1F3F9",
              letterSpacing: "-0.02em",
              marginBottom: 22,
              lineHeight: 1.3,
            }}
          >
            Build the profile that backs up the talk.
          </div>
          <a
            href="/signup"
            style={{
              display: "inline-block",
              padding: "13px 32px",
              borderRadius: 10,
              background: "#C8FF00",
              color: "#07080F",
              fontSize: 14,
              fontWeight: 800,
              textDecoration: "none",
              letterSpacing: "0.01em",
            }}
          >
            Join Leet9 — it&apos;s free
          </a>
        </div>
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
          {isSteamDown ? "Steam is unreachable" : "Profile not found"}
        </div>
        <div style={{ fontSize: 12, color: "rgba(241,243,249,0.25)", marginTop: 4 }}>
          {isSteamDown
            ? "Steam API is currently offline. Try again in a few minutes."
            : "Check the Steam ID or URL and try again."}
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
            This profile is private — stats are hidden.
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
      {games.slice(0, 5).map((g, i) => ( // first 5 free; 6–10 in paid section
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

function PaidDetailsSection({ player1, player2, unlocked, onUnlock, unlockLoading, unlockError }) {
  const p1Score = player1?.l9Score ?? 0;
  const p2Score = player2?.l9Score ?? 0;
  const p1WinsScore = p1Score >= p2Score;
  const p1Depth = player1?.depthRatio ?? 0;
  const p2Depth = player2?.depthRatio ?? 0;
  const p1WinsDepth = p1Depth >= p2Depth;

  return (
    <div style={{ marginTop: 24, position: "relative" }}>
      {/* Section header */}
      <div
        style={{
          display: "flex",
          alignItems: "center",
          gap: 10,
          marginBottom: 16,
        }}
      >
        <div
          style={{
            fontSize: 11,
            fontWeight: 700,
            color: "rgba(241,243,249,0.25)",
            letterSpacing: "0.08em",
            textTransform: "uppercase",
          }}
        >
          Analisi Dettagliata
        </div>
        {!unlocked && (
          <span
            style={{
              fontSize: 9,
              fontWeight: 800,
              color: "#C8FF00",
              background: "rgba(200,255,0,0.1)",
              border: "1px solid rgba(200,255,0,0.25)",
              borderRadius: 4,
              padding: "2px 7px",
              letterSpacing: "0.08em",
            }}
          >
            €1
          </span>
        )}
        <div style={{ flex: 1, height: 1, background: "rgba(255,255,255,0.05)" }} />
      </div>

      {/* Content — blurred when locked */}
      <div style={{ position: "relative" }}>
        <div
          style={{
            filter: unlocked ? "none" : "blur(6px)",
            pointerEvents: unlocked ? "auto" : "none",
            userSelect: unlocked ? "auto" : "none",
            transition: "filter 0.3s",
            borderRadius: 14,
            border: "1px solid rgba(255,255,255,0.07)",
            background: "#0D0F1A",
            overflow: "hidden",
          }}
        >
          {/* L9 Score */}
          <div
            style={{
              display: "grid",
              gridTemplateColumns: "1fr auto 1fr",
              alignItems: "center",
              padding: "24px 24px",
              borderBottom: "1px solid rgba(255,255,255,0.05)",
            }}
          >
            <div>
              <div
                style={{
                  fontSize: 40,
                  fontWeight: 900,
                  letterSpacing: "-0.03em",
                  color: p1WinsScore ? "#C8FF00" : "#F1F3F9",
                  lineHeight: 1,
                }}
              >
                {p1Score}
              </div>
              <div style={{ fontSize: 11, color: "rgba(241,243,249,0.3)", marginTop: 4 }}>
                {player1?.name}
              </div>
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
              L9 Score
            </div>
            <div style={{ textAlign: "right" }}>
              <div
                style={{
                  fontSize: 40,
                  fontWeight: 900,
                  letterSpacing: "-0.03em",
                  color: !p1WinsScore ? "#C8FF00" : "#F1F3F9",
                  lineHeight: 1,
                }}
              >
                {p2Score}
              </div>
              <div style={{ fontSize: 11, color: "rgba(241,243,249,0.3)", marginTop: 4 }}>
                {player2?.name}
              </div>
            </div>
          </div>

          {/* Depth ratio */}
          <div
            style={{
              display: "grid",
              gridTemplateColumns: "1fr auto 1fr",
              alignItems: "center",
              padding: "18px 24px",
              borderBottom: "1px solid rgba(255,255,255,0.05)",
            }}
          >
            <div style={{ fontSize: 22, fontWeight: 900, color: p1WinsDepth ? "#C8FF00" : "#F1F3F9", letterSpacing: "-0.02em" }}>
              {p1Depth}%
            </div>
            <div style={{ fontSize: 11, fontWeight: 700, color: "rgba(241,243,249,0.2)", letterSpacing: "0.08em", textAlign: "center", padding: "0 20px", textTransform: "uppercase" }}>
              Gaming Depth
            </div>
            <div style={{ fontSize: 22, fontWeight: 900, color: !p1WinsDepth ? "#C8FF00" : "#F1F3F9", letterSpacing: "-0.02em", textAlign: "right" }}>
              {p2Depth}%
            </div>
          </div>

          {/* Top games 6–10 */}
          <div
            style={{
              display: "grid",
              gridTemplateColumns: "1fr 1fr",
              gap: 1,
            }}
          >
            <div style={{ padding: "16px 20px" }}>
              <div style={{ fontSize: 10, fontWeight: 700, color: "rgba(241,243,249,0.2)", letterSpacing: "0.08em", textTransform: "uppercase", marginBottom: 12 }}>
                {player1?.name} · Giochi 6–10
              </div>
              {(player1?.topGames ?? []).slice(5).map((g, i) => (
                <div key={g.appId} style={{ display: "flex", alignItems: "center", gap: 10, marginBottom: i < 4 ? 10 : 0 }}>
                  {g.iconUrl && <img src={g.iconUrl} width={22} height={22} style={{ borderRadius: 3 }} alt="" />}
                  <div style={{ flex: 1, fontSize: 12, fontWeight: 500, color: "rgba(241,243,249,0.7)", overflow: "hidden", textOverflow: "ellipsis", whiteSpace: "nowrap" }}>{g.name}</div>
                  <div style={{ fontSize: 11, fontWeight: 700, color: "rgba(200,255,0,0.5)", flexShrink: 0 }}>{g.playtimeHours}h</div>
                </div>
              ))}
            </div>
            <div style={{ padding: "16px 20px", borderLeft: "1px solid rgba(255,255,255,0.05)" }}>
              <div style={{ fontSize: 10, fontWeight: 700, color: "rgba(241,243,249,0.2)", letterSpacing: "0.08em", textTransform: "uppercase", marginBottom: 12 }}>
                {player2?.name} · Giochi 6–10
              </div>
              {(player2?.topGames ?? []).slice(5).map((g, i) => (
                <div key={g.appId} style={{ display: "flex", alignItems: "center", gap: 10, marginBottom: i < 4 ? 10 : 0 }}>
                  {g.iconUrl && <img src={g.iconUrl} width={22} height={22} style={{ borderRadius: 3 }} alt="" />}
                  <div style={{ flex: 1, fontSize: 12, fontWeight: 500, color: "rgba(241,243,249,0.7)", overflow: "hidden", textOverflow: "ellipsis", whiteSpace: "nowrap" }}>{g.name}</div>
                  <div style={{ fontSize: 11, fontWeight: 700, color: "rgba(200,255,0,0.5)", flexShrink: 0 }}>{g.playtimeHours}h</div>
                </div>
              ))}
            </div>
          </div>
        </div>

        {/* Paywall overlay */}
        {!unlocked && (
          <div
            style={{
              position: "absolute",
              inset: 0,
              display: "flex",
              flexDirection: "column",
              alignItems: "center",
              justifyContent: "center",
              gap: 14,
              borderRadius: 14,
              background: "rgba(7,8,15,0.6)",
              backdropFilter: "blur(2px)",
            }}
          >
            <div style={{ fontSize: 15, fontWeight: 800, color: "#F1F3F9", letterSpacing: "-0.01em", textAlign: "center", maxWidth: 260 }}>
              Sblocca l&apos;analisi completa
            </div>
            <div style={{ fontSize: 13, color: "rgba(241,243,249,0.4)", textAlign: "center", maxWidth: 260, lineHeight: 1.5 }}>
              L9 Score · Gaming Depth · Top 10 giochi.<br />Più 500 L9 Points di benvenuto.
            </div>
            <button
              onClick={onUnlock}
              disabled={unlockLoading}
              style={{
                marginTop: 4,
                padding: "13px 32px",
                borderRadius: 10,
                border: "none",
                background: unlockLoading ? "rgba(200,255,0,0.4)" : "#C8FF00",
                color: "#07080F",
                fontFamily: "'Outfit', system-ui, sans-serif",
                fontSize: 15,
                fontWeight: 900,
                cursor: unlockLoading ? "default" : "pointer",
                letterSpacing: "-0.01em",
                transition: "all 0.15s",
              }}
            >
              {unlockLoading ? "Caricamento…" : "Sblocca i dettagli — €1"}
            </button>
            {unlockError && (
              <div style={{ fontSize: 12, color: "#fca5a5", textAlign: "center", maxWidth: 260 }}>
                {unlockError}
              </div>
            )}
            <div style={{ fontSize: 11, color: "rgba(241,243,249,0.2)" }}>
              Pagamento sicuro via Stripe · Un click per sempre
            </div>
            <div style={{ fontSize: 11, color: "rgba(241,243,249,0.15)", display: "flex", gap: 12 }}>
              <a href="/terms" target="_blank" style={{ color: "inherit", textDecoration: "underline" }}>Terms</a>
              <a href="/privacy" target="_blank" style={{ color: "inherit", textDecoration: "underline" }}>Privacy</a>
            </div>
          </div>
        )}
      </div>
    </div>
  );
}

export default OneVsOnePage;
