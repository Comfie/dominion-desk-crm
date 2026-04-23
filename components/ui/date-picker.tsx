'use client';

import { useMemo, useState } from 'react';
import * as Popover from '@radix-ui/react-popover';
import {
  addMonths,
  eachDayOfInterval,
  endOfMonth,
  endOfWeek,
  format,
  getMonth,
  getYear,
  isAfter,
  isBefore,
  isSameDay,
  isSameMonth,
  isValid,
  parseISO,
  setMonth,
  setYear,
  startOfMonth,
  startOfWeek,
  subMonths,
} from 'date-fns';
import { CalendarDays, ChevronLeft, ChevronRight } from 'lucide-react';

import { cn } from '@/lib/utils';

const WEEKDAY_LABELS = ['Su', 'Mo', 'Tu', 'We', 'Th', 'Fr', 'Sa'];

type DatePickerProps = {
  id?: string;
  value?: string;
  onChange: (value: string) => void;
  min?: string;
  max?: string;
  placeholder?: string;
  disabled?: boolean;
  className?: string;
};

function parseDateValue(value?: string | null) {
  if (!value) {
    return null;
  }

  const parsedDate = parseISO(value);
  return isValid(parsedDate) ? parsedDate : null;
}

function formatDateValue(date: Date) {
  return format(date, 'yyyy-MM-dd');
}

function isOutsideRange(date: Date, minDate: Date | null, maxDate: Date | null) {
  if (minDate && isBefore(date, minDate)) {
    return true;
  }

  if (maxDate && isAfter(date, maxDate)) {
    return true;
  }

  return false;
}

function clampMonth(date: Date, minDate: Date | null, maxDate: Date | null) {
  if (minDate && isBefore(endOfMonth(date), minDate)) {
    return startOfMonth(minDate);
  }

  if (maxDate && isAfter(startOfMonth(date), endOfMonth(maxDate))) {
    return startOfMonth(maxDate);
  }

  return startOfMonth(date);
}

export function DatePicker({
  id,
  value,
  onChange,
  min,
  max,
  placeholder = 'Select a date',
  disabled = false,
  className,
}: DatePickerProps) {
  const [open, setOpen] = useState(false);

  const selectedDate = useMemo(() => parseDateValue(value), [value]);
  const minDate = useMemo(() => parseDateValue(min), [min]);
  const maxDate = useMemo(() => parseDateValue(max), [max]);
  const anchorMonth = useMemo(
    () => clampMonth(selectedDate ?? maxDate ?? minDate ?? new Date(), minDate, maxDate),
    [selectedDate, minDate, maxDate]
  );

  const [displayMonth, setDisplayMonth] = useState(anchorMonth);

  const days = useMemo(() => {
    const start = startOfWeek(startOfMonth(displayMonth));
    const end = endOfWeek(endOfMonth(displayMonth));

    return eachDayOfInterval({ start, end });
  }, [displayMonth]);

  const monthOptions = useMemo(
    () =>
      Array.from({ length: 12 }, (_, monthIndex) => ({
        label: format(new Date(2026, monthIndex, 1), 'LLLL'),
        value: monthIndex,
      })),
    []
  );

  const yearOptions = useMemo(() => {
    const currentYear = getYear(new Date());
    const earliestYear = minDate
      ? getYear(minDate)
      : maxDate
        ? getYear(maxDate) - 100
        : currentYear - 100;
    const latestYear = maxDate
      ? getYear(maxDate)
      : minDate
        ? getYear(minDate) + 100
        : currentYear + 10;

    return Array.from(
      { length: latestYear - earliestYear + 1 },
      (_, index) => earliestYear + index
    );
  }, [minDate, maxDate]);

  const previousMonth = subMonths(displayMonth, 1);
  const nextMonth = addMonths(displayMonth, 1);
  const previousDisabled = minDate ? isBefore(endOfMonth(previousMonth), minDate) : false;
  const nextDisabled = maxDate ? isAfter(startOfMonth(nextMonth), endOfMonth(maxDate)) : false;

  const handleSelectDate = (date: Date) => {
    if (isOutsideRange(date, minDate, maxDate)) {
      return;
    }

    onChange(formatDateValue(date));
    setOpen(false);
  };

  const handleMonthChange = (monthIndex: number) => {
    setDisplayMonth((current) => clampMonth(setMonth(current, monthIndex), minDate, maxDate));
  };

  const handleYearChange = (year: number) => {
    setDisplayMonth((current) => clampMonth(setYear(current, year), minDate, maxDate));
  };

  return (
    <Popover.Root
      open={open}
      onOpenChange={(nextOpen) => {
        setOpen(nextOpen);

        if (nextOpen) {
          setDisplayMonth(anchorMonth);
        }
      }}
    >
      <Popover.Trigger asChild>
        <button
          id={id}
          type="button"
          disabled={disabled}
          className={cn(
            'border-input focus-visible:ring-ring flex h-[40px] w-full items-center justify-between rounded-md border bg-transparent px-3 py-2 text-left text-sm shadow-sm transition-colors focus-visible:ring-1 focus-visible:outline-none disabled:cursor-not-allowed disabled:opacity-50',
            !selectedDate && 'text-muted-foreground',
            className
          )}
        >
          <span>{selectedDate ? format(selectedDate, 'dd MMM yyyy') : placeholder}</span>
          <CalendarDays className="text-muted-foreground h-4 w-4" />
        </button>
      </Popover.Trigger>

      <Popover.Portal>
        <Popover.Content
          align="start"
          sideOffset={10}
          className="bg-background border-border/70 z-50 w-[min(22rem,calc(100vw-2rem))] rounded-2xl border p-4 shadow-2xl outline-none"
        >
          <div className="mb-4 flex items-center justify-between gap-2">
            <button
              type="button"
              className="border-input hover:bg-accent inline-flex h-9 w-9 items-center justify-center rounded-xl border transition-colors disabled:pointer-events-none disabled:opacity-40"
              onClick={() => setDisplayMonth(previousMonth)}
              disabled={previousDisabled}
              aria-label="Previous month"
            >
              <ChevronLeft className="h-4 w-4" />
            </button>

            <div className="grid flex-1 grid-cols-2 gap-2">
              <select
                value={getMonth(displayMonth)}
                onChange={(event) => handleMonthChange(Number(event.target.value))}
                className="border-input focus-visible:ring-ring h-9 rounded-xl border bg-transparent px-3 text-sm shadow-sm focus-visible:ring-1 focus-visible:outline-none"
              >
                {monthOptions.map((month) => (
                  <option key={month.value} value={month.value}>
                    {month.label}
                  </option>
                ))}
              </select>

              <select
                value={getYear(displayMonth)}
                onChange={(event) => handleYearChange(Number(event.target.value))}
                className="border-input focus-visible:ring-ring h-9 rounded-xl border bg-transparent px-3 text-sm shadow-sm focus-visible:ring-1 focus-visible:outline-none"
              >
                {yearOptions.map((year) => (
                  <option key={year} value={year}>
                    {year}
                  </option>
                ))}
              </select>
            </div>

            <button
              type="button"
              className="border-input hover:bg-accent inline-flex h-9 w-9 items-center justify-center rounded-xl border transition-colors disabled:pointer-events-none disabled:opacity-40"
              onClick={() => setDisplayMonth(nextMonth)}
              disabled={nextDisabled}
              aria-label="Next month"
            >
              <ChevronRight className="h-4 w-4" />
            </button>
          </div>

          <div className="mb-2 grid grid-cols-7 gap-1">
            {WEEKDAY_LABELS.map((label) => (
              <div
                key={label}
                className="text-muted-foreground flex h-8 items-center justify-center text-xs font-medium"
              >
                {label}
              </div>
            ))}
          </div>

          <div className="grid grid-cols-7 gap-1">
            {days.map((date) => {
              const outOfMonth = !isSameMonth(date, displayMonth);
              const selected = selectedDate ? isSameDay(date, selectedDate) : false;
              const disabledDate = isOutsideRange(date, minDate, maxDate);

              return (
                <button
                  key={date.toISOString()}
                  type="button"
                  onClick={() => handleSelectDate(date)}
                  disabled={disabledDate}
                  className={cn(
                    'inline-flex h-10 items-center justify-center rounded-xl text-sm transition-colors',
                    selected && 'bg-primary text-primary-foreground shadow-sm',
                    !selected && !disabledDate && 'hover:bg-accent',
                    outOfMonth && !selected && 'text-muted-foreground/45',
                    disabledDate && 'text-muted-foreground/35 pointer-events-none',
                    !outOfMonth && !selected && !disabledDate && 'text-foreground'
                  )}
                >
                  {format(date, 'd')}
                </button>
              );
            })}
          </div>

          <div className="mt-4 flex items-center justify-between border-t pt-3">
            <div className="text-muted-foreground text-xs">
              {selectedDate ? `Selected: ${format(selectedDate, 'dd MMM yyyy')}` : placeholder}
            </div>

            {value ? (
              <button
                type="button"
                className="text-muted-foreground hover:text-foreground text-xs font-medium transition-colors"
                onClick={() => onChange('')}
              >
                Clear
              </button>
            ) : null}
          </div>
        </Popover.Content>
      </Popover.Portal>
    </Popover.Root>
  );
}
