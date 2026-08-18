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
  const url = `${BASE_URL}/auth/magic?token=${token}&redirect=${encodeURIComponent(redirectPath || "/1v1")}`;
  await resend.emails.send({
    from: FROM,
    to,
    subject: "Il tuo accesso a Leet9 — un click e sei dentro",
    html: emailHtml({
      title: "Accesso con un click",
      body: `Hai sbloccato il confronto dettagliato${p1Name && p2Name ? ` tra <strong style="color:#F1F3F9;">${p1Name}</strong> e <strong style="color:#F1F3F9;">${p2Name}</strong>` : ""}.<br><br>Clicca il bottone qui sotto per accedere al tuo account Leet9 e vedere tutti i dettagli. Hai anche ricevuto <strong style="color:#C8FF00;">500 L9 Points</strong> di benvenuto.`,
      ctaLabel: "Entra su Leet9 →",
      ctaUrl: url,
      footer: "Link valido per 30 minuti. Se non hai fatto tu questo acquisto, ignora questa email.",
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
