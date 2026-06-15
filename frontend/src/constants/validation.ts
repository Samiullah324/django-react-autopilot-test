export const PASSWORD_HINT =
  'At least 8 characters with one uppercase letter, one lowercase letter, and one number.';

export function isStrongPassword(value: string): boolean {
  return /[A-Z]/.test(value) && /[a-z]/.test(value) && /\d/.test(value) && value.length >= 8;
}
