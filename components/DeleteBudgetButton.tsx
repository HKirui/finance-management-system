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
        className="rounded-lg p-2 text-gray-500 hover:bg-red-50 hover:text-red-600"
        title="Delete budget"
      >
        <Trash2 size={16} />
      </button>

      {isOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/40 p-4">
          <div className="w-full max-w-md rounded-xl bg-white p-6 shadow-xl">
            <h2 className="text-xl font-bold text-gray-900">
              Delete Budget?
            </h2>

            <p className="mt-2 text-sm text-gray-600">
              Are you sure you want to delete the {categoryName} budget?
              Your transactions will not be deleted.
            </p>

            {error && (
              <div className="mt-4 rounded-lg bg-red-50 px-4 py-3 text-sm text-red-700">
                {error}
              </div>
            )}

            <div className="mt-6 flex justify-end gap-3">
              <button
                type="button"
                disabled={isPending}
                onClick={() => setIsOpen(false)}
                className="rounded-lg border border-gray-300 px-4 py-2.5 text-sm font-medium text-gray-700 disabled:opacity-50"
              >
                Cancel
              </button>

              <button
                type="button"
                disabled={isPending}
                onClick={handleDelete}
                className="rounded-lg bg-red-600 px-5 py-2.5 text-sm font-medium text-white hover:bg-red-700 disabled:cursor-not-allowed disabled:opacity-50"
              >
                {isPending ? "Deleting..." : "Delete Budget"}
              </button>
            </div>
          </div>
        </div>
      )}
    </>
  );
}