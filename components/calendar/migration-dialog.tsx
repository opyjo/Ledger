"use client";

import { useEffect, useState } from "react";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogDescription } from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { useData } from "@/components/data-provider";
import { useAuth } from "@/components/auth-provider";
import { migrateLegacyBackup } from "@/lib/backup";
import type { LegacyBackup } from "@/lib/types";
import { toast } from "sonner";

const LEGACY_KEYS = {
  events: "ledger.events",
  categories: "ledger.categories",
  settings: "ledger.settings",
};

export function MigrationDialog() {
  const { user } = useAuth();
  const { events, categories, batchImport } = useData();
  const [open, setOpen] = useState(false);
  const [legacyData, setLegacyData] = useState<LegacyBackup | null>(null);

  useEffect(() => {
    if (typeof window === "undefined") return;

    const rawEvents = localStorage.getItem(LEGACY_KEYS.events);
    const rawCats = localStorage.getItem(LEGACY_KEYS.categories);
    const rawSettings = localStorage.getItem(LEGACY_KEYS.settings);

    if (!rawEvents && !rawCats && !rawSettings) return;

    // Only prompt if user has no cloud data yet
    if (events.length === 0 && categories.length <= 4) {
      const data: LegacyBackup = {
        events: rawEvents ? JSON.parse(rawEvents) : [],
        categories: rawCats ? JSON.parse(rawCats) : [],
        settings: rawSettings ? JSON.parse(rawSettings) : {},
      };
      setLegacyData(data);
      setOpen(true);
    }
  }, [events.length, categories.length]);

  const handleImport = async () => {
    if (!legacyData) return;
    // We need a userId; DataProvider has it, but batchImport uses its own userId.
    // The DataProvider's batchImport closes over userId, so calling it directly is fine.
    const { categories: cats, events: evs, settings: sets } = migrateLegacyBackup(
      legacyData,
      user?.uid || ""
    );
    await batchImport(cats, evs, sets);
    localStorage.removeItem(LEGACY_KEYS.events);
    localStorage.removeItem(LEGACY_KEYS.categories);
    localStorage.removeItem(LEGACY_KEYS.settings);
    setOpen(false);
    toast("Local data imported successfully.");
  };

  const handleSkip = () => {
    setOpen(false);
  };

  const eventCount = legacyData?.events?.length || 0;

  return (
    <Dialog open={open} onOpenChange={setOpen}>
      <DialogContent className="max-w-sm rounded-2xl border-2 border-foreground">
        <DialogHeader>
          <DialogTitle className="font-serif text-xl">Import local data?</DialogTitle>
          <DialogDescription className="text-sm text-muted-foreground">
            We found {eventCount} event{eventCount === 1 ? "" : "s"} saved in this browser. Would you like to import them into your account?
          </DialogDescription>
        </DialogHeader>
        <div className="mt-4 flex justify-end gap-2">
          <Button variant="outline" onClick={handleSkip} className="rounded-lg border-line">
            Skip
          </Button>
          <Button onClick={handleImport} className="rounded-lg bg-foreground text-primary-foreground hover:bg-rust">
            Import
          </Button>
        </div>
      </DialogContent>
    </Dialog>
  );
}
