import { Suspense } from "react";
import OneVsOnePage from "./_client/OneVsOne";
import {
  fetchSteamPlayerSummaries,
  resolveVanityURL,
} from "@/lib/integrations/steam/steamClient";

const BASE_URL = process.env.NEXT_PUBLIC_BASE_URL || "https://leet9.com";
const STEAMID64_RE = /^[0-9]{17}$/;
const VANITY_URL_RE = /^https?:\/\/steamcommunity\.com\/(id|profiles)\/([^/]+)/;

async function quickResolveSteamId(input) {
  if (!input) return null;
  const trimmed = input.trim();
  const urlMatch = trimmed.match(VANITY_URL_RE);
  if (urlMatch) {
    const type = urlMatch[1];
    const value = urlMatch[2];
    if (type === "profiles" && STEAMID64_RE.test(value)) return value;
    return resolveVanityURL(value).catch(() => null);
  }
  if (STEAMID64_RE.test(trimmed)) return trimmed;
  return resolveVanityURL(trimmed).catch(() => null);
}

export async function generateMetadata({ searchParams }) {
  const params = await searchParams;
  const p1 = params?.p1;
  const p2 = params?.p2;
  const t = params?.t || "";

  const defaultMeta = {
    title: "1 vs 1 — Steam Battle | Leet9",
    description:
      "Compare two Steam profiles head-to-head. Who has more hours, more games, and bragging rights?",
    openGraph: {
      title: "1 vs 1 Steam Battle — Leet9",
      description: "Compare two Steam profiles head-to-head on Leet9.",
      images: [{ url: `${BASE_URL}/api/og/1v1`, width: 1200, height: 630 }],
    },
    twitter: {
      card: "summary_large_image",
      images: [`${BASE_URL}/api/og/1v1`],
    },
  };

  if (!p1 || !p2) return defaultMeta;

  try {
    const [id1, id2] = await Promise.all([
      quickResolveSteamId(p1),
      quickResolveSteamId(p2),
    ]);

    if (!id1 || !id2) return defaultMeta;

    const [s1, s2] = await Promise.all([
      fetchSteamPlayerSummaries(id1).catch(() => null),
      fetchSteamPlayerSummaries(id2).catch(() => null),
    ]);

    const name1 = s1?.personaname || "Player 1";
    const name2 = s2?.personaname || "Player 2";
    const avatar1 = s1?.avatarfull || "";
    const avatar2 = s2?.avatarfull || "";

    const ogParams = new URLSearchParams({
      p1name: name1,
      p2name: name2,
      ...(avatar1 && { p1avatar: avatar1 }),
      ...(avatar2 && { p2avatar: avatar2 }),
      ...(t && { t }),
    });

    const ogUrl = `${BASE_URL}/api/og/1v1?${ogParams}`;
    const title = `${name1} vs ${name2} — Leet9 1v1`;

    return {
      title,
      description: `${name1} vs ${name2}: who has more Steam hours? Find out on Leet9.`,
      openGraph: {
        title,
        description: `${name1} vs ${name2}: who has more Steam hours? Find out on Leet9.`,
        images: [{ url: ogUrl, width: 1200, height: 630, alt: title }],
      },
      twitter: {
        card: "summary_large_image",
        title,
        images: [ogUrl],
      },
    };
  } catch {
    return defaultMeta;
  }
}

export default function Page() {
  return (
    <Suspense>
      <OneVsOnePage />
    </Suspense>
  );
}
