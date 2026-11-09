"use client";

import { useRouter } from "next/navigation";

type BudgetPeriodSelectorProps = {
  month: number;
  year: number;
  profile?: string;
};

const months = [
  "January", "February", "March", "April", "May", "June",
  "July", "August", "September", "October", "November", "December",
];

const control =
  "min-h-10 rounded-lg border border-slate-300 bg-white px-3 text-[13px] text-slate-900 focus:border-slate-900 focus:outline-none focus:ring-2 focus:ring-slate-900/10 dark:border-neutral-700 dark:bg-neutral-900 dark:text-neutral-100 dark:focus:border-neutral-400 dark:focus:ring-neutral-100/10";

export default function BudgetPeriodSelector({
  month,
  year,
  profile,
}: BudgetPeriodSelectorProps) {
  const router = useRouter();

  function updatePeriod(newMonth: number, newYear: number) {
    const query = new URLSearchParams();
    if (profile) query.set("profile", profile);
    query.set("month", String(newMonth));
    query.set("year", String(newYear));

    router.push(`/budgets?${query.toString()}`);
  }

  function commitYear(value: string) {
    const next = Number(value);

    if (Number.isInteger(next) && next >= 2020 && next <= 2100 && next !== year) {
      updatePeriod(month, next);
    }
  }

  return (
    <div className="flex items-center gap-2">
      <select
        aria-label="Month"
        value={month}
        onChange={(event) =>
          updatePeriod(Number(event.target.value), year)
        }
        className={control}
      >
        {months.map((name, index) => (
          <option key={name} value={index + 1}>
            {name}
          </option>
        ))}
      </select>

      <input
        key={year}
        aria-label="Year"
        type="number"
        defaultValue={year}
        min="2020"
        max="2100"
        onBlur={(event) => commitYear(event.target.value)}
        onKeyDown={(event) => {
          if (event.key === "Enter") {
            event.currentTarget.blur();
          }
        }}
        className={`${control} w-20 tabular-nums`}
      />
    </div>
  );
}