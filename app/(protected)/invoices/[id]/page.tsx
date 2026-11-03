import { auth } from "@/auth";
import { redirect } from "next/navigation";
import Link from "next/link";
import { notFound } from "next/navigation";
import prisma from "@/lib/prisma";
import { Prisma } from "@/app/generated/prisma/client";
import { issueInvoice, cancelInvoice } from "../actions";
import PaymentForm from "./PaymentForm";
import { randomUUID } from "node:crypto";
import CancelInvoiceButton from "./CancelInvoiceButton";
import ReversePaymentForm from "./ReversePaymentsForm";

type InvoiceDetailsPageProps = {
  params: Promise<{ id: string }>;
};

export default async function InvoiceDetailsPage({
  params,
}: InvoiceDetailsPageProps) {

  const session= await auth();
  if (!session?.user?.email){
    redirect("/login");
  }

  const { id } = await params;

  // Retrieve the invoice and its related records
  const invoice = await prisma.invoice.findFirst({
    where: {
      id,
      profile: {
        type: "BUSINESS",
        user:{
          email:session.user.email,
        },
      },
    },
    include: {
      client: true,
      items: true,
      payments:{
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

  return (
    <main className="p-4 lg:p-6">
      {/* Page Heading */}
      <div className="mb-6">
        <Link
          href="/invoices"
          className="text-sm text-gray-500 hover:underline dark:text-neutral-400"
        >
          ← Back to Invoices
        </Link>

        <div className="mt-4 flex flex-wrap items-center justify-between gap-3">
          <div>
            <h1 className="text-2xl font-semibold text-gray-900 dark:text-white">
              {invoice.invoiceNumber}
            </h1>

            <p className="mt-1 text-sm text-gray-500 dark:text-neutral-400">
              Invoice for {invoice.client.name}
            </p>
          </div>

          <span className="rounded-lg bg-gray-100 px-3 py-1.5 text-xs font-semibold text-gray-700 dark:bg-neutral-800 dark:text-neutral-300">
            {invoice.status.replaceAll("_", " ")}
          </span>

          <a
             href={`/api/invoices/${invoice.id}/pdf`}
              download
              className="inline-flex items-center rounded-lg bg-blue-700 px-4 py-2 text-sm font-medium text-white transition hover:bg-blue-800"
               >
              Download PDF
          </a>

          {invoice.status === "DRAFT" && (
  <div className="flex flex-wrap items-center gap-2">
    <Link
      href={`/invoices/${invoice.id}/edit`}
      className="rounded-lg border border-gray-300 px-4 py-2 text-sm font-medium text-gray-900 transition hover:bg-gray-100 dark:border-neutral-700 dark:text-white dark:hover:bg-neutral-800"
    >
      Edit Invoice
    </Link>

    <form action={issueInvoice}>
      <input
        type="hidden"
        name="invoiceId"
        value={invoice.id}
      />

      <button
        type="submit"
        className="rounded-lg bg-gray-900 px-4 py-2 text-sm font-medium text-white transition hover:bg-gray-800 dark:bg-neutral-800 dark:hover:bg-neutral-700"
      >
        Issue Invoice
      </button>
    </form>
  </div>
)}

{/* Cancel Invoice Button */}
{(invoice.status === "DRAFT" ||
  invoice.status === "SENT") &&
  invoice.payments.length === 0 && (
    <form action={cancelInvoice}>
      <input
        type="hidden"
        name="invoiceId"
        value={invoice.id}
      />

      <CancelInvoiceButton />
    </form>
  )}
        </div>
      </div>

      {/* Invoice Information */}
      <section className="rounded-xl border border-gray-200 bg-white p-4 dark:border-neutral-800 dark:bg-[#090909]">
        <h2 className="mb-4 font-semibold text-gray-900 dark:text-white">
          Invoice Information
        </h2>

        <div className="grid gap-4 sm:grid-cols-2">
          <div>
            <p className="text-xs text-gray-500 dark:text-neutral-400">
              Client
            </p>
            <p className="mt-1 text-sm font-medium text-gray-900 dark:text-white">
              {invoice.client.name}
            </p>
          </div>

          <div>
            <p className="text-xs text-gray-500 dark:text-neutral-400">
              Company
            </p>
            <p className="mt-1 text-sm text-gray-900 dark:text-white">
              {invoice.client.company || "Individual Client"}
            </p>
          </div>

          <div>
            <p className="text-xs text-gray-500 dark:text-neutral-400">
              Issue Date
            </p>
            <p className="mt-1 text-sm text-gray-900 dark:text-white">
              {invoice.issueDate.toLocaleDateString("en-KE")}
            </p>
          </div>

          <div>
            <p className="text-xs text-gray-500 dark:text-neutral-400">
              Due Date
            </p>
            <p className="mt-1 text-sm text-gray-900 dark:text-white">
              {invoice.dueDate
                ? invoice.dueDate.toLocaleDateString("en-KE")
                : "Not specified"}
            </p>
          </div>
        </div>
      </section>

      {/* Billed Services */}
      <section className="mt-4 rounded-xl border border-gray-200 bg-white p-4 dark:border-neutral-800 dark:bg-[#090909]">
        <h2 className="mb-4 font-semibold text-gray-900 dark:text-white">
          Invoice Items
        </h2>

        <div className="overflow-x-auto">
          <table className="w-full text-left text-sm">
            <thead className="border-b border-gray-200 text-gray-500 dark:border-neutral-800 dark:text-neutral-400">
              <tr>
                <th className="px-3 py-3">Service / Product</th>
                <th className="px-3 py-3">Quantity</th>
                <th className="px-3 py-3">Unit Price</th>
                <th className="px-3 py-3">Total</th>
              </tr>
            </thead>

            <tbody className="divide-y divide-gray-200 dark:divide-neutral-800">
              {invoice.items.map((item) => (
                <tr key={item.id} className="text-gray-900 dark:text-white">
                  <td className="px-3 py-3">{item.description}</td>
                  <td className="px-3 py-3">{item.quantity.toString()}</td>
                  <td className="px-3 py-3">
                    {formatMoney(item.unitPrice)}
                  </td>
                  <td className="px-3 py-3">
                    {formatMoney(item.lineTotal)}
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>

        {/* Invoice Totals */}
        <div className="ml-auto mt-6 max-w-sm space-y-3 border-t border-gray-200 pt-4 dark:border-neutral-800">
          <div className="flex justify-between text-sm text-gray-700 dark:text-neutral-300">
            <span>Subtotal</span>
            <span>{formatMoney(invoice.subtotal)}</span>
          </div>

          <div className="flex justify-between text-sm text-gray-700 dark:text-neutral-300">
            <span>Tax</span>
            <span>{formatMoney(invoice.taxAmount)}</span>
          </div>

          <div className="flex justify-between font-semibold text-gray-900 dark:text-white">
            <span>Invoice Total</span>
            <span>{formatMoney(invoice.total)}</span>
          </div>

          <div className="flex justify-between text-sm text-green-700 dark:text-green-400">
            <span>Amount Paid</span>
            <span>{formatMoney(totalPaid)}</span>
          </div>

          <div className="flex justify-between border-t border-gray-200 pt-3 font-bold text-gray-900 dark:border-neutral-800 dark:text-white">
            <span>Balance Due</span>
            <span>{formatMoney(balanceDue)}</span>
          </div>
        </div>
      </section>
      {/* Record Invoice Payment */}
{(invoice.status === "SENT" ||
  invoice.status === "PARTIALLY_PAID") &&
  balanceDue.gt(0) && (
    <section className="mt-4 rounded-xl border border-gray-200 bg-white p-4 dark:border-neutral-800 dark:bg-[#090909]">
      <h2 className="mb-2 font-semibold text-gray-900 dark:text-white">
        Record Payment
      </h2>

      <p className="mb-5 text-sm text-gray-500 dark:text-neutral-400">
        Record a payment received from this client.
      </p>

      {receivingAccounts.length === 0 ? (
        <p className="text-sm text-red-600 dark:text-red-400">
          No active business receiving accounts found.
          Please create an account first.
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

  {/* Invoice Payment History */}
<section className="mt-4 rounded-xl border border-gray-200 bg-white p-4 dark:border-neutral-800 dark:bg-[#090909]">
  <div className="mb-4 flex items-center justify-between">
    <h2 className="font-semibold text-gray-900 dark:text-white">
      Payment History
    </h2>

    <span className="text-xs text-gray-500 dark:text-neutral-400">
      {invoice.payments.length} payment(s)
    </span>
  </div>

  {invoice.payments.length === 0 ? (
    <p className="text-sm text-gray-500 dark:text-neutral-400">
      No payments have been recorded for this invoice.
    </p>
  ) : (
    <>
      <div className="overflow-x-auto">
        <table className="w-full text-left text-sm">
          <thead className="border-b border-gray-200 bg-gray-50 text-xs uppercase text-gray-500 dark:border-neutral-800 dark:bg-[#111111] dark:text-neutral-400">
            <tr>
              <th className="px-4 py-3">Date</th>
              <th className="px-4 py-3">Account</th>
              <th className="px-4 py-3">Method</th>
              <th className="px-4 py-3">Reference</th>
              <th className="px-4 py-3 text-right">Amount</th>
            </tr>
          </thead>

          <tbody className="divide-y divide-gray-200 dark:divide-neutral-800">
            {invoice.payments.map((payment) => (
  <tr
    key={payment.id}
    className={`hover:bg-gray-50 dark:hover:bg-[#111111] ${
      payment.isReversed ? "opacity-60" : ""
    }`}
  >
    <td className="px-4 py-3 text-gray-700 dark:text-neutral-300">
      {payment.date.toLocaleDateString("en-KE")}
    </td>

    <td className="px-4 py-3 font-medium text-gray-900 dark:text-white">
      {payment.account.name}
    </td>

    <td className="px-4 py-3 text-gray-600 dark:text-neutral-300">
      {payment.method || "—"}
    </td>

    <td className="px-4 py-3 text-gray-600 dark:text-neutral-300">
      {payment.reference || "—"}

      {payment.isReversed && (
        <div className="mt-1">
          <span className="text-xs font-semibold text-amber-600 dark:text-amber-400">
            REVERSED
          </span>

          {payment.reversalReason && (
            <p className="mt-1 text-xs text-gray-500 dark:text-neutral-400">
              Reason: {payment.reversalReason}
            </p>
          )}

          {payment.reversedAt && (
            <p className="text-xs text-gray-500 dark:text-neutral-400">
              Reversed on:{" "}
              {payment.reversedAt.toLocaleDateString("en-KE")}
            </p>
          )}
        </div>
      )}
    </td>

            <td className="px-4 py-3 text-right">
              <div
                  className={`font-semibold ${
                       payment.isReversed
                    ? "text-gray-500 line-through dark:text-neutral-500"
                : "text-green-700 dark:text-green-400"
                  }`}
                    >
                {formatMoney(payment.amount)}
                 </div>

                 {!payment.isReversed &&
                 (invoice.status === "SENT" ||
                 invoice.status === "PARTIALLY_PAID" ||
                 invoice.status === "PAID") && (
               <div className="mt-3 text-left">
              <ReversePaymentForm paymentId={payment.id} />
         </div>
            )}
        </td>
               </tr>
              ))}
          </tbody>
        </table>
      </div>

      <div className="mt-4 flex justify-end border-t border-gray-200 pt-4 dark:border-neutral-800">
        <div className="text-right">
          <p className="text-xs text-gray-500 dark:text-neutral-400">
            Total Payments Received
          </p>

          <p className="mt-1 text-lg font-semibold text-green-700 dark:text-green-400">
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