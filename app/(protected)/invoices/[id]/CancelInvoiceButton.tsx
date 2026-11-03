"use client";

import { useFormStatus } from "react-dom";

export default function CancelInvoiceButton() {
  const { pending } = useFormStatus();

  return (
    <button
      type="submit"
      disabled={pending}
      onClick={(event) => {
        if (
          !window.confirm(
            "Are you sure you want to cancel this invoice? This action cannot be undone."
          )
        ) {
          event.preventDefault();
        }
      }}
      className="rounded-lg border border-red-300 px-4 py-2 text-sm font-medium text-red-600 transition hover:bg-red-50 disabled:opacity-50 dark:border-red-900 dark:text-red-400 dark:hover:bg-red-950/30"
    >
      {pending ? "Cancelling..." : "Cancel Invoice"}
    </button>
  );
}