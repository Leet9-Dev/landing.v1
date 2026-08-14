import { NextResponse } from "next/server";
import {
  fetchSteamOwnedGames,
  fetchSteamPlayerSummaries,
  hasSteamApiKey,
} from "@/lib/integrations/steam/steamClient";
import { computeL91v1Score } from "@/lib/scoring/l9Score1v1";

// Resolve vanity URL → SteamID64.
// If the input is already a 17-digit number, returns it as-is.
async function resolveSteamId(input) {
  const trimmed = input.trim();
  if (/^\d{17}$/.test(trimmed)) return trimmed;

  const apiKey = process.env.STEAM_API_KEY;
  if (!apiKey) throw new Error("Steam API key required to resolve vanity URLs.");

  const url = new URL("https://api.steampowered.com/ISteamUser/ResolveVanityURL/v1/");
  url.searchParams.set("key", apiKey);
  url.searchParams.set("vanityurl", trimmed);

  const res = await fetch(url.toString());
  if (!res.ok) throw new Error(`Steam ResolveVanityURL error: ${res.status}`);
  const json = await res.json();
  if (json.response?.success !== 1) throw new Error(`Could not resolve Steam vanity URL: "${trimmed}"`);
  return json.response.steamid;
}

export async function GET(request) {
  const { searchParams } = new URL(request.url);
  const p1Input = searchParams.get("p1");
  const p2Input = searchParams.get("p2");

  if (!p1Input || !p2Input) {
    return NextResponse.json({ error: "Both p1 and p2 are required." }, { status: 400 });
  }

  try {
    const [id1, id2] = await Promise.all([
      resolveSteamId(p1Input),
      resolveSteamId(p2Input),
    ]);

    if (id1 === id2) {
      return NextResponse.json({ error: "Enter two different Steam accounts." }, { status: 400 });
    }

    // Fetch games for both players in parallel
    const [games1, games2] = await Promise.all([
      fetchSteamOwnedGames(id1),
      fetchSteamOwnedGames(id2),
    ]);

    if (!games1.length && !games2.length) {
      return NextResponse.json(
        { error: "Both profiles appear to be private or have no games." },
        { status: 422 }
      );
    }

    // Fetch player summaries if API key is available
    let summary1 = null;
    let summary2 = null;
    if (hasSteamApiKey()) {
      [summary1, summary2] = await Promise.allSettled([
        fetchSteamPlayerSummaries(id1),
        fetchSteamPlayerSummaries(id2),
      ]).then((results) =>
        results.map((r) => (r.status === "fulfilled" ? r.value : null))
      );
    }

    const score1 = computeL91v1Score(games1);
    const score2 = computeL91v1Score(games2);

    const winner = score1.total >= score2.total ? 1 : 2;

    return NextResponse.json({
      winner,
      players: [
        {
          steamId: id1,
          name: summary1?.personaname ?? `Player ${id1.slice(-4)}`,
          avatar: summary1?.avatarfull ?? null,
          profileUrl: summary1?.profileurl ?? `https://steamcommunity.com/profiles/${id1}`,
          score: score1,
          gamesTotal: games1.length,
        },
        {
          steamId: id2,
          name: summary2?.personaname ?? `Player ${id2.slice(-4)}`,
          avatar: summary2?.avatarfull ?? null,
          profileUrl: summary2?.profileurl ?? `https://steamcommunity.com/profiles/${id2}`,
          score: score2,
          gamesTotal: games2.length,
        },
      ],
    });
  } catch (err) {
    const message = err?.message ?? "Comparison failed.";
    return NextResponse.json({ error: message }, { status: 500 });
  }
}
