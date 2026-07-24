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
  gog: {
    placeholder: "GOG username (e.g. ShadowViper99)",
    help: "Your public GOG username — find it at gog.com/u/{username}. Profile must be set to public.",
  },
  itch: {
    placeholder: "itch.io username (e.g. shadowviper)",
    help: "Your public itch.io username — find it at itch.io/profile.",
  },
  ea: {
    placeholder: "EA username / Origin ID (e.g. ShadowViper99)",
    help: "Your EA display name — find it in the EA App under your profile.",
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
  const [syncSummaries, setSyncSummaries] = useState({});

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
        setSyncSummaries((prev) => ({ ...prev, [provider]: s }));
        const trophyPart = provider === "psn" && s.trophiesDetected != null ? `, ${s.trophiesDetected} trophies` : "";
        setNotice({ tone: "success", text: `Sync complete — ${s.rawGamesDetected} games detected, ${s.matchedCanonicalGames} matched${trophyPart}.` });
        await load();
      } else {
        if (json.error?.code === "PSN_SESSION_EXPIRED") {
          setNotice({ tone: "error", text: "Your PSN session has expired. Reconnect with a fresh NPSSO token." });
          await load();
        } else {
          setNotice({ tone: "error", text: json.error?.message || "Sync failed. Try again." });
        }
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
            syncSummary={syncSummaries[p.id] ?? null}
          />
        ))}

        {COMING_SOON_PLATFORMS.map((p) => (
          <ComingSoonCard key={p.id} platform={p} />
        ))}
      </div>

      <div style={{ marginTop: 24, fontSize: 11, color: "rgba(241,243,249,0.25)", lineHeight: 1.7 }}>
        Leet9 is platform-agnostic — Steam, PSN, Xbox, GOG, itch.io, EA and all future platforms feed the same unified game catalogue.
        Connecting your accounts never stores passwords. Session tokens (e.g. PSN NPSSO) are encrypted at rest and never shared.
      </div>
    </div>
  );
}

function ActivePlatformCard({ provider, value, onChange, onConnect, onDisconnect, onSync, busy, syncing, syncSummary }) {
  const account = provider.account;
  const isConnected = account?.status === "connected";
  const isNeedsReauth = account?.status === "needs_reauth";
  const wasConnected = account && !isConnected && !isNeedsReauth;
  const syncStatus = account?.syncStatus || "idle";
  const hasSyncSupport = provider.capabilities?.gameLibrary;
  const hint = IDENTITY_HINT[provider.id] || { placeholder: "Account identifier", help: "" };
  const isPsn = provider.id === "psn";

  const dotColor = isConnected ? "#C8FF00" : isNeedsReauth ? "#fb923c" : "rgba(241,243,249,0.2)";
  const statusLabel = isConnected ? "Connected" : isNeedsReauth ? "Session expired" : "Not connected";
  const statusLabelColor = isConnected ? "#C8FF00" : isNeedsReauth ? "#fb923c" : "rgba(241,243,249,0.35)";

  return (
    <div style={{
      borderRadius: 14,
      border: `1px solid ${isConnected ? `${provider.accentColor}22` : isNeedsReauth ? "rgba(251,146,60,0.25)" : "rgba(255,255,255,0.07)"}`,
      background: "#0A0C14",
      overflow: "hidden",
    }}>
      {/* Header bar */}
      <div style={{
        padding: "14px 18px",
        background: isConnected ? `linear-gradient(135deg, ${provider.accentColor}12 0%, transparent 100%)` : isNeedsReauth ? "rgba(251,146,60,0.06)" : "rgba(255,255,255,0.02)",
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
            background: dotColor,
            display: "inline-block",
          }} />
          <span style={{ fontSize: 11, fontWeight: 700, color: statusLabelColor }}>
            {statusLabel}
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
            isPsn={isPsn}
            syncSummary={syncSummary}
          />
        ) : isPsn ? (
          <PsnConnectWizard
            value={value}
            onChange={onChange}
            onConnect={onConnect}
            busy={busy}
            isReauth={isNeedsReauth}
            wasConnected={wasConnected}
            accentColor={provider.accentColor}
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

const NPSSO_EXPIRY_WARN_DAYS = 50;

function ConnectedState({ account, syncStatus, hasSyncSupport, onSync, onDisconnect, busy, syncing, isPsn, syncSummary }) {
  const daysSinceConnect = account.connectedAt
    ? Math.floor((Date.now() - new Date(account.connectedAt).getTime()) / 86400000)
    : 0;
  const npssoExpiring = isPsn && daysSinceConnect >= NPSSO_EXPIRY_WARN_DAYS;

  return (
    <div>
      {npssoExpiring && (
        <div style={{
          fontSize: 11, lineHeight: 1.5, padding: "8px 12px", borderRadius: 8, marginBottom: 12,
          background: "rgba(251,146,60,0.08)", border: "1px solid rgba(251,146,60,0.3)", color: "#fb923c",
        }}>
          Your NPSSO token is {daysSinceConnect} days old and may expire soon (tokens last ~60 days).
          Disconnect and reconnect with a fresh token to avoid losing sync.
        </div>
      )}

      <div style={{ marginBottom: 14 }}>
        <div style={{ fontSize: 13, fontWeight: 700, color: "#F1F3F9", marginBottom: 3 }}>
          {account.displayName || account.username || account.externalUserId}
        </div>
        <div style={{ fontSize: 11, color: "rgba(241,243,249,0.35)" }}>
          Connected {account.connectedAt ? new Date(account.connectedAt).toLocaleDateString() : ""}
        </div>
      </div>

      {isPsn && syncSummary && (
        <div style={{
          display: "flex", gap: 10, marginBottom: 12,
        }}>
          <div style={{
            flex: 1, padding: "8px 10px", borderRadius: 8,
            background: "rgba(200,170,255,0.06)", border: "1px solid rgba(200,170,255,0.15)",
            textAlign: "center",
          }}>
            <div style={{ fontSize: 16, fontWeight: 800, color: "#c8aaff" }}>
              {syncSummary.trophiesDetected ?? "—"}
            </div>
            <div style={{ fontSize: 9, fontWeight: 700, color: "rgba(241,243,249,0.4)", letterSpacing: "0.06em", textTransform: "uppercase", marginTop: 2 }}>
              Trophies
            </div>
          </div>
          <div style={{
            flex: 1, padding: "8px 10px", borderRadius: 8,
            background: "rgba(200,170,255,0.06)", border: "1px solid rgba(200,170,255,0.15)",
            textAlign: "center",
          }}>
            <div style={{ fontSize: 16, fontWeight: 800, color: "#c8aaff" }}>
              {syncSummary.matchedCanonicalGames ?? "—"}
            </div>
            <div style={{ fontSize: 9, fontWeight: 700, color: "rgba(241,243,249,0.4)", letterSpacing: "0.06em", textTransform: "uppercase", marginTop: 2 }}>
              Games
            </div>
          </div>
        </div>
      )}

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

const NPSSO_URL = "https://ca.account.sony.com/api/v1/ssocookie";

function PsnConnectWizard({ value, onChange, onConnect, busy, isReauth, wasConnected, accentColor }) {
  const [step, setStep] = useState(1);
  const [copied, setCopied] = useState(false);

  function copyUrl() {
    navigator.clipboard.writeText(NPSSO_URL).then(() => {
      setCopied(true);
      setTimeout(() => setCopied(false), 2000);
    });
  }

  return (
    <div>
      {isReauth && (
        <div style={{
          fontSize: 11, lineHeight: 1.5, padding: "8px 12px", borderRadius: 8, marginBottom: 12,
          background: "rgba(251,146,60,0.08)", border: "1px solid rgba(251,146,60,0.3)", color: "#fb923c",
        }}>
          Your PSN session has expired. Get a fresh NPSSO token to restore sync.
        </div>
      )}
      {wasConnected && !isReauth && (
        <div style={{ fontSize: 11, color: "rgba(241,243,249,0.35)", marginBottom: 10 }}>
          Previously connected — reconnect below.
        </div>
      )}

      {/* Step progress */}
      <div style={{ display: "flex", gap: 4, marginBottom: 16 }}>
        {[1, 2, 3].map((s) => (
          <div key={s} style={{
            flex: 1, height: 3, borderRadius: 2,
            background: s <= step ? accentColor : "rgba(255,255,255,0.1)",
            transition: "background 0.2s",
          }} />
        ))}
      </div>

      {step === 1 && (
        <div>
          <div style={{ fontSize: 13, fontWeight: 700, color: "#F1F3F9", marginBottom: 6 }}>
            Step 1 — Sign in to PlayStation
          </div>
          <div style={{ fontSize: 11, color: "rgba(241,243,249,0.5)", lineHeight: 1.6, marginBottom: 12 }}>
            Open the link below in your browser while signed into your PlayStation account.
            It returns a short JSON response with your NPSSO token.
          </div>
          <div style={{
            display: "flex", gap: 6, alignItems: "center", padding: "8px 10px", borderRadius: 8,
            background: "rgba(0,0,0,0.35)", border: "1px solid rgba(255,255,255,0.08)", marginBottom: 14,
          }}>
            <span style={{ flex: 1, fontSize: 10, color: "rgba(241,243,249,0.45)", wordBreak: "break-all", fontFamily: "monospace" }}>
              {NPSSO_URL}
            </span>
            <button
              onClick={copyUrl}
              style={{
                flexShrink: 0, fontSize: 10, fontWeight: 700, padding: "4px 10px", borderRadius: 6,
                border: `1px solid ${accentColor}50`, background: `${accentColor}15`,
                color: accentColor, cursor: "pointer", fontFamily: "'Outfit', sans-serif",
                whiteSpace: "nowrap",
              }}
            >
              {copied ? "Copied!" : "Copy URL"}
            </button>
          </div>
          <button
            onClick={() => setStep(2)}
            style={{
              fontSize: 12, fontWeight: 700, padding: "8px 18px", borderRadius: 8, border: "none",
              background: accentColor, color: "#07080F", cursor: "pointer", fontFamily: "'Outfit', sans-serif",
            }}
          >
            Next →
          </button>
        </div>
      )}

      {step === 2 && (
        <div>
          <div style={{ fontSize: 13, fontWeight: 700, color: "#F1F3F9", marginBottom: 6 }}>
            Step 2 — Copy your NPSSO value
          </div>
          <div style={{ fontSize: 11, color: "rgba(241,243,249,0.5)", lineHeight: 1.6, marginBottom: 10 }}>
            The page shows a JSON response. Copy the value next to{" "}
            <code style={{ fontSize: 10, background: "rgba(255,255,255,0.06)", padding: "1px 4px", borderRadius: 3 }}>
              "npsso"
            </code>:
          </div>
          <div style={{
            padding: "10px 12px", borderRadius: 8, marginBottom: 14,
            background: "rgba(0,0,0,0.35)", border: "1px solid rgba(255,255,255,0.08)",
            fontFamily: "monospace", fontSize: 11, lineHeight: 1.6,
          }}>
            <span style={{ color: "rgba(241,243,249,0.35)" }}>{`{`}</span>
            <br />
            <span style={{ paddingLeft: 14, color: "rgba(241,243,249,0.35)" }}>{`"npsso": `}</span>
            <span style={{ color: accentColor }}>{`"xxxxxxxxxxxxxxxx..."`}</span>
            <br />
            <span style={{ color: "rgba(241,243,249,0.35)" }}>{`}`}</span>
          </div>
          <div style={{ display: "flex", gap: 8 }}>
            <button
              onClick={() => setStep(1)}
              style={{
                fontSize: 12, fontWeight: 700, padding: "8px 14px", borderRadius: 8,
                border: "1px solid rgba(255,255,255,0.12)", background: "transparent",
                color: "rgba(241,243,249,0.5)", cursor: "pointer", fontFamily: "'Outfit', sans-serif",
              }}
            >
              ← Back
            </button>
            <button
              onClick={() => setStep(3)}
              style={{
                fontSize: 12, fontWeight: 700, padding: "8px 18px", borderRadius: 8, border: "none",
                background: accentColor, color: "#07080F", cursor: "pointer", fontFamily: "'Outfit', sans-serif",
              }}
            >
              Next →
            </button>
          </div>
        </div>
      )}

      {step === 3 && (
        <div>
          <div style={{ fontSize: 13, fontWeight: 700, color: "#F1F3F9", marginBottom: 6 }}>
            Step 3 — Paste your NPSSO token
          </div>
          <input
            value={value}
            onChange={(e) => onChange(e.target.value)}
            placeholder="Paste your NPSSO token here"
            onKeyDown={(e) => e.key === "Enter" && !busy && onConnect()}
            style={{
              width: "100%", boxSizing: "border-box",
              padding: "9px 12px", borderRadius: 8, marginBottom: 8,
              border: "1px solid rgba(255,255,255,0.1)", background: "rgba(0,0,0,0.3)",
              color: "#F1F3F9", fontSize: 12, fontFamily: "'Outfit', sans-serif", outline: "none",
            }}
          />
          <div style={{ fontSize: 10, color: "rgba(241,243,249,0.3)", lineHeight: 1.5, marginBottom: 12 }}>
            Tokens last ~60 days. Stored encrypted — never shared or logged.
          </div>
          <div style={{ display: "flex", gap: 8 }}>
            <button
              onClick={() => setStep(2)}
              disabled={busy}
              style={{
                fontSize: 12, fontWeight: 700, padding: "8px 14px", borderRadius: 8,
                border: "1px solid rgba(255,255,255,0.12)", background: "transparent",
                color: "rgba(241,243,249,0.5)", cursor: busy ? "wait" : "pointer", fontFamily: "'Outfit', sans-serif",
              }}
            >
              ← Back
            </button>
            <button
              onClick={onConnect}
              disabled={busy}
              style={{
                fontSize: 12, fontWeight: 700, padding: "8px 18px", borderRadius: 8, border: "none",
                background: busy ? `${accentColor}60` : accentColor,
                color: "#07080F", cursor: busy ? "wait" : "pointer", fontFamily: "'Outfit', sans-serif",
              }}
            >
              {busy ? "Connecting…" : "Connect PSN"}
            </button>
          </div>
        </div>
      )}
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
