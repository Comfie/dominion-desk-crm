/**
 * Password utility functions for secure password generation and validation
 */

/**
 * Generate a secure random password
 * @param length - Password length (default: 12)
 * @returns Generated password
 */
export function generateSecurePassword(length: number = 12): string {
  const lowercase = 'abcdefghijklmnopqrstuvwxyz';
  const uppercase = 'ABCDEFGHIJKLMNOPQRSTUVWXYZ';
  const numbers = '0123456789';
  const symbols = '!@#$%^&*()_+-=[]{}|;:,.<>?';

  const allChars = lowercase + uppercase + numbers + symbols;

  let password = '';

  // Ensure at least one character from each category
  password += lowercase[Math.floor(Math.random() * lowercase.length)];
  password += uppercase[Math.floor(Math.random() * uppercase.length)];
  password += numbers[Math.floor(Math.random() * numbers.length)];
  password += symbols[Math.floor(Math.random() * symbols.length)];

  // Fill the rest randomly
  for (let i = password.length; i < length; i++) {
    password += allChars[Math.floor(Math.random() * allChars.length)];
  }

  // Shuffle the password to randomize positions
  return password
    .split('')
    .sort(() => Math.random() - 0.5)
    .join('');
}

/**
 * Validate password strength
 * @param password - Password to validate
 * @returns Validation result with success flag and error message if invalid
 */
export function validatePasswordStrength(password: string): {
  isValid: boolean;
  errors: string[];
} {
  const errors: string[] = [];

  if (password.length < 8) {
    errors.push('Password must be at least 8 characters long');
  }

  if (!/[a-z]/.test(password)) {
    errors.push('Password must contain at least one lowercase letter');
  }

  if (!/[A-Z]/.test(password)) {
    errors.push('Password must contain at least one uppercase letter');
  }

  if (!/\d/.test(password)) {
    errors.push('Password must contain at least one number');
  }

  if (!/[!@#$%^&*()_+\-=\[\]{}|;:,.<>?]/.test(password)) {
    errors.push('Password must contain at least one special character');
  }

  return {
    isValid: errors.length === 0,
    errors,
  };
}

/**
 * Get password strength score
 * @param password - Password to score
 * @returns Strength score from 0-4 (0=very weak, 4=very strong)
 */
export function getPasswordStrength(password: string): {
  score: number;
  label: 'Very Weak' | 'Weak' | 'Fair' | 'Good' | 'Strong';
} {
  let score = 0;

  // Length check
  if (password.length >= 8) score++;
  if (password.length >= 12) score++;
  if (password.length >= 16) score++;

  // Character variety
  if (/[a-z]/.test(password) && /[A-Z]/.test(password)) score++;
  if (/\d/.test(password)) score++;
  if (/[!@#$%^&*()_+\-=\[\]{}|;:,.<>?]/.test(password)) score++;

  // Normalize to 0-4 scale
  const normalizedScore = Math.min(4, Math.floor((score / 6) * 4));

  const labels: Array<'Very Weak' | 'Weak' | 'Fair' | 'Good' | 'Strong'> = [
    'Very Weak',
    'Weak',
    'Fair',
    'Good',
    'Strong',
  ];

  return {
    score: normalizedScore,
    label: labels[normalizedScore],
  };
}
