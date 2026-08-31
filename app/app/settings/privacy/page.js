"use client";
import { useState } from "react";
import { signOut } from "next-auth/react";
import { SettingsNav } from "@/components/settings/SettingsNav";

export default function PrivacySettingsPage() {
  const [exporting, setExporting] = useState(false);
  const [deleteConfirm, setDeleteConfirm] = useState(false);
  const [deleting, setDeleting] = useState(false);
  const [deleteInput, setDeleteInput] = useState("");
  const [error, setError] = useState(null);

  async function handleExport() {
    setExporting(true);
    try {
      const res = await fetch("/api/me/export");
      if (!res.ok) throw new Error("Export failed");
      const blob = await res.blob();
      const url = URL.createObjectURL(blob);
      const a = document.createElement("a");
      a.href = url;
      a.download = `leet9-data-${Date.now()}.json`;
      document.body.appendChild(a);
      a.click();
      a.remove();
      URL.revokeObjectURL(url);
    } catch (e) {
      setError("Export failed. Please try again.");
    } finally {
      setExporting(false);
    }
  }

  async function handleDelete() {
    if (deleteInput !== "DELETE") return;
    setDeleting(true);
    setError(null);
    try {
      const res = await fetch("/api/me", {
        method: "DELETE",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ confirm: "DELETE" }),
      });
      const json = await res.json();
      if (!json.ok) throw new Error(json.error || "Deletion failed");
      await signOut({ callbackUrl: "/" });
    } catch (e) {
      setError(e.message || "Deletion failed. Please try again.");
      setDeleting(false);
    }
  }

  const s = {
    page: { padding: "36px 32px", fontFamily: "'Outfit', sans-serif", maxWidth: 640 },
    h1: { fontSize: 22, fontWeight: 800, color: "#F1F3F9", letterSpacing: "-0.02em", marginBottom: 6 },
    sub: { fontSize: 13, color: "rgba(241,243,249,0.4)", lineHeight: 1.6, marginBottom: 40 },
    section: { marginBottom: 36 },
    sectionTitle: { fontSize: 13, fontWeight: 700, color: "rgba(241,243,249,0.5)", letterSpacing: "0.06em", textTransform: "uppercase", marginBottom: 14 },
    card: { borderRadius: 12, border: "1px solid rgba(255,255,255,0.07)", background: "rgba(255,255,255,0.02)", padding: "20px 20px" },
    cardTitle: { fontSize: 15, fontWeight: 700, color: "#F1F3F9", marginBottom: 6 },
    cardDesc: { fontSize: 13, color: "rgba(241,243,249,0.4)", lineHeight: 1.55, marginBottom: 16 },
    btn: (variant) => ({
      padding: "9px 20px",
      borderRadius: 8,
      border: variant === "danger" ? "1px solid rgba(255,60,60,0.35)" : "1px solid rgba(200,255,0,0.3)",
      background: variant === "danger" ? "rgba(255,60,60,0.08)" : "rgba(200,255,0,0.07)",
      color: variant === "danger" ? "#FF6B6B" : "#C8FF00",
      fontSize: 13,
      fontWeight: 700,
      cursor: "pointer",
      fontFamily: "'Outfit', sans-serif",
    }),
    input: {
      width: "100%",
      padding: "9px 12px",
      borderRadius: 8,
      border: "1px solid rgba(255,60,60,0.3)",
      background: "rgba(255,255,255,0.03)",
      color: "#F1F3F9",
      fontFamily: "'Outfit', sans-serif",
      fontSize: 13,
      outline: "none",
      marginBottom: 12,
      boxSizing: "border-box",
    },
    error: { fontSize: 12, color: "#FF6B6B", marginTop: 10 },
  };

  return (
    <div className="l9-settings-page" style={s.page}>
      <style>{`@media (max-width: 639px) { .l9-settings-page { padding: 20px 16px !important; } }`}</style>
      <SettingsNav />
      <div style={s.h1}>Privacy &amp; Data</div>
      <div style={s.sub}>Manage your personal data in accordance with GDPR. You can export a copy of your data or permanently delete your account.</div>

      <div style={s.section}>
        <div style={s.sectionTitle}>Your Data</div>
        <div style={s.card}>
          <div style={s.cardTitle}>Export your data</div>
          <div style={s.cardDesc}>
            Download a JSON file containing your profile, game library, platform connections, reviews, badges, and points history.
          </div>
          <button style={s.btn("primary")} onClick={handleExport} disabled={exporting}>
            {exporting ? "Preparing export…" : "Download my data"}
          </button>
        </div>
      </div>

      <div style={s.section}>
        <div style={s.sectionTitle}>Danger Zone</div>
        <div style={{ ...s.card, border: "1px solid rgba(255,60,60,0.15)" }}>
          <div style={s.cardTitle}>Delete account</div>
          <div style={s.cardDesc}>
            Permanently deletes your Leet9 account, game library, platform connections, reviews, and all associated data. This action cannot be undone.
          </div>
          {!deleteConfirm ? (
            <button style={s.btn("danger")} onClick={() => setDeleteConfirm(true)}>
              Delete my account
            </button>
          ) : (
            <div>
              <div style={{ fontSize: 13, color: "rgba(241,243,249,0.5)", marginBottom: 10 }}>
                Type <strong style={{ color: "#F1F3F9" }}>DELETE</strong> to confirm:
              </div>
              <input
                style={s.input}
                type="text"
                placeholder="DELETE"
                value={deleteInput}
                onChange={(e) => setDeleteInput(e.target.value)}
              />
              <div style={{ display: "flex", gap: 10 }}>
                <button
                  style={{ ...s.btn("danger"), opacity: deleteInput !== "DELETE" ? 0.4 : 1 }}
                  onClick={handleDelete}
                  disabled={deleting || deleteInput !== "DELETE"}
                >
                  {deleting ? "Deleting…" : "Confirm deletion"}
                </button>
                <button
                  style={{ ...s.btn("primary"), border: "1px solid rgba(255,255,255,0.1)", color: "rgba(241,243,249,0.4)", background: "transparent" }}
                  onClick={() => { setDeleteConfirm(false); setDeleteInput(""); }}
                >
                  Cancel
                </button>
              </div>
            </div>
          )}
          {error && <div style={s.error}>{error}</div>}
        </div>
      </div>

      <div style={{ fontSize: 12, color: "rgba(241,243,249,0.2)", lineHeight: 1.6 }}>
        For other GDPR requests (rectification, restriction, portability), email{" "}
        <a href="mailto:tech@leet9.com" style={{ color: "rgba(200,255,0,0.5)", textDecoration: "none" }}>tech@leet9.com</a>.
        We respond within 30 days.
      </div>
    </div>
  );
}
