"use client";

import { useMemo, useRef, useState } from "react";
import { ChevronDown, ChevronRight, Plus } from "lucide-react";
import { useData } from "@/components/data-provider";
import { formatDate } from "@/lib/recurrence";
import { Input } from "@/components/ui/input";
import { cn } from "@/lib/utils";
import type { Todo, TodoPriority } from "@/lib/types";
import { TodoItem } from "./todo-item";
import { TodoForm } from "./todo-form";
import { toast } from "sonner";

const PRIORITY_TOKENS: Record<string, TodoPriority> = {
  "!high": "high",
  "!h": "high",
  "!medium": "medium",
  "!med": "medium",
  "!m": "medium",
  "!low": "low",
  "!l": "low",
};

// Pulls `!high` / `!med` / `!low`, `today` and `tomorrow` tokens out of a
// quick-add entry so priority and due date can be set without the dialog.
function parseQuickAdd(raw: string): { title: string; priority?: TodoPriority; dueDate?: string } {
  let priority: TodoPriority | undefined;
  let dueDate: string | undefined;
  const rest: string[] = [];
  for (const token of raw.trim().split(/\s+/)) {
    const lower = token.toLowerCase();
    if (!priority && PRIORITY_TOKENS[lower]) {
      priority = PRIORITY_TOKENS[lower];
    } else if (!dueDate && lower === "today") {
      dueDate = formatDate(new Date());
    } else if (!dueDate && lower === "tomorrow") {
      const d = new Date();
      d.setDate(d.getDate() + 1);
      dueDate = formatDate(d);
    } else {
      rest.push(token);
    }
  }
  return { title: rest.join(" "), priority, dueDate };
}

interface TodoPanelProps {
  searchQuery: string;
  activeCategoryIds: string[];
}

interface TodoGroup {
  key: string;
  label: string;
  todos: Todo[];
  headerClass?: string;
}

export function TodoPanel({ searchQuery, activeCategoryIds }: TodoPanelProps) {
  const { todos, saveTodo, deleteTodo } = useData();
  const [quickTitle, setQuickTitle] = useState("");
  const [todoFormOpen, setTodoFormOpen] = useState(false);
  const [editingTodoId, setEditingTodoId] = useState<string | null>(null);
  const [doneOpen, setDoneOpen] = useState(false);
  const quickAddRef = useRef<HTMLInputElement>(null);

  const q = searchQuery.toLowerCase();
  const filtered = useMemo(
    () =>
      todos.filter((t) => {
        const matchesCategory = !t.categoryId || activeCategoryIds.includes(t.categoryId);
        const matchesSearch =
          !q ||
          t.title.toLowerCase().includes(q) ||
          (t.notes && t.notes.toLowerCase().includes(q));
        return matchesCategory && matchesSearch;
      }),
    [todos, activeCategoryIds, q]
  );

  const todayStr = formatDate(new Date());

  const { groups, doneTodos } = useMemo(() => {
    const open = filtered.filter((t) => !t.done);
    const priorityRank = (t: Todo) =>
      t.priority === "high" ? 0 : t.priority === "medium" ? 1 : t.priority === "low" ? 2 : 3;
    const byPriority = (a: Todo, b: Todo) => priorityRank(a) - priorityRank(b);
    const byDue = (a: Todo, b: Todo) =>
      (a.dueDate || "").localeCompare(b.dueDate || "") || a.title.localeCompare(b.title);
    const groups: TodoGroup[] = [
      {
        key: "overdue",
        label: "Overdue",
        headerClass: "text-rust",
        todos: open
          .filter((t) => t.dueDate && t.dueDate < todayStr)
          .sort((a, b) => byPriority(a, b) || byDue(a, b)),
      },
      {
        key: "today",
        label: "Today",
        todos: open
          .filter((t) => t.dueDate === todayStr)
          .sort((a, b) => byPriority(a, b) || a.createdAt - b.createdAt),
      },
      {
        key: "upcoming",
        label: "Upcoming",
        todos: open
          .filter((t) => t.dueDate && t.dueDate > todayStr)
          .sort((a, b) => byPriority(a, b) || byDue(a, b)),
      },
      {
        key: "nodate",
        label: "No date",
        todos: open
          .filter((t) => !t.dueDate)
          .sort((a, b) => byPriority(a, b) || b.createdAt - a.createdAt),
      },
    ];
    const doneTodos = filtered
      .filter((t) => t.done)
      .sort((a, b) => (b.completedAt ?? b.updatedAt) - (a.completedAt ?? a.updatedAt));
    return { groups, doneTodos };
  }, [filtered, todayStr]);

  const handleQuickAdd = (e: React.FormEvent) => {
    e.preventDefault();
    const { title, priority, dueDate } = parseQuickAdd(quickTitle);
    if (!title) return;
    const now = Date.now();
    saveTodo({
      id: `t${now.toString(36)}${Math.random().toString(36).slice(2, 7)}`,
      userId: "",
      title,
      done: false,
      priority,
      dueDate,
      createdAt: now,
      updatedAt: now,
    });
    setQuickTitle("");
    quickAddRef.current?.focus();
  };

  const handleClearCompleted = () => {
    const snapshot = doneTodos.map((t) => ({ ...t }));
    Promise.all(snapshot.map((t) => deleteTodo(t.id))).then(() => {
      toast(`${snapshot.length} completed todo${snapshot.length === 1 ? "" : "s"} cleared.`, {
        action: {
          label: "Undo",
          onClick: () => snapshot.forEach((t) => saveTodo(t)),
        },
      });
    });
  };

  const handleEdit = (id: string) => {
    setEditingTodoId(id);
    setTodoFormOpen(true);
  };

  const isEmpty = groups.every((g) => g.todos.length === 0) && doneTodos.length === 0;

  return (
    <div>
      <form onSubmit={handleQuickAdd} className="relative mb-5">
        <Plus className="pointer-events-none absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-muted-foreground" />
        <Input
          ref={quickAddRef}
          value={quickTitle}
          onChange={(e) => setQuickTitle(e.target.value)}
          placeholder="Add a todo (try !high or tomorrow)"
          aria-label="Add a todo. Use !high, !med or !low for priority and the words today or tomorrow for a due date"
          enterKeyHint="done"
          className="h-10 rounded-lg pl-9 pr-16 sm:h-8"
        />
        <button
          type="submit"
          disabled={!quickTitle.trim()}
          className="absolute right-1.5 top-1/2 -translate-y-1/2 rounded-md bg-foreground px-2.5 py-1 font-mono text-[11px] uppercase tracking-wider text-primary-foreground transition-colors hover:bg-rust disabled:pointer-events-none disabled:opacity-0"
        >
          Add
        </button>
      </form>

      {isEmpty ? (
        <div className="py-6 text-sm italic text-muted-foreground">
          Nothing on the list. Add a todo above.
        </div>
      ) : (
        <div className="space-y-5">
          {groups.map(
            (group) =>
              group.todos.length > 0 && (
                <div key={group.key}>
                  <h4
                    className={cn(
                      "mb-2 font-mono text-xs uppercase tracking-widest text-muted-foreground",
                      group.headerClass
                    )}
                  >
                    {group.label} · {group.todos.length}
                  </h4>
                  <div className="space-y-2">
                    {group.todos.map((t) => (
                      <TodoItem key={t.id} todo={t} onEdit={handleEdit} />
                    ))}
                  </div>
                </div>
              )
          )}

          {doneTodos.length > 0 && (
            <div>
              <div className="mb-2 flex items-center justify-between gap-2">
                <button
                  type="button"
                  onClick={() => setDoneOpen((o) => !o)}
                  className="flex items-center gap-1 font-mono text-xs uppercase tracking-widest text-muted-foreground transition-colors hover:text-foreground"
                >
                  {doneOpen ? <ChevronDown className="h-3 w-3" /> : <ChevronRight className="h-3 w-3" />}
                  Done · {doneTodos.length}
                </button>
                {doneOpen && (
                  <button
                    type="button"
                    onClick={handleClearCompleted}
                    className="font-mono text-[11px] uppercase tracking-wider text-muted-foreground transition-colors hover:text-rust"
                  >
                    Clear all
                  </button>
                )}
              </div>
              {doneOpen && (
                <div className="space-y-2">
                  {doneTodos.slice(0, 30).map((t) => (
                    <TodoItem key={t.id} todo={t} onEdit={handleEdit} />
                  ))}
                  {doneTodos.length > 30 && (
                    <div className="py-1 font-mono text-[11px] text-muted-foreground">
                      + {doneTodos.length - 30} more completed
                    </div>
                  )}
                </div>
              )}
            </div>
          )}
        </div>
      )}

      <TodoForm open={todoFormOpen} onOpenChange={setTodoFormOpen} editingTodoId={editingTodoId} />
    </div>
  );
}
