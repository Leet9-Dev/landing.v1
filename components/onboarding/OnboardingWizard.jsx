"use client";
import { useState, useEffect } from "react";
import { useRouter } from "next/navigation";

const STORAGE_KEY = "l9_onboarding_v1";

const STEPS = ["welcome", "pick", "connect", "sync", "done"];

const PLATFORMS = [
  { id: "steam", label: "Steam", icon: "🎮", color: "#b9d8f5", desc: "PC gaming library" },
  { id: "psn", label: "PlayStation", icon: "🕹", color: "#c8aaff", desc: "PS4 & PS5 trophies" },
  { id: "xbox", label: "Xbox", icon: "🟩", color: "#90d890", desc: "Xbox & Game Pass" },
  { id: "gog", label: "GOG", icon: "📚", color: "#9fc8f5", desc: "DRM-free library" },
  { id: "epic", label: "Epic Games", icon: "⚡", color: "#d4d4d4", desc: "Epic exclusives" },
];

export function OnboardingWizard() {
  const [step, setStep] = useState(null);
  const [picked, setPicked] = useState(null);
  const [steamId, setSteamId] = useState("");
  const [connecting, setConnecting] = useState(false);
  const [syncing, setSyncing] = useState(false);
  const [syncSummary, setSyncSummary] = useState(null);
  const [error, setError] = useState("");
  const router = useRouter();

  useEffect(() => {
    if (typeof window === "undefined") return;
    if (localStorage.getItem(STORAGE_KEY) === "done") return;
    fetch("/api/me/platform-accounts")
      .then((r) => r.json())
      .then((json) => {
        if (json?.ok && json.data?.connectedCount === 0) setStep("welcome");
      })
      .catch(() => {});
  }, []);

  const dismiss = () => {
    localStorage.setItem(STORAGE_KEY, "done");
    setStep(null);
  };

  const connectSteam = async () => {
    const id = steamId.trim();
    if (!id) { setError("Enter your Steam ID64 to continue."); return; }
    setConnecting(true);
    setError("");
    try {
      const res = await fetch("/api/me/platform-accounts", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ provider: "steam", externalUserId: id }),
      });
      const json = await res.json();
      if (json.ok) {
        setStep("sync");
      } else {
        setError(json.error?.message ?? "Couldn't connect. Check your Steam ID64.");
      }
    } catch {
      setError("Network error. Please try again.");
    } finally {
      setConnecting(false);
    }
  };

  const syncSteam = async () => {
    setSyncing(true);
    setError("");
    const controller = new AbortController();
    const timeout = setTimeout(() => controller.abort(), 58_000);
    try {
      const res = await fetch("/api/integrations/steam/sync-execute", {
        method: "POST",
        signal: controller.signal,
      });
      clearTimeout(timeout);
      const json = await res.json();
      if (json.ok) setSyncSummary(json.data.summary);
    } catch (e) {
      clearTimeout(timeout);
      if (e.name !== "AbortError") setError("Sync issue — try again from Platform Hub.");
    } finally {
      setSyncing(false);
      setStep("done");
    }
  };

  if (!step) return null;

  const stepIndex = STEPS.indexOf(step === "connect-other" ? "connect" : step);

  return (
    <div style={{
      position: "fixed",
      inset: 0,
      zIndex: 2000,
      display: "flex",
      alignItems: "center",
      justifyContent: "center",
      background: "rgba(7,8,15,0.88)",
      backdropFilter: "blur(10px)",
      padding: 20,
      fontFamily: "'Outfit', sans-serif",
    }}>
      <div style={{
        width: "100%",
        maxWidth: 460,
        background: "#0D0F1A",
        border: "1px solid rgba(255,255,255,0.1)",
        borderRadius: 20,
        padding: "36px 36px 32px",
        position: "relative",
        boxShadow: "0 32px 80px rgba(0,0,0,0.6)",
      }}>
        {/* Step progress */}
        <div style={{ display: "flex", gap: 6, marginBottom: 28 }}>
          {STEPS.map((s, i) => (
            <div key={s} style={{
              flex: 1,
              height: 3,
              borderRadius: 99,
              background: i <= stepIndex ? "#C8FF00" : "rgba(255,255,255,0.1)",
              transition: "background 0.3s",
            }} />
          ))}
        </div>

        {/* Dismiss */}
        {step !== "done" && (
          <button
            onClick={dismiss}
            style={{
              position: "absolute", top: 20, right: 20,
              background: "none", border: "none",
              color: "rgba(241,243,249,0.25)", fontSize: 18,
              cursor: "pointer", padding: 4, lineHeight: 1,
            }}
          >
            ✕
          </button>
        )}

        {step === "welcome" && (
          <Welcome onNext={() => setStep("pick")} />
        )}
        {step === "pick" && (
          <Pick
            onPick={(p) => { setPicked(p); setStep(p.id === "steam" ? "connect" : "connect-other"); }}
            onSkip={dismiss}
          />
        )}
        {step === "connect" && (
          <ConnectSteam
            value={steamId}
            onChange={setSteamId}
            onConnect={connectSteam}
            connecting={connecting}
            error={error}
            onBack={() => setStep("pick")}
          />
        )}
        {step === "connect-other" && picked && (
          <ConnectOther
            platform={picked}
            onGoToHub={() => { dismiss(); router.push("/app/settings/platforms"); }}
            onBack={() => setStep("pick")}
          />
        )}
        {step === "sync" && (
          <Sync
            onSync={syncSteam}
            syncing={syncing}
            onSkip={() => setStep("done")}
          />
        )}
        {step === "done" && (
          <Done
            summary={syncSummary}
            onFinish={() => { dismiss(); router.push(syncSummary ? "/app/profile" : "/app/settings/platforms"); }}
            synced={!!syncSummary}
          />
        )}
      </div>
    </div>
  );
}

function Welcome({ onNext }) {
  return (
    <div>
      <div style={{ fontSize: 36, marginBottom: 16 }}>👾</div>
      <h2 style={{ fontSize: 22, fontWeight: 800, color: "#F1F3F9", letterSpacing: "-0.02em", marginBottom: 10 }}>
        Welcome to Leet9
      </h2>
      <p style={{ fontSize: 14, color: "rgba(241,243,249,0.5)", lineHeight: 1.6, marginBottom: 28 }}>
        Connect your gaming platforms and we&apos;ll build a unified view of your entire library — playtime, achievements, and stats across every platform.
      </p>
      <Btn onClick={onNext}>Get started →</Btn>
    </div>
  );
}

function Pick({ onPick, onSkip }) {
  return (
    <div>
      <h2 style={{ fontSize: 18, fontWeight: 800, color: "#F1F3F9", letterSpacing: "-0.02em", marginBottom: 6 }}>
        Where do you game?
      </h2>
      <p style={{ fontSize: 13, color: "rgba(241,243,249,0.4)", marginBottom: 20 }}>
        Pick your main platform to get started.
      </p>
      <div style={{ display: "flex", flexDirection: "column", gap: 8, marginBottom: 20 }}>
        {PLATFORMS.map((p) => (
          <button
            key={p.id}
            onClick={() => onPick(p)}
            style={{
              display: "flex",
              alignItems: "center",
              gap: 14,
              padding: "12px 14px",
              borderRadius: 12,
              border: "1px solid rgba(255,255,255,0.08)",
              background: "rgba(255,255,255,0.03)",
              cursor: "pointer",
              textAlign: "left",
              transition: "border-color 0.15s, background 0.15s",
            }}
            onMouseEnter={(e) => { e.currentTarget.style.borderColor = "rgba(200,255,0,0.3)"; e.currentTarget.style.background = "rgba(200,255,0,0.04)"; }}
            onMouseLeave={(e) => { e.currentTarget.style.borderColor = "rgba(255,255,255,0.08)"; e.currentTarget.style.background = "rgba(255,255,255,0.03)"; }}
          >
            <span style={{ fontSize: 22, width: 28, textAlign: "center" }}>{p.icon}</span>
            <div>
              <div style={{ fontSize: 14, fontWeight: 700, color: p.color }}>{p.label}</div>
              <div style={{ fontSize: 12, color: "rgba(241,243,249,0.35)" }}>{p.desc}</div>
            </div>
            <span style={{ marginLeft: "auto", color: "rgba(241,243,249,0.2)", fontSize: 16 }}>›</span>
          </button>
        ))}
      </div>
      <SecondaryBtn onClick={onSkip}>I&apos;ll set up later</SecondaryBtn>
    </div>
  );
}

function ConnectSteam({ value, onChange, onConnect, connecting, error, onBack }) {
  return (
    <div>
      <button onClick={onBack} style={{ background: "none", border: "none", color: "rgba(241,243,249,0.35)", fontSize: 12, cursor: "pointer", padding: 0, marginBottom: 16, display: "flex", alignItems: "center", gap: 4 }}>
        ← Back
      </button>
      <div style={{ fontSize: 28, marginBottom: 12 }}>🎮</div>
      <h2 style={{ fontSize: 18, fontWeight: 800, color: "#F1F3F9", letterSpacing: "-0.02em", marginBottom: 6 }}>
        Connect Steam
      </h2>
      <p style={{ fontSize: 13, color: "rgba(241,243,249,0.4)", lineHeight: 1.6, marginBottom: 20 }}>
        Enter your Steam ID64. Find it at{" "}
        <span style={{ color: "#b9d8f5" }}>steamid.io</span> or in your Steam profile URL.
      </p>
      <input
        type="text"
        placeholder="e.g. 76561198000000000"
        value={value}
        onChange={(e) => onChange(e.target.value)}
        onKeyDown={(e) => e.key === "Enter" && onConnect()}
        style={{
          width: "100%",
          padding: "11px 14px",
          borderRadius: 10,
          border: `1px solid ${error ? "rgba(255,80,80,0.4)" : "rgba(255,255,255,0.1)"}`,
          background: "rgba(255,255,255,0.04)",
          color: "#F1F3F9",
          fontFamily: "'Outfit', sans-serif",
          fontSize: 14,
          outline: "none",
          marginBottom: 8,
          boxSizing: "border-box",
        }}
      />
      {error && <p style={{ fontSize: 12, color: "#ff6b6b", marginBottom: 10 }}>{error}</p>}
      <Btn onClick={onConnect} disabled={connecting} style={{ marginTop: 8 }}>
        {connecting ? "Connecting…" : "Connect Steam →"}
      </Btn>
    </div>
  );
}

function ConnectOther({ platform, onGoToHub, onBack }) {
  return (
    <div>
      <button onClick={onBack} style={{ background: "none", border: "none", color: "rgba(241,243,249,0.35)", fontSize: 12, cursor: "pointer", padding: 0, marginBottom: 16, display: "flex", alignItems: "center", gap: 4 }}>
        ← Back
      </button>
      <div style={{ fontSize: 28, marginBottom: 12 }}>{platform.icon}</div>
      <h2 style={{ fontSize: 18, fontWeight: 800, color: "#F1F3F9", letterSpacing: "-0.02em", marginBottom: 6 }}>
        Connect {platform.label}
      </h2>
      <p style={{ fontSize: 13, color: "rgba(241,243,249,0.4)", lineHeight: 1.6, marginBottom: 24 }}>
        Set up your {platform.label} account from the Platform Hub — it takes under a minute.
      </p>
      <Btn onClick={onGoToHub}>Go to Platform Hub →</Btn>
    </div>
  );
}

function Sync({ onSync, syncing, onSkip }) {
  return (
    <div>
      <div style={{ fontSize: 28, marginBottom: 12 }}>🔄</div>
      <h2 style={{ fontSize: 18, fontWeight: 800, color: "#F1F3F9", letterSpacing: "-0.02em", marginBottom: 6 }}>
        Sync your library
      </h2>
      <p style={{ fontSize: 13, color: "rgba(241,243,249,0.4)", lineHeight: 1.6, marginBottom: 24 }}>
        We&apos;ll fetch your Steam games and match them to our catalogue. Large libraries can take up to a minute.
      </p>
      {syncing ? (
        <div style={{ display: "flex", alignItems: "center", gap: 10, padding: "14px 0" }}>
          <div style={{ width: 8, height: 8, borderRadius: "50%", background: "#C8FF00", animation: "pulse 1s ease infinite" }} />
          <span style={{ fontSize: 13, color: "rgba(241,243,249,0.5)" }}>Syncing your library…</span>
          <style>{`@keyframes pulse{0%,100%{opacity:1;}50%{opacity:0.2;}}`}</style>
        </div>
      ) : (
        <>
          <Btn onClick={onSync}>Sync now →</Btn>
          <SecondaryBtn onClick={onSkip} style={{ marginTop: 10 }}>Skip for now</SecondaryBtn>
        </>
      )}
    </div>
  );
}

function Done({ summary, onFinish, synced }) {
  return (
    <div>
      <div style={{ fontSize: 36, marginBottom: 16 }}>{synced ? "🎉" : "✅"}</div>
      <h2 style={{ fontSize: 18, fontWeight: 800, color: "#F1F3F9", letterSpacing: "-0.02em", marginBottom: 6 }}>
        {synced ? "You're all set!" : "Platform connected!"}
      </h2>
      {summary ? (
        <div style={{ display: "flex", gap: 16, margin: "16px 0 24px", flexWrap: "wrap" }}>
          <Kpi label="Games found" value={summary.rawGamesDetected} />
          <Kpi label="Matched" value={summary.matchedCanonicalGames} accent />
          <Kpi label="Added" value={summary.userGamesCreated} />
        </div>
      ) : (
        <p style={{ fontSize: 13, color: "rgba(241,243,249,0.4)", lineHeight: 1.6, marginBottom: 24 }}>
          {synced
            ? "Your library has been imported."
            : "You can sync your library anytime from Platform Hub."}
        </p>
      )}
      <Btn onClick={onFinish}>
        {synced ? "Go to my profile →" : "Go to Platform Hub →"}
      </Btn>
    </div>
  );
}

function Kpi({ label, value, accent }) {
  return (
    <div style={{ textAlign: "center", minWidth: 70 }}>
      <div style={{ fontSize: 24, fontWeight: 800, color: accent ? "#C8FF00" : "#F1F3F9", letterSpacing: "-0.02em" }}>
        {value?.toLocaleString() ?? "—"}
      </div>
      <div style={{ fontSize: 10, color: "rgba(241,243,249,0.35)", fontWeight: 600, letterSpacing: "0.05em", textTransform: "uppercase" }}>
        {label}
      </div>
    </div>
  );
}

function Btn({ onClick, children, disabled, style }) {
  return (
    <button
      onClick={onClick}
      disabled={disabled}
      style={{
        width: "100%",
        padding: "13px 20px",
        borderRadius: 12,
        border: "none",
        background: disabled ? "rgba(200,255,0,0.3)" : "#C8FF00",
        color: "#07080F",
        fontFamily: "'Outfit', sans-serif",
        fontSize: 14,
        fontWeight: 800,
        cursor: disabled ? "default" : "pointer",
        letterSpacing: "-0.01em",
        transition: "opacity 0.15s",
        ...style,
      }}
    >
      {children}
    </button>
  );
}

function SecondaryBtn({ onClick, children, style }) {
  return (
    <button
      onClick={onClick}
      style={{
        width: "100%",
        padding: "11px 20px",
        borderRadius: 12,
        border: "1px solid rgba(255,255,255,0.08)",
        background: "transparent",
        color: "rgba(241,243,249,0.4)",
        fontFamily: "'Outfit', sans-serif",
        fontSize: 13,
        fontWeight: 500,
        cursor: "pointer",
        letterSpacing: "-0.01em",
        transition: "border-color 0.15s",
        ...style,
      }}
    >
      {children}
    </button>
  );
}
