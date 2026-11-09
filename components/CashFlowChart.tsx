
"use client";

import { useState } from "react";

type ChartLine = {
  name: string;
  color: string;
  values: number[];
};

export default function CashFlowChart({
  lines,
  months,
}: {
  lines: ChartLine[];
  months: string[];
}) {
  const [activeIndex, setActiveIndex] = useState<number | null>(null);

  const width = 640;
  const height = 200;
  const left = 62;
  const right = 12;
  const top = 16;
  const bottom = 16;

  const values = lines.flatMap((line) => line.values);
  const minValue = Math.min(0, ...values);
  const maxValue = Math.max(0, ...values);
  const range = Math.max(1, maxValue - minValue);
  const padding = range * 0.1;

  const min = Math.min(0, minValue - padding);
  const max = Math.max(0, maxValue + padding);

  const plotWidth = width - left - right;
  const plotHeight = height - top - bottom;

  const x = (index: number) =>
    left +
    (months.length <= 1
      ? plotWidth / 2
      : (index / (months.length - 1)) * plotWidth);

  const y = (value: number) =>
    top + ((max - value) / (max - min)) * plotHeight;

  const makePath = (points: number[]) =>
    points
      .map((value, index) => {
        const px = x(index);
        const py = y(value);

        if (index === 0) return `M${px},${py}`;

        const previousX = x(index - 1);
        const midpoint = (previousX + px) / 2;

        return `C${midpoint},${y(points[index - 1])} ${midpoint},${py} ${px},${py}`;
      })
      .join(" ");

  const ticks = Array.from(
    { length: 5 },
    (_, index) => min + ((max - min) * index) / 4
  );

  const formatAxis = (value: number) => {
    if (Math.abs(value) >= 1_000_000)
      return `${(value / 1_000_000).toFixed(1)}M`;
    if (Math.abs(value) >= 1_000)
      return `${(value / 1_000).toFixed(1)}k`;
    return value.toFixed(0);
  };

  const formatKES = (value: number) =>
    `KES ${value.toLocaleString("en-KE")}`;

  return (
    <div className="relative w-full">
      <svg
        viewBox={`0 0 ${width} ${height}`}
        className="h-auto w-full"
        role="img"
        aria-label="Interactive six-month net cash flow chart"
        onMouseLeave={() => setActiveIndex(null)}
      >
        {ticks.map((tick, index) => (
          <g key={index}>
            <line
              x1={left}
              x2={width - right}
              y1={y(tick)}
              y2={y(tick)}
              stroke="currentColor"
              strokeOpacity={0.12}
              strokeDasharray="3 5"
            />
            <text
              x={left - 10}
              y={y(tick) + 4}
              textAnchor="end"
              fill="currentColor"
              opacity={0.65}
              fontSize={12}
            >
              {formatAxis(tick)}
            </text>
          </g>
        ))}

        {min < 0 && max > 0 && (
          <line
            x1={left}
            x2={width - right}
            y1={y(0)}
            y2={y(0)}
            stroke="currentColor"
            strokeOpacity={0.4}
          />
        )}

        {lines.map((line) => (
          <g key={line.name}>
            <path
              d={makePath(line.values)}
              fill="none"
              stroke={line.color}
              strokeWidth={2.5}
              strokeLinecap="round"
              vectorEffect="non-scaling-stroke"
              pointerEvents="none"
            />

            {line.values.map((value, index) => (
              <circle
                key={index}
                cx={x(index)}
                cy={y(value)}
                r={activeIndex === index ? 5 : 3.5}
                fill={line.color}
                stroke="currentColor"
                strokeWidth={1.5}
                className="text-white dark:text-neutral-950"
                pointerEvents="none"
              />
            ))}
          </g>
        ))}

        {activeIndex !== null && (
          <line
            x1={x(activeIndex)}
            x2={x(activeIndex)}
            y1={top}
            y2={height - bottom}
            stroke="currentColor"
            strokeOpacity={0.25}
            strokeDasharray="4 4"
            pointerEvents="none"
          />
        )}

        {months.map((month, index) => (
          <rect
            key={`${month}-${index}`}
            x={index === 0 ? left : (x(index - 1) + x(index)) / 2}
            y={top}
            width={
              index === 0
                ? (x(0) + x(1)) / 2 - left
                : index === months.length - 1
                  ? width - right - (x(index - 1) + x(index)) / 2
                  : (x(index + 1) - x(index - 1)) / 2
            }
            height={plotHeight}
            fill="transparent"
            onMouseEnter={() => setActiveIndex(index)}
            onFocus={() => setActiveIndex(index)}
            onBlur={() => setActiveIndex(null)}
            tabIndex={0}
            aria-label={`${month}: ${lines
              .map((line) => `${line.name} ${formatKES(line.values[index] ?? 0)}`)
              .join(", ")}`}
          />
        ))}
      </svg>

      {activeIndex !== null && (
        <div
          className="pointer-events-none absolute top-2 z-10 min-w-44 rounded-lg border border-slate-200 bg-white p-3 text-xs shadow-xl dark:border-neutral-700 dark:bg-neutral-900"
          style={{
            left: `${Math.min(
              70,
              Math.max(0, (x(activeIndex) / width) * 100)
            )}%`,
          }}
        >
          <p className="mb-2 font-semibold">{months[activeIndex]}</p>

          {lines.map((line) => (
            <div
              key={line.name}
              className="flex items-center justify-between gap-4 py-1"
            >
              <span className="flex items-center gap-2">
                <span
                  className="size-2 rounded-full"
                  style={{ backgroundColor: line.color }}
                />
                {line.name}
              </span>

              <span className="font-semibold tabular-nums">
                {formatKES(line.values[activeIndex] ?? 0)}
              </span>
            </div>
          ))}
        </div>
      )}
    </div>
  );
}
