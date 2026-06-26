"use client";
import { useState } from "react";
import { ProfileTabs } from "@/components/profile/ProfileTabs";
import { ProfileOverview } from "@/components/profile/ProfileOverview";
import { ProfileGames } from "@/components/profile/ProfileGames";
import { ProfileStats } from "@/components/profile/ProfileStats";
import { ProfileTribe } from "@/components/profile/ProfileTribe";

export default function ProfilePage() {
  const [activeTab, setActiveTab] = useState("overview");

  return (
    <div style={{ padding: "36px 32px", fontFamily: "'Outfit', sans-serif" }}>
      <ProfileTabs active={activeTab} onChange={setActiveTab} />

      {activeTab === "overview" && <ProfileOverview />}
      {activeTab === "games" && <ProfileGames />}
      {activeTab === "stats" && <ProfileStats />}
      {activeTab === "tribe" && <ProfileTribe />}
    </div>
  );
}
