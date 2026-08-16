import { redirect } from "next/navigation";

/**
 * /1v1/challenge/[token] — challenge link.
 * token = SteamID64 of the challenger.
 * Redirects to /1v1?p1=[steamId] so the opponent just fills in their own ID.
 */
export default async function ChallengePage({ params }) {
  const { token } = await params;
  redirect(`/1v1?p1=${encodeURIComponent(token)}`);
}
