"use client";

import * as React from "react";
import {
  addMonths,
  eachDayOfInterval,
  endOfMonth,
  endOfWeek,
  format,
  isSameDay,
  isSameMonth,
  startOfMonth,
  startOfWeek,
  subMonths,
} from "date-fns";
import { cn } from "@/lib/utils";
import { Button } from "./Button";

export interface CalendarProps {
  /** Controlled selected date */
  value?: Date;
  onChange?: (date: Date) => void;
  className?: string;
}

/**
 * Month calendar — DESIGN.md structural chrome, 48px touch targets on controls.
 */
export function Calendar({ value, onChange, className }: CalendarProps) {
  const selected = value ?? new Date();
  const [view, setView] = React.useState<Date>(startOfMonth(selected));

  React.useEffect(() => {
    setView(startOfMonth(selected));
  }, [selected]);

  const monthStart = startOfMonth(view);
  const days = eachDayOfInterval({
    start: startOfWeek(monthStart, { weekStartsOn: 1 }),
    end: endOfWeek(endOfMonth(view), { weekStartsOn: 1 }),
  });

  return (
    <div className={cn("card-layered w-full max-w-sm p-4", className)}>
      <div className="mb-3 flex items-center justify-between gap-2">
        <Button
          type="button"
          variant="outline"
          size="sm"
          aria-label="Previous month"
          onClick={() => setView((d) => subMonths(d, 1))}
        >
          ‹
        </Button>
        <p className="text-sm font-semibold text-foreground">{format(view, "MMMM yyyy")}</p>
        <Button
          type="button"
          variant="outline"
          size="sm"
          aria-label="Next month"
          onClick={() => setView((d) => addMonths(d, 1))}
        >
          ›
        </Button>
      </div>
      <div className="grid grid-cols-7 gap-1 text-center text-[11px] font-semibold uppercase tracking-wide text-muted">
        {["Mon", "Tue", "Wed", "Thu", "Fri", "Sat", "Sun"].map((d) => (
          <div key={d} className="py-1">
            {d}
          </div>
        ))}
      </div>
      <div className="mt-1 grid grid-cols-7 gap-1">
        {days.map((day) => {
          const inMonth = isSameMonth(day, view);
          const isSelected = isSameDay(day, selected);
          const isToday = isSameDay(day, new Date());
          return (
            <button
              key={day.toISOString()}
              type="button"
              onClick={() => onChange?.(day)}
              className={cn(
                "flex h-10 items-center justify-center rounded-md text-sm tabular transition-colors focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-brand-primary",
                !inMonth && "text-muted/50",
                inMonth && !isSelected && "text-foreground hover:bg-register",
                isSelected && "bg-brand-primary font-semibold text-white",
                isToday && !isSelected && "ring-1 ring-brand-primary/40"
              )}
            >
              {format(day, "d")}
            </button>
          );
        })}
      </div>
    </div>
  );
}
