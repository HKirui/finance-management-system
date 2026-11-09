"use client";

import { useState, useTransition } from "react";
import { Trash2 } from "lucide-react";
import { deleteTransaction } from "@/app/actions/transactions";

type DeleteTransactionButtonProps = {
  transactionId: string;
  description?: string | null;
};

export default function DeleteTransactionButton({
  transactionId,
  description,
}: DeleteTransactionButtonProps) {
  const [isOpen, setIsOpen] = useState(false);
  const [error, setError] = useState("");
  const [isPending, startTransition] = useTransition();

  function handleDelete() {
    setError("");

    startTransition(async () => {
      const result = await deleteTransaction(transactionId);

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
        className="grid size-9 place-items-center rounded-lg text-slate-400 transition-colors hover:bg-rose-50 hover:text-rose-600 dark:text-neutral-500 dark:hover:bg-rose-950/40 dark:hover:text-rose-400"
        title="Delete transaction"
        aria-label="Delete transaction"
      >
        <Trash2 size={15} />
      </button>

      {isOpen && (
        <div className="fixed inset-0 z-50 flex items-end justify-center bg-black/60 text-left backdrop-blur-sm sm:items-center sm:p-5">
          <div
            role="alertdialog"
            aria-modal="true"
            aria-labelledby="delete-transaction-title"
            className="w-full max-w-md overflow-hidden rounded-t-2xl border border-slate-200 bg-white shadow-2xl dark:border-neutral-800 dark:bg-neutral-950 sm:rounded-2xl"
          >
            <div className="px-5 pb-5 pt-5">
              <div className="grid size-10 place-items-center rounded-full bg-rose-50 text-rose-600 dark:bg-rose-950/50 dark:text-rose-400">
                <Trash2 size={18} />
              </div>

              <h2
                id="delete-transaction-title"
                className="mt-4 font-[family-name:var(--font-fraunces)] text-lg tracking-tight text-slate-900 dark:text-neutral-100"
              >
                Delete transaction?
              </h2>

              <p className="mt-1.5 text-[13px] text-slate-600 dark:text-neutral-400">
                This transaction will be permanently deleted.
              </p>

              {description && (
                <div className="mt-4 rounded-lg border border-slate-200 bg-slate-50 px-3.5 py-3 dark:border-neutral-800 dark:bg-neutral-900">
                  <p className="text-[13px] font-medium text-slate-900 dark:text-neutral-100">
                    {description}
                  </p>
                </div>
              )}

              <p className="mt-4 text-xs font-medium text-rose-600 dark:text-rose-400">
                Account balances and budget calculations will be updated.
              </p>

              {error && (
                <div
                  role="alert"
                  className="mt-4 rounded-lg border border-rose-200 bg-rose-50 px-3 py-2.5 text-[13px] text-rose-700 dark:border-rose-900/60 dark:bg-rose-950/40 dark:text-rose-300"
                >
                  {error}
                </div>
              )}
            </div>

            <div className="flex justify-end gap-2 border-t border-slate-200 px-5 py-4 dark:border-neutral-800">
              <button
                type="button"
                disabled={isPending}
                onClick={() => setIsOpen(false)}
                className="min-h-10 rounded-lg border border-slate-300 px-4 text-[13px] font-medium text-slate-700 hover:bg-slate-50 disabled:opacity-50 dark:border-neutral-700 dark:text-neutral-200 dark:hover:bg-neutral-900"
              >
                Cancel
              </button>

              <button
                type="button"
                disabled={isPending}
                onClick={handleDelete}
                className="min-h-10 rounded-lg bg-rose-600 px-5 text-[13px] font-medium text-white hover:bg-rose-700 disabled:cursor-not-allowed disabled:opacity-50"
              >
                {isPending ? "Deleting..." : "Delete transaction"}
              </button>
            </div>
          </div>
        </div>
      )}
    </>
  );
}