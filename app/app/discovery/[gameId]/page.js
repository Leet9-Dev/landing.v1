"use client";
import { useState, useEffect, use } from "react";
import { getDisplayRating } from "@/lib/utils/gameRating";
import { useRouter } from "next/navigation";

export default function GameDeepDivePage({ params }) {
  const { gameId } = use(params);
  const router = useRouter();
  const [data, setData] = useState(null);
  const [loading, setLoading] = useState(true);
  const [toast, setToast] = useState(null);
  const [session, setSession] = useState(undefined); // undefined = loading, null = no session
  const [checkoutLoading, setCheckoutLoading] = useState(false);
  const [ratingDraft, setRatingDraft] = useState(null);
  const [commentDraft, setCommentDraft] = useState("");
  const [reviewSaving, setReviewSaving] = useState(false);
  const [reviewSaved, setReviewSaved] = useState(false);

  useEffect(() => {
    Promise.all([
      fetch(`/api/games/${gameId}`).then((r) => r.json()),
      fetch("/api/auth/session").then((r) => r.json()).catch(() => null),
    ]).then(([json, sessionJson]) => {
      setSession(sessionJson?.user ?? null);
      if (json.ok) {
        setData(json.data);
        if (json.data.userReview) {
          setRatingDraft(json.data.userReview.rating);
          setCommentDraft(json.data.userReview.content ?? "");
        }
      }
      setLoading(false);
    });
  }, [gameId]);

  async function handleUnlock() {
    if (checkoutLoading) return;
    setCheckoutLoading(true);
    try {
      const res = await fetch("/api/billing/profile-checkout", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ gameId }),
      });
      const json = await res.json();
      if (json.ok && json.url) window.location.href = json.url;
    } finally {
      setCheckoutLoading(false);
    }
  }

  function showToast(msg) {
    setToast(msg);
    setTimeout(() => setToast(null), 3500);
  }

  if (loading) return <LoadingState />;
  if (!data) return <NotFoundState onBack={() => router.push("/app/discovery")} />;

  const { game, externalSources, currentUserGame, userReview, hasPaid } = data;

  // Check if user already reviewed this game this calendar month
  const reviewedThisMonth = userReview
    ? (() => {
        const d = new Date(userReview.updatedAt);
        const now = new Date();
        return d.getFullYear() === now.getFullYear() && d.getMonth() === now.getMonth();
      })()
    : false;

  async function handleSubmitReview() {
    if (!ratingDraft || reviewSaving) return;
    setReviewSaving(true);
    try {
      const res = await fetch("/api/me/reviews", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ gameId: game.id, rating: ratingDraft, content: commentDraft }),
      });
      const json = await res.json();
      if (json.ok) {
        setReviewSaved(true);
        showToast("Review saved!");
        setTimeout(() => setReviewSaved(false), 3000);
        // Update local state so reviewedThisMonth recalculates and locks the form.
        setData((prev) => ({
          ...prev,
          userReview: { rating: ratingDraft, content: commentDraft, updatedAt: new Date().toISOString() },
        }));
      } else if (json.error?.code === "ALREADY_REVIEWED_THIS_MONTH") {
        showToast("You already reviewed this game this month.");
      } else {
        showToast("Couldn't save review. Try again.");
      }
    } finally {
      setReviewSaving(false);
    }
  }

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
        .gdp-body { padding: 20px 16px; max-width: 640px; margin: 0 auto; }
        .gdp-sidebar { display: none; }
        @media (min-width: 768px) {
          .gdp-body { display: grid; grid-template-columns: 1fr 280px; gap: 40px; max-width: 960px; align-items: start; }
          .gdp-main { min-width: 0; }
          .gdp-sidebar { display: block; position: sticky; top: 80px; }
          .gdp-your-stats-mobile { display: none; }
          .gdp-cta-mobile { display: none; }
        }
      `}</style>

      {/* Hero */}
      <div style={{
        height: 220,
        background: game.heroGradient,
        position: "relative",
        display: "flex",
        flexDirection: "column",
        justifyContent: "flex-end",
        padding: "20px 16px",
        overflow: "hidden",
      }}>
        {game.coverImageUrl && (
          <img
            src={game.coverImageUrl}
            alt={game.canonicalTitle}
            onError={(e) => { e.currentTarget.style.display = "none"; }}
            style={{
              position: "absolute", inset: 0,
              width: "100%", height: "100%",
              objectFit: "cover",
              opacity: 0.35,
            }}
          />
        )}
        <div style={{
          position: "absolute", inset: 0,
          background: "linear-gradient(to top, rgba(7,8,15,0.92) 0%, rgba(7,8,15,0.3) 60%, rgba(7,8,15,0.1) 100%)",
        }} />
        <button
          onClick={() => router.push("/app/discovery")}
          style={{
            position: "absolute",
            top: 16,
            left: 16,
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

        <div style={{ position: "relative", zIndex: 1 }}>
          <div style={{ display: "flex", gap: 8, marginBottom: 12, flexWrap: "wrap" }}>
            {game.trendingRank !== null && <Badge color="lime">#{game.trendingRank} Trending</Badge>}
            {game.recentlyDetected && <Badge color="indigo">Recently Detected</Badge>}
            {game.sourcePlatforms.map((p) => (
              <Badge key={p} color="dark">{p === "steam" ? "Steam" : "PSN"}</Badge>
            ))}
          </div>
          <h1 style={{ fontSize: 28, fontWeight: 900, color: "#F1F3F9", letterSpacing: "-0.03em", textShadow: "0 2px 16px rgba(0,0,0,0.6)", marginBottom: 4, lineHeight: 1.1 }}>
            {game.canonicalTitle}
          </h1>
          <div style={{ fontSize: 13, color: "rgba(241,243,249,0.5)", fontWeight: 500 }}>
            {game.studio} · {game.publisher}
          </div>
        </div>
      </div>

      {/* Content */}
      <div className="gdp-body">

        {/* Main column */}
        <div className="gdp-main">

          {/* Description */}
          <p style={{ fontSize: 14, color: "rgba(241,243,249,0.65)", lineHeight: 1.7, marginBottom: 20 }}>
            {game.description}
          </p>

          {/* Store links — prominent, right after description */}
          {externalSources.length > 0 && (
            <div style={{ display: "flex", flexDirection: "column", gap: 10, marginBottom: 24 }}>
              {externalSources.map((s) => {
                const BATTLENET_URLS = {
                  diablo4:    "https://diablo.blizzard.com/en-us/",
                  overwatch2: "https://overwatch.blizzard.com/en-us/",
                  wow:        "https://worldofwarcraft.blizzard.com/en-us/",
                  hearthstone:"https://hearthstone.blizzard.com/en-us/",
                };
                const PLATFORM_META = {
                  steam:     { label: "Play on Steam",           color: "#b9d8f5", url: `https://store.steampowered.com/app/${s.externalId}/` },
                  psn:       { label: "Play on PlayStation",     color: "#c8aaff", url: `https://store.playstation.com/en-us/product/${s.externalId}` },
                  xbox:      { label: "Play on Xbox",            color: "#90d890", url: `https://www.xbox.com/en-US/games/store/${s.externalTitle.toLowerCase().replace(/[^a-z0-9]+/g, "-").replace(/(^-|-$)/g, "")}/${s.externalId}` },
                  epic:      { label: "Play on Epic Games",      color: "#d4d4d4", url: `https://store.epicgames.com/p/${s.externalId}` },
                  gog:       { label: "Play on GOG",             color: "#9fc8f5", url: `https://www.gog.com/en/game/${s.externalId}` },
                  battlenet: { label: "Play on Battle.net",      color: "#00aeff", url: BATTLENET_URLS[s.externalId] ?? "https://us.battle.net/" },
                  ea:        { label: "Play on EA App",          color: "#f4a720", url: `https://www.ea.com/games/${s.externalId}` },
                  ubisoft:   { label: "Play on Ubisoft Connect", color: "#7fc0e0", url: `https://www.ubisoft.com/en-us/game/${s.externalId.replace(/_/g, "-")}` },
                  itch:      { label: "Play on itch.io",         color: "#fa5c5c", url: `https://itch.io/search?q=${encodeURIComponent(s.externalTitle)}` },
                };
                const meta = PLATFORM_META[s.platform] ?? { label: `Play on ${s.platform}`, color: "rgba(241,243,249,0.6)", url: "#" };
                return (
                  <a
                    key={s.platform + s.externalId}
                    href={meta.url}
                    target="_blank"
                    rel="noopener noreferrer"
                    style={{
                      display: "block",
                      width: "100%",
                      padding: "14px 20px",
                      borderRadius: 12,
                      border: `1px solid ${meta.color}4D`,
                      background: `${meta.color}14`,
                      color: meta.color,
                      fontSize: 15,
                      fontWeight: 800,
                      textDecoration: "none",
                      fontFamily: "'Outfit', sans-serif",
                      letterSpacing: "-0.01em",
                      textAlign: "center",
                      boxSizing: "border-box",
                    }}
                  >
                    {meta.label} →
                  </a>
                );
              })}
            </div>
          )}

          {/* Genres + Tags */}
          <div style={{ display: "flex", flexWrap: "wrap", gap: 6, marginBottom: 28 }}>
            {game.genres.map((g) => (
              <span key={g} style={{
                padding: "4px 10px", borderRadius: 6,
                border: "1px solid rgba(255,255,255,0.1)", background: "rgba(255,255,255,0.04)",
                fontSize: 12, color: "rgba(241,243,249,0.55)", fontWeight: 500,
              }}>{g}</span>
            ))}
            {game.tags.map((t) => (
              <span key={t} style={{
                padding: "4px 10px", borderRadius: 6,
                border: "1px solid rgba(200,255,0,0.12)", background: "rgba(200,255,0,0.03)",
                fontSize: 12, color: "rgba(200,255,0,0.55)", fontWeight: 500,
              }}>{t}</span>
            ))}
          </div>

          {/* Community Stats */}
          <div style={{ marginBottom: 28 }}>
            <SectionLabel>Community Stats</SectionLabel>
            <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: 10 }}>
              <StatBox label="Community Rating" value={`★ ${getDisplayRating(game).toFixed(1)}`} accent />
              <StatBox label="Active Players" value={game.communityPlayerCount.toLocaleString()} />
              <StatBox label="Total Hours" value={`${(game.communityHours / 1000).toFixed(0)}K`} />
              <StatBox label="L9 Points Earned" value={(game.communityL9Points / 1000).toFixed(0) + "K"} />
            </div>
          </div>

          {/* Your Stats — mobile only */}
          <div className="gdp-your-stats-mobile" style={{ marginBottom: 24 }}>
            <YourStatsSection
              session={session}
              currentUserGame={currentUserGame}
              hasPaid={hasPaid}
              onUnlock={handleUnlock}
              unlockLoading={checkoutLoading}
            />
          </div>

          {/* Review — mobile only */}
          <div className="gdp-your-stats-mobile" style={{ marginBottom: 24 }}>
            <ReviewSection
              existing={userReview}
              reviewedThisMonth={reviewedThisMonth}
              rating={ratingDraft}
              comment={commentDraft}
              onRating={setRatingDraft}
              onComment={setCommentDraft}
              onSubmit={handleSubmitReview}
              saving={reviewSaving}
              saved={reviewSaved}
            />
          </div>

        </div>

        {/* Sidebar — desktop only */}
        <div className="gdp-sidebar">
          <YourStatsSection
            session={session}
            currentUserGame={currentUserGame}
            hasPaid={hasPaid}
            onUnlock={handleUnlock}
            unlockLoading={checkoutLoading}
          />

          {/* Review */}
          <div style={{ marginTop: 24 }}>
            <ReviewSection
              existing={userReview}
              reviewedThisMonth={reviewedThisMonth}
              rating={ratingDraft}
              comment={commentDraft}
              onRating={setRatingDraft}
              onComment={setCommentDraft}
              onSubmit={handleSubmitReview}
              saving={reviewSaving}
              saved={reviewSaved}
            />
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

function YourStatsSection({ session, currentUserGame, hasPaid, onUnlock, unlockLoading }) {
  // Not logged in
  if (!session) {
    return (
      <div>
        <SectionLabel>Your Stats</SectionLabel>
        <div style={{
          padding: "16px",
          borderRadius: 10,
          border: "1px solid rgba(255,255,255,0.06)",
          background: "rgba(255,255,255,0.02)",
          textAlign: "center",
        }}>
          <div style={{ fontSize: 12, color: "rgba(241,243,249,0.35)", marginBottom: 12, lineHeight: 1.5 }}>
            Connect your Steam to see<br />your personal stats for this game
          </div>
          <a
            href="/auth/signin"
            style={{
              display: "inline-block",
              padding: "8px 16px",
              borderRadius: 8,
              background: "rgba(200,255,0,0.1)",
              border: "1px solid rgba(200,255,0,0.25)",
              color: "#C8FF00",
              fontSize: 13,
              fontWeight: 700,
              fontFamily: "'Outfit', sans-serif",
              textDecoration: "none",
              letterSpacing: "-0.01em",
            }}
          >
            Sign in →
          </a>
        </div>
      </div>
    );
  }

  // Logged in, no payment → blurred stats + CTA
  if (!hasPaid) {
    return (
      <div>
        <SectionLabel>Your Stats</SectionLabel>
        <div style={{ position: "relative" }}>
          {/* Blurred fake stats */}
          <div style={{ filter: "blur(5px)", pointerEvents: "none", userSelect: "none" }}>
            <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: 8 }}>
              <StatBox label="Hours" value="847" small />
              <StatBox label="L9 Points" value="3,200" small accent />
              <StatBox label="Achievements" value="42/80" small />
              <StatBox label="Mastery" value="52%" small />
            </div>
          </div>
          {/* Overlay CTA */}
          <div style={{
            position: "absolute",
            inset: 0,
            display: "flex",
            flexDirection: "column",
            alignItems: "center",
            justifyContent: "center",
            gap: 8,
          }}>
            <div style={{ fontSize: 11, color: "rgba(241,243,249,0.5)", textAlign: "center", lineHeight: 1.4 }}>
              Unlock your stats
            </div>
            <button
              onClick={onUnlock}
              disabled={unlockLoading}
              style={{
                padding: "8px 18px",
                borderRadius: 8,
                border: "none",
                background: "linear-gradient(135deg, #C8FF00, #a3e600)",
                color: "#07080F",
                fontSize: 13,
                fontWeight: 800,
                fontFamily: "'Outfit', sans-serif",
                cursor: unlockLoading ? "wait" : "pointer",
                letterSpacing: "-0.01em",
                opacity: unlockLoading ? 0.7 : 1,
              }}
            >
              {unlockLoading ? "…" : "🔓 Unlock — €1"}
            </button>
          </div>
        </div>
      </div>
    );
  }

  // Paid — no game data for this game
  if (!currentUserGame) {
    return (
      <div>
        <SectionLabel>Your Stats</SectionLabel>
        <div style={{
          padding: "14px",
          borderRadius: 10,
          border: "1px solid rgba(255,255,255,0.06)",
          background: "rgba(255,255,255,0.02)",
          fontSize: 12,
          color: "rgba(241,243,249,0.3)",
          textAlign: "center",
          lineHeight: 1.5,
        }}>
          This game isn't in your library yet
        </div>
      </div>
    );
  }

  // Paid + has data → show real stats
  return (
    <div>
      <SectionLabel>Your Stats</SectionLabel>
      <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: 8 }}>
        <StatBox label="Hours" value={currentUserGame.hoursPlayed.toFixed(0)} small />
        <StatBox label="L9 Points" value={currentUserGame.l9Points.toLocaleString()} small accent />
        {currentUserGame.achievementsUnlocked != null && currentUserGame.achievementsTotal != null && (
          <StatBox label="Achievements" value={`${currentUserGame.achievementsUnlocked}/${currentUserGame.achievementsTotal}`} small />
        )}
        {currentUserGame.masteryPct != null && (
          <StatBox label="Mastery" value={`${currentUserGame.masteryPct.toFixed(0)}%`} small />
        )}
      </div>
    </div>
  );
}

function ReviewSection({ existing, reviewedThisMonth, rating, comment, onRating, onComment, onSubmit, saving, saved }) {
  const canSubmit = rating && !saving && !reviewedThisMonth;

  // Compute "rated on" and "starting from" dates for the lock message
  const lockMessage = (() => {
    if (!existing || !reviewedThisMonth) return null;
    const ratedOn = new Date(existing.updatedAt);
    const nextMonth = new Date(ratedOn.getFullYear(), ratedOn.getMonth() + 1, 1);
    const ratedOnStr = ratedOn.toLocaleDateString("en-US", { month: "short", day: "numeric" });
    const nextMonthStr = nextMonth.toLocaleDateString("en-US", { month: "short", day: "numeric" });
    return { ratedOn: ratedOnStr, nextMonth: nextMonthStr };
  })();

  return (
    <div>
      <SectionLabel>{existing ? "Your Review" : "Rate this game"}</SectionLabel>

      {lockMessage ? (
        <div style={{
          padding: "12px 14px",
          borderRadius: 9,
          border: "1px solid rgba(255,255,255,0.07)",
          background: "rgba(255,255,255,0.02)",
          marginBottom: 8,
        }}>
          <div style={{ fontSize: 13, color: "rgba(241,243,249,0.55)", lineHeight: 1.6 }}>
            You rated this game on <strong style={{ color: "#F1F3F9" }}>{lockMessage.ratedOn}</strong>.
            <br />
            You can update your review starting from <strong style={{ color: "#F1F3F9" }}>{lockMessage.nextMonth}</strong>.
          </div>
        </div>
      ) : (
        <>
          <div style={{ display: "flex", gap: 4, flexWrap: "wrap", marginBottom: 10 }}>
            {[1,2,3,4,5,6,7,8,9,10].map((n) => (
              <button
                key={n}
                type="button"
                onClick={() => onRating(n)}
                style={{
                  width: 28,
                  height: 28,
                  borderRadius: 6,
                  border: rating === n ? "1px solid #C8FF00" : "1px solid rgba(255,255,255,0.1)",
                  background: rating === n ? "rgba(200,255,0,0.15)" : "rgba(255,255,255,0.03)",
                  color: rating === n ? "#C8FF00" : "rgba(241,243,249,0.45)",
                  fontSize: 12,
                  fontWeight: 700,
                  fontFamily: "'Outfit', sans-serif",
                  cursor: "pointer",
                  transition: "all 0.12s",
                }}
              >
                {n}
              </button>
            ))}
          </div>
          <textarea
            value={comment}
            onChange={(e) => onComment(e.target.value)}
            placeholder="Leave a comment (optional)"
            rows={3}
            style={{
              width: "100%",
              padding: "10px 12px",
              borderRadius: 9,
              border: "1px solid rgba(255,255,255,0.08)",
              background: "rgba(255,255,255,0.03)",
              color: "#F1F3F9",
              fontSize: 13,
              fontFamily: "'Outfit', sans-serif",
              resize: "vertical",
              outline: "none",
              boxSizing: "border-box",
              marginBottom: 8,
            }}
          />
          <button
            onClick={onSubmit}
            disabled={!canSubmit}
            style={{
              width: "100%",
              padding: "11px",
              borderRadius: 9,
              border: "none",
              background: saved ? "rgba(200,255,0,0.12)" : canSubmit ? "linear-gradient(135deg, #C8FF00, #a3e600)" : "rgba(255,255,255,0.05)",
              color: saved ? "#C8FF00" : canSubmit ? "#07080F" : "rgba(241,243,249,0.2)",
              fontFamily: "'Outfit', sans-serif",
              fontSize: 14,
              fontWeight: 800,
              cursor: canSubmit ? "pointer" : "default",
              transition: "all 0.15s",
              letterSpacing: "-0.01em",
            }}
          >
            {saving ? "Saving…" : saved ? "✓ Saved" : existing ? "Update Review" : "Save Review"}
          </button>
        </>
      )}
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
