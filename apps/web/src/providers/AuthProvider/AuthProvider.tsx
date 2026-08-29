import { useQuery, useQueryClient } from "@tanstack/react-query";
import { type PropsWithChildren, useEffect } from "react";
import {
  getAuthStatus,
  loginOwner,
  logoutOwner,
  setupOwner,
  type AuthStatus,
} from "@/lib/client/auth";
import { AUTHENTICATION_REQUIRED_EVENT } from "@/lib/client/api";
import { AuthContext } from "./AuthContext";

const authStatusKey = ["auth", "status"] as const;

export function AuthProvider({ children }: PropsWithChildren) {
  const queryClient = useQueryClient();
  const statusQuery = useQuery({
    queryKey: authStatusKey,
    queryFn: ({ signal }) => getAuthStatus(signal),
    retry: false,
    staleTime: 30_000,
  });

  useEffect(() => {
    const handleAuthenticationRequired = () => {
      void queryClient.cancelQueries({
        predicate: (query) => query.queryKey[0] !== "auth",
      });
      clearApplicationQueries(queryClient);
      queryClient.setQueryData<AuthStatus>(authStatusKey, {
        setupRequired: false,
        authenticated: false,
      });
      void queryClient.invalidateQueries({ queryKey: authStatusKey });
    };

    window.addEventListener(
      AUTHENTICATION_REQUIRED_EVENT,
      handleAuthenticationRequired,
    );
    return () =>
      window.removeEventListener(
        AUTHENTICATION_REQUIRED_EVENT,
        handleAuthenticationRequired,
      );
  }, [queryClient]);

  const setAuthenticated = (status: AuthStatus) => {
    clearApplicationQueries(queryClient);
    queryClient.setQueryData(authStatusKey, status);
  };

  const value = {
    status: statusQuery.data,
    isLoading: statusQuery.isPending,
    error: statusQuery.error,
    retry: async () => statusQuery.refetch(),
    setup: async (setupCode: string, password: string) => {
      setAuthenticated(await setupOwner(setupCode, password));
    },
    login: async (password: string) => {
      setAuthenticated(await loginOwner(password));
    },
    logout: async () => {
      await logoutOwner();
      clearApplicationQueries(queryClient);
      queryClient.setQueryData<AuthStatus>(authStatusKey, {
        setupRequired: false,
        authenticated: false,
      });
    },
  };

  return <AuthContext.Provider value={value}>{children}</AuthContext.Provider>;
}

function clearApplicationQueries(
  queryClient: ReturnType<typeof useQueryClient>,
) {
  queryClient.removeQueries({
    predicate: (query) => query.queryKey[0] !== "auth",
  });
}
