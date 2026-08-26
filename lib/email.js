import { Resend } from "resend";

const FROM = process.env.RESEND_FROM_EMAIL || "Leet9 <no-reply@leet9.com>";
const BASE_URL = process.env.NEXT_PUBLIC_BASE_URL || "https://leet9.com";

function getResend() {
  return new Resend(process.env.RESEND_API_KEY);
}

export async function sendVerificationEmail({ to, token }) {
  const resend = getResend();
  const url = `${BASE_URL}/verify-email?token=${token}`;
  await resend.emails.send({
    from: FROM,
    to,
    subject: "Confirm your Leet9 account",
    html: emailHtml({
      title: "Confirm your email",
      body: "You're almost in. Click below to verify your email and activate your Leet9 account.",
      ctaLabel: "Confirm Email",
      ctaUrl: url,
      footer: "Link expires in 24 hours. If you didn't sign up, ignore this email.",
    }),
  });
}

export async function sendPasswordResetEmail({ to, token }) {
  const resend = getResend();
  const url = `${BASE_URL}/reset-password?token=${token}`;
  await resend.emails.send({
    from: FROM,
    to,
    subject: "Reset your Leet9 password",
    html: emailHtml({
      title: "Reset your password",
      body: "We received a request to reset your password. Click below to choose a new one.",
      ctaLabel: "Reset Password",
      ctaUrl: url,
      footer: "Link expires in 1 hour. If you didn't request this, ignore this email.",
    }),
  });
}

export async function sendNewFollowerEmail({ to, followerName }) {
  const resend = getResend();
  const url = `${BASE_URL}/app/rankings`;
  await resend.emails.send({
    from: FROM,
    to,
    subject: `${followerName} is following you on Leet9`,
    html: emailHtml({
      title: "You have a new follower!",
      body: `<strong style="color:#F1F3F9;">${followerName}</strong> started following you on Leet9. Climb the leaderboard and get noticed.`,
      ctaLabel: "Go to Rankings",
      ctaUrl: url,
      footer: "You received this email because someone followed you on Leet9. Do not reply to this email.",
    }),
  });
}

export async function sendMagicLoginEmail({ to, token, p1Name, p2Name, redirectPath }) {
  const resend = getResend();
  const url = `${BASE_URL}/auth/magic?token=${token}&redirect=${encodeURIComponent(redirectPath || "/dashboard")}`;
  await resend.emails.send({
    from: FROM,
    to,
    subject: "Your Leet9 login link",
    html: emailHtml({
      title: "Sign in to Leet9",
      body: p1Name && p2Name
        ? `You unlocked the detailed comparison between <strong style="color:#F1F3F9;">${p1Name}</strong> and <strong style="color:#F1F3F9;">${p2Name}</strong>.<br><br>Click below to sign in and see the full breakdown.`
        : "Click the button below to sign in to your Leet9 account. No password needed.",
      ctaLabel: "Sign in to Leet9 →",
      ctaUrl: url,
      footer: "Link expires in 30 minutes. If you didn't request this, you can safely ignore this email.",
    }),
  });
}

export async function sendYouFollowedEmail({ to, followedName }) {
  const resend = getResend();
  const url = `${BASE_URL}/app/rankings`;
  await resend.emails.send({
    from: FROM,
    to,
    subject: `You're now following ${followedName} on Leet9`,
    html: emailHtml({
      title: `You're following ${followedName}`,
      body: `You started following <strong style="color:#F1F3F9;">${followedName}</strong> on Leet9. When they climb the leaderboard, you'll see them in your Friends section.`,
      ctaLabel: "Go to Rankings",
      ctaUrl: url,
      footer: "You received this email as confirmation of a follow you made on Leet9.",
    }),
  });
}

export async function sendChallengeEmail({ to, challengerName, targetProfileUrl }) {
  const resend = getResend();
  await resend.emails.send({
    from: FROM,
    to,
    subject: `${challengerName} is calling you out on Leet9 — time to show up`,
    html: emailHtml({
      title: "Someone wants to compete with you",
      body: `<strong style="color:#F1F3F9;">${challengerName}</strong> checked out your Leet9 profile and wants to go head-to-head — but you're not in the game yet. Link Steam, PSN or Xbox and prove what you're made of.`,
      ctaLabel: "Show up and compete →",
      ctaUrl: targetProfileUrl,
      footer: "You received this email because a Leet9 player sent you a nudge. If you're not interested, just ignore it.",
    }),
  });
}

export async function sendGameChallengeEmail({ to, challengerName, gameName, challengeUrl }) {
  const resend = getResend();
  await resend.emails.send({
    from: FROM,
    to,
    subject: `${challengerName} challenged you on ${gameName} — are you in?`,
    html: emailHtml({
      title: "You've been challenged",
      body: `<strong style="color:#F1F3F9;">${challengerName}</strong> wants to go head-to-head against you on <strong style="color:#F1F3F9;">${gameName}</strong> on Leet9. Accept the challenge and see who's the better player.`,
      ctaLabel: "Accept the challenge →",
      ctaUrl: challengeUrl,
      footer: "You received this email because a Leet9 player challenged you. If you're not interested, just ignore it.",
    }),
  });
}

export async function sendGameChallengeAcceptedEmail({ to, challengedName, gameName, challengeUrl }) {
  const resend = getResend();
  await resend.emails.send({
    from: FROM,
    to,
    subject: `${challengedName} accepted your challenge on ${gameName}`,
    html: emailHtml({
      title: "Challenge accepted",
      body: `<strong style="color:#F1F3F9;">${challengedName}</strong> accepted your 1v1 challenge on <strong style="color:#F1F3F9;">${gameName}</strong>. The stats are locked in — time to see who came out on top.`,
      ctaLabel: "See the result →",
      ctaUrl: challengeUrl,
      footer: "You received this email because a player accepted your Leet9 challenge.",
    }),
  });
}

export async function sendNpsSurveyEmail({ to, name }) {
  const resend = getResend();
  const url = `${BASE_URL}/app/dashboard?nps=1`;
  await resend.emails.send({
    from: FROM,
    to,
    subject: "We miss you — how are we doing?",
    html: emailHtml({
      title: "Quick question for you",
      body: `Hey ${name}, it's been a while! We'd love to hear how Leet9 is working for you. It only takes 10 seconds.`,
      ctaLabel: "Share your feedback →",
      ctaUrl: url,
      footer: "You're receiving this because you have a Leet9 account. You can dismiss the survey once you log in.",
    }),
  });
}

function emailHtml({ title, body, ctaLabel, ctaUrl, footer }) {
  return `<!DOCTYPE html>
<html>
<head><meta charset="utf-8"><meta name="viewport" content="width=device-width,initial-scale=1"></head>
<body style="margin:0;padding:0;background:#07080F;font-family:'Helvetica Neue',Arial,sans-serif;">
  <table width="100%" cellpadding="0" cellspacing="0" style="background:#07080F;padding:48px 16px;">
    <tr><td align="center">
      <table width="100%" style="max-width:480px;background:#0D0F1A;border-radius:16px;border:1px solid rgba(255,255,255,0.08);overflow:hidden;">
        <tr>
          <td style="padding:32px 36px 0;text-align:center;">
            <div style="font-size:22px;font-weight:900;color:#C8FF00;letter-spacing:-0.02em;">LEET9</div>
          </td>
        </tr>
        <tr>
          <td style="padding:28px 36px 0;">
            <h1 style="margin:0 0 12px;font-size:20px;font-weight:800;color:#F1F3F9;letter-spacing:-0.01em;">${title}</h1>
            <p style="margin:0 0 28px;font-size:14px;color:rgba(241,243,249,0.55);line-height:1.6;">${body}</p>
            <a href="${ctaUrl}" style="display:inline-block;padding:13px 32px;background:#C8FF00;color:#07080F;font-size:14px;font-weight:800;border-radius:10px;text-decoration:none;letter-spacing:0.02em;">${ctaLabel}</a>
          </td>
        </tr>
        <tr>
          <td style="padding:28px 36px 32px;">
            <p style="margin:0;font-size:11px;color:rgba(241,243,249,0.25);line-height:1.5;">${footer}</p>
          </td>
        </tr>
      </table>
    </td></tr>
  </table>
</body>
</html>`;
}
