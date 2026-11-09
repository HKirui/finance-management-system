"use client";

import { signOut } from "next-auth/react";
import { LogOut } from "lucide-react";

export default function LogoutButton() {
  return (
    <button
      type="button"
      onClick={() => signOut({ callbackUrl: "/login" })}
      className="flex w-full items-center gap-3 rounded-lg px-3 py-2 text-left text-[13px] font-medium text-slate-600 transition-colors hover:bg-rose-50 hover:text-rose-600 dark:text-neutral-400 dark:hover:bg-rose-950/40 dark:hover:text-rose-400"
    >
      <LogOut size={17} strokeWidth={1.8} />
      Log out
    </button>
  );
}