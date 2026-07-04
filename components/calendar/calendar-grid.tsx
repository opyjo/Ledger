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
}

const DOW = ["S", "M", "T", "W", "T", "F", "S"];

export function CalendarGrid({
  selectedDate,
  gridStart,
  gridEnd,
  onSelectDate,
  viewDate,
}: CalendarGridProps) {
  const { events, categories } = useData();
  const days = useMemo(() => eachDayOfInterval({ start: gridStart, end: gridEnd }), [gridStart, gridEnd]);
  const today = new Date();

  return (
    <div>
      <div className="grid grid-cols-7 gap-1.5">
        {DOW.map((d) => (
          <div key={d} className="pb-1 text-center font-mono text-[11px] uppercase tracking-widest text-muted-foreground">
            {d}
          </div>
        ))}
      </div>
      <div className="grid grid-cols-7 gap-1.5">
        {days.map((day) => {
          const isMuted = !isSameMonth(day, viewDate);
          const isToday = isSameDay(day, today);
          const isSelected = isSameDay(day, selectedDate);
          const dayEvents = eventsForDay(events, day, categories);

          return (
            <button
              key={day.toISOString()}
              onClick={() => onSelectDate(day)}
              className={[
                "group flex aspect-square flex-col justify-between rounded-lg border p-2 text-left transition-colors",
                isMuted ? "opacity-35" : "",
                isSelected
                  ? "border-2 border-foreground bg-panel"
                  : "border-line hover:bg-panel",
                isToday && !isSelected ? "border-2 border-rust" : "",
              ].join(" ")}
            >
              <span
                className={[
                  "font-mono text-sm font-medium",
                  isToday ? "font-bold text-rust" : "text-foreground",
                ].join(" ")}
              >
                {day.getDate()}
              </span>
              <div className="flex flex-wrap gap-1">
                {dayEvents.slice(0, 4).map((ev) => {
                  const cat = categoryById(categories, ev.categoryId);
                  return (
                    <span
                      key={ev.id}
                      className="h-1.5 w-1.5 rounded-full"
                      style={{ backgroundColor: cat.color }}
                    />
                  );
                })}
              </div>
            </button>
          );
        })}
      </div>
    </div>
  );
}
