"use client";

import {
  createContext,
  useContext,
  useEffect,
  useState,
  type ReactNode,
} from "react";
import {
  subscribeToSettings,
  subscribeToCategories,
  subscribeToEvents,
  saveSettings as saveSettingsDb,
  saveCategory as saveCategoryDb,
  deleteCategory as deleteCategoryDb,
  saveEvent as saveEventDb,
  deleteEvent as deleteEventDb,
  batchImport as batchImportDb,
} from "@/lib/firestore";
import type { Category, Event, Settings } from "@/lib/types";

const DEFAULT_CATEGORIES: Category[] = [
  { id: "work", name: "Work", color: "#1B2A4A" },
  { id: "personal", name: "Personal", color: "#2F6E63" },
  { id: "reminder", name: "Reminder", color: "#B84A3E" },
  { id: "other", name: "Other", color: "#C99A3B" },
];

const DEFAULT_SETTINGS: Settings = {
  sound: true,
  defaultReminder: 10,
};

interface DataContextValue {
  settings: Settings;
  categories: Category[];
  events: Event[];
  loading: boolean;
  saveSettings: (s: Settings) => Promise<void>;
  saveCategory: (c: Category) => Promise<void>;
  deleteCategory: (id: string) => Promise<void>;
  saveEvent: (e: Event) => Promise<void>;
  deleteEvent: (id: string) => Promise<void>;
  batchImport: (categories: Category[], events: Event[], settings: Settings) => Promise<void>;
}

const DataContext = createContext<DataContextValue | undefined>(undefined);

export function DataProvider({
  userId,
  children,
}: {
  userId: string;
  children: ReactNode;
}) {
  const [settings, setSettings] = useState<Settings>(DEFAULT_SETTINGS);
  const [categories, setCategories] = useState<Category[]>(DEFAULT_CATEGORIES);
  const [events, setEvents] = useState<Event[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    setLoading(true);
    const unsubSettings = subscribeToSettings(userId, (s) => {
      setSettings({ ...DEFAULT_SETTINGS, ...s });
    });
    const unsubCategories = subscribeToCategories(userId, (cats) => {
        if (cats.length === 0) {
          // Seed defaults on first load
          DEFAULT_CATEGORIES.forEach((c) => saveCategoryDb(userId, c));
        }
      setCategories(cats.length ? cats : DEFAULT_CATEGORIES);
    });
    const unsubEvents = subscribeToEvents(userId, (evs) => {
      setEvents(evs);
      setLoading(false);
    });

    return () => {
      unsubSettings();
      unsubCategories();
      unsubEvents();
    };
  }, [userId]);

  const value: DataContextValue = {
    settings,
    categories,
    events,
    loading,
    saveSettings: (s) => saveSettingsDb(userId, s),
    saveCategory: (c) => saveCategoryDb(userId, c),
    deleteCategory: (id) => deleteCategoryDb(userId, id),
    saveEvent: (e) => saveEventDb(userId, e),
    deleteEvent: (id) => deleteEventDb(userId, id),
    batchImport: (cats, evs, sets) => batchImportDb(userId, cats, evs, sets),
  };

  return <DataContext.Provider value={value}>{children}</DataContext.Provider>;
}

export function useData() {
  const ctx = useContext(DataContext);
  if (!ctx) throw new Error("useData must be used within DataProvider");
  return ctx;
}
