"use client";

import { useEffect } from "react";
import { Button } from "@/components/ui/button";

export default function ErrorBoundary({ error, reset }: { error: Error & { digest?: string }; reset: () => void }) {
  useEffect(() => {
    // eslint-disable-next-line no-console
    console.error(error);
  }, [error]);

  return (
    <div className="flex min-h-screen flex-col items-center justify-center px-6 text-center">
      <h1 className="mb-3 font-serif text-3xl font-bold text-foreground">Something went wrong</h1>
      <p className="mb-6 max-w-sm font-mono text-sm text-muted-foreground">
        {error.message || "An unexpected error occurred."}
      </p>
      <Button onClick={reset} className="rounded-lg bg-foreground text-primary-foreground hover:bg-rust">
        Try again
      </Button>
    </div>
  );
}
