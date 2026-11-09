import { auth } from "@/auth";
import Link from "next/link";
import { notFound, redirect } from "next/navigation";
import { ArrowLeft } from "lucide-react";
import { Fraunces, Hanken_Grotesk } from "next/font/google";
import prisma from "@/lib/prisma";
import InvoiceItemsForm from "../../new/InvoiceItemsForm";
import { updateInvoice } from "../../actions";

const fraunces = Fraunces({ subsets: ["latin"], variable: "--font-fraunces" });
const hanken = Hanken_Grotesk({ subsets: ["latin"], variable: "--font-hanken" });

const display = "font-[family-name:var(--font-fraunces)]";
const muted = "text-slate-500 dark:text-neutral-400";
const card =
  "rounded-xl border border-slate-200 bg-white p-4 dark:border-neutral-800 dark:bg-neutral-950 sm:p-5";
const label = "mb-1 block text-xs font-medium text-slate-600 dark:text-neutral-400";
const field =
  "min-h-9 w-full rounded-lg border border-slate-300 bg-white px-3 text-[13px] text-slate-900 placeholder:text-slate-400 focus:border-slate-900 focus:outline-none focus:ring-2 focus:ring-slate-900/10 dark:border-neutral-700 dark:bg-neutral-900 dark:text-neutral-100 dark:placeholder:text-neutral-500 dark:focus:border-neutral-400 dark:focus:ring-neutral-100/10 dark:[color-scheme:dark]";

type EditInvoicePageProps = {
  params: Promise<{ id: string }>;
};

export default async function EditInvoicePage({
  params,
}: EditInvoicePageProps) {
  const session = await auth();

  if (!session?.user?.email) {
    redirect("/login");
  }

  const { id } = await params;

  const invoice = await prisma.invoice.findFirst({
    where: {
      id,
      status: "DRAFT",
      profile: {
        type: "BUSINESS",
        user: {
          email: session.user.email,
        },
      },
    },
    include: {
      items: true,
    },
  });

  if (!invoice) {
    notFound();
  }

  const clients = await prisma.client.findMany({
    where: {
      profileId: invoice.profileId,
      OR: [{ isActive: true }, { id: invoice.clientId }],
    },
    orderBy: {
      name: "asc",
    },
  });

  const initialItems = invoice.items.map((item) => ({
    description: item.description,
    quantity: item.quantity.toString(),
    unitPrice: item.unitPrice.toString(),
  }));

  const initialTaxRate = invoice.subtotal.isZero()
    ? "0"
    : invoice.taxAmount.div(invoice.subtotal).mul(100).toString();

  function formatDate(date: Date | null) {
    return date ? date.toISOString().slice(0, 10) : "";
  }

  return (
    <main
      className={`${fraunces.variable} ${hanken.variable} mx-auto w-full max-w-4xl space-y-4 px-4 py-5 font-[family-name:var(--font-hanken)] text-slate-900 dark:text-neutral-100 sm:px-6`}
    >
      <header>
        <Link
          href={`/invoices/${invoice.id}`}
          className="inline-flex items-center gap-1.5 text-xs text-slate-500 transition-colors hover:text-slate-900 dark:text-neutral-400 dark:hover:text-neutral-100"
        >
          <ArrowLeft size={14} />
          Back to invoice
        </Link>

        <h1 className={`${display} mt-3 text-2xl font-normal tracking-tight sm:text-3xl`}>
          Edit invoice
        </h1>

        <p className={`mt-1 text-xs ${muted}`}>
          Editing draft invoice {invoice.invoiceNumber}
        </p>
      </header>

      <form action={updateInvoice} className="space-y-4">
        <input type="hidden" name="invoiceId" value={invoice.id} />

        <section className={card}>
          <h2 className={`${display} mb-3 text-base`}>Client</h2>

          <label htmlFor="clientId" className={label}>
            Client
          </label>

          <select
            id="clientId"
            name="clientId"
            defaultValue={invoice.clientId}
            className={field}
          >
            {clients.map((client) => (
              <option key={client.id} value={client.id}>
                {client.name}
                {client.company ? ` — ${client.company}` : ""}
              </option>
            ))}
          </select>
        </section>

        <section className={card}>
          <h2 className={`${display} mb-3 text-base`}>Invoice details</h2>

          <div className="grid gap-3 sm:grid-cols-2">
            <div>
              <label htmlFor="issueDate" className={label}>
                Issue date
              </label>

              <input
                id="issueDate"
                name="issueDate"
                type="date"
                defaultValue={formatDate(invoice.issueDate)}
                className={field}
              />
            </div>

            <div>
              <label htmlFor="dueDate" className={label}>
                Due date
              </label>

              <input
                id="dueDate"
                name="dueDate"
                type="date"
                defaultValue={formatDate(invoice.dueDate)}
                className={field}
              />
            </div>
          </div>
        </section>

        <InvoiceItemsForm
          initialItems={initialItems}
          initialTaxRate={initialTaxRate}
        />

        <div className="flex flex-wrap justify-end gap-2">
          <Link
            href={`/invoices/${invoice.id}`}
            className="inline-flex min-h-10 items-center rounded-lg border border-slate-300 px-5 text-[13px] font-medium text-slate-700 transition-colors hover:bg-slate-50 dark:border-neutral-700 dark:text-neutral-200 dark:hover:bg-neutral-900"
          >
            Cancel
          </Link>

          <button
            type="submit"
            className="min-h-10 rounded-lg bg-slate-900 px-6 text-[13px] font-medium text-white transition-colors hover:bg-slate-700 dark:bg-neutral-100 dark:text-neutral-900 dark:hover:bg-white"
          >
            Save changes
          </button>
        </div>
      </form>
    </main>
  );
}