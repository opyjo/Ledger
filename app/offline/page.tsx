export default function OfflinePage() {
  return (
    <div className="flex min-h-screen flex-col items-center justify-center px-6 text-center">
      <h1 className="mb-3 font-serif text-3xl font-bold text-foreground">You&apos;re offline</h1>
      <p className="max-w-sm font-mono text-sm text-muted-foreground">
        Ledger needs an internet connection to sync your calendar. Please reconnect and try again.
      </p>
    </div>
  );
}
