"use client";

import { useEffect, useState } from "react";
import {
  CommandDialog,
  CommandEmpty,
  CommandGroup,
  CommandInput,
  CommandItem,
  CommandList,
  CommandSeparator,
} from "@/components/ui/command";
import { useData } from "@/components/data-provider";
import { useAuth } from "@/components/auth-provider";
import { formatDate } from "@/lib/recurrence";

interface CommandPaletteProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  onAddEvent: () => void;
  onOpenSettings: () => void;
  onToday: () => void;
  onPrevMonth: () => void;
  onNextMonth: () => void;
  onSelectDate: (date: Date) => void;
}

export function CommandPalette({
  open,
  onOpenChange,
  onAddEvent,
  onOpenSettings,
  onToday,
  onPrevMonth,
  onNextMonth,
  onSelectDate,
}: CommandPaletteProps) {
  const { events, categories } = useData();
  const { logout } = useAuth();
  const [query, setQuery] = useState("");

  useEffect(() => {
    if (!open) setQuery("");
  }, [open]);

  const handleAddEvent = () => {
    onOpenChange(false);
    onAddEvent();
  };

  const handleOpenSettings = () => {
    onOpenChange(false);
    onOpenSettings();
  };

  const handleToday = () => {
    onOpenChange(false);
    onToday();
  };

  const handlePrevMonth = () => {
    onOpenChange(false);
    onPrevMonth();
  };

  const handleNextMonth = () => {
    onOpenChange(false);
    onNextMonth();
  };

  const handleSelectEvent = (dateStr: string) => {
    onOpenChange(false);
    onSelectDate(new Date(dateStr + "T00:00:00"));
  };

  return (
    <CommandDialog open={open} onOpenChange={onOpenChange}>
      <CommandInput placeholder="Type a command or search events..." value={query} onValueChange={setQuery} />
      <CommandList>
        <CommandEmpty>No results found.</CommandEmpty>
        <CommandGroup heading="Actions">
          <CommandItem onSelect={handleAddEvent}>Add new event</CommandItem>
          <CommandItem onSelect={handleToday}>Go to today</CommandItem>
          <CommandItem onSelect={handlePrevMonth}>Previous month</CommandItem>
          <CommandItem onSelect={handleNextMonth}>Next month</CommandItem>
          <CommandItem onSelect={handleOpenSettings}>Open settings</CommandItem>
          <CommandItem onSelect={() => { onOpenChange(false); logout(); }}>Sign out</CommandItem>
        </CommandGroup>
        <CommandSeparator />
        <CommandGroup heading="Events">
          {events.slice(0, 10).map((ev) => {
            const cat = categories.find((c) => c.id === ev.categoryId);
            return (
              <CommandItem key={ev.id} onSelect={() => handleSelectEvent(ev.date)}>
                <span className="mr-2 inline-block h-2 w-2 rounded-full" style={{ backgroundColor: cat?.color }} />
                {ev.title} <span className="ml-2 text-xs text-muted-foreground">{ev.date}</span>
              </CommandItem>
            );
          })}
        </CommandGroup>
      </CommandList>
    </CommandDialog>
  );
}
