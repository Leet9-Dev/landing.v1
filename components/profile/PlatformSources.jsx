"use client";
import { useState, useEffect, useCallback } from "react";
import { useSearchParams, useRouter } from "next/navigation";
import { SectionLabel } from "@/components/profile/sectionPrimitives";

// Real, authenticated Platform Sources surface (Phase 16).
//
// Reads the current user's platform accounts from the database and lets them
// CONNECT (create a record from a safe public identifier) or DISCONNECT
// (soft-disconnect). It does NOT perform any Steam/PSN API auth or library sync —
// the copy is deliberately honest about that.

const IDENTITY_HINT = {
  steam: { placeholder: "steamID64 — 17 digits", help: "Your public 64-bit Steam ID (e.g. 7656119…). No Steam sign-in yet." },
  psn: { placeholder: "PSN online ID", help: "Your public PSN online ID. Full PSN sync needs secure sign-in — coming later." },
};

const DISCORD_SVG = (
  <svg width="16" height="12" viewBox="0 0 71 55" fill="none" xmlns="http://www.w3.org/2000/svg" style={{ flexShrink: 0 }}>
    <path d="M60.1045 4.8978C55.5792 2.8214 50.7265 1.2916 45.6527 0.41542C45.5603 0.39851 45.468 0.440769 45.4204 0.525289C44.7963 1.6353 44.105 3.0834 43.6209 4.2216C38.1637 3.4046 32.7345 3.4046 27.3892 4.2216C26.905 3.0581 26.1886 1.6353 25.5617 0.525289C25.5141 0.443589 25.4218 0.40133 25.3294 0.41542C20.2584 1.2888 15.4057 2.8186 10.8776 4.8978C10.8384 4.9147 10.8048 4.9429 10.7825 4.9795C1.57795 18.7309 -0.943561 32.1443 0.293408 45.3914C0.299005 45.4562 0.335386 45.5182 0.385761 45.5576C6.45866 50.0174 12.3413 52.7249 18.1147 54.5195C18.2071 54.5477 18.305 54.5139 18.3638 54.4378C19.7295 52.5728 20.9469 50.6063 21.9907 48.5383C22.0523 48.4172 21.9935 48.2735 21.8676 48.2256C19.9366 47.4931 18.0979 46.6 16.3292 45.5858C16.1893 45.5041 16.1781 45.304 16.3068 45.2082C16.679 44.9293 17.0513 44.6391 17.4067 44.3461C17.471 44.2926 17.5606 44.2813 17.6362 44.3151C29.2558 49.6202 41.8354 49.6202 53.3179 44.3151C53.3935 44.2785 53.4831 44.2898 53.5502 44.3433C53.9057 44.6363 54.2779 44.9293 54.6529 45.2082C54.7816 45.304 54.7732 45.5041 54.6333 45.5858C52.8646 46.6197 51.0259 47.4931 49.0921 48.2228C48.9662 48.2707 48.9102 48.4172 48.9718 48.5383C50.038 50.6034 51.2554 52.5699 52.5959 54.435C52.6519 54.5139 52.7526 54.5477 52.845 54.5195C58.6464 52.7249 64.529 50.0174 70.6019 45.5576C70.6551 45.5182 70.6887 45.459 70.6943 45.3942C72.1747 30.0791 68.2147 16.7757 60.1968 4.9823C60.1772 4.9429 60.1437 4.9147 60.1045 4.8978ZM23.7259 37.3253C20.2276 37.3253 17.3451 34.1136 17.3451 30.1693C17.3451 26.225 20.1717 23.0133 23.7259 23.0133C27.308 23.0133 30.1626 26.2532 30.1066 30.1693C30.1066 34.1136 27.28 37.3253 23.7259 37.3253ZM47.3178 37.3253C43.8196 37.3253 40.9371 34.1136 40.9371 30.1693C40.9371 26.225 43.7636 23.0133 47.3178 23.0133C50.9 23.0133 53.7545 26.2532 53.6986 30.1693C53.6986 34.1136 50.9 37.3253 47.3178 37.3253Z" fill="currentColor"/>
  </svg>
);

const STATUS_STYLES = {
  connected: { color: "#C8FF00", dot: "#C8FF00" },
  disconnected: { color: "rgba(241,243,249,0.35)", dot: "rgba(241,243,249,0.25)" },
  needs_reauth: { color: "#fbbf24", dot: "#fbbf24" },
  unavailable: { color: "#f87171", dot: "#f87171" },
};

const DISCORD_ERROR_MESSAGES = {
  cancelled: "Discord authorization was cancelled.",
  invalid_state: "Discord connection failed: security mismatch. Please try again.",
  no_code: "Discord did not return an authorization code. Please try again.",
  not_configured: "Discord integration is not configured on this server.",
  token_exchange_failed: "Could not complete Discord authorization. Please try again.",
  profile_fetch_failed: "Could not fetch your Discord profile. Please try again.",
};

export function PlatformSources() {
  const [data, setData] = useState(null);
  const [loading, setLoading] = useState(true);
  const [errored, setErrored] = useState(false);
  const [inputs, setInputs] = useState({});
  const [busy, setBusy] = useState(null);
  const [notice, setNotice] = useState(null);
  const searchParams = useSearchParams();
  const router = useRouter();

  useEffect(() => {
    const connected = searchParams.get("discord_connected");
    const error = searchParams.get("discord_error");
    if (connected === "1") {
      setNotice({ tone: "success", text: "Discord connected successfully!" });
      router.replace(window.location.pathname, { scroll: false });
    } else if (error) {
      const base = DISCORD_ERROR_MESSAGES[error] || "Discord connection failed. Please try again.";
      setNotice({ tone: "error", text: base });
      router.replace(window.location.pathname, { scroll: false });
    }
  }, [searchParams, router]);

  const load = useCallback(async () => {
    setLoading(true);
    try {
      const res = await fetch("/api/me/platform-accounts");
      const json = await res.json();
      if (json.ok) {
        setData(json.data);
        setErrored(false);
      } else {
        setErrored(true);
      }
    } catch {
      setErrored(true);
    }
    setLoading(false);
  }, []);

  useEffect(() => {
    const t = setTimeout(load, 0);
    return () => clearTimeout(t);
  }, [load]);

  async function connect(provider) {
    const identifier = (inputs[provider] || "").trim();
    if (!identifier) {
      setNotice({ tone: "error", text: "Enter your account identifier first." });
      return;
    }
    setBusy(provider);
    setNotice(null);
    try {
      const res = await fetch("/api/me/platform-accounts", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ provider, identifier }),
      });
      const json = await res.json();
      if (json.ok) {
        setNotice({ tone: "success", text: json.data.message });
        setInputs((s) => ({ ...s, [provider]: "" }));
        await load();
      } else {
        setNotice({ tone: "error", text: json.error?.message || "Could not connect." });
      }
    } catch {
      setNotice({ tone: "error", text: "Network error. Please try again." });
    }
    setBusy(null);
  }

  async function disconnect(provider) {
    setBusy(provider);
    setNotice(null);
    try {
      const res = await fetch("/api/me/platform-accounts", {
        method: "DELETE",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ provider }),
      });
      const json = await res.json();
      if (json.ok) {
        setNotice({ tone: "success", text: json.data.message });
        await load();
      } else {
        setNotice({ tone: "error", text: json.error?.message || "Could not disconnect." });
      }
    } catch {
      setNotice({ tone: "error", text: "Network error. Please try again." });
    }
    setBusy(null);
  }

  if (loading && !data) return <LoadingState />;

  return (
    <div style={{ marginBottom: 28 }}>
      <SectionLabel>Platform Sources</SectionLabel>

      {errored && (
        <div style={{
          fontSize: 12, color: "#f87171", marginBottom: 12, padding: "8px 12px",
          borderRadius: 8, border: "1px solid rgba(248,113,113,0.25)", background: "rgba(248,113,113,0.05)",
        }}>
          Couldn&apos;t load your platform accounts. Please refresh.
        </div>
      )}

      {notice && (
        <div style={{
          fontSize: 12, marginBottom: 12, padding: "8px 12px", borderRadius: 8,
          color: notice.tone === "success" ? "#C8FF00" : "#f87171",
          border: `1px solid ${notice.tone === "success" ? "rgba(200,255,0,0.25)" : "rgba(248,113,113,0.25)"}`,
          background: notice.tone === "success" ? "rgba(200,255,0,0.05)" : "rgba(248,113,113,0.05)",
        }}>
          {notice.text}
        </div>
      )}

      <div style={{ display: "grid", gridTemplateColumns: "repeat(auto-fit, minmax(280px, 1fr))", gap: 12 }}>
        {(data?.providers ?? []).map((p) => (
          <PlatformCard
            key={p.id}
            provider={p}
            value={inputs[p.id] || ""}
            onChange={(v) => setInputs((s) => ({ ...s, [p.id]: v }))}
            onConnect={() => connect(p.id)}
            onDisconnect={() => disconnect(p.id)}
            busy={busy === p.id}
          />
        ))}
      </div>

      <div style={{ fontSize: 11, color: "rgba(241,243,249,0.3)", marginTop: 10, lineHeight: 1.6 }}>
        Leet9 is platform-agnostic: Steam and PSN both feed the same canonical catalogue. Connecting
        creates a <strong style={{ color: "rgba(241,243,249,0.45)" }}>connection record only</strong> — real
        game-library sync is coming in the next phase, and full PSN sign-in requires secure credential handling.
      </div>
    </div>
  );
}

function PlatformCard({ provider, value, onChange, onConnect, onDisconnect, busy }) {
  const account = provider.account;
  const status = account?.status || "disconnected";
  const isConnected = status === "connected";
  const wasConnected = account && !isConnected;
  const s = STATUS_STYLES[status] || STATUS_STYLES.disconnected;
  const caps = provider.capabilities || {};
  const isDiscord = provider.id === "discord";
  const contributes = [
    caps.gameLibrary && "Game library",
    caps.achievements && "Achievements",
    caps.trophies && "Trophies",
    caps.playtime && "Playtime",
    caps.presence && "Presence",
  ].filter(Boolean);
  const hint = IDENTITY_HINT[provider.id] || { placeholder: "Account identifier", help: "" };

  return (
    <div style={{
      borderRadius: 12, border: "1px solid rgba(255,255,255,0.07)",
      background: "rgba(255,255,255,0.02)", padding: 16,
    }}>
      <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between", marginBottom: 10 }}>
        <span style={{ fontSize: 14, fontWeight: 800, color: "#F1F3F9", letterSpacing: "-0.01em" }}>
          {provider.label}
        </span>
        <span style={{ display: "flex", alignItems: "center", gap: 6, fontSize: 11, fontWeight: 700, color: s.color }}>
          <span style={{ width: 7, height: 7, borderRadius: "50%", background: s.dot }} />
          {account?.statusLabel || "Not connected"}
        </span>
      </div>

      {contributes.length > 0 && (
        <div style={{ display: "flex", flexWrap: "wrap", gap: 5, marginBottom: 12 }}>
          {contributes.map((c) => (
            <span key={c} style={{
              fontSize: 9, fontWeight: 700, letterSpacing: "0.04em", padding: "2px 7px",
              borderRadius: 5, background: "rgba(255,255,255,0.04)", color: "rgba(241,243,249,0.45)",
            }}>{c}</span>
          ))}
        </div>
      )}

      {isConnected ? (
        <div style={{ paddingTop: 10, borderTop: "1px solid rgba(255,255,255,0.06)" }}>
          <div style={{ fontSize: 11, color: "rgba(241,243,249,0.5)", marginBottom: 2 }}>
            {account.username || account.externalUserId}
          </div>
          <div style={{ fontSize: 10, color: "rgba(241,243,249,0.3)", marginBottom: 10 }}>
            Connected {account.connectedAt ? new Date(account.connectedAt).toLocaleDateString() : ""}
            {isDiscord ? " · Presence" : " · Library sync not active yet"}
          </div>
          <button
            onClick={onDisconnect}
            disabled={busy}
            style={{
              fontSize: 11, fontWeight: 700, padding: "6px 12px", borderRadius: 8,
              border: "1px solid rgba(248,113,113,0.25)", background: "rgba(248,113,113,0.05)",
              color: "#f87171", cursor: busy ? "wait" : "pointer", fontFamily: "'Outfit', sans-serif",
            }}
          >
            {busy ? "Disconnecting…" : "Disconnect"}
          </button>
        </div>
      ) : (
        <div style={{ paddingTop: 10, borderTop: "1px solid rgba(255,255,255,0.06)" }}>
          {wasConnected && (
            <div style={{ fontSize: 10, color: "rgba(241,243,249,0.35)", marginBottom: 8 }}>
              Previously connected — reconnect below.
            </div>
          )}
          {isDiscord ? (
            <a
              href="/api/integrations/discord/connect?return_to=/app/profile"
              style={{
                display: "inline-flex", alignItems: "center", gap: 8,
                fontSize: 11, fontWeight: 700, padding: "7px 14px", borderRadius: 8,
                background: "#5865F2", color: "#fff", textDecoration: "none",
                fontFamily: "'Outfit', sans-serif",
              }}
            >
              {DISCORD_SVG}
              Connect with Discord
            </a>
          ) : (
            <>
              <input
                value={value}
                onChange={(e) => onChange(e.target.value)}
                placeholder={hint.placeholder}
                style={{
                  width: "100%", boxSizing: "border-box", padding: "8px 10px", borderRadius: 8,
                  border: "1px solid rgba(255,255,255,0.1)", background: "rgba(0,0,0,0.25)",
                  color: "#F1F3F9", fontSize: 12, fontFamily: "'Outfit', sans-serif", marginBottom: 6,
                }}
              />
              <div style={{ fontSize: 10, color: "rgba(241,243,249,0.3)", lineHeight: 1.5, marginBottom: 10 }}>
                {hint.help}
              </div>
              <button
                onClick={onConnect}
                disabled={busy}
                style={{
                  fontSize: 11, fontWeight: 700, padding: "6px 14px", borderRadius: 8, border: "none",
                  background: busy ? "rgba(200,255,0,0.4)" : "#C8FF00", color: "#07080F",
                  cursor: busy ? "wait" : "pointer", fontFamily: "'Outfit', sans-serif",
                }}
              >
                {busy ? "Connecting…" : `Connect ${provider.label}`}
              </button>
            </>
          )}
        </div>
      )}
    </div>
  );
}

function LoadingState() {
  return (
    <div style={{ marginBottom: 28 }}>
      <SectionLabel>Platform Sources</SectionLabel>
      <div style={{ display: "grid", gridTemplateColumns: "repeat(auto-fit, minmax(280px, 1fr))", gap: 12 }}>
        {Array.from({ length: 2 }).map((_, i) => (
          <div key={i} style={{
            height: 150, borderRadius: 12, background: "rgba(255,255,255,0.03)",
            animation: "pulse 1.4s ease infinite", animationDelay: `${i * 0.1}s`,
          }} />
        ))}
      </div>
      <style>{`@keyframes pulse { 0%,100%{opacity:1;} 50%{opacity:0.5;} }`}</style>
    </div>
  );
}
