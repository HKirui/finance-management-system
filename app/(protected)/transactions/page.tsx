import { auth } from "@/auth";
import { redirect } from "next/navigation";
import prisma from "@/lib/prisma";
import TransactionForm from "@/components/TransactionForm";
import EditTransactionButton from "@/components/EditTransactionButton";
import DeleteTransactionButton from "@/components/DeleteTransactionButton";

export default async function TransactionsPage() {
  const session = await auth();

if (!session?.user?.email) {
  redirect("/login");
}
  const profiles = await prisma.financialProfile.findMany({
    where:{
      user:{
        email: session.user.email,
      },
    },
    include: {
      accounts: {
        where: {
          isActive: true,
        },
      },
      categories: true,
    },
    orderBy: {
      type: "asc",
    },
  });

  const transactions = await prisma.transaction.findMany({
    where:{
      profile:{
        user:{
        email: session.user.email,
      },
     },
    },
    include: {
      profile: true,
      account: true,
      category: true,
      InvoicePayment: true,
      reversedInvoicePayment: true,
    },
    orderBy: {
      date: "desc",
    },
  });

  return (
    <main className="p-8">
      <div className="mx-auto max-w-6xl">
        <div className="mb-8 flex items-center justify-between">
          <div>
            <h1 className="text-3xl font-bold text-gray-900">
              Transactions
            </h1>

            <p className="mt-2 text-gray-600">
              Manage your personal and K-Link transactions.
            </p>
          </div>

         <TransactionForm
  profiles={profiles.map((profile) => ({
    id: profile.id,
    name: profile.name,
    type: profile.type,
    accounts: profile.accounts.map((account) => ({
      id: account.id,
      name: account.name,
    })),
    categories: profile.categories.map((category) => ({
      id: category.id,
      name: category.name,
      type: category.type,
    })),
  }))}
/>
        </div>

        <div className="overflow-hidden rounded-xl border border-gray-200 bg-white">
          <div className="border-b border-gray-200 px-6 py-4">
            <h2 className="font-semibold text-gray-900">
              Transaction History
            </h2>
          </div>

          {transactions.length === 0 ? (
            <div className="px-6 py-16 text-center">
              <p className="font-medium text-gray-900">
                No transactions yet
              </p>

              <p className="mt-1 text-sm text-gray-500">
                Your personal and K-Link transactions will appear here.
              </p>
            </div>
          ) : (
            <div className="overflow-x-auto">
              <table className="w-full text-left">
                <thead className="bg-gray-50 text-sm text-gray-500">
                  <tr>
                    <th className="px-6 py-3 font-medium">Date</th>
                    <th className="px-6 py-3 font-medium">Description</th>
                    <th className="px-6 py-3 font-medium">Profile</th>
                    <th className="px-6 py-3 font-medium">Account</th>
                    <th className="px-6 py-3 font-medium">Category</th>
                    <th className="px-6 py-3 font-medium">Type</th>
                    <th className="px-6 py-3 text-right font-medium">Amount</th>
                    <th className="px-6 py-3 text-right font-medium">Actions</th>
                  </tr>
                </thead>

                <tbody className="divide-y divide-gray-100">
                  {transactions.map((transaction) => (
                    <tr key={transaction.id}>
                      <td className="px-6 py-4 text-sm text-gray-600">
                        {transaction.date.toLocaleDateString("en-KE")}
                      </td>

                      <td className="px-6 py-4 text-sm font-medium text-gray-900">
                        {transaction.description || "—"}
                        {transaction.InvoicePayment?.isReversed && (
                        <span className="ml-2 text-xs font-semibold text-amber-600">
                              (Reversed)
                        </span>
                          )}

                        {transaction.reversedInvoicePayment && (
                         <span className="ml-2 text-xs font-semibold text-blue-600">
                              (Payment Reversal)
                              </span>
                             )}
                      </td>

                      <td className="px-6 py-4 text-sm text-gray-600">
                        {transaction.profile.name}
                      </td>

                      <td className="px-6 py-4 text-sm text-gray-600">
                        {transaction.account.name}
                      </td>

                      <td className="px-6 py-4 text-sm text-gray-600">
                        {transaction.category?.name || "Uncategorized"}
                      </td>

                      <td className="px-6 py-4 text-sm text-gray-600">
                        {transaction.reversedInvoicePayment
                           ?"REVERSAL"
                            : transaction.InvoicePayment?.isReversed
                           ?"REVERSED INCOME"
                            : transaction.type}
                      </td>

                      <td className="px-6 py-4 text-right text-sm font-semibold text-gray-900">
                        KES {Number(transaction.amount).toLocaleString("en-KE")}
                      </td>
                    <td className="px-6 py-4">
  <div className="flex items-center justify-end gap-1">
    <EditTransactionButton
      transaction={{
        id: transaction.id,
        type: transaction.type,
        amount: Number(transaction.amount),
        description: transaction.description,
        date: transaction.date.toISOString().split("T")[0],
        accountId: transaction.accountId,
        categoryId: transaction.categoryId,
      }}
      accounts={profiles
        .find(
          (profile) => profile.id === transaction.profileId
        )
        ?.accounts.map((account) => ({
          id: account.id,
          name: account.name,
        })) ?? []}
      categories={profiles
        .find(
          (profile) => profile.id === transaction.profileId
        )
        ?.categories.map((category) => ({
          id: category.id,
          name: category.name,
          type: category.type,
        })) ?? []}
    />

    <DeleteTransactionButton
      transactionId={transaction.id}
      description={transaction.description}
    />
  </div>
</td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          )}
        </div>
      </div>
    </main>
  );
}