"use client";

import { useActionState, useState } from "react";
import { useFormStatus } from "react-dom";

import {
  reverseInvoicePaymentWithState,
  type ReversalActionState,
} from "../actions";

const initialState: ReversalActionState = {
  error: null,
};

function ReverseSubmitButton() {
  const { pending } = useFormStatus();

  return (
    <button
      type="submit"
      disabled={pending}
      className="min-h-9 rounded-lg bg-rose-600 px-4 text-[13px] font-medium text-white transition-colors hover:bg-rose-700 disabled:opacity-50"
    >
      {pending ? "Reversing..." : "Reverse payment"}
    </button>
  );
}

type ReversePaymentFormProps = {
  paymentId: string;
};

export default function ReversePaymentForm({
  paymentId,
}: ReversePaymentFormProps) {
  const [open, setOpen] = useState(false);
  const [reason, setReason] = useState("");

  const [state, formAction] = useActionState(
    reverseInvoicePaymentWithState,
    initialState
  );

  if (!open) {
    return (
      <button
        type="button"
        onClick={() => setOpen(true)}
        className="rounded-md py-1 text-xs font-medium text-slate-500 underline-offset-2 transition-colors hover:text-rose-600 hover:underline dark:text-neutral-400 dark:hover:text-rose-400"
      >
        Reverse payment
      </button>
    );
  }

  return (
    <form
      action={formAction}
      onSubmit={(event) => {
        if (
          !window.confirm(
            "Are you sure you want to reverse this payment? This action will affect the invoice balance."
          )
        ) {
          event.preventDefault();
        }
      }}
      className="space-y-2.5 rounded-lg border border-rose-200 bg-rose-50/60 p-3 dark:border-rose-900/50 dark:bg-rose-950/20"
    >
      <input type="hidden" name="paymentId" value={paymentId} />

      <label
        htmlFor={`reason-${paymentId}`}
        className="block text-xs font-medium text-slate-600 dark:text-neutral-400"
      >
        Reason for reversal
      </label>

      <textarea
        id={`reason-${paymentId}`}
        name="reason"
        value={reason}
        onChange={(event) => setReason(event.target.value)}
        minLength={10}
        maxLength={500}
        rows={2}
        required
        placeholder="Explain why this payment is being reversed (at least 10 characters)"
        className="w-full rounded-lg border border-slate-300 bg-white p-3 text-[13px] text-slate-900 placeholder:text-slate-400 focus:border-slate-900 focus:outline-none focus:ring-2 focus:ring-slate-900/10 dark:border-neutral-700 dark:bg-neutral-900 dark:text-neutral-100 dark:placeholder:text-neutral-500"
      />

      {state.error && (
        <p role="alert" className="text-xs text-rose-600 dark:text-rose-400">
          {state.error}
        </p>
      )}

      <div className="flex items-center gap-2">
        <ReverseSubmitButton />

        <button
          type="button"
          onClick={() => setOpen(false)}
          className="min-h-9 rounded-lg border border-slate-300 bg-white px-4 text-[13px] font-medium text-slate-700 hover:bg-slate-50 dark:border-neutral-700 dark:bg-transparent dark:text-neutral-200 dark:hover:bg-neutral-900"
        >
          Cancel
        </button>
      </div>
    </form>
  );
}