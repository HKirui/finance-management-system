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

const label = "mb-1 block text-xs font-medium text-slate-600 dark:text-neutral-400";
const field =
  "min-h-9 w-full rounded-lg border border-slate-300 bg-white px-3 text-[13px] text-slate-900 placeholder:text-slate-400 focus:border-slate-900 focus:outline-none focus:ring-2 focus:ring-slate-900/10 disabled:cursor-not-allowed disabled:bg-slate-100 disabled:text-slate-400 dark:border-neutral-700 dark:bg-neutral-900 dark:text-neutral-100 dark:placeholder:text-neutral-500 dark:focus:border-neutral-400 dark:focus:ring-neutral-100/10 dark:disabled:bg-neutral-900/50 dark:disabled:text-neutral-600";

export default function TransactionForm({ profiles }: TransactionFormProps) {
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
        className="inline-flex min-h-10 items-center gap-2 rounded-lg bg-slate-900 px-4 text-[13px] font-medium text-white transition-colors hover:bg-slate-700 dark:bg-neutral-100 dark:text-neutral-900 dark:hover:bg-white"
      >
        <span aria-hidden className="text-base leading-none">+</span>
        Add transaction
      </button>
    );
  }

  return (
    <div className="fixed inset-0 z-50 flex items-end justify-center bg-black/60 backdrop-blur-sm sm:items-center sm:p-5">
      <div
        role="dialog"
        aria-modal="true"
        aria-labelledby="add-transaction-title"
        className="flex max-h-[92dvh] w-full max-w-md flex-col overflow-hidden rounded-t-2xl border border-slate-200 bg-white shadow-2xl dark:border-neutral-800 dark:bg-neutral-950 sm:rounded-xl"
      >
        <div className="flex items-start justify-between gap-4 border-b border-slate-200 px-4 py-3 dark:border-neutral-800">
          <div>
            <h2
              id="add-transaction-title"
              className="font-[family-name:var(--font-fraunces)] text-base tracking-tight text-slate-900 dark:text-neutral-100"
            >
              Add transaction
            </h2>
            <p className="mt-0.5 text-xs text-slate-500 dark:text-neutral-400">
              Record personal or K-Link income and expenses.
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

        <form action={formAction} className="flex min-h-0 flex-1 flex-col">
          <div className="grid min-h-0 grid-cols-1 gap-3 overflow-y-auto px-4 py-4 sm:grid-cols-2">
            <div className="sm:col-span-2">
              <label htmlFor="tx-profile" className={label}>
                Financial profile
              </label>

              <select
                id="tx-profile"
                name="profileId"
                value={profileId}
                onChange={(event) => setProfileId(event.target.value)}
                className={field}
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

            <div className="sm:col-span-2">
              <span className={label}>Transaction type</span>
              <input type="hidden" name="type" value={transactionType} />
              <div
                role="radiogroup"
                aria-label="Transaction type"
                className="grid grid-cols-2 gap-1 rounded-lg bg-slate-100 p-1 dark:bg-neutral-900"
              >
                {(["EXPENSE", "INCOME"] as const).map((t) => (
                  <button
                    key={t}
                    type="button"
                    role="radio"
                    aria-checked={transactionType === t}
                    onClick={() => setTransactionType(t)}
                    className={`min-h-8 rounded-md text-[13px] font-medium transition-colors ${
                      transactionType === t
                        ? t === "INCOME"
                          ? "bg-emerald-400 text-neutral-950"
                          : "bg-rose-400 text-neutral-950"
                        : "text-slate-600 hover:text-slate-900 dark:text-neutral-400 dark:hover:text-neutral-100"
                    }`}
                  >
                    {t === "INCOME" ? "Income" : "Expense"}
                  </button>
                ))}
              </div>
            </div>

            <div>
              <label htmlFor="tx-amount" className={label}>
                Amount
              </label>

              <div className="relative">
                <span className="pointer-events-none absolute inset-y-0 left-3 flex items-center text-xs text-slate-400 dark:text-neutral-500">
                  KES
                </span>
                <input
                  id="tx-amount"
                  type="number"
                  name="amount"
                  min="0.01"
                  step="0.01"
                  placeholder="0.00"
                  className={`${field} pl-11 tabular-nums`}
                  required
                />
              </div>
            </div>

            <div>
              <label htmlFor="tx-date" className={label}>
                Date
              </label>

              <input
                id="tx-date"
                type="date"
                name="date"
                className={`${field} dark:[color-scheme:dark]`}
                required
              />
            </div>

            <div>
              <label htmlFor="tx-account" className={label}>
                Account
              </label>

              <select
                id="tx-account"
                name="accountId"
                disabled={!selectedProfile}
                className={field}
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
              <label htmlFor="tx-category" className={label}>
                Category
              </label>

              <select
                id="tx-category"
                name="categoryId"
                disabled={!selectedProfile}
                className={field}
              >
                <option value="">Select category</option>

                {filteredCategories.map((category) => (
                  <option key={category.id} value={category.id}>
                    {category.name}
                  </option>
                ))}
              </select>
            </div>

            <div className="sm:col-span-2">
              <label htmlFor="tx-description" className={label}>
                Description
              </label>

              <input
                id="tx-description"
                type="text"
                name="description"
                placeholder="What was this transaction for?"
                className={field}
              />
            </div>

            {state.message && !state.success && (
              <div
                role="alert"
                className="rounded-lg border border-rose-200 bg-rose-50 px-3 py-2.5 text-[13px] text-rose-700 dark:border-rose-900/60 dark:bg-rose-950/40 dark:text-rose-300 sm:col-span-2"
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
              {isPending ? "Saving..." : "Save transaction"}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}