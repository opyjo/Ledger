"use client";

import { useEffect, useMemo, useRef, useState } from "react";
import {
  ChevronLeft,
  ChevronRight,
  Plus,
  Settings,
  Upload,
  Download,
  LogOut,
  Bell,
  BellOff,
} from "lucide-react";
import { startOfMonth, endOfMonth, startOfWeek, endOfWeek, isSameDay } from "date-fns";

import { Button } from "@/components/ui/button";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import { useAuth } from "@/components/auth-provider";
import { useData } from "@/components/data-provider";
import { CalendarGrid } from "./calendar-grid";
import { AgendaPanel } from "./agenda-panel";
import { EventForm } from "./event-form";
import { SettingsModal } from "./settings-modal";
import { MigrationDialog } from "./migration-dialog";
import { ReminderChecker } from "./reminder-checker";
import { eventsForDay } from "@/lib/recurrence";
import { exportBackup, readBackupFile, migrateLegacyBackup } from "@/lib/backup";
import { toast } from "sonner";

export function CalendarPage() {
  const { user, logout } = useAuth();
  const { events, categories, settings, batchImport } = useData();

  const [viewDate, setViewDate] = useState(new Date());
  const [selectedDate, setSelectedDate] = useState(new Date());
  const [eventFormOpen, setEventFormOpen] = useState(false);
  const [editingEventId, setEditingEventId] = useState<string | null>(null);
  const [settingsOpen, setSettingsOpen] = useState(false);
  const fileInputRef = useRef<HTMLInputElement>(null);
  const [notifPermission, setNotifPermission] = useState<NotificationPermission | "unsupported">(
    typeof window !== "undefined" && "Notification" in window ? Notification.permission : "unsupported"
  );

  const today = new Date();

  const monthLabel = useMemo(
    () =>
      viewDate.toLocaleDateString(undefined, {
        month: "long",
        year: "numeric",
      }),
    [viewDate]
  );

  const gridStart = startOfWeek(startOfMonth(viewDate), { weekStartsOn: 0 });
  const gridEnd = endOfWeek(endOfMonth(viewDate), { weekStartsOn: 0 });

  const handlePrevMonth = () => {
    const d = new Date(viewDate);
    d.setMonth(d.getMonth() - 1);
    setViewDate(d);
  };

  const handleNextMonth = () => {
    const d = new Date(viewDate);
    d.setMonth(d.getMonth() + 1);
    setViewDate(d);
  };

  const handleToday = () => {
    const now = new Date();
    setViewDate(now);
    setSelectedDate(now);
  };

  const handleAddEvent = () => {
    setEditingEventId(null);
    setEventFormOpen(true);
  };

  const handleEditEvent = (id: string) => {
    setEditingEventId(id);
    setEventFormOpen(true);
  };

  const handleExport = () => {
    exportBackup(events, categories, settings);
    toast("Backup downloaded.");
  };

  const handleImportTrigger = () => {
    fileInputRef.current?.click();
  };

  const handleImportFile = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;
    try {
      const data = await readBackupFile(file);
      const { categories: cats, events: evs, settings: sets } = migrateLegacyBackup(
        data,
        user?.uid || ""
      );
      await batchImport(cats, evs, sets);
      toast("Backup restored.");
    } catch {
      toast("That file couldn't be read as a Ledger backup.");
    }
    e.target.value = "";
  };

  const handleRequestNotif = async () => {
    if (!("Notification" in window)) return;
    const permission = await Notification.requestPermission();
    setNotifPermission(permission);
  };

  return (
    <div className="app mx-auto flex min-h-screen max-w-6xl flex-col px-5 py-7">
      <header className="mb-6 flex flex-wrap items-baseline justify-between gap-4 border-b-2 border-foreground pb-4">
        <div className="flex flex-wrap items-baseline gap-3">
          <h1 className="text-3xl font-bold tracking-tight text-foreground">Ledger</h1>
          <span className="hidden font-mono text-xs uppercase tracking-widest text-muted-foreground sm:inline">
            a calendar kept your way
          </span>
        </div>

        <div className="flex flex-wrap items-center gap-2">
          {"Notification" in window && notifPermission !== "unsupported" && (
            <Button
              variant="outline"
              size="sm"
              onClick={handleRequestNotif}
              className="rounded-lg border-line text-xs"
            >
              {notifPermission === "granted" ? (
                <>
                  <Bell className="mr-1.5 h-3.5 w-3.5" /> Alerts on
                </>
              ) : notifPermission === "denied" ? (
                <>
                  <BellOff className="mr-1.5 h-3.5 w-3.5" /> Alerts blocked
                </>
              ) : (
                <>
                  <Bell className="mr-1.5 h-3.5 w-3.5" /> Turn on alerts
                </>
              )}
            </Button>
          )}

          <Button variant="outline" size="sm" onClick={handleExport} className="rounded-lg border-line text-xs">
            <Download className="mr-1.5 h-3.5 w-3.5" /> Export
          </Button>

          <Button variant="outline" size="sm" onClick={handleImportTrigger} className="rounded-lg border-line text-xs">
            <Upload className="mr-1.5 h-3.5 w-3.5" /> Import
          </Button>

          <input
            ref={fileInputRef}
            type="file"
            accept="application/json"
            onChange={handleImportFile}
            className="hidden"
          />

          <Button variant="outline" size="sm" onClick={() => setSettingsOpen(true)} className="rounded-lg border-line text-xs">
            <Settings className="mr-1.5 h-3.5 w-3.5" /> Settings
          </Button>

          <DropdownMenu>
            <DropdownMenuTrigger>
              <Button variant="ghost" size="sm" className="rounded-lg px-2">
                <Avatar className="h-7 w-7">
                  <AvatarImage src={user?.photoURL || undefined} alt={user?.displayName || "User"} />
                  <AvatarFallback className="bg-foreground text-primary-foreground text-xs">
                    {user?.displayName?.charAt(0) || "U"}
                  </AvatarFallback>
                </Avatar>
              </Button>
            </DropdownMenuTrigger>
            <DropdownMenuContent align="end">
              <DropdownMenuItem onClick={logout} className="text-xs">
                <LogOut className="mr-2 h-3.5 w-3.5" /> Sign out
              </DropdownMenuItem>
            </DropdownMenuContent>
          </DropdownMenu>

          <Button onClick={handleAddEvent} size="sm" className="rounded-lg bg-foreground text-primary-foreground hover:bg-rust">
            <Plus className="mr-1.5 h-3.5 w-3.5" /> Add event
          </Button>
        </div>
      </header>

      <main className="grid flex-1 gap-6 lg:grid-cols-[1.6fr_1fr] lg:items-start">
        <section className="rounded-2xl border-2 border-foreground bg-card p-5 shadow-sm">
          <div className="mb-4 flex items-center justify-between">
            <h2 className="text-2xl font-semibold text-foreground">{monthLabel}</h2>
            <div className="flex gap-1.5">
              <Button variant="outline" size="icon" onClick={handlePrevMonth} className="h-8 w-8 rounded-lg border-line">
                <ChevronLeft className="h-4 w-4" />
              </Button>
              <Button variant="outline" size="sm" onClick={handleToday} className="h-8 rounded-lg border-line text-xs">
                Today
              </Button>
              <Button variant="outline" size="icon" onClick={handleNextMonth} className="h-8 w-8 rounded-lg border-line">
                <ChevronRight className="h-4 w-4" />
              </Button>
            </div>
          </div>

          <CalendarGrid
            viewDate={viewDate}
            selectedDate={selectedDate}
            onSelectDate={setSelectedDate}
            gridStart={gridStart}
            gridEnd={gridEnd}
          />
        </section>

        <AgendaPanel
          selectedDate={selectedDate}
          onAddEvent={handleAddEvent}
          onEditEvent={handleEditEvent}
        />
      </main>

      <footer className="mt-8 break-words border-t border-line pt-4 font-mono text-xs leading-relaxed text-muted-foreground">
        Signed in as {user?.email}. Events are stored in your Firebase account and sync across devices.
      </footer>

      <EventForm
        open={eventFormOpen}
        onOpenChange={setEventFormOpen}
        selectedDate={selectedDate}
        editingEventId={editingEventId}
      />

      <SettingsModal open={settingsOpen} onOpenChange={setSettingsOpen} />

      <MigrationDialog />

      <ReminderChecker />
    </div>
  );
}
