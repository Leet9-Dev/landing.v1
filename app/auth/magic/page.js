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
    const redirect = searchParams.get("redirect") || "/dashboard";

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
            Signing you in…
          </div>
          <div style={{ fontSize: 14, color: "rgba(241,243,249,0.4)" }}>
            Opening your Leet9 account.
          </div>
        </>
      )}

      {status === "success" && (
        <>
          <div style={{ fontSize: 40 }}>🎮</div>
          <div style={{ fontSize: 18, fontWeight: 700, letterSpacing: "-0.01em" }}>
            Welcome to Leet9!
          </div>
          <div style={{ fontSize: 14, color: "rgba(241,243,249,0.4)" }}>
            Taking you to your account…
          </div>
        </>
      )}

      {status === "error" && (
        <>
          <div style={{ fontSize: 16, fontWeight: 600, color: "#fca5a5" }}>
            Link expired or invalid.
          </div>
          <div style={{ fontSize: 13, color: "rgba(241,243,249,0.35)", maxWidth: 340 }}>
            Login links are valid for 30 minutes. Request a new one from the sign-in page.
          </div>
          <a
            href="/"
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
            Back to sign in →
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
