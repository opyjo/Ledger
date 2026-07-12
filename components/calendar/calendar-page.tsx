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
  MoreHorizontal,
  Moon,
  Sun,
} from "lucide-react";
import { useTheme } from "next-themes";
import { startOfMonth, endOfMonth, startOfWeek, endOfWeek } from "date-fns";

import { Button } from "@/components/ui/button";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuGroup,
  DropdownMenuItem,
  DropdownMenuLabel,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import { useAuth } from "@/components/auth-provider";
import { useData } from "@/components/data-provider";
import { ThemeToggle } from "@/components/theme-toggle";
import { CalendarGrid } from "./calendar-grid";
import { AgendaPanel } from "./agenda-panel";
import { FiltersBar } from "./filters-bar";
import { YearPicker } from "./year-picker";
import { WeekView } from "./week-view";
import { TodoPanel } from "./todo-panel";
import { CalendarSkeleton } from "./loading-skeleton";
import { CommandPalette } from "./command-palette";
import { useKeyboardShortcuts, ShortcutsHelpDialog } from "./keyboard-shortcuts";
import { EventForm } from "./event-form";
import { SettingsModal } from "./settings-modal";
import { MigrationDialog } from "./migration-dialog";
import { ReminderChecker } from "./reminder-checker";
import { formatDate } from "@/lib/recurrence";
import { exportBackup, readBackupFile, migrateLegacyBackup } from "@/lib/backup";
import { exportEventsToIcs, parseIcsEvents, extractIcsTexts } from "@/lib/ics";
import type { Event } from "@/lib/types";
import { toast } from "sonner";

export function CalendarPage() {
  const { user, logout } = useAuth();
  const { resolvedTheme, setTheme } = useTheme();
  const { events, categories, settings, todos, batchImport, loading: dataLoading } = useData();

  const [viewDate, setViewDate] = useState(new Date());
  const [selectedDate, setSelectedDate] = useState(new Date());
  const [eventFormOpen, setEventFormOpen] = useState(false);
  const [editingEventId, setEditingEventId] = useState<string | null>(null);
  const [settingsOpen, setSettingsOpen] = useState(false);
  const [commandOpen, setCommandOpen] = useState(false);
  const [view, setView] = useState<"month" | "week" | "todos">("month");

  // Restore the last-used view; first-time visitors on small screens get the
  // week view, which fits a phone better than the 7-column month grid.
  useEffect(() => {
    const saved = localStorage.getItem("ledger:view");
    if (saved === "month" || saved === "week" || saved === "todos") {
      // eslint-disable-next-line react-hooks/set-state-in-effect
      setView(saved);
    } else if (window.matchMedia("(max-width: 639px)").matches) {
      // eslint-disable-next-line react-hooks/set-state-in-effect
      setView("week");
    }
  }, []);

  // Persist on user-driven changes only (not in an effect: StrictMode re-runs
  // mount effects, and a write effect would clobber the saved view between the
  // restore effect's two runs).
  const changeView = (v: "month" | "week" | "todos") => {
    setView(v);
    localStorage.setItem("ledger:view", v);
  };
  const [searchQuery, setSearchQuery] = useState("");
  const [activeCategoryIds, setActiveCategoryIds] = useState<string[]>([]);
  const fileInputRef = useRef<HTMLInputElement>(null);
  const icsInputRef = useRef<HTMLInputElement>(null);
  const agendaRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    if (categories.length && activeCategoryIds.length === 0) {
      setActiveCategoryIds(categories.map((c) => c.id));
    }
  }, [categories, activeCategoryIds.length]);
  const [notifPermission, setNotifPermission] = useState<NotificationPermission | "unsupported">(
    typeof window !== "undefined" && "Notification" in window ? Notification.permission : "unsupported"
  );

  // Only render browser-capability-dependent UI after mount so server and
  // client markup match (avoids touching `window` during render/hydration).
  const [mounted, setMounted] = useState(false);
  useEffect(() => {
    // eslint-disable-next-line react-hooks/set-state-in-effect
    setMounted(true);
  }, []);

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

  const openTodoCount = useMemo(() => todos.filter((t) => !t.done).length, [todos]);

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

  // Below lg the agenda stacks under the grid, so a tap on a day would
  // otherwise give no visible feedback — bring the agenda into view.
  const handleSelectDate = (date: Date) => {
    setSelectedDate(date);
    if (window.matchMedia("(max-width: 1023px)").matches) {
      requestAnimationFrame(() =>
        agendaRef.current?.scrollIntoView({ behavior: "smooth", block: "start" })
      );
    }
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

  const handleExportIcs = () => {
    const ics = exportEventsToIcs(events, categories);
    const blob = new Blob([ics], { type: "text/calendar" });
    const url = URL.createObjectURL(blob);
    const a = document.createElement("a");
    a.href = url;
    a.download = `ledger-${formatDate(new Date())}.ics`;
    a.click();
    URL.revokeObjectURL(url);
    toast("ICS calendar exported.");
  };

  const handleImportIcsTrigger = () => {
    icsInputRef.current?.click();
  };

  const handleImportIcs = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;
    try {
      // Accepts a raw .ics or a .zip (e.g. a Google Calendar export, which
      // wraps one .ics per calendar). extractIcsTexts unwraps either.
      const icsTexts = await extractIcsTexts(file);
      if (icsTexts.length === 0) {
        toast("No calendar (.ics) was found in that file.");
        e.target.value = "";
        return;
      }
      const now = Date.now();
      const parsed = icsTexts.flatMap((text) =>
        parseIcsEvents(text, user?.uid || "")
      );
      const evs: Event[] = parsed.map((p, idx) => ({
        id: `ics${now}${idx}`,
        userId: user?.uid || "",
        title: p.title || "Imported event",
        date: p.date || formatDate(new Date()),
        allDay: p.allDay,
        time: p.time,
        endTime: p.endTime,
        recurrence: p.recurrence || "none",
        until: p.until,
        categoryId: categories[0]?.id || "other",
        reminders: [],
        notes: p.notes,
        createdAt: now,
        updatedAt: now,
      }));
      await batchImport([], evs, settings);
      toast(`${evs.length} event(s) imported.`);
    } catch {
      toast("That calendar file couldn't be read.");
    }
    e.target.value = "";
  };

  const handleRequestNotif = async () => {
    if (!("Notification" in window)) return;
    const permission = await Notification.requestPermission();
    setNotifPermission(permission);
  };

  const { helpOpen, setHelpOpen } = useKeyboardShortcuts({
    onAddEvent: handleAddEvent,
    onToday: handleToday,
    onPrevMonth: handlePrevMonth,
    onNextMonth: handleNextMonth,
    onOpenCommandPalette: () => setCommandOpen(true),
    onSetView: changeView,
  });

  const handleToggleCategory = (id: string) => {
    setActiveCategoryIds((prev) =>
      prev.includes(id) ? prev.filter((c) => c !== id) : [...prev, id]
    );
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
          <div className="hidden sm:block">
            <ThemeToggle />
          </div>

          {mounted && notifPermission !== "unsupported" && (
            <Button
              variant="outline"
              size="sm"
              onClick={handleRequestNotif}
              className="hidden rounded-lg border-line text-xs sm:inline-flex"
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

          {/* Hidden file inputs for JSON + ICS import, triggered from the menu */}
          <input
            ref={fileInputRef}
            type="file"
            accept="application/json"
            onChange={handleImportFile}
            className="hidden"
          />
          <input
            ref={icsInputRef}
            type="file"
            accept="text/calendar,.ics,.zip,application/zip"
            onChange={handleImportIcs}
            className="hidden"
          />

          <DropdownMenu>
            <DropdownMenuTrigger
              render={
                <Button
                  variant="outline"
                  size="sm"
                  className="rounded-lg border-line text-xs"
                />
              }
            >
              <MoreHorizontal className="mr-1.5 h-3.5 w-3.5" /> More
            </DropdownMenuTrigger>
            <DropdownMenuContent align="end" className="w-60">
              {/* Theme + alerts live in the header on sm+; fold them in here on phones */}
              <DropdownMenuGroup className="sm:hidden">
                <DropdownMenuItem
                  onClick={() => setTheme(resolvedTheme === "dark" ? "light" : "dark")}
                  className="text-xs"
                >
                  {resolvedTheme === "dark" ? (
                    <>
                      <Sun className="mr-2 h-3.5 w-3.5" /> Light theme
                    </>
                  ) : (
                    <>
                      <Moon className="mr-2 h-3.5 w-3.5" /> Dark theme
                    </>
                  )}
                </DropdownMenuItem>
                {mounted && notifPermission !== "unsupported" && (
                  <DropdownMenuItem onClick={handleRequestNotif} className="text-xs">
                    {notifPermission === "granted" ? (
                      <>
                        <Bell className="mr-2 h-3.5 w-3.5" /> Alerts on
                      </>
                    ) : notifPermission === "denied" ? (
                      <>
                        <BellOff className="mr-2 h-3.5 w-3.5" /> Alerts blocked
                      </>
                    ) : (
                      <>
                        <Bell className="mr-2 h-3.5 w-3.5" /> Turn on alerts
                      </>
                    )}
                  </DropdownMenuItem>
                )}
                <DropdownMenuSeparator />
              </DropdownMenuGroup>
              <DropdownMenuGroup>
                <DropdownMenuLabel className="font-mono text-[10px] uppercase tracking-widest text-muted-foreground">
                  Backup
                </DropdownMenuLabel>
                <DropdownMenuItem onClick={handleExport} className="text-xs">
                  <Download className="mr-2 h-3.5 w-3.5" /> Export backup (.json)
                </DropdownMenuItem>
                <DropdownMenuItem onClick={handleImportTrigger} className="text-xs">
                  <Upload className="mr-2 h-3.5 w-3.5" /> Import backup (.json)
                </DropdownMenuItem>
              </DropdownMenuGroup>
              <DropdownMenuSeparator />
              <DropdownMenuGroup>
                <DropdownMenuLabel className="font-mono text-[10px] uppercase tracking-widest text-muted-foreground">
                  Calendar file
                </DropdownMenuLabel>
                <DropdownMenuItem onClick={handleExportIcs} className="text-xs">
                  <Download className="mr-2 h-3.5 w-3.5" /> Export calendar (.ics)
                </DropdownMenuItem>
                <DropdownMenuItem onClick={handleImportIcsTrigger} className="text-xs">
                  <Upload className="mr-2 h-3.5 w-3.5" /> Import calendar (.ics / .zip)
                </DropdownMenuItem>
              </DropdownMenuGroup>
              <DropdownMenuSeparator />
              <DropdownMenuItem onClick={() => setSettingsOpen(true)} className="text-xs">
                <Settings className="mr-2 h-3.5 w-3.5" /> Settings
              </DropdownMenuItem>
            </DropdownMenuContent>
          </DropdownMenu>

          <DropdownMenu>
            <DropdownMenuTrigger
              render={<Button variant="ghost" size="sm" className="rounded-lg px-2" />}
            >
              <Avatar className="h-7 w-7">
                <AvatarImage src={user?.photoURL || undefined} alt={user?.displayName || "User"} />
                <AvatarFallback className="bg-foreground text-primary-foreground text-xs">
                  {user?.displayName?.charAt(0) || "U"}
                </AvatarFallback>
              </Avatar>
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

      {dataLoading ? (
        <CalendarSkeleton />
      ) : (
        <>
          <FiltersBar
            searchQuery={searchQuery}
            onSearchChange={setSearchQuery}
            activeCategoryIds={activeCategoryIds}
            onToggleCategory={handleToggleCategory}
          />

          {events.length === 0 && (
            <div className="mb-4 flex flex-wrap items-center gap-x-2 gap-y-1 rounded-xl border border-dashed border-line bg-panel px-4 py-3 font-mono text-xs text-muted-foreground">
              <span>Welcome to your ledger.</span>
              <span>
                Press{" "}
                <kbd className="rounded-md border border-line bg-background px-1.5 py-0.5 text-[11px] text-foreground">
                  N
                </kbd>{" "}
                to add an event, or{" "}
                <kbd className="rounded-md border border-line bg-background px-1.5 py-0.5 text-[11px] text-foreground">
                  ⌘K
                </kbd>{" "}
                for the command palette.
              </span>
            </div>
          )}

          <main className="grid flex-1 gap-6 lg:grid-cols-[1.6fr_1fr] lg:items-start">
        <section className="rounded-2xl border-2 border-foreground bg-card p-5 shadow-sm">
          <div className="mb-4 flex flex-wrap items-center justify-between gap-3">
            {view === "todos" ? (
              <span className="text-left font-serif text-2xl font-semibold text-foreground">Todos</span>
            ) : (
              <YearPicker viewDate={viewDate} onChange={setViewDate}>
                <span className="cursor-pointer text-left font-serif text-2xl font-semibold text-foreground hover:opacity-70">
                  {monthLabel}
                </span>
              </YearPicker>
            )}
            <div className="flex items-center gap-1.5">
              <div className="flex rounded-lg border border-line p-0.5">
                <button
                  onClick={() => changeView("month")}
                  className={[
                    "rounded-md px-3 py-1.5 text-xs font-medium transition-colors sm:px-2.5 sm:py-1",
                    view === "month" ? "bg-foreground text-primary-foreground" : "text-muted-foreground hover:bg-panel",
                  ].join(" ")}
                >
                  Month
                </button>
                <button
                  onClick={() => changeView("week")}
                  className={[
                    "rounded-md px-3 py-1.5 text-xs font-medium transition-colors sm:px-2.5 sm:py-1",
                    view === "week" ? "bg-foreground text-primary-foreground" : "text-muted-foreground hover:bg-panel",
                  ].join(" ")}
                >
                  Week
                </button>
                <button
                  onClick={() => changeView("todos")}
                  className={[
                    "rounded-md px-3 py-1.5 text-xs font-medium transition-colors sm:px-2.5 sm:py-1",
                    view === "todos" ? "bg-foreground text-primary-foreground" : "text-muted-foreground hover:bg-panel",
                  ].join(" ")}
                >
                  Todos
                  {openTodoCount > 0 && (
                    <span className="ml-1 font-mono text-[10px] opacity-70">{openTodoCount}</span>
                  )}
                </button>
              </div>
              {view !== "todos" && (
                <>
                  <Button variant="outline" size="icon" onClick={handlePrevMonth} className="h-9 w-9 rounded-lg border-line sm:h-8 sm:w-8">
                    <ChevronLeft className="h-4 w-4" />
                  </Button>
                  <Button variant="outline" size="sm" onClick={handleToday} className="h-9 rounded-lg border-line text-xs sm:h-8">
                    Today
                  </Button>
                  <Button variant="outline" size="icon" onClick={handleNextMonth} className="h-9 w-9 rounded-lg border-line sm:h-8 sm:w-8">
                    <ChevronRight className="h-4 w-4" />
                  </Button>
                </>
              )}
            </div>
          </div>

          {view === "todos" ? (
            <TodoPanel searchQuery={searchQuery} activeCategoryIds={activeCategoryIds} />
          ) : view === "month" ? (
            <CalendarGrid
              viewDate={viewDate}
              selectedDate={selectedDate}
              onSelectDate={handleSelectDate}
              gridStart={gridStart}
              gridEnd={gridEnd}
              searchQuery={searchQuery}
              activeCategoryIds={activeCategoryIds}
            />
          ) : (
            <WeekView
              viewDate={viewDate}
              selectedDate={selectedDate}
              onSelectDate={handleSelectDate}
              searchQuery={searchQuery}
              activeCategoryIds={activeCategoryIds}
            />
          )}
        </section>

        <div ref={agendaRef} className="scroll-mt-4">
          <AgendaPanel
            selectedDate={selectedDate}
            onAddEvent={handleAddEvent}
            onEditEvent={handleEditEvent}
            searchQuery={searchQuery}
            activeCategoryIds={activeCategoryIds}
          />
        </div>
      </main>
        </>
      )}

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

      <CommandPalette
        open={commandOpen}
        onOpenChange={setCommandOpen}
        onAddEvent={handleAddEvent}
        onOpenSettings={() => setSettingsOpen(true)}
        onToday={handleToday}
        onPrevMonth={handlePrevMonth}
        onNextMonth={handleNextMonth}
        onSelectDate={(date) => {
          setViewDate(date);
          setSelectedDate(date);
        }}
        onGoToTodos={() => changeView("todos")}
      />

      <ShortcutsHelpDialog open={helpOpen} onOpenChange={setHelpOpen} />

      <MigrationDialog />

      <ReminderChecker />
    </div>
  );
}
