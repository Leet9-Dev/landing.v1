"use client";
import { useState, useEffect, useCallback } from "react";
import { StatsSummaryCards } from "@/components/profile/StatsSummaryCards";
import { PointsBreakdown } from "@/components/profile/PointsBreakdown";
import { PlatformConfidence } from "@/components/profile/PlatformConfidence";
import { GamerDNA } from "@/components/profile/GamerDNA";
import { MomentumPanel } from "@/components/profile/MomentumPanel";
import { MasterySummary } from "@/components/profile/MasterySummary";
import { RarityBreakdown } from "@/components/profile/RarityBreakdown";
import { TopGamesByHours } from "@/components/profile/TopGamesByHours";
import { SectionLabel } from "@/components/profile/sectionPrimitives";

export function ProfileStats() {
  const [stats, setStats] = useState(null);
  const [loading, setLoading] = useState(true);
  const [errored, setErrored] = useState(false);

  const load = useCallback(async () => {
    setLoading(true);
    const res = await fetch("/api/me/stats");
    const json = await res.json();
    if (json.ok) {
      setStats(json.data);
      setErrored(false);
    } else {
      setErrored(true);
    }
    setLoading(false);
  }, []);

  useEffect(() => {
    const t = setTimeout(load, 0);
    return () => clearTimeout(t);
  }, [load]);

  if (loading) return <LoadingState />;
  if (errored || !stats) return <ErrorState />;

  return (
    <div>
      {/* Explainability intro */}
      <div style={{
        display: "flex",
        alignItems: "center",
        gap: 10,
        flexWrap: "wrap",
        marginBottom: 20,
        fontSize: 12,
        color: "rgba(241,243,249,0.4)",
      }}>
        <span style={{
          padding: "3px 10px",
          borderRadius: 99,
          background: "rgba(200,255,0,0.07)",
          border: "1px solid rgba(200,255,0,0.2)",
          color: "#C8FF00",
          fontWeight: 700,
          fontSize: 11,
        }}>
          Confidence: {stats.confidence}
        </span>
        <span>
          Every signal below is explained by what it&apos;s based on. These are mock figures until
          Steam and PSN data are connected.
        </span>
        <span style={{ marginLeft: "auto", fontSize: 11, color: "rgba(241,243,249,0.25)" }}>
          Calculated {new Date(stats.calculatedAt).toLocaleDateString()}
        </span>
      </div>

      <StatsSummaryCards stats={stats} />

      {/* Two-column analytical dashboard, collapses to one column when narrow */}
      <div style={{
        display: "grid",
        gridTemplateColumns: "repeat(auto-fit, minmax(340px, 1fr))",
        columnGap: 20,
        alignItems: "start",
      }}>
        <PointsBreakdown pointsBreakdown={stats.pointsBreakdown} />
        <PlatformConfidence
          platformSplit={stats.platformSplit}
          confidence={stats.confidence}
          confidenceReason={stats.confidenceReason}
        />
        <GamerDNA dna={stats.dna} />
        <MomentumPanel momentum={stats.momentum} monthly={stats.monthly} />
        <MasterySummary mastery={stats.mastery} />
        <RarityBreakdown rarityBreakdown={stats.rarityBreakdown} />
        <TopGamesByHours topGamesByHours={stats.topGamesByHours} />
        <GenreDistribution genres={stats.genres} />
      </div>
    </div>
  );
}

function GenreDistribution({ genres }) {
  if (!genres?.length) return null;
  return (
    <div style={{ marginBottom: 28 }}>
      <SectionLabel>Genre Distribution</SectionLabel>
      <div style={{
        borderRadius: 12,
        border: "1px solid rgba(255,255,255,0.07)",
        background: "rgba(255,255,255,0.02)",
        padding: 18,
        display: "flex",
        flexDirection: "column",
        gap: 12,
      }}>
        {genres.map((g) => (
          <div key={g.genre}>
            <div style={{ display: "flex", justifyContent: "space-between", marginBottom: 4 }}>
              <span style={{ fontSize: 12, fontWeight: 700, color: "#F1F3F9" }}>{g.genre}</span>
              <span style={{ fontSize: 12, fontWeight: 600, color: "rgba(241,243,249,0.5)" }}>{g.share}%</span>
            </div>
            <div style={{ height: 6, borderRadius: 99, background: "rgba(255,255,255,0.06)", overflow: "hidden" }}>
              <div style={{
                height: "100%",
                width: `${g.share}%`,
                background: "linear-gradient(90deg, #7C3AED, #c8aaff)",
                borderRadius: 99,
                minWidth: 4,
              }} />
            </div>
          </div>
        ))}
        <div style={{ fontSize: 11, color: "rgba(241,243,249,0.35)", lineHeight: 1.6, marginTop: 2 }}>
          Based on the genres of the games in your tracked library.
        </div>
      </div>
    </div>
  );
}

function LoadingState() {
  return (
    <div style={{ display: "flex", flexDirection: "column", gap: 14 }}>
      <div style={{ height: 84, borderRadius: 12, background: "rgba(255,255,255,0.03)", animation: "pulse 1.4s ease infinite" }} />
      <div style={{ display: "grid", gridTemplateColumns: "repeat(auto-fit, minmax(340px, 1fr))", gap: 20 }}>
        {Array.from({ length: 4 }).map((_, i) => (
          <div key={i} style={{
            height: 200,
            borderRadius: 12,
            background: "rgba(255,255,255,0.03)",
            animation: "pulse 1.4s ease infinite",
            animationDelay: `${i * 0.1}s`,
          }} />
        ))}
      </div>
      <style>{`@keyframes pulse { 0%,100%{opacity:1;} 50%{opacity:0.5;} }`}</style>
    </div>
  );
}

function ErrorState() {
  return (
    <div style={{
      textAlign: "center",
      padding: "64px 40px",
      border: "1px dashed rgba(255,255,255,0.08)",
      borderRadius: 16,
      fontFamily: "'Outfit', sans-serif",
    }}>
      <div style={{ fontSize: 30, marginBottom: 12, opacity: 0.2 }}>◆</div>
      <div style={{ fontSize: 15, fontWeight: 700, color: "rgba(241,243,249,0.5)", marginBottom: 6 }}>
        Stats unavailable
      </div>
      <div style={{ fontSize: 13, color: "rgba(241,243,249,0.25)" }}>
        We couldn&apos;t load your stats right now. Please try again.
      </div>
    </div>
  );
}
