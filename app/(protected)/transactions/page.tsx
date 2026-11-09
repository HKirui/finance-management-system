import { auth } from "@/auth";
import { redirect } from "next/navigation";
import { Fraunces, Hanken_Grotesk } from "next/font/google";
import prisma from "@/lib/prisma";
import TransactionForm from "@/components/TransactionForm";
import EditTransactionButton from "@/components/EditTransactionButton";
import DeleteTransactionButton from "@/components/DeleteTransactionButton";

const fraunces = Fraunces({ subsets: ["latin"], variable: "--font-fraunces" });
const hanken = Hanken_Grotesk({ subsets: ["latin"], variable: "--font-hanken" });

const muted = "text-slate-500 dark:text-neutral-400";

const typeTone = (label: string) => {
  switch (label) {
    case "INCOME":
      return "border-emerald-300 text-emerald-700 dark:border-emerald-400/40 dark:text-emerald-300";
    case "EXPENSE":
      return "border-slate-300 text-slate-600 dark:border-neutral-700 dark:text-neutral-300";
    case "REVERSAL":
      return "border-rose-300 text-rose-700 dark:border-rose-400/40 dark:text-rose-300";
    case "REVERSED INCOME":
      return "border-amber-300 text-amber-700 dark:border-amber-400/40 dark:text-amber-300";
    default:
      return "border-slate-300 text-slate-600 dark:border-neutral-700 dark:text-neutral-300";
  }
};

export default async function TransactionsPage() {
  const session = await auth();

  if (!session?.user?.email) {
    redirect("/login");
  }
  const profiles = await prisma.financialProfile.findMany({
    where: {
      user: {
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
    where: {
      profile: {
        user: {
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
    <main
      className={`${fraunces.variable} ${hanken.variable} mx-auto w-full max-w-6xl space-y-4 px-4 py-5 font-[family-name:var(--font-hanken)] text-slate-900 dark:text-neutral-100 sm:px-6`}
    >
      <header className="flex flex-wrap items-end justify-between gap-4">
        <div>
          <p className={`text-[11px] font-bold uppercase tracking-[0.22em] ${muted}`}>
            Records
          </p>
          <h1 className="mt-1.5 font-[family-name:var(--font-fraunces)] text-2xl font-normal tracking-tight sm:text-3xl">
            Transactions
          </h1>
          <p className={`mt-1 text-xs ${muted}`}>
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
      </header>

      <section className="overflow-hidden rounded-xl border border-slate-200 bg-white dark:border-neutral-800 dark:bg-neutral-950">
        <div className="flex items-center justify-between gap-3 border-b border-slate-200 px-4 py-3.5 dark:border-neutral-800 sm:px-5">
          <h2 className="font-[family-name:var(--font-fraunces)] text-base">
            Transaction history
          </h2>
          <span className={`text-xs ${muted}`}>
            {transactions.length} {transactions.length === 1 ? "record" : "records"}
          </span>
        </div>

        {transactions.length === 0 ? (
          <div className="px-6 py-16 text-center">
            <p className="font-[family-name:var(--font-fraunces)] text-base">
              No transactions yet
            </p>

            <p className={`mt-1 text-xs ${muted}`}>
              Your personal and K-Link transactions will appear here.
            </p>
          </div>
        ) : (
          <div className="overflow-x-auto">
            <table className="w-full min-w-[880px] text-left">
              <thead>
                <tr className={`border-b border-slate-100 text-[11px] uppercase tracking-wider dark:border-neutral-800 ${muted}`}>
                  <th className="px-4 py-3 font-medium sm:px-5">Date</th>
                  <th className="px-4 py-3 font-medium">Description</th>
                  <th className="px-4 py-3 font-medium">Profile</th>
                  <th className="px-4 py-3 font-medium">Account</th>
                  <th className="px-4 py-3 font-medium">Category</th>
                  <th className="px-4 py-3 font-medium">Type</th>
                  <th className="px-4 py-3 text-right font-medium">Amount</th>
                  <th className="px-4 py-3 text-right font-medium sm:px-5">Actions</th>
                </tr>
              </thead>

              <tbody className="divide-y divide-slate-100 dark:divide-neutral-800/80">
                {transactions.map((transaction) => {
                  const typeLabel = transaction.reversedInvoicePayment
                    ? "REVERSAL"
                    : transaction.InvoicePayment?.isReversed
                    ? "REVERSED INCOME"
                    : transaction.type;
                  const isBusiness = transaction.profile.type === "BUSINESS";
                  const isIncome = transaction.type === "INCOME";
                  const isReversedIncome = !!transaction.InvoicePayment?.isReversed;

                  return (
                    <tr
                      key={transaction.id}
                      className="transition-colors hover:bg-slate-50 dark:hover:bg-neutral-900/60"
                    >
                      <td className={`whitespace-nowrap px-4 py-3 text-[13px] tabular-nums sm:px-5 ${muted}`}>
                        {transaction.date.toLocaleDateString("en-KE")}
                      </td>

                      <td className="px-4 py-3 text-[13px] font-medium">
                        {transaction.description || "—"}
                        {transaction.InvoicePayment?.isReversed && (
                          <span className="ml-2 rounded-full border border-amber-300 px-2 py-0.5 text-[10px] font-semibold text-amber-700 dark:border-amber-400/40 dark:text-amber-300">
                            Reversed
                          </span>
                        )}

                        {transaction.reversedInvoicePayment && (
                          <span className="ml-2 rounded-full border border-indigo-300 px-2 py-0.5 text-[10px] font-semibold text-indigo-600 dark:border-indigo-400/40 dark:text-indigo-300">
                            Payment reversal
                          </span>
                        )}
                      </td>

                      <td className="px-4 py-3 text-[13px]">
                        <span className="inline-flex items-center gap-2">
                          <span
                            className={`size-1.5 rounded-full ${isBusiness ? "bg-indigo-400" : "bg-emerald-400"}`}
                          />
                          {transaction.profile.name}
                        </span>
                      </td>

                      <td className={`px-4 py-3 text-[13px] ${muted}`}>
                        {transaction.account.name}
                      </td>

                      <td className={`px-4 py-3 text-[13px] ${muted}`}>
                        {transaction.category?.name || "Uncategorized"}
                      </td>

                      <td className="px-4 py-3">
                        <span
                          className={`inline-block whitespace-nowrap rounded-full border px-2.5 py-0.5 text-[10px] font-bold uppercase tracking-wider ${typeTone(typeLabel)}`}
                        >
                          {typeLabel}
                        </span>
                      </td>

                      <td
                        className={`whitespace-nowrap px-4 py-3 text-right text-[13px] font-semibold tabular-nums ${
                          isReversedIncome
                            ? "text-slate-400 line-through dark:text-neutral-500"
                            : isIncome
                            ? "text-emerald-700 dark:text-emerald-400"
                            : ""
                        }`}
                      >
                        {isIncome ? "+" : "−"} KES{" "}
                        {Number(transaction.amount).toLocaleString("en-KE")}
                      </td>

                      <td className="px-4 py-3 sm:px-5">
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
                            accounts={
                              profiles
                                .find((profile) => profile.id === transaction.profileId)
                                ?.accounts.map((account) => ({
                                  id: account.id,
                                  name: account.name,
                                })) ?? []
                            }
                            categories={
                              profiles
                                .find((profile) => profile.id === transaction.profileId)
                                ?.categories.map((category) => ({
                                  id: category.id,
                                  name: category.name,
                                  type: category.type,
                                })) ?? []
                            }
                          />

                          <DeleteTransactionButton
                            transactionId={transaction.id}
                            description={transaction.description}
                          />
                        </div>
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