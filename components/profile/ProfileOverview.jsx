"use client";
import { useEffect, useState } from "react";
import { ProfileHero } from "@/components/profile/ProfileHero";
import { PlatformSources } from "@/components/profile/PlatformSources";
import { SignatureGames } from "@/components/profile/SignatureGames";
import { TrophyCase } from "@/components/profile/TrophyCase";
import { FriendsComparison } from "@/components/profile/FriendsComparison";
import { RecentActivity } from "@/components/profile/RecentActivity";

export function ProfileOverview() {
  const [data, setData] = useState(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    fetch("/api/me/profile")
      .then((r) => r.json())
      .then((json) => {
        if (json.ok) setData(json.data);
        setLoading(false);
      });
  }, []);

  if (loading) return <LoadingState />;
  if (!data) return null;

  return (
    <div>
      <ProfileHero user={data.user} />
      <PlatformSources />
      <SignatureGames signatureGames={data.signatureGames} />
      <TrophyCase trophyCase={data.trophyCase} />
      <FriendsComparison friendsComparison={data.friendsComparison} />
      <RecentActivity recentActivity={data.recentActivity} />

      {/* Share card CTA */}
      <div style={{
        borderRadius: 14,
        border: "1px dashed rgba(200,255,0,0.15)",
        background: "rgba(200,255,0,0.02)",
        padding: "20px 24px",
        display: "flex",
        alignItems: "center",
        justifyContent: "space-between",
        gap: 16,
      }}>
        <div>
          <div style={{ fontSize: 13, fontWeight: 700, color: "#F1F3F9", marginBottom: 3 }}>
            Share your Leet9 identity
          </div>
          <div style={{ fontSize: 11, color: "rgba(241,243,249,0.35)" }}>
            A shareable profile card is coming soon.
          </div>
        </div>
        <button
          disabled
          style={{
            padding: "9px 16px",
            borderRadius: 9,
            border: "1px solid rgba(200,255,0,0.15)",
            background: "rgba(200,255,0,0.04)",
            color: "rgba(200,255,0,0.4)",
            fontFamily: "'Outfit', sans-serif",
            fontSize: 12,
            fontWeight: 700,
            cursor: "not-allowed",
            flexShrink: 0,
          }}
        >
          Share Card · Soon
        </button>
      </div>
    </div>
  );
}

function LoadingState() {
  return (
    <div style={{ display: "flex", flexDirection: "column", gap: 12 }}>
      {Array.from({ length: 3 }).map((_, i) => (
        <div key={i} style={{
          height: i === 0 ? 110 : 80,
          borderRadius: 14,
          background: "rgba(255,255,255,0.03)",
          animation: "pulse 1.4s ease infinite",
          animationDelay: `${i * 0.1}s`,
        }} />
      ))}
      <style>{`@keyframes pulse { 0%,100%{opacity:1;} 50%{opacity:0.5;} }`}</style>
    </div>
  );
}
