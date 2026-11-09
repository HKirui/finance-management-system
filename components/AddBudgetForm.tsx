"use client";

import { useActionState, useEffect, useState } from "react";
import { createBudget } from "@/app/actions/budgets";

type Category = {
  id: string;
  name: string;
};

type Profile = {
  id: string;
  name: string;
  categories: Category[];
};

type AddBudgetFormProps = {
  profiles: Profile[];
};

const label = "mb-1 block text-xs font-medium text-slate-600 dark:text-neutral-400";
const field =
  "min-h-9 w-full rounded-lg border border-slate-300 bg-white px-3 text-[13px] text-slate-900 placeholder:text-slate-400 focus:border-slate-900 focus:outline-none focus:ring-2 focus:ring-slate-900/10 disabled:cursor-not-allowed disabled:bg-slate-100 disabled:text-slate-400 dark:border-neutral-700 dark:bg-neutral-900 dark:text-neutral-100 dark:placeholder:text-neutral-500 dark:focus:border-neutral-400 dark:focus:ring-neutral-100/10 dark:disabled:bg-neutral-900/50 dark:disabled:text-neutral-600";

export default function AddBudgetForm({
  profiles,
}: AddBudgetFormProps) {
  const [isOpen, setIsOpen] = useState(false);
  const onlyProfile = profiles.length === 1 ? profiles[0] : undefined;
  const [profileId, setProfileId] = useState(onlyProfile?.id ?? "");

  const initialState = {
    success: false,
    message: "",
  };

  const [state, formAction, isPending] = useActionState(
    createBudget,
    initialState
  );

  useEffect(() => {
    if (state.success && !isPending) {
      setIsOpen(false);
      setProfileId(onlyProfile?.id ?? "");
    }
  }, [state, isPending]);

  const selectedProfile = profiles.find(
    (profile) => profile.id === profileId
  );

  if (!isOpen) {
    return (
      <button
        type="button"
        onClick={() => setIsOpen(true)}
        className="inline-flex min-h-10 items-center gap-2 rounded-lg bg-slate-900 px-4 text-[13px] font-medium text-white transition-colors hover:bg-slate-700 dark:bg-neutral-100 dark:text-neutral-900 dark:hover:bg-white"
      >
        <span aria-hidden className="text-base leading-none">+</span>
        Create budget
      </button>
    );
  }

  return (
    <div className="fixed inset-0 z-50 flex items-end justify-center bg-black/60 backdrop-blur-sm sm:items-center sm:p-5">
      <div
        role="dialog"
        aria-modal="true"
        aria-labelledby="create-budget-title"
        className="flex max-h-[92dvh] w-full max-w-md flex-col overflow-hidden rounded-t-2xl border border-slate-200 bg-white text-left shadow-2xl dark:border-neutral-800 dark:bg-neutral-950 sm:rounded-xl"
      >
        <div className="flex items-start justify-between gap-4 border-b border-slate-200 px-4 py-3 dark:border-neutral-800">
          <div>
            <h2
              id="create-budget-title"
              className="font-[family-name:var(--font-fraunces)] text-base tracking-tight text-slate-900 dark:text-neutral-100"
            >
              Create budget
            </h2>

            <p className="mt-0.5 text-xs text-slate-500 dark:text-neutral-400">
              Set a monthly spending limit.
            </p>
          </div>

          <button
            type="button"
            aria-label="Close"
            disabled={isPending}
            onClick={() => setIsOpen(false)}
            className="grid size-8 shrink-0 place-items-center rounded-lg text-xl leading-none text-slate-400 hover:bg-slate-100 hover:text-slate-700 dark:hover:bg-neutral-900 dark:hover:text-neutral-200"
          >
            ×
          </button>
        </div>

        <form action={formAction} className="flex min-h-0 flex-1 flex-col">
          <div className="grid min-h-0 grid-cols-1 gap-3 overflow-y-auto px-4 py-4 sm:grid-cols-2">
            {onlyProfile ? (
              <div className="sm:col-span-2">
                <input type="hidden" name="profileId" value={onlyProfile.id} />
                <span className={label}>Financial profile</span>
                <div className="flex min-h-9 items-center rounded-lg border border-slate-200 bg-slate-50 px-3 text-[13px] text-slate-700 dark:border-neutral-800 dark:bg-neutral-900/60 dark:text-neutral-300">
                  {onlyProfile.name}
                </div>
              </div>
            ) : (
            <div className="sm:col-span-2">
              <label htmlFor="bud-profile" className={label}>
                Financial profile
              </label>

              <select
                id="bud-profile"
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
            )}

            <div className="sm:col-span-2">
              <label htmlFor="bud-category" className={label}>
                Expense category
              </label>

              <select
                id="bud-category"
                name="categoryId"
                disabled={!selectedProfile}
                className={field}
                required
              >
                <option value="">Select category</option>

                {selectedProfile?.categories.map((category) => (
                  <option key={category.id} value={category.id}>
                    {category.name}
                  </option>
                ))}
              </select>
            </div>

            <div>
              <label htmlFor="bud-month" className={label}>
                Month
              </label>

              <select
                id="bud-month"
                name="month"
                className={field}
                required
              >
                <option value="">Month</option>
                <option value="1">January</option>
                <option value="2">February</option>
                <option value="3">March</option>
                <option value="4">April</option>
                <option value="5">May</option>
                <option value="6">June</option>
                <option value="7">July</option>
                <option value="8">August</option>
                <option value="9">September</option>
                <option value="10">October</option>
                <option value="11">November</option>
                <option value="12">December</option>
              </select>
            </div>

            <div>
              <label htmlFor="bud-year" className={label}>
                Year
              </label>

              <input
                id="bud-year"
                type="number"
                name="year"
                defaultValue={new Date().getFullYear()}
                min="2020"
                max="2100"
                className={`${field} tabular-nums`}
                required
              />
            </div>

            <div className="sm:col-span-2">
              <label htmlFor="bud-amount" className={label}>
                Budget amount
              </label>

              <div className="relative">
                <span className="pointer-events-none absolute inset-y-0 left-3 flex items-center text-xs text-slate-400 dark:text-neutral-500">
                  KES
                </span>
                <input
                  id="bud-amount"
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
              {isPending ? "Creating..." : "Create budget"}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}