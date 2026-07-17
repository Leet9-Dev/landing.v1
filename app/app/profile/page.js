"use client";
import { useState, useEffect } from "react";
import { ProfileHero } from "@/components/profile/ProfileHero";
import { ProfileTabs } from "@/components/profile/ProfileTabs";
import { ProfileOverview } from "@/components/profile/ProfileOverview";
import { ProfileGames } from "@/components/profile/ProfileGames";
import { ProfileStats } from "@/components/profile/ProfileStats";
import { ProfileTribe } from "@/components/profile/ProfileTribe";

function ProfileHeroSection() {
  const [user, setUser] = useState(null);

  useEffect(() => {
    fetch("/api/me/profile")
      .then((r) => r.json())
      .then((json) => { if (json.ok) setUser(json.data.user); });
  }, []);

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

  return <ProfileHero user={user} />;
}

export default function ProfilePage() {
  const [activeTab, setActiveTab] = useState("overview");

  return (
    <div className="l9-profile-page" style={{ padding: "36px 32px", fontFamily: "'Outfit', sans-serif" }}>
      <style>{`
        @media (max-width: 639px) {
          .l9-profile-page { padding: 20px 16px !important; }
        }
      `}</style>

      <ProfileHeroSection />
      <ProfileTabs active={activeTab} onChange={setActiveTab} />

      {activeTab === "overview" && <ProfileOverview />}
      {activeTab === "games" && <ProfileGames />}
      {activeTab === "stats" && <ProfileStats />}
      {activeTab === "tribe" && <ProfileTribe />}
    </div>
  );
}
