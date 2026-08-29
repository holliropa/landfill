import { type FormEvent, useState } from "react";
import { Button } from "@/ui/Button";
import { SpinnerIcon } from "@/ui/SpinnerIcon";
import { useAuth } from "@/providers";
import { AuthShell } from "./AuthShell";
import styles from "./AuthPage.module.css";

export function LoginPage() {
  const { login } = useAuth();
  const [password, setPassword] = useState("");
  const [error, setError] = useState<string>();
  const [isSubmitting, setIsSubmitting] = useState(false);

  const handleSubmit = async (event: FormEvent<HTMLFormElement>) => {
    event.preventDefault();
    setError(undefined);
    setIsSubmitting(true);

    try {
      await login(password);
    } catch (caught) {
      setError(
        caught instanceof Error ? caught.message : "Sign in failed. Try again.",
      );
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <AuthShell>
      <h1 className={styles.title}>Welcome back</h1>
      <p className={styles.description}>
        Sign in with the owner password for this Landfill instance.
      </p>
      <form className={styles.form} onSubmit={handleSubmit}>
        <label className={styles.field}>
          <span className={styles.label}>Password</span>
          <input
            className={styles.input}
            type="password"
            value={password}
            onChange={(event) => setPassword(event.target.value)}
            autoComplete="current-password"
            maxLength={128}
            required
            autoFocus
          />
        </label>
        {error && (
          <p className={styles.error} role="alert">
            {error}
          </p>
        )}
        <Button
          type="submit"
          variant="contained"
          size="large"
          fullWidth
          disabled={isSubmitting}
          startIcon={isSubmitting ? <SpinnerIcon size={17} /> : undefined}
        >
          {isSubmitting ? "Signing in…" : "Sign in"}
        </Button>
      </form>
    </AuthShell>
  );
}
