import { cleanupExpiredAuthSessions } from "./auth-service";

const CLEANUP_INTERVAL_MS = 10 * 60 * 1000;

export function startAuthMaintenance() {
  const runCleanup = () => {
    try {
      cleanupExpiredAuthSessions();
    } catch (error) {
      console.error("[Auth] Expired session cleanup failed:", error);
    }
  };

  runCleanup();

  const timer = setInterval(runCleanup, CLEANUP_INTERVAL_MS);
  timer.unref();

  return () => clearInterval(timer);
}
