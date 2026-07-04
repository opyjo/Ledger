"use client";

import { useEffect } from "react";
import { useRouter } from "next/navigation";
import { DataProvider } from "@/components/data-provider";
import { CalendarPage } from "@/components/calendar/calendar-page";
import { useAuth } from "@/components/auth-provider";

export default function Home() {
  const { user, loading } = useAuth();
  const router = useRouter();

  useEffect(() => {
    if (!loading && !user) {
      router.replace("/login");
    }
  }, [user, loading, router]);

  if (loading || !user) {
    return (
      <div className="flex flex-1 items-center justify-center">
        <div className="font-mono text-sm text-muted-foreground">Loading…</div>
      </div>
    );
  }

  return (
    <DataProvider userId={user.uid}>
      <CalendarPage />
    </DataProvider>
  );
}
