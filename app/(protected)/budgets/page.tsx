import { auth } from "@/auth";
import { redirect } from "next/navigation";
import Link from "next/link";
import { Fraunces, Hanken_Grotesk } from "next/font/google";
import prisma from "@/lib/prisma";
import AddBudgetForm from "@/components/AddBudgetForm";
import BudgetPeriodSelector from "@/components/BudgetPeriodSelector";
import EditBudgetForm from "@/components/EditBudgetForm";
import DeleteBudgetButton from "@/components/DeleteBudgetButton";

const fraunces = Fraunces({ subsets: ["latin"], variable: "--font-fraunces" });
const hanken = Hanken_Grotesk({ subsets: ["latin"], variable: "--font-hanken" });

const display = "font-[family-name:var(--font-fraunces)]";
const muted = "text-slate-500 dark:text-neutral-400";
const card =
  "rounded-xl border border-slate-200 bg-white dark:border-neutral-800 dark:bg-neutral-950";

type BudgetsPageProps = {
  searchParams: Promise<{
    profile?: string;
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
  const tab: "personal" | "business" =
    params.profile === "business" ? "business" : "personal";

  const profiles = await prisma.financialProfile.findMany({
    where: {
      user: {
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
          reversedInvoicePayment: { is: null },
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

  const periodLabel = new Date(
    selectedYear,
    selectedMonth - 1
  ).toLocaleString("en-KE", { month: "long", year: "numeric" });

  const visibleProfiles = profiles.filter(
    (profile) => profile.type.toLowerCase() === tab
  );

  const countFor = (type: string) =>
    profiles
      .filter((profile) => profile.type === type)
      .reduce(
        (total, profile) =>
          total +
          profile.budgets.filter(
            (budget) =>
              budget.month === selectedMonth && budget.year === selectedYear
          ).length,
        0
      );

  const tabs = [
    { id: "personal", label: "Personal", type: "PERSONAL", active: "bg-emerald-400 text-neutral-950" },
    { id: "business", label: "Business", type: "BUSINESS", active: "bg-indigo-300 text-neutral-950" },
  ] as const;

  return (
    <main
      className={`${fraunces.variable} ${hanken.variable} mx-auto w-full max-w-6xl space-y-6 px-4 py-5 font-[family-name:var(--font-hanken)] text-slate-900 dark:text-neutral-100 sm:px-6`}
    >
      {/* PAGE HEADER */}
      <header className="flex flex-wrap items-end justify-between gap-4">
        <div>
          <p className={`text-[11px] font-bold uppercase tracking-[0.22em] ${muted}`}>
            Monthly planning
          </p>
          <h1 className={`${display} mt-1.5 text-2xl font-normal tracking-tight sm:text-3xl`}>
            Budgets
          </h1>
          <p className={`mt-1 text-xs ${muted}`}>
            Plan and monitor spending for Personal and K-Link finances.
          </p>
        </div>

        <div className="flex flex-wrap items-center gap-2">
          <BudgetPeriodSelector month={selectedMonth} year={selectedYear} profile={tab} />

          <AddBudgetForm
            profiles={visibleProfiles.map((profile) => ({
              id: profile.id,
              name: profile.name,
              categories: profile.categories.map((category) => ({
                id: category.id,
                name: category.name,
              })),
            }))}
          />
        </div>
      </header>

      {/* PROFILE TABS */}
      <nav
        aria-label="Budget profile"
        className="flex w-fit gap-0.5 rounded-full bg-slate-100 p-1 dark:bg-neutral-900"
      >
        {tabs.map((t) => (
          <Link
            key={t.id}
            href={`/budgets?profile=${t.id}&month=${selectedMonth}&year=${selectedYear}`}
            scroll={false}
            aria-current={tab === t.id ? "page" : undefined}
            className={`flex min-h-10 items-center gap-1.5 rounded-full px-4 text-[13px] font-medium transition-colors ${
              tab === t.id
                ? t.active
                : "text-slate-600 hover:text-slate-900 dark:text-neutral-400 dark:hover:text-neutral-100"
            }`}
          >
            {t.label}
            <span className="text-[11px] tabular-nums opacity-70">
              · {countFor(t.type)}
            </span>
          </Link>
        ))}
      </nav>

      {visibleProfiles.length === 0 && (
        <p className={`${card} px-4 py-8 text-center text-xs ${muted}`}>
          No {tab} profile found for this account.
        </p>
      )}

      {/* PROFILES */}
      {visibleProfiles.map((profile) => {
        const isBusiness = profile.type === "BUSINESS";

        const monthlyBudgets = profile.budgets.filter(
          (budget) =>
            budget.month === selectedMonth && budget.year === selectedYear
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
          .reduce((total, transaction) => total + Number(transaction.amount), 0);

        const totalRemaining = totalBudget - totalSpent;

        const overallPercentage =
          totalBudget > 0 ? (totalSpent / totalBudget) * 100 : 0;

        const barColor = isBusiness ? "bg-indigo-400" : "bg-emerald-400";

        return (
          <section key={profile.id}>
            <div className="mb-3 flex flex-wrap items-center justify-between gap-2">
              <div className="flex items-center gap-2.5">
                <span className={`size-2 rounded-full ${isBusiness ? "bg-indigo-400" : "bg-emerald-400"}`} />
                <h2 className={`${display} text-base`}>{profile.name}</h2>
                <span
                  className={`rounded-full border px-2.5 py-0.5 text-[10px] font-bold uppercase tracking-wider ${
                    isBusiness
                      ? "border-indigo-300 text-indigo-600 dark:border-indigo-400/50 dark:text-indigo-300"
                      : "border-emerald-300 text-emerald-700 dark:border-emerald-400/50 dark:text-emerald-300"
                  }`}
                >
                  {isBusiness ? "Business" : "Personal"}
                </span>
              </div>
              <p className={`text-xs ${muted}`}>{periodLabel}</p>
            </div>

            {monthlyBudgets.length > 0 && (
              <div className={`${card} mb-3 p-4`}>
                <div className="grid grid-cols-2 gap-4 sm:grid-cols-4">
                  <div>
                    <p className={`text-[11px] ${muted}`}>Total budget</p>
                    <p className={`${display} mt-0.5 text-base tabular-nums`}>
                      KES {totalBudget.toLocaleString("en-KE")}
                    </p>
                  </div>

                  <div>
                    <p className={`text-[11px] ${muted}`}>Total spent</p>
                    <p className={`${display} mt-0.5 text-base tabular-nums`}>
                      KES {totalSpent.toLocaleString("en-KE")}
                    </p>
                  </div>

                  <div>
                    <p className={`text-[11px] ${muted}`}>Remaining</p>
                    <p
                      className={`${display} mt-0.5 text-base tabular-nums ${
                        totalRemaining < 0 ? "text-rose-600 dark:text-rose-400" : ""
                      }`}
                    >
                      KES {totalRemaining.toLocaleString("en-KE")}
                    </p>
                  </div>

                  <div>
                    <p className={`text-[11px] ${muted}`}>Overall used</p>
                    <p
                      className={`${display} mt-0.5 text-base tabular-nums ${
                        overallPercentage > 100 ? "text-rose-600 dark:text-rose-400" : ""
                      }`}
                    >
                      {overallPercentage.toFixed(0)}%
                    </p>
                  </div>
                </div>

                <div className="mt-3 h-1.5 overflow-hidden rounded-full bg-slate-100 dark:bg-neutral-800">
                  <div
                    className={`h-full rounded-full ${overallPercentage > 100 ? "bg-rose-500" : barColor}`}
                    style={{ width: `${Math.min(overallPercentage, 100)}%` }}
                  />
                </div>
              </div>
            )}

            {monthlyBudgets.length === 0 ? (
              <div className={`rounded-xl border border-dashed border-slate-300 px-4 py-8 text-center dark:border-neutral-800`}>
                <p className="text-[13px] font-medium">No budgets created yet.</p>
                <p className={`mt-1 text-xs ${muted}`}>
                  Create a monthly budget to start tracking spending.
                </p>
              </div>
            ) : (
              <div className="grid gap-3 sm:grid-cols-2 lg:grid-cols-3">
                {monthlyBudgets.map((budget) => {
                  const spent = profile.transactions
                    .filter((transaction) => {
                      const transactionDate = new Date(transaction.date);

                      return (
                        transaction.type === "EXPENSE" &&
                        transaction.categoryId === budget.categoryId &&
                        transactionDate.getMonth() + 1 === budget.month &&
                        transactionDate.getFullYear() === budget.year
                      );
                    })
                    .reduce(
                      (total, transaction) => total + Number(transaction.amount),
                      0
                    );

                  const budgetAmount = Number(budget.amount);

                  const remaining = budgetAmount - spent;

                  const percentageUsed =
                    budgetAmount > 0 ? (spent / budgetAmount) * 100 : 0;

                  return (
                    <article key={budget.id} className={`${card} p-3.5`}>
                      <div className="flex items-center justify-between gap-2">
                        <p className="truncate text-[13px] font-medium">
                          {budget.category.name}
                        </p>

                        <div className="flex shrink-0 items-center gap-0.5">
                          <span
                            className={`mr-1 text-xs font-semibold tabular-nums ${
                              percentageUsed > 100
                                ? "text-rose-600 dark:text-rose-400"
                                : muted
                            }`}
                          >
                            {percentageUsed.toFixed(0)}%
                          </span>

                          <EditBudgetForm
                            budgetId={budget.id}
                            categoryName={budget.category.name}
                            amount={budgetAmount}
                          />

                          <DeleteBudgetButton
                            budgetId={budget.id}
                            categoryName={budget.category.name}
                          />
                        </div>
                      </div>

                      <div className="mt-2 h-1.5 overflow-hidden rounded-full bg-slate-100 dark:bg-neutral-800">
                        <div
                          className={`h-full rounded-full ${percentageUsed > 100 ? "bg-rose-500" : barColor}`}
                          style={{ width: `${Math.min(percentageUsed, 100)}%` }}
                        />
                      </div>

                      <div className="mt-2 flex items-center justify-between gap-2 text-[11px]">
                        <span className={muted}>
                          <span className="font-semibold tabular-nums text-slate-900 dark:text-neutral-100">
                            KES {spent.toLocaleString("en-KE")}
                          </span>{" "}
                          of KES {budgetAmount.toLocaleString("en-KE")}
                        </span>

                        <span
                          className={`shrink-0 tabular-nums ${
                            remaining < 0 ? "font-semibold text-rose-600 dark:text-rose-400" : muted
                          }`}
                        >
                          {remaining < 0
                            ? `KES ${Math.abs(remaining).toLocaleString("en-KE")} over`
                            : `KES ${remaining.toLocaleString("en-KE")} left`}
                        </span>
                      </div>
                    </article>
                  );
                })}
              </div>
            )}
          </section>
        );
      })}
    </main>
  );
}