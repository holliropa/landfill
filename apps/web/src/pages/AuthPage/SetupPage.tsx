import { type FormEvent, useState } from "react";
import { Button } from "@/ui/Button";
import { SpinnerIcon } from "@/ui/SpinnerIcon";
import { useAuth } from "@/providers";
import { AuthShell } from "./AuthShell";
import styles from "./AuthPage.module.css";

export function SetupPage() {
  const { setup } = useAuth();
  const [setupCode, setSetupCode] = useState("");
  const [password, setPassword] = useState("");
  const [confirmation, setConfirmation] = useState("");
  const [error, setError] = useState<string>();
  const [isSubmitting, setIsSubmitting] = useState(false);

  const handleSubmit = async (event: FormEvent<HTMLFormElement>) => {
    event.preventDefault();
    setError(undefined);

    if (password !== confirmation) {
      setError("Passwords do not match.");
      return;
    }

    setIsSubmitting(true);
    try {
      await setup(setupCode.trim(), password);
    } catch (caught) {
      setError(getErrorMessage(caught));
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <AuthShell>
      <h1 className={styles.title}>Set up your owner account</h1>
      <p className={styles.description}>
        Use the one-time code from the API logs, then choose the password that
        will protect this Landfill instance.
      </p>
      <form className={styles.form} onSubmit={handleSubmit}>
        <label className={styles.field}>
          <span className={styles.label}>One-time setup code</span>
          <input
            className={styles.input}
            value={setupCode}
            onChange={(event) => setSetupCode(event.target.value)}
            autoComplete="one-time-code"
            autoCapitalize="characters"
            spellCheck={false}
            required
            autoFocus
          />
          <span className={styles.hint}>
            With Docker, run <code>docker compose logs api</code> on the host.
          </span>
        </label>
        <label className={styles.field}>
          <span className={styles.label}>Password</span>
          <input
            className={styles.input}
            type="password"
            value={password}
            onChange={(event) => setPassword(event.target.value)}
            autoComplete="new-password"
            minLength={12}
            maxLength={128}
            required
          />
          <span className={styles.hint}>Use at least 12 characters.</span>
        </label>
        <label className={styles.field}>
          <span className={styles.label}>Confirm password</span>
          <input
            className={styles.input}
            type="password"
            value={confirmation}
            onChange={(event) => setConfirmation(event.target.value)}
            autoComplete="new-password"
            minLength={12}
            maxLength={128}
            required
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
          {isSubmitting ? "Setting up…" : "Finish setup"}
        </Button>
      </form>
    </AuthShell>
  );
}

function getErrorMessage(error: unknown) {
  return error instanceof Error ? error.message : "Setup failed. Try again.";
}
