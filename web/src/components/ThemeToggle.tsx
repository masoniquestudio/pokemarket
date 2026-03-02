"use client";
import { useState, useEffect } from "react";
import { initTheme, toggleTheme } from "@/lib/theme";

export default function ThemeToggle() {
  const [theme, setTheme] = useState("dark");

  useEffect(() => {
    setTheme(initTheme());
  }, []);

  const handleToggle = () => {
    const next = toggleTheme();
    setTheme(next);
  };

  return (
    <button
      onClick={handleToggle}
      style={{ color: "var(--text-secondary)", border: "1px solid var(--border)" }}
      className="px-3 py-1 text-sm rounded-sm hover:opacity-80 transition-opacity"
    >
      {theme === "dark" ? "☀️ Light" : "🌙 Dark"}
    </button>
  );
}
