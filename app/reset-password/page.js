"use client";
import { useState } from "react";
import { useSearchParams, useRouter } from "next/navigation";
import { Suspense } from "react";

function ResetPasswordContent() {
  const searchParams = useSearchParams();
  const router = useRouter();
  const token = searchParams.get("token") || "";

  const [password, setPassword] = useState("");
  const [confirm, setConfirm] = useState("");
  const [status, setStatus] = useState("idle"); // idle | loading | success | error
  const [error, setError] = useState(null);

  async function handleSubmit(e) {
    e.preventDefault();
    if (password !== confirm) { setError("Passwords don't match."); return; }
    setStatus("loading"); setError(null);
    const res = await fetch("/api/auth/reset-password", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ token, password }),
    });
    const json = await res.json();
    if (json.ok) { setStatus("success"); }
    else { setError(json.error?.message || "Link invalid or expired."); setStatus("idle"); }
  }

  const inputStyle = {
    width: "100%", padding: "11px 14px", borderRadius: 10, boxSizing: "border-box",
    border: "1px solid rgba(255,255,255,0.1)", background: "rgba(255,255,255,0.04)",
    color: "#F1F3F9", fontFamily: "'Outfit', sans-serif", fontSize: 14, outline: "none",
  };

  return (
    <div style={{
      minHeight: "100vh", background: "#07080F", display: "flex",
      alignItems: "center", justifyContent: "center",
      fontFamily: "'Outfit', sans-serif", padding: "24px",
    }}>
      <div style={{
        width: "100%", maxWidth: 400,
        background: "#0D0F1A", borderRadius: 18,
        border: "1px solid rgba(255,255,255,0.08)",
        padding: "40px 32px",
      }}>
        {status === "success" ? (
          <div style={{ textAlign: "center" }}>
            <div style={{ fontSize: 36, color: "#C8FF00", marginBottom: 16 }}>✓</div>
            <h1 style={{ fontSize: 20, fontWeight: 800, color: "#F1F3F9", marginBottom: 10 }}>Password updated</h1>
            <p style={{ fontSize: 13, color: "rgba(241,243,249,0.45)", marginBottom: 28 }}>You can now sign in with your new password.</p>
            <button onClick={() => router.push("/")} style={{
              padding: "12px 28px", borderRadius: 10, border: "none",
              background: "linear-gradient(135deg,#C8FF00,#AAEE00)",
              color: "#07080F", fontFamily: "'Outfit', sans-serif", fontSize: 14, fontWeight: 800, cursor: "pointer",
            }}>Sign In →</button>
          </div>
        ) : (
          <>
            <h1 style={{ fontSize: 20, fontWeight: 800, color: "#F1F3F9", marginBottom: 6, letterSpacing: "-0.01em" }}>
              Reset password
            </h1>
            <p style={{ fontSize: 13, color: "rgba(241,243,249,0.4)", marginBottom: 24 }}>Choose a new password for your account.</p>
            <form onSubmit={handleSubmit} style={{ display: "flex", flexDirection: "column", gap: 10 }}>
              <input type="password" placeholder="New password (min 8 chars)" value={password} required minLength={8}
                onChange={e => setPassword(e.target.value)} style={inputStyle}
                onFocus={e => e.target.style.borderColor = "rgba(200,255,0,0.4)"}
                onBlur={e => e.target.style.borderColor = "rgba(255,255,255,0.1)"} />
              <input type="password" placeholder="Confirm new password" value={confirm} required
                onChange={e => setConfirm(e.target.value)} style={inputStyle}
                onFocus={e => e.target.style.borderColor = "rgba(200,255,0,0.4)"}
                onBlur={e => e.target.style.borderColor = "rgba(255,255,255,0.1)"} />
              {error && (
                <div style={{ fontSize: 12, color: "#f87171", padding: "6px 10px", borderRadius: 8, background: "rgba(248,113,113,0.08)", border: "1px solid rgba(248,113,113,0.2)" }}>
                  {error}
                </div>
              )}
              <button type="submit" disabled={status === "loading"} style={{
                padding: "13px", borderRadius: 10, border: "none",
                background: status === "loading" ? "rgba(200,255,0,0.4)" : "linear-gradient(135deg,#C8FF00,#AAEE00)",
                color: "#07080F", fontFamily: "'Outfit', sans-serif", fontSize: 14, fontWeight: 800,
                cursor: status === "loading" ? "wait" : "pointer", marginTop: 4,
              }}>
                {status === "loading" ? "Saving…" : "Set New Password"}
              </button>
            </form>
          </>
        )}
      </div>
    </div>
  );
}

export default function ResetPasswordPage() {
  return (
    <Suspense>
      <ResetPasswordContent />
    </Suspense>
  );
}
