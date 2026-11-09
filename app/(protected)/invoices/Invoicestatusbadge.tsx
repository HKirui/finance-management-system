const tones: Record<string, string> = {
  DRAFT: "border-slate-300 text-slate-600 dark:border-neutral-700 dark:text-neutral-300",
  SENT: "border-indigo-300 text-indigo-600 dark:border-indigo-400/50 dark:text-indigo-300",
  PARTIALLY_PAID: "border-amber-300 text-amber-700 dark:border-amber-400/40 dark:text-amber-300",
  PAID: "border-emerald-300 text-emerald-700 dark:border-emerald-400/40 dark:text-emerald-300",
  CANCELLED: "border-rose-300 text-rose-700 dark:border-rose-400/40 dark:text-rose-300",
};

export default function InvoiceStatusBadge({ status }: { status: string }) {
  return (
    <span
      className={`inline-block whitespace-nowrap rounded-full border px-2.5 py-0.5 text-[10px] font-bold uppercase tracking-wider ${
        tones[status] ?? tones.DRAFT
      }`}
    >
      {status.replaceAll("_", " ")}
    </span>
  );
}