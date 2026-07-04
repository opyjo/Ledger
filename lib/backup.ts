import type { Category, Event, LegacyBackup, LegacyEvent, Settings } from "./types";
import { formatDate } from "./recurrence";

export function exportBackup(
  events: Event[],
  categories: Category[],
  settings: Settings
) {
  const payload: LegacyBackup = {
    events: events.map((e) => ({
      id: e.id,
      title: e.title,
      date: e.date,
      time: e.time,
      endTime: e.endTime,
      recurrence: e.recurrence,
      until: e.until,
      category: e.categoryId,
      reminders: e.reminders,
      notes: e.notes,
    })),
    categories,
    settings,
    exportedAt: new Date().toISOString(),
  };

  const blob = new Blob([JSON.stringify(payload, null, 2)], {
    type: "application/json",
  });
  const url = URL.createObjectURL(blob);
  const a = document.createElement("a");
  a.href = url;
  a.download = `ledger-backup-${formatDate(new Date())}.json`;
  a.click();
  URL.revokeObjectURL(url);
}

export function readBackupFile(file: File): Promise<LegacyBackup> {
  return new Promise((resolve, reject) => {
    const reader = new FileReader();
    reader.onload = () => {
      try {
        const data = JSON.parse(reader.result as string) as LegacyBackup;
        resolve(data);
      } catch {
        reject(new Error("Invalid backup file"));
      }
    };
    reader.onerror = reject;
    reader.readAsText(file);
  });
}

export function migrateLegacyBackup(
  data: LegacyBackup,
  userId: string
): { categories: Category[]; events: Event[]; settings: Settings } {
  const categories: Category[] =
    data.categories?.map((c) => ({
      id: c.id,
      name: c.name,
      color: c.color,
    })) || [];

  const categoryMap = new Map(categories.map((c) => [c.id, c.id]));
  const fallbackCategory = categories[0]?.id || "other";

  const events: Event[] =
    data.events?.map((e) => ({
      id: e.id.startsWith("e") ? e.id : `e${e.id}`,
      userId,
      title: e.title,
      date: e.date,
      time: e.time,
      endTime: e.endTime,
      recurrence: e.recurrence || "none",
      until: e.until,
      categoryId: categoryMap.get(e.category) || fallbackCategory,
      reminders: e.reminders || [],
      notes: e.notes,
      createdAt: Date.now(),
      updatedAt: Date.now(),
    })) || [];

  const settings: Settings = {
    sound: data.settings?.sound ?? true,
    defaultReminder: data.settings?.defaultReminder ?? 10,
  };

  return { categories, events, settings };
}
