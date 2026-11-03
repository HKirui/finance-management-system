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
      className="rounded-lg bg-red-600 px-4 py-2 text-sm font-semibold text-white hover:bg-red-700 disabled:opacity-50"
    >
      {pending ? "Reversing..." : "Reverse Payment"}
    </button>
  );
}

type ReversePaymentFormProps = {
  paymentId: string;
};

export default function ReversePaymentForm({
  paymentId,
}: ReversePaymentFormProps) {
  const [reason, setReason] = useState("");

  const [state, formAction] = useActionState(
    reverseInvoicePaymentWithState,
    initialState
  );

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
      className="space-y-3"
    >
      <input type="hidden" name="paymentId" value={paymentId} />

      <textarea
        name="reason"
        value={reason}
        onChange={(event) => setReason(event.target.value)}
        minLength={10}
        maxLength={500}
        required
        placeholder="Explain why this payment is being reversed..."
        className="w-full rounded-lg border border-gray-300 p-3 text-sm text-gray-900 dark:border-neutral-700 dark:bg-neutral-900 dark:text-white"
      />

      {state.error && (
        <p role="alert" className="text-sm text-red-600 dark:text-red-400">
          {state.error}
        </p>
      )}

      <ReverseSubmitButton />
    </form>
  );
}