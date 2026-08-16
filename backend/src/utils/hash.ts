import crypto from 'crypto';

/**
 * Computes SHA-256 hex digest for a given input string (e.g. 6-digit PIN).
 */
export const hashPin = (pin: string): string => {
  return crypto.createHash('sha256').update(pin).digest('hex');
};

/**
 * Timing-safe comparison of two hash hex strings to prevent timing attacks.
 */
export const compareHashes = (a: string, b: string): boolean => {
  if (!a || !b) return false;
  const bufA = Buffer.from(a, 'hex');
  const bufB = Buffer.from(b, 'hex');
  if (bufA.length !== bufB.length) return false;
  return crypto.timingSafeEqual(bufA, bufB);
};

export default { hashPin, compareHashes };
