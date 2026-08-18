"use client";
import { useState, useEffect } from "react";
import { useParams, useRouter } from "next/navigation";

function Avatar({ src, name, size = 56 }) {
  return src
    ? <img src={src} alt={name} style={{ width: size, height: size, borderRadius: "50%", border: "2px solid rgba(255,255,255,0.1)", objectFit: "cover", flexShrink: 0 }} />
    : <div style={{
        width: size, height: size, borderRadius: "50%",
        background: "linear-gradient(135deg,#C8FF00,#7C3AED)",
        display: "flex", alignItems: "center", justifyContent: "center",
        fontSize: size * 0.35, fontWeight: 800, color: "#07080F", flexShrink: 0,
      }}>
        {(name?.[0] || "?").toUpperCase()}
      </div>;
}

function StatBar({ label, myValue, theirValue, myName, theirName }) {
  const max = Math.max(myValue || 0, theirValue || 0, 1);
  const myPct = Math.round(((myValue || 0) / max) * 100);
  const theirPct = Math.round(((theirValue || 0) / max) * 100);
  const myWins = (myValue || 0) > (theirValue || 0);
  const tie = myValue === theirValue;

  return (
    <div style={{ marginBottom: 20 }}>
      <div style={{ display: "flex", justifyContent: "space-between", marginBottom: 8, fontSize: 12, fontWeight: 700 }}>
        <span style={{ color: myWins && !tie ? "#C8FF00" : "rgba(241,243,249,0.5)" }}>{(myValue || 0).toLocaleString()}</span>
        <span style={{ color: "rgba(241,243,249,0.3)", fontWeight: 600, fontSize: 11, textTransform: "uppercase", letterSpacing: "0.06em" }}>{label}</span>
        <span style={{ color: !myWins && !tie ? "#C8FF00" : "rgba(241,243,249,0.5)" }}>{(theirValue || 0).toLocaleString()}</span>
      </div>
      <div style={{ display: "flex", gap: 4, alignItems: "center" }}>
        {/* My bar (fills right→left) */}
        <div style={{ flex: 1, height: 8, borderRadius: 99, background: "rgba(255,255,255,0.05)", overflow: "hidden", transform: "scaleX(-1)" }}>
          <div style={{
            height: "100%", width: `${myPct}%`,
            background: myWins && !tie ? "#C8FF00" : "rgba(241,243,249,0.15)",
            borderRadius: 99, transition: "width 0.8s ease",
          }} />
        </div>
        {/* Divider */}
        <div style={{ width: 2, height: 12, background: "rgba(255,255,255,0.1)", flexShrink: 0 }} />
        {/* Their bar (fills left→right) */}
        <div style={{ flex: 1, height: 8, borderRadius: 99, background: "rgba(255,255,255,0.05)", overflow: "hidden" }}>
          <div style={{
            height: "100%", width: `${theirPct}%`,
            background: !myWins && !tie ? "#C8FF00" : "rgba(241,243,249,0.15)",
            borderRadius: 99, transition: "width 0.8s ease",
          }} />
        </div>
      </div>
    </div>
  );
}

export default function ChallengePage() {
  const { challengeId } = useParams();
  const router = useRouter();
  const [challenge, setChallenge] = useState(null);
  const [loading, setLoading] = useState(true);
  const [notFound, setNotFound] = useState(false);
  const [responding, setResponding] = useState(null);

  useEffect(() => {
    fetch(`/api/challenges/${challengeId}`)
      .then((r) => r.json())
      .then((json) => {
        if (!json.ok) { setNotFound(true); setLoading(false); return; }
        setChallenge(json.data.challenge);
        setLoading(false);
      })
      .catch(() => setLoading(false));
  }, [challengeId]);

  async function respond(action) {
    setResponding(action);
    try {
      const res = await fetch(`/api/challenges/${challengeId}/respond`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ action }),
      });
      const json = await res.json();
      if (json.ok) {
        setChallenge((prev) => ({
          ...prev,
          status: action === "accept" ? "ACCEPTED" : "DECLINED",
          challenger: { ...prev.challenger, stats: json.data.challengerStats },
          challenged: { ...prev.challenged, stats: json.data.challengedStats },
        }));
      }
    } catch {}
    setResponding(null);
  }

  if (loading) {
    return (
      <div style={{ padding: "36px 32px", fontFamily: "'Outfit', sans-serif" }}>
        <div style={{ height: 300, borderRadius: 18, background: "rgba(255,255,255,0.03)", animation: "pulse 1.4s ease infinite" }}>
          <style>{`@keyframes pulse{0%,100%{opacity:1;}50%{opacity:0.4;}}`}</style>
        </div>
      </div>
    );
  }

  if (notFound || !challenge) {
    return (
      <div style={{ padding: "36px 32px", fontFamily: "'Outfit', sans-serif", textAlign: "center", paddingTop: 80 }}>
        <div style={{ fontSize: 36, marginBottom: 12 }}>⚡</div>
        <div style={{ fontSize: 18, fontWeight: 800, color: "#F1F3F9", marginBottom: 6 }}>Challenge not found</div>
        <button onClick={() => router.push("/app/challenges")} style={{ marginTop: 20, padding: "10px 22px", borderRadius: 10, border: "1px solid rgba(255,255,255,0.15)", background: "rgba(255,255,255,0.05)", color: "rgba(241,243,249,0.7)", fontFamily: "'Outfit', sans-serif", fontSize: 13, fontWeight: 700, cursor: "pointer" }}>
          ← Back to Challenges
        </button>
      </div>
    );
  }

  const { challenger, challenged, myRole, status, gameName, gameCoverUrl } = challenge;
  const me = myRole === "challenger" ? challenger : challenged;
  const them = myRole === "challenger" ? challenged : challenger;

  // Determine winner (only when ACCEPTED and stats exist)
  let winner = null;
  if (status === "ACCEPTED" && challenger.stats && challenged.stats) {
    const cScore = (challenger.stats.hours || 0) + (challenger.stats.achievements || 0);
    const dScore = (challenged.stats.hours || 0) + (challenged.stats.achievements || 0);
    if (cScore > dScore) winner = challenger.id;
    else if (dScore > cScore) winner = challenged.id;
    // else: tie
  }

  const myStats = myRole === "challenger" ? challenger.stats : challenged.stats;
  const theirStats = myRole === "challenger" ? challenged.stats : challenger.stats;

  return (
    <div className="l9-challenge-detail" style={{ padding: "36px 32px", fontFamily: "'Outfit', sans-serif", maxWidth: 640, margin: "0 auto" }}>
      <style>{`@media(max-width:639px){.l9-challenge-detail{padding:20px 16px!important;}}`}</style>

      <button
        onClick={() => router.push("/app/challenges")}
        style={{ marginBottom: 24, background: "none", border: "none", color: "rgba(241,243,249,0.4)", fontFamily: "'Outfit', sans-serif", fontSize: 13, fontWeight: 600, cursor: "pointer", padding: 0 }}
      >
        ← Back
      </button>

      {/* Game header */}
      <div style={{
        borderRadius: 18, border: "1px solid rgba(255,255,255,0.08)",
        background: gameCoverUrl
          ? `linear-gradient(to bottom, rgba(7,8,15,0) 0%, rgba(7,8,15,0.9) 60%, #07080F 100%), url(${gameCoverUrl}) center/cover no-repeat`
          : "linear-gradient(135deg, rgba(200,255,0,0.06) 0%, rgba(124,58,237,0.1) 100%)",
        padding: "32px 28px 24px",
        marginBottom: 24,
        position: "relative",
        overflow: "hidden",
        minHeight: gameCoverUrl ? 160 : undefined,
        display: "flex", flexDirection: "column", justifyContent: "flex-end",
      }}>
        <div style={{ fontSize: 11, fontWeight: 700, color: "rgba(200,255,0,0.7)", letterSpacing: "0.09em", textTransform: "uppercase", marginBottom: 6 }}>
          1v1 Challenge
        </div>
        <div style={{ fontSize: 24, fontWeight: 900, color: "#F1F3F9", letterSpacing: "-0.02em" }}>
          {gameName}
        </div>
        {status === "PENDING" && (
          <div style={{ marginTop: 8, fontSize: 12, color: "rgba(241,243,249,0.4)" }}>
            {myRole === "challenged" ? "You've been challenged — accept or decline." : "Waiting for the opponent to respond."}
          </div>
        )}
        {status === "DECLINED" && (
          <div style={{ marginTop: 8, fontSize: 12, color: "rgba(241,243,249,0.35)" }}>Challenge declined.</div>
        )}
      </div>

      {/* Players */}
      <div style={{
        display: "flex", alignItems: "center", gap: 16,
        padding: "20px 24px", borderRadius: 16,
        border: "1px solid rgba(255,255,255,0.08)",
        background: "rgba(255,255,255,0.02)",
        marginBottom: 20,
        flexWrap: "wrap",
      }}>
        {/* Me */}
        <div style={{ display: "flex", flexDirection: "column", alignItems: "center", gap: 8, flex: 1, minWidth: 80 }}>
          <div style={{ position: "relative" }}>
            <Avatar src={me.avatarUrl} name={me.name} />
            {winner === me.id && <div style={{ position: "absolute", top: -6, right: -6, fontSize: 16 }}>🏆</div>}
          </div>
          <span style={{ fontSize: 13, fontWeight: 700, color: "#F1F3F9", textAlign: "center" }}>{me.name}</span>
        </div>

        {/* VS */}
        <div style={{ fontSize: 16, fontWeight: 900, color: "rgba(241,243,249,0.2)", flexShrink: 0 }}>VS</div>

        {/* Them */}
        <div style={{ display: "flex", flexDirection: "column", alignItems: "center", gap: 8, flex: 1, minWidth: 80 }}>
          <div style={{ position: "relative" }}>
            <Avatar src={them.avatarUrl} name={them.name} />
            {winner === them.id && <div style={{ position: "absolute", top: -6, right: -6, fontSize: 16 }}>🏆</div>}
          </div>
          <span style={{ fontSize: 13, fontWeight: 700, color: "#F1F3F9", textAlign: "center" }}>{them.name}</span>
        </div>
      </div>

      {/* Result stats */}
      {status === "ACCEPTED" && myStats && theirStats && (
        <div style={{ padding: "20px 24px", borderRadius: 16, border: "1px solid rgba(200,255,0,0.12)", background: "rgba(200,255,0,0.03)", marginBottom: 20 }}>
          <div style={{ fontSize: 11, fontWeight: 700, color: "rgba(200,255,0,0.5)", letterSpacing: "0.07em", textTransform: "uppercase", marginBottom: 20, textAlign: "center" }}>
            Stats Comparison
          </div>
          <StatBar label="Hours played" myValue={myStats.hours} theirValue={theirStats.hours} myName={me.name} theirName={them.name} />
          <StatBar label="Achievements" myValue={myStats.achievements} theirValue={theirStats.achievements} myName={me.name} theirName={them.name} />
          {(myStats.trophies > 0 || theirStats.trophies > 0) && (
            <StatBar label="Trophies" myValue={myStats.trophies} theirValue={theirStats.trophies} myName={me.name} theirName={them.name} />
          )}
          {winner ? (
            <div style={{ marginTop: 16, textAlign: "center", fontSize: 14, fontWeight: 800, color: "#C8FF00" }}>
              {winner === me.id ? "🏆 You win this round!" : `🏆 ${them.name} wins this round`}
            </div>
          ) : (
            <div style={{ marginTop: 16, textAlign: "center", fontSize: 13, color: "rgba(241,243,249,0.4)" }}>
              It's a tie!
            </div>
          )}
        </div>
      )}

      {/* Action buttons for pending challenge */}
      {status === "PENDING" && myRole === "challenged" && (
        <div style={{ display: "flex", gap: 12 }}>
          <button
            onClick={() => respond("accept")}
            disabled={!!responding}
            style={{
              flex: 1, padding: "14px", borderRadius: 12,
              border: "1px solid rgba(200,255,0,0.4)", background: "rgba(200,255,0,0.1)",
              color: "#C8FF00", fontFamily: "'Outfit', sans-serif", fontSize: 14, fontWeight: 800,
              cursor: responding ? "wait" : "pointer", transition: "all 0.15s",
            }}
          >
            {responding === "accept" ? "Accepting…" : "⚡ Accept Challenge"}
          </button>
          <button
            onClick={() => respond("decline")}
            disabled={!!responding}
            style={{
              padding: "14px 24px", borderRadius: 12,
              border: "1px solid rgba(255,255,255,0.09)", background: "transparent",
              color: "rgba(241,243,249,0.4)", fontFamily: "'Outfit', sans-serif", fontSize: 14, fontWeight: 600,
              cursor: responding ? "wait" : "pointer",
            }}
          >
            {responding === "decline" ? "…" : "Decline"}
          </button>
        </div>
      )}

      {status === "PENDING" && myRole === "challenger" && (
        <div style={{ textAlign: "center", fontSize: 13, color: "rgba(241,243,249,0.35)", padding: 20 }}>
          Waiting for {them.name} to respond…
        </div>
      )}
    </div>
  );
}
