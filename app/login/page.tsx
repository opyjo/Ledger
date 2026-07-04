"use client";

import { useEffect } from "react";
import { useRouter } from "next/navigation";
import { CalendarDays } from "lucide-react";
import { Button } from "@/components/ui/button";
import { useAuth } from "@/components/auth-provider";

export default function LoginPage() {
  const { user, loading, signInWithGoogle } = useAuth();
  const router = useRouter();

  useEffect(() => {
    if (!loading && user) {
      router.replace("/");
    }
  }, [user, loading, router]);

  if (loading || user) {
    return (
      <div className="flex flex-1 items-center justify-center">
        <div className="font-mono text-sm text-muted-foreground">Loading…</div>
      </div>
    );
  }

  return (
    <div className="flex flex-1 flex-col items-center justify-center px-6">
      <div className="w-full max-w-sm text-center">
        <div className="mb-6 inline-flex h-14 w-14 items-center justify-center rounded-2xl border-2 border-foreground bg-panel shadow-sm">
          <CalendarDays className="h-7 w-7 text-foreground" />
        </div>
        <h1 className="mb-2 text-4xl font-bold tracking-tight text-foreground">
          Ledger
        </h1>
        <p className="mb-8 font-mono text-sm text-muted-foreground">
          a calendar kept your way
        </p>
        <Button
          onClick={signInWithGoogle}
          className="h-11 w-full rounded-xl border-2 border-foreground bg-foreground text-primary-foreground hover:bg-rust hover:border-rust"
        >
          Continue with Google
        </Button>
      </div>
    </div>
  );
}
