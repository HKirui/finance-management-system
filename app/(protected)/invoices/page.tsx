import prisma from "@/lib/prisma";
import Link from "next/link";
import { auth } from "@/auth";
import { redirect } from "next/navigation";

export default async function InvoicesPage() {

  const session=await auth();
  if (!session?.user?.email) {
    redirect("/login");
  }

  const invoices = await prisma.invoice.findMany({
  where: {
    profile: {
      type: "BUSINESS",
      user:{
        email:session.user.email,
      },
    },
  },
  include: {
    client: true,
    payments: {
      where: {
        isReversed: true,
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
    <main className="p-4 lg:p-6">

      <div className="mb-6 flex flex-wrap items-center justify-between gap-4">
  <div>
    <h1 className="text-2xl font-semibold text-gray-900 dark:text-white">
      Invoices
    </h1>

    <p className="mt-1 text-sm text-gray-500 dark:text-neutral-400">
      Manage your business invoices and payments.
    </p>
  </div>

  <Link
    href="/invoices/new"
    className="inline-flex items-center justify-center rounded-lg bg-blue-700 px-4 py-2.5 text-sm font-medium text-white transition hover:bg-blue-800"
  >
    + New Invoice
  </Link>
</div>

      <div className="rounded-xl border border-gray-200 bg-white p-4 dark:border-neutral-800 dark:bg-[#090909]">
        {invoices.length === 0 ? (
          <p className="text-sm text-gray-500 dark:text-neutral-400">
            No invoices created yet.
          </p>
        ) : (
          <div className="overflow-x-auto">
            <table className="w-full text-left text-sm">
              <thead className="border-b border-gray-200 bg-gray-50 text-xs uppercase text-gray-500 dark:border-neutral-800 dark:bg-[#111111] dark:text-neutral-400">
                <tr>
                  <th className="px-4 py-3">Invoice No.</th>
                  <th className="px-4 py-3">Client</th>
                  <th className="px-4 py-3">Total</th>
                  <th className="px-4 py-3">Paid</th>
                  <th className="px-4 py-3">Balance</th>
                  <th className="px-4 py-3">Due Date</th>
                  <th className="px-4 py-3">Status</th>
                  <th className="px-4 py-3">Actions</th>
                </tr>
              </thead>

              <tbody className="divide-y divide-gray-200 dark:divide-neutral-800">
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
                      className="hover:bg-gray-50 dark:hover:bg-[#111111]"
                    >
                      <td className="px-4 py-3 font-medium text-gray-900 dark:text-white">
                        {invoice.invoiceNumber}
                      </td>

                      <td className="px-4 py-3 text-gray-600 dark:text-neutral-300">
                        {invoice.client.name}
                      </td>

                      <td className="px-4 py-3 text-gray-600 dark:text-neutral-300">
                        KES {total.toLocaleString("en-KE")}
                      </td>

                      <td className="px-4 py-3 text-green-700 dark:text-green-400">
                        KES {paid.toLocaleString("en-KE")}
                      </td>

                      <td className="px-4 py-3 font-medium text-gray-900 dark:text-white">
                        KES {balance.toLocaleString("en-KE")}
                      </td>

                      <td className="px-4 py-3 text-gray-600 dark:text-neutral-300">
                        {invoice.dueDate
                          ? invoice.dueDate.toLocaleDateString("en-KE")
                          : "—"}
                      </td>

                      <td className="px-4 py-3">
                        <span className="rounded-full bg-gray-100 px-2 py-1 text-xs font-medium text-gray-700 dark:bg-neutral-800 dark:text-neutral-300">
                          {invoice.status.replaceAll("_", " ")}
                        </span>
                      </td>

                      <td className="px-4 py-3">
  <Link
    href={`/invoices/${invoice.id}`}
    className="inline-block rounded-lg border border-gray-300 px-3 py-1.5 text-xs font-medium text-gray-700 hover:bg-gray-100 dark:border-neutral-700 dark:text-neutral-300 dark:hover:bg-neutral-800"
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
      </div>
    </main>
  );
}