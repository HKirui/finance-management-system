"use client";

import { useState, useTransition } from "react";
import { Trash2 } from "lucide-react";
import { deleteBudget } from "@/app/actions/budgets";

type DeleteBudgetButtonProps = {
  budgetId: string;
  categoryName: string;
};

export default function DeleteBudgetButton({
  budgetId,
  categoryName,
}: DeleteBudgetButtonProps) {
  const [isOpen, setIsOpen] = useState(false);
  const [error, setError] = useState("");
  const [isPending, startTransition] = useTransition();

  function handleDelete() {
    setError("");

    startTransition(async () => {
      const result = await deleteBudget(budgetId);

      if (result.success) {
        setIsOpen(false);
        return;
      }

      setError(result.message);
    });
  }

  return (
    <>
      <button
        type="button"
        onClick={() => setIsOpen(true)}
        className="grid size-8 place-items-center rounded-lg text-slate-400 transition-colors hover:bg-rose-50 hover:text-rose-600 dark:text-neutral-500 dark:hover:bg-rose-950/40 dark:hover:text-rose-400"
        title="Delete budget"
        aria-label={`Delete ${categoryName} budget`}
      >
        <Trash2 size={14} strokeWidth={1.8} />
      </button>

      {isOpen && (
        <div className="fixed inset-0 z-50 flex items-end justify-center bg-black/60 text-left backdrop-blur-sm sm:items-center sm:p-5">
          <div
            role="alertdialog"
            aria-modal="true"
            aria-labelledby={`delete-budget-${budgetId}`}
            className="w-full max-w-sm overflow-hidden rounded-t-2xl border border-slate-200 bg-white shadow-2xl dark:border-neutral-800 dark:bg-neutral-950 sm:rounded-xl"
          >
            <div className="px-4 pb-4 pt-4">
              <div className="grid size-9 place-items-center rounded-full bg-rose-50 text-rose-600 dark:bg-rose-950/50 dark:text-rose-400">
                <Trash2 size={16} />
              </div>

              <h2
                id={`delete-budget-${budgetId}`}
                className="mt-3 font-[family-name:var(--font-fraunces)] text-base tracking-tight text-slate-900 dark:text-neutral-100"
              >
                Delete budget?
              </h2>

              <p className="mt-1.5 text-[13px] leading-relaxed text-slate-600 dark:text-neutral-400">
                Are you sure you want to delete the {categoryName} budget?
                Your transactions will not be deleted.
              </p>

              {error && (
                <div
                  role="alert"
                  className="mt-3 rounded-lg border border-rose-200 bg-rose-50 px-3 py-2.5 text-[13px] text-rose-700 dark:border-rose-900/60 dark:bg-rose-950/40 dark:text-rose-300"
                >
                  {error}
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
                type="button"
                disabled={isPending}
                onClick={handleDelete}
                className="min-h-9 rounded-lg bg-rose-600 px-5 text-[13px] font-medium text-white hover:bg-rose-700 disabled:cursor-not-allowed disabled:opacity-50"
              >
                {isPending ? "Deleting..." : "Delete budget"}
              </button>
            </div>
          </div>
        </div>
      )}
    </>
  );
}