"use client";

import { useEffect, useState } from "react";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";

interface KeyboardShortcutsProps {
  onAddEvent: () => void;
  onToday: () => void;
  onPrevMonth: () => void;
  onNextMonth: () => void;
  onOpenCommandPalette: () => void;
  onSetView?: (view: "month" | "week" | "todos") => void;
}

export function useKeyboardShortcuts({
  onAddEvent,
  onToday,
  onPrevMonth,
  onNextMonth,
  onOpenCommandPalette,
  onSetView,
}: KeyboardShortcutsProps) {
  const [helpOpen, setHelpOpen] = useState(false);

  useEffect(() => {
    const handler = (e: KeyboardEvent) => {
      const target = e.target as HTMLElement;
      const isTyping =
        target.tagName === "INPUT" ||
        target.tagName === "TEXTAREA" ||
        target.isContentEditable;

      if (isTyping) return;

      if ((e.metaKey || e.ctrlKey) && e.key === "k") {
        e.preventDefault();
        onOpenCommandPalette();
        return;
      }

      switch (e.key) {
        case "n":
        case "N":
          e.preventDefault();
          onAddEvent();
          break;
        case "t":
        case "T":
          e.preventDefault();
          onToday();
          break;
        case "ArrowLeft":
          e.preventDefault();
          onPrevMonth();
          break;
        case "ArrowRight":
          e.preventDefault();
          onNextMonth();
          break;
        case "1":
          e.preventDefault();
          onSetView?.("month");
          break;
        case "2":
          e.preventDefault();
          onSetView?.("week");
          break;
        case "3":
          e.preventDefault();
          onSetView?.("todos");
          break;
        case "?":
          e.preventDefault();
          setHelpOpen(true);
          break;
      }
    };

    window.addEventListener("keydown", handler);
    return () => window.removeEventListener("keydown", handler);
  }, [onAddEvent, onToday, onPrevMonth, onNextMonth, onOpenCommandPalette, onSetView]);

  return { helpOpen, setHelpOpen };
}

const SHORTCUTS = [
  { key: "N", action: "Add new event" },
  { key: "T", action: "Go to today" },
  { key: "←", action: "Previous month" },
  { key: "→", action: "Next month" },
  { key: "1 / 2 / 3", action: "Month, week, or todos view" },
  { key: "Cmd/Ctrl + K", action: "Open command palette" },
  { key: "?", action: "Show keyboard shortcuts" },
];

export function ShortcutsHelpDialog({ open, onOpenChange }: { open: boolean; onOpenChange: (open: boolean) => void }) {
  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-sm rounded-2xl border-2 border-foreground">
        <DialogHeader>
          <DialogTitle className="font-serif text-xl">Keyboard shortcuts</DialogTitle>
        </DialogHeader>
        <div className="mt-2 space-y-2">
          {SHORTCUTS.map((s) => (
            <div key={s.key} className="flex items-center justify-between text-sm">
              <span className="text-muted-foreground">{s.action}</span>
              <kbd className="rounded-md border border-line bg-panel px-2 py-0.5 font-mono text-xs">{s.key}</kbd>
            </div>
          ))}
        </div>
      </DialogContent>
    </Dialog>
  );
}
