export const TWITCH_RAW_USER = {
  id: "fixture_twitch_123",
  login: "fixture_streamer",
  display_name: "Fixture Streamer",
  profile_image_url: null,
  created_at: "2020-01-01T00:00:00Z",
};

// Top games streamed by the fixture user (from Twitch /helix/videos).
export const TWITCH_RAW_GAME_HISTORY = [
  {
    game_id: "27471",
    game_name: "Minecraft",
    hoursStreamed: 320,
    lastStreamedAt: "2024-10-15T20:00:00Z",
  },
  {
    game_id: "33214",
    game_name: "Fortnite",
    hoursStreamed: 180,
    lastStreamedAt: "2024-11-01T18:00:00Z",
  },
  {
    game_id: "511224",
    game_name: "Apex Legends",
    hoursStreamed: 95,
    lastStreamedAt: "2024-09-20T19:00:00Z",
  },
];
