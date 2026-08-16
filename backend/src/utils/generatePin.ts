import crypto from 'crypto';

/**
 * Generates a cryptographically secure random 6-digit numeric PIN.
 * Returns a 6-character string from "000000" to "999999" (preserving leading zeros).
 */
export const generatePin = (): string => {
  const pinNumber = crypto.randomInt(0, 1000000);
  return pinNumber.toString().padStart(6, '0');
};

export default generatePin;
