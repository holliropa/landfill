const MAX_FAILURES = 5;
const WINDOW_MS = 15 * 60 * 1000;

const failures = new Map<string, number[]>();

export function getRateLimitRetryAfterSeconds(key: string, now = Date.now()) {
  const recentFailures = getRecentFailures(key, now);
  if (recentFailures.length < MAX_FAILURES) return 0;

  return Math.max(1, Math.ceil((recentFailures[0] + WINDOW_MS - now) / 1000));
}

export function recordAuthFailure(key: string, now = Date.now()) {
  const recentFailures = getRecentFailures(key, now);
  recentFailures.push(now);
  failures.set(key, recentFailures);
}

export function clearAuthFailures(key: string) {
  failures.delete(key);
}

function getRecentFailures(key: string, now: number) {
  const cutoff = now - WINDOW_MS;
  const recentFailures = (failures.get(key) ?? []).filter(
    (timestamp) => timestamp > cutoff,
  );

  if (recentFailures.length === 0) failures.delete(key);
  else failures.set(key, recentFailures);

  return recentFailures;
}
