export const THEME_KEYS = ["light", "dark"] as const;

export type Theme = (typeof THEME_KEYS)[number];
export type ThemePreference = Theme | null;

export type ThemeContextValue = {
  theme: Theme;
  preference: ThemePreference;
  setPreference: (preference: ThemePreference) => void;
  toggleTheme: () => void;
  clearPreference: () => void;
};
