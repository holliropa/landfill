import config from "@/config";

export type AuthStatus = {
  setupRequired: boolean;
  authenticated: boolean;
};

export class AuthRequestError extends Error {
  readonly status: number;

  constructor(message: string, status: number) {
    super(message);
    this.name = "AuthRequestError";
    this.status = status;
  }
}

export function getAuthStatus(signal?: AbortSignal) {
  return requestAuth("/status", { signal });
}

export function setupOwner(setupCode: string, password: string) {
  return requestAuth("/setup", {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({ setupCode, password }),
  });
}

export function loginOwner(password: string) {
  return requestAuth("/login", {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({ password }),
  });
}

export async function logoutOwner() {
  const response = await fetch(`${config.api.url}/auth/logout`, {
    method: "POST",
    credentials: "same-origin",
  });

  if (!response.ok && response.status !== 401) {
    throw await toAuthError(response);
  }
}

async function requestAuth(path: string, init?: RequestInit) {
  const response = await fetch(`${config.api.url}/auth${path}`, {
    ...init,
    credentials: "same-origin",
  });

  if (!response.ok) throw await toAuthError(response);
  return (await response.json()) as AuthStatus;
}

async function toAuthError(response: Response) {
  let message = "Authentication request failed";

  try {
    const body = (await response.json()) as { error?: unknown };
    if (typeof body.error === "string") message = body.error;
  } catch {
    // Keep the generic message when the server did not return JSON.
  }

  return new AuthRequestError(message, response.status);
}
