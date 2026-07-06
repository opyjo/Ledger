"use client";

import { Bell, Pencil } from "lucide-react";
import { useData } from "@/components/data-provider";
import { eventsForDay, categoryById } from "@/lib/recurrence";
import { Button } from "@/components/ui/button";

interface AgendaPanelProps {
  selectedDate: Date;
  onAddEvent: () => void;
  onEditEvent: (id: string) => void;
  searchQuery: string;
  activeCategoryIds: string[];
}

function fmtDayHeading(d: Date) {
  return d.toLocaleDateString(undefined, {
    weekday: "long",
    month: "long",
    day: "numeric",
  });
}

export function AgendaPanel({ selectedDate, onAddEvent, onEditEvent, searchQuery, activeCategoryIds }: AgendaPanelProps) {
  const { events, categories } = useData();
  const today = new Date();
  const isToday = selectedDate.toDateString() === today.toDateString();

  const q = searchQuery.toLowerCase();
  const filteredEvents = events.filter((ev) => {
    const matchesCategory = activeCategoryIds.includes(ev.categoryId);
    const matchesSearch =
      !q ||
      ev.title.toLowerCase().includes(q) ||
      (ev.notes && ev.notes.toLowerCase().includes(q));
    return matchesCategory && matchesSearch;
  });

  const dayEvents = eventsForDay(filteredEvents, selectedDate, categories);

  return (
    <section className="rounded-2xl border-2 border-foreground bg-card p-5 shadow-sm">
      <div className="mb-4 flex items-baseline justify-between">
        <div>
          <h3 className="text-xl font-semibold text-foreground">{isToday ? "Today" : fmtDayHeading(selectedDate)}</h3>
          <p className="font-mono text-xs text-muted-foreground">{fmtDayHeading(selectedDate)}</p>
        </div>
      </div>

      <div className="space-y-3">
        {dayEvents.length === 0 ? (
          <div className="py-6 text-sm italic text-muted-foreground">Nothing on the page yet. Add an event below.</div>
        ) : (
          dayEvents.map((ev) => {
            const cat = categoryById(categories, ev.categoryId);
            return (
              <div
                key={ev.id}
                className="group flex items-start gap-3 rounded-xl border border-line bg-panel p-3"
              >
                <div
                  className="mt-1 w-1.5 self-stretch rounded-full"
                  style={{ backgroundColor: cat.color }}
                />
                <div className="min-w-0 flex-1">
                  <div className="font-semibold text-sm text-foreground">{ev.title}</div>
                  <div className="font-mono text-[11px] text-muted-foreground">
                    {ev.allDay || !ev.time ? "All day" : `${ev.time}${ev.endTime ? ` – ${ev.endTime}` : ""}`}
                    {ev.recurrence !== "none" && ` · repeats ${ev.recurrence}`}
                  </div>
                  {ev.notes && <div className="mt-1 text-xs text-muted-foreground">{ev.notes}</div>}
                  {ev.reminders && ev.reminders.length > 0 && (
                    <div className="mt-1 flex items-center gap-1 font-mono text-[11px] text-teal">
                      <Bell className="h-3 w-3" />
                      {ev.reminders
                        .map((m) => (m === 0 ? "at start" : `${m}m before`))
                        .join(", ")}
                    </div>
                  )}
                </div>
                <Button
                  variant="ghost"
                  size="icon"
                  aria-label={`Edit ${ev.title}`}
                  className="h-9 w-9 transition-opacity group-hover:opacity-100 focus-visible:opacity-100 sm:h-7 sm:w-7 sm:opacity-60"
                  onClick={() => onEditEvent(ev.id)}
                >
                  <Pencil className="h-3.5 w-3.5" />
                </Button>
              </div>
            );
          })
        )}
      </div>

      <Button
        onClick={onAddEvent}
        className="mt-5 w-full rounded-lg bg-foreground text-primary-foreground hover:bg-rust"
      >
        + Add event
      </Button>
    </section>
  );
}
