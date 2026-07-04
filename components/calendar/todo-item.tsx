"use client";

import { Pencil } from "lucide-react";
import { differenceInCalendarDays } from "date-fns";
import { useData } from "@/components/data-provider";
import { parseLocalDate } from "@/lib/recurrence";
import { Button } from "@/components/ui/button";
import { Checkbox } from "@/components/ui/checkbox";
import { cn } from "@/lib/utils";
import type { Todo } from "@/lib/types";

interface TodoItemProps {
  todo: Todo;
  onEdit: (id: string) => void;
}

function dueLabel(dueDate: string): { text: string; overdue: boolean } {
  const days = differenceInCalendarDays(parseLocalDate(dueDate), new Date());
  if (days < 0) {
    const n = Math.abs(days);
    return { text: n === 1 ? "1 day overdue" : `${n} days overdue`, overdue: true };
  }
  if (days === 0) return { text: "Today", overdue: false };
  if (days === 1) return { text: "Tomorrow", overdue: false };
  return {
    text: parseLocalDate(dueDate).toLocaleDateString(undefined, {
      weekday: "short",
      month: "short",
      day: "numeric",
    }),
    overdue: false,
  };
}

export function TodoItem({ todo, onEdit }: TodoItemProps) {
  const { categories, saveTodo } = useData();
  const cat = todo.categoryId ? categories.find((c) => c.id === todo.categoryId) : undefined;
  const due = todo.dueDate && !todo.done ? dueLabel(todo.dueDate) : null;

  const handleToggle = (done: boolean) => {
    saveTodo({
      ...todo,
      done,
      completedAt: done ? Date.now() : undefined,
      updatedAt: Date.now(),
    });
  };

  return (
    <div
      className={cn(
        "group flex items-start gap-3 rounded-xl border border-line bg-panel p-3 transition-opacity",
        todo.done && "opacity-60"
      )}
    >
      <div
        className={cn("mt-1 w-1.5 self-stretch rounded-full", !cat && "bg-line")}
        style={cat ? { backgroundColor: cat.color } : undefined}
      />
      <Checkbox
        checked={todo.done}
        onCheckedChange={(checked) => handleToggle(checked === true)}
        aria-label={todo.done ? `Mark "${todo.title}" as not done` : `Mark "${todo.title}" as done`}
        className="mt-0.5 size-5 rounded-full"
      />
      <div className="min-w-0 flex-1">
        <div
          className={cn(
            "text-sm font-semibold text-foreground transition-all duration-300",
            todo.done && "text-muted-foreground line-through"
          )}
        >
          {todo.title}
        </div>
        {due && (
          <div className={cn("font-mono text-[11px]", due.overdue ? "text-rust" : "text-muted-foreground")}>
            {due.text}
          </div>
        )}
        {todo.notes && <div className="mt-1 truncate text-xs text-muted-foreground">{todo.notes}</div>}
      </div>
      <Button
        variant="ghost"
        size="icon"
        aria-label={`Edit ${todo.title}`}
        className="h-7 w-7 opacity-60 transition-opacity group-hover:opacity-100 focus-visible:opacity-100"
        onClick={() => onEdit(todo.id)}
      >
        <Pencil className="h-3.5 w-3.5" />
      </Button>
    </div>
  );
}
