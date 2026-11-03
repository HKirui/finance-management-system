import { auth } from "@/auth";
import { redirect } from "next/navigation";import prisma from "@/lib/prisma";
import AddBudgetForm from "@/components/AddBudgetForm";
import BudgetPeriodSelector from "@/components/BudgetPeriodSelector";
import EditBudgetForm from "@/components/EditBudgetForm";
import DeleteBudgetButton from "@/components/DeleteBudgetButton";

type BudgetsPageProps = {
  searchParams: Promise<{
    month?: string;
    year?: string;
  }>;
};

export default async function BudgetsPage({
  searchParams,
}: BudgetsPageProps) {
  const session = await auth();

if (!session?.user?.email) {
  redirect("/login");
}
  const params = await searchParams;

  const now = new Date();

  const selectedMonth = Number(params.month) || now.getMonth() + 1;
  const selectedYear = Number(params.year) || now.getFullYear();

  const profiles = await prisma.financialProfile.findMany({
    where:{
      user:{
        email: session.user.email,
      },
    },
    include: {
      categories: {
        where: {
          type: "EXPENSE",
        },
        orderBy: {
          name: "asc",
        },
      },

      transactions: {
        where: {
          type: "EXPENSE",
          reversedInvoicePayment:{ is: null,},
        },
      },

      budgets: {
        include: {
          category: true,
        },
        orderBy: [
          {
            year: "desc",
          },
          {
            month: "desc",
          },
        ],
      },
    },

    orderBy: {
      type: "asc",
    },
  });

  return (
    <main className="p-8">
      <div className="mx-auto max-w-6xl">

        {/* PAGE HEADER */}
        <div className="mb-8 flex items-start justify-between">
          <div>
            <h1 className="text-3xl font-bold text-gray-900">
              Budgets
            </h1>

            <p className="mt-2 text-gray-600">
              Plan and monitor spending for Personal and K-Link finances.
            </p>
          </div>


           <div className="flex items-center gap-3">
                 <BudgetPeriodSelector
                     month={selectedMonth}
                     year={selectedYear}
            />

          <AddBudgetForm
            profiles={profiles.map((profile) => ({
              id: profile.id,
              name: profile.name,
              categories: profile.categories.map((category) => ({
                id: category.id,
                name: category.name,
              })),
            }))}
          />
        </div>
        </div>

        {/* PROFILES */}
        <div className="space-y-8">
          {profiles.map((profile) =>{
             const monthlyBudgets = profile.budgets.filter(
                (budget) =>
                  budget.month === selectedMonth &&
                  budget.year === selectedYear
             );

             const totalBudget = monthlyBudgets.reduce(
              (total, budget) => total + Number(budget.amount),
                       0
                   );

                 const budgetCategoryIds = new Set(
                  monthlyBudgets.map((budget) => budget.categoryId)
                   );

                 const totalSpent = profile.transactions
                 .filter((transaction) => {
                 const transactionDate = new Date(transaction.date);

                  return (
                   budgetCategoryIds.has(transaction.categoryId ?? "") &&
                   transactionDate.getMonth() + 1 === selectedMonth &&
                   transactionDate.getFullYear() === selectedYear
                        );
                      })
                  .reduce(
                  (total, transaction) =>
                  total + Number(transaction.amount),
                     0
                    );

              const totalRemaining = totalBudget - totalSpent;

              const overallPercentage =
                 totalBudget > 0
                 ? (totalSpent / totalBudget) * 100
                  : 0;

             return (
            <section
              key={profile.id}
              className="rounded-xl border border-gray-200 bg-white p-6"
            >
              <div className="mb-5">
                <p className="text-xs font-semibold uppercase tracking-wider text-gray-500">
                  {profile.type}
                </p>

                <h2 className="text-xl font-semibold text-gray-900">
                  {profile.name}
                </h2>
              </div>

              {monthlyBudgets.length > 0 && (
  <div className="mb-6 grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
    <div className="rounded-lg bg-gray-50 p-4">
      <p className="text-sm text-gray-500">
        Total Budget
      </p>

      <p className="mt-1 text-xl font-bold text-gray-900">
        KES {totalBudget.toLocaleString("en-KE")}
      </p>
    </div>

    <div className="rounded-lg bg-gray-50 p-4">
      <p className="text-sm text-gray-500">
        Total Spent
      </p>

      <p className="mt-1 text-xl font-bold text-gray-900">
        KES {totalSpent.toLocaleString("en-KE")}
      </p>
    </div>

    <div className="rounded-lg bg-gray-50 p-4">
      <p className="text-sm text-gray-500">
        Remaining
      </p>

      <p
        className={`mt-1 text-xl font-bold ${
          totalRemaining < 0
            ? "text-red-600"
            : "text-gray-900"
        }`}
      >
        KES {totalRemaining.toLocaleString("en-KE")}
      </p>
    </div>

    <div className="rounded-lg bg-gray-50 p-4">
      <p className="text-sm text-gray-500">
        Overall Used
      </p>

      <p
        className={`mt-1 text-xl font-bold ${
          overallPercentage > 100
            ? "text-red-600"
            : "text-gray-900"
        }`}
      >
        {overallPercentage.toFixed(0)}%
      </p>
    </div>
  </div>
)}

              {monthlyBudgets.length === 0 ? (
                <div className="rounded-lg bg-gray-50 p-6 text-center">
                  <p className="font-medium text-gray-700">
                    No budgets created yet.
                  </p>

                  <p className="mt-1 text-sm text-gray-500">
                    Create a monthly budget to start tracking spending.
                  </p>
                </div>
              ) : (
                <div className="space-y-3">
                  {monthlyBudgets.map((budget) => {
                    const spent = profile.transactions
                      .filter((transaction) => {
                        const transactionDate = new Date(
                          transaction.date
                        );

                        return (
                          transaction.type === "EXPENSE" &&
                          transaction.categoryId === budget.categoryId &&
                          transactionDate.getMonth() + 1 === budget.month &&
                          transactionDate.getFullYear() === budget.year
                        );
                      })
                      .reduce(
                        (total, transaction) =>
                          total + Number(transaction.amount),
                        0
                      );

                    const budgetAmount = Number(budget.amount);

                    const remaining =
                      budgetAmount - spent;

                    const percentageUsed =
                      budgetAmount > 0
                        ? (spent / budgetAmount) * 100
                        : 0;

                      return (
  <div
    key={budget.id}
    className="rounded-xl border border-gray-200 p-5"
  >
    <div className="flex items-start justify-between gap-4">
      <div>
        <p className="font-semibold text-gray-900">
          {budget.category.name}
        </p>

        <p className="mt-1 text-sm text-gray-500">
          {new Date(
            budget.year,
            budget.month - 1
          ).toLocaleString("en-KE", {
            month: "long",
            year: "numeric",
          })}
        </p>
      </div>

      <div className="flex items-center gap-2">
           <p
             className={`text-sm font-medium ${
             percentageUsed > 100
             ? "text-red-600"
             : "text-gray-600"
              }`}
              >
             {percentageUsed.toFixed(0)}% used
           </p>

         <EditBudgetForm
           budgetId={budget.id}
           categoryName={budget.category.name}
           amount={budgetAmount}
              />
          </div>
        </div>

        <DeleteBudgetButton
           budgetId={budget.id}
          categoryName={budget.category.name}
         />

    <div className="mt-4">
      <p className="text-sm text-gray-600">
        <span className="font-semibold text-gray-900">
          KES {spent.toLocaleString("en-KE")}
        </span>
        {" "}spent of{" "}
        <span className="font-semibold text-gray-900">
          KES {budgetAmount.toLocaleString("en-KE")}
        </span>
      </p>
    </div>

    <div className="mt-3 h-2 overflow-hidden rounded-full bg-gray-100">
      <div
        className={`h-full rounded-full ${
          percentageUsed > 100
            ? "bg-red-600"
            : "bg-gray-900"
        }`}
        style={{
          width: `${Math.min(percentageUsed, 100)}%`,
        }}
      />
    </div>

    <div className="mt-3 flex justify-between text-sm">
      <span className="text-gray-500">
        Remaining
      </span>

      <span
        className={`font-semibold ${
          remaining < 0
            ? "text-red-600"
            : "text-gray-900"
        }`}
      >
        KES {remaining.toLocaleString("en-KE")}
      </span>
    </div>
  </div>
);
                  })}
                </div>
              )}
            </section>
             );
           })}
        </div>
      </div>
    </main>
  );
}