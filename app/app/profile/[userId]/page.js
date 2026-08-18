"use client";
import { useState, useEffect } from "react";
import { useParams, useRouter } from "next/navigation";

const PLATFORM_COLORS = { steam: "#b9d8f5", psn: "#c8aaff", xbox: "#7bcb80", epic: "#d4c4ff" };
const PLATFORM_LABELS = { steam: "Steam", psn: "PSN", xbox: "Xbox", epic: "Epic" };

function getRankColor(rankTier) {
  if (!rankTier) return "#C8FF00";
  const t = rankTier.toLowerCase();
  if (t.includes("diamond")) return "#a5f3fc";
  if (t.includes("platinum")) return "#67e8f9";
  if (t.includes("gold")) return "#fbbf24";
  if (t.includes("silver")) return "#94a3b8";
  if (t.includes("bronze")) return "#d97706";
  return "#C8FF00";
}

function ChallengeSection({ userId, session }) {
  const [state, setState] = useState("idle"); // idle | sending | sent | error | already_sent

  async function handleChallenge() {
    if (state !== "idle" && state !== "error") return;
    setState("sending");
    try {
      const res = await fetch(`/api/users/${userId}/challenge`, { method: "POST" });
      const json = await res.json();
      if (res.status === 429) { setState("already_sent"); return; }
      if (json.ok) setState("sent");
      else setState("error");
    } catch {
      setState("error");
    }
  }

  return (
    <div style={{
      borderRadius: 16,
      border: "1px solid rgba(200,255,0,0.15)",
      background: "linear-gradient(135deg, rgba(200,255,0,0.04) 0%, rgba(124,58,237,0.08) 100%)",
      padding: "24px 28px",
      marginTop: 20,
      position: "relative",
      overflow: "hidden",
    }}>
      {/* Decorative glow */}
      <div style={{
        position: "absolute", top: -40, right: -40,
        width: 120, height: 120, borderRadius: "50%",
        background: "radial-gradient(circle, rgba(200,255,0,0.12) 0%, transparent 70%)",
        pointerEvents: "none",
      }} />

      <div style={{ display: "flex", alignItems: "flex-start", justifyContent: "space-between", gap: 16, flexWrap: "wrap" }}>
        <div style={{ flex: 1, minWidth: 200 }}>
          <div style={{ fontSize: 15, fontWeight: 800, color: "#F1F3F9", letterSpacing: "-0.01em", marginBottom: 6 }}>
            {state === "sent"
              ? "Sfida inviata! 🎯"
              : state === "already_sent"
              ? "Invito già inviato"
              : "Vuoi sfidarli?"}
          </div>
          <div style={{ fontSize: 13, color: "rgba(241,243,249,0.45)", lineHeight: 1.55, maxWidth: 340 }}>
            {state === "sent"
              ? "Gli abbiamo mandato una mail. Ora tocca a loro collegare i loro account e raccogliere la sfida."
              : state === "already_sent"
              ? "Hai già inviato una sfida a questo giocatore. Riprova tra 24 ore."
              : "Non ha ancora collegato i suoi account di gioco. Inviagli una sfida via mail — mettilo sotto pressione di aggiungere il suo ID."}
          </div>
        </div>

        {state === "sent" ? (
          <div style={{
            display: "flex", alignItems: "center", gap: 8,
            padding: "10px 20px", borderRadius: 10,
            background: "rgba(200,255,0,0.08)", border: "1px solid rgba(200,255,0,0.25)",
            color: "#C8FF00", fontSize: 13, fontWeight: 800, whiteSpace: "nowrap",
          }}>
            ✓ Inviata
          </div>
        ) : state === "already_sent" ? (
          <div style={{
            display: "flex", alignItems: "center", gap: 8,
            padding: "10px 20px", borderRadius: 10,
            background: "rgba(255,255,255,0.04)", border: "1px solid rgba(255,255,255,0.1)",
            color: "rgba(241,243,249,0.35)", fontSize: 13, fontWeight: 700, whiteSpace: "nowrap",
          }}>
            Già inviata
          </div>
        ) : !session ? (
          <div style={{
            padding: "10px 20px", borderRadius: 10,
            background: "rgba(255,255,255,0.04)", border: "1px solid rgba(255,255,255,0.1)",
            color: "rgba(241,243,249,0.35)", fontSize: 12, fontWeight: 600,
          }}>
            Accedi per sfidarlo
          </div>
        ) : (
          <button
            onClick={handleChallenge}
            disabled={state === "sending"}
            style={{
              padding: "10px 22px", borderRadius: 10,
              border: "1px solid rgba(200,255,0,0.35)",
              background: state === "sending" ? "rgba(200,255,0,0.05)" : "rgba(200,255,0,0.1)",
              color: state === "sending" ? "rgba(200,255,0,0.5)" : "#C8FF00",
              fontFamily: "'Outfit', sans-serif", fontSize: 13, fontWeight: 800,
              cursor: state === "sending" ? "wait" : "pointer",
              whiteSpace: "nowrap", transition: "all 0.15s",
              letterSpacing: "-0.01em",
            }}
            onMouseEnter={(e) => { if (state === "idle") { e.currentTarget.style.background = "rgba(200,255,0,0.18)"; e.currentTarget.style.borderColor = "rgba(200,255,0,0.6)"; } }}
            onMouseLeave={(e) => { if (state === "idle") { e.currentTarget.style.background = "rgba(200,255,0,0.1)"; e.currentTarget.style.borderColor = "rgba(200,255,0,0.35)"; } }}
          >
            {state === "sending" ? "Invio…" : state === "error" ? "Riprova" : "⚡ Sfidalo — aggiungi il tuo ID"}
          </button>
        )}
      </div>
    </div>
  );
}

function StatCard({ label, value }) {
  return (
    <div style={{
      flex: 1,
      minWidth: 80,
      background: "rgba(255,255,255,0.03)",
      border: "1px solid rgba(255,255,255,0.07)",
      borderRadius: 12,
      padding: "14px 16px",
      textAlign: "center",
    }}>
      <div style={{ fontSize: 20, fontWeight: 900, color: "#F1F3F9", letterSpacing: "-0.02em" }}>
        {value ?? "—"}
      </div>
      <div style={{ fontSize: 11, fontWeight: 600, color: "rgba(241,243,249,0.4)", marginTop: 3, letterSpacing: "0.04em", textTransform: "uppercase" }}>
        {label}
      </div>
    </div>
  );
}

function FollowButton({ userId, isFollowing, onToggle }) {
  const [hovered, setHovered] = useState(false);
  const [pending, setPending] = useState(false);

  async function handleClick() {
    if (pending) return;
    setPending(true);
    try {
      const method = isFollowing ? "DELETE" : "POST";
      const res = await fetch(`/api/me/follow/${userId}`, { method });
      if (res.ok) onToggle(!isFollowing);
    } catch {}
    setPending(false);
  }

  const showUnfollow = isFollowing && hovered;
  const label = pending ? "…" : showUnfollow ? "Unfollow" : isFollowing ? "Following" : "Follow";
  const color = showUnfollow ? "#f87171" : isFollowing ? "#C8FF00" : "#F1F3F9";
  const borderColor = showUnfollow ? "rgba(248,113,113,0.4)" : isFollowing ? "rgba(200,255,0,0.35)" : "rgba(241,243,249,0.25)";
  const bg = isFollowing ? "rgba(200,255,0,0.06)" : "transparent";

  return (
    <button
      onClick={handleClick}
      onMouseEnter={() => setHovered(true)}
      onMouseLeave={() => setHovered(false)}
      style={{
        padding: "9px 22px",
        borderRadius: 10,
        border: `1px solid ${borderColor}`,
        background: bg,
        color,
        fontFamily: "'Outfit', sans-serif",
        fontSize: 13,
        fontWeight: 700,
        cursor: pending ? "wait" : "pointer",
        transition: "all 0.15s",
        whiteSpace: "nowrap",
      }}
    >
      {label}
    </button>
  );
}

export default function PublicProfilePage() {
  const { userId } = useParams();
  const router = useRouter();

  const [user, setUser] = useState(null);
  const [loading, setLoading] = useState(true);
  const [notFound, setNotFound] = useState(false);
  const [isFollowing, setIsFollowing] = useState(false);
  const [session, setSession] = useState(null);

  useEffect(() => {
    Promise.all([
      fetch(`/api/users/${userId}`).then((r) => r.json()),
      fetch("/api/auth/session").then((r) => r.json()),
      fetch("/api/me/followers?type=following").then((r) => r.json()).catch(() => ({ ok: false })),
    ]).then(([profileJson, sessionJson, followJson]) => {
      if (!profileJson.ok) { setNotFound(true); setLoading(false); return; }
      setUser(profileJson.data.user);
      setSession(sessionJson?.user ?? null);
      if (followJson.ok) {
        const ids = new Set(followJson.data.users.map((u) => u.id));
        setIsFollowing(ids.has(userId));
      }
      // If this is the current user's own profile, redirect to /app/profile
      if (sessionJson?.user?.id === profileJson.data.user.id) {
        router.replace("/app/profile");
        return;
      }
      setLoading(false);
    });
  }, [userId, router]);

  if (loading) {
    return (
      <div style={{ padding: "36px 32px", fontFamily: "'Outfit', sans-serif" }}>
        <div style={{
          height: 200, borderRadius: 18, background: "rgba(255,255,255,0.03)",
          animation: "pulse 1.4s ease infinite",
        }}>
          <style>{`@keyframes pulse { 0%,100%{opacity:1;} 50%{opacity:0.4;} }`}</style>
        </div>
      </div>
    );
  }

  if (notFound) {
    return (
      <div style={{ padding: "36px 32px", fontFamily: "'Outfit', sans-serif", textAlign: "center", paddingTop: 80 }}>
        <div style={{ fontSize: 36, marginBottom: 12 }}>👤</div>
        <div style={{ fontSize: 18, fontWeight: 800, color: "#F1F3F9", marginBottom: 6 }}>Player not found</div>
        <div style={{ fontSize: 13, color: "rgba(241,243,249,0.4)" }}>This profile doesn't exist or has been removed.</div>
        <button
          onClick={() => router.push("/app/rankings")}
          style={{
            marginTop: 24, padding: "10px 22px", borderRadius: 10,
            border: "1px solid rgba(255,255,255,0.15)", background: "rgba(255,255,255,0.05)",
            color: "rgba(241,243,249,0.7)", fontFamily: "'Outfit', sans-serif",
            fontSize: 13, fontWeight: 700, cursor: "pointer",
          }}
        >
          ← Back to Rankings
        </button>
      </div>
    );
  }

  const rankColor = getRankColor(user.rankTier);
  const platforms = user.platforms || [];

  return (
    <div className="l9-pub-profile" style={{ padding: "36px 32px", fontFamily: "'Outfit', sans-serif", maxWidth: 680, margin: "0 auto" }}>
      <style>{`
        @media (max-width: 639px) { .l9-pub-profile { padding: 20px 16px !important; } }
        @keyframes pulse { 0%,100%{opacity:1;} 50%{opacity:0.4;} }
      `}</style>

      {/* Back */}
      <button
        onClick={() => router.back()}
        style={{
          marginBottom: 20, background: "none", border: "none", color: "rgba(241,243,249,0.4)",
          fontFamily: "'Outfit', sans-serif", fontSize: 13, fontWeight: 600, cursor: "pointer",
          padding: 0, display: "flex", alignItems: "center", gap: 6,
        }}
      >
        ← Back
      </button>

      {/* Hero card */}
      <div style={{
        borderRadius: 18,
        border: "1px solid rgba(255,255,255,0.08)",
        background: "linear-gradient(135deg, rgba(200,255,0,0.04) 0%, rgba(124,58,237,0.06) 100%)",
        padding: "24px 28px",
        marginBottom: 20,
      }}>
        <div style={{ display: "flex", alignItems: "flex-start", gap: 20, flexWrap: "wrap" }}>
          {/* Avatar */}
          <div style={{ position: "relative", flexShrink: 0 }}>
            <div style={{
              width: 72, height: 72, borderRadius: "50%",
              background: "linear-gradient(135deg, #C8FF00, #7C3AED)",
              display: "flex", alignItems: "center", justifyContent: "center",
              fontSize: 22, fontWeight: 800, color: "#07080F",
              border: "2px solid rgba(200,255,0,0.25)",
              overflow: "hidden", position: "relative",
            }}>
              {user.avatarUrl
                ? <img src={user.avatarUrl} alt={user.gamerTag} style={{ width: "100%", height: "100%", objectFit: "cover" }} onError={(e) => { e.currentTarget.style.display = "none"; }} />
                : (user.avatarInitials || user.gamerTag?.[0] || "?")}
            </div>
            {user.level != null && (
              <div style={{
                position: "absolute", bottom: -2, right: -4,
                background: "#07080F", border: "1.5px solid rgba(200,255,0,0.5)",
                borderRadius: 7, padding: "2px 7px",
                fontSize: 10, fontWeight: 800, color: "#C8FF00", letterSpacing: "0.03em",
              }}>
                Lv {user.level}
              </div>
            )}
          </div>

          {/* Identity */}
          <div style={{ flex: 1, minWidth: 0 }}>
            <h1 style={{ fontSize: 22, fontWeight: 900, color: "#F1F3F9", letterSpacing: "-0.02em", margin: "0 0 8px" }}>
              {user.gamerTag}
            </h1>
            <div style={{ display: "flex", alignItems: "center", gap: 7, flexWrap: "wrap", marginBottom: 10 }}>
              {user.rankTier && (
                <span style={{
                  fontSize: 11, fontWeight: 800, padding: "3px 10px", borderRadius: 6,
                  background: `${rankColor}1a`, color: rankColor,
                  border: `1px solid ${rankColor}40`, letterSpacing: "0.04em",
                }}>
                  ◆ {user.rankTier}
                </span>
              )}
            </div>
            {platforms.length > 0 && (
              <div style={{ display: "flex", gap: 5, flexWrap: "wrap" }}>
                {platforms.map((p) => (
                  <span key={p} style={{
                    fontSize: 10, fontWeight: 700, padding: "2px 8px", borderRadius: 5,
                    background: "rgba(255,255,255,0.04)",
                    color: PLATFORM_COLORS[p] || "rgba(241,243,249,0.5)",
                    border: "1px solid rgba(255,255,255,0.1)", letterSpacing: "0.05em",
                  }}>
                    {PLATFORM_LABELS[p] || p.toUpperCase()}
                  </span>
                ))}
              </div>
            )}
            {user.bio && (
              <div style={{ marginTop: 10, fontSize: 13, color: "rgba(241,243,249,0.5)", lineHeight: 1.55 }}>
                {user.bio}
              </div>
            )}
          </div>

          {/* Follow button */}
          {session && (
            <FollowButton
              userId={userId}
              isFollowing={isFollowing}
              onToggle={setIsFollowing}
            />
          )}
        </div>

        {/* L9 Points bar */}
        <div style={{
          marginTop: 20, padding: "10px 16px", borderRadius: 10,
          background: "rgba(200,255,0,0.05)", border: "1px solid rgba(200,255,0,0.1)",
          display: "flex", alignItems: "center", justifyContent: "space-between",
        }}>
          <span style={{ fontSize: 11, fontWeight: 700, color: "rgba(200,255,0,0.55)", letterSpacing: "0.07em", textTransform: "uppercase" }}>
            L9 Points
          </span>
          <span style={{ fontSize: 22, fontWeight: 900, color: "#C8FF00", letterSpacing: "-0.01em" }}>
            {user.l9Points != null ? user.l9Points.toLocaleString() : "—"}
          </span>
        </div>

        {/* Rank progress */}
        {user.rankTier && (
          <div style={{ marginTop: 14 }}>
            <div style={{ display: "flex", justifyContent: "space-between", marginBottom: 6 }}>
              <span style={{ fontSize: 11, fontWeight: 700, color: rankColor }}>{user.rankTier}</span>
              <span style={{ fontSize: 11, color: "rgba(241,243,249,0.3)" }}>
                {user.pointsToNextRank != null ? `${user.pointsToNextRank.toLocaleString()} pts → ${user.nextRank}` : ""}
              </span>
            </div>
            <div style={{ height: 6, borderRadius: 99, background: "rgba(255,255,255,0.06)", overflow: "hidden" }}>
              <div style={{
                height: "100%", width: `${user.rankProgressPct || 0}%`,
                background: `linear-gradient(90deg, ${rankColor}, ${rankColor}bb)`,
                borderRadius: 99,
              }} />
            </div>
          </div>
        )}
      </div>

      {/* Stats row */}
      <div style={{ display: "flex", gap: 12, flexWrap: "wrap" }}>
        <StatCard label="Games" value={user.gamesCount?.toLocaleString()} />
        <StatCard label="Hours" value={user.totalHours != null ? `${user.totalHours.toLocaleString()}h` : "—"} />
        <StatCard label="Achievements" value={user.totalAchievements?.toLocaleString()} />
        <StatCard label="Level" value={user.level} />
      </div>

      {/* Challenge section — shown when target has no platforms connected */}
      {platforms.length === 0 && (
        <ChallengeSection userId={userId} session={session} />
      )}
    </div>
  );
}
