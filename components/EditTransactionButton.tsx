"use client";

import { useActionState, useEffect, useState } from "react";
import { Pencil } from "lucide-react";
import { updateTransaction } from "@/app/actions/transactions";

type Account = {
  id: string;
  name: string;
};

type Category = {
  id: string;
  name: string;
  type: string;
};

type EditTransactionButtonProps = {
  transaction: {
    id: string;
    type: string;
    amount: number;
    description: string | null;
    date: string;
    accountId: string;
    categoryId: string | null;
  };
  accounts: Account[];
  categories: Category[];
};

const initialState = {
  success: false,
  message: "",
};

export default function EditTransactionButton({
  transaction,
  accounts,
  categories,
}: EditTransactionButtonProps) {
  const [isOpen, setIsOpen] = useState(false);
  const [type, setType] = useState(transaction.type);

  const [state, formAction, isPending] = useActionState(
    updateTransaction,
    initialState
  );

  useEffect(() => {
    if (state.success && !isPending) {
      setIsOpen(false);
    }
  }, [state, isPending]);

  const filteredCategories = categories.filter(
    (category) => category.type === type
  );

  return (
    <>
      <button
        type="button"
        onClick={() => setIsOpen(true)}
        className="rounded-lg p-2 text-gray-500 hover:bg-gray-100 hover:text-gray-900"
        title="Edit transaction"
      >
        <Pencil size={16} />
      </button>

      {isOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/40 p-4">
          <div className="w-full max-w-lg rounded-xl bg-white p-6 text-left shadow-xl">
            <div className="mb-6">
              <h2 className="text-xl font-bold text-gray-900">
                Edit Transaction
              </h2>

              <p className="mt-1 text-sm text-gray-500">
                Update this transaction.
              </p>
            </div>

            <form action={formAction} className="space-y-4">
              <input
                type="hidden"
                name="transactionId"
                value={transaction.id}
              />

              <div>
                <label className="mb-1.5 block text-sm font-medium text-gray-700">
                  Type
                </label>

                <select
                  name="type"
                  value={type}
                  onChange={(event) => setType(event.target.value)}
                  className="w-full rounded-lg border border-gray-300 px-3 py-2.5 text-gray-900"
                >
                  <option value="INCOME">Income</option>
                  <option value="EXPENSE">Expense</option>
                </select>
              </div>

              <div>
                <label className="mb-1.5 block text-sm font-medium text-gray-700">
                  Account
                </label>

                <select
                  name="accountId"
                  defaultValue={transaction.accountId}
                  className="w-full rounded-lg border border-gray-300 px-3 py-2.5 text-gray-900"
                  required
                >
                  {accounts.map((account) => (
                    <option key={account.id} value={account.id}>
                      {account.name}
                    </option>
                  ))}
                </select>
              </div>

              <div>
                <label className="mb-1.5 block text-sm font-medium text-gray-700">
                  Category
                </label>

                <select
                  name="categoryId"
                  defaultValue={transaction.categoryId ?? ""}
                  className="w-full rounded-lg border border-gray-300 px-3 py-2.5 text-gray-900"
                >
                  <option value="">Uncategorized</option>

                  {filteredCategories.map((category) => (
                    <option key={category.id} value={category.id}>
                      {category.name}
                    </option>
                  ))}
                </select>
              </div>

              <div>
                <label className="mb-1.5 block text-sm font-medium text-gray-700">
                  Amount (KES)
                </label>

                <input
                  type="number"
                  name="amount"
                  defaultValue={transaction.amount}
                  min="0.01"
                  step="0.01"
                  className="w-full rounded-lg border border-gray-300 px-3 py-2.5 text-gray-900"
                  required
                />
              </div>

              <div>
                <label className="mb-1.5 block text-sm font-medium text-gray-700">
                  Date
                </label>

                <input
                  type="date"
                  name="date"
                  defaultValue={transaction.date}
                  className="w-full rounded-lg border border-gray-300 px-3 py-2.5 text-gray-900"
                  required
                />
              </div>

              <div>
                <label className="mb-1.5 block text-sm font-medium text-gray-700">
                  Description
                </label>

                <input
                  type="text"
                  name="description"
                  defaultValue={transaction.description ?? ""}
                  className="w-full rounded-lg border border-gray-300 px-3 py-2.5 text-gray-900"
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
                  className="rounded-lg bg-gray-900 px-5 py-2.5 text-sm font-medium text-white disabled:opacity-50"
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