import bcrypt from "bcryptjs";

const DEFAULT_SALT_ROUNDS = 12;

/**
 * Hashes a plaintext password (or OTP) with bcrypt.
 *
 * @param plaintext - The plaintext value to hash.
 * @param saltRounds - The bcrypt cost factor. Defaults to 12, matching the
 *   cost factor previously used across the apps for password hashes. Callers
 *   hashing lower-value secrets (e.g. one-time codes) may pass a lower cost
 *   factor to match prior behavior; bcrypt embeds the cost factor in the
 *   resulting hash, so `comparePassword` works regardless of which value was
 *   used to create the hash.
 */
export async function hashPassword(plaintext: string, saltRounds: number = DEFAULT_SALT_ROUNDS): Promise<string> {
  return bcrypt.hash(plaintext, saltRounds);
}

/**
 * Compares a plaintext password (or OTP) against a bcrypt hash.
 */
export async function comparePassword(plaintext: string, hash: string): Promise<boolean> {
  return bcrypt.compare(plaintext, hash);
}
