"use client";
import { useState, useEffect } from "react";
import { useRouter } from "next/navigation";
import { ProfileHero } from "@/components/profile/ProfileHero";
import { ProfileTabs } from "@/components/profile/ProfileTabs";
import { ProfileOverview } from "@/components/profile/ProfileOverview";
import { ProfileGames } from "@/components/profile/ProfileGames";
import { ProfileStats } from "@/components/profile/ProfileStats";
import { ProfileTribe } from "@/components/profile/ProfileTribe";

function NoPlatformsBanner({ onConnect }) {
  return (
    <div style={{
      borderRadius: 14,
      border: "1px solid rgba(200,255,0,0.2)",
      background: "linear-gradient(135deg, rgba(200,255,0,0.06) 0%, rgba(124,58,237,0.06) 100%)",
      padding: "20px 24px",
      marginBottom: 24,
      display: "flex",
      alignItems: "center",
      justifyContent: "space-between",
      gap: 16,
      flexWrap: "wrap",
    }}>
      <div>
        <div style={{ fontSize: 15, fontWeight: 800, color: "#F1F3F9", marginBottom: 4, letterSpacing: "-0.01em" }}>
          🎮 Your library is empty — let's fix that.
        </div>
        <div style={{ fontSize: 13, color: "rgba(241,243,249,0.5)", lineHeight: 1.5 }}>
          Connect Steam or PSN to sync your games, earn L9 Points, and climb the rankings.
        </div>
      </div>
      <button
        onClick={onConnect}
        style={{
          padding: "10px 22px",
          borderRadius: 10,
          border: "none",
          background: "linear-gradient(135deg, #C8FF00, #a3e600)",
          color: "#07080F",
          fontFamily: "'Outfit', sans-serif",
          fontSize: 13,
          fontWeight: 800,
          cursor: "pointer",
          whiteSpace: "nowrap",
          flexShrink: 0,
          letterSpacing: "-0.01em",
        }}
      >
        Connect a platform →
      </button>
    </div>
  );
}

function ProfileHeroSection({ onUserUpdate }) {
  const [user, setUser] = useState(null);

  useEffect(() => {
    fetch("/api/me/profile")
      .then((r) => r.json())
      .then((json) => { if (json.ok) setUser(json.data.user); });
  }, []);

  function handleUpdate(updated) {
    setUser(updated);
    onUserUpdate?.(updated);
  }

  if (!user) return (
    <div style={{
      height: 220, borderRadius: 18,
      background: "rgba(255,255,255,0.03)",
      marginBottom: 28,
      animation: "pulse 1.4s ease infinite",
    }}>
      <style>{`@keyframes pulse { 0%,100%{opacity:1;} 50%{opacity:0.4;} }`}</style>
    </div>
  );

  return <ProfileHero user={user} onUserUpdate={handleUpdate} />;
}

export default function ProfilePage() {
  const router = useRouter();
  const [activeTab, setActiveTab] = useState("overview");
  const [user, setUser] = useState(null);

  const noPlatforms = user && user.platformsConnected?.length === 0;

  return (
    <div className="l9-profile-page" style={{ padding: "36px 32px", fontFamily: "'Outfit', sans-serif" }}>
      <style>{`
        @media (max-width: 639px) {
          .l9-profile-page { padding: 20px 16px !important; }
        }
      `}</style>

      <ProfileHeroSection onUserUpdate={setUser} />

      {noPlatforms && (
        <NoPlatformsBanner onConnect={() => router.push("/app/settings/platforms")} />
      )}

      <ProfileTabs active={activeTab} onChange={setActiveTab} />

      {activeTab === "overview" && <ProfileOverview />}
      {activeTab === "games" && <ProfileGames />}
      {activeTab === "stats" && <ProfileStats />}
      {activeTab === "tribe" && <ProfileTribe />}
    </div>
  );
}
