import { auth } from "@/auth";
import { redirect } from "next/navigation";
import { Fraunces, Hanken_Grotesk } from "next/font/google";
import {
  Banknote,
  Landmark,
  PiggyBank,
  Smartphone,
  TrendingUp,
  Wallet,
  type LucideIcon,
} from "lucide-react";
import prisma from "@/lib/prisma";
import OpeningBalanceForm from "@/components/OpeningBalanceForm";
import AddAccountForm from "@/components/AddAccountForm";
import TransferForm from "@/components/TransferForm";

const fraunces = Fraunces({ subsets: ["latin"], variable: "--font-fraunces" });
const hanken = Hanken_Grotesk({ subsets: ["latin"], variable: "--font-hanken" });

const display = "font-[family-name:var(--font-fraunces)]";
const muted = "text-slate-500 dark:text-neutral-400";

const accountTypes: Record<string, { label: string; icon: LucideIcon }> = {
  MPESA: { label: "M-Pesa", icon: Smartphone },
  BANK: { label: "Bank", icon: Landmark },
  CASH: { label: "Cash", icon: Banknote },
  SAVINGS: { label: "Savings", icon: PiggyBank },
  INVESTMENT: { label: "Investment", icon: TrendingUp },
  OTHER: { label: "Other", icon: Wallet },
};

const formatKES = (value: number) =>
  `KES ${value.toLocaleString("en-KE", {
    minimumFractionDigits: 2,
    maximumFractionDigits: 2,
  })}`;

export default async function AccountsPage() {
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
        include: {
          transactions: true,
          transfersSent: true,
          transfersReceived: true,
        },
        orderBy: {
          createdAt: "asc",
        },
      },
    },
    orderBy: {
      type: "asc",
    },
  });

  // Same balance calculation as before, done once per account up front
  // so each section can also show its subtotal.
  const sections = profiles.map((profile) => {
    const accounts = profile.accounts.map((account) => {
      const income = account.transactions
        .filter((transaction) => transaction.type === "INCOME")
        .reduce((total, transaction) => total + Number(transaction.amount), 0);

      const expenses = account.transactions
        .filter((transaction) => transaction.type === "EXPENSE")
        .reduce((total, transaction) => total + Number(transaction.amount), 0);

      const transfersSent = account.transfersSent.reduce(
        (total, transfer) => total + Number(transfer.amount),
        0
      );

      const transfersReceived = account.transfersReceived.reduce(
        (total, transfer) => total + Number(transfer.amount),
        0
      );

      const currentBalance =
        Number(account.openingBalance) +
        income -
        expenses +
        transfersReceived -
        transfersSent;

      return { ...account, currentBalance };
    });

    const sectionTotal = accounts.reduce(
      (total, account) => total + account.currentBalance,
      0
    );

    return { ...profile, accounts, sectionTotal };
  });

  return (
    <main
      className={`${fraunces.variable} ${hanken.variable} mx-auto w-full max-w-6xl space-y-6 px-4 py-5 font-[family-name:var(--font-hanken)] text-slate-900 dark:text-neutral-100 sm:px-6`}
    >
      <header className="flex flex-wrap items-end justify-between gap-4">
        <div>
          <p className={`text-[11px] font-bold uppercase tracking-[0.22em] ${muted}`}>
            Where your money is held
          </p>
          <h1 className={`${display} mt-1.5 text-2xl font-normal tracking-tight sm:text-3xl`}>
            Accounts
          </h1>
          <p className={`mt-1 text-xs ${muted}`}>
            Manage where your personal and K-Link money is held.
          </p>
        </div>

        <div className="flex flex-wrap gap-2">
          <TransferForm
            profiles={profiles.map((profile) => ({
              id: profile.id,
              name: profile.name,
              accounts: profile.accounts
                .filter((account) => account.isActive)
                .map((account) => ({
                  id: account.id,
                  name: account.name,
                })),
            }))}
          />

          <AddAccountForm
            profiles={profiles.map((profile) => ({
              id: profile.id,
              name: profile.name,
            }))}
          />
        </div>
      </header>

      {sections.map((profile) => {
        const isBusiness = profile.type === "BUSINESS";

        return (
          <section key={profile.id}>
            <div className="mb-3 flex flex-wrap items-center justify-between gap-2">
              <div className="flex items-center gap-2.5">
                <span
                  className={`size-2 rounded-full ${isBusiness ? "bg-indigo-400" : "bg-emerald-400"}`}
                />
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

              <p className={`text-xs ${muted}`}>
                {profile.accounts.length}{" "}
                {profile.accounts.length === 1 ? "account" : "accounts"} ·{" "}
                <span className="font-semibold tabular-nums text-slate-900 dark:text-neutral-100">
                  {formatKES(profile.sectionTotal)}
                </span>
              </p>
            </div>

            {profile.accounts.length === 0 ? (
              <p className={`rounded-xl border border-dashed border-slate-300 px-4 py-8 text-center text-xs dark:border-neutral-800 ${muted}`}>
                No accounts yet.
              </p>
            ) : (
              <div className="grid gap-3 sm:grid-cols-2 lg:grid-cols-3">
                {profile.accounts.map((account) => {
                  const meta = accountTypes[account.type] ?? {
                    label: account.type,
                    icon: Wallet,
                  };
                  const Icon = meta.icon;

                  return (
                    <article
                      key={account.id}
                      className={`rounded-xl border border-slate-200 bg-white p-3.5 dark:border-neutral-800 dark:bg-neutral-950 ${
                        account.isActive ? "" : "opacity-70"
                      }`}
                    >
                      <div className="flex items-center justify-between gap-3">
                        <div className="flex min-w-0 items-center gap-2.5">
                          <span className="grid size-8 shrink-0 place-items-center rounded-lg bg-slate-100 text-slate-600 dark:bg-neutral-900 dark:text-neutral-300">
                            <Icon size={15} strokeWidth={1.8} />
                          </span>
                          <div className="min-w-0">
                            <h3 className="truncate text-[13px] font-medium">
                              {account.name}
                            </h3>
                            <p className={`text-[11px] ${muted}`}>{meta.label}</p>
                          </div>
                        </div>

                        {!account.isActive && (
                          <span className="shrink-0 rounded-full border border-slate-300 px-2 py-0.5 text-[10px] font-semibold uppercase tracking-wider text-slate-500 dark:border-neutral-700 dark:text-neutral-400">
                            Inactive
                          </span>
                        )}
                      </div>

                      <div className="mt-3">
                        <p className={`text-[11px] ${muted}`}>Current balance</p>
                        <p className={`${display} mt-0.5 text-lg tracking-tight tabular-nums`}>
                          {formatKES(account.currentBalance)}
                        </p>
                      </div>

                      <div className="mt-3 flex flex-wrap items-center gap-x-2 border-t border-slate-100 pt-2 text-[11px] dark:border-neutral-800">
                        <span className={muted}>Opening balance</span>
                        <span className="font-medium tabular-nums">
                          {formatKES(Number(account.openingBalance))}
                        </span>

                        <OpeningBalanceForm
                          accountId={account.id}
                          currentBalance={Number(account.openingBalance)}
                        />
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