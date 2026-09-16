"use client";
import { Suspense } from "react";
import { SettingsNav } from "@/components/settings/SettingsNav";
import { AccountSettings } from "@/components/settings/AccountSettings";

export default function AccountSettingsPage() {
  return (
    <div className="l9-settings-page" style={{ padding: "36px 32px", fontFamily: "'Outfit', sans-serif", maxWidth: 900 }}>
      <style>{`
        @media (max-width: 639px) {
          .l9-settings-page { padding: 20px 16px !important; }
        }
      `}</style>
      <SettingsNav />
      <div style={{ marginBottom: 32 }}>
        <div style={{ fontSize: 22, fontWeight: 800, color: "#F1F3F9", letterSpacing: "-0.02em", marginBottom: 6 }}>
          Account
        </div>
        <div style={{ fontSize: 13, color: "rgba(241,243,249,0.4)", lineHeight: 1.6 }}>
          Manage how you sign in to Leet9. Each connected method is an independent
          way to access your account.
        </div>
      </div>
      <Suspense>
        <AccountSettings />
      </Suspense>
    </div>
  );
}
