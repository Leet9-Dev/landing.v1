"use client";
import { useState, useEffect, useCallback } from "react";
import { SectionLabel } from "@/components/profile/sectionPrimitives";

const STATUS_STYLES = {
  connected: { color: "#C8FF00", dot: "#C8FF00", label: "Connected" },
  disconnected: { color: "rgba(241,243,249,0.35)", dot: "rgba(241,243,249,0.25)", label: "Not connected" },
  needs_reauth: { color: "#fbbf24", dot: "#fbbf24", label: "Needs re-auth" },
  unavailable: { color: "#f87171", dot: "#f87171", label: "Unavailable" },
};

// Lightweight, read-only Platform Sources surface. Real connect/disconnect and
// sync are deferred — the PSN CTA is intentionally disabled.
export function PlatformSources() {
  const [accounts, setAccounts] = useState(null);

  const load = useCallback(async () => {
    const res = await fetch("/api/me/platform-accounts");
    const json = await res.json();
    if (json.ok) setAccounts(json.data.gameDataSources);
  }, []);

  useEffect(() => {
    const t = setTimeout(load, 0);
    return () => clearTimeout(t);
  }, [load]);

  if (!accounts) return null;

  return (
    <div style={{ marginBottom: 28 }}>
      <SectionLabel>Platform Sources</SectionLabel>
      <div style={{
        display: "grid",
        gridTemplateColumns: "repeat(auto-fit, minmax(260px, 1fr))",
        gap: 12,
      }}>
        {accounts.map((a) => (
          <PlatformCard key={a.id} account={a} />
        ))}
      </div>
      <div style={{ fontSize: 11, color: "rgba(241,243,249,0.3)", marginTop: 10, lineHeight: 1.6 }}>
        Leet9 is platform-agnostic: Steam and PSN are both first-class game-data sources that feed
        the same canonical catalogue. Real platform sync is coming later — these states are mock.
      </div>
    </div>
  );
}

function PlatformCard({ account }) {
  const s = STATUS_STYLES[account.status] || STATUS_STYLES.disconnected;
  const caps = account.capabilities || {};
  const contributes = [
    caps.gameLibrary && "Game library",
    caps.achievements && "Achievements",
    caps.trophies && "Trophies",
    caps.playtime && "Playtime",
  ].filter(Boolean);

  return (
    <div style={{
      borderRadius: 12,
      border: "1px solid rgba(255,255,255,0.07)",
      background: "rgba(255,255,255,0.02)",
      padding: 16,
    }}>
      <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between", marginBottom: 10 }}>
        <span style={{ fontSize: 14, fontWeight: 800, color: "#F1F3F9", letterSpacing: "-0.01em" }}>
          {account.label}
        </span>
        <span style={{ display: "flex", alignItems: "center", gap: 6, fontSize: 11, fontWeight: 700, color: s.color }}>
          <span style={{ width: 7, height: 7, borderRadius: "50%", background: s.dot }} />
          {account.statusLabel || s.label}
        </span>
      </div>

      <div style={{ fontSize: 11, color: "rgba(241,243,249,0.4)", marginBottom: 10, lineHeight: 1.5 }}>
        {account.summary}
      </div>

      {contributes.length > 0 && (
        <div style={{ display: "flex", flexWrap: "wrap", gap: 5, marginBottom: 12 }}>
          {contributes.map((c) => (
            <span key={c} style={{
              fontSize: 9,
              fontWeight: 700,
              letterSpacing: "0.04em",
              padding: "2px 7px",
              borderRadius: 5,
              background: "rgba(255,255,255,0.04)",
              color: "rgba(241,243,249,0.45)",
            }}>
              {c}
            </span>
          ))}
        </div>
      )}

      <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between", paddingTop: 10, borderTop: "1px solid rgba(255,255,255,0.06)" }}>
        <span style={{ fontSize: 10, color: "rgba(241,243,249,0.3)" }}>
          {account.status === "connected"
            ? account.lastSyncAt
              ? `Last sync ${new Date(account.lastSyncAt).toLocaleDateString()}`
              : "Synced"
            : `${account.detectedGamesCount} games detectable`}
        </span>

        {account.status !== "connected" && (
          <button
            disabled
            title="Not active yet"
            style={{
              fontSize: 11,
              fontWeight: 700,
              padding: "6px 12px",
              borderRadius: 8,
              border: "1px solid rgba(255,255,255,0.1)",
              background: "rgba(255,255,255,0.02)",
              color: "rgba(241,243,249,0.4)",
              cursor: "not-allowed",
              fontFamily: "'Outfit', sans-serif",
            }}
          >
            Connect {account.label} · Soon
          </button>
        )}
      </div>
    </div>
  );
}
