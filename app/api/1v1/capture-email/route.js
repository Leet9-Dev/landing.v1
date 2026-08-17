import { prisma } from "@/lib/prisma";
import { apiOk, apiError } from "@/lib/api/response";
import { sendOneVsOneWelcomeEmail } from "@/lib/email";

const EMAIL_RE = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;

export async function POST(request) {
  let body;
  try {
    body = await request.json();
  } catch {
    return apiError("INVALID_BODY", "Invalid JSON body.", 400);
  }

  const { email, p1Input, p2Input, winnerName, l9Score1, l9Score2 } = body ?? {};

  if (!email || !EMAIL_RE.test(email)) {
    return apiError("INVALID_EMAIL", "A valid email address is required.", 400);
  }
  if (!p1Input || !p2Input) {
    return apiError("MISSING_PARAMS", "p1Input and p2Input are required.", 400);
  }

  await prisma.oneVsOneLead.create({
    data: {
      email: email.toLowerCase().trim(),
      p1Input,
      p2Input,
      winnerName: winnerName ?? null,
      l9Score1: l9Score1 ?? null,
      l9Score2: l9Score2 ?? null,
    },
  });

  sendOneVsOneWelcomeEmail({ to: email, winnerName }).catch(() => {});

  return apiOk({ captured: true });
}
