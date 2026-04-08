/** Russian mobile display prefix */
export const RU_PHONE_PREFIX = '+7';

/** Max length of formatted string: +7 (XXX) XXX-XX-XX */
export const RU_PHONE_DISPLAY_MAX_LENGTH = 18;

/**
 * Formats input as +7 (XXX) XXX-XX-XX. Strips non-digits; treats leading 7 or 8 as country code.
 */
export function formatPhone(raw: string): string {
  const digits = raw.replace(/\D/g, '');
  const local = digits.startsWith('7')
    ? digits.slice(1)
    : digits.startsWith('8')
      ? digits.slice(1)
      : digits;
  const d = local.slice(0, 10);

  let result = RU_PHONE_PREFIX;
  if (d.length > 0) result += ' (' + d.slice(0, 3);
  if (d.length >= 3) result += ') ' + d.slice(3, 6);
  if (d.length >= 6) result += '-' + d.slice(6, 8);
  if (d.length >= 8) result += '-' + d.slice(8, 10);
  return result;
}

/** Local 10 digits (no country code) extracted from formatted or raw input */
export function ruPhoneLocalDigits(formattedOrRaw: string): string {
  const digits = formattedOrRaw.replace(/\D/g, '');
  if (digits.startsWith('7')) return digits.slice(1, 11);
  if (digits.startsWith('8')) return digits.slice(1, 11);
  return digits.slice(0, 10);
}

/** True when there are exactly 10 digits after +7 / 8 / bare local */
export function isValidRuPhone(formattedOrRaw: string): boolean {
  return ruPhoneLocalDigits(formattedOrRaw).length === 10;
}
