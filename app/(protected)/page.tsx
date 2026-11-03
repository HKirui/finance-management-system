import { auth } from "@/auth";
import { redirect } from "next/navigation";
import prisma from "@/lib/prisma";

export default async function Home() {

  const session = await auth();

if (!session?.user?.email) {
  redirect("/login");
}

  const profiles = await prisma.financialProfile.findMany({
    where: {
      user:{
        email: session.user.email,
      },
    },
    include: {
      accounts:{
        include:{
          transactions: true,
          transfersSent: true,
          transfersReceived: true,
        },
      },
      transactions: {
          include: {
            InvoicePayment: true,
            reversedInvoicePayment: true,
          },
      },
      budgets: true,
    },
    orderBy: {
      type: "asc",
    },
  });

  const now = new Date();

const currentMonth = now.getMonth() + 1;
const currentYear = now.getFullYear();

const financialData = profiles.map((profile) => {

  // ALL-TIME INCOME
  // Include original invoice payments, even if reversed.
  // The corresponding reversal EXPENSE offsets the payment.
  const totalIncome = profile.transactions
    .filter((transaction) => transaction.type === "INCOME")
    .reduce(
      (total, transaction) => total + Number(transaction.amount),
      0
    );

  // ALL-TIME EXPENSES
  // Include reversal transactions to preserve cash-flow accuracy.
  const totalExpenses = profile.transactions
    .filter((transaction) => transaction.type === "EXPENSE")
    .reduce(
      (total, transaction) => total + Number(transaction.amount),
      0
    );

  const openingBalance = profile.accounts.reduce(
    (total, account) => total + Number(account.openingBalance),
    0
  );

  const totalBalance =
    openingBalance + totalIncome - totalExpenses;


  // CURRENT MONTH TRANSACTIONS
  const monthlyTransactions = profile.transactions.filter(
    (transaction) => {
      const date = new Date(transaction.date);

      return (
        date.getMonth() + 1 === currentMonth &&
        date.getFullYear() === currentYear
      );
    }
  );

  const monthlyIncome = monthlyTransactions
    .filter((transaction) => transaction.type === "INCOME")
    .reduce(
      (total, transaction) =>
        total + Number(transaction.amount),
      0
    );

  const monthlyExpenses = monthlyTransactions
    .filter((transaction) => transaction.type === "EXPENSE")
    .reduce(
      (total, transaction) =>
        total + Number(transaction.amount),
      0
    );

  const monthlyNetCashFlow =
    monthlyIncome - monthlyExpenses;

  // CURRENT ACCOUNT BALANCES
  const accounts = profile.accounts.map((account) => {
    const income = account.transactions
      .filter((transaction) => transaction.type === "INCOME")
      .reduce(
        (total, transaction) =>
          total + Number(transaction.amount),
        0
      );

    const expenses = account.transactions
      .filter((transaction) => transaction.type === "EXPENSE")
      .reduce(
        (total, transaction) =>
          total + Number(transaction.amount),
        0
      );

    const transfersSent = account.transfersSent.reduce(
      (total, transfer) =>
        total + Number(transfer.amount),
      0
    );

    const transfersReceived =
      account.transfersReceived.reduce(
        (total, transfer) =>
          total + Number(transfer.amount),
        0
      );

    const balance =
      Number(account.openingBalance) +
      income -
      expenses +
      transfersReceived -
      transfersSent;

    return {
      ...account,
      balance,
    };
  });

  // CURRENT MONTH BUDGET
  const monthlyBudgets = profile.budgets.filter(
    (budget) =>
      budget.month === currentMonth &&
      budget.year === currentYear
  );

  const totalBudget = monthlyBudgets.reduce(
    (total, budget) =>
      total + Number(budget.amount),
    0
  );

  const budgetCategoryIds = new Set(
    monthlyBudgets.map((budget) => budget.categoryId)
  );

  const budgetSpent = monthlyTransactions
    .filter(
      (transaction) =>
        transaction.type === "EXPENSE" &&
        budgetCategoryIds.has(transaction.categoryId ?? "")
    )
    .reduce(
      (total, transaction) =>
        total + Number(transaction.amount),
      0
    );

  const budgetPercentage =
    totalBudget > 0
      ? (budgetSpent / totalBudget) * 100
      : 0;

  return {
    ...profile,
    accounts,
    totalBalance,
    monthlyIncome,
    monthlyExpenses,
    monthlyNetCashFlow,
    totalBudget,
    budgetSpent,
    budgetPercentage,
  };
});


 return (
  <main className="p-4 lg:p-6">
    <div className="w-full">

      {/* HEADER */}
      <div className="mb-8">
        <p className="text-sm font-medium text-gray-600 dark:text-neutral-400">
          Finance Overview
        </p>

        <h1 className="mt-1 text-3xl font-bold text-gray-900 dark:text-white">
          Dashboard
        </h1>

        <p className="mt-2 text-gray-600 dark:text-neutral-400">
          Personal and K-Link Solutions ·{" "}
          {now.toLocaleString("en-KE", {
            month: "long",
            year: "numeric",
          })}
        </p>
      </div>

      <div className="space-y-8">
        {financialData.map((profile) => (
          <section
            key={profile.id}
            className="rounded-xl border border-gray-200 bg-white p-4 dark:boarder-neutral-800 dark:bg-[#090909]"
          >
            {/* PROFILE HEADER */}
            <div className="mb-6 flex items-end justify-between">
              <div>
                <p className="text-xs font-semibold uppercase tracking-wider text-gray-500 dark:text-neutral-400">
                  {profile.type}
                </p>

                <h2 className="mt-1 text-xl font-semibold text-gray-900 dark:text-white">
                  {profile.name}
                </h2>
              </div>

              <div className="text-right">
                <p className="text-sm text-gray-500 dark:text-white">
                  Total Balance
                </p>

                <p className="text-xl font-semibold text-gray-900 dark:text-neutral-400">
                  KES{" "} {profile.totalBalance.toLocaleString("en-KE")}
                </p>
              </div>
            </div>

            {/* MONTHLY CARDS */}
            <div className="grid gap-3 md:grid-cols-3">
              <div className="rounded-lg border border-gray-200 p-4 dark:border-neutral-800 dark:bg-[#111111]">
                <p className="text-sm text-gray-500 dark:text-neutral-400">
                  Income this month
                </p>

                <p className="mt-2 text-xl font-bold text-green-700 dark:text-green-400">
                  KES{" "}
                  {profile.monthlyIncome.toLocaleString(
                    "en-KE"
                  )}
                </p>
              </div>

              <div className="rounded-lg border border-gray-200 p-4 dark:border-neutral-800 dark:bg-[#111111]">
                <p className="text-sm text-gray-500 dark:text-neutral-400">
                  Expenses this month
                </p>

                <p className="mt-2 text-xl font-bold text-red-600 dark:text-red-400">
                  KES{" "}
                  {profile.monthlyExpenses.toLocaleString(
                    "en-KE"
                  )}
                </p>
              </div>

              <div className="rounded-lg border border-gray-200 p-4 dark:border-neutral-800 dark:bg-[#111111]">
  <p className="text-xs text-gray-500 dark:text-neutral-400">
    Net cash flow
  </p>

  <p
    className={`mt-1 text-lg font-bold ${
      profile.monthlyNetCashFlow < 0
        ? "text-red-600 dark:text-red-400"
        : "text-gray-900 dark:text-white"
    }`}
  >
    KES{" "}
    {profile.monthlyNetCashFlow.toLocaleString("en-KE")}
  </p>
</div>
            </div>

            {/* BUDGET */}
            <div className="mt-6">
              <div className="mb-2 flex items-center justify-between">
                <div>
                  <p className="font-semibold text-gray-900 dark:text-white">
                    Monthly Budget
                  </p>

                  {profile.totalBudget > 0 ? (
                    <p className="mt-1 text-sm text-gray-500 dark:text-neutral-400">
                      KES{" "}
                      {profile.budgetSpent.toLocaleString(
                        "en-KE"
                      )}{" "}
                      spent of KES{" "}
                      {profile.totalBudget.toLocaleString(
                        "en-KE"
                      )}
                    </p>
                  ) : (
                    <p className="mt-1 text-sm text-gray-500 dark:text-neutral-350">
                      No budget set for this month.
                    </p>
                  )}
                </div>

                {profile.totalBudget > 0 && (
                  <p
                    className={`text-sm font-semibold ${
                      profile.budgetPercentage > 100
                        ? "text-red-600"
                        : "text-gray-700"
                    }`}
                  >
                    {profile.budgetPercentage.toFixed(0)}%
                  </p>
                )}
              </div>

              {profile.totalBudget > 0 && (
                <div className="h-2 overflow-hidden rounded-full bg-gray-100">
                  <div
                    className={`h-full rounded-full ${
                      profile.budgetPercentage > 100
                        ? "bg-red-600"
                        : "bg-gray-900"
                    }`}
                    style={{
                      width: `${Math.min(
                        profile.budgetPercentage,
                        100
                      )}%`,
                    }}
                  />
                </div>
              )}
            </div>

            {/* ACCOUNTS */}
            <div className="mt-7 border-t border-gray-200 pt-6">
              <h3 className="mb-4 font-semibold text-gray-900 dark:text-white">
                Accounts
              </h3>

              <div className="grid gap-3 sm:grid-cols-2 lg:grid-cols-3">
                {profile.accounts.map((account) => (
                  <div
                    key={account.id}
                    className="rounded-xl border border-gray-200 p-4"
                  >
                    <div className="flex items-center justify-between">
                      <p className="font-medium text-gray-900 dark:text-white">
                        {account.name}
                      </p>

                      <span className="text-xs text-gray-600 dark:text-neutral-500">
                        {account.type}
                      </span>
                    </div>

                    <p className="mt-3 text-lg font-bold text-gray-900 dark:text-white">
                      KES{" "}
                      {account.balance.toLocaleString(
                        "en-KE"
                      )}
                    </p>
                  </div>
                ))}
              </div>
            </div>
          </section>
        ))}
      </div>
    </div>
  </main>
);}