import { auth } from "@/auth";
import { redirect } from "next/navigation";
import Link from "next/link";
import type { ReactNode } from "react";
import { Fraunces, Hanken_Grotesk } from "next/font/google";
import prisma from "@/lib/prisma";
import CashFlowChart from "@/components/CashFlowChart";
import SpendingDonut from "@/components/SpendingDonut";

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

function LineChart({
  lines,
  height = 200,
  compact = false,
}: {
  lines: { color: string; values: number[] }[];
  height?: number;
  compact?: boolean;
}) {
  const W = 640;
  const left = compact ? 4 : 62;
  const right = compact ? 4 : 12;
  const top = compact ? 4 : 16;
  const bottom = compact ? 4 : 16;

  const all = lines.flatMap((line) => line.values);
  const minValue = Math.min(0, ...all);
  const maxValue = Math.max(0, ...all);

  const range = Math.max(1, maxValue - minValue);
  const padding = range * 0.1;

  const min = Math.min(0, minValue - padding);
  const max = Math.max(0, maxValue + padding);

  const plotWidth = W - left - right;
  const plotHeight = height - top - bottom;

  const x = (index: number, count: number) =>
    left + (count <= 1 ? plotWidth / 2 : (index / (count - 1)) * plotWidth);

  const y = (value: number) =>
    top + ((max - value) / (max - min)) * plotHeight;

  const path = (values: number[]) =>
    values
      .map((value, index) => {
        const px = x(index, values.length);
        const py = y(value);

        if (index === 0) return `M${px},${py}`;

        const previousX = x(index - 1, values.length);
        const midpoint = (previousX + px) / 2;

        return `C${midpoint},${y(values[index - 1])} ${midpoint},${py} ${px},${py}`;
      })
      .join(" ");

  const ticks = Array.from({ length: 5 }, (_, index) =>
    min + ((max - min) * index) / 4
  );

  const formatAxis = (value: number) => {
    if (Math.abs(value) >= 1_000_000) {
      return `${(value / 1_000_000).toFixed(1)}M`;
    }
    if (Math.abs(value) >= 1_000) {
      return `${(value / 1_000).toFixed(1)}k`;
    }
    return value.toFixed(0);
  };

  return (
    <svg
      viewBox={`0 0 ${W} ${height}`}
      preserveAspectRatio={compact ? "none" : undefined}
      className={compact ? "h-9 w-24" : "h-auto w-full"}
      role="img"
      aria-label="Monthly net cash flow trend in Kenyan shillings"
    >
      {!compact &&
        ticks.map((tick, index) => (
          <g key={index}>
            <line
              x1={left}
              x2={W - right}
              y1={y(tick)}
              y2={y(tick)}
              className="stroke-slate-200 dark:stroke-neutral-800"
              strokeDasharray="3 5"
            />
            <text
              x={left - 10}
              y={y(tick) + 4}
              textAnchor="end"
              className="fill-slate-500 text-[12px] dark:fill-neutral-400"
            >
              {formatAxis(tick)}
            </text>
          </g>
        ))}

      {!compact && min < 0 && max > 0 && (
        <line
          x1={left}
          x2={W - right}
          y1={y(0)}
          y2={y(0)}
          className="stroke-slate-400 dark:stroke-neutral-500"
          strokeWidth={1.2}
        />
      )}

      {lines.map((line, lineIndex) => (
        <g key={lineIndex}>
          <path
            d={path(line.values)}
            fill="none"
            stroke={line.color}
            strokeWidth={compact ? 2.5 : 2.5}
            strokeLinecap="round"
            vectorEffect="non-scaling-stroke"
          />

          {!compact &&
            line.values.map((value, index) => (
              <circle
                key={index}
                cx={x(index, line.values.length)}
                cy={y(value)}
                r={4}
                fill={line.color}
                stroke="currentColor"
                strokeWidth={1.5}
                className="text-white dark:text-neutral-950"
              >
                <title>
                  {`Month ${index + 1}: KES ${value.toLocaleString("en-KE")}`}
                </title>
              </circle>
            ))}
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


function Flow({
  items,
}: {
  items: {
    name: string;
    short: string;
    color: string;
    income: number;
    spent: number;
  }[];
}) {
  const formatMoney = (value: number) =>
    `KES ${value.toLocaleString("en-KE", {
      maximumFractionDigits: 2,
    })}`;

  const active = items.filter(
    (item) => item.income > 0 || item.spent > 0
  );

  if (active.length === 0) {
    return (
      <p className="mt-6 text-sm text-slate-500 dark:text-neutral-400">
        No income or expenses recorded this month yet.
      </p>
    );
  }

  const X0 = 150;
  const X1 = 490;
  const WIDTH = 700;
  const TOP = 24;
  const GAP = 28;
  const MIN_FLOW = 5;

  const maxAmount = Math.max(
    1,
    ...active.flatMap((item) => [
      item.income,
      item.spent,
    ])
  );

  const scale = 68 / maxAmount;

  type FlowPart = {
    label: string;
    amount: number;
    color: string;
    dashed?: boolean;
  };

  const rows = active.map((item) => {
    const income = Math.max(0, item.income);
    const expenses = Math.max(0, item.spent);
    const covered = Math.min(income, expenses);
    const surplus = Math.max(0, income - expenses);
    const shortfall = Math.max(0, expenses - income);

    const parts: FlowPart[] = [];

    if (covered > 0) {
      parts.push({
        label: "Expenses",
        amount: covered,
        color: GOLD,
      });
    }

    if (surplus > 0) {
      parts.push({
        label: "Surplus",
        amount: surplus,
        color: item.color,
      });
    }

    if (shortfall > 0) {
      parts.push({
        label: "Excess expenses",
        amount: shortfall,
        color: "#fb7185",
        dashed: true,
      });
    }

    const flowHeight = (amount: number) =>
      Math.max(MIN_FLOW, amount * scale);

    const partsHeight = parts.reduce(
      (sum, part) => sum + flowHeight(part.amount) + 12,
      0
    );

    return {
      item,
      income,
      expenses,
      net: income - expenses,
      parts,
      height: Math.max(92, partsHeight + 16),
    };
  });

  let cursor = TOP;

  const content = rows.map((row, index) => {
    const y = cursor;
    cursor += row.height + GAP;

    const sourceY = y + row.height / 2;
    const sourceHeight =
      row.income > 0
        ? Math.max(MIN_FLOW, row.income * scale)
        : MIN_FLOW;

    let targetY = y + 10;

    return (
      <g key={`${row.item.name}-${index}`}>
        {/* Source: income */}
        <rect
          x={X0 - 8}
          y={sourceY - sourceHeight / 2}
          width={8}
          height={sourceHeight}
          rx={3}
          fill={row.item.color}
        />

        <text
          x={X0 - 18}
          y={sourceY - 7}
          textAnchor="end"
          className="fill-slate-800 text-[12px] font-semibold dark:fill-neutral-200"
        >
          {row.item.short}
        </text>

        <text
          x={X0 - 18}
          y={sourceY + 10}
          textAnchor="end"
          className="fill-slate-500 text-[10px] dark:fill-neutral-400"
        >
          {formatMoney(row.income)}
        </text>

        {row.parts.map((part, partIndex) => {
          const thickness = Math.max(
            MIN_FLOW,
            part.amount * scale
          );

          const rightY = targetY + thickness / 2;

          // Shortfall is not represented as income.
          // It enters the expenses side separately.
          const leftX = part.dashed ? X0 + 105 : X0;
          const leftY = part.dashed
            ? rightY - 22
            : sourceY;

          const midX = (leftX + X1) / 2;

          const element = (
            <g key={`${part.label}-${partIndex}`}>
              <path
                d={`M${leftX},${leftY}
                    C${midX},${leftY}
                     ${midX},${rightY}
                     ${X1},${rightY}`}
                fill="none"
                stroke={part.color}
                strokeOpacity={part.dashed ? 0.65 : 0.45}
                strokeWidth={thickness}
                className="cursor-pointer transition-allduration-200 hover:opacity-100"
              >
                <title>
                  {`${row.item.name} — ${part.label}: ${formatMoney(
                    part.amount
                  )}`}
                </title>
              </path>

              <rect
                x={X1}
                y={targetY}
                width={8}
                height={thickness}
                rx={3}
                fill={part.color}
              >
                <title>
                  {`${part.label}: ${formatMoney(part.amount)}`}
                </title>
              </rect>

              <text
                x={X1 + 18}
                y={rightY - 3}
                className="fill-slate-700 text-[11px] font-medium dark:fill-neutral-200"
              >
                {part.label}
              </text>

              <text
                x={X1 + 18}
                y={rightY + 11}
                className="fill-slate-500 text-[10px] dark:fill-neutral-400"
              >
                {formatMoney(part.amount)}
              </text>
            </g>
          );

          targetY += thickness + 12;

          return element;
        })}

        <title>
          {`${row.item.name}
Income: ${formatMoney(row.income)}
Expenses: ${formatMoney(row.expenses)}
Net cash flow: ${formatMoney(row.net)}`}
        </title>
      </g>
    );
  });

  const chartHeight = cursor + 12;

  return (
    <div className="mt-4 space-y-3">
      <div className="overflow-x-auto">
        <svg
          viewBox={`0 0 ${WIDTH} ${chartHeight}`}
          className="h-auto w-full min-w-[520px]"
          role="img"
          aria-label="Monthly money flow showing income, expenses, surplus and additional expenses"
        >
          {content}
        </svg>
      </div>

      <div className="flex flex-wrap gap-x-5 gap-y-2 border-t border-slate-100 pt-3 text-[11px] text-slate-500 dark:border-neutral-800 dark:text-neutral-400">
        <span className="flex items-center gap-1.5">
          <span
            className="h-2 w-2 rounded-full"
            style={{ backgroundColor: GOLD }}
          />
          Expenses covered by income
        </span>

        <span className="flex items-center gap-1.5">
          <span className="h-2 w-2 rounded-full bg-emerald-400" />
          Surplus
        </span>

        <span className="flex items-center gap-1.5">
          <span className="h-2 w-2 rounded-full bg-rose-400" />
          Expenses exceeding income
        </span>
      </div>

      <p className="text-[11px] leading-relaxed text-slate-400 dark:text-neutral-500">
        Surplus is income minus expenses when positive.
        Additional expenses indicate spending above this
        month&apos;s income; their funding source is not assumed.
        Hover over a connection to see its amount.
      </p>
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
      : sorted.map(([name, value], index) => ({
          name,
          value,
          color: PALETTE[index % PALETTE.length],
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
                <CashFlowChart
                   months={months.map((m) => `${m.label} ${m.year}`)}
                      lines={visible.map((p) => ({
                      name: p.type === "BUSINESS" ? "Business" : "Personal",
                      color: colorOf(p.type),
                      values: p.series,
                      }))}
                      />
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
              <SpendingDonut segments={spendSegments} total={spendTotal} /> 
            </div>
          </section>

          <section className="grid gap-4 lg:grid-cols-3">
            <div className={`${card} lg:col-span-2`}>
              {view === "all" && (
                <>
                  <h2 className={`${display} text-base`}>Monthly Money Flow</h2>
                  <p className={`mt-1 text-xs ${muted}`}>Income, expenses and monthly surplus across your financial profiles</p>
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