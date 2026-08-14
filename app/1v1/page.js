"use client";

import { useState, useEffect, useRef } from "react";

const CLAIMED_KEY = "leet9_1v1_claimed";

function Avatar({ src, name, size = 64 }) {
  const initials = name ? name.slice(0, 2).toUpperCase() : "??";
  if (src) {
    return (
      <img
        src={src}
        alt={name}
        width={size}
        height={size}
        className="rounded-full object-cover border-2 border-white/10"
        style={{ width: size, height: size }}
      />
    );
  }
  return (
    <div
      className="rounded-full flex items-center justify-center bg-white/10 border-2 border-white/10 text-white font-bold"
      style={{ width: size, height: size, fontSize: size * 0.35 }}
    >
      {initials}
    </div>
  );
}

function ScoreBar({ label, value, max, color }) {
  const pct = Math.round((value / max) * 100);
  return (
    <div className="space-y-1">
      <div className="flex justify-between text-xs text-white/50">
        <span>{label}</span>
        <span className="font-mono tabular-nums">{value} / {max}</span>
      </div>
      <div className="h-1.5 rounded-full bg-white/10 overflow-hidden">
        <div
          className="h-full rounded-full transition-all duration-700"
          style={{ width: `${pct}%`, background: color }}
        />
      </div>
    </div>
  );
}

function BreakdownCard({ icon, label, p1Value, p2Value, p1Name, p2Name, max, color, rawLabel1, rawLabel2 }) {
  const p1Pct = Math.round((p1Value / max) * 100);
  const p2Pct = Math.round((p2Value / max) * 100);
  const p1Wins = p1Value >= p2Value;

  return (
    <div className="rounded-2xl border border-white/8 bg-white/[0.03] p-5 space-y-4">
      <div className="flex items-center gap-2">
        <span className="text-xl">{icon}</span>
        <span className="text-sm font-semibold text-white/70 tracking-wide uppercase">{label}</span>
      </div>

      <div className="space-y-3">
        {/* Player 1 */}
        <div className="space-y-1">
          <div className="flex justify-between items-center">
            <span className="text-xs text-white/50 truncate max-w-[120px]">{p1Name}</span>
            <span className="flex items-center gap-1.5">
              {p1Wins && <span className="text-[10px] text-emerald-400 font-bold">WIN</span>}
              <span className="font-mono text-sm font-semibold text-white tabular-nums">{p1Value}</span>
            </span>
          </div>
          <div className="h-1.5 rounded-full bg-white/10 overflow-hidden">
            <div className="h-full rounded-full transition-all duration-700" style={{ width: `${p1Pct}%`, background: color }} />
          </div>
          {rawLabel1 && <div className="text-[11px] text-white/35">{rawLabel1}</div>}
        </div>

        {/* Player 2 */}
        <div className="space-y-1">
          <div className="flex justify-between items-center">
            <span className="text-xs text-white/50 truncate max-w-[120px]">{p2Name}</span>
            <span className="flex items-center gap-1.5">
              {!p1Wins && <span className="text-[10px] text-emerald-400 font-bold">WIN</span>}
              <span className="font-mono text-sm font-semibold text-white tabular-nums">{p2Value}</span>
            </span>
          </div>
          <div className="h-1.5 rounded-full bg-white/10 overflow-hidden">
            <div className="h-full rounded-full transition-all duration-700" style={{ width: `${p2Pct}%`, background: color }} />
          </div>
          {rawLabel2 && <div className="text-[11px] text-white/35">{rawLabel2}</div>}
        </div>
      </div>
    </div>
  );
}

export default function OneVOnePage() {
  const [p1, setP1] = useState("");
  const [p2, setP2] = useState("");
  const [result, setResult] = useState(null);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState(null);
  const [hasClaimed, setHasClaimed] = useState(false);
  const resultsRef = useRef(null);

  useEffect(() => {
    setHasClaimed(!!localStorage.getItem(CLAIMED_KEY));
  }, []);

  async function handleCompare(e) {
    e.preventDefault();
    setError(null);
    setResult(null);
    setLoading(true);

    try {
      const params = new URLSearchParams({ p1: p1.trim(), p2: p2.trim() });
      const res = await fetch(`/api/1v1/compare?${params}`);
      const json = await res.json();

      if (!res.ok) {
        setError(json.error ?? "Something went wrong.");
        setLoading(false);
        return;
      }

      setResult(json);
      setTimeout(() => resultsRef.current?.scrollIntoView({ behavior: "smooth", block: "start" }), 100);
    } catch {
      setError("Network error. Please try again.");
    } finally {
      setLoading(false);
    }
  }

  function handleClaim() {
    // TODO: replace with Stripe Checkout redirect when credentials are configured
    // window.location.href = "/api/1v1/checkout";
    localStorage.setItem(CLAIMED_KEY, "1");
    setHasClaimed(true);
  }

  const winner = result ? result.players[result.winner - 1] : null;
  const loser = result ? result.players[result.winner === 1 ? 1 : 0] : null;

  return (
    <div className="min-h-screen" style={{ background: "#07080F", color: "#F1F3F9", fontFamily: "var(--font-outfit, 'Outfit', sans-serif)" }}>

      {/* Nav */}
      <nav className="px-6 py-5 flex items-center justify-between border-b border-white/[0.06]">
        <a href="/" className="text-white/80 hover:text-white transition-colors text-sm font-medium tracking-wide">
          ← Leet9
        </a>
        <span className="text-xs text-white/30 font-mono">1v1</span>
      </nav>

      {/* Hero */}
      <section className="px-6 pt-20 pb-14 text-center max-w-2xl mx-auto">
        <div className="inline-flex items-center gap-2 rounded-full border border-white/10 bg-white/[0.04] px-4 py-1.5 text-xs text-white/50 mb-8 tracking-widest uppercase">
          Steam 1v1
        </div>
        <h1 className="text-4xl sm:text-5xl font-extrabold tracking-tight leading-[1.1] mb-4" style={{ textWrap: "balance" }}>
          Who&apos;s the better<br />
          <span style={{ background: "linear-gradient(90deg, #a78bfa, #60a5fa)", WebkitBackgroundClip: "text", WebkitTextFillColor: "transparent" }}>
            gamer?
          </span>
        </h1>
        <p className="text-white/45 text-base sm:text-lg leading-relaxed">
          Enter two Steam IDs. We crunch hours, library breadth, and activity to crown a winner.
        </p>
      </section>

      {/* Input Form */}
      <section className="px-4 pb-20 max-w-xl mx-auto">
        <form onSubmit={handleCompare} className="space-y-4">
          <div className="flex flex-col sm:flex-row gap-3 items-stretch sm:items-center">
            <div className="flex-1">
              <input
                type="text"
                value={p1}
                onChange={(e) => setP1(e.target.value)}
                placeholder="Your SteamID64 or vanity URL"
                required
                className="w-full rounded-xl border border-white/10 bg-white/[0.04] px-4 py-3 text-sm text-white placeholder:text-white/25 focus:outline-none focus:border-violet-500/60 focus:bg-white/[0.06] transition-all"
              />
            </div>

            <div className="flex items-center justify-center shrink-0">
              <span className="text-white/20 font-bold text-sm tracking-widest px-2">VS</span>
            </div>

            <div className="flex-1">
              <input
                type="text"
                value={p2}
                onChange={(e) => setP2(e.target.value)}
                placeholder="Opponent SteamID64 or vanity URL"
                required
                className="w-full rounded-xl border border-white/10 bg-white/[0.04] px-4 py-3 text-sm text-white placeholder:text-white/25 focus:outline-none focus:border-blue-500/60 focus:bg-white/[0.06] transition-all"
              />
            </div>
          </div>

          <button
            type="submit"
            disabled={loading || !p1.trim() || !p2.trim()}
            className="w-full rounded-xl py-3.5 font-semibold text-sm transition-all disabled:opacity-40 disabled:cursor-not-allowed"
            style={{
              background: "linear-gradient(135deg, #7c3aed, #2563eb)",
              color: "#fff",
              boxShadow: loading ? "none" : "0 0 24px rgba(124, 58, 237, 0.35)",
            }}
          >
            {loading ? (
              <span className="flex items-center justify-center gap-2">
                <svg className="animate-spin h-4 w-4" fill="none" viewBox="0 0 24 24">
                  <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4" />
                  <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4z" />
                </svg>
                Crunching data…
              </span>
            ) : "Compare →"}
          </button>

          {error && (
            <p className="text-center text-sm text-red-400/80 pt-1">{error}</p>
          )}

          <p className="text-center text-xs text-white/20">
            Find your SteamID64 at{" "}
            <span className="text-white/35 underline underline-offset-2">steamid.io</span>
          </p>
        </form>
      </section>

      {/* Results */}
      {result && (
        <section ref={resultsRef} className="px-4 pb-24 max-w-2xl mx-auto space-y-6">

          {/* Winner Banner — always visible */}
          <div
            className="rounded-2xl p-6 sm:p-8 text-center border border-white/10"
            style={{ background: "linear-gradient(135deg, rgba(124,58,237,0.15), rgba(37,99,235,0.12))" }}
          >
            <div className="text-xs text-white/40 uppercase tracking-widest mb-5">Result</div>

            <div className="flex items-center justify-center gap-6 sm:gap-10">
              {/* Player 1 */}
              <div className={`flex flex-col items-center gap-2 transition-opacity ${result.winner === 2 ? "opacity-40" : ""}`}>
                <div className="relative">
                  <Avatar src={result.players[0].avatar} name={result.players[0].name} size={56} />
                  {result.winner === 1 && (
                    <span className="absolute -top-2 -right-2 text-lg">👑</span>
                  )}
                </div>
                <span className="text-xs text-white/60 font-medium max-w-[80px] truncate text-center">{result.players[0].name}</span>
                <span
                  className="font-mono font-extrabold tabular-nums"
                  style={{
                    fontSize: "2rem",
                    background: result.winner === 1 ? "linear-gradient(90deg, #a78bfa, #60a5fa)" : "none",
                    WebkitBackgroundClip: result.winner === 1 ? "text" : "unset",
                    WebkitTextFillColor: result.winner === 1 ? "transparent" : "rgba(255,255,255,0.35)",
                    color: result.winner === 1 ? undefined : "rgba(255,255,255,0.35)",
                  }}
                >
                  {result.players[0].score.total}
                </span>
              </div>

              <div className="text-white/15 font-bold text-xl">—</div>

              {/* Player 2 */}
              <div className={`flex flex-col items-center gap-2 transition-opacity ${result.winner === 1 ? "opacity-40" : ""}`}>
                <div className="relative">
                  <Avatar src={result.players[1].avatar} name={result.players[1].name} size={56} />
                  {result.winner === 2 && (
                    <span className="absolute -top-2 -right-2 text-lg">👑</span>
                  )}
                </div>
                <span className="text-xs text-white/60 font-medium max-w-[80px] truncate text-center">{result.players[1].name}</span>
                <span
                  className="font-mono font-extrabold tabular-nums"
                  style={{
                    fontSize: "2rem",
                    background: result.winner === 2 ? "linear-gradient(90deg, #a78bfa, #60a5fa)" : "none",
                    WebkitBackgroundClip: result.winner === 2 ? "text" : "unset",
                    WebkitTextFillColor: result.winner === 2 ? "transparent" : "rgba(255,255,255,0.35)",
                    color: result.winner === 2 ? undefined : "rgba(255,255,255,0.35)",
                  }}
                >
                  {result.players[1].score.total}
                </span>
              </div>
            </div>

            <div className="mt-6 text-sm font-semibold">
              <span className="text-white/50">Winner: </span>
              <span className="text-white">{winner.name}</span>
            </div>
          </div>

          {/* Breakdown — blurred until claimed */}
          <div className="relative">
            {/* Blurred content */}
            <div
              className="grid grid-cols-1 sm:grid-cols-3 gap-3 transition-all duration-300"
              style={{
                filter: hasClaimed ? "none" : "blur(7px)",
                pointerEvents: hasClaimed ? "auto" : "none",
                userSelect: hasClaimed ? "auto" : "none",
              }}
              aria-hidden={!hasClaimed}
            >
              <BreakdownCard
                icon="⏱"
                label="Hours Played"
                p1Value={result.players[0].score.breakdown.hours}
                p2Value={result.players[1].score.breakdown.hours}
                p1Name={result.players[0].name}
                p2Name={result.players[1].name}
                max={400}
                color="linear-gradient(90deg, #a78bfa, #7c3aed)"
                rawLabel1={`${result.players[0].score.raw.totalHours.toLocaleString()}h total`}
                rawLabel2={`${result.players[1].score.raw.totalHours.toLocaleString()}h total`}
              />
              <BreakdownCard
                icon="🎮"
                label="Library Breadth"
                p1Value={result.players[0].score.breakdown.breadth}
                p2Value={result.players[1].score.breakdown.breadth}
                p1Name={result.players[0].name}
                p2Name={result.players[1].name}
                max={300}
                color="linear-gradient(90deg, #60a5fa, #2563eb)"
                rawLabel1={`${result.players[0].score.raw.gamesPlayed} games played`}
                rawLabel2={`${result.players[1].score.raw.gamesPlayed} games played`}
              />
              <BreakdownCard
                icon="🔥"
                label="Recency"
                p1Value={result.players[0].score.breakdown.recency}
                p2Value={result.players[1].score.breakdown.recency}
                p1Name={result.players[0].name}
                p2Name={result.players[1].name}
                max={300}
                color="linear-gradient(90deg, #34d399, #059669)"
                rawLabel1={
                  result.players[0].score.raw.lastPlayedDaysAgo < 999
                    ? `${result.players[0].score.raw.lastPlayedDaysAgo}d ago`
                    : "No data"
                }
                rawLabel2={
                  result.players[1].score.raw.lastPlayedDaysAgo < 999
                    ? `${result.players[1].score.raw.lastPlayedDaysAgo}d ago`
                    : "No data"
                }
              />
            </div>

            {/* Paywall overlay */}
            {!hasClaimed && (
              <div className="absolute inset-0 flex flex-col items-center justify-center gap-4 rounded-2xl"
                style={{ background: "rgba(7,8,15,0.6)", backdropFilter: "blur(2px)" }}>
                <div className="text-center px-4">
                  <div className="text-2xl mb-2">🔒</div>
                  <div className="font-semibold text-white text-base mb-1">See the full breakdown</div>
                  <div className="text-white/45 text-sm">Hours · Library · Recency — one time, forever.</div>
                </div>
                <button
                  onClick={handleClaim}
                  className="rounded-xl px-7 py-3 font-bold text-sm text-white transition-all hover:scale-105 active:scale-95"
                  style={{
                    background: "linear-gradient(135deg, #7c3aed, #2563eb)",
                    boxShadow: "0 0 28px rgba(124,58,237,0.5)",
                  }}
                >
                  Unlock for €1 →
                </button>
                <div className="text-[11px] text-white/25">One-time · Instant access · No subscription</div>
              </div>
            )}
          </div>

          {/* Share prompt */}
          {hasClaimed && (
            <div className="rounded-2xl border border-white/8 bg-white/[0.03] p-5 flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4">
              <div>
                <div className="font-semibold text-sm text-white mb-0.5">Challenge a friend</div>
                <div className="text-xs text-white/40">Send them this comparison — they can respond with their own Steam ID.</div>
              </div>
              <button
                onClick={() => {
                  const url = `${window.location.origin}/1v1?p1=${encodeURIComponent(p1)}&p2=${encodeURIComponent(p2)}`;
                  navigator.clipboard.writeText(url).catch(() => {});
                }}
                className="shrink-0 rounded-xl border border-white/12 bg-white/[0.05] px-5 py-2.5 text-sm font-medium text-white hover:bg-white/[0.08] transition-colors"
              >
                Copy link
              </button>
            </div>
          )}

          {/* New comparison */}
          <div className="text-center pt-2">
            <button
              onClick={() => { setResult(null); setP1(""); setP2(""); window.scrollTo({ top: 0, behavior: "smooth" }); }}
              className="text-sm text-white/35 hover:text-white/60 transition-colors underline underline-offset-4"
            >
              New comparison
            </button>
          </div>
        </section>
      )}
    </div>
  );
}
