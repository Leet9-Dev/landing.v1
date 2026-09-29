"use client";
import { useState, useEffect, useRef, Suspense } from "react";
import { useRouter } from "next/navigation";
import { ProfileHero } from "@/components/profile/ProfileHero";
import { ProfileTabs } from "@/components/profile/ProfileTabs";
import { ProfileOverview } from "@/components/profile/ProfileOverview";
import { ProfileGames } from "@/components/profile/ProfileGames";
import { ProfileTribe } from "@/components/profile/ProfileTribe";
import { PlatformSources } from "@/components/profile/PlatformSources";
import { NextRewards } from "@/components/profile/NextRewards";
import { EarnGuide } from "@/components/profile/EarnGuide";
import { ShareCardModal } from "@/components/ShareCardModal";

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

function NoGamesBanner({ onSync }) {
  return (
    <div style={{
      borderRadius: 14,
      border: "1px solid rgba(185,216,245,0.2)",
      background: "linear-gradient(135deg, rgba(185,216,245,0.05) 0%, rgba(200,170,255,0.05) 100%)",
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
          Platform connected — sync your library to get started.
        </div>
        <div style={{ fontSize: 13, color: "rgba(241,243,249,0.5)", lineHeight: 1.5 }}>
          Hit Sync Now in Platform Hub to import your games, hours, and trophies.
        </div>
      </div>
      <button
        onClick={onSync}
        style={{
          padding: "10px 22px",
          borderRadius: 10,
          border: "1px solid rgba(185,216,245,0.3)",
          background: "rgba(185,216,245,0.08)",
          color: "#b9d8f5",
          fontFamily: "'Outfit', sans-serif",
          fontSize: 13,
          fontWeight: 800,
          cursor: "pointer",
          whiteSpace: "nowrap",
          flexShrink: 0,
          letterSpacing: "-0.01em",
        }}
      >
        Go to Platform Hub →
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
  const [shareCardData, setShareCardData] = useState(null);
  const [shareCardType, setShareCardType] = useState("rank-up");
  const [showShareToast, setShowShareToast] = useState(false);
  const [showShareModal, setShowShareModal] = useState(false);
  const toastTimer = useRef(null);

  const noPlatforms = user && user.platformsConnected?.length === 0;
  const noGames = user && user.platformsConnected?.length > 0 && user.gamesCount === 0;

  function triggerShareToast(type, data) {
    setShareCardType(type);
    setShareCardData(data);
    setShowShareToast(true);
    if (toastTimer.current) clearTimeout(toastTimer.current);
    toastTimer.current = setTimeout(() => setShowShareToast(false), 6000);
  }

  async function handleSyncComplete({ provider, summary }) {
    // Rank-up toast takes priority if rank improved.
    if (summary.rankAfter != null && summary.rankBefore != null && summary.rankAfter < summary.rankBefore) {
      triggerShareToast("rank-up", {
        rank: summary.rankAfter,
        delta: summary.rankBefore - summary.rankAfter,
        platform: provider,
      });
      return;
    }
    // Otherwise check for newly unlocked badges.
    try {
      const res = await fetch("/api/me/badges/recent");
      const json = await res.json();
      if (json.ok && json.data.badges.length > 0) {
        const badge = json.data.badges[0];
        triggerShareToast("badge", {
          badgeName: badge.brandedName,
          tier: badge.tier,
          game: "",
          icon: "🏆",
        });
      }
    } catch {}
  }

  return (
    <div className="l9-profile-page" style={{ padding: "36px 32px", fontFamily: "'Outfit', sans-serif" }}>
      <style>{`
        @media (max-width: 639px) {
          .l9-profile-page { padding: 20px 16px !important; }
        }
        @keyframes l9-toast-in {
          from { opacity: 0; transform: translateY(16px) scale(0.97); }
          to   { opacity: 1; transform: translateY(0)   scale(1); }
        }
      `}</style>

      <ProfileHeroSection onUserUpdate={setUser} />

      {noPlatforms && (
        <NoPlatformsBanner onConnect={() => router.push("/app/settings/platforms")} />
      )}
      {noGames && (
        <NoGamesBanner onSync={() => router.push("/app/settings/platforms")} />
      )}

      {activeTab !== "earn" && (
        <NextRewards onSeeAll={() => setActiveTab("earn")} />
      )}

      <ProfileTabs active={activeTab} onChange={setActiveTab} />

      {activeTab === "overview" && <ProfileOverview />}
      {activeTab === "games" && <ProfileGames />}
      {activeTab === "tribe" && <ProfileTribe />}
      {activeTab === "connect" && (
        <Suspense>
          <PlatformSources onSyncComplete={handleSyncComplete} />
        </Suspense>
      )}
      {activeTab === "earn" && <EarnGuide isOwn={true} />}

      {/* Rank-up toast */}
      {showShareToast && shareCardData && (
        <div
          style={{
            position: "fixed",
            bottom: 28,
            left: "50%",
            transform: "translateX(-50%)",
            zIndex: 900,
            background: "#0D0F1A",
            border: "1px solid rgba(200,255,0,0.35)",
            borderRadius: 14,
            padding: "14px 20px",
            display: "flex",
            alignItems: "center",
            gap: 14,
            boxShadow: "0 8px 32px rgba(0,0,0,0.55)",
            animation: "l9-toast-in 0.28s ease",
            maxWidth: "calc(100vw - 32px)",
            whiteSpace: "nowrap",
          }}
        >
          <div style={{ display: "flex", flexDirection: "column", gap: 2 }}>
            <span style={{ fontSize: 14, fontWeight: 800, color: "#F1F3F9", letterSpacing: "-0.01em" }}>
              {shareCardType === "badge"
                ? `Badge unlocked: ${shareCardData.badgeName} ${shareCardData.tier}`
                : `You climbed to #${shareCardData.rank}! ↑${shareCardData.delta}`}
            </span>
            <span style={{ fontSize: 12, color: "rgba(241,243,249,0.45)" }}>
              {shareCardType === "badge" ? "Share your new badge" : "Share your rank with your crew"}
            </span>
          </div>
          <button
            onClick={() => { setShowShareToast(false); setShowShareModal(true); }}
            style={{
              padding: "9px 18px",
              borderRadius: 9,
              border: "none",
              background: "#C8FF00",
              color: "#07080F",
              fontFamily: "'Outfit', sans-serif",
              fontSize: 13,
              fontWeight: 800,
              cursor: "pointer",
              letterSpacing: "-0.01em",
              flexShrink: 0,
            }}
          >
            Share →
          </button>
          <button
            onClick={() => setShowShareToast(false)}
            style={{
              background: "none",
              border: "none",
              color: "rgba(241,243,249,0.35)",
              fontSize: 18,
              cursor: "pointer",
              padding: "0 2px",
              lineHeight: 1,
              flexShrink: 0,
            }}
          >
            ✕
          </button>
        </div>
      )}

      {/* Share card modal */}
      {showShareModal && shareCardData && user && (
        <ShareCardModal
          type={shareCardType}
          cardParams={
            shareCardType === "badge"
              ? { badgeName: shareCardData.badgeName, tier: shareCardData.tier, game: shareCardData.game || "", icon: shareCardData.icon || "🏆" }
              : { rank: shareCardData.rank, delta: shareCardData.delta > 0 ? shareCardData.delta : undefined, platform: shareCardData.platform }
          }
          username={user.username || user.displayName || "Gamer"}
          onClose={() => setShowShareModal(false)}
        />
      )}
    </div>
  );
}
