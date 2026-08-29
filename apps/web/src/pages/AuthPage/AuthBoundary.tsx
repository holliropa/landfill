import type { PropsWithChildren } from "react";
import { Button } from "@/ui/Button";
import { SpinnerIcon } from "@/ui/SpinnerIcon";
import { useAuth } from "@/providers";
import { AuthShell } from "./AuthShell";
import { LoginPage } from "./LoginPage";
import { SetupPage } from "./SetupPage";
import styles from "./AuthPage.module.css";

export function AuthBoundary({ children }: PropsWithChildren) {
  const { status, isLoading, error, retry } = useAuth();

  if (isLoading) {
    return (
      <AuthShell>
        <div className={styles.status} role="status">
          <SpinnerIcon size={28} />
          <p>Checking authentication…</p>
        </div>
      </AuthShell>
    );
  }

  if (error || !status) {
    return (
      <AuthShell>
        <div className={styles.status}>
          <h1 className={styles.title}>Cannot reach Landfill</h1>
          <p className={styles.description}>
            {error?.message ?? "The authentication status is unavailable."}
          </p>
          <Button variant="contained" onClick={() => void retry()}>
            Try again
          </Button>
        </div>
      </AuthShell>
    );
  }

  if (status.setupRequired) return <SetupPage />;
  if (!status.authenticated) return <LoginPage />;
  return children;
}
