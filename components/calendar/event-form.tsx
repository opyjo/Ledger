"use client";

import { useEffect, useMemo, useState } from "react";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { z } from "zod";
import { Dialog, DialogContent, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { useData } from "@/components/data-provider";
import { formatDate, categoryById } from "@/lib/recurrence";
import type { Event, Recurrence } from "@/lib/types";
import { toast } from "sonner";

const REMINDER_OPTIONS = [0, 5, 10, 30, 60, 1440];

const formSchema = z.object({
  title: z.string().min(1, "Title is required"),
  date: z.string().min(1, "Date is required"),
  time: z.string().optional(),
  endTime: z.string().optional(),
  recurrence: z.enum(["none", "daily", "weekly", "monthly", "yearly"]),
  until: z.string().optional(),
  notes: z.string().optional(),
});

type FormValues = z.infer<typeof formSchema>;

interface EventFormProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  selectedDate: Date;
  editingEventId: string | null;
}

export function EventForm({ open, onOpenChange, selectedDate, editingEventId }: EventFormProps) {
  const { events, categories, settings, saveEvent, deleteEvent } = useData();
  const [selectedCategoryId, setSelectedCategoryId] = useState<string>(categories[0]?.id || "");
  const [selectedReminders, setSelectedReminders] = useState<Set<number>>(new Set([settings.defaultReminder]));

  const editingEvent = useMemo(
    () => events.find((e) => e.id === editingEventId) || null,
    [events, editingEventId]
  );

  const form = useForm<FormValues>({
    resolver: zodResolver(formSchema),
    defaultValues: {
      title: "",
      date: formatDate(selectedDate),
      time: "",
      endTime: "",
      recurrence: "none",
      until: "",
      notes: "",
    },
  });

  useEffect(() => {
    if (open) {
      if (editingEvent) {
        form.reset({
          title: editingEvent.title,
          date: editingEvent.date,
          time: editingEvent.time || "",
          endTime: editingEvent.endTime || "",
          recurrence: editingEvent.recurrence,
          until: editingEvent.until || "",
          notes: editingEvent.notes || "",
        });
        setSelectedCategoryId(editingEvent.categoryId);
        setSelectedReminders(new Set(editingEvent.reminders));
      } else {
        form.reset({
          title: "",
          date: formatDate(selectedDate),
          time: "",
          endTime: "",
          recurrence: "none",
          until: "",
          notes: "",
        });
        setSelectedCategoryId(categories[0]?.id || "");
        setSelectedReminders(new Set([settings.defaultReminder]));
      }
    }
  }, [open, editingEvent, selectedDate, categories, settings.defaultReminder, form]);

  const recurrence = form.watch("recurrence");

  const toggleReminder = (m: number) => {
    const next = new Set(selectedReminders);
    if (next.has(m)) next.delete(m);
    else next.add(m);
    setSelectedReminders(next);
  };

  const onSubmit = (values: FormValues) => {
    const now = Date.now();
    const event: Event = {
      id: editingEvent?.id || `e${now.toString(36)}${Math.random().toString(36).slice(2, 7)}`,
      userId: editingEvent?.userId || "",
      title: values.title,
      date: values.date,
      time: values.time || undefined,
      endTime: values.endTime || undefined,
      recurrence: values.recurrence as Recurrence,
      until: values.until || undefined,
      categoryId: selectedCategoryId,
      reminders: Array.from(selectedReminders).sort((a, b) => a - b),
      notes: values.notes || undefined,
      createdAt: editingEvent?.createdAt || now,
      updatedAt: now,
    };

    saveEvent(event).then(() => {
      toast(editingEvent ? "Event updated." : "Event added.");
      onOpenChange(false);
    });
  };

  const handleDelete = () => {
    if (!editingEvent) return;
    deleteEvent(editingEvent.id).then(() => {
      toast("Event deleted.");
      onOpenChange(false);
    });
  };

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-h-[90vh] max-w-md overflow-y-auto rounded-2xl border-2 border-foreground">
        <DialogHeader>
          <DialogTitle className="font-serif text-xl">
            {editingEvent ? "Edit event" : "Add event"}
          </DialogTitle>
        </DialogHeader>

        <form onSubmit={form.handleSubmit(onSubmit)} className="mt-2 space-y-4">
          <div>
            <Label htmlFor="title" className="text-xs uppercase tracking-wider text-muted-foreground">
              Title
            </Label>
            <Input id="title" {...form.register("title")} placeholder="What's happening" className="mt-1 rounded-lg" />
            {form.formState.errors.title && (
              <p className="mt-1 text-xs text-rust">{form.formState.errors.title.message}</p>
            )}
          </div>

          <div className="grid grid-cols-2 gap-3">
            <div>
              <Label htmlFor="date" className="text-xs uppercase tracking-wider text-muted-foreground">
                Date
              </Label>
              <Input id="date" type="date" {...form.register("date")} className="mt-1 rounded-lg" />
            </div>
            <div>
              <Label htmlFor="time" className="text-xs uppercase tracking-wider text-muted-foreground">
                Start time
              </Label>
              <Input id="time" type="time" {...form.register("time")} className="mt-1 rounded-lg" />
            </div>
          </div>

          <div className="grid grid-cols-2 gap-3">
            <div>
              <Label htmlFor="endTime" className="text-xs uppercase tracking-wider text-muted-foreground">
                End time
              </Label>
              <Input id="endTime" type="time" {...form.register("endTime")} className="mt-1 rounded-lg" />
            </div>
            <div>
              <Label className="text-xs uppercase tracking-wider text-muted-foreground">Repeats</Label>
              <Select
                value={form.watch("recurrence")}
                onValueChange={(v) => form.setValue("recurrence", v as Recurrence)}
              >
                <SelectTrigger className="mt-1 rounded-lg">
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="none">Doesn't repeat</SelectItem>
                  <SelectItem value="daily">Every day</SelectItem>
                  <SelectItem value="weekly">Every week</SelectItem>
                  <SelectItem value="monthly">Every month</SelectItem>
                  <SelectItem value="yearly">Every year</SelectItem>
                </SelectContent>
              </Select>
            </div>
          </div>

          {recurrence !== "none" && (
            <div>
              <Label htmlFor="until" className="text-xs uppercase tracking-wider text-muted-foreground">
                Repeat until
              </Label>
              <Input id="until" type="date" {...form.register("until")} className="mt-1 rounded-lg" />
            </div>
          )}

          <div>
            <Label className="text-xs uppercase tracking-wider text-muted-foreground">Category</Label>
            <div className="mt-2 flex flex-wrap gap-2">
              {categories.map((cat) => (
                <button
                  key={cat.id}
                  type="button"
                  onClick={() => setSelectedCategoryId(cat.id)}
                  title={cat.name}
                  className={[
                    "h-7 w-7 rounded-full border-2 transition-transform",
                    selectedCategoryId === cat.id ? "border-foreground scale-110" : "border-transparent hover:scale-105",
                  ].join(" ")}
                  style={{ backgroundColor: cat.color }}
                />
              ))}
            </div>
          </div>

          <div>
            <Label className="text-xs uppercase tracking-wider text-muted-foreground">Remind me</Label>
            <div className="mt-2 flex flex-wrap gap-2">
              {REMINDER_OPTIONS.map((m) => (
                <button
                  key={m}
                  type="button"
                  onClick={() => toggleReminder(m)}
                  className={[
                    "rounded-full border px-3 py-1 font-mono text-[11px] transition-colors",
                    selectedReminders.has(m)
                      ? "border-teal bg-teal text-white"
                      : "border-line bg-transparent text-muted-foreground hover:bg-panel",
                  ].join(" ")}
                >
                  {m === 0 ? "At start" : m >= 1440 ? "1 day before" : `${m}m before`}
                </button>
              ))}
            </div>
          </div>

          <div>
            <Label htmlFor="notes" className="text-xs uppercase tracking-wider text-muted-foreground">
              Notes
            </Label>
            <Textarea
              id="notes"
              {...form.register("notes")}
              placeholder="Optional details"
              className="mt-1 min-h-[80px] rounded-lg"
            />
          </div>

          <div className="flex items-center justify-end gap-2 pt-2">
            {editingEvent && (
              <Button type="button" variant="outline" onClick={handleDelete} className="rounded-lg border-rust text-rust hover:bg-rust hover:text-white">
                Delete
              </Button>
            )}
            <Button type="button" variant="outline" onClick={() => onOpenChange(false)} className="rounded-lg border-line">
              Cancel
            </Button>
            <Button type="submit" className="rounded-lg bg-foreground text-primary-foreground hover:bg-rust">
              Save event
            </Button>
          </div>
        </form>
      </DialogContent>
    </Dialog>
  );
}
