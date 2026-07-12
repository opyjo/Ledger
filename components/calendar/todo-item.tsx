"use client";

import { ArrowRight, Flag, Pencil, Trash2 } from "lucide-react";
import { differenceInCalendarDays } from "date-fns";
import { useData } from "@/components/data-provider";
import { formatDate, parseLocalDate } from "@/lib/recurrence";
import { Button } from "@/components/ui/button";
import { Checkbox } from "@/components/ui/checkbox";
import { cn } from "@/lib/utils";
import type { Todo, TodoPriority } from "@/lib/types";
import { toast } from "sonner";

const PRIORITY_META: Record<TodoPriority, { label: string; className: string }> = {
  high: { label: "High", className: "text-rust" },
  medium: { label: "Med", className: "text-amber-600 dark:text-amber-500" },
  low: { label: "Low", className: "text-muted-foreground" },
};

const PRIORITY_CYCLE: (TodoPriority | undefined)[] = [undefined, "low", "medium", "high"];

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
  const { categories, saveTodo, deleteTodo } = useData();
  const cat = todo.categoryId ? categories.find((c) => c.id === todo.categoryId) : undefined;
  const due = todo.dueDate && !todo.done ? dueLabel(todo.dueDate) : null;
  const priority = todo.priority && !todo.done ? PRIORITY_META[todo.priority] : null;

  const handleCyclePriority = () => {
    const idx = PRIORITY_CYCLE.indexOf(todo.priority || undefined);
    const next = PRIORITY_CYCLE[(idx + 1) % PRIORITY_CYCLE.length];
    saveTodo({ ...todo, priority: next, updatedAt: Date.now() });
  };

  const handleMoveToToday = () => {
    saveTodo({ ...todo, dueDate: formatDate(new Date()), updatedAt: Date.now() });
  };

  const handleToggle = (done: boolean) => {
    saveTodo({
      ...todo,
      done,
      completedAt: done ? Date.now() : undefined,
      updatedAt: Date.now(),
    });
  };

  const handleDelete = () => {
    const deleted = { ...todo };
    deleteTodo(todo.id).then(() => {
      toast("Todo deleted.", {
        action: {
          label: "Undo",
          onClick: () => saveTodo(deleted),
        },
      });
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
        className="mt-0.5 size-6 rounded-full sm:size-5"
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
        {!todo.done && (
          <div className="flex items-center gap-2.5 font-mono text-[11px]">
            <button
              type="button"
              onClick={handleCyclePriority}
              title="Change priority"
              aria-label={`Priority: ${priority ? priority.label : "none"}. Change priority of ${todo.title}`}
              className={cn(
                "flex items-center gap-1 transition-colors",
                priority ? priority.className : "text-muted-foreground/50 hover:text-foreground"
              )}
            >
              <Flag className={cn("h-3 w-3", priority && "fill-current")} />
              {priority?.label}
            </button>
            {due && (
              <span className={due.overdue ? "text-rust" : "text-muted-foreground"}>{due.text}</span>
            )}
            {due?.overdue && (
              <button
                type="button"
                onClick={handleMoveToToday}
                aria-label={`Reschedule ${todo.title} to today`}
                className="flex items-center gap-0.5 text-muted-foreground underline-offset-2 transition-colors hover:text-foreground hover:underline"
              >
                <ArrowRight className="h-3 w-3" />
                Today
              </button>
            )}
          </div>
        )}
        {todo.notes && <div className="mt-1 truncate text-xs text-muted-foreground">{todo.notes}</div>}
      </div>
      <Button
        variant="ghost"
        size="icon"
        aria-label={`Edit ${todo.title}`}
        className="h-9 w-9 transition-opacity group-hover:opacity-100 focus-visible:opacity-100 sm:h-7 sm:w-7 sm:opacity-60"
        onClick={() => onEdit(todo.id)}
      >
        <Pencil className="h-3.5 w-3.5" />
      </Button>
      {todo.done && (
        <Button
          variant="ghost"
          size="icon"
          aria-label={`Delete ${todo.title}`}
          className="h-9 w-9 text-muted-foreground transition-opacity hover:text-rust group-hover:opacity-100 focus-visible:opacity-100 sm:h-7 sm:w-7 sm:opacity-60"
          onClick={handleDelete}
        >
          <Trash2 className="h-3.5 w-3.5" />
        </Button>
      )}
    </div>
  );
}
