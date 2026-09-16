const CLIENT_ID = process.env.AUTH_DISCORD_ID ?? "";
const CLIENT_SECRET = process.env.AUTH_DISCORD_SECRET ?? "";

/**
 * Revoke a Discord OAuth access token.
 * Never throws — logs on failure and resolves so callers can fire-and-forget.
 */
export async function revokeDiscordToken(accessToken) {
  if (!accessToken || !CLIENT_ID || !CLIENT_SECRET) return;
  try {
    const creds = Buffer.from(`${CLIENT_ID}:${CLIENT_SECRET}`).toString("base64");
    const res = await fetch("https://discord.com/api/oauth2/token/revoke", {
      method: "POST",
      headers: {
        "Content-Type": "application/x-www-form-urlencoded",
        Authorization: `Basic ${creds}`,
      },
      body: new URLSearchParams({ token: accessToken }),
    });
    if (!res.ok) {
      console.error("[discord] token revocation returned", res.status);
    }
  } catch (err) {
    console.error("[discord] token revocation failed:", err.message);
  }
}
