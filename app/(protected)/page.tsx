import { auth } from "@/auth";
import { redirect } from "next/navigation";
import Link from "next/link";
import type { ReactNode } from "react";
import { Fraunces, Hanken_Grotesk } from "next/font/google";
import prisma from "@/lib/prisma";

const fraunces = Fraunces({ subsets: ["latin"], variable: "--font-fraunces" });
const hanken = Hanken_Grotesk({ subsets: ["latin"], variable: "--font-hanken" });

const PERSONAL = "#34d399";
const BUSINESS = "#818cf8";
const GOLD = "#E3B86B";
const PALETTE = [PERSONAL, GOLD, BUSINESS, "#f472b6", "#94a3b8"];

type View = "all" | "personal" | "business";
type Row = { type: string; amount: unknown; category?: { name: string } | null };

const sumBy = (rows: Row[], type: string) =>
  rows.filter((r) => r.type === type).reduce((t, r) => t + Number(r.amount), 0);

const formatKES = (value: number) => `KES ${value.toLocaleString("en-KE")}`;

/* ---------- small chart components (server-rendered, no client JS) ---------- */

function LineChart({ lines, height = 200, compact = false }: {
  lines: { color: string; values: number[] }[];
  height?: number;
  compact?: boolean;
}) {
  const W = 640;
  const pad = compact ? 4 : 10;
  const all = lines.flatMap((l) => l.values);
  const min = Math.min(0, ...all);
  const max = Math.max(1, ...all);
  const x = (i: number, n: number) => (n <= 1 ? 0 : (i / (n - 1)) * W);
  const y = (v: number) => height - pad - ((v - min) / (max - min)) * (height - pad * 2);
  const d = (vals: number[]) =>
    vals
      .map((v, i) => {
        const px = x(i, vals.length);
        const py = y(v);
        if (i === 0) return `M${px},${py}`;
        const prevX = x(i - 1, vals.length);
        const mid = (prevX + px) / 2;
        return `C${mid},${y(vals[i - 1])} ${mid},${py} ${px},${py}`;
      })
      .join(" ");

  return (
    <svg
      viewBox={`0 0 ${W} ${height}`}
      preserveAspectRatio={compact ? "none" : undefined}
      className={compact ? "h-9 w-24" : "h-auto w-full"}
      role="img"
      aria-label="Net cash flow trend"
    >
      {!compact &&
        [0.25, 0.5, 0.75].map((f) => (
          <line key={f} x1={0} x2={W} y1={height * f} y2={height * f} className="stroke-slate-200 dark:stroke-neutral-800" />
        ))}
      {lines.map((l) => (
        <g key={l.color}>
          {!compact && <path d={`${d(l.values)} L${W},${y(0)} L0,${y(0)} Z`} fill={l.color} opacity={0.1} />}
          <path d={d(l.values)} fill="none" stroke={l.color} strokeWidth={compact ? 2.5 : 3} strokeLinecap="round" vectorEffect="non-scaling-stroke" />
        </g>
      ))}
    </svg>
  );
}

function Donut({ segments, centre }: { segments: { name: string; value: number; color: string }[]; centre: string }) {
  const sum = segments.reduce((t, s) => t + s.value, 0);
  let at = 0;
  const stops =
    sum > 0
      ? segments
          .map((s) => {
            const p = (s.value / sum) * 100;
            const stop = `${s.color} ${at}% ${at + p}%`;
            at += p;
            return stop;
          })
          .join(",")
      : "#94a3b8 0% 100%";

  return (
    <div className="mt-4 flex flex-wrap items-center gap-4">
      <div className="grid size-28 shrink-0 place-items-center rounded-full" style={{ background: `conic-gradient(${stops})` }} role="img" aria-label="Spending breakdown">
        <div className="flex size-20 flex-col items-center justify-center rounded-full bg-white dark:bg-neutral-950">
          <span className="font-[family-name:var(--font-fraunces)] text-xs">{centre}</span>
          <span className="text-[10px] text-slate-500 dark:text-neutral-400">spent</span>
        </div>
      </div>
      <ul className="min-w-0 flex-1 space-y-1.5 text-sm">
        {sum === 0 && <li className="text-slate-500 dark:text-neutral-400">No spending this month yet.</li>}
        {sum > 0 &&
          segments.map((s) => (
            <li key={s.name} className="flex items-center gap-2">
              <span className="size-2 shrink-0 rounded-full" style={{ background: s.color }} />
              <span className="truncate">{s.name}</span>
              <span className="ml-auto tabular-nums text-slate-500 dark:text-neutral-400">{Math.round((s.value / sum) * 100)}%</span>
            </li>
          ))}
      </ul>
    </div>
  );
}

function Flow({ items }: { items: { name: string; short: string; color: string; income: number; spent: number }[] }) {
  const total = items.reduce((t, i) => t + i.income, 0);
  if (total <= 0) {
    return <p className="mt-6 text-sm text-slate-500 dark:text-neutral-400">No income recorded this month yet.</p>;
  }
  const H = 180, GAP = 16, X0 = 130, X1 = 470, S = H / total;
  const out: ReactNode[] = [];
  let ly = 0;
  let ry = 0;

  items.forEach((it, i) => {
    if (it.income <= 0) return;
    const spentFlow = Math.min(it.spent, it.income);
    const parts = [
      { label: "spent", amt: spentFlow, color: GOLD },
      { label: "kept", amt: it.income - spentFlow, color: it.color },
    ];
    out.push(<rect key={`l${i}`} x={X0 - 8} y={ly} width={8} height={it.income * S} rx={3} fill={it.color} />);
    out.push(
      <text key={`lt${i}`} x={0} y={ly + (it.income * S) / 2 + 4} className="fill-slate-700 text-[12px] dark:fill-neutral-200">
        {it.name}
      </text>
    );
    let off = ly;
    parts.forEach((p) => {
      const h = p.amt * S;
      if (h <= 0) return;
      const yl = off + h / 2;
      const yr = ry + h / 2;
      const xm = (X0 + X1) / 2;
      out.push(<path key={`p${i}${p.label}`} d={`M${X0},${yl} C${xm},${yl} ${xm},${yr} ${X1},${yr}`} fill="none" stroke={p.color} strokeOpacity={0.3} strokeWidth={h} />);
      out.push(<rect key={`r${i}${p.label}`} x={X1} y={ry} width={8} height={h} rx={3} className="fill-slate-500 dark:fill-neutral-300" />);
      out.push(
        <text key={`rt${i}${p.label}`} x={X1 + 18} y={ry + h / 2 + 4} className="fill-slate-700 text-[12px] dark:fill-neutral-200">
          {`${it.short} ${p.label}`}
        </text>
      );
      off += h;
      ry += h + GAP;
    });
    ly += it.income * S + GAP;
  });

  return (
    <div className="overflow-x-auto">
      <svg viewBox={`0 0 640 ${H + GAP * 4}`} className="mt-4 h-auto w-full min-w-[480px] max-h-52" role="img" aria-label="Flow of this month's income into spending and savings">
        {out}
      </svg>
    </div>
  );
}

const card = "rounded-xl border border-slate-200 bg-white p-4 dark:border-neutral-800 dark:bg-neutral-950 sm:p-5";
const display = "font-[family-name:var(--font-fraunces)]";
const muted = "text-slate-500 dark:text-neutral-400";

/* ------------------------------- the page ------------------------------- */

export default async function Home({ searchParams }: { searchParams: Promise<{ view?: string }> }) {
  const session = await auth();
  if (!session?.user?.email) {
    redirect("/login");
  }

  const { view: rawView } = await searchParams;
  const view: View = rawView === "personal" || rawView === "business" ? rawView : "all";

  const profiles = await prisma.financialProfile.findMany({
    where: { user: { email: session.user.email } },
    include: {
      accounts: {
        include: { transactions: true, transfersSent: true, transfersReceived: true },
      },
      transactions: {
        // NOTE: assumes Transaction has a `category` relation with a `name` field.
        include: { InvoicePayment: true, reversedInvoicePayment: true, category: true },
      },
      budgets: true,
    },
    orderBy: { type: "asc" },
  });

  const now = new Date();
  const currentMonth = now.getMonth() + 1;
  const currentYear = now.getFullYear();

  const months = Array.from({ length: 6 }, (_, i) => {
    const m = new Date(currentYear, now.getMonth() - (5 - i), 1);
    return { year: m.getFullYear(), month: m.getMonth(), label: m.toLocaleString("en-KE", { month: "short" }) };
  });

  const financialData = profiles.map((profile) => {
    // ALL-TIME: reversal EXPENSES offset reversed invoice payments, so both are included.
    const totalIncome = sumBy(profile.transactions, "INCOME");
    const totalExpenses = sumBy(profile.transactions, "EXPENSE");
    const openingBalance = profile.accounts.reduce((t, a) => t + Number(a.openingBalance), 0);
    const totalBalance = openingBalance + totalIncome - totalExpenses;

    const monthlyTransactions = profile.transactions.filter((t) => {
      const date = new Date(t.date);
      return date.getMonth() + 1 === currentMonth && date.getFullYear() === currentYear;
    });
    const monthlyIncome = sumBy(monthlyTransactions, "INCOME");
    const monthlyExpenses = sumBy(monthlyTransactions, "EXPENSE");
    const monthlyNetCashFlow = monthlyIncome - monthlyExpenses;

    // LAST 6 MONTHS NET CASH FLOW
    const series = months.map((m) => {
      const tx = profile.transactions.filter((t) => {
        const date = new Date(t.date);
        return date.getFullYear() === m.year && date.getMonth() === m.month;
      });
      return sumBy(tx, "INCOME") - sumBy(tx, "EXPENSE");
    });

    const accounts = profile.accounts.map((account) => {
      const income = sumBy(account.transactions, "INCOME");
      const expenses = sumBy(account.transactions, "EXPENSE");
      const sent = account.transfersSent.reduce((t, x) => t + Number(x.amount), 0);
      const received = account.transfersReceived.reduce((t, x) => t + Number(x.amount), 0);
      return { ...account, balance: Number(account.openingBalance) + income - expenses + received - sent };
    });

    const monthlyBudgets = profile.budgets.filter((b) => b.month === currentMonth && b.year === currentYear);
    const totalBudget = monthlyBudgets.reduce((t, b) => t + Number(b.amount), 0);
    const budgetCategoryIds = new Set(monthlyBudgets.map((b) => b.categoryId));
    const budgetSpent = monthlyTransactions
      .filter((t) => t.type === "EXPENSE" && budgetCategoryIds.has(t.categoryId ?? ""))
      .reduce((t, x) => t + Number(x.amount), 0);
    const budgetPercentage = totalBudget > 0 ? (budgetSpent / totalBudget) * 100 : 0;

    return {
      ...profile,
      accounts,
      monthlyTransactions,
      totalBalance,
      monthlyIncome,
      monthlyExpenses,
      monthlyNetCashFlow,
      series,
      totalBudget,
      budgetSpent,
      budgetPercentage,
    };
  });

  /* ---- derived data for the selected view (balances are never combined) ---- */

  const colorOf = (type: string) => (type === "BUSINESS" ? BUSINESS : PERSONAL);
  const visible = financialData.filter((p) => view === "all" || p.type.toLowerCase() === view);
  const monthTx = visible.flatMap((p) => p.monthlyTransactions);

  const byCategory = (rows: Row[]) => {
    const map = new Map<string, number>();
    rows
      .filter((r) => r.type === "EXPENSE")
      .forEach((r) => {
        const name = r.category?.name ?? "Uncategorised";
        map.set(name, (map.get(name) ?? 0) + Number(r.amount));
      });
    return [...map.entries()].sort((a, b) => b[1] - a[1]);
  };

  const sorted = byCategory(monthTx);
  const top = sorted.slice(0, 4);
  const otherTotal = sorted.slice(4).reduce((t, [, v]) => t + v, 0);
  const spendSegments =
    view === "all"
      ? visible.map((p) => ({ name: p.name, value: p.monthlyExpenses, color: colorOf(p.type) }))
      : [...top, ...(otherTotal > 0 ? [["Other", otherTotal] as [string, number]] : [])].map(([name, value], i) => ({
          name,
          value,
          color: PALETTE[i % PALETTE.length],
        }));
  const spendTotal = visible.reduce((t, p) => t + p.monthlyExpenses, 0);

  const activity = visible
    .flatMap((p) => p.transactions.map((t) => ({ t, type: p.type })))
    .sort((a, b) => new Date(b.t.date).getTime() - new Date(a.t.date).getTime())
    .slice(0, 6);

  const giving = byCategory(monthTx).filter(([name]) => /tithe|giving|offering|mission/i.test(name));
  const givingTotal = giving.reduce((t, [, v]) => t + v, 0);
  const personalIncome = visible.reduce((t, p) => t + p.monthlyIncome, 0);

  const biggest = monthTx
    .filter((t) => t.type === "EXPENSE")
    .sort((a, b) => Number(b.amount) - Number(a.amount))
    .slice(0, 5);

  const title = view === "all" ? "Dashboard" : view === "personal" ? "Personal" : visible[0]?.name ?? "Business";
  const subtitle =
    view === "all"
      ? "Personal and business finances, clearly separated"
      : `${visible[0]?.accounts.length ?? 0} accounts · this month`;

  const tabs: { id: View; label: string; active: string }[] = [
    { id: "all", label: "All", active: "bg-slate-900 text-white dark:bg-neutral-100 dark:text-neutral-900" },
    { id: "personal", label: "Personal", active: "bg-emerald-400 text-neutral-950" },
    { id: "business", label: "Business", active: "bg-indigo-300 text-neutral-950" },
  ];

  return (
    <main className={`${fraunces.variable} ${hanken.variable} mx-auto w-full max-w-6xl space-y-4 px-4 py-5 font-[family-name:var(--font-hanken)] text-slate-900 dark:text-neutral-100 sm:px-6`}>
      <header className="flex flex-wrap items-end justify-between gap-4">
        <div>
          <p className={`text-[11px] font-bold uppercase tracking-[0.22em] ${muted}`}>
            Financial overview · {now.toLocaleString("en-KE", { month: "long", year: "numeric" })}
          </p>
          <h1 className={`${display} mt-1.5 text-2xl font-normal tracking-tight sm:text-3xl`}>{title}</h1>
          <p className={`mt-1 text-xs ${muted}`}>{subtitle}</p>
        </div>
        <nav aria-label="Dashboard view" className="flex gap-0.5 rounded-full bg-slate-100 p-1 dark:bg-neutral-900">
          {tabs.map((tab) => (
            <Link
              key={tab.id}
              href={tab.id === "all" ? "/" : `/?view=${tab.id}`}
              scroll={false}
              aria-current={view === tab.id ? "page" : undefined}
              className={`flex min-h-10 items-center rounded-full px-4 text-[13px] font-medium transition-colors ${view === tab.id ? tab.active : "text-slate-600 hover:text-slate-900 dark:text-neutral-400 dark:hover:text-neutral-100"}`}
            >
              {tab.label}
            </Link>
          ))}
        </nav>
      </header>

      {visible.length === 0 && <p className={`${card} text-sm ${muted}`}>No {view} profile found for this account.</p>}

      <section className="grid gap-4 lg:grid-cols-[repeat(auto-fit,minmax(min(100%,420px),1fr))]">
        {visible.map((profile) => {
          const isBusiness = profile.type === "BUSINESS";
          const color = colorOf(profile.type);
          return (
            <article key={profile.id} className={`${card} border-t-2`} style={{ borderTopColor: color }}>
              <div className="flex items-center justify-between gap-3">
                <div className="flex min-w-0 items-center gap-2.5">
                  <span
                    className={`rounded-full border px-2.5 py-0.5 text-[11px] font-bold uppercase tracking-wider ${isBusiness ? "border-indigo-300 text-indigo-600 dark:border-indigo-400/60 dark:text-indigo-300" : "border-emerald-300 text-emerald-700 dark:border-emerald-400/60 dark:text-emerald-300"}`}
                  >
                    {isBusiness ? "Business" : "Personal"}
                  </span>
                  <span className="truncate text-[13px] font-medium">{profile.name}</span>
                </div>
                <span className={`shrink-0 text-xs ${muted}`}>{profile.accounts.length} accounts</span>
              </div>

              <div className="mt-4 flex items-end justify-between gap-4">
                <div className="min-w-0">
                  <p className={`text-xs ${muted}`}>Available balance · all time</p>
                  <p className={`${display} mt-1 break-words text-[clamp(1.25rem,2vw,1.6rem)] leading-tight tracking-tight tabular-nums`}>
                    {formatKES(profile.totalBalance)}
                  </p>
                </div>
                <LineChart compact height={44} lines={[{ color, values: profile.series }]} />
              </div>

              <div className="mt-4 grid grid-cols-3 gap-3">
                <div className="min-w-0 border-t border-slate-200 pt-3 dark:border-neutral-800">
                  <p className={`text-xs ${muted}`}>Income</p>
                  <p className="mt-1 break-words text-sm font-semibold tabular-nums text-emerald-700 dark:text-emerald-400">{formatKES(profile.monthlyIncome)}</p>
                </div>
                <div className="min-w-0 border-t border-slate-200 pt-3 dark:border-neutral-800">
                  <p className={`text-xs ${muted}`}>Expenses</p>
                  <p className="mt-1 break-words text-sm font-semibold tabular-nums text-rose-600 dark:text-rose-400">{formatKES(profile.monthlyExpenses)}</p>
                </div>
                <div className="min-w-0 border-t border-slate-200 pt-3 dark:border-neutral-800">
                  <p className={`text-xs ${muted}`}>Net cash flow</p>
                  <p className={`mt-1 break-words text-sm font-semibold tabular-nums ${profile.monthlyNetCashFlow < 0 ? "text-rose-600 dark:text-rose-400" : ""}`}>{formatKES(profile.monthlyNetCashFlow)}</p>
                </div>
              </div>

              <div className="mt-4 flex flex-wrap items-center justify-between gap-2 text-[13px]">
                <span>Monthly budget</span>
                <span className={muted}>
                  {profile.totalBudget > 0
                    ? `${formatKES(profile.budgetSpent)} of ${formatKES(profile.totalBudget)} (${profile.budgetPercentage.toFixed(0)}%)`
                    : "Not set"}
                </span>
              </div>
              {profile.totalBudget > 0 && (
                <div className="mt-2 h-1.5 overflow-hidden rounded-full bg-slate-100 dark:bg-neutral-800">
                  <div
                    className={`h-full rounded-full ${profile.budgetPercentage > 100 ? "bg-rose-500" : "bg-amber-400"}`}
                    style={{ width: `${Math.min(Math.max(profile.budgetPercentage, 0), 100)}%` }}
                  />
                </div>
              )}

              <details className="group mt-4">
                <summary className="flex min-h-10 cursor-pointer list-none items-center justify-between rounded-xl border border-slate-200 px-4 text-sm font-medium marker:hidden hover:bg-slate-50 dark:border-neutral-800 dark:hover:bg-neutral-900 [&::-webkit-details-marker]:hidden">
                  <span>View {profile.name} account balances</span>
                  <span className="text-slate-400 transition-transform group-open:rotate-180">⌄</span>
                </summary>
                <div className="mt-2 grid gap-2 sm:grid-cols-2">
                  {profile.accounts.map((account) => (
                    <div key={account.id} className="rounded-xl border border-slate-200 px-3 py-2.5 dark:border-neutral-800">
                      <div className="flex items-center justify-between gap-2">
                        <span className="truncate text-xs font-medium">{account.name}</span>
                        <span className="text-[9px] uppercase text-slate-400">{account.type}</span>
                      </div>
                      <p className="mt-1 text-sm font-semibold tabular-nums">{formatKES(account.balance)}</p>
                    </div>
                  ))}
                  {profile.accounts.length === 0 && <p className={`text-xs ${muted}`}>No accounts yet.</p>}
                </div>
              </details>
            </article>
          );
        })}
      </section>

      {visible.length > 0 && (
        <>
          <section className="grid gap-4 lg:grid-cols-3">
            <div className={`${card} lg:col-span-2`}>
              <div className="flex flex-wrap items-center justify-between gap-2">
                <h2 className={`${display} text-base`}>Net cash flow · 6 months</h2>
                <div className={`flex gap-4 text-xs ${muted}`}>
                  {visible.map((p) => (
                    <span key={p.id} className="flex items-center gap-1.5">
                      <span className="size-2 rounded-full" style={{ background: colorOf(p.type) }} />
                      {p.type === "BUSINESS" ? "Business" : "Personal"}
                    </span>
                  ))}
                </div>
              </div>
              <div className="mt-4">
                <LineChart lines={visible.map((p) => ({ color: colorOf(p.type), values: p.series }))} />
              </div>
              <div className={`mt-1 flex justify-between text-xs ${muted}`}>
                {months.map((m) => (
                  <span key={`${m.year}-${m.month}`}>{m.label}</span>
                ))}
              </div>
            </div>

            <div className={card}>
              <h2 className={`${display} text-base`}>{view === "all" ? "Spending split" : `${title} spending`}</h2>
              <p className={`mt-1 text-xs ${muted}`}>This month</p>
              <Donut segments={spendSegments} centre={formatKES(spendTotal)} />
            </div>
          </section>

          <section className="grid gap-4 lg:grid-cols-3">
            <div className={`${card} lg:col-span-2`}>
              {view === "all" && (
                <>
                  <h2 className={`${display} text-base`}>Where the money goes</h2>
                  <p className={`mt-1 text-xs ${muted}`}>This month&apos;s income, spent or kept, each workspace kept apart</p>
                  <Flow
                    items={visible.map((p) => ({
                      name: p.name,
                      short: p.type === "BUSINESS" ? "Business" : "Personal",
                      color: colorOf(p.type),
                      income: p.monthlyIncome,
                      spent: p.monthlyExpenses,
                    }))}
                  />
                </>
              )}

              {view === "personal" && (
                <>
                  <h2 className={`${display} text-base`}>Tithe &amp; Giving</h2>
                  <p className={`mt-1 text-xs ${muted}`}>
                    {formatKES(givingTotal)} given this month
                    {personalIncome > 0 ? ` · ${((givingTotal / personalIncome) * 100).toFixed(0)}% of income` : ""}
                  </p>
                  <ul className="mt-4 space-y-3">
                    {giving.length === 0 && <li className={`text-sm ${muted}`}>No giving recorded this month. Categories named tithe, giving, offering or mission appear here.</li>}
                    {giving.map(([name, value]) => (
                      <li key={name}>
                        <div className="flex justify-between text-[13px]">
                          <span>{name}</span>
                          <span className={`tabular-nums ${muted}`}>{formatKES(value)}</span>
                        </div>
                        <div className="mt-2 h-1.5 overflow-hidden rounded-full bg-slate-100 dark:bg-neutral-800">
                          <div className="h-full rounded-full" style={{ width: `${givingTotal > 0 ? (value / givingTotal) * 100 : 0}%`, background: GOLD }} />
                        </div>
                      </li>
                    ))}
                  </ul>
                </>
              )}

              {view === "business" && (
                <>
                  <h2 className={`${display} text-base`}>Largest expenses</h2>
                  <p className={`mt-1 text-xs ${muted}`}>Top five this month</p>
                  <ul className="mt-4">
                    {biggest.length === 0 && <li className={`py-2.5 text-[13px] ${muted}`}>No expenses recorded this month.</li>}
                    {biggest.map((t, i) => (
                      <li key={i} className="flex items-center justify-between gap-3 border-t border-slate-100 py-2.5 text-[13px] dark:border-neutral-800">
                        <span className="min-w-0 truncate">
                          {(t as { description?: string | null }).description || t.category?.name || "Expense"}
                          <span className={`block text-xs ${muted}`}>{t.category?.name ?? "Uncategorised"}</span>
                        </span>
                        <span className="shrink-0 font-semibold tabular-nums">−{Number(t.amount).toLocaleString("en-KE")}</span>
                      </li>
                    ))}
                  </ul>
                </>
              )}
            </div>

            <div className={card}>
              <h2 className={`${display} text-base`}>Recent activity</h2>
              <ul className="mt-3">
                {activity.length === 0 && <li className={`py-2.5 text-[13px] ${muted}`}>No transactions yet.</li>}
                {activity.map(({ t, type }, i) => {
                  const income = t.type === "INCOME";
                  return (
                    <li key={i} className="flex items-center justify-between gap-3 border-t border-slate-100 py-2.5 text-[13px] dark:border-neutral-800">
                      <span className="min-w-0 truncate">
                        {(t as { description?: string | null }).description || t.category?.name || "Transaction"}
                        <span className={`block text-xs ${muted}`}>
                          {new Date(t.date).toLocaleDateString("en-KE", { day: "numeric", month: "short" })} ·{" "}
                          <span style={{ color: colorOf(type) }} className="font-semibold">
                            {type === "BUSINESS" ? "Business" : "Personal"}
                          </span>
                        </span>
                      </span>
                      <span className={`shrink-0 font-semibold tabular-nums ${income ? "text-emerald-700 dark:text-emerald-400" : ""}`}>
                        {income ? "+" : "−"}
                        {Number(t.amount).toLocaleString("en-KE")}
                      </span>
                    </li>
                  );
                })}
              </ul>
            </div>
          </section>
        </>
      )}

      <p className="px-1 text-[11px] text-slate-400 dark:text-neutral-500">
        Available balance includes opening balances and all-time transactions. Income, expenses and cash flow show this month only.
      </p>
    </main>
  );
}