import { createContext } from "react";
import type { AuthStatus } from "@/lib/client/auth";

export type AuthContextValue = {
  status: AuthStatus | undefined;
  isLoading: boolean;
  error: Error | null;
  retry: () => Promise<unknown>;
  setup: (setupCode: string, password: string) => Promise<void>;
  login: (password: string) => Promise<void>;
  logout: () => Promise<void>;
};

export const AuthContext = createContext<AuthContextValue | null>(null);
