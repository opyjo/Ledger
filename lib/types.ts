export type Recurrence = "none" | "daily" | "weekly" | "monthly" | "yearly";

export interface Category {
  id: string;
  name: string;
  color: string;
}

export interface Event {
  id: string;
  userId: string;
  title: string;
  date: string; // ISO date YYYY-MM-DD
  time?: string; // HH:MM
  endTime?: string; // HH:MM
  recurrence: Recurrence;
  until?: string; // ISO date YYYY-MM-DD
  categoryId: string;
  reminders: number[]; // minutes before
  notes?: string;
  createdAt: number;
  updatedAt: number;
}

export interface Settings {
  sound: boolean;
  defaultReminder: number;
}

export interface LegacyBackup {
  events?: LegacyEvent[];
  categories?: Category[];
  settings?: Partial<Settings>;
  exportedAt?: string;
}

export interface LegacyEvent {
  id: string;
  title: string;
  date: string;
  time?: string;
  endTime?: string;
  recurrence: Recurrence;
  until?: string;
  category: string;
  reminders?: number[];
  notes?: string;
}
