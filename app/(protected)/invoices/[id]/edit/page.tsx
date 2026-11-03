import {auth} from "@/auth"
import Link from "next/link";
import { notFound, redirect } from "next/navigation";
import prisma from "@/lib/prisma";
import InvoiceItemsForm from "../../new/InvoiceItemsForm";
import {updateInvoice} from "../../actions";

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
        user:{
          email:session.user.email,
        }
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
      OR: [
        { isActive: true },
        { id: invoice.clientId },
      ],
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
    : invoice.taxAmount
        .div(invoice.subtotal)
        .mul(100)
        .toString();

  function formatDate(date: Date | null) {
    return date
      ? date.toISOString().slice(0, 10)
      : "";
  }

  return (
    <main className="p-4 lg:p-6">
      <Link
        href={`/invoices/${invoice.id}`}
        className="text-sm text-gray-500 hover:underline dark:text-neutral-400"
      >
        ← Back to Invoice
      </Link>

      <h1 className="mt-4 text-2xl font-semibold text-gray-900 dark:text-white">
        Edit Invoice
      </h1>

      <p className="mt-1 text-sm text-gray-500 dark:text-neutral-400">
        Editing draft invoice {invoice.invoiceNumber}
      </p>

      <form action={updateInvoice} className="mt-6 space-y-4">
  <input
    type="hidden"
    name="invoiceId"
    value={invoice.id}
  />
        <section className="rounded-xl border border-gray-200 bg-white p-4 dark:border-neutral-800 dark:bg-[#090909]">
          <h2 className="mb-4 font-semibold text-gray-900 dark:text-white">
            Client
          </h2>

          <select
            name="clientId"
            defaultValue={invoice.clientId}
            className="w-full rounded-lg border border-gray-300 bg-white px-4 py-2.5 text-sm text-gray-900 dark:border-neutral-700 dark:bg-[#111111] dark:text-white"
          >
            {clients.map((client) => (
              <option key={client.id} value={client.id}>
                {client.name}
                {client.company ? ` — ${client.company}` : ""}
              </option>
            ))}
          </select>
        </section>

        <section className="rounded-xl border border-gray-200 bg-white p-4 dark:border-neutral-800 dark:bg-[#090909]">
          <h2 className="mb-4 font-semibold text-gray-900 dark:text-white">
            Invoice Details
          </h2>

          <div className="grid gap-4 md:grid-cols-2">
            <div>
              <label
                htmlFor="issueDate"
                className="mb-2 block text-sm text-gray-600 dark:text-neutral-300"
              >
                Issue Date
              </label>

              <input
                id="issueDate"
                name="issueDate"
                type="date"
                defaultValue={formatDate(invoice.issueDate)}
                className="w-full rounded-lg border border-gray-300 bg-white p-2.5 text-sm text-gray-900 dark:border-neutral-700 dark:bg-[#111111] dark:text-white"
              />
            </div>

            <div>
              <label
                htmlFor="dueDate"
                className="mb-2 block text-sm text-gray-600 dark:text-neutral-300"
              >
                Due Date
              </label>

              <input
                id="dueDate"
                name="dueDate"
                type="date"
                defaultValue={formatDate(invoice.dueDate)}
                className="w-full rounded-lg border border-gray-300 bg-white p-2.5 text-sm text-gray-900 dark:border-neutral-700 dark:bg-[#111111] dark:text-white"
              />
            </div>
          </div>
        </section>

        <InvoiceItemsForm
          initialItems={initialItems}
          initialTaxRate={initialTaxRate}
        />

       <div className="flex flex-wrap justify-end gap-3">
  <Link
    href={`/invoices/${invoice.id}`}
    className="rounded-lg border border-gray-300 px-5 py-2.5 text-sm font-medium text-gray-700 hover:bg-gray-100 dark:border-neutral-700 dark:text-neutral-300 dark:hover:bg-neutral-800"
  >
    Cancel
  </Link>

  <button
    type="submit"
    className="rounded-lg bg-gray-900 px-6 py-2.5 text-sm font-medium text-white transition hover:bg-gray-800 dark:bg-neutral-800 dark:hover:bg-neutral-700"
  >
    Save Changes
  </button>
</div>
</form>
    </main>
  );
}
