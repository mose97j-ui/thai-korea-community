"use client";

import { useAuth } from "@/contexts/AuthContext";
import HomeContent from "@/components/HomeContent";
import PageShell from "@/components/PageShell";
import WelcomeScreen from "@/components/WelcomeScreen";

export default function HomePage() {
  const { user, isReady } = useAuth();

  // Keep SSR and the first client paint identical (Welcome) to avoid hydration crashes.
  if (!isReady || !user) {
    return <WelcomeScreen />;
  }

  return (
    <PageShell maxWidth="full">
      <HomeContent />
    </PageShell>
  );
}
