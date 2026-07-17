"use client";
import { useEffect, useState } from "react";
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
      <PlatformSources />
      <SignatureGames signatureGames={data.signatureGames} />
      <TrophyCase trophyCase={data.trophyCase} />
      <FriendsComparison friendsComparison={data.friendsComparison} />
      <RecentActivity recentActivity={data.recentActivity} />

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
