import { getServerSession } from "next-auth/next";
import { authOptions } from "@/lib/auth";
import { apiError } from "@/lib/api/response";

export async function requireSession() {
  const session = await getServerSession(authOptions);
  if (!session?.user) {
    return {
      session: null,
      unauthenticated: apiError(
        "UNAUTHENTICATED",
        "You must be signed in to access this resource.",
        401
      ),
    };
  }
  return { session, unauthenticated: null };
}
