import Link from "next/link";
import prisma from "@/lib/prisma";
import InvoiceItemsForm from "./InvoiceItemsForm";
import { createInvoice } from "../actions";
import { auth } from "@/auth";
import { redirect } from "next/navigation";

export default async function NewInvoicePage() {
   const session = await auth();

  if (!session?.user?.email) {
    redirect("/login");
  }

  const clients = await prisma.client.findMany({
    where: {
      profile: {
        type: "BUSINESS",
        user: {
          email: session.user.email,
        },
      },
      isActive: true,
    },
    orderBy: {
      name: "asc",
    },
  });

  return (
    <main className="p-4 lg:p-6">
      <div className="mb-6">
        <Link
          href="/invoices"
          className="text-sm text-gray-500 hover:underline dark:text-neutral-400"
        >
          ← Back to Invoices
        </Link>

        <h1 className="mt-4 text-2xl font-semibold text-gray-900 dark:text-white">
          Create Invoice
        </h1>

        <p className="mt-1 text-sm text-gray-500 dark:text-neutral-400">
          Create a new invoice for your client.
        </p>
      </div>

<form action={createInvoice}>
      <section className="rounded-xl border border-gray-200 bg-white p-4 dark:border-neutral-800 dark:bg-[#090909]">
        <h2 className="mb-3 font-semibold text-gray-900 dark:text-white">
          Select Client
        </h2>

        {clients.length === 0 ? (
  <p className="text-sm text-gray-500 dark:text-neutral-400">
    No active business clients found.
  </p>
) : (
  <div>
    <label
      htmlFor="clientId"
      className="mb-2 block text-sm font-medium text-gray-700 dark:text-neutral-300"
    >
      Client *
    </label>

    <select
      id="clientId"
      name="clientId"
      required
      defaultValue=""
      className="w-full rounded-lg border border-gray-300 bg-white px-4 py-2.5 text-sm text-gray-900 outline-none focus:border-gray-500 dark:border-neutral-700 dark:bg-[#111111] dark:text-white"
    >
      <option value="" disabled>
        Select a client
      </option>

      {clients.map((client) => (
        <option key={client.id} value={client.id}>
          {client.name}
          {client.company ? ` — ${client.company}` : ""}
        </option>
      ))}
    </select>
  </div>
)}
      </section>

      {/* Invoice Details */}
<section className="mt-4 rounded-xl border border-gray-200 bg-white p-4 dark:border-neutral-800 dark:bg-[#090909]">
  <h2 className="mb-4 font-semibold text-gray-900 dark:text-white">
    Invoice Details
  </h2>

  <div className="grid gap-4 md:grid-cols-2">

    {/* Issue Date */}
    <div>
      <label
        htmlFor="issueDate"
        className="mb-2 block text-sm font-medium text-gray-700 dark:text-neutral-300"
      >
        Issue Date *
      </label>

      <input
        id="issueDate"
        name="issueDate"
        type="date"
        required
        className="w-full rounded-lg border border-gray-300 bg-white px-4 py-2.5 text-sm text-gray-900 dark:border-neutral-700 dark:bg-[#111111] dark:text-white"
      />
    </div>

    {/* Due Date */}
    <div>
      <label
        htmlFor="dueDate"
        className="mb-2 block text-sm font-medium text-gray-700 dark:text-neutral-300"
      >
        Due Date
      </label>

      <input
        id="dueDate"
        name="dueDate"
        type="date"
        className="w-full rounded-lg border border-gray-300 bg-white px-4 py-2.5 text-sm text-gray-900 dark:border-neutral-700 dark:bg-[#111111] dark:text-white"
      />
    </div>

  </div>

  <p className="mt-4 text-xs text-gray-500 dark:text-neutral-400">
    The invoice number will be generated automatically when the invoice is saved.
  </p>
</section>

{/* Interactive Invoice Items */}
<InvoiceItemsForm />

<div className="mt-6 flex justify-end">
  <button
    type="submit"
    className="rounded-lg bg-gray-900 px-6 py-2.5 text-sm font-medium text-white transition hover:bg-gray-800 dark:bg-neutral-800 dark:hover:bg-neutral-700"
  >
    Save Invoice
  </button>
</div>

</form>
    </main>
  );
}