export const MOBILE_NUMBER_ERROR = 'Enter a Philippine mobile number: 09171234567 or +639171234567.';

// Accept common display separators, but never silently discard letters or other characters.
export function normalizeMobileNumber(value) {
  const input = (value ?? '').trim();
  if (!input) return null;
  const compact = input.replace(/[\s-]/g, '');
  if (!/^(09\d{9}|\+639\d{9})$/.test(compact)) {
    throw new Error(MOBILE_NUMBER_ERROR);
  }
  return compact.startsWith('+63') ? `0${compact.slice(3)}` : compact;
}
