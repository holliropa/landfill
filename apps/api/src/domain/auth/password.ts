import { randomBytes, scrypt, timingSafeEqual } from "node:crypto";

const HASH_VERSION = "scrypt-v1";
const KEY_LENGTH = 64;
const SALT_LENGTH = 16;
const SCRYPT_N = 2 ** 17;
const SCRYPT_R = 8;
const SCRYPT_P = 1;
const SCRYPT_MAX_MEMORY = 256 * 1024 * 1024;

export const PASSWORD_MIN_LENGTH = 12;
export const PASSWORD_MAX_LENGTH = 128;

export function getPasswordValidationError(password: unknown) {
  if (typeof password !== "string") return "Password is required.";
  if (password.length < PASSWORD_MIN_LENGTH) {
    return `Password must be at least ${PASSWORD_MIN_LENGTH} characters.`;
  }
  if (password.length > PASSWORD_MAX_LENGTH) {
    return `Password must be at most ${PASSWORD_MAX_LENGTH} characters.`;
  }

  return null;
}

export async function hashPassword(password: string) {
  const salt = randomBytes(SALT_LENGTH);
  const key = await deriveKey(password, salt, {
    N: SCRYPT_N,
    r: SCRYPT_R,
    p: SCRYPT_P,
  });

  return [
    HASH_VERSION,
    SCRYPT_N,
    SCRYPT_R,
    SCRYPT_P,
    salt.toString("base64url"),
    key.toString("base64url"),
  ].join("$");
}

export async function verifyPassword(password: string, encodedHash: string) {
  const parsed = parsePasswordHash(encodedHash);
  if (!parsed) return false;

  try {
    const actual = await deriveKey(password, parsed.salt, parsed.parameters);
    return (
      actual.length === parsed.expected.length &&
      timingSafeEqual(actual, parsed.expected)
    );
  } catch {
    return false;
  }
}

function parsePasswordHash(encodedHash: string) {
  const [version, nValue, rValue, pValue, saltValue, hashValue, extra] =
    encodedHash.split("$");
  if (
    version !== HASH_VERSION ||
    !nValue ||
    !rValue ||
    !pValue ||
    !saltValue ||
    !hashValue ||
    extra !== undefined
  ) {
    return null;
  }

  const N = Number(nValue);
  const r = Number(rValue);
  const p = Number(pValue);
  if (
    !Number.isInteger(N) ||
    N < 2 ** 14 ||
    N > 2 ** 18 ||
    (N & (N - 1)) !== 0 ||
    !Number.isInteger(r) ||
    r < 1 ||
    r > 32 ||
    !Number.isInteger(p) ||
    p < 1 ||
    p > 16
  ) {
    return null;
  }

  const salt = Buffer.from(saltValue, "base64url");
  const expected = Buffer.from(hashValue, "base64url");
  if (salt.length < SALT_LENGTH || expected.length !== KEY_LENGTH) return null;

  return { parameters: { N, r, p }, salt, expected };
}

function deriveKey(
  password: string,
  salt: Buffer,
  parameters: { N: number; r: number; p: number },
) {
  return new Promise<Buffer>((resolve, reject) => {
    scrypt(
      password,
      salt,
      KEY_LENGTH,
      { ...parameters, maxmem: SCRYPT_MAX_MEMORY },
      (error, derivedKey) => {
        if (error) reject(error);
        else resolve(derivedKey);
      },
    );
  });
}
