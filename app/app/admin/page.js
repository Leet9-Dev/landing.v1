"use client";
import { useState, useEffect } from "react";

const KNOWN_USERS = [
  { label: "Seed my games", userId: null },
  { label: "Seed Fran's games", userId: "cmqtn7n0r00001e7zuylpd4zd" },
];

function SeedButton({ label, userId }) {
  const [state, setState] = useState("idle"); // idle | loading | done | error

  async function handleSeed() {
    if (state === "loading") return;
    setState("loading");
    try {
      const body = userId ? JSON.stringify({ userId }) : "{}";
      const res = await fetch("/api/dev/seed-games", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body,
      });
      const json = await res.json();
      if (json.ok) setState("done");
      else setState("error");
    } catch {
      setState("error");
    }
  }

  const colors = {
    idle:    { bg: "rgba(200,255,0,0.08)", border: "rgba(200,255,0,0.3)", color: "#C8FF00" },
    loading: { bg: "rgba(200,255,0,0.04)", border: "rgba(200,255,0,0.15)", color: "rgba(200,255,0,0.4)" },
    done:    { bg: "rgba(74,222,128,0.08)", border: "rgba(74,222,128,0.3)", color: "#4ade80" },
    error:   { bg: "rgba(248,113,113,0.08)", border: "rgba(248,113,113,0.3)", color: "#f87171" },
  };
  const c = colors[state];

  return (
    <button
      onClick={handleSeed}
      disabled={state === "loading" || state === "done"}
      style={{
        padding: "14px 28px", borderRadius: 12,
        border: `1px solid ${c.border}`, background: c.bg, color: c.color,
        fontFamily: "'Outfit', sans-serif", fontSize: 14, fontWeight: 700,
        cursor: state === "loading" || state === "done" ? "default" : "pointer",
        transition: "all 0.15s", width: "100%", textAlign: "left",
      }}
    >
      {state === "loading" ? "Seeding…" : state === "done" ? `✓ ${label} — done` : state === "error" ? `✗ Error (are you admin?)` : `⚡ ${label}`}
    </button>
  );
}

export default function AdminPage() {
  const [myId, setMyId] = useState(null);
  useEffect(() => {
    fetch("/api/me").then(r => r.json()).then(j => { if (j.ok) setMyId(j.data?.id); }).catch(() => {});
  }, []);

  return (
    <div style={{ padding: "36px 32px", fontFamily: "'Outfit', sans-serif", maxWidth: 480, margin: "0 auto" }}>
      <h1 style={{ fontSize: 20, fontWeight: 900, color: "#F1F3F9", letterSpacing: "-0.02em", margin: "0 0 8px" }}>
        Admin
      </h1>
      <p style={{ fontSize: 13, color: "rgba(241,243,249,0.4)", margin: "0 0 32px" }}>
        Dev tools — visible only to admins.
      </p>

      <div style={{ fontSize: 11, fontWeight: 700, color: "rgba(241,243,249,0.3)", letterSpacing: "0.07em", textTransform: "uppercase", marginBottom: 12 }}>
        Seed mock game data
      </div>
      <div style={{ display: "flex", flexDirection: "column", gap: 10 }}>
        {KNOWN_USERS.map((u) => (
          <SeedButton key={u.label} label={u.label} userId={u.userId} />
        ))}
      </div>

      <p style={{ marginTop: 20, fontSize: 11, color: "rgba(241,243,249,0.2)", lineHeight: 1.6 }}>
        Seeds 8 mock games (Elden Ring, BG3, …) with random hours and achievements. Safe to run multiple times — uses upsert.
      </p>

      {myId && (
        <div style={{ marginTop: 28, padding: "12px 16px", borderRadius: 10, background: "rgba(255,255,255,0.03)", border: "1px solid rgba(255,255,255,0.06)" }}>
          <div style={{ fontSize: 10, fontWeight: 700, color: "rgba(241,243,249,0.25)", letterSpacing: "0.07em", textTransform: "uppercase", marginBottom: 6 }}>Your User ID</div>
          <div style={{ fontSize: 12, fontFamily: "monospace", color: "rgba(241,243,249,0.5)", wordBreak: "break-all" }}>{myId}</div>
        </div>
      )}
    </div>
  );
}
