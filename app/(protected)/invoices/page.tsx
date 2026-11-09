import prisma from "@/lib/prisma";
import Link from "next/link";
import { auth } from "@/auth";
import { redirect } from "next/navigation";
import { Plus } from "lucide-react";
import { Fraunces, Hanken_Grotesk } from "next/font/google";
import InvoiceStatusBadge from "./Invoicestatusbadge";

const fraunces = Fraunces({ subsets: ["latin"], variable: "--font-fraunces" });
const hanken = Hanken_Grotesk({ subsets: ["latin"], variable: "--font-hanken" });

const display = "font-[family-name:var(--font-fraunces)]";
const muted = "text-slate-500 dark:text-neutral-400";

export default async function InvoicesPage() {
  const session = await auth();
  if (!session?.user?.email) {
    redirect("/login");
  }

  const invoices = await prisma.invoice.findMany({
    where: {
      profile: {
        type: "BUSINESS",
        user: {
          email: session.user.email,
        },
      },
    },
    include: {
      client: true,
      payments: {
        where: {
          isReversed: false,
        },
        select: {
          amount: true,
        },
      },
    },
    orderBy: {
      createdAt: "desc",
    },
  });

  return (
    <main
      className={`${fraunces.variable} ${hanken.variable} mx-auto w-full max-w-6xl space-y-4 px-4 py-5 font-[family-name:var(--font-hanken)] text-slate-900 dark:text-neutral-100 sm:px-6`}
    >
      <header className="flex flex-wrap items-end justify-between gap-4">
        <div>
          <p className={`flex items-center gap-2 text-[11px] font-bold uppercase tracking-[0.22em] ${muted}`}>
            <span className="size-1.5 rounded-full bg-indigo-400" />
            K-Link Solutions
          </p>
          <h1 className={`${display} mt-1.5 text-2xl font-normal tracking-tight sm:text-3xl`}>
            Invoices
          </h1>
          <p className={`mt-1 text-xs ${muted}`}>
            Manage your business invoices and payments.
          </p>
        </div>

        <Link
          href="/invoices/new"
          className="inline-flex min-h-10 items-center gap-2 rounded-lg bg-slate-900 px-4 text-[13px] font-medium text-white transition-colors hover:bg-slate-700 dark:bg-neutral-100 dark:text-neutral-900 dark:hover:bg-white"
        >
          <Plus size={15} strokeWidth={2} />
          New invoice
        </Link>
      </header>

      <section className="overflow-hidden rounded-xl border border-slate-200 bg-white dark:border-neutral-800 dark:bg-neutral-950">
        <div className="flex items-center justify-between gap-3 border-b border-slate-200 px-4 py-3.5 dark:border-neutral-800 sm:px-5">
          <h2 className={`${display} text-base`}>All invoices</h2>
          <span className={`text-xs ${muted}`}>
            {invoices.length} {invoices.length === 1 ? "invoice" : "invoices"}
          </span>
        </div>

        {invoices.length === 0 ? (
          <p className={`px-6 py-14 text-center text-xs ${muted}`}>
            No invoices created yet.
          </p>
        ) : (
          <div className="overflow-x-auto">
            <table className="w-full min-w-[860px] text-left">
              <thead>
                <tr className={`border-b border-slate-100 text-[11px] uppercase tracking-wider dark:border-neutral-800 ${muted}`}>
                  <th className="px-4 py-3 font-medium sm:px-5">Invoice</th>
                  <th className="px-4 py-3 font-medium">Client</th>
                  <th className="px-4 py-3 text-right font-medium">Total</th>
                  <th className="px-4 py-3 text-right font-medium">Paid</th>
                  <th className="px-4 py-3 text-right font-medium">Balance</th>
                  <th className="px-4 py-3 font-medium">Due</th>
                  <th className="px-4 py-3 font-medium">Status</th>
                  <th className="px-4 py-3 text-right font-medium sm:px-5">Actions</th>
                </tr>
              </thead>

              <tbody className="divide-y divide-slate-100 dark:divide-neutral-800/80">
                {invoices.map((invoice) => {
                  const total = Number(invoice.total);

                  const paid = invoice.payments.reduce(
                    (sum, payment) => sum + Number(payment.amount),
                    0
                  );

                  const balance = total - paid;

                  return (
                    <tr
                      key={invoice.id}
                      className="transition-colors hover:bg-slate-50 dark:hover:bg-neutral-900/60"
                    >
                      <td className="whitespace-nowrap px-4 py-3 text-[13px] font-medium sm:px-5">
                        {invoice.invoiceNumber}
                      </td>

                      <td className="px-4 py-3 text-[13px]">
                        {invoice.client.name}
                      </td>

                      <td className="whitespace-nowrap px-4 py-3 text-right text-[13px] tabular-nums">
                        KES {total.toLocaleString("en-KE")}
                      </td>

                      <td className="whitespace-nowrap px-4 py-3 text-right text-[13px] tabular-nums text-emerald-700 dark:text-emerald-400">
                        KES {paid.toLocaleString("en-KE")}
                      </td>

                      <td className="whitespace-nowrap px-4 py-3 text-right text-[13px] font-semibold tabular-nums">
                        KES {balance.toLocaleString("en-KE")}
                      </td>

                      <td className={`whitespace-nowrap px-4 py-3 text-[13px] tabular-nums ${muted}`}>
                        {invoice.dueDate
                          ? invoice.dueDate.toLocaleDateString("en-KE")
                          : "—"}
                      </td>

                      <td className="px-4 py-3">
                        <InvoiceStatusBadge status={invoice.status} />
                      </td>

                      <td className="px-4 py-3 text-right sm:px-5">
                        <Link
                          href={`/invoices/${invoice.id}`}
                          className="inline-flex min-h-8 items-center rounded-lg border border-slate-300 px-3 text-xs font-medium text-slate-700 transition-colors hover:bg-slate-50 dark:border-neutral-700 dark:text-neutral-200 dark:hover:bg-neutral-900"
                        >
                          View
                        </Link>
                      </td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
          </div>
        )}
      </section>
    </main>
  );
}