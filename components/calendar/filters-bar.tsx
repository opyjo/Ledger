"use client";

import { Search, X } from "lucide-react";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import { useData } from "@/components/data-provider";

interface FiltersBarProps {
  searchQuery: string;
  onSearchChange: (q: string) => void;
  activeCategoryIds: string[];
  onToggleCategory: (id: string) => void;
}

export function FiltersBar({
  searchQuery,
  onSearchChange,
  activeCategoryIds,
  onToggleCategory,
}: FiltersBarProps) {
  const { categories } = useData();

  return (
    <div className="mb-4 flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
      <div className="relative max-w-xs flex-1">
        <Search className="absolute left-3 top-1/2 h-3.5 w-3.5 -translate-y-1/2 text-muted-foreground" />
        <Input
          type="text"
          placeholder="Search events..."
          value={searchQuery}
          onChange={(e) => onSearchChange(e.target.value)}
          className="h-9 rounded-lg border-line pl-9 text-sm"
        />
        {searchQuery && (
          <button
            onClick={() => onSearchChange("")}
            className="absolute right-2 top-1/2 -translate-y-1/2 text-muted-foreground hover:text-foreground"
          >
            <X className="h-3.5 w-3.5" />
          </button>
        )}
      </div>

      <div className="flex flex-wrap gap-2">
        {categories.map((cat) => {
          const active = activeCategoryIds.includes(cat.id);
          return (
            <button
              key={cat.id}
              onClick={() => onToggleCategory(cat.id)}
              className={[
                "flex items-center gap-1.5 rounded-full border px-2.5 py-1 text-[11px] font-medium transition-colors",
                active
                  ? "border-foreground bg-foreground text-primary-foreground"
                  : "border-line bg-transparent text-muted-foreground hover:bg-panel",
              ].join(" ")}
            >
              <span
                className="h-2 w-2 rounded-full"
                style={{ backgroundColor: active ? "currentColor" : cat.color }}
              />
              {cat.name}
            </button>
          );
        })}
      </div>
    </div>
  );
}
