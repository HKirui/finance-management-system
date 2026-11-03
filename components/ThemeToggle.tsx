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
    const nextTheme = !dark;

    setDark(nextTheme);

    document.documentElement.classList.toggle(
      "dark",
      nextTheme
    );

    localStorage.setItem(
      "finance-theme",
      nextTheme ? "dark" : "light"
    );
  }

  return (
    <button
      type="button"
      onClick={toggleTheme}
      className="flex w-full items-center gap-3 rounded-lg px-3 py-2.5 text-sm font-medium text-gray-600 transition hover:bg-gray-100 hover:text-gray-900 dark:text-neutral-400 dark:hover:bg-neutral-900 dark:hover:text-white"
    >
      {dark ? <Sun size={18} /> : <Moon size={18} />}

      <span>
        {dark ? "Light Mode" : "Dark Mode"}
      </span>
    </button>
  );
}