// Realistic mock Steam owned-game responses for dry-run testing.
//
// Shape mirrors the Steam Web API GetOwnedGames response:
//   GET https://api.steampowered.com/IPlayerService/GetOwnedGames/v1/
//     ?key=STEAM_API_KEY&steamid=STEAMID64&include_appinfo=true
//
// Fixtures demonstrate four cases the sync planner must handle:
//   1. Game that matches a known GameExternalSource (Elden Ring → game_elden_ring)
//   2. Game already in UserGames AND matches external source (Rocket League)
//   3. Game that matches external source but is NOT yet in UserGames (Hollow Knight)
//   4. Game with no matching GameExternalSource → unmatched, must not enter Discovery

export const STEAM_RAW_OWNED_GAMES = [
  {
    // Case 1: matched + not yet in profile UserGames
    appid: 1245620,
    name: "ELDEN RING",
    playtime_forever: 17070, // minutes
    playtime_2weeks: 0,
    img_icon_url: "4f3cb5d76e08d31736ea56da62a82e4c89a0b6c4",
    has_community_visible_stats: true,
    rtime_last_played: 1750024800, // unix timestamp
  },
  {
    // Case 2: matched + already in UserGames (update path)
    appid: 252950,
    name: "Rocket League",
    playtime_forever: 77040,
    playtime_2weeks: 120,
    img_icon_url: "5a3f8e1c3c9a2b64a77d8e9f0b1d2c3e4f5a6b7c",
    has_community_visible_stats: true,
    rtime_last_played: 1750622200,
  },
  {
    // Case 3: matched + NOT in UserGames (create path)
    appid: 367520,
    name: "Hollow Knight",
    playtime_forever: 3504,
    playtime_2weeks: 0,
    img_icon_url: "a4b5c6d7e8f9a0b1c2d3e4f5a6b7c8d9e0f1a2b3",
    has_community_visible_stats: true,
    rtime_last_played: 1749571200,
  },
  {
    // Case 4: no matching GameExternalSource → unmatched, must NOT enter Discovery
    appid: 2515020,
    name: "Unmatched Indie Prototype",
    playtime_forever: 240,
    playtime_2weeks: 0,
    img_icon_url: null,
    has_community_visible_stats: false,
    rtime_last_played: 1748606400,
  },
  {
    // Case 5: free-to-play / very low playtime — still valid, handled normally
    appid: 570,
    name: "Dota 2",
    playtime_forever: 15,
    playtime_2weeks: 0,
    img_icon_url: null,
    has_community_visible_stats: true,
    rtime_last_played: 0,
  },
];

// Simulated wrapper as returned by Steam Web API
export const STEAM_RAW_API_RESPONSE = {
  response: {
    game_count: STEAM_RAW_OWNED_GAMES.length,
    games: STEAM_RAW_OWNED_GAMES,
  },
};
