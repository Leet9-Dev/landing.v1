"use client";
import { useEffect, useState } from "react";
import { useSearchParams, useRouter } from "next/navigation";
import { signIn } from "next-auth/react";
import { Suspense } from "react";

function MagicLoginInner() {
  const searchParams = useSearchParams();
  const router = useRouter();
  const [status, setStatus] = useState("loading"); // loading | success | error

  useEffect(() => {
    const token = searchParams.get("token");
    const redirect = searchParams.get("redirect") || "/1v1";

    if (!token) {
      setStatus("error");
      return;
    }

    signIn("magic_token", { token, redirect: false })
      .then((result) => {
        if (result?.ok) {
          setStatus("success");
          setTimeout(() => router.replace(redirect), 800);
        } else {
          setStatus("error");
        }
      })
      .catch(() => setStatus("error"));
  }, []);

  return (
    <div
      style={{
        minHeight: "100vh",
        background: "#07080F",
        display: "flex",
        flexDirection: "column",
        alignItems: "center",
        justifyContent: "center",
        fontFamily: "'Outfit', system-ui, sans-serif",
        color: "#F1F3F9",
        gap: 20,
        textAlign: "center",
        padding: "0 24px",
      }}
    >
      <div style={{ fontSize: 22, fontWeight: 900, color: "#C8FF00", letterSpacing: "-0.02em" }}>
        LEET9
      </div>

      {status === "loading" && (
        <>
          <Spinner />
          <div style={{ fontSize: 18, fontWeight: 700, letterSpacing: "-0.01em" }}>
            Accesso in corso…
          </div>
          <div style={{ fontSize: 14, color: "rgba(241,243,249,0.4)" }}>
            Stiamo aprendo il tuo account Leet9.
          </div>
        </>
      )}

      {status === "success" && (
        <>
          <div style={{ fontSize: 40 }}>🎮</div>
          <div style={{ fontSize: 18, fontWeight: 700, letterSpacing: "-0.01em" }}>
            Benvenuto su Leet9!
          </div>
          <div style={{ fontSize: 14, color: "rgba(241,243,249,0.4)" }}>
            Stai per vedere i dettagli del confronto…
          </div>
        </>
      )}

      {status === "error" && (
        <>
          <div style={{ fontSize: 16, fontWeight: 600, color: "#fca5a5" }}>
            Link scaduto o non valido.
          </div>
          <div style={{ fontSize: 13, color: "rgba(241,243,249,0.35)", maxWidth: 340 }}>
            Il link magico è valido per 30 minuti. Torna sulla pagina 1v1 e completa di nuovo l'acquisto.
          </div>
          <a
            href="/1v1"
            style={{
              marginTop: 8,
              padding: "10px 24px",
              borderRadius: 10,
              background: "#C8FF00",
              color: "#07080F",
              fontSize: 14,
              fontWeight: 800,
              textDecoration: "none",
            }}
          >
            Torna alla 1v1 →
          </a>
        </>
      )}
    </div>
  );
}

function Spinner() {
  return (
    <div style={{ width: 36, height: 36, position: "relative" }}>
      <style>{`
        @keyframes spin { to { transform: rotate(360deg); } }
      `}</style>
      <div style={{
        width: 36, height: 36, borderRadius: "50%",
        border: "3px solid rgba(200,255,0,0.15)",
        borderTopColor: "#C8FF00",
        animation: "spin 0.8s linear infinite",
      }} />
    </div>
  );
}

export default function MagicLoginPage() {
  return (
    <Suspense>
      <MagicLoginInner />
    </Suspense>
  );
}
