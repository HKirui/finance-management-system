import { auth } from "@/auth";
import { redirect } from "next/navigation";
import { Fraunces, Hanken_Grotesk } from "next/font/google";
import prisma from "@/lib/prisma";
import GivingForm from "@/components/GivingForm";

const fraunces = Fraunces({ subsets: ["latin"], variable: "--font-fraunces" });
const hanken = Hanken_Grotesk({ subsets: ["latin"], variable: "--font-hanken" });

const givingCategories = [
  "Tithe",
  "Offering",
  "Altar Sacrifice",
  "Prophet's Honor",
];

const display = "font-[family-name:var(--font-fraunces)]";
const muted = "text-slate-500 dark:text-neutral-400";
const card =
  "rounded-xl border border-slate-200 bg-white dark:border-neutral-800 dark:bg-neutral-950";

function Ornament({ className = "" }: { className?: string }) {
  return (
    <svg
      width="132"
      height="12"
      viewBox="0 0 132 12"
      aria-hidden
      className={className}
    >
      <path d="M0 6h56M76 6h56" stroke="currentColor" strokeWidth="1" />
      <path d="M66 0l6 6-6 6-6-6z" fill="currentColor" />
    </svg>
  );
}

export default async function GivingPage() {
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
        where: { isActive: true },
      },
      categories: {
        where: {
          type: "EXPENSE",
          name: { in: givingCategories },
        },
      },
    },
    orderBy: { type: "asc" },
  });

  const transactions = await prisma.transaction.findMany({
    where: {
      type: "EXPENSE",
      profile: {
        user: {
          email: session.user.email,
        },
      },
      category: {
        name: { in: givingCategories },
        type: "EXPENSE",
      },
    },
    include: {
      profile: true,
      account: true,
      category: true,
    },
    orderBy: [
      { date: "desc" },
      { createdAt: "desc" },
    ],
  });

  const total = (category: string) =>
    transactions
      .filter((t) => t.category?.name === category)
      .reduce((sum, t) => sum + Number(t.amount), 0);

  const formatMoney = (amount: number) =>
    `KES ${amount.toLocaleString("en-KE", {
      minimumFractionDigits: 2,
      maximumFractionDigits: 2,
    })}`;

  const grandTotal = givingCategories.reduce((sum, c) => sum + total(c), 0);

  return (
    <main
      className={`${fraunces.variable} ${hanken.variable} mx-auto w-full max-w-6xl space-y-4 px-4 py-5 font-[family-name:var(--font-hanken)] text-slate-900 dark:text-neutral-100 sm:px-6`}
    >
      {/* Heading + Malachi 3:10 */}
      <header className="grid items-center gap-5 lg:grid-cols-[minmax(0,1fr)_minmax(0,1.15fr)]">
        <div>
          <p className={`text-[11px] font-bold uppercase tracking-[0.22em] ${muted}`}>
            Tithe &amp; Giving
          </p>
          <h1 className={`${display} mt-1.5 text-2xl font-normal tracking-tight sm:text-3xl`}>
            Giving
          </h1>
          <p className={`mt-1 max-w-sm text-xs leading-relaxed ${muted}`}>
            Tithe, offering, altar sacrifice and prophet&apos;s honor. Manage
            your personal and business giving.
          </p>
          <div className="mt-4">
            <GivingForm
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
                })),
              }))}
            />
          </div>
        </div>

        <figure className="border-l-2 border-amber-400/70 pl-3.5 lg:max-w-xl lg:justify-self-end">
          <blockquote
            className={`${display} text-[11px] italic leading-[1.65] text-slate-600 dark:text-neutral-400`}
          >
            “Bring all the tithes into the storehouse so there will be enough
            food in my Temple. If you do,” says the <span className="not-italic">LORD</span> of
            Heaven’s Armies, “I will open the windows of heaven for you. I will
            pour out a blessing so great you won’t have enough room to take it
            in! Try it! Put me to the test!”
          </blockquote>
          <figcaption className="mt-1.5 text-[10px] font-bold uppercase tracking-[0.18em] text-amber-700 dark:text-amber-300">
            Malachi 3:10 · NLT
          </figcaption>
        </figure>
      </header>

      {/* Category totals */}
      <section className="grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
        {givingCategories.map((category) => {
          const amount = total(category);
          const share = grandTotal > 0 ? (amount / grandTotal) * 100 : 0;

          return (
            <div key={category} className={`${card} p-4 sm:p-5`}>
              <p className={`text-xs ${muted}`}>{category}</p>
              <p className={`${display} mt-2 text-xl tracking-tight tabular-nums`}>
                {formatMoney(amount)}
              </p>
              <div className="mt-3 h-1 overflow-hidden rounded-full bg-slate-100 dark:bg-neutral-800">
                <div
                  className="h-full rounded-full bg-amber-400"
                  style={{ width: `${share}%` }}
                />
              </div>
              <p className={`mt-2 text-[11px] ${muted}`}>
                {share.toFixed(0)}% of all giving
              </p>
            </div>
          );
        })}
      </section>

      {/* History */}
      <section className={`${card} overflow-hidden`}>
        <div className="flex items-center justify-between gap-3 border-b border-slate-200 px-4 py-3.5 dark:border-neutral-800 sm:px-5">
          <h2 className={`${display} text-base`}>Giving history</h2>
          <span className={`text-xs ${muted}`}>
            {transactions.length} {transactions.length === 1 ? "record" : "records"}
          </span>
        </div>

        {transactions.length === 0 ? (
          <p className={`px-6 py-14 text-center text-xs ${muted}`}>
            No giving records yet.
          </p>
        ) : (
          <div className="overflow-x-auto">
            <table className="w-full min-w-[760px] text-left">
              <thead>
                <tr className={`border-b border-slate-100 text-[11px] uppercase tracking-wider dark:border-neutral-800 ${muted}`}>
                  <th className="px-4 py-3 font-medium sm:px-5">Date</th>
                  <th className="px-4 py-3 font-medium">Profile</th>
                  <th className="px-4 py-3 font-medium">Category</th>
                  <th className="px-4 py-3 font-medium">Account</th>
                  <th className="px-4 py-3 font-medium">Description</th>
                  <th className="px-4 py-3 text-right font-medium sm:px-5">Amount</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-100 dark:divide-neutral-800/80">
                {transactions.map((transaction) => (
                  <tr
                    key={transaction.id}
                    className="transition-colors hover:bg-slate-50 dark:hover:bg-neutral-900/60"
                  >
                    <td className={`whitespace-nowrap px-4 py-3 text-[13px] tabular-nums sm:px-5 ${muted}`}>
                      {transaction.date.toLocaleDateString("en-KE")}
                    </td>
                    <td className="px-4 py-3 text-[13px]">
                      <span className="inline-flex items-center gap-2">
                        <span
                          className={`size-1.5 rounded-full ${transaction.profile.type === "BUSINESS" ? "bg-indigo-400" : "bg-emerald-400"}`}
                        />
                        {transaction.profile.name}
                      </span>
                    </td>
                    <td className="px-4 py-3">
                      <span className="inline-block whitespace-nowrap rounded-full border border-amber-300 px-2.5 py-0.5 text-[10px] font-bold uppercase tracking-wider text-amber-700 dark:border-amber-400/40 dark:text-amber-300">
                        {transaction.category?.name}
                      </span>
                    </td>
                    <td className={`px-4 py-3 text-[13px] ${muted}`}>
                      {transaction.account.name}
                    </td>
                    <td className={`px-4 py-3 text-[13px] ${muted}`}>
                      {transaction.description || "—"}
                    </td>
                    <td className="whitespace-nowrap px-4 py-3 text-right text-[13px] font-semibold tabular-nums sm:px-5">
                      {formatMoney(Number(transaction.amount))}
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </section>

      {/* 2 Corinthians 9:7 */}
      <footer className="pb-1 pt-2 text-center">
        <Ornament className="mx-auto h-2 w-20 text-amber-500/70 dark:text-amber-300/50" />
        <p className={`${display} mx-auto mt-2.5 max-w-lg text-[11px] italic leading-[1.65] text-slate-600 dark:text-neutral-400`}>
          You must each decide in your heart how much to give. And don’t give
          reluctantly or in response to pressure.{" "}
          <span className="text-amber-800 dark:text-amber-200">
            “For God loves a person who gives cheerfully.”
          </span>
        </p>
        <p className="mt-1.5 text-[10px] font-bold uppercase tracking-[0.18em] text-amber-700 dark:text-amber-300">
          2 Corinthians 9:7 · NLT
        </p>
        <p className="mt-2 text-[9px] text-slate-400 dark:text-neutral-600">
          Scripture quotations are from the Holy Bible, New Living Translation.
        </p>
      </footer>
    </main>
  );
}