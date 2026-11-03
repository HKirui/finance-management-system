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
        className="rounded-lg p-2 text-gray-500 hover:bg-gray-100 hover:text-gray-900"
        title="Edit budget"
      >
        <Pencil size={16} />
      </button>

      {isOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/40 p-4">
          <div className="w-full max-w-md rounded-xl bg-white p-6 shadow-xl">
            <div className="mb-6">
              <h2 className="text-xl font-bold text-gray-900">
                Edit Budget
              </h2>

              <p className="mt-1 text-sm text-gray-500">
                Update the budget for {categoryName}.
              </p>
            </div>

            <form action={formAction} className="space-y-4">
              <input
                type="hidden"
                name="budgetId"
                value={budgetId}
              />

              <div>
                <label className="mb-1.5 block text-sm font-medium text-gray-700">
                  Budget Amount (KES)
                </label>

                <input
                  type="number"
                  name="amount"
                  defaultValue={amount}
                  min="0.01"
                  step="0.01"
                  className="w-full rounded-lg border border-gray-300 px-3 py-2.5 text-gray-900"
                  required
                />
              </div>

              {state.message && !state.success && (
                <div className="rounded-lg bg-red-50 px-4 py-3 text-sm text-red-700">
                  {state.message}
                </div>
              )}

              <div className="flex justify-end gap-3 border-t border-gray-200 pt-5">
                <button
                  type="button"
                  disabled={isPending}
                  onClick={() => setIsOpen(false)}
                  className="rounded-lg border border-gray-300 px-4 py-2.5 text-sm font-medium text-gray-700 disabled:opacity-50"
                >
                  Cancel
                </button>

                <button
                  type="submit"
                  disabled={isPending}
                  className="rounded-lg bg-gray-900 px-5 py-2.5 text-sm font-medium text-white disabled:cursor-not-allowed disabled:opacity-50"
                >
                  {isPending ? "Saving..." : "Save Changes"}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </>
  );
}