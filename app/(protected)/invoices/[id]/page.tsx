import { auth } from "@/auth";
import { redirect } from "next/navigation";
import Link from "next/link";
import { notFound } from "next/navigation";
import { ArrowLeft, Download, Pencil } from "lucide-react";
import { Fraunces, Hanken_Grotesk } from "next/font/google";
import prisma from "@/lib/prisma";
import { Prisma } from "@/app/generated/prisma/client";
import { issueInvoice, cancelInvoice } from "../actions";
import PaymentForm from "./PaymentForm";
import { randomUUID } from "node:crypto";
import CancelInvoiceButton from "./CancelInvoiceButton";
import ReversePaymentForm from "./ReversePaymentsForm";
import InvoiceStatusBadge from "../Invoicestatusbadge";

const fraunces = Fraunces({ subsets: ["latin"], variable: "--font-fraunces" });
const hanken = Hanken_Grotesk({ subsets: ["latin"], variable: "--font-hanken" });

const display = "font-[family-name:var(--font-fraunces)]";
const muted = "text-slate-500 dark:text-neutral-400";
const card =
  "rounded-xl border border-slate-200 bg-white dark:border-neutral-800 dark:bg-neutral-950";
const btnGhost =
  "inline-flex min-h-10 items-center gap-2 rounded-lg border border-slate-300 px-4 text-[13px] font-medium text-slate-700 transition-colors hover:bg-slate-50 dark:border-neutral-700 dark:text-neutral-200 dark:hover:bg-neutral-900";

type InvoiceDetailsPageProps = {
  params: Promise<{ id: string }>;
};

export default async function InvoiceDetailsPage({
  params,
}: InvoiceDetailsPageProps) {
  const session = await auth();
  if (!session?.user?.email) {
    redirect("/login");
  }

  const { id } = await params;

  // Retrieve the invoice and its related records
  const invoice = await prisma.invoice.findFirst({
    where: {
      id,
      profile: {
        type: "BUSINESS",
        user: {
          email: session.user.email,
        },
      },
    },
    include: {
      client: true,
      items: true,
      payments: {
        include: {
          account: true,
        },
        orderBy: {
          date: "desc",
        },
      },
    },
  });

  if (!invoice) {
    notFound();
  }

  // Calculate payments and outstanding balance
  const totalPaid = invoice.payments
    .filter((payment) => !payment.isReversed)
    .reduce(
      (sum, payment) => sum.plus(payment.amount),
      new Prisma.Decimal(0)
    );

  const balanceDue = invoice.total.minus(totalPaid);

  //Generate a unique identifier for this payment form
  const paymentRequestId = randomUUID();

  //Get active business accounts that can recieve payments
  const receivingAccounts = await prisma.account.findMany({
    where: {
      profileId: invoice.profileId,
      isActive: true,
      type: {
        in: ["CASH", "MPESA", "BANK"],
      },
    },
    orderBy: {
      name: "asc",
    },
  });

  function formatMoney(amount: Prisma.Decimal) {
    return `KES ${Number(amount.toFixed(2)).toLocaleString("en-KE", {
      minimumFractionDigits: 2,
      maximumFractionDigits: 2,
    })}`;
  }

  const info = [
    { label: "Client", value: invoice.client.name },
    { label: "Company", value: invoice.client.company || "Individual client" },
    { label: "Issue date", value: invoice.issueDate.toLocaleDateString("en-KE") },
    {
      label: "Due date",
      value: invoice.dueDate
        ? invoice.dueDate.toLocaleDateString("en-KE")
        : "Not specified",
    },
  ];

  const canCancel =
    (invoice.status === "DRAFT" || invoice.status === "SENT") &&
    invoice.payments.length === 0;

  return (
    <main
      className={`${fraunces.variable} ${hanken.variable} mx-auto w-full max-w-4xl space-y-4 px-4 py-5 font-[family-name:var(--font-hanken)] text-slate-900 dark:text-neutral-100 sm:px-6`}
    >
      {/* Page heading */}
      <header>
        <Link
          href="/invoices"
          className="inline-flex items-center gap-1.5 text-xs text-slate-500 transition-colors hover:text-slate-900 dark:text-neutral-400 dark:hover:text-neutral-100"
        >
          <ArrowLeft size={14} />
          Back to invoices
        </Link>

        <div className="mt-4 flex flex-wrap items-start justify-between gap-4">
          <div>
            <div className="flex flex-wrap items-center gap-3">
              <h1 className={`${display} text-2xl font-normal tracking-tight sm:text-3xl`}>
                {invoice.invoiceNumber}
              </h1>
              <InvoiceStatusBadge status={invoice.status} />
            </div>

            <p className={`mt-1 text-xs ${muted}`}>
              Invoice for {invoice.client.name}
            </p>
          </div>

          <div className="flex flex-wrap items-center gap-2">
            <a href={`/api/invoices/${invoice.id}/pdf`} download className={btnGhost}>
              <Download size={14} strokeWidth={1.8} />
              Download PDF
            </a>

            {invoice.status === "DRAFT" && (
              <>
                <Link href={`/invoices/${invoice.id}/edit`} className={btnGhost}>
                  <Pencil size={14} strokeWidth={1.8} />
                  Edit invoice
                </Link>

                <form action={issueInvoice}>
                  <input type="hidden" name="invoiceId" value={invoice.id} />

                  <button
                    type="submit"
                    className="min-h-10 rounded-lg bg-slate-900 px-4 text-[13px] font-medium text-white transition-colors hover:bg-slate-700 dark:bg-neutral-100 dark:text-neutral-900 dark:hover:bg-white"
                  >
                    Issue invoice
                  </button>
                </form>
              </>
            )}

            {/* Cancel Invoice Button */}
            {canCancel && (
              <form action={cancelInvoice}>
                <input type="hidden" name="invoiceId" value={invoice.id} />

                <CancelInvoiceButton />
              </form>
            )}
          </div>
        </div>
      </header>

      {/* Invoice information */}
      <section className={`${card} p-4 sm:p-5`}>
        <dl className="grid grid-cols-2 gap-x-6 gap-y-4 sm:grid-cols-4">
          {info.map((item) => (
            <div key={item.label} className="min-w-0">
              <dt className={`text-[11px] font-medium uppercase tracking-wider ${muted}`}>
                {item.label}
              </dt>
              <dd className="mt-1 truncate text-[13px] font-medium">{item.value}</dd>
            </div>
          ))}
        </dl>
      </section>

      {/* Billed services */}
      <section className={`${card} overflow-hidden`}>
        <div className="border-b border-slate-200 px-4 py-3.5 dark:border-neutral-800 sm:px-5">
          <h2 className={`${display} text-base`}>Invoice items</h2>
        </div>

        <div className="overflow-x-auto">
          <table className="w-full min-w-[560px] text-left">
            <thead>
              <tr className={`border-b border-slate-100 text-[11px] uppercase tracking-wider dark:border-neutral-800 ${muted}`}>
                <th className="px-4 py-3 font-medium sm:px-5">Service / product</th>
                <th className="px-4 py-3 text-right font-medium">Qty</th>
                <th className="px-4 py-3 text-right font-medium">Unit price</th>
                <th className="px-4 py-3 text-right font-medium sm:px-5">Total</th>
              </tr>
            </thead>

            <tbody className="divide-y divide-slate-100 dark:divide-neutral-800/80">
              {invoice.items.map((item) => (
                <tr key={item.id} className="text-[13px]">
                  <td className="px-4 py-3 sm:px-5">{item.description}</td>
                  <td className="px-4 py-3 text-right tabular-nums">{item.quantity.toString()}</td>
                  <td className="whitespace-nowrap px-4 py-3 text-right tabular-nums">
                    {formatMoney(item.unitPrice)}
                  </td>
                  <td className="whitespace-nowrap px-4 py-3 text-right font-medium tabular-nums sm:px-5">
                    {formatMoney(item.lineTotal)}
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>

        {/* Invoice totals */}
        <div className="border-t border-slate-200 bg-slate-50/60 px-4 py-4 dark:border-neutral-800 dark:bg-neutral-900/40 sm:px-5">
          <div className="ml-auto max-w-xs space-y-2 text-[13px]">
            <div className="flex justify-between">
              <span className={muted}>Subtotal</span>
              <span className="tabular-nums">{formatMoney(invoice.subtotal)}</span>
            </div>

            <div className="flex justify-between">
              <span className={muted}>Tax</span>
              <span className="tabular-nums">{formatMoney(invoice.taxAmount)}</span>
            </div>

            <div className="flex justify-between font-semibold">
              <span>Invoice total</span>
              <span className="tabular-nums">{formatMoney(invoice.total)}</span>
            </div>

            <div className="flex justify-between text-emerald-700 dark:text-emerald-400">
              <span>Amount paid</span>
              <span className="tabular-nums">{formatMoney(totalPaid)}</span>
            </div>

            <div className="flex items-baseline justify-between border-t border-slate-200 pt-3 dark:border-neutral-800">
              <span className="font-semibold">Balance due</span>
              <span className={`${display} text-lg tabular-nums`}>
                {formatMoney(balanceDue)}
              </span>
            </div>
          </div>
        </div>
      </section>

      {/* Record invoice payment */}
      {(invoice.status === "SENT" || invoice.status === "PARTIALLY_PAID") &&
        balanceDue.gt(0) && (
          <section className={`${card} p-4 sm:p-5`}>
            <h2 className={`${display} text-base`}>Record payment</h2>

            <p className={`mb-4 mt-1 text-xs ${muted}`}>
              Record a payment received from this client.
            </p>

            {receivingAccounts.length === 0 ? (
              <p className="text-[13px] text-rose-600 dark:text-rose-400">
                No active business receiving accounts found. Please create an
                account first.
              </p>
            ) : (
              <PaymentForm
                invoiceId={invoice.id}
                idempotencyKey={paymentRequestId}
                balanceDue={balanceDue.toFixed(2)}
                accounts={receivingAccounts.map((account) => ({
                  id: account.id,
                  name: account.name,
                  type: account.type,
                }))}
              />
            )}
          </section>
        )}

      {/* Invoice payment history */}
      <section className={`${card} overflow-hidden`}>
        <div className="flex items-center justify-between gap-3 border-b border-slate-200 px-4 py-3.5 dark:border-neutral-800 sm:px-5">
          <h2 className={`${display} text-base`}>Payment history</h2>
          <span className={`text-xs ${muted}`}>
            {invoice.payments.length}{" "}
            {invoice.payments.length === 1 ? "payment" : "payments"}
          </span>
        </div>

        {invoice.payments.length === 0 ? (
          <p className={`px-6 py-12 text-center text-xs ${muted}`}>
            No payments have been recorded for this invoice.
          </p>
        ) : (
          <>
            <ul className="divide-y divide-slate-100 px-4 dark:divide-neutral-800/80 sm:px-5">
              {invoice.payments.map((payment) => (
                <li
                  key={payment.id}
                  className={`py-3.5 ${payment.isReversed ? "opacity-70" : ""}`}
                >
                  <div className="flex flex-wrap items-start justify-between gap-3">
                    <div className="min-w-0">
                      <p className="text-[13px] font-medium">
                        {payment.account.name}
                        <span className={`font-normal ${muted}`}>
                          {" "}
                          · {payment.method || "—"}
                        </span>
                      </p>

                      <p className={`mt-0.5 text-xs ${muted}`}>
                        {payment.date.toLocaleDateString("en-KE")} · Ref:{" "}
                        {payment.reference || "—"}
                      </p>

                      {payment.isReversed && (
                        <div className="mt-2 space-y-0.5 text-xs">
                          <span className="inline-block rounded-full border border-amber-300 px-2 py-0.5 text-[10px] font-bold uppercase tracking-wider text-amber-700 dark:border-amber-400/40 dark:text-amber-300">
                            Reversed
                          </span>

                          {payment.reversalReason && (
                            <p className={muted}>Reason: {payment.reversalReason}</p>
                          )}

                          {payment.reversedAt && (
                            <p className={muted}>
                              Reversed on:{" "}
                              {payment.reversedAt.toLocaleDateString("en-KE")}
                            </p>
                          )}
                        </div>
                      )}
                    </div>

                    <p
                      className={`whitespace-nowrap text-[13px] font-semibold tabular-nums ${
                        payment.isReversed
                          ? "text-slate-400 line-through dark:text-neutral-500"
                          : "text-emerald-700 dark:text-emerald-400"
                      }`}
                    >
                      {formatMoney(payment.amount)}
                    </p>
                  </div>

                  {!payment.isReversed &&
                    (invoice.status === "SENT" ||
                      invoice.status === "PARTIALLY_PAID" ||
                      invoice.status === "PAID") && (
                      <div className="mt-2">
                        <ReversePaymentForm paymentId={payment.id} />
                      </div>
                    )}
                </li>
              ))}
            </ul>

            <div className="flex justify-end border-t border-slate-200 px-4 py-3.5 dark:border-neutral-800 sm:px-5">
              <div className="text-right">
                <p className={`text-[11px] ${muted}`}>Total payments received</p>
                <p className={`${display} mt-0.5 text-lg tabular-nums text-emerald-700 dark:text-emerald-400`}>
                  {formatMoney(totalPaid)}
                </p>
              </div>
            </div>
          </>
        )}
      </section>
    </main>
  );
}