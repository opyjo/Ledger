"use client";

import { useEffect, useMemo } from "react";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { z } from "zod";
import { Dialog, DialogContent, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { useData } from "@/components/data-provider";
import type { Todo, TodoPriority } from "@/lib/types";
import { toast } from "sonner";

const formSchema = z.object({
  title: z.string().min(1, "Title is required"),
  dueDate: z.string().optional(),
  priority: z.string(),
  categoryId: z.string(),
  notes: z.string().optional(),
});

const PRIORITY_OPTIONS: { value: string; label: string }[] = [
  { value: "", label: "None" },
  { value: "low", label: "Low" },
  { value: "medium", label: "Medium" },
  { value: "high", label: "High" },
];

type FormValues = z.infer<typeof formSchema>;

interface TodoFormProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  editingTodoId: string | null;
}

export function TodoForm({ open, onOpenChange, editingTodoId }: TodoFormProps) {
  const { todos, categories, saveTodo, deleteTodo } = useData();

  const editingTodo = useMemo(
    () => todos.find((t) => t.id === editingTodoId) || null,
    [todos, editingTodoId]
  );

  const form = useForm<FormValues>({
    resolver: zodResolver(formSchema),
    defaultValues: { title: "", dueDate: "", priority: "", categoryId: "", notes: "" },
  });

  useEffect(() => {
    if (open) {
      if (editingTodo) {
        form.reset({
          title: editingTodo.title,
          dueDate: editingTodo.dueDate || "",
          priority: editingTodo.priority || "",
          categoryId: editingTodo.categoryId || "",
          notes: editingTodo.notes || "",
        });
      } else {
        form.reset({ title: "", dueDate: "", priority: "", categoryId: "", notes: "" });
      }
    }
  }, [open, editingTodo, form]);

  const selectedCategoryId = form.watch("categoryId");
  const selectedPriority = form.watch("priority");

  const onSubmit = (values: FormValues) => {
    const now = Date.now();
    const todo: Todo = {
      id: editingTodo?.id || `t${now.toString(36)}${Math.random().toString(36).slice(2, 7)}`,
      userId: editingTodo?.userId || "",
      title: values.title,
      done: editingTodo?.done || false,
      dueDate: values.dueDate || undefined,
      priority: (values.priority as TodoPriority) || undefined,
      categoryId: values.categoryId || undefined,
      notes: values.notes || undefined,
      completedAt: editingTodo?.completedAt || undefined,
      createdAt: editingTodo?.createdAt || now,
      updatedAt: now,
    };

    saveTodo(todo).then(() => {
      toast(editingTodo ? "Todo updated." : "Todo added.");
      onOpenChange(false);
    });
  };

  const handleDelete = () => {
    if (!editingTodo) return;
    const deletedTodo = { ...editingTodo };
    deleteTodo(editingTodo.id).then(() => {
      toast("Todo deleted.", {
        action: {
          label: "Undo",
          onClick: () => saveTodo(deletedTodo),
        },
      });
      onOpenChange(false);
    });
  };

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-h-[90vh] max-w-md overflow-y-auto rounded-2xl border-2 border-foreground">
        <DialogHeader>
          <DialogTitle className="font-serif text-xl">
            {editingTodo ? "Edit todo" : "Add todo"}
          </DialogTitle>
        </DialogHeader>

        <form onSubmit={form.handleSubmit(onSubmit)} className="mt-2 space-y-4">
          <div>
            <Label htmlFor="todo-title" className="text-xs uppercase tracking-wider text-muted-foreground">
              Title
            </Label>
            <Input
              id="todo-title"
              {...form.register("title")}
              placeholder="What needs doing"
              className="mt-1 rounded-lg"
            />
            {form.formState.errors.title && (
              <p className="mt-1 text-xs text-rust">{form.formState.errors.title.message}</p>
            )}
          </div>

          <div>
            <Label htmlFor="todo-dueDate" className="text-xs uppercase tracking-wider text-muted-foreground">
              Due date
            </Label>
            <Input id="todo-dueDate" type="date" {...form.register("dueDate")} className="mt-1 rounded-lg" />
          </div>

          <div>
            <Label className="text-xs uppercase tracking-wider text-muted-foreground">Priority</Label>
            <div className="mt-2 flex flex-wrap gap-2">
              {PRIORITY_OPTIONS.map((opt) => (
                <button
                  key={opt.value}
                  type="button"
                  onClick={() => form.setValue("priority", opt.value)}
                  className={[
                    "rounded-lg border px-3 py-1.5 font-mono text-[11px] uppercase tracking-wider transition-colors",
                    selectedPriority === opt.value
                      ? "border-foreground bg-foreground text-primary-foreground"
                      : "border-line text-muted-foreground hover:border-foreground hover:text-foreground",
                  ].join(" ")}
                >
                  {opt.label}
                </button>
              ))}
            </div>
          </div>

          <div>
            <Label className="text-xs uppercase tracking-wider text-muted-foreground">Category</Label>
            <div className="mt-2 flex flex-wrap gap-2">
              <button
                type="button"
                onClick={() => form.setValue("categoryId", "")}
                title="No category"
                className={[
                  "h-7 w-7 rounded-full border-2 border-dashed border-line bg-transparent font-mono text-[10px] text-muted-foreground transition-transform",
                  selectedCategoryId === "" ? "border-solid !border-foreground scale-110" : "hover:scale-105",
                ].join(" ")}
              >
                –
              </button>
              {categories.map((cat) => (
                <button
                  key={cat.id}
                  type="button"
                  onClick={() => form.setValue("categoryId", cat.id)}
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
            <Label htmlFor="todo-notes" className="text-xs uppercase tracking-wider text-muted-foreground">
              Notes
            </Label>
            <Textarea
              id="todo-notes"
              {...form.register("notes")}
              placeholder="Optional details"
              className="mt-1 min-h-[80px] rounded-lg"
            />
          </div>

          <div className="flex items-center justify-end gap-2 pt-2">
            {editingTodo && (
              <Button
                type="button"
                variant="outline"
                onClick={handleDelete}
                className="rounded-lg border-rust text-rust hover:bg-rust hover:text-white"
              >
                Delete
              </Button>
            )}
            <Button type="button" variant="outline" onClick={() => onOpenChange(false)} className="rounded-lg border-line">
              Cancel
            </Button>
            <Button type="submit" className="rounded-lg bg-foreground text-primary-foreground hover:bg-rust">
              Save todo
            </Button>
          </div>
        </form>
      </DialogContent>
    </Dialog>
  );
}
