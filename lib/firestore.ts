"use client";

import {
  collection,
  doc,
  setDoc,
  deleteDoc,
  onSnapshot,
  writeBatch,
} from "firebase/firestore";
import { db } from "./firebase";
import type { Category, Event, Settings, Todo } from "./types";

export function settingsDocRef(userId: string) {
  return doc(db, "users", userId, "settings", "preferences");
}

export function categoriesCollectionRef(userId: string) {
  return collection(db, "users", userId, "categories");
}

export function eventsCollectionRef(userId: string) {
  return collection(db, "users", userId, "events");
}

export function eventDocRef(userId: string, eventId: string) {
  return doc(db, "users", userId, "events", eventId);
}

export function categoryDocRef(userId: string, categoryId: string) {
  return doc(db, "users", userId, "categories", categoryId);
}

export function todosCollectionRef(userId: string) {
  return collection(db, "users", userId, "todos");
}

export function todoDocRef(userId: string, todoId: string) {
  return doc(db, "users", userId, "todos", todoId);
}

export function subscribeToSettings(
  userId: string,
  callback: (settings: Settings) => void,
  onError?: (error: Error) => void
) {
  const ref = settingsDocRef(userId);
  return onSnapshot(
    ref,
    (snap) => {
      if (snap.exists()) {
        callback(snap.data() as Settings);
      } else {
        callback({ sound: true, defaultReminder: 10 });
      }
    },
    (error) => {
      console.error("[firestore] settings listener error:", error);
      onError?.(error);
    }
  );
}

export function subscribeToCategories(
  userId: string,
  callback: (categories: Category[]) => void,
  onError?: (error: Error) => void
) {
  const ref = categoriesCollectionRef(userId);
  return onSnapshot(
    ref,
    (snap) => {
      const categories = snap.docs.map((d) => ({
        id: d.id,
        ...d.data(),
      })) as Category[];
      callback(categories);
    },
    (error) => {
      console.error("[firestore] categories listener error:", error);
      onError?.(error);
    }
  );
}

export function subscribeToEvents(
  userId: string,
  callback: (events: Event[]) => void,
  onError?: (error: Error) => void
) {
  const ref = eventsCollectionRef(userId);
  return onSnapshot(
    ref,
    (snap) => {
      const events = snap.docs.map((d) => ({
        id: d.id,
        ...d.data(),
      })) as Event[];
      callback(events);
    },
    (error) => {
      console.error("[firestore] events listener error:", error);
      onError?.(error);
    }
  );
}

export function subscribeToTodos(
  userId: string,
  callback: (todos: Todo[]) => void,
  onError?: (error: Error) => void
) {
  const ref = todosCollectionRef(userId);
  return onSnapshot(
    ref,
    (snap) => {
      const todos = snap.docs.map((d) => ({
        id: d.id,
        ...d.data(),
      })) as Todo[];
      callback(todos);
    },
    (error) => {
      console.error("[firestore] todos listener error:", error);
      onError?.(error);
    }
  );
}

export async function saveSettings(userId: string, settings: Settings) {
  await setDoc(settingsDocRef(userId), settings);
}

export async function saveCategory(userId: string, category: Category) {
  await setDoc(categoryDocRef(userId, category.id), {
    name: category.name,
    color: category.color,
  });
}

export async function deleteCategory(userId: string, categoryId: string) {
  await deleteDoc(categoryDocRef(userId, categoryId));
}

export async function saveEvent(userId: string, event: Event) {
  await setDoc(eventDocRef(userId, event.id), {
    userId,
    title: event.title,
    date: event.date,
    allDay: event.allDay || false,
    time: event.time || null,
    endTime: event.endTime || null,
    recurrence: event.recurrence,
    until: event.until || null,
    categoryId: event.categoryId,
    reminders: event.reminders,
    notes: event.notes || null,
    createdAt: event.createdAt,
    updatedAt: event.updatedAt,
  });
}

export async function deleteEvent(userId: string, eventId: string) {
  await deleteDoc(eventDocRef(userId, eventId));
}

export async function saveTodo(userId: string, todo: Todo) {
  // Firestore rejects `undefined` — coerce optional fields to null.
  await setDoc(todoDocRef(userId, todo.id), {
    userId,
    title: todo.title,
    done: todo.done,
    dueDate: todo.dueDate || null,
    priority: todo.priority || null,
    categoryId: todo.categoryId || null,
    notes: todo.notes || null,
    completedAt: todo.completedAt ?? null,
    createdAt: todo.createdAt,
    updatedAt: todo.updatedAt,
  });
}

export async function deleteTodo(userId: string, todoId: string) {
  await deleteDoc(todoDocRef(userId, todoId));
}

export async function batchImport(
  userId: string,
  categories: Category[],
  events: Event[],
  settings: Settings
) {
  const batch = writeBatch(db);

  batch.set(settingsDocRef(userId), settings);

  categories.forEach((cat) => {
    batch.set(categoryDocRef(userId, cat.id), {
      name: cat.name,
      color: cat.color,
    });
  });

  events.forEach((ev) => {
    batch.set(eventDocRef(userId, ev.id), {
      userId,
      title: ev.title,
      date: ev.date,
      allDay: ev.allDay || false,
      time: ev.time || null,
      endTime: ev.endTime || null,
      recurrence: ev.recurrence,
      until: ev.until || null,
      categoryId: ev.categoryId,
      reminders: ev.reminders,
      notes: ev.notes || null,
      createdAt: ev.createdAt,
      updatedAt: ev.updatedAt,
    });
  });

  await batch.commit();
}
