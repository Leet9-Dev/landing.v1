"use client";
import { useState, useEffect, Suspense } from "react";
import { signIn } from "next-auth/react";
import { useSearchParams } from "next/navigation";

const T = {
  bg:      "#06070A",
  card:    "#12151F",
  border:  "rgba(255,255,255,0.08)",
  borderHi:"rgba(255,255,255,0.14)",
  green:   "#C8FF00",
  red:     "#FF4D4D",
  text:    "#F0F2F8",
  textSec: "#7A8299",
  textMut: "#3A3F52",
};

const CALLBACK = "/app/settings/account?discord_connect=1";

function GoogleIcon() {
  return (
    <svg width="18" height="18" viewBox="0 0 48 48">
      <path fill="#EA4335" d="M24 9.5c3.54 0 6.71 1.22 9.21 3.6l6.85-6.85C35.9 2.38 30.47 0 24 0 14.62 0 6.51 5.38 2.56 13.22l7.98 6.19C12.43 13.08 17.74 9.5 24 9.5z"/>
      <path fill="#4285F4" d="M46.98 24.55c0-1.57-.15-3.09-.38-4.55H24v9.02h12.94c-.58 2.96-2.26 5.48-4.78 7.18l7.73 6c4.51-4.18 7.09-10.36 7.09-17.65z"/>
      <path fill="#FBBC05" d="M10.53 28.59c-.48-1.45-.76-2.99-.76-4.59s.27-3.14.76-4.59l-7.98-6.19C.92 16.46 0 20.12 0 24c0 3.88.92 7.54 2.56 10.78l7.97-6.19z"/>
      <path fill="#34A853" d="M24 48c6.48 0 11.93-2.13 15.89-5.81l-7.73-6c-2.18 1.48-4.97 2.31-8.16 2.31-6.26 0-11.57-3.59-13.46-8.91l-7.98 6.19C6.51 42.62 14.62 48 24 48z"/>
    </svg>
  );
}

function Btn({ onClick, disabled, loading, children }) {
  const [h, setH] = useState(false);
  return (
    <button
      onClick={onClick}
      disabled={disabled}
      onMouseEnter={() => setH(true)}
      onMouseLeave={() => setH(false)}
      style={{
        display:"flex", alignItems:"center", justifyContent:"center", gap:10,
        width:"100%", padding:"12px 16px", borderRadius:10,
        background: h && !disabled ? "rgba(255,255,255,0.07)" : "rgba(255,255,255,0.04)",
        border:`1px solid ${h && !disabled ? "rgba(255,255,255,0.18)" : "rgba(255,255,255,0.1)"}`,
        color: disabled ? T.textMut : T.text,
        fontSize:14, fontWeight:600, fontFamily:"'Outfit',sans-serif",
        cursor: disabled ? "not-allowed" : "pointer",
        transition:"all 0.15s",
      }}
    >
      {loading
        ? <span style={{ width:18,height:18,border:"2px solid rgba(255,255,255,0.25)",borderTopColor:"#fff",borderRadius:"50%",display:"inline-block",animation:"spin 0.7s linear infinite" }}/>
        : children}
    </button>
  );
}

const ERROR_MESSAGES = {
  OAuthAccountNotLinked: null, // handled specially
  AccessDenied: "Access was denied. You may not have permission to sign in.",
  Verification: "The sign-in link has expired or already been used. Request a new one.",
  Configuration: "There is a problem with the server configuration.",
  Default: "An unexpected sign-in error occurred.",
};

function ErrorContent() {
  const params = useSearchParams();
  const error = params.get("error") ?? "Default";

  const [phase, setPhase] = useState("main"); // main | email | magic | magic_sent
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [loading, setLoading] = useState(null);
  const [formError, setFormError] = useState("");

  const isAccountConflict = error === "OAuthAccountNotLinked";

  async function handleGoogle() {
    setLoading("google");
    await signIn("google", { callbackUrl: CALLBACK });
  }

  async function handleEmailPassword(e) {
    e.preventDefault();
    setFormError("");
    setLoading("credentials");
    try {
      const result = await signIn("credentials", {
        email: email.trim().toLowerCase(),
        password,
        callbackUrl: CALLBACK,
        redirect: false,
      });
      if (result?.error === "EMAIL_NOT_VERIFIED") {
        setFormError("Your email is not verified. Check your inbox for a verification link.");
      } else if (result?.error === "RATE_LIMITED") {
        setFormError("Too many attempts. Please wait a moment and try again.");
      } else if (result?.error) {
        setFormError("Invalid email or password.");
      } else if (result?.url) {
        window.location.href = result.url;
      }
    } catch {
      setFormError("Something went wrong. Please try again.");
    } finally {
      setLoading(null);
    }
  }

  async function handleMagicLink(e) {
    e.preventDefault();
    setFormError("");
    setLoading("magic");
    try {
      await fetch("/api/auth/request-magic-link", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ email: email.trim().toLowerCase(), redirectPath: CALLBACK }),
      });
      setPhase("magic_sent");
    } catch {
      setFormError("Could not send the link. Please try again.");
    } finally {
      setLoading(null);
    }
  }

  if (!isAccountConflict) {
    const msg = ERROR_MESSAGES[error] ?? ERROR_MESSAGES.Default;
    return (
      <div style={{ textAlign:"center" }}>
        <div style={{ fontSize:13, color:T.textSec, marginBottom:24, lineHeight:1.6 }}>{msg}</div>
        <a href="/" style={{ fontSize:13, color:T.green, textDecoration:"none", fontFamily:"'Outfit',sans-serif", fontWeight:600 }}>
          ← Back to home
        </a>
      </div>
    );
  }

  return (
    <div>
      <div style={{
        background:"rgba(255,77,77,0.08)", border:"1px solid rgba(255,77,77,0.2)",
        borderRadius:10, padding:"14px 16px", marginBottom:24,
        fontSize:13, color:"#FFB3B3", lineHeight:1.6, fontFamily:"'Outfit',sans-serif",
      }}>
        This email is already registered. Sign in with the method you used originally,
        then connect Discord from your account settings.
      </div>

      <div style={{ display:"flex", flexDirection:"column", gap:8 }}>
        {/* Google */}
        <Btn onClick={handleGoogle} disabled={!!loading} loading={loading === "google"}>
          <GoogleIcon />
          Continue with Google
        </Btn>

        {/* Email + Password */}
        {phase === "main" && (
          <Btn onClick={() => setPhase("email")} disabled={!!loading}>
            <span style={{ fontSize:16 }}>@</span>
            Continue with Email & Password
          </Btn>
        )}

        {phase === "email" && (
          <form onSubmit={handleEmailPassword} style={{ display:"flex", flexDirection:"column", gap:8 }}>
            <input
              type="email"
              placeholder="Email"
              value={email}
              onChange={e => setEmail(e.target.value)}
              required
              autoFocus
              style={{
                padding:"11px 14px", borderRadius:8, fontSize:14,
                background:"rgba(255,255,255,0.04)", border:"1px solid rgba(255,255,255,0.1)",
                color:T.text, fontFamily:"'Outfit',sans-serif", outline:"none",
              }}
            />
            <input
              type="password"
              placeholder="Password"
              value={password}
              onChange={e => setPassword(e.target.value)}
              required
              style={{
                padding:"11px 14px", borderRadius:8, fontSize:14,
                background:"rgba(255,255,255,0.04)", border:"1px solid rgba(255,255,255,0.1)",
                color:T.text, fontFamily:"'Outfit',sans-serif", outline:"none",
              }}
            />
            {formError && <div style={{ fontSize:12, color:T.red }}>{formError}</div>}
            <div style={{ display:"flex", gap:8 }}>
              <button
                type="button"
                onClick={() => { setPhase("main"); setFormError(""); }}
                style={{ flex:1, padding:"10px", borderRadius:8, background:"transparent", border:"1px solid rgba(255,255,255,0.08)", color:T.textSec, fontSize:13, cursor:"pointer", fontFamily:"'Outfit',sans-serif" }}
              >
                Cancel
              </button>
              <button
                type="submit"
                disabled={!!loading}
                style={{ flex:2, padding:"10px", borderRadius:8, background:T.green, border:"none", color:"#000", fontSize:13, fontWeight:700, cursor:"pointer", fontFamily:"'Outfit',sans-serif" }}
              >
                {loading === "credentials" ? "Signing in…" : "Sign in"}
              </button>
            </div>
          </form>
        )}

        {/* Magic Link */}
        {phase === "main" && (
          <Btn onClick={() => setPhase("magic")} disabled={!!loading}>
            <span style={{ fontSize:16 }}>✉</span>
            Continue with Magic Link
          </Btn>
        )}

        {phase === "magic" && (
          <form onSubmit={handleMagicLink} style={{ display:"flex", flexDirection:"column", gap:8 }}>
            <input
              type="email"
              placeholder="Your email address"
              value={email}
              onChange={e => setEmail(e.target.value)}
              required
              autoFocus
              style={{
                padding:"11px 14px", borderRadius:8, fontSize:14,
                background:"rgba(255,255,255,0.04)", border:"1px solid rgba(255,255,255,0.1)",
                color:T.text, fontFamily:"'Outfit',sans-serif", outline:"none",
              }}
            />
            {formError && <div style={{ fontSize:12, color:T.red }}>{formError}</div>}
            <div style={{ display:"flex", gap:8 }}>
              <button
                type="button"
                onClick={() => { setPhase("main"); setFormError(""); }}
                style={{ flex:1, padding:"10px", borderRadius:8, background:"transparent", border:"1px solid rgba(255,255,255,0.08)", color:T.textSec, fontSize:13, cursor:"pointer", fontFamily:"'Outfit',sans-serif" }}
              >
                Cancel
              </button>
              <button
                type="submit"
                disabled={!!loading}
                style={{ flex:2, padding:"10px", borderRadius:8, background:T.green, border:"none", color:"#000", fontSize:13, fontWeight:700, cursor:"pointer", fontFamily:"'Outfit',sans-serif" }}
              >
                {loading === "magic" ? "Sending…" : "Send link"}
              </button>
            </div>
          </form>
        )}

        {phase === "magic_sent" && (
          <div style={{
            padding:"14px 16px", borderRadius:10, background:"rgba(200,255,0,0.07)",
            border:"1px solid rgba(200,255,0,0.2)", fontSize:13, color:T.green, lineHeight:1.6,
            fontFamily:"'Outfit',sans-serif",
          }}>
            Magic link sent. Check your inbox and click the link to sign in.
          </div>
        )}
      </div>
    </div>
  );
}

export default function AuthErrorPage() {
  return (
    <div style={{
      minHeight:"100dvh", background:T.bg,
      display:"flex", alignItems:"center", justifyContent:"center",
      padding:16, fontFamily:"'Outfit',sans-serif",
    }}>
      <div style={{
        width:"100%", maxWidth:380, background:T.card,
        border:`1px solid ${T.borderHi}`, borderRadius:20,
        padding:"32px 28px",
        boxShadow:"0 32px 80px rgba(0,0,0,0.9)",
      }}>
        <div style={{ textAlign:"center", marginBottom:24 }}>
          <div style={{
            width:44, height:44, borderRadius:10, background:T.green,
            display:"inline-flex", alignItems:"center", justifyContent:"center",
            fontSize:17, fontWeight:900, color:"#000",
            fontFamily:"'Rajdhani',sans-serif",
            boxShadow:`0 0 24px ${T.green}55`, marginBottom:14,
          }}>L9</div>
          <div style={{ fontSize:19, fontWeight:700, color:T.text, fontFamily:"'Rajdhani',sans-serif", letterSpacing:"0.04em" }}>
            Sign-in conflict
          </div>
          <div style={{ fontSize:13, color:T.textSec, marginTop:5 }}>
            Choose how to continue
          </div>
        </div>

        <Suspense>
          <ErrorContent />
        </Suspense>
      </div>

      <style>{`
        @keyframes spin { to { transform: rotate(360deg); } }
        * { box-sizing: border-box; }
        input::placeholder { color: rgba(240,242,248,0.3); }
      `}</style>
    </div>
  );
}
