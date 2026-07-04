import ICAL from "ical.js";
import { unzipSync, strFromU8 } from "fflate";
import type { Event, Category, Recurrence } from "./types";
import { parseLocalDate, formatDate, occurrencesInRange } from "./recurrence";

/**
 * Read a user-selected calendar file into one or more raw iCalendar strings.
 * Accepts a plain `.ics` file, or a `.zip` (e.g. a Google Calendar export,
 * which wraps one `.ics` per calendar). Detection is by the ZIP magic bytes
 * ("PK\x03\x04") rather than the file extension, so a misnamed file still works.
 */
export async function extractIcsTexts(file: File): Promise<string[]> {
  const bytes = new Uint8Array(await file.arrayBuffer());
  const isZip =
    bytes.length >= 4 &&
    bytes[0] === 0x50 &&
    bytes[1] === 0x4b &&
    bytes[2] === 0x03 &&
    bytes[3] === 0x04;

  if (!isZip) {
    return [strFromU8(bytes)];
  }

  const entries = unzipSync(bytes);
  return Object.entries(entries)
    .filter(([name]) => name.toLowerCase().endsWith(".ics"))
    .map(([, data]) => strFromU8(data));
}

function toIcsDateTime(dateStr: string, timeStr?: string): string {
  const d = parseLocalDate(dateStr);
  if (timeStr) {
    const [h, m] = timeStr.split(":").map(Number);
    d.setHours(h, m, 0, 0);
    return d.toISOString().replace(/[-:]/g, "").split(".")[0] + "Z";
  }
  return d.toISOString().replace(/[-:]/g, "").split(".")[0].slice(0, 8);
}

function recurrenceToRrule(r: Recurrence, until?: string): string | null {
  if (r === "none") return null;
  const freq = r.toUpperCase();
  let rule = `FREQ=${freq}`;
  if (until) {
    const u = parseLocalDate(until);
    rule += `;UNTIL=${u.toISOString().replace(/[-:]/g, "").split(".")[0].slice(0, 8)}`;
  }
  return rule;
}

export function exportEventsToIcs(events: Event[], categories: Category[]): string {
  const lines = [
    "BEGIN:VCALENDAR",
    "VERSION:2.0",
    "PRODID:-//Ledger//EN",
    "CALSCALE:GREGORIAN",
    "METHOD:PUBLISH",
  ];

  events.forEach((ev) => {
    const cat = categories.find((c) => c.id === ev.categoryId);
    const dtstart = toIcsDateTime(ev.date, ev.time);
    let dtend: string;
    if (ev.allDay) {
      const next = parseLocalDate(ev.date);
      next.setDate(next.getDate() + 1);
      dtend = next.toISOString().replace(/[-:]/g, "").split(".")[0].slice(0, 8);
    } else if (ev.endTime) {
      dtend = toIcsDateTime(ev.date, ev.endTime);
    } else {
      const start = parseLocalDate(ev.date);
      if (ev.time) {
        const [h, m] = ev.time.split(":").map(Number);
        start.setHours(h, m + 60, 0, 0);
      } else {
        start.setDate(start.getDate() + 1);
      }
      dtend = ev.time
        ? start.toISOString().replace(/[-:]/g, "").split(".")[0] + "Z"
        : start.toISOString().replace(/[-:]/g, "").split(".")[0].slice(0, 8);
    }

    lines.push("BEGIN:VEVENT");
    lines.push(`UID:${ev.id}@ledger`);
    lines.push(`DTSTAMP:${new Date().toISOString().replace(/[-:]/g, "").split(".")[0]}Z`);
    lines.push(`SUMMARY:${escapeIcs(ev.title)}`);
    if (ev.allDay) {
      lines.push(`DTSTART;VALUE=DATE:${dtstart}`);
      lines.push(`DTEND;VALUE=DATE:${dtend}`);
    } else {
      lines.push(`DTSTART:${dtstart}`);
      lines.push(`DTEND:${dtend}`);
    }
    if (ev.notes) lines.push(`DESCRIPTION:${escapeIcs(ev.notes)}`);
    if (cat) lines.push(`CATEGORIES:${escapeIcs(cat.name)}`);
    const rrule = recurrenceToRrule(ev.recurrence, ev.until);
    if (rrule) lines.push(`RRULE:${rrule}`);
    lines.push("END:VEVENT");
  });

  lines.push("END:VCALENDAR");
  return lines.join("\r\n");
}

function escapeIcs(str: string): string {
  return str.replace(/\\/g, "\\\\").replace(/;/g, "\\;").replace(/,/g, "\\,").replace(/\n/g, "\\n");
}

export function parseIcsEvents(icsText: string, userId: string): Partial<Event>[] {
  const jcal = ICAL.parse(icsText);
  const comp = new ICAL.Component(jcal);
  const vevents = comp.getAllSubcomponents("vevent");

  return vevents.map((vev) => {
    const event = new ICAL.Event(vev);
    const start = event.startDate.toJSDate();
    const end = event.endDate?.toJSDate();

    const isAllDay = event.startDate.isDate;
    const date = formatDate(start);
    const time = isAllDay
      ? undefined
      : `${String(start.getHours()).padStart(2, "0")}:${String(start.getMinutes()).padStart(2, "0")}`;
    const endTime =
      !isAllDay && end && end.getTime() !== start.getTime()
        ? `${String(end.getHours()).padStart(2, "0")}:${String(end.getMinutes()).padStart(2, "0")}`
        : undefined;

    const rrule = vev.getFirstPropertyValue("rrule") as unknown as { freq?: string; until?: { toJSDate: () => Date } } | null;
    let recurrence: Recurrence = "none";
    let until: string | undefined;
    if (rrule) {
      const freq = String(rrule.freq || "").toLowerCase();
      if (["daily", "weekly", "monthly", "yearly"].includes(freq)) {
        recurrence = freq as Recurrence;
      }
      if (rrule.until) {
        until = formatDate(rrule.until.toJSDate());
      }
    }

    return {
      title: event.summary || "Untitled event",
      date,
      allDay: isAllDay,
      time,
      endTime,
      recurrence,
      until,
      notes: event.description || undefined,
      reminders: [],
    };
  });
}
