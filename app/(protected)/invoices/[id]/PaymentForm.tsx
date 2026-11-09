"use client";

import { useActionState } from "react";
import { recordInvoicePaymentWithState, type PaymentActionState } from "../actions";
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

const label = "mb-1 block text-xs font-medium text-slate-600 dark:text-neutral-400";
const field =
  "min-h-9 w-full rounded-lg border border-slate-300 bg-white px-3 text-[13px] text-slate-900 placeholder:text-slate-400 focus:border-slate-900 focus:outline-none focus:ring-2 focus:ring-slate-900/10 dark:border-neutral-700 dark:bg-neutral-900 dark:text-neutral-100 dark:placeholder:text-neutral-500 dark:focus:border-neutral-400 dark:focus:ring-neutral-100/10";

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
    <form action={formAction} className="space-y-4">
      <input type="hidden" name="invoiceId" value={invoiceId} />
      <input type="hidden" name="idempotencyKey" value={idempotencyKey} />

      {state.error && (
        <div
          role="alert"
          className="rounded-lg border border-rose-200 bg-rose-50 px-3 py-2.5 text-[13px] text-rose-700 dark:border-rose-900/60 dark:bg-rose-950/40 dark:text-rose-300"
        >
          {state.error}
        </div>
      )}

      <div className="grid gap-3 md:grid-cols-2">
        <div>
          <label htmlFor="accountId" className={label}>
            Receiving account *
          </label>

          <select
            id="accountId"
            name="accountId"
            required
            defaultValue=""
            className={field}
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
          <label htmlFor="amount" className={label}>
            Payment amount *
          </label>

          <div className="relative">
            <span className="pointer-events-none absolute inset-y-0 left-3 flex items-center text-xs text-slate-400 dark:text-neutral-500">
              KES
            </span>
            <input
              id="amount"
              name="amount"
              type="number"
              min="0.01"
              step="0.01"
              max={balanceDue}
              required
              placeholder="0.00"
              className={`${field} pl-11 tabular-nums`}
            />
          </div>
        </div>

        <div>
          <label htmlFor="reference" className={label}>
            Payment reference
          </label>

          <input
            id="reference"
            name="reference"
            type="text"
            placeholder="M-Pesa code / Bank reference"
            className={field}
          />
        </div>

        <div>
          <label htmlFor="notes" className={label}>
            Payment notes
          </label>

          <input
            id="notes"
            name="notes"
            type="text"
            placeholder="Optional notes"
            className={field}
          />
        </div>
      </div>

      <div className="flex flex-wrap items-center justify-between gap-4 border-t border-slate-200 pt-4 dark:border-neutral-800">
        <div>
          <p className="text-[11px] text-slate-500 dark:text-neutral-400">
            Outstanding balance
          </p>
          <p className="font-[family-name:var(--font-fraunces)] text-lg tabular-nums">
            KES{" "}
            {Number(balanceDue).toLocaleString("en-KE", {
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