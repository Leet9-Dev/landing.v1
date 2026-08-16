"use client";
import { useState, useEffect, useCallback } from "react";
import ShelfView from "./_client/ShelfView";

export default function DiscoveryPage() {
  const [games, setGames] = useState([]);
  const [loading, setLoading] = useState(true);

  const fetchGames = useCallback(async () => {
    try {
      const res = await fetch("/api/discovery/games?sort=trending&limit=50");
      const json = await res.json();
      if (json.ok) setGames(json.data.games);
    } catch {
      // silently fail — shelf shows empty
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    fetchGames();
  }, [fetchGames]);

  if (loading) return <ShelfSkeleton />;
  if (!games.length) return <ShelfEmpty />;

  return <ShelfView games={games} />;
}

function ShelfSkeleton() {
  return (
    <div
      style={{
        height: "calc(100vh - 56px)",
        background: "#E8E3D8",
        display: "flex",
        alignItems: "center",
        justifyContent: "center",
      }}
    >
      <div
        style={{
          width: 8,
          height: 8,
          borderRadius: "50%",
          background: "#9A7E56",
          animation: "pulse 1.2s ease infinite",
        }}
      />
      <style>{`@keyframes pulse{0%,100%{opacity:1}50%{opacity:0.25}}`}</style>
    </div>
  );
}

function ShelfEmpty() {
  return (
    <div
      style={{
        height: "calc(100vh - 56px)",
        background: "#E8E3D8",
        display: "flex",
        flexDirection: "column",
        alignItems: "center",
        justifyContent: "center",
        fontFamily: "Georgia, serif",
        color: "#4A3010",
      }}
    >
      <div style={{ fontSize: 32, marginBottom: 12, opacity: 0.3 }}>📚</div>
      <div style={{ fontSize: 18, fontWeight: 400, opacity: 0.5 }}>
        The shelf is empty.
      </div>
    </div>
  );
}
