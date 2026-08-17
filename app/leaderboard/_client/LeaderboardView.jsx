"use client";
import { useState, useEffect, useRef } from "react";

const BASE_URL =
  typeof window !== "undefined"
    ? window.location.origin
    : process.env.NEXT_PUBLIC_BASE_URL || "https://leet9.com";

export default function LeaderboardView({ rows, myRank, sessionUserId }) {
  const myRowRef = useRef(null);
  const [copiedId, setCopiedId] = useState(null);

  // Auto-scroll to own row
  useEffect(() => {
    if (myRowRef.current) {
      setTimeout(() => {
        myRowRef.current?.scrollIntoView({ behavior: "smooth", block: "center" });
      }, 400);
    }
  }, []);

  function shareRow(row) {
    const url = `${BASE_URL}/leaderboard?challenge=${row.userId}`;
    navigator.clipboard.writeText(url).then(() => {
      setCopiedId(row.userId);
      setTimeout(() => setCopiedId(null), 2000);
    });
  }

  const isMe = (row) => row.userId === sessionUserId;

  return (
    <div
      style={{
        minHeight: "100vh",
        background: "#07080F",
        fontFamily: "'Outfit', system-ui, sans-serif",
        color: "#F1F3F9",
      }}
    >
      {/* Header */}
      <div
        style={{
          borderBottom: "1px solid rgba(255,255,255,0.06)",
          padding: "18px 32px",
          display: "flex",
          alignItems: "center",
          justifyContent: "space-between",
        }}
      >
        <a href="/" style={{ textDecoration: "none" }}>
          <img
            src="/logo-full-whitegradient.png"
            alt="Leet9"
            style={{ height: 28, display: "block" }}
          />
        </a>
        <a
          href="/signup"
          style={{
            display: "inline-flex",
            alignItems: "center",
            padding: "8px 18px",
            borderRadius: 8,
            background: "#C8FF00",
            color: "#07080F",
            fontSize: 13,
            fontWeight: 800,
            textDecoration: "none",
          }}
        >
          Join Leet9 — free →
        </a>
      </div>

      <div style={{ maxWidth: 720, margin: "0 auto", padding: "56px 32px 96px" }}>
        {/* Title */}
        <div style={{ marginBottom: 40 }}>
          <div
            style={{
              fontSize: 11,
              fontWeight: 700,
              color: "rgba(241,243,249,0.3)",
              letterSpacing: "0.1em",
              textTransform: "uppercase",
              marginBottom: 8,
            }}
          >
            Top 100
          </div>
          <h1
            style={{
              fontSize: 36,
              fontWeight: 900,
              letterSpacing: "-0.03em",
              lineHeight: 1.1,
              marginBottom: 8,
            }}
          >
            Leaderboard L9 Points
          </h1>
          <p style={{ fontSize: 14, color: "rgba(241,243,249,0.38)", fontWeight: 500 }}>
            I migliori 100 gamer su Leet9. Aggiornata ogni 5 minuti.
          </p>
        </div>

        {/* My rank banner (if logged in and outside top 100) */}
        {myRank && myRank > 100 && (
          <div
            style={{
              marginBottom: 24,
              padding: "14px 20px",
              borderRadius: 12,
              border: "1px solid rgba(200,255,0,0.2)",
              background: "rgba(200,255,0,0.05)",
              display: "flex",
              alignItems: "center",
              justifyContent: "space-between",
            }}
          >
            <span style={{ fontSize: 13, color: "rgba(241,243,249,0.7)", fontWeight: 600 }}>
              La tua posizione attuale
            </span>
            <span style={{ fontSize: 20, fontWeight: 900, color: "#C8FF00" }}>
              #{myRank}
            </span>
          </div>
        )}

        {/* Table */}
        <div
          style={{
            borderRadius: 16,
            border: "1px solid rgba(255,255,255,0.06)",
            overflow: "hidden",
          }}
        >
          {rows.map((row, i) => {
            const mine = isMe(row);
            return (
              <div
                key={row.userId}
                ref={mine ? myRowRef : null}
                style={{
                  display: "flex",
                  alignItems: "center",
                  gap: 14,
                  padding: "13px 20px",
                  borderBottom:
                    i < rows.length - 1
                      ? "1px solid rgba(255,255,255,0.04)"
                      : "none",
                  background: mine
                    ? "rgba(200,255,0,0.05)"
                    : i % 2 === 0
                      ? "#0A0C14"
                      : "#080A12",
                  transition: "background 0.15s",
                }}
              >
                {/* Rank */}
                <div
                  style={{
                    width: 36,
                    flexShrink: 0,
                    textAlign: "right",
                    fontSize: row.rank <= 3 ? 16 : 13,
                    fontWeight: 900,
                    color:
                      row.rank === 1
                        ? "#FFD700"
                        : row.rank === 2
                          ? "#C0C0C0"
                          : row.rank === 3
                            ? "#CD7F32"
                            : mine
                              ? "#C8FF00"
                              : "rgba(241,243,249,0.3)",
                    letterSpacing: "-0.02em",
                  }}
                >
                  {row.rank === 1 ? "🥇" : row.rank === 2 ? "🥈" : row.rank === 3 ? "🥉" : `#${row.rank}`}
                </div>

                {/* NEW badge */}
                {row.isNew && (
                  <span
                    style={{
                      fontSize: 9,
                      fontWeight: 800,
                      letterSpacing: "0.08em",
                      color: "#a78bfa",
                      background: "rgba(167,139,250,0.12)",
                      border: "1px solid rgba(167,139,250,0.3)",
                      borderRadius: 4,
                      padding: "2px 6px",
                      flexShrink: 0,
                    }}
                  >
                    NEW
                  </span>
                )}

                {/* Avatar */}
                {row.image ? (
                  <img
                    src={row.image}
                    alt={row.name}
                    width={36}
                    height={36}
                    style={{
                      borderRadius: 10,
                      flexShrink: 0,
                      border: mine ? "2px solid #C8FF00" : "2px solid transparent",
                    }}
                  />
                ) : (
                  <div
                    style={{
                      width: 36,
                      height: 36,
                      borderRadius: 10,
                      background: "rgba(200,255,0,0.1)",
                      flexShrink: 0,
                      display: "flex",
                      alignItems: "center",
                      justifyContent: "center",
                      fontSize: 16,
                    }}
                  >
                    🎮
                  </div>
                )}

                {/* Name */}
                <div style={{ flex: 1, minWidth: 0 }}>
                  <div
                    style={{
                      fontSize: 14,
                      fontWeight: mine ? 800 : 600,
                      color: mine ? "#C8FF00" : "#F1F3F9",
                      overflow: "hidden",
                      textOverflow: "ellipsis",
                      whiteSpace: "nowrap",
                    }}
                  >
                    {row.name}
                    {mine && (
                      <span
                        style={{
                          fontSize: 10,
                          fontWeight: 700,
                          color: "rgba(200,255,0,0.6)",
                          marginLeft: 8,
                        }}
                      >
                        (tu)
                      </span>
                    )}
                  </div>
                </div>

                {/* Points */}
                <div
                  style={{
                    fontSize: 15,
                    fontWeight: 800,
                    color: mine ? "#C8FF00" : "#F1F3F9",
                    flexShrink: 0,
                    letterSpacing: "-0.02em",
                    fontVariantNumeric: "tabular-nums",
                  }}
                >
                  {row.l9Points.toLocaleString()}
                  <span
                    style={{
                      fontSize: 10,
                      fontWeight: 600,
                      color: "rgba(241,243,249,0.35)",
                      marginLeft: 4,
                    }}
                  >
                    pts
                  </span>
                </div>

                {/* Share / Challenge button */}
                <button
                  onClick={() => shareRow(row)}
                  title="Copia link sfida"
                  style={{
                    flexShrink: 0,
                    padding: "6px 12px",
                    borderRadius: 8,
                    border: "1px solid rgba(255,255,255,0.08)",
                    background:
                      copiedId === row.userId
                        ? "rgba(200,255,0,0.08)"
                        : "transparent",
                    color:
                      copiedId === row.userId
                        ? "#C8FF00"
                        : "rgba(241,243,249,0.35)",
                    fontSize: 11,
                    fontWeight: 700,
                    cursor: "pointer",
                    transition: "all 0.15s",
                    fontFamily: "'Outfit', sans-serif",
                    whiteSpace: "nowrap",
                  }}
                >
                  {copiedId === row.userId ? "✓ Copiato" : mine ? "Sfidami →" : "Sfida →"}
                </button>
              </div>
            );
          })}
        </div>

        {/* Bottom hook for non-logged-in */}
        {!sessionUserId && (
          <div
            style={{
              marginTop: 40,
              padding: "28px 32px",
              borderRadius: 16,
              border: "1px solid rgba(255,255,255,0.06)",
              background: "#0D0F1A",
              textAlign: "center",
            }}
          >
            <div
              style={{
                fontSize: 13,
                color: "rgba(241,243,249,0.35)",
                marginBottom: 6,
              }}
            >
              Non ti vedi in classifica?
            </div>
            <div
              style={{
                fontSize: 18,
                fontWeight: 800,
                color: "#F1F3F9",
                marginBottom: 16,
                letterSpacing: "-0.02em",
              }}
            >
              Calcola il tuo L9 Score e sfida chiunque
            </div>
            <a
              href="/1v1"
              style={{
                display: "inline-flex",
                alignItems: "center",
                padding: "12px 28px",
                borderRadius: 10,
                background: "#C8FF00",
                color: "#07080F",
                fontSize: 14,
                fontWeight: 800,
                textDecoration: "none",
                letterSpacing: "-0.01em",
              }}
            >
              Inizia una 1v1 →
            </a>
          </div>
        )}
      </div>
    </div>
  );
}
