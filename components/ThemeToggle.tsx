"use client";

import { Moon, Sun } from "lucide-react";
import { useEffect, useState } from "react";

export default function ThemeToggle() {
  const [dark, setDark] = useState(false);

  useEffect(() => {
    const savedTheme = localStorage.getItem("finance-theme");

    const shouldUseDark =
      savedTheme === "dark" ||
      (!savedTheme &&
        window.matchMedia("(prefers-color-scheme: dark)").matches);

    setDark(shouldUseDark);
    document.documentElement.classList.toggle(
      "dark",
      shouldUseDark
    );
  }, []);

  function toggleTheme() {
    const nextTheme = !document.documentElement.classList.contains("dark");
    const root = document.documentElement;

    root.classList.add("theme-transition");
    root.classList.toggle("dark", nextTheme);

    setDark(nextTheme);
    localStorage.setItem(
      "finance-theme",
      nextTheme ? "dark" : "light"
    );

    window.setTimeout(() => {
      root.classList.remove("theme-transition");
    }, 110);
  }

  return (
    <button
      type="button"
      onClick={toggleTheme}
      role="switch"
      aria-checked={dark}
      aria-label="Dark mode"
      className="flex w-full items-center gap-3 rounded-lg px-3 py-2 text-[13px] font-medium text-slate-600 transition-colors hover:bg-slate-50 hover:text-slate-950 dark:text-neutral-400 dark:hover:bg-neutral-900 dark:hover:text-white"
    >
      {dark ? (
        <Sun size={17} strokeWidth={1.8} />
      ) : (
        <Moon size={17} strokeWidth={1.8} />
      )}

      <span>Dark mode</span>

      <span
        aria-hidden
        className={`ml-auto flex h-4 w-7 shrink-0 items-center rounded-full p-0.5 transition-colors ${
          dark ? "bg-slate-900 dark:bg-neutral-100" : "bg-slate-300"
        }`}
      >
        <span
          className={`size-3 rounded-full bg-white transition-transform dark:bg-neutral-900 ${
            dark ? "translate-x-3" : "translate-x-0"
          }`}
        />
      </span>
    </button>
  );
}