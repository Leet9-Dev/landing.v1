"use client";
import { PlatformHub } from "@/components/settings/PlatformHub";

export default function PlatformHubPage() {
  return (
    <div style={{ padding: "36px 32px", fontFamily: "'Outfit', sans-serif", maxWidth: 900 }}>
      <div style={{ marginBottom: 32 }}>
        <div style={{ fontSize: 22, fontWeight: 800, color: "#F1F3F9", letterSpacing: "-0.02em", marginBottom: 6 }}>
          Platform Hub
        </div>
        <div style={{ fontSize: 13, color: "rgba(241,243,249,0.4)", lineHeight: 1.6 }}>
          Connect your gaming accounts to sync your library, achievements, and playtime into Leet9.
          All platforms feed the same unified game catalogue.
        </div>
      </div>
      <PlatformHub />
    </div>
  );
}
