/**
 * Generate a secure password for tenant portal access
 * Format: FirstLastYYYY! (e.g., JohnDoe2025!)
 *
 * @param firstName - Tenant's first name
 * @param lastName - Tenant's last name
 * @returns Generated password string
 */
export function generateTenantPassword(firstName: string, lastName: string): string {
  const currentYear = new Date().getFullYear();

  // Capitalize first letter of each name, lowercase the rest
  const cleanFirstName = firstName.charAt(0).toUpperCase() + firstName.slice(1).toLowerCase();
  const cleanLastName = lastName.charAt(0).toUpperCase() + lastName.slice(1).toLowerCase();

  // Format: FirstLastYYYY!
  const password = `${cleanFirstName}${cleanLastName}${currentYear}!`;

  return password;
}

/**
 * Generate a random secure password with specific requirements
 * This is a fallback option if needed for other use cases
 *
 * @param length - Length of password (default 12)
 * @returns Random password string
 */
export function generateRandomPassword(length: number = 12): string {
  const uppercase = 'ABCDEFGHIJKLMNOPQRSTUVWXYZ';
  const lowercase = 'abcdefghijklmnopqrstuvwxyz';
  const numbers = '0123456789';
  const symbols = '!@#$%^&*';
  const allChars = uppercase + lowercase + numbers + symbols;

  // Ensure at least one of each type
  let password = '';
  password += uppercase[Math.floor(Math.random() * uppercase.length)];
  password += lowercase[Math.floor(Math.random() * lowercase.length)];
  password += numbers[Math.floor(Math.random() * numbers.length)];
  password += symbols[Math.floor(Math.random() * symbols.length)];

  // Fill the rest randomly
  for (let i = password.length; i < length; i++) {
    password += allChars[Math.floor(Math.random() * allChars.length)];
  }

  // Shuffle the password
  return password
    .split('')
    .sort(() => Math.random() - 0.5)
    .join('');
}
