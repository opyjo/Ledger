"use client";

import { Bell, Pencil } from "lucide-react";
import { useData } from "@/components/data-provider";
import { eventsForDay, categoryById, formatDate } from "@/lib/recurrence";
import { Button } from "@/components/ui/button";

interface AgendaPanelProps {
  selectedDate: Date;
  onAddEvent: () => void;
  onEditEvent: (id: string) => void;
}

function fmtDayHeading(d: Date) {
  return d.toLocaleDateString(undefined, {
    weekday: "long",
    month: "long",
    day: "numeric",
  });
}

export function AgendaPanel({ selectedDate, onAddEvent, onEditEvent }: AgendaPanelProps) {
  const { events, categories } = useData();
  const today = new Date();
  const isToday = selectedDate.toDateString() === today.toDateString();
  const dayEvents = eventsForDay(events, selectedDate, categories);

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
                    {ev.time ? `${ev.time}${ev.endTime ? ` – ${ev.endTime}` : ""}` : "All day"}
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
                  className="h-7 w-7 opacity-100 sm:opacity-0 sm:group-hover:opacity-100"
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
