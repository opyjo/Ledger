"use client";

import { useMemo, useRef, useState } from "react";
import { ChevronDown, ChevronRight, Plus } from "lucide-react";
import { useData } from "@/components/data-provider";
import { formatDate } from "@/lib/recurrence";
import { Input } from "@/components/ui/input";
import { cn } from "@/lib/utils";
import type { Todo } from "@/lib/types";
import { TodoItem } from "./todo-item";
import { TodoForm } from "./todo-form";

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
  const { todos, saveTodo } = useData();
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
    const byDue = (a: Todo, b: Todo) =>
      (a.dueDate || "").localeCompare(b.dueDate || "") || a.title.localeCompare(b.title);
    const groups: TodoGroup[] = [
      {
        key: "overdue",
        label: "Overdue",
        headerClass: "text-rust",
        todos: open.filter((t) => t.dueDate && t.dueDate < todayStr).sort(byDue),
      },
      {
        key: "today",
        label: "Today",
        todos: open.filter((t) => t.dueDate === todayStr).sort((a, b) => a.createdAt - b.createdAt),
      },
      {
        key: "upcoming",
        label: "Upcoming",
        todos: open.filter((t) => t.dueDate && t.dueDate > todayStr).sort(byDue),
      },
      {
        key: "nodate",
        label: "No date",
        todos: open.filter((t) => !t.dueDate).sort((a, b) => b.createdAt - a.createdAt),
      },
    ];
    const doneTodos = filtered
      .filter((t) => t.done)
      .sort((a, b) => (b.completedAt ?? b.updatedAt) - (a.completedAt ?? a.updatedAt));
    return { groups, doneTodos };
  }, [filtered, todayStr]);

  const handleQuickAdd = (e: React.FormEvent) => {
    e.preventDefault();
    const title = quickTitle.trim();
    if (!title) return;
    const now = Date.now();
    saveTodo({
      id: `t${now.toString(36)}${Math.random().toString(36).slice(2, 7)}`,
      userId: "",
      title,
      done: false,
      createdAt: now,
      updatedAt: now,
    });
    setQuickTitle("");
    quickAddRef.current?.focus();
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
          placeholder="Add a todo and press Enter"
          aria-label="Add a todo"
          className="rounded-lg pl-9"
        />
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
              <button
                type="button"
                onClick={() => setDoneOpen((o) => !o)}
                className="mb-2 flex items-center gap-1 font-mono text-xs uppercase tracking-widest text-muted-foreground transition-colors hover:text-foreground"
              >
                {doneOpen ? <ChevronDown className="h-3 w-3" /> : <ChevronRight className="h-3 w-3" />}
                Done · {doneTodos.length}
              </button>
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
