"use client";
import { useState, useEffect, useCallback } from "react";
import { COMING_SOON_PLATFORMS } from "@/lib/platforms/platforms";

const IDENTITY_HINT = {
  steam: {
    placeholder: "steamID64 — 17 digits (e.g. 76561197960287930)",
    help: "Find it at steamid.io or in your Steam profile URL.",
  },
  psn: {
    placeholder: "NPSSO token",
    help: (
      <span>
        Log into PlayStation on a browser, then visit{" "}
        <a
          href="https://ca.account.sony.com/api/v1/ssocookie"
          target="_blank"
          rel="noopener noreferrer"
          style={{ color: "#c8aaff", textDecoration: "underline" }}
        >
          ca.account.sony.com/api/v1/ssocookie
        </a>
        {" "}and copy the <code style={{ fontSize: 10, background: "rgba(255,255,255,0.06)", padding: "1px 4px", borderRadius: 3 }}>npsso</code> value.
      </span>
    ),
  },
  xbox: {
    placeholder: "Xbox Gamertag (e.g. ShadowViper99)",
    help: "Your public Xbox Gamertag — find it in your Xbox profile or Xbox app.",
  },
  riot: {
    placeholder: "Riot ID (e.g. Player#EUW)",
    help: "Your Riot ID in GameName#TAG format — find it at account.riotgames.com.",
  },
  battlenet: {
    placeholder: "BattleTag (e.g. Player#1234)",
    help: "Your Battle.net BattleTag — find it in your Battle.net account settings.",
  },
  epic: {
    placeholder: "Epic username (e.g. ShadowViper99)",
    help: "Your public Epic Games display name — find it at epicgames.com/account.",
  },
};

const SYNC_STATUS_LABEL = {
  idle: "Never synced",
  syncing: "Syncing…",
  success: "Synced",
  failed: "Sync failed",
  partial: "Partially synced",
};

const SYNC_STATUS_COLOR = {
  idle: "rgba(241,243,249,0.3)",
  syncing: "#fbbf24",
  success: "#C8FF00",
  failed: "#f87171",
  partial: "#fbbf24",
};

export function PlatformHub() {
  const [data, setData] = useState(null);
  const [loading, setLoading] = useState(true);
  const [errored, setErrored] = useState(false);
  const [inputs, setInputs] = useState({});
  const [busy, setBusy] = useState(null);
  const [syncing, setSyncing] = useState(null);
  const [notice, setNotice] = useState(null);

  const load = useCallback(async () => {
    setLoading(true);
    try {
      const res = await fetch("/api/me/platform-accounts");
      const json = await res.json();
      if (json.ok) { setData(json.data); setErrored(false); }
      else setErrored(true);
    } catch { setErrored(true); }
    setLoading(false);
  }, []);

  useEffect(() => { load(); }, [load]);

  async function connect(provider) {
    const identifier = (inputs[provider] || "").trim();
    if (!identifier) { setNotice({ tone: "error", text: "Enter your account identifier first." }); return; }
    setBusy(provider);
    setNotice(null);
    // For PSN, the identifier field collects the NPSSO token, not the Online ID.
    const body = provider === "psn"
      ? { provider, npsso: identifier }
      : { provider, identifier };
    try {
      const res = await fetch("/api/me/platform-accounts", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(body),
      });
      const json = await res.json();
      if (json.ok) {
        setNotice({ tone: "success", text: json.data.message });
        setInputs((s) => ({ ...s, [provider]: "" }));
        await load();
      } else {
        setNotice({ tone: "error", text: json.error?.message || "Could not connect." });
      }
    } catch { setNotice({ tone: "error", text: "Network error. Please try again." }); }
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
      if (json.ok) { setNotice({ tone: "success", text: json.data.message }); await load(); }
      else setNotice({ tone: "error", text: json.error?.message || "Could not disconnect." });
    } catch { setNotice({ tone: "error", text: "Network error. Please try again." }); }
    setBusy(null);
  }

  async function syncNow(provider) {
    setSyncing(provider);
    setNotice(null);
    try {
      const res = await fetch(`/api/integrations/${provider}/sync-execute`, { method: "POST" });
      const json = await res.json();
      if (json.ok) {
        const s = json.data.summary;
        setNotice({ tone: "success", text: `Sync complete — ${s.rawGamesDetected} games detected, ${s.matchedCanonicalGames} matched.` });
        await load();
      } else {
        setNotice({ tone: "error", text: json.error?.message || "Sync failed. Try again." });
      }
    } catch { setNotice({ tone: "error", text: "Network error during sync." }); }
    setSyncing(null);
  }

  if (loading && !data) return <LoadingSkeleton />;

  const activeProviders = data?.providers ?? [];

  return (
    <div>
      {notice && (
        <div style={{
          fontSize: 13, marginBottom: 20, padding: "10px 14px", borderRadius: 10,
          color: notice.tone === "success" ? "#C8FF00" : "#f87171",
          border: `1px solid ${notice.tone === "success" ? "rgba(200,255,0,0.25)" : "rgba(248,113,113,0.25)"}`,
          background: notice.tone === "success" ? "rgba(200,255,0,0.05)" : "rgba(248,113,113,0.05)",
        }}>
          {notice.text}
        </div>
      )}

      {errored && (
        <div style={{
          fontSize: 13, marginBottom: 20, padding: "10px 14px", borderRadius: 10,
          color: "#f87171", border: "1px solid rgba(248,113,113,0.25)", background: "rgba(248,113,113,0.05)",
        }}>
          Couldn&apos;t load your platform accounts. Please refresh.
        </div>
      )}

      <div style={{
        display: "grid",
        gridTemplateColumns: "repeat(auto-fill, minmax(300px, 1fr))",
        gap: 16,
      }}>
        {activeProviders.map((p) => (
          <ActivePlatformCard
            key={p.id}
            provider={p}
            value={inputs[p.id] || ""}
            onChange={(v) => setInputs((s) => ({ ...s, [p.id]: v }))}
            onConnect={() => connect(p.id)}
            onDisconnect={() => disconnect(p.id)}
            onSync={() => syncNow(p.id)}
            busy={busy === p.id}
            syncing={syncing === p.id}
          />
        ))}

        {COMING_SOON_PLATFORMS.map((p) => (
          <ComingSoonCard key={p.id} platform={p} />
        ))}
      </div>

      <div style={{ marginTop: 24, fontSize: 11, color: "rgba(241,243,249,0.25)", lineHeight: 1.7 }}>
        Leet9 is platform-agnostic — Steam, PSN, Xbox and all future platforms feed the same unified game catalogue.
        Connecting your accounts never stores passwords or session tokens.
      </div>
    </div>
  );
}

function ActivePlatformCard({ provider, value, onChange, onConnect, onDisconnect, onSync, busy, syncing }) {
  const account = provider.account;
  const isConnected = account?.status === "connected";
  const wasConnected = account && !isConnected;
  const syncStatus = account?.syncStatus || "idle";
  const hasSyncSupport = provider.capabilities?.gameLibrary;
  const hint = IDENTITY_HINT[provider.id] || { placeholder: "Account identifier", help: "" };

  return (
    <div style={{
      borderRadius: 14,
      border: `1px solid ${isConnected ? `${provider.accentColor}22` : "rgba(255,255,255,0.07)"}`,
      background: "#0A0C14",
      overflow: "hidden",
    }}>
      {/* Header bar */}
      <div style={{
        padding: "14px 18px",
        background: isConnected ? `linear-gradient(135deg, ${provider.accentColor}12 0%, transparent 100%)` : "rgba(255,255,255,0.02)",
        borderBottom: "1px solid rgba(255,255,255,0.06)",
        display: "flex",
        alignItems: "center",
        justifyContent: "space-between",
      }}>
        <div style={{ display: "flex", alignItems: "center", gap: 10 }}>
          <span style={{
            fontSize: 9, fontWeight: 800, letterSpacing: "0.1em",
            padding: "3px 8px", borderRadius: 5,
            background: `${provider.accentColor}20`,
            color: provider.accentColor,
            border: `1px solid ${provider.accentColor}30`,
          }}>
            {provider.badgeLabel}
          </span>
          <span style={{ fontSize: 15, fontWeight: 800, color: "#F1F3F9", letterSpacing: "-0.01em" }}>
            {provider.label}
          </span>
        </div>

        <div style={{ display: "flex", alignItems: "center", gap: 6 }}>
          <span style={{
            width: 7, height: 7, borderRadius: "50%",
            background: isConnected ? "#C8FF00" : "rgba(241,243,249,0.2)",
            display: "inline-block",
          }} />
          <span style={{ fontSize: 11, fontWeight: 700, color: isConnected ? "#C8FF00" : "rgba(241,243,249,0.35)" }}>
            {isConnected ? "Connected" : "Not connected"}
          </span>
        </div>
      </div>

      {/* Body */}
      <div style={{ padding: "16px 18px" }}>
        {isConnected ? (
          <ConnectedState
            account={account}
            syncStatus={syncStatus}
            hasSyncSupport={hasSyncSupport}
            onSync={onSync}
            onDisconnect={onDisconnect}
            busy={busy}
            syncing={syncing}
          />
        ) : (
          <ConnectForm
            hint={hint}
            value={value}
            onChange={onChange}
            onConnect={onConnect}
            busy={busy}
            wasConnected={wasConnected}
            label={provider.label}
            accentColor={provider.accentColor}
          />
        )}
      </div>
    </div>
  );
}

function ConnectedState({ account, syncStatus, hasSyncSupport, onSync, onDisconnect, busy, syncing }) {
  return (
    <div>
      <div style={{ marginBottom: 14 }}>
        <div style={{ fontSize: 13, fontWeight: 700, color: "#F1F3F9", marginBottom: 3 }}>
          {account.displayName || account.username || account.externalUserId}
        </div>
        <div style={{ fontSize: 11, color: "rgba(241,243,249,0.35)" }}>
          Connected {account.connectedAt ? new Date(account.connectedAt).toLocaleDateString() : ""}
        </div>
      </div>

      {hasSyncSupport && (
        <div style={{
          display: "flex", alignItems: "center", justifyContent: "space-between",
          padding: "8px 12px", borderRadius: 8,
          background: "rgba(255,255,255,0.03)",
          border: "1px solid rgba(255,255,255,0.06)",
          marginBottom: 14,
        }}>
          <div>
            <div style={{ fontSize: 10, fontWeight: 700, color: "rgba(241,243,249,0.4)", letterSpacing: "0.06em", textTransform: "uppercase", marginBottom: 2 }}>
              Library sync
            </div>
            <div style={{ fontSize: 12, fontWeight: 600, color: SYNC_STATUS_COLOR[syncStatus] || "rgba(241,243,249,0.4)" }}>
              {syncing ? "Syncing…" : SYNC_STATUS_LABEL[syncStatus] || "Never synced"}
              {account.lastSyncAt && !syncing && (
                <span style={{ color: "rgba(241,243,249,0.3)", fontWeight: 400 }}>
                  {" · "}{new Date(account.lastSyncAt).toLocaleDateString()}
                </span>
              )}
            </div>
          </div>
          <button
            onClick={onSync}
            disabled={busy || syncing}
            style={{
              fontSize: 11, fontWeight: 700, padding: "6px 14px", borderRadius: 7,
              border: "none",
              background: busy || syncing ? "rgba(200,255,0,0.3)" : "#C8FF00",
              color: "#07080F",
              cursor: busy || syncing ? "wait" : "pointer",
              fontFamily: "'Outfit', sans-serif",
              whiteSpace: "nowrap",
            }}
          >
            {syncing ? "Syncing…" : "Sync Now"}
          </button>
        </div>
      )}

      <button
        onClick={onDisconnect}
        disabled={busy || syncing}
        style={{
          fontSize: 11, fontWeight: 700, padding: "7px 14px", borderRadius: 8,
          border: "1px solid rgba(248,113,113,0.25)", background: "rgba(248,113,113,0.05)",
          color: "#f87171", cursor: busy || syncing ? "wait" : "pointer",
          fontFamily: "'Outfit', sans-serif",
        }}
      >
        {busy ? "Disconnecting…" : "Disconnect"}
      </button>
    </div>
  );
}

function ConnectForm({ hint, value, onChange, onConnect, busy, wasConnected, label, accentColor }) {
  return (
    <div>
      {wasConnected && (
        <div style={{ fontSize: 11, color: "rgba(241,243,249,0.35)", marginBottom: 10 }}>
          Previously connected — reconnect below.
        </div>
      )}
      <input
        value={value}
        onChange={(e) => onChange(e.target.value)}
        placeholder={hint.placeholder}
        onKeyDown={(e) => e.key === "Enter" && onConnect()}
        style={{
          width: "100%", boxSizing: "border-box",
          padding: "9px 12px", borderRadius: 8, marginBottom: 6,
          border: "1px solid rgba(255,255,255,0.1)", background: "rgba(0,0,0,0.3)",
          color: "#F1F3F9", fontSize: 12, fontFamily: "'Outfit', sans-serif", outline: "none",
        }}
      />
      <div style={{ fontSize: 11, color: "rgba(241,243,249,0.3)", lineHeight: 1.5, marginBottom: 12, fontFamily: "'Outfit', sans-serif" }}>
        {hint.help}
      </div>
      <button
        onClick={onConnect}
        disabled={busy}
        style={{
          fontSize: 12, fontWeight: 700, padding: "8px 18px", borderRadius: 8, border: "none",
          background: busy ? `${accentColor}60` : accentColor,
          color: "#07080F",
          cursor: busy ? "wait" : "pointer", fontFamily: "'Outfit', sans-serif",
        }}
      >
        {busy ? "Connecting…" : `Connect ${label}`}
      </button>
    </div>
  );
}

function ComingSoonCard({ platform }) {
  return (
    <div style={{
      borderRadius: 14,
      border: "1px solid rgba(255,255,255,0.05)",
      background: "#0A0C14",
      overflow: "hidden",
      opacity: 0.6,
    }}>
      <div style={{
        padding: "14px 18px",
        background: "rgba(255,255,255,0.02)",
        borderBottom: "1px solid rgba(255,255,255,0.05)",
        display: "flex",
        alignItems: "center",
        justifyContent: "space-between",
      }}>
        <div style={{ display: "flex", alignItems: "center", gap: 10 }}>
          <span style={{
            fontSize: 9, fontWeight: 800, letterSpacing: "0.1em",
            padding: "3px 8px", borderRadius: 5,
            background: `${platform.accentColor}15`,
            color: platform.accentColor,
            border: `1px solid ${platform.accentColor}20`,
          }}>
            {platform.badgeLabel}
          </span>
          <span style={{ fontSize: 15, fontWeight: 800, color: "#F1F3F9", letterSpacing: "-0.01em" }}>
            {platform.label}
          </span>
        </div>

        <span style={{
          fontSize: 10, fontWeight: 700, padding: "3px 8px", borderRadius: 5,
          background: "rgba(255,255,255,0.06)", color: "rgba(241,243,249,0.4)",
          border: "1px solid rgba(255,255,255,0.08)",
        }}>
          Coming Soon
        </span>
      </div>

      <div style={{ padding: "16px 18px" }}>
        <div style={{ fontSize: 12, color: "rgba(241,243,249,0.35)", lineHeight: 1.6, marginBottom: 14 }}>
          {platform.description}
        </div>
        <button
          disabled
          style={{
            fontSize: 11, fontWeight: 700, padding: "7px 14px", borderRadius: 8,
            border: "1px solid rgba(255,255,255,0.08)", background: "transparent",
            color: "rgba(241,243,249,0.25)", cursor: "not-allowed",
            fontFamily: "'Outfit', sans-serif",
          }}
        >
          Coming Soon
        </button>
      </div>
    </div>
  );
}

function LoadingSkeleton() {
  return (
    <div style={{ display: "grid", gridTemplateColumns: "repeat(auto-fill, minmax(300px, 1fr))", gap: 16 }}>
      {Array.from({ length: 6 }).map((_, i) => (
        <div key={i} style={{
          height: 180, borderRadius: 14,
          background: "rgba(255,255,255,0.03)",
          animation: "pulse 1.4s ease infinite",
          animationDelay: `${i * 0.08}s`,
        }} />
      ))}
      <style>{`@keyframes pulse { 0%,100%{opacity:1;} 50%{opacity:0.4;} }`}</style>
    </div>
  );
}
