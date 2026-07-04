"use client";

import { eachDayOfInterval, startOfWeek, endOfWeek, isSameDay, format } from "date-fns";
import { useData } from "@/components/data-provider";
import { eventsForDay, categoryById } from "@/lib/recurrence";

interface WeekViewProps {
  viewDate: Date;
  selectedDate: Date;
  onSelectDate: (date: Date) => void;
  searchQuery: string;
  activeCategoryIds: string[];
}

export function WeekView({ viewDate, selectedDate, onSelectDate, searchQuery, activeCategoryIds }: WeekViewProps) {
  const { events, categories } = useData();
  const today = new Date();
  const weekStart = startOfWeek(viewDate, { weekStartsOn: 0 });
  const weekEnd = endOfWeek(viewDate, { weekStartsOn: 0 });
  const days = eachDayOfInterval({ start: weekStart, end: weekEnd });

  const q = searchQuery.toLowerCase();
  const filteredEvents = events.filter((ev) => {
    const matchesCategory = activeCategoryIds.includes(ev.categoryId);
    const matchesSearch =
      !q ||
      ev.title.toLowerCase().includes(q) ||
      (ev.notes && ev.notes.toLowerCase().includes(q));
    return matchesCategory && matchesSearch;
  });

  return (
    <div className="grid grid-cols-1 gap-3 sm:grid-cols-7">
      {days.map((day) => {
        const isToday = isSameDay(day, today);
        const isSelected = isSameDay(day, selectedDate);
        const dayEvents = eventsForDay(filteredEvents, day, categories);

        return (
          <button
            key={day.toISOString()}
            onClick={() => onSelectDate(day)}
            className={[
              "min-h-[120px] rounded-xl border p-3 text-left transition-colors",
              isSelected ? "border-2 border-foreground bg-panel" : "border-line hover:bg-panel",
              isToday && !isSelected ? "border-2 border-rust" : "",
            ].join(" ")}
          >
            <div className="mb-2 text-center">
              <div className="font-mono text-[11px] uppercase text-muted-foreground">{format(day, "EEE")}</div>
              <div
                className={[
                  "mx-auto mt-1 flex h-7 w-7 items-center justify-center rounded-full font-mono text-sm font-medium",
                  isToday ? "bg-rust text-white" : "text-foreground",
                ].join(" ")}
              >
                {day.getDate()}
              </div>
            </div>
            <div className="space-y-1.5">
              {dayEvents.slice(0, 4).map((ev) => {
                const cat = categoryById(categories, ev.categoryId);
                return (
                  <div key={ev.id} className="flex items-center gap-1.5 text-xs">
                    <span className="h-2 w-2 flex-shrink-0 rounded-full" style={{ backgroundColor: cat.color }} />
                    <span className="truncate">{ev.title}</span>
                  </div>
                );
              })}
              {dayEvents.length > 4 && (
                <div className="text-[10px] text-muted-foreground">+{dayEvents.length - 4} more</div>
              )}
            </div>
          </button>
        );
      })}
    </div>
  );
}
