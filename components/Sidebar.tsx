"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import ThemeToggle from "@/components/ThemeToggle";
import LogoutButton from "@/components/LogoutButton";

import {
  LayoutDashboard,
  ArrowLeftRight,
  HandHeart,
  WalletCards,
  ChartPie,
  Users,
  FileText,
  ChartNoAxesCombined,
  Settings,
  Landmark,
} from "lucide-react";

const mainNavigation = [
  { name: "Dashboard", href: "/", icon: LayoutDashboard },
  { name: "Transactions", href: "/transactions", icon: ArrowLeftRight },
  { name: "Tithe & Giving", href: "/giving", icon: HandHeart },
  { name: "Accounts", href: "/accounts", icon: WalletCards },
  { name: "Budgets", href: "/budgets", icon: ChartPie },
];

const businessNavigation = [
  { name: "Clients", href: "/clients", icon: Users },
  { name: "Invoices", href: "/invoices", icon: FileText },
];

const utilityNavigation = [
  { name: "Reports", href: "/reports", icon: ChartNoAxesCombined },
  { name: "Settings", href: "/settings", icon: Settings },
];

const groupLabel =
  "mb-2 flex items-center gap-2 px-3 text-[10px] font-bold uppercase tracking-[0.18em] text-slate-400 dark:text-neutral-500";

export default function Sidebar() {
  const pathname = usePathname();

  const navigationLink = (
    item: (typeof mainNavigation)[number]
  ) => {
    const Icon = item.icon;
    const active =
      pathname === item.href ||
      (item.href !== "/" && pathname.startsWith(`${item.href}/`));

    return (
      <Link
        key={item.name}
        href={item.href}
        aria-current={active ? "page" : undefined}
        className={`relative flex items-center gap-3 rounded-lg px-3 py-2 text-[13px] font-medium transition-colors ${
          active
            ? "bg-slate-100 text-slate-950 dark:bg-neutral-800/80 dark:text-white"
            : "text-slate-600 hover:bg-slate-50 hover:text-slate-950 dark:text-neutral-400 dark:hover:bg-neutral-900 dark:hover:text-white"
        }`}
      >
        {active && (
          <span
            aria-hidden
            className="absolute inset-y-2 left-0 w-0.5 rounded-full bg-slate-900 dark:bg-neutral-100"
          />
        )}
        <Icon size={17} strokeWidth={1.8} />
        {item.name}
      </Link>
    );
  };

  return (
    <aside className="sticky top-0 flex h-dvh w-56 shrink-0 flex-col self-start border-r border-slate-200 bg-white text-slate-900 transition-colors dark:border-neutral-800 dark:bg-neutral-950 dark:text-neutral-100">
      {/* Brand */}
      <div className="flex h-16 shrink-0 items-center gap-3 border-b border-slate-200 px-5 dark:border-neutral-800">
        <div className="flex size-8 items-center justify-center rounded-lg bg-slate-900 text-white dark:bg-neutral-100 dark:text-neutral-900">
          <Landmark size={17} />
        </div>

        <div className="leading-tight">
          <p className="font-[family-name:var(--font-fraunces,Georgia)] text-[17px] italic tracking-tight">
            Finance
          </p>
          <p className="text-[9px] font-medium uppercase tracking-[0.18em] text-slate-500 dark:text-neutral-400">
            Management System
          </p>
        </div>
      </div>

      {/* Navigation (scrolls on short screens, the page never does) */}
      <nav aria-label="Main" className="min-h-0 flex-1 overflow-y-auto px-3 py-4">
        <p className={groupLabel}>Overview</p>

        <div className="space-y-0.5">
          {mainNavigation.map(navigationLink)}
        </div>

        <p className={`${groupLabel} mt-6`}>
          <span className="size-1.5 rounded-full bg-indigo-400" />
          K-Link Solutions
        </p>

        <div className="space-y-0.5">
          {businessNavigation.map(navigationLink)}
        </div>
      </nav>

      {/* Footer: always pinned to the bottom of the screen */}
      <div className="shrink-0 border-t border-slate-200 p-3 dark:border-neutral-800">
        <div className="space-y-0.5">
          {utilityNavigation.map(navigationLink)}
        </div>

        <ThemeToggle />

        <div className="mt-2 border-t border-slate-200 pt-2 dark:border-neutral-800">
          <LogoutButton />
        </div>
      </div>
    </aside>
  );
}