export function sanitizeName(name: string): string {
  return name
    .trim()
    .replace(/[<>&"'`\\\/]/g, "")
    .substring(0, 100);
}

export function validateDni(dni: string): { valid: boolean; cleaned: string } {
  const cleaned = dni.replace(/\D/g, "");
  const valid = cleaned.length >= 7 && cleaned.length <= 8;
  return { valid, cleaned };
}

export function validatePhone(phone: string): {
  valid: boolean;
  cleaned: string;
} {
  const cleaned = phone.replace(/\D/g, "");
  const valid = cleaned.length >= 10 && cleaned.length <= 13;
  return { valid, cleaned };
}

export function validateName(name: string): boolean {
  const sanitized = sanitizeName(name);
  return sanitized.length >= 2 && sanitized.length <= 100;
}
