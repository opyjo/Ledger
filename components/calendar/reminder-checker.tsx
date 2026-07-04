"use client";

import { useEffect, useRef } from "react";
import { addDays, startOfDay } from "date-fns";
import { useData } from "@/components/data-provider";
import { occurrencesInRange, formatDate, categoryById } from "@/lib/recurrence";
import { toast } from "sonner";

const LS_FIRED = "ledger.fired";

function loadFired(): Set<string> {
  try {
    const raw = localStorage.getItem(LS_FIRED);
    return new Set(raw ? JSON.parse(raw) : []);
  } catch {
    return new Set();
  }
}

function saveFired(set: Set<string>) {
  localStorage.setItem(LS_FIRED, JSON.stringify(Array.from(set)));
}

function beep() {
  try {
    const ctx = new (window.AudioContext || (window as unknown as { webkitAudioContext: typeof AudioContext }).webkitAudioContext)();
    const osc = ctx.createOscillator();
    const gain = ctx.createGain();
    osc.type = "sine";
    osc.frequency.value = 660;
    gain.gain.setValueAtTime(0.0001, ctx.currentTime);
    gain.gain.exponentialRampToValueAtTime(0.15, ctx.currentTime + 0.02);
    gain.gain.exponentialRampToValueAtTime(0.0001, ctx.currentTime + 0.5);
    osc.connect(gain);
    gain.connect(ctx.destination);
    osc.start();
    osc.stop(ctx.currentTime + 0.5);
  } catch {}
}

export function ReminderChecker() {
  const { events, categories, settings } = useData();
  const firedRef = useRef<Set<string>>(loadFired());

  useEffect(() => {
    const check = () => {
      const now = new Date();
      const rangeStart = addDays(startOfDay(now), -1);
      const rangeEnd = addDays(startOfDay(now), 2);
      rangeEnd.setHours(23, 59, 59, 999);

      events.forEach((ev) => {
        if (!ev.reminders?.length || !ev.time) return;

        const occs = occurrencesInRange(ev, rangeStart, rangeEnd);
        occs.forEach((occDate) => {
          const [h, m] = ev.time!.split(":").map(Number);
          const eventMoment = new Date(occDate);
          eventMoment.setHours(h, m, 0, 0);

          ev.reminders!.forEach((minBefore) => {
            const fireMoment = new Date(eventMoment.getTime() - minBefore * 60000);
            const key = `${ev.id}_${formatDate(occDate)}_${minBefore}`;

            if (
              now >= fireMoment &&
              now.getTime() - fireMoment.getTime() < 90000 &&
              !firedRef.current.has(key)
            ) {
              firedRef.current.add(key);
              saveFired(firedRef.current);

              const cat = categoryById(categories, ev.categoryId);
              const when = minBefore === 0 ? "now" : `in ${minBefore >= 60 ? `${minBefore / 60}h` : `${minBefore}m`}`;
              const title = `${ev.title} — ${when}`;
              const body = `${ev.time ? `${ev.time} · ` : ""}${cat.name}${ev.notes ? ` — ${ev.notes}` : ""}`;

              if ("Notification" in window && Notification.permission === "granted") {
                try {
                  new Notification(title, { body, icon: "/icon-192.png" });
                } catch {}
              } else {
                toast(title, { description: body });
              }

              if (settings.sound) beep();
            }
          });
        });
      });
    };

    check();
    const interval = setInterval(check, 20000);
    return () => clearInterval(interval);
  }, [events, categories, settings]);

  return null;
}
