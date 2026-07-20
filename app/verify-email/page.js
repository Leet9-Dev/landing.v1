"use client";
import { useEffect, useState } from "react";
import { useSearchParams, useRouter } from "next/navigation";
import { Suspense } from "react";

function VerifyEmailContent() {
  const searchParams = useSearchParams();
  const router = useRouter();
  const [status, setStatus] = useState("verifying"); // verifying | success | error

  useEffect(() => {
    const token = searchParams.get("token");
    if (!token) { setStatus("error"); return; }
    fetch(`/api/auth/verify-email?token=${token}`)
      .then(r => r.json())
      .then(json => setStatus(json.ok ? "success" : "error"))
      .catch(() => setStatus("error"));
  }, [searchParams]);

  const content = {
    verifying: { icon: "⟳", title: "Verifying…", sub: "Just a moment.", color: "rgba(241,243,249,0.5)" },
    success:   { icon: "✓", title: "Email confirmed!", sub: "You can now sign in to Leet9.", color: "#C8FF00" },
    error:     { icon: "✕", title: "Link invalid or expired", sub: "Request a new verification email by signing up again.", color: "#f87171" },
  }[status];

  return (
    <div style={{
      minHeight: "100vh", background: "#07080F", display: "flex",
      alignItems: "center", justifyContent: "center",
      fontFamily: "'Outfit', sans-serif", padding: "24px",
    }}>
      <div style={{
        textAlign: "center", maxWidth: 380,
        background: "#0D0F1A", borderRadius: 18,
        border: "1px solid rgba(255,255,255,0.08)",
        padding: "48px 36px",
      }}>
        <div style={{ fontSize: 40, marginBottom: 20, color: content.color, animation: status === "verifying" ? "spin 1s linear infinite" : "none" }}>
          {content.icon}
        </div>
        <h1 style={{ fontSize: 20, fontWeight: 800, color: "#F1F3F9", marginBottom: 10, letterSpacing: "-0.01em" }}>
          {content.title}
        </h1>
        <p style={{ fontSize: 13, color: "rgba(241,243,249,0.45)", marginBottom: 28, lineHeight: 1.5 }}>
          {content.sub}
        </p>
        {status === "success" && (
          <button
            onClick={() => router.push("/")}
            style={{
              padding: "12px 28px", borderRadius: 10, border: "none",
              background: "linear-gradient(135deg,#C8FF00,#AAEE00)",
              color: "#07080F", fontFamily: "'Outfit', sans-serif",
              fontSize: 14, fontWeight: 800, cursor: "pointer",
            }}
          >
            Sign In →
          </button>
        )}
      </div>
      <style>{`@keyframes spin{to{transform:rotate(360deg);}}`}</style>
    </div>
  );
}

export default function VerifyEmailPage() {
  return (
    <Suspense>
      <VerifyEmailContent />
    </Suspense>
  );
}
