"use client";
import { useSession } from "next-auth/react";
import { useRouter } from "next/navigation";
import { useEffect } from "react";
import { AppShell } from "@/components/layout/AppShell";

export default function AppPage() {
  const { data: session, status } = useSession();
  const router = useRouter();

  useEffect(() => {
    if (status === "unauthenticated") router.push("/");
  }, [status, router]);

  if (status === "loading") {
    return (
      <div style={{
        background: "#07080F",
        minHeight: "100vh",
        display: "flex",
        alignItems: "center",
        justifyContent: "center",
      }}>
        <div style={{
          width: 8,
          height: 8,
          borderRadius: "50%",
          background: "#C8FF00",
          animation: "pulse 1s ease infinite",
        }} />
        <style>{`@keyframes pulse { 0%,100%{opacity:1;} 50%{opacity:0.3;} }`}</style>
      </div>
    );
  }

  if (!session) return null;

  return <AppShell user={session.user} />;
}
