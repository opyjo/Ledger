import { addDays, addMonths, addYears, isSameDay, startOfDay } from "date-fns";
import type { Category, Event, Recurrence } from "./types";

export function parseLocalDate(dateStr: string): Date {
  const [year, month, day] = dateStr.split("-").map(Number);
  return new Date(year, month - 1, day);
}

export function formatDate(d: Date): string {
  const year = d.getFullYear();
  const month = String(d.getMonth() + 1).padStart(2, "0");
  const day = String(d.getDate()).padStart(2, "0");
  return `${year}-${month}-${day}`;
}

export function occurrencesInRange(
  event: Pick<Event, "date" | "recurrence" | "until">,
  rangeStart: Date,
  rangeEnd: Date
): Date[] {
  const start = startOfDay(parseLocalDate(event.date));
  const out: Date[] = [];

  if (event.recurrence === "none") {
    if (start >= startOfDay(rangeStart) && start <= startOfDay(rangeEnd)) {
      out.push(new Date(start));
    }
    return out;
  }

  const until = event.until ? startOfDay(parseLocalDate(event.until)) : null;
  let cursor = new Date(start);
  let guard = 0;

  while (cursor <= rangeEnd && guard < 2000) {
    guard++;
    if (until && cursor > until) break;
    if (cursor >= rangeStart) {
      out.push(new Date(cursor));
    }

    switch (event.recurrence) {
      case "daily":
        cursor = addDays(cursor, 1);
        break;
      case "weekly":
        cursor = addDays(cursor, 7);
        break;
      case "monthly":
        cursor = addMonths(cursor, 1);
        break;
      case "yearly":
        cursor = addYears(cursor, 1);
        break;
      default:
        return out;
    }
  }

  return out;
}

export function occursOnDay(
  event: Pick<Event, "date" | "recurrence" | "until">,
  day: Date
): boolean {
  const rangeStart = startOfDay(day);
  const rangeEnd = new Date(rangeStart);
  rangeEnd.setHours(23, 59, 59, 999);
  return occurrencesInRange(event, rangeStart, rangeEnd).some((d) => isSameDay(d, day));
}

export function eventsForDay(
  events: Event[],
  day: Date,
  categories: Category[]
): Event[] {
  const rangeStart = startOfDay(day);
  const rangeEnd = new Date(rangeStart);
  rangeEnd.setHours(23, 59, 59, 999);

  const result = events.filter((ev) =>
    occurrencesInRange(ev, rangeStart, rangeEnd).length > 0
  );

  result.sort((a, b) => (a.time || "99:99").localeCompare(b.time || "99:99"));
  return result;
}

export function categoryById(categories: Category[], id: string): Category {
  return categories.find((c) => c.id === id) || categories[0];
}
