"use client";
import { useState, useEffect, useCallback } from "react";
import { SectionLabel } from "@/components/profile/sectionPrimitives";

// Real, authenticated Platform Sources surface (Phase 16 + Phase 17).
//
// Reads the current user's platform accounts from the database and lets them
// CONNECT (record from a safe public identifier) or DISCONNECT (soft-disconnect).
// For a connected Steam account it also exposes real Steam actions:
//   • Validate — checks the steamID64 against the Steam API (persona/visibility)
//   • Preview library sync — reads the library, saves NOTHING
//   • Run sync (execute) — saves detected games only (no Discovery/Profile/Stats impact)

const IDENTITY_HINT = {
  steam: { placeholder: "steamID64 — 17 digits", help: "Your public 64-bit Steam ID (e.g. 7656119…). No Steam sign-in yet." },
  psn: { placeholder: "PSN online ID", help: "Your public PSN online ID. Full PSN sync needs secure sign-in — coming later." },
};

const STATUS_STYLES = {
  connected: { color: "#C8FF00", dot: "#C8FF00" },
  disconnected: { color: "rgba(241,243,249,0.35)", dot: "rgba(241,243,249,0.25)" },
  needs_reauth: { color: "#fbbf24", dot: "#fbbf24" },
  unavailable: { color: "#f87171", dot: "#f87171" },
};

export function PlatformSources() {
  const [data, setData] = useState(null);
  const [loading, setLoading] = useState(true);
  const [errored, setErrored] = useState(false);
  const [inputs, setInputs] = useState({});
  const [busy, setBusy] = useState(null);
  const [notice, setNotice] = useState(null);

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
        <div style={noticeStyle("error")}>Couldn&apos;t load your platform accounts. Please refresh.</div>
      )}
      {notice && <div style={noticeStyle(notice.tone)}>{notice.text}</div>}

      <div style={{ display: "grid", gridTemplateColumns: "repeat(auto-fit, minmax(300px, 1fr))", gap: 12 }}>
        {(data?.providers ?? []).map((p) => (
          <PlatformCard
            key={p.id}
            provider={p}
            value={inputs[p.id] || ""}
            onChange={(v) => setInputs((s) => ({ ...s, [p.id]: v }))}
            onConnect={() => connect(p.id)}
            onDisconnect={() => disconnect(p.id)}
            onReload={load}
            busy={busy === p.id}
          />
        ))}
      </div>

      <div style={{ fontSize: 11, color: "rgba(241,243,249,0.3)", marginTop: 10, lineHeight: 1.6 }}>
        Leet9 is platform-agnostic: Steam and PSN both feed the same canonical catalogue. Connecting
        creates a <strong style={{ color: "rgba(241,243,249,0.45)" }}>connection record only</strong>. Steam
        library preview/sync is available below; <strong style={{ color: "rgba(241,243,249,0.45)" }}>synced games
        do not yet affect Discovery, Profile, Stats, or Rankings</strong>. Full PSN sign-in/sync requires secure
        credential handling and is not available yet.
      </div>
    </div>
  );
}

function PlatformCard({ provider, value, onChange, onConnect, onDisconnect, onReload, busy }) {
  const account = provider.account;
  const status = account?.status || "disconnected";
  const isConnected = status === "connected";
  const wasConnected = account && !isConnected;
  const s = STATUS_STYLES[status] || STATUS_STYLES.disconnected;
  const caps = provider.capabilities || {};
  const contributes = [
    caps.gameLibrary && "Game library",
    caps.achievements && "Achievements",
    caps.trophies && "Trophies",
    caps.playtime && "Playtime",
  ].filter(Boolean);
  const hint = IDENTITY_HINT[provider.id] || { placeholder: "Account identifier", help: "" };

  return (
    <div style={{ borderRadius: 12, border: "1px solid rgba(255,255,255,0.07)", background: "rgba(255,255,255,0.02)", padding: 16 }}>
      <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between", marginBottom: 10 }}>
        <span style={{ fontSize: 14, fontWeight: 800, color: "#F1F3F9", letterSpacing: "-0.01em" }}>{provider.label}</span>
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
            {account.lastSyncAt ? ` · Last sync ${new Date(account.lastSyncAt).toLocaleDateString()}` : " · Library sync not active yet"}
          </div>

          {provider.id === "steam" && <SteamSyncActions onReload={onReload} />}

          <button onClick={onDisconnect} disabled={busy} style={{
            marginTop: 12, fontSize: 11, fontWeight: 700, padding: "6px 12px", borderRadius: 8,
            border: "1px solid rgba(248,113,113,0.25)", background: "rgba(248,113,113,0.05)",
            color: "#f87171", cursor: busy ? "wait" : "pointer", fontFamily: "'Outfit', sans-serif",
          }}>
            {busy ? "Disconnecting…" : "Disconnect"}
          </button>
        </div>
      ) : (
        <div style={{ paddingTop: 10, borderTop: "1px solid rgba(255,255,255,0.06)" }}>
          {wasConnected && (
            <div style={{ fontSize: 10, color: "rgba(241,243,249,0.35)", marginBottom: 8 }}>Previously connected — reconnect below.</div>
          )}
          <input value={value} onChange={(e) => onChange(e.target.value)} placeholder={hint.placeholder} style={{
            width: "100%", boxSizing: "border-box", padding: "8px 10px", borderRadius: 8,
            border: "1px solid rgba(255,255,255,0.1)", background: "rgba(0,0,0,0.25)",
            color: "#F1F3F9", fontSize: 12, fontFamily: "'Outfit', sans-serif", marginBottom: 6,
          }} />
          <div style={{ fontSize: 10, color: "rgba(241,243,249,0.3)", lineHeight: 1.5, marginBottom: 10 }}>{hint.help}</div>
          <button onClick={onConnect} disabled={busy} style={{
            fontSize: 11, fontWeight: 700, padding: "6px 14px", borderRadius: 8, border: "none",
            background: busy ? "rgba(200,255,0,0.4)" : "#C8FF00", color: "#07080F",
            cursor: busy ? "wait" : "pointer", fontFamily: "'Outfit', sans-serif",
          }}>
            {busy ? "Connecting…" : `Connect ${provider.label}`}
          </button>
        </div>
      )}
    </div>
  );
}

// Steam-specific real actions (Phase 17): validate, preview, execute.
function SteamSyncActions({ onReload }) {
  const [busy, setBusy] = useState(null);
  const [result, setResult] = useState(null);
  const [error, setError] = useState(null);

  async function run(action, url, body, onOk) {
    setBusy(action);
    setError(null);
    setResult(null);
    try {
      const res = await fetch(url, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(body || {}),
      });
      const json = await res.json();
      if (json.ok) {
        onOk(json.data);
        if (action !== "preview") await onReload?.();
      } else if (json.error?.code === "STEAM_NOT_CONFIGURED") {
        setError("Steam sync isn't configured on the server yet (admin: set STEAM_API_KEY).");
      } else {
        setError(json.error?.message || "Steam request failed.");
      }
    } catch {
      setError("Network error. Please try again.");
    }
    setBusy(null);
  }

  return (
    <div style={{ padding: "10px 0 2px" }}>
      <div style={{ display: "flex", flexWrap: "wrap", gap: 6, marginBottom: 8 }}>
        <SteamBtn label="Validate" busyLabel="Validating…" active={busy === "validate"} disabled={!!busy}
          onClick={() => run("validate", "/api/integrations/steam/validate", null, (d) => setResult({ kind: "validate", ...d.validation, message: d.message }))} />
        <SteamBtn label="Preview library" busyLabel="Reading…" active={busy === "preview"} disabled={!!busy}
          onClick={() => run("preview", "/api/integrations/steam/sync-preview", { mode: "preview" }, (d) => setResult({ kind: "preview", ...d }))} />
        <SteamBtn label="Run sync" busyLabel="Syncing…" active={busy === "execute"} disabled={!!busy} accent
          onClick={() => run("execute", "/api/integrations/steam/sync-preview", { mode: "execute" }, (d) => setResult({ kind: "execute", ...d }))} />
      </div>

      {error && <div style={{ fontSize: 10, color: "#f87171", marginBottom: 6 }}>{error}</div>}
      {result && <SteamResult result={result} />}

      <div style={{ fontSize: 10, color: "rgba(241,243,249,0.28)", lineHeight: 1.5 }}>
        Preview reads your library and saves nothing. Run sync saves detected games only — they don&apos;t
        yet affect Discovery, Profile, Stats, or Rankings.
      </div>
    </div>
  );
}

function SteamResult({ result }) {
  if (result.kind === "validate") {
    return (
      <div style={resultStyle()}>
        ✓ {result.message} {result.personaName ? `(${result.personaName}, ${result.visibility})` : ""}
      </div>
    );
  }
  if (result.kind === "preview") {
    return (
      <div style={resultStyle()}>
        Preview: {result.summary?.normalizedTotal ?? 0} games found (nothing saved).
        {result.sample?.length ? ` e.g. ${result.sample.slice(0, 3).map((g) => g.externalTitle).join(", ")}` : ""}
      </div>
    );
  }
  if (result.kind === "execute") {
    return (
      <div style={resultStyle()}>
        ✓ Sync complete: {result.summary?.detectedGamesWritten ?? 0} detected games saved (unmatched).
      </div>
    );
  }
  return null;
}

function SteamBtn({ label, busyLabel, active, disabled, accent, onClick }) {
  return (
    <button onClick={onClick} disabled={disabled} style={{
      fontSize: 10, fontWeight: 700, padding: "5px 10px", borderRadius: 7,
      border: `1px solid ${accent ? "rgba(200,255,0,0.35)" : "rgba(185,216,245,0.25)"}`,
      background: accent ? "rgba(200,255,0,0.08)" : "rgba(185,216,245,0.05)",
      color: accent ? "#C8FF00" : "#b9d8f5",
      cursor: disabled ? "wait" : "pointer", fontFamily: "'Outfit', sans-serif",
    }}>
      {active ? busyLabel : label}
    </button>
  );
}

function resultStyle() {
  return {
    fontSize: 10, color: "rgba(241,243,249,0.6)", marginBottom: 8, padding: "6px 8px",
    borderRadius: 6, background: "rgba(200,255,0,0.04)", border: "1px solid rgba(200,255,0,0.12)",
  };
}

function noticeStyle(tone) {
  const ok = tone === "success";
  return {
    fontSize: 12, marginBottom: 12, padding: "8px 12px", borderRadius: 8,
    color: ok ? "#C8FF00" : "#f87171",
    border: `1px solid ${ok ? "rgba(200,255,0,0.25)" : "rgba(248,113,113,0.25)"}`,
    background: ok ? "rgba(200,255,0,0.05)" : "rgba(248,113,113,0.05)",
  };
}

function LoadingState() {
  return (
    <div style={{ marginBottom: 28 }}>
      <SectionLabel>Platform Sources</SectionLabel>
      <div style={{ display: "grid", gridTemplateColumns: "repeat(auto-fit, minmax(300px, 1fr))", gap: 12 }}>
        {Array.from({ length: 2 }).map((_, i) => (
          <div key={i} style={{ height: 160, borderRadius: 12, background: "rgba(255,255,255,0.03)", animation: "pulse 1.4s ease infinite", animationDelay: `${i * 0.1}s` }} />
        ))}
      </div>
      <style>{`@keyframes pulse { 0%,100%{opacity:1;} 50%{opacity:0.5;} }`}</style>
    </div>
  );
}
