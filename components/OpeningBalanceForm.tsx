
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
      <div className="mt-4">
        {state.success && (
          <p
            role="status"
            className="mb-2 text-sm text-green-700 dark:text-green-400"
          >
            {state.message}
          </p>
        )}

        <button
          type="button"
          onClick={() => setEditing(true)}
          className="text-sm font-medium text-gray-600 hover:text-gray-900"
        >
          Edit opening balance
        </button>
      </div>
    );
  }

  return (
    <form
      action={formAction}
      className="mt-4 border-t border-gray-100 pt-4"
    >
      <input type="hidden" name="accountId" value={accountId} />

      <label className="mb-1.5 block text-sm font-medium text-gray-700">
        Opening Balance (KES)
      </label>

      <input
        type="number"
        name="openingBalance"
        min="0"
        step="0.01"
        defaultValue={currentBalance}
        className="w-full rounded-lg border border-gray-300 px-3 py-2 text-gray-900"
        required
      />

      {!state.success && state.message && (
        <p
          role="alert"
          className="mt-2 text-sm text-red-600 dark:text-red-400"
        >
          {state.message}
        </p>
      )}

      <div className="mt-3 flex gap-2">
        <button
          type="submit"
          disabled={isPending}
          className="rounded-lg bg-gray-900 px-4 py-2 text-sm font-medium text-white disabled:opacity-50"
        >
          {isPending ? "Saving..." : "Save"}
        </button>

        <button
          type="button"
          disabled={isPending}
          onClick={() => setEditing(false)}
          className="rounded-lg border border-gray-300 px-4 py-2 text-sm font-medium text-gray-700 disabled:opacity-50"
        >
          Cancel
        </button>
      </div>
    </form>
  );
}
