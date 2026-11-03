"use client";

import { useActionState, useEffect, useState } from "react";
import { createTransaction } from "@/app/actions/transactions";

type Account = {
  id: string;
  name: string;
};

type Category = {
  id: string;
  name: string;
  type: "INCOME" | "EXPENSE";
};

type Profile = {
  id: string;
  name: string;
  type: "PERSONAL" | "BUSINESS";
  accounts: Account[];
  categories: Category[];
};

type TransactionFormProps = {
  profiles: Profile[];
};

export default function TransactionForm({
  profiles,
}: TransactionFormProps) {
  const [isOpen, setIsOpen] = useState(false);
  const [profileId, setProfileId] = useState("");
  const initialState = {
  success: false,
  message: "",
};

const [state, formAction, isPending] = useActionState(
  createTransaction,
  initialState
);
  const [transactionType, setTransactionType] = useState<
    "INCOME" | "EXPENSE"
  >("EXPENSE");

  const selectedProfile = profiles.find(
    (profile) => profile.id === profileId
  );

  const filteredCategories =
    selectedProfile?.categories.filter(
      (category) => category.type === transactionType
    ) ?? [];

    useEffect(() => {
  if (state.success) {
    setIsOpen(false);
    setProfileId("");
    setTransactionType("EXPENSE");
  }
}, [state.success]);

  if (!isOpen) {
    return (
      <button
        onClick={() => setIsOpen(true)}
        className="rounded-lg bg-gray-900 px-5 py-2.5 text-sm font-medium text-white hover:bg-gray-800"
      >
        + Add Transaction
      </button>
    );
  }

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/40 p-4">
      <div className="w-full max-w-lg rounded-xl bg-white p-6 shadow-xl">
        <div className="mb-6 flex items-center justify-between">
          <div>
            <h2 className="text-xl font-bold text-gray-900">
              Add Transaction
            </h2>

            <p className="mt-1 text-sm text-gray-500">
              Record personal or K-Link income and expenses.
            </p>
          </div>

          <button
            type="button"
            onClick={() => setIsOpen(false)}
            className="text-2xl text-gray-400 hover:text-gray-700"
          >
            ×
          </button>
        </div>

        <form action={formAction} className="space-y-4">
          <div>
            <label className="mb-1.5 block text-sm font-medium text-gray-700">
              Financial Profile
            </label>

            <select
              name="profileId"
              value={profileId}
              onChange={(event) => setProfileId(event.target.value)}
              className="w-full rounded-lg border border-gray-300 px-3 py-2.5 text-gray-900"
              required
            >
              <option value="">Select profile</option>

              {profiles.map((profile) => (
                <option key={profile.id} value={profile.id}>
                  {profile.name}
                </option>
              ))}
            </select>
          </div>

          <div>
            <label className="mb-1.5 block text-sm font-medium text-gray-700">
              Transaction Type
            </label>

            <select
            name="type"
              value={transactionType}
              onChange={(event) =>
                setTransactionType(
                  event.target.value as "INCOME" | "EXPENSE"
                )
              }
              className="w-full rounded-lg border border-gray-300 px-3 py-2.5 text-gray-900"
            >
              <option value="INCOME">Income</option>
              <option value="EXPENSE">Expense</option>
            </select>
          </div>

          <div>
            <label className="mb-1.5 block text-sm font-medium text-gray-700">
              Amount (KES)
            </label>

            <input
              type="number"
              name="amount"
              min="0.01"
              step="0.01"
              placeholder="0.00"
              className="w-full rounded-lg border border-gray-300 px-3 py-2.5 text-gray-900"
              required
            />
          </div>

          <div>
            <label className="mb-1.5 block text-sm font-medium text-gray-700">
              Account
            </label>

            <select
              name="accountId"
              disabled={!selectedProfile}
              className="w-full rounded-lg border border-gray-300 px-3 py-2.5 text-gray-900 disabled:bg-gray-100"
              required
            >
              <option value="">Select account</option>

              {selectedProfile?.accounts.map((account) => (
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
              disabled={!selectedProfile}
              className="w-full rounded-lg border border-gray-300 px-3 py-2.5 text-gray-900 disabled:bg-gray-100"
            >
              <option value="">Select category</option>

              {filteredCategories.map((category) => (
                <option key={category.id} value={category.id}>
                  {category.name}
                </option>
              ))}
            </select>
          </div>

          <div>
            <label className="mb-1.5 block text-sm font-medium text-gray-700">
              Date
            </label>

            <input
              type="date"
              name="date"
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
              placeholder="What was this transaction for?"
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
              className="rounded-lg bg-gray-900 px-5 py-2.5 text-sm font-medium text-white disabled:cursor-not-allowed disabled:opacity-50"
               >
              {isPending ? "Saving..." : "Save Transaction"}
             </button>
          </div>
        </form>
      </div>
    </div>
  );
}