"use client";
import { useState, useEffect, useRef } from "react";
import { useSession } from "next-auth/react";
import { useSearchParams } from "next/navigation";

const T = {
  card:    "#12151F",
  border:  "rgba(255,255,255,0.07)",
  borderHi:"rgba(255,255,255,0.14)",
  green:   "#C8FF00",
  red:     "#FF4D4D",
  text:    "#F1F3F9",
  textSec: "rgba(241,243,249,0.45)",
  textMut: "rgba(241,243,249,0.2)",
  blurple: "#5865F2",
};

function DiscordIcon({ size = 20, color = T.blurple }) {
  return (
    <svg width={size} height={size * (96.36 / 127.14)} viewBox="0 0 127.14 96.36" fill={color} fillRule="evenodd">
      <path d="M107.7 8.07A105.15 105.15 0 0 0 81.47 0a72.06 72.06 0 0 0-3.36 6.83 97.68 97.68 0 0 0-29.11 0A72.37 72.37 0 0 0 45.64 0a105.89 105.89 0 0 0-26.25 8.09C2.79 32.65-1.71 56.6.54 80.21a105.73 105.73 0 0 0 32.17 16.15 77.7 77.7 0 0 0 6.89-11.11 68.42 68.42 0 0 1-10.85-5.18c.91-.66 1.8-1.34 2.66-2a75.57 75.57 0 0 0 64.32 0c.87.71 1.76 1.39 2.66 2a68.68 68.68 0 0 1-10.87 5.19 77 77 0 0 0 6.89 11.1 105.25 105.25 0 0 0 32.19-16.14c2.64-27.38-4.51-51.11-18.9-72.15ZM42.45 65.69C36.18 65.69 31 60 31 53s5-12.74 11.43-12.74S54 46 53.89 53s-5.05 12.69-11.44 12.69Zm42.24 0C78.41 65.69 73.25 60 73.25 53s5-12.74 11.44-12.74S96.23 46 96.12 53s-5.04 12.69-11.43 12.69Z"/>
    </svg>
  );
}

function GoogleIcon({ size = 18 }) {
  return (
    <svg width={size} height={size} viewBox="0 0 48 48">
      <path fill="#EA4335" d="M24 9.5c3.54 0 6.71 1.22 9.21 3.6l6.85-6.85C35.9 2.38 30.47 0 24 0 14.62 0 6.51 5.38 2.56 13.22l7.98 6.19C12.43 13.08 17.74 9.5 24 9.5z"/>
      <path fill="#4285F4" d="M46.98 24.55c0-1.57-.15-3.09-.38-4.55H24v9.02h12.94c-.58 2.96-2.26 5.48-4.78 7.18l7.73 6c4.51-4.18 7.09-10.36 7.09-17.65z"/>
      <path fill="#FBBC05" d="M10.53 28.59c-.48-1.45-.76-2.99-.76-4.59s.27-3.14.76-4.59l-7.98-6.19C.92 16.46 0 20.12 0 24c0 3.88.92 7.54 2.56 10.78l7.97-6.19z"/>
      <path fill="#34A853" d="M24 48c6.48 0 11.93-2.13 15.89-5.81l-7.73-6c-2.18 1.48-4.97 2.31-8.16 2.31-6.26 0-11.57-3.59-13.46-8.91l-7.98 6.19C6.51 42.62 14.62 48 24 48z"/>
    </svg>
  );
}

function StatusPill({ connected }) {
  return (
    <span style={{
      fontSize: 11, fontWeight: 700, padding: "3px 9px", borderRadius: 99,
      letterSpacing: "0.06em", fontFamily: "'JetBrains Mono', monospace",
      background: connected ? "rgba(200,255,0,0.1)" : "rgba(255,255,255,0.05)",
      color: connected ? T.green : T.textSec,
      border: connected ? "1px solid rgba(200,255,0,0.2)" : "1px solid rgba(255,255,255,0.06)",
    }}>
      {connected ? "connected" : "not connected"}
    </span>
  );
}

function MethodRow({ icon, label, sublabel, connected, onConnect, onDisconnect, connecting, disconnecting, highlight, disabledDisconnect, children }) {
  const rowRef = useRef(null);

  useEffect(() => {
    if (highlight && rowRef.current) {
      rowRef.current.scrollIntoView({ behavior: "smooth", block: "center" });
    }
  }, [highlight]);

  return (
    <div
      ref={rowRef}
      style={{
        display: "flex", alignItems: "center", gap: 16,
        padding: "18px 20px", borderRadius: 12,
        background: highlight ? "rgba(88,101,242,0.07)" : T.card,
        border: `1px solid ${highlight ? "rgba(88,101,242,0.35)" : T.border}`,
        transition: "border-color 0.3s, background 0.3s",
      }}
    >
      <div style={{ flexShrink: 0, width: 36, height: 36, borderRadius: 9, background: "rgba(255,255,255,0.04)", border: `1px solid ${T.border}`, display: "flex", alignItems: "center", justifyContent: "center" }}>
        {icon}
      </div>

      <div style={{ flex: 1, minWidth: 0 }}>
        <div style={{ fontSize: 14, fontWeight: 700, color: T.text, marginBottom: 2 }}>{label}</div>
        {sublabel && <div style={{ fontSize: 12, color: T.textSec }}>{sublabel}</div>}
        {children}
      </div>

      <div style={{ display: "flex", alignItems: "center", gap: 10, flexShrink: 0 }}>
        <StatusPill connected={connected} />
        {connected && onDisconnect && (
          <button
            onClick={onDisconnect}
            disabled={disconnecting || disabledDisconnect}
            title={disabledDisconnect ? "Add another sign-in method before disconnecting" : undefined}
            style={{
              padding: "6px 14px", borderRadius: 7, fontSize: 12, fontWeight: 600,
              fontFamily: "'Outfit', sans-serif",
              background: "transparent", border: "1px solid rgba(255,77,77,0.3)",
              color: disabledDisconnect ? T.textMut : "#FF7070",
              cursor: disabledDisconnect ? "not-allowed" : "pointer",
              opacity: disconnecting ? 0.5 : 1,
              transition: "all 0.15s",
            }}
          >
            {disconnecting ? "Disconnecting…" : "Disconnect"}
          </button>
        )}
        {!connected && onConnect && (
          <button
            onClick={onConnect}
            disabled={connecting}
            style={{
              padding: "6px 14px", borderRadius: 7, fontSize: 12, fontWeight: 600,
              fontFamily: "'Outfit', sans-serif",
              background: "rgba(255,255,255,0.06)", border: `1px solid ${T.borderHi}`,
              color: T.text,
              cursor: connecting ? "wait" : "pointer",
              opacity: connecting ? 0.5 : 1,
              transition: "all 0.15s",
            }}
          >
            {connecting ? "Connecting…" : "Connect"}
          </button>
        )}
      </div>
    </div>
  );
}

// Banner shown when the user has not yet confirmed their email with Leet9.
// Two modes:
//   "confirm"  — email is present (User.email or pendingEmail); nudges user to check inbox.
//   "add"      — no email at all; shows an input form to add one.
function EmailConfirmBanner({ accounts, onDismiss }) {
  const emailToConfirm = accounts.pendingEmail ?? accounts.email;
  const mode = emailToConfirm ? "confirm" : "add";

  const [emailInput, setEmailInput] = useState("");
  const [addState, setAddState] = useState("idle"); // "idle" | "submitting" | "sent"
  const [resendState, setResendState] = useState("idle"); // "idle" | "sending" | "sent"
  const [addError, setAddError] = useState(null);

  async function handleAdd(e) {
    e.preventDefault();
    setAddError(null);
    setAddState("submitting");
    try {
      const res = await fetch("/api/user/email", {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ email: emailInput }),
      });
      const body = await res.json();
      if (!res.ok) {
        setAddError(body?.error?.message ?? "Could not save email. Please try again.");
        setAddState("idle");
      } else {
        setAddState("sent");
      }
    } catch {
      setAddError("Network error. Please try again.");
      setAddState("idle");
    }
  }

  async function handleResend() {
    setResendState("sending");
    try {
      await fetch("/api/auth/send-confirmation", { method: "POST" });
    } catch {
      // Non-fatal
    }
    setResendState("sent");
  }

  return (
    <div style={{
      padding: "16px 20px", borderRadius: 12,
      background: "rgba(200,255,0,0.04)",
      border: "1px solid rgba(200,255,0,0.12)",
      display: "flex", gap: 12, alignItems: "flex-start",
    }}>
      <span style={{ fontSize: 18, flexShrink: 0, marginTop: 1 }}>✉</span>

      <div style={{ flex: 1, minWidth: 0 }}>
        {mode === "confirm" && (
          <>
            <div style={{ fontSize: 13, fontWeight: 700, color: T.text, marginBottom: 4 }}>
              Confirm your email address
            </div>
            <div style={{ fontSize: 12, color: T.textSec, lineHeight: 1.6, marginBottom: 12 }}>
              We sent a confirmation link to <strong style={{ color: T.text }}>{emailToConfirm}</strong>.
              Click it to enable account recovery and security notifications.
            </div>
            <button
              onClick={handleResend}
              disabled={resendState !== "idle"}
              style={{
                padding: "5px 12px", borderRadius: 6, fontSize: 12, fontWeight: 600,
                fontFamily: "'Outfit', sans-serif",
                background: "rgba(255,255,255,0.06)", border: `1px solid ${T.borderHi}`,
                color: resendState === "sent" ? T.green : T.text,
                cursor: resendState !== "idle" ? "default" : "pointer",
                transition: "all 0.15s",
              }}
            >
              {resendState === "sending" ? "Sending…" : resendState === "sent" ? "Sent!" : "Resend"}
            </button>
          </>
        )}

        {mode === "add" && addState !== "sent" && (
          <>
            <div style={{ fontSize: 13, fontWeight: 700, color: T.text, marginBottom: 4 }}>
              Add an email address
            </div>
            <div style={{ fontSize: 12, color: T.textSec, lineHeight: 1.6, marginBottom: 12 }}>
              Add an email to enable account recovery and security notifications.
            </div>
            <form onSubmit={handleAdd} style={{ display: "flex", gap: 8, flexWrap: "wrap" }}>
              <input
                type="email"
                value={emailInput}
                onChange={e => setEmailInput(e.target.value)}
                placeholder="you@example.com"
                required
                style={{
                  flex: "1 1 180px", padding: "6px 12px", borderRadius: 7,
                  fontSize: 13, fontFamily: "'Outfit', sans-serif",
                  background: "rgba(255,255,255,0.05)", border: `1px solid ${T.borderHi}`,
                  color: T.text, outline: "none",
                }}
              />
              <button
                type="submit"
                disabled={addState === "submitting"}
                style={{
                  padding: "6px 14px", borderRadius: 7, fontSize: 12, fontWeight: 600,
                  fontFamily: "'Outfit', sans-serif",
                  background: "rgba(255,255,255,0.06)", border: `1px solid ${T.borderHi}`,
                  color: T.text,
                  cursor: addState === "submitting" ? "wait" : "pointer",
                  opacity: addState === "submitting" ? 0.5 : 1,
                  transition: "all 0.15s",
                }}
              >
                {addState === "submitting" ? "Saving…" : "Send confirmation"}
              </button>
            </form>
            {addError && (
              <div style={{ marginTop: 8, fontSize: 12, color: "#FFB3B3" }}>{addError}</div>
            )}
          </>
        )}

        {mode === "add" && addState === "sent" && (
          <>
            <div style={{ fontSize: 13, fontWeight: 700, color: T.green, marginBottom: 4 }}>
              Check your inbox
            </div>
            <div style={{ fontSize: 12, color: T.textSec, lineHeight: 1.6 }}>
              We sent a confirmation link to <strong style={{ color: T.text }}>{emailInput}</strong>.
              Click it to confirm your address.
            </div>
          </>
        )}
      </div>

      <button
        onClick={onDismiss}
        aria-label="Dismiss"
        style={{
          flexShrink: 0, background: "none", border: "none",
          color: T.textMut, fontSize: 16, cursor: "pointer",
          padding: "2px 4px", lineHeight: 1,
        }}
      >
        ×
      </button>
    </div>
  );
}

export function AccountSettings() {
  const { data: session } = useSession();
  const searchParams = useSearchParams();

  const highlightDiscord = searchParams.get("discord_connect") === "1";
  const justLinked = searchParams.get("discord_linked") === "1";
  const linkError = searchParams.get("discord_link_error");
  const emailConfirmed = searchParams.get("email_confirmed") === "1";
  const confirmError = searchParams.get("confirm_error");

  const [accounts, setAccounts] = useState(null);
  const [loadError, setLoadError] = useState(null);
  const [connecting, setConnecting] = useState(false);
  const [disconnecting, setDisconnecting] = useState(false);
  const [banner, setBanner] = useState(null);

  // Dismissal state for the email confirmation nudge (persisted in localStorage).
  const [confirmNudgeDismissed, setConfirmNudgeDismissed] = useState(() => {
    try { return localStorage.getItem("l9_confirm_nudge_dismissed") === "1"; }
    catch { return false; }
  });

  function dismissConfirmNudge() {
    setConfirmNudgeDismissed(true);
    try { localStorage.setItem("l9_confirm_nudge_dismissed", "1"); } catch {}
  }

  useEffect(() => {
    if (emailConfirmed) {
      setBanner({ type: "success", msg: "Email confirmed — your address is now verified." });
      // Clear dismissed flag: the user has confirmed, banner won't show anyway,
      // but clean up localStorage to avoid stale state.
      try { localStorage.removeItem("l9_confirm_nudge_dismissed"); } catch {}
    } else if (confirmError) {
      const messages = {
        expired: "That confirmation link has expired. Use the Resend button below to get a new one.",
        email_taken: "That email address is already linked to another account. Please try a different address.",
        not_found: "Could not find an account for that confirmation link. Please try again.",
        invalid: "Invalid confirmation link.",
      };
      setBanner({ type: "error", msg: messages[confirmError] ?? "Confirmation failed. Please try again." });
    } else if (justLinked) {
      setBanner({ type: "success", msg: "Discord connected successfully." });
    } else if (linkError) {
      const messages = {
        already_linked_to_another_account: "This Discord account is already linked to another Leet9 user.",
        cancelled: "Discord connection was cancelled.",
        invalid_state: "Invalid OAuth state. Please try again.",
        token_exchange_failed: "Could not connect to Discord. Please try again.",
        not_configured: "Discord sign-in is not configured on this server.",
        db_failed: "A database error occurred. Please try again.",
        network_error: "Network error. Please try again.",
      };
      setBanner({ type: "error", msg: messages[linkError] ?? "Connection failed. Please try again." });
    }
  }, [justLinked, linkError, emailConfirmed, confirmError]);

  useEffect(() => {
    fetch("/api/auth/discord/link/status")
      .then(r => r.json())
      .then(body => setAccounts(body?.data ?? null))
      .catch(() => setLoadError("Could not load account status."));
  }, []);

  async function handleConnect() {
    setConnecting(true);
    window.location.href = "/api/auth/discord/link/initiate?return=/app/settings/account";
  }

  async function handleDisconnect() {
    setDisconnecting(true);
    setBanner(null);
    try {
      const res = await fetch("/api/auth/discord/link", { method: "DELETE" });
      const body = await res.json();
      if (!res.ok) {
        if (body?.error === "LAST_CREDENTIAL") {
          setBanner({ type: "error", msg: "Discord is your only sign-in method. Add another method before disconnecting." });
        } else {
          setBanner({ type: "error", msg: body?.message ?? "Could not disconnect Discord." });
        }
      } else {
        setAccounts(prev => prev ? { ...prev, discord: null } : prev);
        setBanner({ type: "success", msg: "Discord disconnected." });
      }
    } catch {
      setBanner({ type: "error", msg: "Network error. Please try again." });
    } finally {
      setDisconnecting(false);
    }
  }

  // Lockout guard: disable disconnect if this would be the last credential.
  const discordIsOnly = accounts
    ? !accounts.google && !accounts.hasPassword && !accounts.hasEmail && !!accounts.discord
    : false;

  // Show email confirmation nudge when: loaded, not confirmed, not dismissed by user.
  const showConfirmNudge = accounts && !accounts.leet9Confirmed && !confirmNudgeDismissed;

  return (
    <div style={{ display: "flex", flexDirection: "column", gap: 12 }}>
      {banner && (
        <div style={{
          padding: "12px 16px", borderRadius: 10, fontSize: 13, lineHeight: 1.5,
          fontFamily: "'Outfit', sans-serif",
          background: banner.type === "success" ? "rgba(200,255,0,0.07)" : "rgba(255,77,77,0.08)",
          border: `1px solid ${banner.type === "success" ? "rgba(200,255,0,0.2)" : "rgba(255,77,77,0.2)"}`,
          color: banner.type === "success" ? T.green : "#FFB3B3",
        }}>
          {banner.msg}
        </div>
      )}

      {loadError && (
        <div style={{ padding: "12px 16px", borderRadius: 10, fontSize: 13, background: "rgba(255,77,77,0.08)", border: "1px solid rgba(255,77,77,0.2)", color: "#FFB3B3", fontFamily: "'Outfit', sans-serif" }}>
          {loadError}
        </div>
      )}

      {showConfirmNudge && (
        <EmailConfirmBanner
          accounts={accounts}
          onDismiss={dismissConfirmNudge}
        />
      )}

      <div style={{ fontSize: 11, fontWeight: 700, color: T.textMut, letterSpacing: "0.12em", textTransform: "uppercase", marginBottom: 4, fontFamily: "'JetBrains Mono', monospace" }}>
        Sign-in methods
      </div>

      {/* Google */}
      <MethodRow
        icon={<GoogleIcon size={20} />}
        label="Google"
        sublabel={accounts?.google ? `Connected as ${accounts.google}` : "Sign in with your Google account"}
        connected={!!accounts?.google}
      />

      {/* Discord */}
      <MethodRow
        icon={<DiscordIcon size={22} color={accounts?.discord ? T.blurple : T.textMut} />}
        label="Discord"
        sublabel={
          accounts?.discord
            ? `Connected as ${accounts.discord}`
            : highlightDiscord
            ? "Connect Discord to enable Discord sign-in"
            : "Sign in with your Discord account"
        }
        connected={!!accounts?.discord}
        onConnect={handleConnect}
        onDisconnect={handleDisconnect}
        connecting={connecting}
        disconnecting={disconnecting}
        highlight={highlightDiscord && !accounts?.discord}
        disabledDisconnect={discordIsOnly}
      />

      {/* Email & Password */}
      <MethodRow
        icon={<span style={{ fontSize: 18, color: T.textSec }}>@</span>}
        label="Email & Password"
        sublabel={
          accounts?.hasPassword
            ? `Email: ${session?.user?.email ?? "—"}`
            : "No password set — you can sign in via magic link if you have a verified email"
        }
        connected={!!accounts?.hasPassword}
      />

      {/* Magic Link info row */}
      <div style={{
        padding: "14px 20px", borderRadius: 12,
        background: "rgba(255,255,255,0.015)",
        border: `1px solid ${T.border}`,
        fontSize: 12, color: T.textSec, lineHeight: 1.6,
        fontFamily: "'Outfit', sans-serif",
      }}>
        <span style={{ color: T.text, fontWeight: 600 }}>Magic link</span> — if you have a verified email address, you can always request a sign-in link from the login screen. No password required.
      </div>

      <style>{`@keyframes spin { to { transform: rotate(360deg); } }`}</style>
    </div>
  );
}
