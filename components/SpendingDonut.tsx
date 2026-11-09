
"use client";

import { useState } from "react";

type Segment = {
  name: string;
  value: number;
  color: string;
};

export default function SpendingDonut({
  segments,
  total,
}: {
  segments: Segment[];
  total: number;
}) {
  const [activeIndex, setActiveIndex] = useState<number | null>(null);
  const [showAll, setShowAll] = useState(false);

  const validSegments = segments.filter((segment) => segment.value > 0); 
  const sortedSegments = [...validSegments].sort((a, b) => b.value - a.value);
  const visibleSegments = showAll ? sortedSegments : sortedSegments.slice(0, 5); 
  const segmentTotal = validSegments.reduce((sum, s) => sum + s.value, 0);

  const selected =
    activeIndex !== null ? validSegments[activeIndex] : null;

  const formatKES = (value: number) =>
    `KES ${value.toLocaleString("en-KE", {
      maximumFractionDigits: 2,
    })}`;

  const percentage = (value: number) =>
    segmentTotal > 0 ? (value / segmentTotal) * 100 : 0;

  const radius = 49;
  const circumference = 2 * Math.PI * radius;

  let accumulated = 0;

  return (
    <div className="mt-4 flex flex-wrap items-center gap-5">
      <div className="relative grid size-36 shrink-0 place-items-center">
        <svg
          viewBox="0 0 140 140"
          className="size-full -rotate-90"
          role="img"
          aria-label="Interactive spending breakdown"
          onMouseLeave={() => setActiveIndex(null)}
        >
          <circle
            cx="70"
            cy="70"
            r={radius}
            fill="none"
            stroke="currentColor"
            strokeWidth="15"
            opacity={0.08}
          />

          {validSegments.map((segment, index) => {
            const fraction = segment.value / segmentTotal;
            const length = fraction * circumference;
            const offset = accumulated;

            accumulated += length;

            return (
              <circle
                key={`${segment.name}-${index}`}
                cx="70"
                cy="70"
                r={radius}
                fill="none"
                stroke={segment.color}
                strokeWidth={activeIndex === index ? 19 : 15}
                strokeDasharray={`${length} ${circumference - length}`}
                strokeDashoffset={-offset}
                opacity={
                  activeIndex === null || activeIndex === index ? 1 : 0.35
                }
                className="cursor-pointer transition-opacity"
                onMouseEnter={() => setActiveIndex(index)}
                onClick={() =>
                  setActiveIndex(activeIndex === index ? null : index)
                }
              >
                <title>
                  {`${segment.name}: ${formatKES(segment.value)} (${percentage(segment.value).toFixed(1)}%)`}
                </title>
              </circle>
            );
          })}
        </svg>

        <div className="pointer-events-none absolute inset-0 flex flex-col items-center justify-center text-center">
          {selected ? (
            <>
              <span className="max-w-24 truncate text-[11px] font-medium">
                {selected.name}
              </span>
              <span className="mt-1 text-sm font-semibold tabular-nums">
                {percentage(selected.value).toFixed(1)}%
              </span>
              <span className="mt-0.5 text-[10px] text-slate-500 dark:text-neutral-400">
                {formatKES(selected.value)}
              </span>
            </>
          ) : (
            <>
              <span className="text-[10px] text-slate-500 dark:text-neutral-400">
                Total spent
              </span>
              <span className="mt-1 text-[13px] font-semibold tabular-nums">
                {formatKES(total)}
              </span>
            </>
          )}
        </div>
      </div>

      <div className="min-w-0 flex-1 space-y-1">
        {validSegments.length === 0 && (
          <p className="text-xs text-slate-500 dark:text-neutral-400">
            No spending recorded this month.
          </p>
        )}

        {visibleSegments.map((segment, index) => (
          <button
            key={`${segment.name}-${index}`}
            type="button"
            onMouseEnter={() => setActiveIndex(index)}
            onMouseLeave={() => setActiveIndex(null)}
            onFocus={() => setActiveIndex(index)}
            onBlur={() => setActiveIndex(null)}
            onClick={() =>
              setActiveIndex(activeIndex === index ? null : index)
            }
            className={`flex w-full items-center justify-between gap-3 rounded-md px-2 py-2 text-left text-xs transition-colors ${
              activeIndex === index
                ? "bg-slate-100 dark:bg-neutral-800"
                : "hover:bg-slate-50 dark:hover:bg-neutral-900"
            }`}
          >
            <span className="flex min-w-0 items-center gap-2">
              <span
                className="size-2 shrink-0 rounded-full"
                style={{ backgroundColor: segment.color }}
              />
              <span className="truncate">{segment.name}</span>
            </span>

            <span className="shrink-0 font-medium tabular-nums text-slate-600 dark:text-neutral-300">
              {percentage(segment.value).toFixed(0)}%
            </span>
          </button>
        ))}

        {validSegments.length > 5 && (
          <button
           type="button"
           onClick={() => {
           setShowAll((previous) => !previous);
           setActiveIndex(null);
            }}
              className="mt-2 w-full rounded-lg border border-slate-200 px-3 py-2 text-xs font-medium text-slate-600 transition-colors hover:bg-slate-50 dark:border-neutral-800 dark:text-neutral-300 dark:hover:bg-neutral-900"
            >
            {showAll
              ? "Show less"
              : `Show all ${validSegments.length} categories`}
             </button>
             )}
      </div>
    </div>
  );
}
