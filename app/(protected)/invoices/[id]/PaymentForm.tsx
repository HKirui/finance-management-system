"use client";

import { useActionState } from "react";
import { recordInvoicePaymentWithState, type PaymentActionState,} from "../actions";
import PaymentSubmitButton from "./PaymentSubmitButton";

type PaymentFormProps = {
  invoiceId: string;
  idempotencyKey: string;
  balanceDue: string;
  accounts: {
    id: string;
    name: string;
    type: string;
  }[];
};

const initialState: PaymentActionState = {
  error: null,
};

export default function PaymentForm({
  invoiceId,
  idempotencyKey,
  balanceDue,
  accounts,
}: PaymentFormProps) {
  const [state, formAction] = useActionState(
    recordInvoicePaymentWithState,
    initialState
  );

  return (
    <form action={formAction} className="space-y-5">
      <input type="hidden" name="invoiceId" value={invoiceId} />
      <input
        type="hidden"
        name="idempotencyKey"
        value={idempotencyKey}
      />

      {state.error && (
        <div
          role="alert"
          className="rounded-lg border border-red-300 bg-red-50 p-4 text-sm text-red-700 dark:border-red-900 dark:bg-red-950/30 dark:text-red-400"
        >
          {state.error}
        </div>
      )}

      <div className="grid gap-4 md:grid-cols-2">
        <div>
          <label
            htmlFor="accountId"
            className="mb-2 block text-sm font-medium dark:text-neutral-300"
          >
            Receiving Account *
          </label>

          <select
            id="accountId"
            name="accountId"
            required
            defaultValue=""
            className="w-full rounded-lg border border-gray-300 bg-white px-4 py-2.5 text-sm dark:border-neutral-700 dark:bg-[#111111] dark:text-white"
          >
            <option value="" disabled>
              Select receiving account
            </option>

            {accounts.map((account) => (
              <option key={account.id} value={account.id}>
                {account.name} ({account.type})
              </option>
            ))}
          </select>
        </div>

        <div>
          <label
            htmlFor="amount"
            className="mb-2 block text-sm font-medium dark:text-neutral-300"
          >
            Payment Amount (KES) *
          </label>

          <input
            id="amount"
            name="amount"
            type="number"
            min="0.01"
            step="0.01"
            max={balanceDue}
            required
            placeholder="Enter payment amount"
            className="w-full rounded-lg border border-gray-300 bg-white px-4 py-2.5 text-sm dark:border-neutral-700 dark:bg-[#111111] dark:text-white"
          />
        </div>

        <div>
          <label
            htmlFor="reference"
            className="mb-2 block text-sm font-medium dark:text-neutral-300"
          >
            Payment Reference
          </label>

          <input
            id="reference"
            name="reference"
            type="text"
            placeholder="M-Pesa code / Bank reference"
            className="w-full rounded-lg border border-gray-300 bg-white px-4 py-2.5 text-sm dark:border-neutral-700 dark:bg-[#111111] dark:text-white"
          />
        </div>

        <div>
          <label
            htmlFor="notes"
            className="mb-2 block text-sm font-medium dark:text-neutral-300"
          >
            Payment Notes
          </label>

          <input
            id="notes"
            name="notes"
            type="text"
            placeholder="Optional notes"
            className="w-full rounded-lg border border-gray-300 bg-white px-4 py-2.5 text-sm dark:border-neutral-700 dark:bg-[#111111] dark:text-white"
          />
        </div>
      </div>

      <div className="flex items-center justify-between gap-4">
        <div>
          <p className="text-xs text-gray-500 dark:text-neutral-400">
            Outstanding Balance
          </p>
          <p className="text-lg font-semibold dark:text-white">
            KES {Number(balanceDue).toLocaleString("en-KE", {
              minimumFractionDigits: 2,
              maximumFractionDigits: 2,
            })}
          </p>
        </div>

        <PaymentSubmitButton />
      </div>
    </form>
  );
}