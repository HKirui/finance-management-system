"use client";

import { useFormStatus } from "react-dom";
import { Loader2 } from "lucide-react";

export default function PaymentSubmitButton() {
  const { pending } = useFormStatus();

  return (
    <button
      type="submit"
      disabled={pending}
      className="flex items-center justify-center gap-2 rounded-lg bg-gray-900 px-5 py-2.5 text-sm font-medium text-white transition hover:bg-gray-800 disabled:cursor-not-allowed disabled:opacity-50 dark:bg-neutral-800 dark:hover:bg-neutral-700"
    >
      {pending ? (
        <>
          <Loader2 size={16} className="animate-spin" />
          Recording...
        </>
      ) : (
        "Record Payment"
      )}
    </button>
  );
}