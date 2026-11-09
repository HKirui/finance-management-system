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
      className="min-h-10 rounded-lg border border-slate-300 px-4 text-[13px] font-medium text-slate-600 transition-colors hover:border-rose-300 hover:bg-rose-50 hover:text-rose-600 disabled:opacity-50 dark:border-neutral-700 dark:text-neutral-300 dark:hover:border-rose-900 dark:hover:bg-rose-950/30 dark:hover:text-rose-400"
    >
      {pending ? "Cancelling..." : "Cancel invoice"}
    </button>
  );
}