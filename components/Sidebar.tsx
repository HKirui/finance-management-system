import Link from "next/link";
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
  LogOut,
} from "lucide-react";

const mainNavigation = [
  {
    name: "Dashboard",
    href: "/",
    icon: LayoutDashboard,
  },
  {
    name: "Transactions",
    href: "/transactions",
    icon: ArrowLeftRight,
  },
  {
    name: "Tithe & Giving",
    href: "/giving",
    icon: HandHeart,
  },
  {
    name: "Accounts",
    href: "/accounts",
    icon: WalletCards,
  },
  {
    name: "Budgets",
    href: "/budgets",
    icon: ChartPie,
  },
];

const businessNavigation = [
  {
    name: "Clients",
    href: "/clients",
    icon: Users,
  },
  {
    name: "Invoices",
    href: "/invoices",
    icon: FileText,
  },
];

export default function Sidebar() {
  return (
    <aside className="flex min-h-screen w-64 flex-col border-r border-gray-200 bg-white">
      <div className="flex h-20 items-center gap-3 border-b border-gray-200 px-6">
        <div className="flex h-10 w-10 items-center justify-center rounded-xl bg-gray-900 text-white">
          <Landmark size={21} />
        </div>

        <div>
          <p className="font-bold text-gray-900">Finance</p>
          <p className="text-xs text-gray-500">Management System</p>
        </div>
      </div>

      <nav className="flex-1 px-4 py-6">
        <p className="mb-3 px-3 text-xs font-semibold uppercase tracking-wider text-gray-400">
          Overview
        </p>

        <div className="space-y-1">
          {mainNavigation.map((item) => {
            const Icon = item.icon;

            return (
             <Link
               key={item.name}
                href={item.href}
                  className="flex w-full items-center gap-3 rounded-lg px-3 py-2.5 text-left text-sm font-medium text-gray-600 transition hover:bg-gray-100 hover:text-gray-900"
                     >
                        <Icon size={19} />
                            {item.name}
                              </Link>
                                 );
                                    })}
                                  </div>

        <p className="mb-3 mt-8 px-3 text-xs font-semibold uppercase tracking-wider text-gray-400">
          K-Link Solutions
        </p>

        <div className="space-y-1">
          {businessNavigation.map((item) => {
            const Icon = item.icon;

            return (
              <Link
                  key={item.name}
                    href={item.href}
                      className="flex w-full items-center gap-3 rounded-lg px-3 py-2.5 text-left text-sm font-medium text-gray-600 transition hover:bg-gray-100 hover:text-gray-900"
                         >
                            <Icon size={19} />
                             {item.name}
                               </Link>
            );
          })}
        </div>
      </nav>

      <div className="border-t border-gray-200 p-4">
        <button className="flex w-full items-center gap-3 rounded-lg px-3 py-2.5 text-sm font-medium text-gray-600 hover:bg-gray-100">
          <ChartNoAxesCombined size={19} />
          Reports
        </button>

        <button className="mt-1 flex w-full items-center gap-3 rounded-lg px-3 py-2.5 text-sm font-medium text-gray-600 hover:bg-gray-100">
          <Settings size={19} />
          Settings
        </button>

        <ThemeToggle />

        <div className="mt-3 border-t border-gray-200 pt-3">
            <LogoutButton />
        </div>
      </div>
    </aside>
  );
}