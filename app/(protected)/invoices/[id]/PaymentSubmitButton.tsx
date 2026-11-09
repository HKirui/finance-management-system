"use client";

import { useFormStatus } from "react-dom";
import { Loader2 } from "lucide-react";

export default function PaymentSubmitButton() {
  const { pending } = useFormStatus();

  return (
    <button
      type="submit"
      disabled={pending}
      className="flex min-h-10 items-center justify-center gap-2 rounded-lg bg-slate-900 px-5 text-[13px] font-medium text-white transition-colors hover:bg-slate-700 disabled:cursor-not-allowed disabled:opacity-50 dark:bg-neutral-100 dark:text-neutral-900 dark:hover:bg-white"
    >
      {pending ? (
        <>
          <Loader2 size={15} className="animate-spin" />
          Recording...
        </>
      ) : (
        "Record payment"
      )}
    </button>
  );
}