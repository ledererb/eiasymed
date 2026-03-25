/**
 * Hungarian TAJ szám (Social Security Number) validation
 * Format: 9 digits, with a check digit (CDV - weighted sum mod 10)
 * 
 * Algorithm:
 *   - Digits at odd positions (1,3,5,7) are multiplied by 3
 *   - Digits at even positions (2,4,6,8) are multiplied by 7
 *   - Sum of products mod 10 must equal the 9th digit
 */
export function validateTAJ(taj: string): { valid: boolean; error?: string } {
  // Strip spaces and dashes
  const clean = taj.replace(/[\s-]/g, '');

  if (!clean) return { valid: true }; // Empty is OK (optional field)
  
  if (!/^\d{9}$/.test(clean)) {
    return { valid: false, error: 'A TAJ szám pontosan 9 számjegyből áll.' };
  }

  // All zeros is invalid
  if (clean === '000000000') {
    return { valid: false, error: 'Érvénytelen TAJ szám.' };
  }

  // CDV check
  const digits = clean.split('').map(Number);
  let sum = 0;
  for (let i = 0; i < 8; i++) {
    sum += digits[i] * (i % 2 === 0 ? 3 : 7);
  }
  const checkDigit = sum % 10;

  if (checkDigit !== digits[8]) {
    return { valid: false, error: 'Hibás TAJ szám (ellenőrző szám nem egyezik).' };
  }

  return { valid: true };
}

/**
 * Format TAJ number for display: 123 456 789
 */
export function formatTAJ(taj: string): string {
  const clean = taj.replace(/[\s-]/g, '');
  if (clean.length !== 9) return taj;
  return `${clean.slice(0, 3)} ${clean.slice(3, 6)} ${clean.slice(6, 9)}`;
}

/**
 * Check if a patient has sufficient data to start treatment
 * Returns missing fields list
 */
export function checkPatientCompleteness(patient: {
  first_name?: string | null;
  last_name?: string | null;
  birth_date?: string | null;
  taj_number?: string | null;
  phone?: string | null;
  address_street?: string | null;
}): string[] {
  const missing: string[] = [];
  if (!patient.birth_date) missing.push('Születési dátum');
  if (!patient.taj_number) missing.push('TAJ szám');
  if (!patient.phone) missing.push('Telefonszám');
  if (!patient.address_street) missing.push('Lakcím');
  return missing;
}
