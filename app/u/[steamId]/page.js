import { notFound } from "next/navigation";
import { fetchPlayerProfile } from "@/lib/integrations/steam/l9score";
import { resolveVanityURL } from "@/lib/integrations/steam/steamClient";
import ProfileView from "./_client/ProfileView";

const BASE_URL = process.env.NEXT_PUBLIC_BASE_URL || "https://leet9.com";
const STEAMID64_RE = /^[0-9]{17}$/;

async function resolveSteamId(raw) {
  if (STEAMID64_RE.test(raw)) return raw;
  return resolveVanityURL(raw).catch(() => null);
}

export async function generateMetadata({ params }) {
  const { steamId: raw } = await params;
  try {
    const steamId = await resolveSteamId(raw);
    if (!steamId) return { title: "Profile not found — Leet9" };
    const profile = await fetchPlayerProfile(steamId);
    if (!profile) return { title: "Profile not found — Leet9" };

    const title = `${profile.name} — L9 Score ${profile.l9Score} | Leet9`;
    const description = `${profile.name} has an L9 Score of ${profile.l9Score}. ${profile.totalPlaytimeHours.toLocaleString()} hours across ${profile.totalGames} games. Think you can beat them?`;
    const ogImage = `${BASE_URL}/api/og/profile?name=${encodeURIComponent(profile.name)}&score=${profile.l9Score}&avatar=${encodeURIComponent(profile.avatarUrl || "")}`;

    return {
      title,
      description,
      alternates: { canonical: `${BASE_URL}/u/${raw}` },
      openGraph: {
        title,
        description,
        images: [{ url: ogImage, width: 1200, height: 630 }],
      },
      twitter: { card: "summary_large_image", title, images: [ogImage] },
    };
  } catch {
    return { title: "Leet9 Profile" };
  }
}

export default async function ProfilePage({ params }) {
  const { steamId: raw } = await params;

  let steamId;
  try {
    steamId = await resolveSteamId(raw);
  } catch {
    notFound();
  }

  if (!steamId) notFound();

  let profile;
  try {
    profile = await fetchPlayerProfile(steamId);
  } catch {
    notFound();
  }

  if (!profile) notFound();

  return <ProfileView profile={profile} />;
}
