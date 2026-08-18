"use client";
import { useState, useEffect } from "react";
import { useRouter } from "next/navigation";

function Avatar({ src, name, size = 36 }) {
  return src
    ? <img src={src} alt={name} style={{ width: size, height: size, borderRadius: "50%", border: "1.5px solid rgba(255,255,255,0.1)", flexShrink: 0, objectFit: "cover" }} />
    : <div style={{
        width: size, height: size, borderRadius: "50%",
        background: "linear-gradient(135deg,#C8FF00,#7C3AED)",
        display: "flex", alignItems: "center", justifyContent: "center",
        fontSize: size * 0.33, fontWeight: 800, color: "#07080F", flexShrink: 0,
      }}>
        {(name?.[0] || "?").toUpperCase()}
      </div>;
}

function StatusBadge({ status }) {
  const map = {
    PENDING:  { label: "Pending",  color: "#fbbf24", bg: "rgba(251,191,36,0.08)",  border: "rgba(251,191,36,0.25)" },
    ACCEPTED: { label: "Accepted", color: "#4ade80", bg: "rgba(74,222,128,0.08)",  border: "rgba(74,222,128,0.25)" },
    DECLINED: { label: "Declined", color: "rgba(241,243,249,0.3)", bg: "rgba(255,255,255,0.03)", border: "rgba(255,255,255,0.08)" },
  };
  const s = map[status] ?? map.PENDING;
  return (
    <span style={{
      fontSize: 10, fontWeight: 700, padding: "3px 9px", borderRadius: 6,
      background: s.bg, color: s.color, border: `1px solid ${s.border}`,
      letterSpacing: "0.05em", textTransform: "uppercase",
    }}>
      {s.label}
    </span>
  );
}

function ChallengeRow({ challenge, onRespond }) {
  const router = useRouter();
  const [responding, setResponding] = useState(null);

  async function respond(action) {
    setResponding(action);
    try {
      const res = await fetch(`/api/challenges/${challenge.id}/respond`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ action }),
      });
      const json = await res.json();
      if (json.ok) onRespond(challenge.id, action === "accept" ? "ACCEPTED" : "DECLINED");
    } catch {}
    setResponding(null);
  }

  return (
    <div
      style={{
        display: "flex", alignItems: "center", gap: 14,
        padding: "14px 18px", borderRadius: 14,
        background: "rgba(255,255,255,0.02)",
        border: "1px solid rgba(255,255,255,0.07)",
        cursor: challenge.status !== "PENDING" ? "pointer" : "default",
        transition: "background 0.15s",
      }}
      onClick={() => { if (challenge.status !== "PENDING" || challenge.role === "challenger") router.push(`/app/challenges/${challenge.id}`); }}
      onMouseEnter={(e) => { if (challenge.status !== "PENDING" || challenge.role === "challenger") e.currentTarget.style.background = "rgba(255,255,255,0.04)"; }}
      onMouseLeave={(e) => { e.currentTarget.style.background = "rgba(255,255,255,0.02)"; }}
    >
      <Avatar src={challenge.opponentAvatarUrl} name={challenge.opponentName} />

      <div style={{ flex: 1, minWidth: 0 }}>
        <div style={{ display: "flex", alignItems: "center", gap: 8, flexWrap: "wrap" }}>
          <span style={{ fontSize: 13, fontWeight: 700, color: "#F1F3F9" }}>{challenge.opponentName}</span>
          <StatusBadge status={challenge.status} />
          {challenge.role === "challenged" && challenge.status === "PENDING" && (
            <span style={{ fontSize: 10, fontWeight: 700, color: "#C8FF00", background: "rgba(200,255,0,0.08)", border: "1px solid rgba(200,255,0,0.2)", padding: "2px 7px", borderRadius: 5 }}>
              Your turn
            </span>
          )}
        </div>
        <div style={{ fontSize: 12, color: "rgba(241,243,249,0.4)", marginTop: 3 }}>
          {challenge.role === "challenger" ? "You challenged" : "Challenged you"} · <strong style={{ color: "rgba(241,243,249,0.6)" }}>{challenge.gameName}</strong>
        </div>
      </div>

      {challenge.role === "challenged" && challenge.status === "PENDING" && (
        <div style={{ display: "flex", gap: 8 }} onClick={(e) => e.stopPropagation()}>
          <button
            onClick={() => respond("accept")}
            disabled={!!responding}
            style={{
              padding: "7px 14px", borderRadius: 8,
              border: "1px solid rgba(200,255,0,0.35)", background: "rgba(200,255,0,0.08)",
              color: "#C8FF00", fontFamily: "'Outfit', sans-serif", fontSize: 12, fontWeight: 700,
              cursor: responding ? "wait" : "pointer",
            }}
          >
            {responding === "accept" ? "…" : "Accept"}
          </button>
          <button
            onClick={() => respond("decline")}
            disabled={!!responding}
            style={{
              padding: "7px 14px", borderRadius: 8,
              border: "1px solid rgba(255,255,255,0.09)", background: "transparent",
              color: "rgba(241,243,249,0.4)", fontFamily: "'Outfit', sans-serif", fontSize: 12, fontWeight: 600,
              cursor: responding ? "wait" : "pointer",
            }}
          >
            {responding === "decline" ? "…" : "Decline"}
          </button>
        </div>
      )}

      {challenge.status === "ACCEPTED" && (
        <div style={{ fontSize: 12, fontWeight: 700, color: "#C8FF00", whiteSpace: "nowrap" }}>
          View result →
        </div>
      )}
    </div>
  );
}

export default function ChallengesPage() {
  const [incoming, setIncoming] = useState([]);
  const [outgoing, setOutgoing] = useState([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    fetch("/api/challenges")
      .then((r) => r.json())
      .then((json) => {
        if (json.ok) {
          setIncoming(json.data.incoming);
          setOutgoing(json.data.outgoing);
        }
        setLoading(false);
      })
      .catch(() => setLoading(false));

    // Mark notifications read when visiting this page
    fetch("/api/notifications", { method: "PATCH" }).catch(() => {});
  }, []);

  function handleRespond(id, newStatus) {
    setIncoming((prev) => prev.map((c) => c.id === id ? { ...c, status: newStatus } : c));
  }

  const pendingIncoming = incoming.filter((c) => c.status === "PENDING");
  const otherIncoming = incoming.filter((c) => c.status !== "PENDING");

  if (loading) {
    return (
      <div style={{ padding: "36px 32px", fontFamily: "'Outfit', sans-serif" }}>
        <div style={{ height: 200, borderRadius: 18, background: "rgba(255,255,255,0.03)", animation: "pulse 1.4s ease infinite" }}>
          <style>{`@keyframes pulse{0%,100%{opacity:1;}50%{opacity:0.4;}}`}</style>
        </div>
      </div>
    );
  }

  const isEmpty = incoming.length === 0 && outgoing.length === 0;

  return (
    <div className="l9-challenges" style={{ padding: "36px 32px", fontFamily: "'Outfit', sans-serif", maxWidth: 680, margin: "0 auto" }}>
      <style>{`@media(max-width:639px){.l9-challenges{padding:20px 16px!important;}}`}</style>

      <h1 style={{ fontSize: 22, fontWeight: 900, color: "#F1F3F9", letterSpacing: "-0.02em", margin: "0 0 28px" }}>
        Challenges
      </h1>

      {isEmpty && (
        <div style={{ textAlign: "center", paddingTop: 60 }}>
          <div style={{ fontSize: 40, marginBottom: 16 }}>⚡</div>
          <div style={{ fontSize: 16, fontWeight: 800, color: "#F1F3F9", marginBottom: 8 }}>No challenges yet</div>
          <div style={{ fontSize: 13, color: "rgba(241,243,249,0.4)" }}>
            Visit a player's profile and challenge them on a shared game.
          </div>
        </div>
      )}

      {pendingIncoming.length > 0 && (
        <section style={{ marginBottom: 32 }}>
          <div style={{ fontSize: 11, fontWeight: 700, color: "#C8FF00", letterSpacing: "0.07em", textTransform: "uppercase", marginBottom: 12 }}>
            Waiting for you · {pendingIncoming.length}
          </div>
          <div style={{ display: "flex", flexDirection: "column", gap: 8 }}>
            {pendingIncoming.map((c) => <ChallengeRow key={c.id} challenge={c} onRespond={handleRespond} />)}
          </div>
        </section>
      )}

      {outgoing.length > 0 && (
        <section style={{ marginBottom: 32 }}>
          <div style={{ fontSize: 11, fontWeight: 700, color: "rgba(241,243,249,0.3)", letterSpacing: "0.07em", textTransform: "uppercase", marginBottom: 12 }}>
            Sent
          </div>
          <div style={{ display: "flex", flexDirection: "column", gap: 8 }}>
            {outgoing.map((c) => <ChallengeRow key={c.id} challenge={c} onRespond={() => {}} />)}
          </div>
        </section>
      )}

      {otherIncoming.length > 0 && (
        <section>
          <div style={{ fontSize: 11, fontWeight: 700, color: "rgba(241,243,249,0.3)", letterSpacing: "0.07em", textTransform: "uppercase", marginBottom: 12 }}>
            Received
          </div>
          <div style={{ display: "flex", flexDirection: "column", gap: 8 }}>
            {otherIncoming.map((c) => <ChallengeRow key={c.id} challenge={c} onRespond={() => {}} />)}
          </div>
        </section>
      )}
    </div>
  );
}
