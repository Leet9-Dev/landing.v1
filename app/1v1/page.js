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
    try {
      const res = await fetch("/api/1v1/compare", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ p1, p2 }),
      });
      const json = await res.json();
      if (json.ok) {
        setResult(json.data);
        const params = new URLSearchParams({ p1, p2 });
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

  function copyShareLink() {
    if (!result) return;
    const url = `${BASE_URL}/1v1?p1=${encodeURIComponent(p1Input)}&p2=${encodeURIComponent(p2Input)}`;
    navigator.clipboard.writeText(url).then(() => {
      setCopied(true);
      setTimeout(() => setCopied(false), 2000);
    });
  }

  // Plausible event tracking
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
          gap: 12,
        }}
      >
        <a href="/" style={{ textDecoration: "none" }}>
          <span
            style={{
              fontSize: 18,
              fontWeight: 900,
              color: "#C8FF00",
              letterSpacing: "-0.02em",
            }}
          >
            LEET9
          </span>
        </a>
        <span style={{ color: "rgba(255,255,255,0.12)", fontSize: 14 }}>/</span>
        <span
          style={{
            fontSize: 13,
            fontWeight: 600,
            color: "rgba(241,243,249,0.45)",
            letterSpacing: "0.06em",
          }}
        >
          1 VS 1
        </span>
      </div>

      <div style={{ maxWidth: 860, margin: "0 auto", padding: "56px 32px 80px" }}>
        {/* Hero */}
        <div style={{ textAlign: "center", marginBottom: 52 }}>
          <div
            style={{
              display: "inline-block",
              padding: "4px 14px",
              borderRadius: 99,
              background: "rgba(200,255,0,0.08)",
              border: "1px solid rgba(200,255,0,0.2)",
              fontSize: 11,
              fontWeight: 700,
              color: "#C8FF00",
              letterSpacing: "0.1em",
              marginBottom: 20,
            }}
          >
            STEAM BATTLE
          </div>
          <h1
            style={{
              fontSize: 52,
              fontWeight: 900,
              letterSpacing: "-0.03em",
              lineHeight: 1.1,
              margin: "0 0 16px",
            }}
          >
            Who played <span style={{ color: "#C8FF00" }}>more?</span>
          </h1>
          <p
            style={{
              fontSize: 16,
              color: "rgba(241,243,249,0.45)",
              maxWidth: 480,
              margin: "0 auto",
              lineHeight: 1.6,
            }}
          >
            Enter two Steam IDs or profile URLs and see who has the most hours,
            games, and bragging rights.
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
              placeholder="Player 1 — Steam ID or profile URL"
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
                fontSize: 13,
                fontWeight: 800,
                color: "rgba(255,255,255,0.18)",
                letterSpacing: "0.06em",
                flexShrink: 0,
              }}
            >
              VS
            </div>
            <SteamInput
              placeholder="Player 2 — Steam ID or profile URL"
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
                    ? "rgba(200,255,0,0.3)"
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
              {loading ? "Loading…" : "Compare →"}
            </button>
          </div>
          <p
            style={{
              fontSize: 12,
              color: "rgba(241,243,249,0.22)",
              marginTop: 10,
              textAlign: "center",
            }}
          >
            Accepts: SteamID64 · steamcommunity.com/id/username ·
            steamcommunity.com/profiles/ID
          </p>
        </form>

        {error && (
          <div
            style={{
              marginTop: 24,
              padding: "14px 18px",
              borderRadius: 10,
              background: "rgba(239,68,68,0.08)",
              border: "1px solid rgba(239,68,68,0.25)",
              color: "#fca5a5",
              fontSize: 14,
              textAlign: "center",
            }}
          >
            {error}
          </div>
        )}

        {/* Result */}
        {loading && <ComparisonSkeleton />}
        {!loading && result && (
          <ComparisonResult
            player1={result.player1}
            player2={result.player2}
            onShare={copyShareLink}
            copied={copied}
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
        border: `1px solid ${focused ? `${accent}44` : "rgba(255,255,255,0.1)"}`,
        background: "rgba(255,255,255,0.04)",
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
      {/* VS bar skeleton */}
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
          <div style={{ fontSize: 36, fontWeight: 900, color: "rgba(255,255,255,0.06)", letterSpacing: "-0.04em" }}>VS</div>
        </div>
      </div>
    </div>
  );
}

function ComparisonResult({ player1, player2, onShare, copied }) {
  const p1h = player1?.totalPlaytimeHours ?? 0;
  const p2h = player2?.totalPlaytimeHours ?? 0;
  const p1winsHours = p1h >= p2h;
  const p1winsGames = (player1?.totalGames ?? 0) >= (player2?.totalGames ?? 0);

  return (
    <div style={{ marginTop: 48 }}>
      {/* Share button */}
      <div style={{ display: "flex", justifyContent: "flex-end", marginBottom: 20 }}>
        <button
          onClick={onShare}
          style={{
            padding: "8px 20px",
            borderRadius: 99,
            border: "1px solid rgba(255,255,255,0.12)",
            background: copied ? "rgba(200,255,0,0.08)" : "transparent",
            color: copied ? "#C8FF00" : "rgba(241,243,249,0.5)",
            fontFamily: "'Outfit', system-ui, sans-serif",
            fontSize: 13,
            fontWeight: 600,
            cursor: "pointer",
            transition: "all 0.15s",
          }}
        >
          {copied ? "✓ Link copied!" : "Share battle →"}
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

      {/* Stats comparison bar */}
      <div
        style={{
          marginTop: 32,
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
            marginTop: 24,
            display: "grid",
            gridTemplateColumns: "1fr 1fr",
            gap: 16,
          }}
        >
          <TopGames games={player1?.topGames ?? []} name={player1?.name} />
          <TopGames games={player2?.topGames ?? []} name={player2?.name} />
        </div>
      )}

      {/* CTA */}
      <div
        style={{
          marginTop: 40,
          padding: "28px 32px",
          borderRadius: 16,
          border: "1px solid rgba(200,255,0,0.12)",
          background: "rgba(200,255,0,0.04)",
          textAlign: "center",
        }}
      >
        <div
          style={{
            fontSize: 18,
            fontWeight: 800,
            color: "#F1F3F9",
            marginBottom: 8,
            letterSpacing: "-0.01em",
          }}
        >
          Track every hour. Earn L9 Points. Build your gaming identity.
        </div>
        <p
          style={{
            fontSize: 14,
            color: "rgba(241,243,249,0.4)",
            marginBottom: 20,
          }}
        >
          Connect Steam, earn achievements, climb the global leaderboard.
        </p>
        <a
          href="/signup"
          style={{
            display: "inline-block",
            padding: "12px 28px",
            borderRadius: 10,
            background: "#C8FF00",
            color: "#07080F",
            fontSize: 14,
            fontWeight: 800,
            textDecoration: "none",
            letterSpacing: "0.02em",
          }}
        >
          Join Leet9 for free →
        </a>
      </div>
    </div>
  );
}

function PlayerCard({ player, winner, side }) {
  if (!player || player.error) {
    return (
      <div
        style={{
          borderRadius: 16,
          border: "1px solid rgba(239,68,68,0.2)",
          background: "#0D0F1A",
          padding: 24,
        }}
      >
        <div style={{ fontSize: 14, color: "rgba(239,68,68,0.7)", fontWeight: 600 }}>
          {player?.error === "not_found"
            ? "Profile not found"
            : "Could not load profile"}
        </div>
        <div style={{ fontSize: 12, color: "rgba(241,243,249,0.3)", marginTop: 4 }}>
          Check the Steam ID or URL and try again.
        </div>
      </div>
    );
  }

  return (
    <div
      style={{
        borderRadius: 16,
        border: `1px solid ${winner ? "rgba(200,255,0,0.2)" : "rgba(255,255,255,0.07)"}`,
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
          marginBottom: 16,
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
              border: `2px solid ${winner ? "#C8FF00" : "rgba(255,255,255,0.1)"}`,
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
              marginBottom: 4,
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
                border: "1px solid rgba(200,255,0,0.25)",
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
                color: "rgba(241,243,249,0.4)",
                background: "rgba(255,255,255,0.06)",
                border: "1px solid rgba(255,255,255,0.1)",
                padding: "2px 8px",
                borderRadius: 99,
                marginLeft: 4,
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
            fontSize: 13,
            color: "rgba(241,243,249,0.3)",
            padding: "12px 0",
            borderTop: "1px solid rgba(255,255,255,0.05)",
          }}
        >
          This profile is private. Stats are hidden.
        </div>
      ) : (
        <>
          <div
            style={{
              fontSize: 32,
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
              color: "rgba(241,243,249,0.35)",
              marginBottom: 12,
            }}
          >
            total playtime · {player.totalGames} games owned
          </div>
          <a
            href={player.profileUrl}
            target="_blank"
            rel="noopener noreferrer"
            style={{
              fontSize: 11,
              color: "rgba(241,243,249,0.3)",
              textDecoration: "none",
              borderBottom: "1px solid rgba(255,255,255,0.08)",
              paddingBottom: 1,
            }}
          >
            View Steam profile ↗
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
        flexDirection: "column",
        alignItems: "center",
        justifyContent: "center",
        padding: "24px 0",
        gap: 8,
      }}
    >
      <div
        style={{
          fontSize: 36,
          fontWeight: 900,
          color: "rgba(255,255,255,0.07)",
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
        padding: "16px 24px",
        borderBottom: divider ? "1px solid rgba(255,255,255,0.05)" : "none",
      }}
    >
      <div
        style={{
          fontSize: 20,
          fontWeight: 800,
          color: !p1Private && p1Wins ? "#C8FF00" : p1Private ? "rgba(241,243,249,0.2)" : "#F1F3F9",
          letterSpacing: "-0.02em",
        }}
      >
        {p1Private ? "—" : v1}
      </div>
      <div
        style={{
          fontSize: 11,
          fontWeight: 700,
          color: "rgba(241,243,249,0.25)",
          letterSpacing: "0.06em",
          textAlign: "center",
          padding: "0 20px",
          textTransform: "uppercase",
        }}
      >
        {label}
      </div>
      <div
        style={{
          fontSize: 20,
          fontWeight: 800,
          color: !p2Private && !p1Wins ? "#C8FF00" : p2Private ? "rgba(241,243,249,0.2)" : "#F1F3F9",
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
        border: "1px solid rgba(255,255,255,0.07)",
        background: "#0D0F1A",
        padding: "20px 22px",
      }}
    >
      <div
        style={{
          fontSize: 11,
          fontWeight: 700,
          color: "rgba(241,243,249,0.3)",
          letterSpacing: "0.08em",
          textTransform: "uppercase",
          marginBottom: 16,
        }}
      >
        {name}&apos;s top games
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
              color: "rgba(200,255,0,0.6)",
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

export default function Page() {
  return (
    <Suspense>
      <OneVsOnePage />
    </Suspense>
  );
}
