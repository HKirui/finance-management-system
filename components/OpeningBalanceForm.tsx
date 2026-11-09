"use client";

import { useActionState, useEffect, useState } from "react";
import { updateOpeningBalance } from "@/app/actions/accounts";

type OpeningBalanceFormProps = {
  accountId: string;
  currentBalance: number;
};

const initialState = {
  success: false,
  message: "",
};

/*
  Designed to sit inside a `flex flex-wrap` row on the account card:
  collapsed  -> a small "Edit" button pushed to the right of the row
  editing    -> a full-width form that drops onto its own line
*/
export default function OpeningBalanceForm({
  accountId,
  currentBalance,
}: OpeningBalanceFormProps) {
  const [editing, setEditing] = useState(false);

  const [state, formAction, isPending] = useActionState(
    updateOpeningBalance,
    initialState
  );

  useEffect(() => {
    if (state.success) {
      setEditing(false);
    }
  }, [state.success]);

  if (!editing) {
    return (
      <>
        <button
          type="button"
          onClick={() => setEditing(true)}
          className="ml-auto rounded-md px-2 py-1 text-[11px] font-medium text-slate-500 transition-colors hover:bg-slate-100 hover:text-slate-900 dark:text-neutral-400 dark:hover:bg-neutral-800 dark:hover:text-white"
        >
          Edit
        </button>

        {state.success && (
          <p
            role="status"
            className="basis-full pt-1 text-[11px] text-emerald-700 dark:text-emerald-400"
          >
            {state.message}
          </p>
        )}
      </>
    );
  }

  return (
    <form action={formAction} className="mt-2.5 w-full basis-full">
      <input type="hidden" name="accountId" value={accountId} />

      <label
        htmlFor={`opening-${accountId}`}
        className="mb-1 block text-xs font-medium text-slate-600 dark:text-neutral-400"
      >
        New opening balance
      </label>

      <div className="relative">
        <span className="pointer-events-none absolute inset-y-0 left-3 flex items-center text-xs text-slate-400 dark:text-neutral-500">
          KES
        </span>
        <input
          id={`opening-${accountId}`}
          type="number"
          name="openingBalance"
          min="0"
          step="0.01"
          defaultValue={currentBalance}
          className="min-h-9 w-full rounded-lg border border-slate-300 bg-white pl-11 pr-3 text-[13px] tabular-nums text-slate-900 focus:border-slate-900 focus:outline-none focus:ring-2 focus:ring-slate-900/10 dark:border-neutral-700 dark:bg-neutral-900 dark:text-neutral-100 dark:focus:border-neutral-400 dark:focus:ring-neutral-100/10"
          required
        />
      </div>

      {!state.success && state.message && (
        <p role="alert" className="mt-2 text-xs text-rose-600 dark:text-rose-400">
          {state.message}
        </p>
      )}

      <div className="mt-2.5 flex gap-2">
        <button
          type="submit"
          disabled={isPending}
          className="min-h-8 rounded-lg bg-slate-900 px-4 text-xs font-medium text-white hover:bg-slate-700 disabled:opacity-50 dark:bg-neutral-100 dark:text-neutral-900 dark:hover:bg-white"
        >
          {isPending ? "Saving..." : "Save"}
        </button>

        <button
          type="button"
          disabled={isPending}
          onClick={() => setEditing(false)}
          className="min-h-8 rounded-lg border border-slate-300 px-4 text-xs font-medium text-slate-700 hover:bg-slate-50 disabled:opacity-50 dark:border-neutral-700 dark:text-neutral-200 dark:hover:bg-neutral-900"
        >
          Cancel
        </button>
      </div>
    </form>
  );
}