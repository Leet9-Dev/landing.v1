"use client";
import { useState, useRef } from "react";

const PRESET_AVATARS = [
  { id: "controller", label: "Controller", src: "/avatars/controller.svg" },
  { id: "sword",      label: "Sword",      src: "/avatars/sword.svg" },
  { id: "skull",      label: "Skull",      src: "/avatars/skull.svg" },
  { id: "lightning",  label: "Lightning",  src: "/avatars/lightning.svg" },
  { id: "fire",       label: "Fire",       src: "/avatars/fire.svg" },
  { id: "trophy",     label: "Trophy",     src: "/avatars/trophy.svg" },
  { id: "diamond",    label: "Diamond",    src: "/avatars/diamond.svg" },
  { id: "crosshair",  label: "Crosshair",  src: "/avatars/crosshair.svg" },
  { id: "crown",      label: "Crown",      src: "/avatars/crown.svg" },
  { id: "rocket",     label: "Rocket",     src: "/avatars/rocket.svg" },
  { id: "shield",     label: "Shield",     src: "/avatars/shield.svg" },
  { id: "l9",         label: "L9",         src: "/avatars/l9.svg" },
  { id: "knight",     label: "Knight",     src: "/avatars/knight.svg" },
  { id: "wizard",     label: "Wizard",     src: "/avatars/wizard.svg" },
  { id: "archer",     label: "Archer",     src: "/avatars/archer.svg" },
  { id: "ninja",      label: "Ninja",      src: "/avatars/ninja.svg" },
  { id: "robot",      label: "Robot",      src: "/avatars/robot.svg" },
  { id: "alien",      label: "Alien",      src: "/avatars/alien.svg" },
  { id: "zombie",     label: "Zombie",     src: "/avatars/zombie.svg" },
  { id: "spacemarine",label: "Space Marine",src: "/avatars/spacemarine.svg" },
  { id: "cyberpunk",  label: "Cyberpunk",  src: "/avatars/cyberpunk.svg" },
  { id: "elf",        label: "Elf",        src: "/avatars/elf.svg" },
];

export function AvatarPicker({ currentUrl, onClose, onSaved }) {
  const [selected, setSelected] = useState(null);
  const [saving, setSaving] = useState(false);
  const [uploading, setUploading] = useState(false);
  const [error, setError] = useState(null);
  const fileRef = useRef(null);

  async function handlePresetSave() {
    if (!selected) return;
    setSaving(true); setError(null);
    try {
      const res = await fetch("/api/me/avatar", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ url: selected.src }),
      });
      const json = await res.json();
      if (!json.ok) throw new Error(json.error?.message || "Failed to save");
      onSaved(selected.src);
    } catch (e) {
      setError(e.message);
    } finally {
      setSaving(false);
    }
  }

  async function handleFileUpload(e) {
    const file = e.target.files?.[0];
    if (!file) return;
    if (!file.type.startsWith("image/")) { setError("Please select an image file."); return; }
    if (file.size > 4.5 * 1024 * 1024) { setError("Image must be under 4.5 MB."); return; }
    setUploading(true); setError(null);
    try {
      const form = new FormData();
      form.append("file", file);
      const res = await fetch("/api/me/avatar", { method: "POST", body: form });
      const json = await res.json();
      if (!json.ok) throw new Error(json.error?.message || "Upload failed");
      onSaved(json.url);
    } catch (e) {
      setError(e.message);
    } finally {
      setUploading(false);
    }
  }

  const busy = saving || uploading;

  return (
    <div style={{
      position: "fixed", inset: 0, zIndex: 1000,
      background: "rgba(7,8,15,0.85)", backdropFilter: "blur(8px)",
      display: "flex", alignItems: "center", justifyContent: "center",
      padding: "16px", fontFamily: "'Outfit', sans-serif",
    }} onClick={(e) => { if (e.target === e.currentTarget) onClose(); }}>
      <div style={{
        width: "100%", maxWidth: 520,
        background: "#0D0F1A",
        border: "1px solid rgba(255,255,255,0.1)",
        borderRadius: 20,
        overflow: "hidden",
        maxHeight: "90vh",
        display: "flex", flexDirection: "column",
      }}>
        {/* Header */}
        <div style={{
          display: "flex", alignItems: "center", justifyContent: "space-between",
          padding: "20px 24px 16px",
          borderBottom: "1px solid rgba(255,255,255,0.07)",
        }}>
          <div>
            <div style={{ fontSize: 16, fontWeight: 800, color: "#F1F3F9" }}>Choose your avatar</div>
            <div style={{ fontSize: 12, color: "rgba(241,243,249,0.4)", marginTop: 2 }}>Pick a preset or upload your own</div>
          </div>
          <button onClick={onClose} style={{
            background: "none", border: "none", color: "rgba(255,255,255,0.4)",
            fontSize: 20, cursor: "pointer", lineHeight: 1, padding: 4,
          }}>✕</button>
        </div>

        {/* Grid */}
        <div style={{ overflowY: "auto", padding: "20px 24px", flex: 1 }}>
          <div style={{
            display: "grid", gridTemplateColumns: "repeat(4, 1fr)", gap: 10,
          }}>
            {PRESET_AVATARS.map((av) => {
              const isSelected = selected?.id === av.id;
              const isCurrent = !selected && currentUrl === av.src;
              return (
                <button
                  key={av.id}
                  onClick={() => setSelected(av)}
                  title={av.label}
                  style={{
                    padding: 0, border: "2px solid",
                    borderColor: isSelected ? "#C8FF00" : isCurrent ? "rgba(200,255,0,0.4)" : "rgba(255,255,255,0.08)",
                    borderRadius: 12,
                    background: isSelected ? "rgba(200,255,0,0.08)" : "rgba(255,255,255,0.03)",
                    cursor: "pointer",
                    overflow: "hidden",
                    transition: "border-color 0.15s, background 0.15s",
                    aspectRatio: "1",
                  }}
                >
                  <img src={av.src} alt={av.label} style={{ width: "100%", height: "100%", display: "block" }} />
                </button>
              );
            })}
          </div>
        </div>

        {/* Footer */}
        <div style={{
          padding: "16px 24px 20px",
          borderTop: "1px solid rgba(255,255,255,0.07)",
          display: "flex", flexDirection: "column", gap: 10,
        }}>
          {error && (
            <div style={{ fontSize: 12, color: "#f87171", padding: "6px 10px", borderRadius: 8, background: "rgba(248,113,113,0.08)", border: "1px solid rgba(248,113,113,0.2)" }}>
              {error}
            </div>
          )}
          <div style={{ display: "flex", gap: 10 }}>
            <button
              onClick={() => fileRef.current?.click()}
              disabled={busy}
              style={{
                flex: 1, padding: "11px", borderRadius: 10,
                border: "1px solid rgba(255,255,255,0.12)",
                background: "rgba(255,255,255,0.04)",
                color: "rgba(241,243,249,0.7)", fontFamily: "'Outfit', sans-serif",
                fontSize: 13, fontWeight: 600, cursor: busy ? "wait" : "pointer",
              }}
            >
              {uploading ? "Uploading…" : "📤 Upload photo"}
            </button>
            <button
              onClick={handlePresetSave}
              disabled={!selected || busy}
              style={{
                flex: 1, padding: "11px", borderRadius: 10, border: "none",
                background: selected && !busy ? "linear-gradient(135deg,#C8FF00,#AAEE00)" : "rgba(200,255,0,0.25)",
                color: "#07080F", fontFamily: "'Outfit', sans-serif",
                fontSize: 13, fontWeight: 800,
                cursor: selected && !busy ? "pointer" : "not-allowed",
                transition: "background 0.15s",
              }}
            >
              {saving ? "Saving…" : "Save avatar"}
            </button>
          </div>
          <input ref={fileRef} type="file" accept="image/*" style={{ display: "none" }} onChange={handleFileUpload} />
        </div>
      </div>
    </div>
  );
}
