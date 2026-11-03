"use client";

import { useRouter } from "next/navigation";

type BudgetPeriodSelectorProps = {
  month: number;
  year: number;
};

export default function BudgetPeriodSelector({
  month,
  year,
}: BudgetPeriodSelectorProps) {
  const router = useRouter();

  function updatePeriod(newMonth: number, newYear: number) {
    router.push(
      `/budgets?month=${newMonth}&year=${newYear}`
    );
  }

  return (
    <div className="flex items-center gap-3">
      <select
        value={month}
        onChange={(event) =>
          updatePeriod(Number(event.target.value), year)
        }
        className="rounded-lg border border-gray-300 bg-white px-3 py-2 text-sm text-gray-900"
      >
        <option value={1}>January</option>
        <option value={2}>February</option>
        <option value={3}>March</option>
        <option value={4}>April</option>
        <option value={5}>May</option>
        <option value={6}>June</option>
        <option value={7}>July</option>
        <option value={8}>August</option>
        <option value={9}>September</option>
        <option value={10}>October</option>
        <option value={11}>November</option>
        <option value={12}>December</option>
      </select>

      <input
        type="number"
        value={year}
        min="2020"
        max="2100"
        onChange={(event) =>
          updatePeriod(month, Number(event.target.value))
        }
        className="w-24 rounded-lg border border-gray-300 bg-white px-3 py-2 text-sm text-gray-900"
      />
    </div>
  );
}