"use client";

import { Moon, Sun } from "lucide-react";
import { useLayoutEffect, useState } from "react";
import { Button } from "@/components/ui/button";

export const THEME_STORAGE_KEY = "theme";

function currentlyDark() {
  const stored = localStorage.getItem(THEME_STORAGE_KEY);
  return stored ? stored === "dark" : window.matchMedia("(prefers-color-scheme: dark)").matches;
}

function applyTheme(theme: "light" | "dark") {
  document.documentElement.classList.toggle("dark", theme === "dark");
  localStorage.setItem(THEME_STORAGE_KEY, theme);
}

export function ThemeToggle() {
  const [theme, setTheme] = useState<"light" | "dark" | null>(null);

  // The no-flash script sets the class before hydration, but a dev-mode
  // Strict Mode remount resets <html> to only its JSX-managed class,
  // clearing it — re-apply here (no-op in production) via useLayoutEffect
  // so it happens before paint rather than after, like useEffect would.
  useLayoutEffect(() => {
    const dark = currentlyDark();
    document.documentElement.classList.toggle("dark", dark);
    // eslint-disable-next-line react-hooks/set-state-in-effect
    setTheme(dark ? "dark" : "light");
  }, []);

  return (
    <Button
      type="button"
      variant="ghost"
      size="icon-sm"
      aria-label="Toggle theme"
      onClick={() => {
        const next = theme === "dark" ? "light" : "dark";
        applyTheme(next);
        setTheme(next);
      }}
    >
      {theme === "dark" ? <Sun /> : <Moon />}
    </Button>
  );
}
