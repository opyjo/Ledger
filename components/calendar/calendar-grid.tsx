"use client";

import { useMemo } from "react";
import { eachDayOfInterval, isSameDay, isSameMonth } from "date-fns";
import { useData } from "@/components/data-provider";
import { eventsForDay, categoryById } from "@/lib/recurrence";

interface CalendarGridProps {
  viewDate: Date;
  selectedDate: Date;
  gridStart: Date;
  gridEnd: Date;
  onSelectDate: (date: Date) => void;
  searchQuery: string;
  activeCategoryIds: string[];
}

const DOW = ["S", "M", "T", "W", "T", "F", "S"];

export function CalendarGrid({
  selectedDate,
  gridStart,
  gridEnd,
  onSelectDate,
  viewDate,
  searchQuery,
  activeCategoryIds,
}: CalendarGridProps) {
  const { events, categories } = useData();
  const days = useMemo(() => eachDayOfInterval({ start: gridStart, end: gridEnd }), [gridStart, gridEnd]);
  const today = new Date();

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
    <div role="grid" aria-label="Calendar">
      <div role="row" className="grid grid-cols-7 gap-1.5">
        {DOW.map((d) => (
          <div key={d} role="columnheader" className="pb-1 text-center font-mono text-[11px] uppercase tracking-widest text-muted-foreground">
            {d}
          </div>
        ))}
      </div>
      <div role="rowgroup" className="grid grid-cols-7 gap-1.5">
        {days.map((day) => {
          const isMuted = !isSameMonth(day, viewDate);
          const isToday = isSameDay(day, today);
          const isSelected = isSameDay(day, selectedDate);
          const dayEvents = eventsForDay(filteredEvents, day, categories);

          const ariaLabel = day.toLocaleDateString(undefined, {
            weekday: "long",
            month: "long",
            day: "numeric",
          });

          return (
            <button
              key={day.toISOString()}
              role="gridcell"
              aria-selected={isSelected}
              aria-label={ariaLabel}
              onClick={() => onSelectDate(day)}
              className={[
                "group flex min-h-[44px] flex-col justify-between rounded-lg border p-1.5 text-left transition-colors sm:aspect-square sm:p-2",
                isMuted ? "opacity-35" : "",
                isSelected
                  ? "border-2 border-foreground bg-panel"
                  : "border-line hover:bg-panel",
                isToday && !isSelected ? "border-2 border-rust" : "",
              ].join(" ")}
            >
              <span
                className={[
                  "font-mono text-xs font-medium sm:text-sm",
                  isToday ? "font-bold text-rust" : "text-foreground",
                ].join(" ")}
              >
                {day.getDate()}
              </span>
              <div className="flex flex-wrap items-center gap-1">
                {dayEvents.slice(0, 4).map((ev) => {
                  const cat = categoryById(categories, ev.categoryId);
                  return (
                    <span
                      key={ev.id}
                      className="h-1 w-1 rounded-full sm:h-1.5 sm:w-1.5"
                      style={{ backgroundColor: cat.color }}
                    />
                  );
                })}
                {dayEvents.length > 4 && (
                  <span className="font-mono text-[9px] leading-none text-muted-foreground sm:text-[10px]">
                    +{dayEvents.length - 4}
                  </span>
                )}
              </div>
            </button>
          );
        })}
      </div>
    </div>
  );
}
