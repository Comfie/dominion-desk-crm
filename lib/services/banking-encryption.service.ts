import crypto from 'crypto';
import { prisma } from '@/lib/db';

/**
 * Banking Encryption Service
 *
 * Provides secure encryption/decryption of banking details using AES-256-GCM.
 * Banking details are never stored in plain text in the database.
 *
 * Environment variables required:
 * - BANKING_ENCRYPTION_KEY: 64-character hex string (32 bytes)
 *   Generate with: openssl rand -hex 32
 */

const ALGORITHM = 'aes-256-gcm';
const IV_LENGTH = 16;
const AUTH_TAG_LENGTH = 16;

interface BankingDetails {
  bankName?: string;
  bankAccountName?: string;
  bankAccountNumber?: string;
  bankBranchCode?: string;
  bankSwiftCode?: string;
  paymentInstructions?: string;
}

/**
 * Get encryption key from environment
 */
function getEncryptionKey(): Buffer {
  const key = process.env.BANKING_ENCRYPTION_KEY;

  if (!key) {
    throw new Error(
      'BANKING_ENCRYPTION_KEY environment variable is not set. ' +
        'Generate one with: openssl rand -hex 32'
    );
  }

  if (key.length !== 64) {
    throw new Error(
      'BANKING_ENCRYPTION_KEY must be exactly 64 hex characters (32 bytes). ' +
        'Generate one with: openssl rand -hex 32'
    );
  }

  return Buffer.from(key, 'hex');
}

/**
 * Encrypt banking details
 */
function encrypt(data: BankingDetails): string {
  const key = getEncryptionKey();
  const iv = crypto.randomBytes(IV_LENGTH);
  const cipher = crypto.createCipheriv(ALGORITHM, key, iv);

  const jsonData = JSON.stringify(data);
  let encrypted = cipher.update(jsonData, 'utf8', 'hex');
  encrypted += cipher.final('hex');

  const authTag = cipher.getAuthTag();

  // Combine iv + authTag + encrypted data
  const combined = Buffer.concat([iv, authTag, Buffer.from(encrypted, 'hex')]);
  return combined.toString('base64');
}

/**
 * Decrypt banking details
 */
function decrypt(encryptedData: string): BankingDetails {
  const key = getEncryptionKey();
  const combined = Buffer.from(encryptedData, 'base64');

  // Extract components
  const iv = combined.subarray(0, IV_LENGTH);
  const authTag = combined.subarray(IV_LENGTH, IV_LENGTH + AUTH_TAG_LENGTH);
  const encrypted = combined.subarray(IV_LENGTH + AUTH_TAG_LENGTH);

  const decipher = crypto.createDecipheriv(ALGORITHM, key, iv);
  decipher.setAuthTag(authTag);

  let decrypted = decipher.update(encrypted.toString('hex'), 'hex', 'utf8');
  decrypted += decipher.final('utf8');

  return JSON.parse(decrypted);
}

/**
 * Save encrypted banking details for a user
 */
export async function saveBankingDetails(userId: string, details: BankingDetails): Promise<void> {
  const encryptedData = encrypt(details);

  await prisma.encryptedBankingDetails.upsert({
    where: { userId },
    create: {
      userId,
      encryptedData,
    },
    update: {
      encryptedData,
    },
  });
}

/**
 * Get decrypted banking details for a user
 */
export async function getBankingDetails(userId: string): Promise<BankingDetails | null> {
  const record = await prisma.encryptedBankingDetails.findUnique({
    where: { userId },
  });

  if (!record) {
    return null;
  }

  try {
    return decrypt(record.encryptedData);
  } catch (error) {
    console.error('Failed to decrypt banking details:', error);
    throw new Error('Failed to decrypt banking details');
  }
}

/**
 * Delete banking details for a user
 */
export async function deleteBankingDetails(userId: string): Promise<void> {
  await prisma.encryptedBankingDetails.delete({
    where: { userId },
  });
}

/**
 * Check if user has banking details set up
 */
export async function hasBankingDetails(userId: string): Promise<boolean> {
  const record = await prisma.encryptedBankingDetails.findUnique({
    where: { userId },
    select: { id: true },
  });

  return !!record;
}

/**
 * Migrate existing plain text banking details to encrypted storage
 * This should be run once to migrate existing data
 */
export async function migratePlainTextBankingDetails(): Promise<{
  migrated: number;
  failed: number;
}> {
  // This would only work if banking details were still in User model
  // Since we're removing them, this is a template for future use
  console.log('Migration would extract existing banking details from User model');
  console.log('and encrypt them into EncryptedBankingDetails table');

  return { migrated: 0, failed: 0 };
}
