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
          <img
            src="/logo.png"
            alt="Leet9"
            style={{ height: 28, width: "auto", display: "block" }}
          />
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

function ComparisonResult({ player1, player2, onShare, copied }) {
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
              {p1winsHours ? player1?.name : player2?.name}
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
          <TopGames games={player1?.topGames ?? []} name={player1?.name} />
          <TopGames games={player2?.topGames ?? []} name={player2?.name} />
        </div>
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
            <img
              src="/logo.png"
              alt="Leet9"
              style={{ height: 22, width: "auto", display: "block", opacity: 0.7 }}
            />
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
            Leet9 is the gaming identity platform that turns your Steam library
            into a real profile. Connect your accounts, earn L9 Points for every
            hour played and achievement unlocked, and rank against players worldwide —
            not just your friends list.
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
          Profile not found
        </div>
        <div style={{ fontSize: 12, color: "rgba(241,243,249,0.25)", marginTop: 4 }}>
          Check the Steam ID or URL and try again.
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
            fontSize: 13,
            color: "rgba(241,243,249,0.25)",
            padding: "12px 0",
            borderTop: "1px solid rgba(255,255,255,0.05)",
          }}
        >
          This profile is private. Stats hidden.
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

export default function Page() {
  return (
    <Suspense>
      <OneVsOnePage />
    </Suspense>
  );
}
