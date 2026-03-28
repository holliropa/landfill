import {
  type ReactNode,
  useCallback,
  useEffect,
  useMemo,
  useState,
} from "react";
import type { Theme, ThemeContextValue, ThemePreference } from "./types";
import { ThemeContext } from "./ThemeContext";
import {
  getInitialThemePreference,
  getSystemTheme,
  resolveTheme,
} from "./utils";

export function ThemeProvider({ children }: { children: ReactNode }) {
  const [preference, setPreferenceState] = useState<ThemePreference>(
    getInitialThemePreference,
  );
  const [systemTheme, setSystemTheme] = useState<Theme>(getSystemTheme);

  const theme = resolveTheme(preference, systemTheme);

  const setPreference = useCallback((nextPreference: ThemePreference) => {
    if (nextPreference === null) {
      localStorage.removeItem("theme");
    } else {
      localStorage.setItem("theme", nextPreference);
    }

    setPreferenceState(nextPreference);
  }, []);

  const clearPreference = useCallback(() => { 
    setPreference(null);
  }, [setPreference]);

  const toggleTheme = useCallback(() => {
    setPreference(theme === "light" ? "dark" : "light");
  }, [setPreference, theme]);

  useEffect(() => {
    document.documentElement.dataset.theme = theme;
  }, [theme]);

  useEffect(() => {
    const mediaQuery = window.matchMedia("(prefers-color-scheme: dark)");

    const handleChange = (event: MediaQueryListEvent) => {
      setSystemTheme(event.matches ? "dark" : "light");
    };

    mediaQuery.addEventListener("change", handleChange);

    return () => {
      mediaQuery.removeEventListener("change", handleChange);
    };
  }, []);

  const value = useMemo<ThemeContextValue>(
    () => ({
      theme,
      preference,
      setPreference,
      toggleTheme,
      clearPreference,
    }),
    [theme, preference, setPreference, toggleTheme, clearPreference],
  );

  return (
    <ThemeContext.Provider value={value}>{children}</ThemeContext.Provider>
  );
}
