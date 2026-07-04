"use client";

import { useState } from "react";
import { Dialog, DialogContent, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Checkbox } from "@/components/ui/checkbox";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { useData } from "@/components/data-provider";
import type { Category } from "@/lib/types";
import { toast } from "sonner";

interface SettingsModalProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
}

export function SettingsModal({ open, onOpenChange }: SettingsModalProps) {
  const { settings, categories, saveSettings, saveCategory, deleteCategory } = useData();
  const [localCats, setLocalCats] = useState<Category[]>(categories);

  // Sync when opened
  if (open && localCats.length !== categories.length) {
    setLocalCats(categories);
  }

  const updateCategory = (idx: number, patch: Partial<Category>) => {
    const next = [...localCats];
    next[idx] = { ...next[idx], ...patch };
    setLocalCats(next);
    saveCategory(next[idx]);
  };

  const addCategory = () => {
    const newCat: Category = {
      id: `cat${Date.now()}`,
      name: "New category",
      color: "#8A8577",
    };
    setLocalCats([...localCats, newCat]);
    saveCategory(newCat);
  };

  const removeCategory = (idx: number) => {
    if (localCats.length <= 1) {
      toast("Keep at least one category.");
      return;
    }
    const cat = localCats[idx];
    deleteCategory(cat.id);
    setLocalCats(localCats.filter((_, i) => i !== idx));
  };

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-h-[90vh] max-w-md overflow-y-auto rounded-2xl border-2 border-foreground">
        <DialogHeader>
          <DialogTitle className="font-serif text-xl">Settings</DialogTitle>
        </DialogHeader>

        <div className="mt-2 space-y-6">
          <div>
            <h4 className="mb-3 font-serif text-sm font-semibold">Categories</h4>
            <div className="space-y-2">
              {localCats.map((cat, idx) => (
                <div key={cat.id} className="flex items-center gap-2">
                  <input
                    type="color"
                    value={cat.color}
                    onChange={(e) => updateCategory(idx, { color: e.target.value })}
                    className="h-8 w-8 flex-shrink-0 cursor-pointer rounded-full border-0 bg-transparent p-0"
                  />
                  <Input
                    value={cat.name}
                    onChange={(e) => updateCategory(idx, { name: e.target.value })}
                    className="flex-1 rounded-lg text-sm"
                  />
                  <Button
                    variant="outline"
                    size="sm"
                    onClick={() => removeCategory(idx)}
                    className="rounded-lg border-line text-xs"
                  >
                    ✕
                  </Button>
                </div>
              ))}
            </div>
            <Button variant="outline" size="sm" onClick={addCategory} className="mt-2 rounded-lg border-line text-xs">
              + Add category
            </Button>
          </div>

          <div>
            <h4 className="mb-3 font-serif text-sm font-semibold">Alert sound</h4>
            <div className="flex items-center gap-2">
              <Checkbox
                id="sound"
                checked={settings.sound}
                onCheckedChange={(checked) =>
                  saveSettings({ ...settings, sound: checked === true })
                }
              />
              <Label htmlFor="sound" className="text-sm font-normal">
                Play a sound when an alert fires
              </Label>
            </div>
          </div>

          <div>
            <h4 className="mb-3 font-serif text-sm font-semibold">Default reminder</h4>
            <Select
              value={String(settings.defaultReminder)}
              onValueChange={(v) =>
                saveSettings({ ...settings, defaultReminder: parseInt(v || "10", 10) })
              }
            >
              <SelectTrigger className="rounded-lg">
                <SelectValue />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="0">At the time of the event</SelectItem>
                <SelectItem value="5">5 minutes before</SelectItem>
                <SelectItem value="10">10 minutes before</SelectItem>
                <SelectItem value="30">30 minutes before</SelectItem>
                <SelectItem value="60">1 hour before</SelectItem>
                <SelectItem value="1440">1 day before</SelectItem>
              </SelectContent>
            </Select>
          </div>
        </div>
      </DialogContent>
    </Dialog>
  );
}
