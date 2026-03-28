import { type Theme, THEME_KEYS, type ThemePreference } from "./types";

function isTheme(value: string): value is Theme {
  return THEME_KEYS.includes(value as Theme);
}

export function getSystemTheme(): Theme {
  return window.matchMedia("(prefers-color-scheme: dark)").matches
    ? "dark"
    : "light";
}

export function getInitialThemePreference(): ThemePreference {
  const savedTheme = localStorage.getItem("theme");

  if (savedTheme && isTheme(savedTheme)) return savedTheme;

  return null;
}

export function resolveTheme(
  preference: ThemePreference,
  systemTheme: Theme,
): Theme {
  return preference ?? systemTheme;
}
