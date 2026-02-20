"use client";

import { useTheme } from "next-themes";
import { useEffect, useState } from "react";
import { Button } from "@/components/ui/Button";

export function ThemeToggle() {
  const { theme, setTheme, resolvedTheme } = useTheme();
  const [mounted, setMounted] = useState(false);

  useEffect(() => setMounted(true), []);
  if (!mounted) return null;

  const isDark = (theme === "dark") || (theme === "system" && resolvedTheme === "dark");

  return (
    <Button
      variant="secondary"
      onClick={() => setTheme(isDark ? "light" : "dark")}
      className="min-w-[110px]"
    >
      {isDark ? "Light mode" : "Dark mode"}
    </Button>
  );
}
