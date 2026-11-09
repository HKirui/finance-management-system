"use client";

import { useActionState, useEffect, useState } from "react";
import { Pencil } from "lucide-react";
import { updateBudget } from "@/app/actions/budgets";

type EditBudgetFormProps = {
  budgetId: string;
  categoryName: string;
  amount: number;
};

const initialState = {
  success: false,
  message: "",
};

export default function EditBudgetForm({
  budgetId,
  categoryName,
  amount,
}: EditBudgetFormProps) {
  const [isOpen, setIsOpen] = useState(false);

  const [state, formAction, isPending] = useActionState(
    updateBudget,
    initialState
  );

  useEffect(() => {
    if (state.success && !isPending) {
      setIsOpen(false);
    }
  }, [state, isPending]);

  return (
    <>
      <button
        type="button"
        onClick={() => setIsOpen(true)}
        className="grid size-8 place-items-center rounded-lg text-slate-400 transition-colors hover:bg-slate-100 hover:text-slate-900 dark:text-neutral-500 dark:hover:bg-neutral-800 dark:hover:text-neutral-100"
        title="Edit budget"
        aria-label={`Edit ${categoryName} budget`}
      >
        <Pencil size={14} strokeWidth={1.8} />
      </button>

      {isOpen && (
        <div className="fixed inset-0 z-50 flex items-end justify-center bg-black/60 text-left backdrop-blur-sm sm:items-center sm:p-5">
          <div
            role="dialog"
            aria-modal="true"
            aria-labelledby={`edit-budget-${budgetId}`}
            className="flex w-full max-w-sm flex-col overflow-hidden rounded-t-2xl border border-slate-200 bg-white shadow-2xl dark:border-neutral-800 dark:bg-neutral-950 sm:rounded-xl"
          >
            <div className="flex items-start justify-between gap-4 border-b border-slate-200 px-4 py-3 dark:border-neutral-800">
              <div>
                <h2
                  id={`edit-budget-${budgetId}`}
                  className="font-[family-name:var(--font-fraunces)] text-base tracking-tight text-slate-900 dark:text-neutral-100"
                >
                  Edit budget
                </h2>

                <p className="mt-0.5 text-xs text-slate-500 dark:text-neutral-400">
                  Update the budget for {categoryName}.
                </p>
              </div>

              <button
                type="button"
                aria-label="Close"
                onClick={() => setIsOpen(false)}
                className="grid size-8 shrink-0 place-items-center rounded-lg text-xl leading-none text-slate-400 hover:bg-slate-100 hover:text-slate-700 dark:hover:bg-neutral-900 dark:hover:text-neutral-200"
              >
                ×
              </button>
            </div>

            <form action={formAction}>
              <input
                type="hidden"
                name="budgetId"
                value={budgetId}
              />

              <div className="space-y-3 px-4 py-4">
                <div>
                  <label
                    htmlFor={`edit-budget-amount-${budgetId}`}
                    className="mb-1 block text-xs font-medium text-slate-600 dark:text-neutral-400"
                  >
                    Budget amount
                  </label>

                  <div className="relative">
                    <span className="pointer-events-none absolute inset-y-0 left-3 flex items-center text-xs text-slate-400 dark:text-neutral-500">
                      KES
                    </span>
                    <input
                      id={`edit-budget-amount-${budgetId}`}
                      type="number"
                      name="amount"
                      defaultValue={amount}
                      min="0.01"
                      step="0.01"
                      className="min-h-9 w-full rounded-lg border border-slate-300 bg-white pl-11 pr-3 text-[13px] tabular-nums text-slate-900 focus:border-slate-900 focus:outline-none focus:ring-2 focus:ring-slate-900/10 dark:border-neutral-700 dark:bg-neutral-900 dark:text-neutral-100 dark:focus:border-neutral-400 dark:focus:ring-neutral-100/10"
                      required
                    />
                  </div>
                </div>

                {state.message && !state.success && (
                  <div
                    role="alert"
                    className="rounded-lg border border-rose-200 bg-rose-50 px-3 py-2.5 text-[13px] text-rose-700 dark:border-rose-900/60 dark:bg-rose-950/40 dark:text-rose-300"
                  >
                    {state.message}
                  </div>
                )}
              </div>

              <div className="flex justify-end gap-2 border-t border-slate-200 px-4 py-3 dark:border-neutral-800">
                <button
                  type="button"
                  disabled={isPending}
                  onClick={() => setIsOpen(false)}
                  className="min-h-9 rounded-lg border border-slate-300 px-4 text-[13px] font-medium text-slate-700 hover:bg-slate-50 disabled:opacity-50 dark:border-neutral-700 dark:text-neutral-200 dark:hover:bg-neutral-900"
                >
                  Cancel
                </button>

                <button
                  type="submit"
                  disabled={isPending}
                  className="min-h-9 rounded-lg bg-slate-900 px-5 text-[13px] font-medium text-white hover:bg-slate-700 disabled:cursor-not-allowed disabled:opacity-50 dark:bg-neutral-100 dark:text-neutral-900 dark:hover:bg-white"
                >
                  {isPending ? "Saving..." : "Save changes"}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </>
  );
}