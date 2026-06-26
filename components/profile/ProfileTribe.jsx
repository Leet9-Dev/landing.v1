"use client";
import { useState, useEffect, useCallback } from "react";
import { TribeHero } from "@/components/profile/TribeHero";
import { TribeStats } from "@/components/profile/TribeStats";
import { TribeMostPlayedGames } from "@/components/profile/TribeMostPlayedGames";
import { TribeMembers } from "@/components/profile/TribeMembers";
import { TribeActionsPlaceholder } from "@/components/profile/TribeActionsPlaceholder";

export function ProfileTribe() {
  const [data, setData] = useState(null);
  const [loading, setLoading] = useState(true);
  const [errored, setErrored] = useState(false);

  const load = useCallback(async () => {
    setLoading(true);
    setErrored(false);

    // 1) Resolve the current user's tribe + member record + permissions.
    const meRes = await fetch("/api/me/tribe");
    const meJson = await meRes.json();

    if (!meJson.ok) {
      setErrored(true);
      setLoading(false);
      return;
    }

    const { tribe, currentMember, permissions } = meJson.data;

    // No tribe is a valid state — render the empty state.
    if (!tribe) {
      setData({ tribe: null });
      setLoading(false);
      return;
    }

    // 2) Fetch tribe detail (most-played games) and members in parallel.
    const [detailJson, membersJson] = await Promise.all([
      fetch(`/api/tribes/${tribe.id}`).then((r) => r.json()),
      fetch(`/api/tribes/${tribe.id}/members`).then((r) => r.json()),
    ]);

    setData({
      tribe: detailJson.ok ? detailJson.data.tribe : tribe,
      currentMember,
      permissions,
      members: membersJson.ok ? membersJson.data.members : [],
    });
    setLoading(false);
  }, []);

  useEffect(() => {
    const t = setTimeout(load, 0);
    return () => clearTimeout(t);
  }, [load]);

  if (loading) return <LoadingState />;
  if (errored) return <ErrorState />;
  if (!data?.tribe) return <NoTribeState />;

  const { tribe, currentMember, members } = data;

  return (
    <div>
      <TribeHero tribe={tribe} currentRole={currentMember?.role} />
      <TribeStats tribe={tribe} />
      <TribeMostPlayedGames games={tribe.mostPlayedGames} />
      <TribeMembers members={members} />
      <TribeActionsPlaceholder />
    </div>
  );
}

function LoadingState() {
  return (
    <div style={{ display: "flex", flexDirection: "column", gap: 14 }}>
      <div style={{ height: 128, borderRadius: 18, background: "rgba(255,255,255,0.03)", animation: "pulse 1.4s ease infinite" }} />
      <div style={{ display: "grid", gridTemplateColumns: "repeat(auto-fit, minmax(150px, 1fr))", gap: 12 }}>
        {Array.from({ length: 4 }).map((_, i) => (
          <div key={i} style={{ height: 78, borderRadius: 12, background: "rgba(255,255,255,0.03)", animation: "pulse 1.4s ease infinite", animationDelay: `${i * 0.08}s` }} />
        ))}
      </div>
      <div style={{ height: 220, borderRadius: 14, background: "rgba(255,255,255,0.03)", animation: "pulse 1.4s ease infinite" }} />
      <style>{`@keyframes pulse { 0%,100%{opacity:1;} 50%{opacity:0.5;} }`}</style>
    </div>
  );
}

function ErrorState() {
  return (
    <StateCard icon="⬡" title="Tribe unavailable" text="We couldn't load your tribe right now. Please try again." />
  );
}

function NoTribeState() {
  return (
    <StateCard
      icon="⬡"
      title="You're not in a tribe yet"
      text="Tribes are the Leet9 community layer. Joining and creating tribes opens in a later phase."
    />
  );
}

function StateCard({ icon, title, text }) {
  return (
    <div style={{
      textAlign: "center",
      padding: "64px 40px",
      border: "1px dashed rgba(255,255,255,0.08)",
      borderRadius: 16,
      fontFamily: "'Outfit', sans-serif",
    }}>
      <div style={{ fontSize: 30, marginBottom: 12, opacity: 0.2 }}>{icon}</div>
      <div style={{ fontSize: 15, fontWeight: 700, color: "rgba(241,243,249,0.5)", marginBottom: 6 }}>{title}</div>
      <div style={{ fontSize: 13, color: "rgba(241,243,249,0.25)", maxWidth: 420, margin: "0 auto", lineHeight: 1.6 }}>{text}</div>
    </div>
  );
}
