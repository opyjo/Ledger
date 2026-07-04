"use client";

import { useState } from "react";
import { ChevronLeft, ChevronRight } from "lucide-react";
import { Popover, PopoverContent, PopoverTrigger } from "@/components/ui/popover";
import { Button } from "@/components/ui/button";

interface YearPickerProps {
  viewDate: Date;
  onChange: (date: Date) => void;
  children: React.ReactNode;
}

const MONTHS = ["Jan", "Feb", "Mar", "Apr", "May", "Jun", "Jul", "Aug", "Sep", "Oct", "Nov", "Dec"];

export function YearPicker({ viewDate, onChange, children }: YearPickerProps) {
  const [year, setYear] = useState(viewDate.getFullYear());

  const handleMonth = (month: number) => {
    const d = new Date(viewDate);
    d.setFullYear(year, month, 1);
    onChange(d);
  };

  return (
    <Popover>
      <PopoverTrigger>{children}</PopoverTrigger>
      <PopoverContent className="w-auto rounded-2xl border-2 border-foreground p-4">
        <div className="mb-3 flex items-center justify-between">
          <Button variant="outline" size="icon" className="h-7 w-7 rounded-lg border-line" onClick={() => setYear((y) => y - 1)}>
            <ChevronLeft className="h-3.5 w-3.5" />
          </Button>
          <span className="font-serif text-lg font-semibold">{year}</span>
          <Button variant="outline" size="icon" className="h-7 w-7 rounded-lg border-line" onClick={() => setYear((y) => y + 1)}>
            <ChevronRight className="h-3.5 w-3.5" />
          </Button>
        </div>
        <div className="grid grid-cols-3 gap-2">
          {MONTHS.map((m, idx) => {
            const isCurrent = viewDate.getMonth() === idx && viewDate.getFullYear() === year;
            return (
              <button
                key={m}
                onClick={() => handleMonth(idx)}
                className={[
                  "rounded-lg px-3 py-2 text-xs font-medium transition-colors",
                  isCurrent ? "bg-foreground text-primary-foreground" : "hover:bg-panel",
                ].join(" ")}
              >
                {m}
              </button>
            );
          })}
        </div>
      </PopoverContent>
    </Popover>
  );
}
