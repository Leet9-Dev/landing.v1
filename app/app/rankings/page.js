"use client";
import { useState } from "react";
import { RankingsTabs } from "@/components/rankings/RankingsTabs";
import { PlayerRankings } from "@/components/rankings/PlayerRankings";
import { GameRankings } from "@/components/rankings/GameRankings";
import { TribeRankings } from "@/components/rankings/TribeRankings";

export default function RankingsPage() {
  const [activeTab, setActiveTab] = useState("players");

  return (
    <div className="l9-rankings-page" style={{ padding: "36px 32px", fontFamily: "'Outfit', sans-serif" }}>
      <style>{`@media (max-width: 639px) { .l9-rankings-page { padding: 20px 16px !important; } }`}</style>
      <div style={{ marginBottom: 20 }}>
        <h1 style={{ fontSize: 26, fontWeight: 800, color: "#F1F3F9", letterSpacing: "-0.02em", marginBottom: 6 }}>
          Rankings
        </h1>
        <p style={{ fontSize: 13, color: "rgba(241,243,249,0.38)", fontWeight: 500 }}>
          How players, games, and tribes compare across Leet9.
        </p>
      </div>

      <RankingsTabs active={activeTab} onChange={setActiveTab} />

      {activeTab === "players" && <PlayerRankings />}
      {activeTab === "games" && <GameRankings />}
      {activeTab === "tribes" && <TribeRankings />}
    </div>
  );
}
