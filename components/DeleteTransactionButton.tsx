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
        className="rounded-lg p-2 text-gray-500 hover:bg-red-50 hover:text-red-600"
        title="Delete transaction"
      >
        <Trash2 size={16} />
      </button>

      {isOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/40 p-4">
          <div className="w-full max-w-md rounded-xl bg-white p-6 shadow-xl">
            <h2 className="text-xl font-bold text-gray-900">
              Delete Transaction?
            </h2>

            <p className="mt-2 text-sm text-gray-600">
              This transaction will be permanently deleted.
            </p>

            {description && (
              <div className="mt-4 rounded-lg bg-gray-50 p-4">
                <p className="text-sm font-medium text-gray-900">
                  {description}
                </p>
              </div>
            )}

            <p className="mt-4 text-sm font-medium text-red-600">
              Account balances and budget calculations will be updated.
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
                {isPending ? "Deleting..." : "Delete Transaction"}
              </button>
            </div>
          </div>
        </div>
      )}
    </>
  );
}