"use client";

import { createContext, useContext, useEffect, useSyncExternalStore, ReactNode } from "react";

interface ThemeContextType {
  isDark: boolean;
  toggleTheme: () => void;
}

const ThemeContext = createContext<ThemeContextType>({ isDark: false, toggleTheme: () => {} });

const THEME_EVENT = "dsa-theme-change";

function subscribe(callback: () => void) {
  window.addEventListener("storage", callback);
  window.addEventListener(THEME_EVENT, callback);
  return () => {
    window.removeEventListener("storage", callback);
    window.removeEventListener(THEME_EVENT, callback);
  };
}

export function ThemeProvider({ children }: { children: ReactNode }) {
  const isDark = useSyncExternalStore(
    subscribe,
    () => localStorage.getItem("dsa-theme") === "dark",
    () => false,
  );

  useEffect(() => {
    document.documentElement.setAttribute("data-theme", isDark ? "dark" : "light");
  }, [isDark]);

  const toggleTheme = () => {
    localStorage.setItem("dsa-theme", isDark ? "light" : "dark");
    window.dispatchEvent(new Event(THEME_EVENT));
  };

  return <ThemeContext.Provider value={{ isDark, toggleTheme }}>{children}</ThemeContext.Provider>;
}

export const useTheme = () => useContext(ThemeContext);
