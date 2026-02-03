import crypto from 'crypto';

/**
 * PayFast Service
 * Handles PayFast payment gateway integration including signature generation,
 * verification, and IP validation for recurring subscriptions
 */

interface PayFastConfig {
  merchantId: string;
  merchantKey: string;
  passphrase: string;
  sandbox: boolean;
}

// PayFast IP ranges for webhook validation
const PAYFAST_IP_RANGES = [
  '197.97.145.144/28', // 197.97.145.144 - 197.97.145.159
  '41.74.179.192/27', // 41.74.179.192 - 41.74.179.223
];

/**
 * Get PayFast configuration from environment variables
 */
export function getPayFastConfig(): PayFastConfig {
  return {
    merchantId: process.env.PAYFAST_MERCHANT_ID || '',
    merchantKey: process.env.PAYFAST_MERCHANT_KEY || '',
    passphrase: process.env.PAYFAST_PASSPHRASE || '',
    sandbox: process.env.PAYFAST_SANDBOX === 'true',
  };
}

/**
 * Get PayFast base URL (sandbox or production)
 */
export function getPayFastUrl(): string {
  const config = getPayFastConfig();
  return config.sandbox
    ? 'https://sandbox.payfast.co.za/eng/process'
    : 'https://www.payfast.co.za/eng/process';
}

/**
 * Generate MD5 signature for PayFast parameters
 * Used for securing payment requests and verifying webhooks
 */
export function generateSignature(
  params: Record<string, string | number>,
  passphrase?: string
): string {
  // Remove signature if present and convert all values to strings
  const filteredParams = Object.entries(params)
    .filter(
      ([key, value]) => key !== 'signature' && value !== '' && value !== null && value !== undefined
    )
    .reduce(
      (acc, [key, value]) => {
        acc[key] = String(value);
        return acc;
      },
      {} as Record<string, string>
    );

  // Sort parameters alphabetically
  const sortedKeys = Object.keys(filteredParams).sort();

  // Build signature string
  let signatureString = sortedKeys
    .map((key) => `${key}=${encodeURIComponent(filteredParams[key]).replace(/%20/g, '+')}`)
    .join('&');

  // Add passphrase if provided (sandbox mode)
  if (passphrase) {
    signatureString += `&passphrase=${encodeURIComponent(passphrase).replace(/%20/g, '+')}`;
  }

  // Generate MD5 hash
  return crypto.createHash('md5').update(signatureString).digest('hex');
}

/**
 * Verify PayFast signature (timing-safe comparison)
 * Used to validate webhook requests from PayFast
 */
export function verifySignature(
  params: Record<string, string | number>,
  signature: string,
  passphrase?: string
): boolean {
  const calculatedSignature = generateSignature(params, passphrase);

  // Use timing-safe comparison to prevent timing attacks
  try {
    return crypto.timingSafeEqual(Buffer.from(signature), Buffer.from(calculatedSignature));
  } catch {
    return false;
  }
}

/**
 * Check if IP address is within a CIDR range
 */
function ipInRange(ip: string, cidr: string): boolean {
  const [range, bits] = cidr.split('/');
  const mask = ~(2 ** (32 - parseInt(bits)) - 1);

  const ipNum = ip.split('.').reduce((acc, octet) => (acc << 8) + parseInt(octet), 0) >>> 0;
  const rangeNum = range.split('.').reduce((acc, octet) => (acc << 8) + parseInt(octet), 0) >>> 0;

  return (ipNum & mask) === (rangeNum & mask);
}

/**
 * Verify that the request is coming from PayFast servers
 * Checks against known PayFast IP ranges
 */
export function verifyPayFastIP(ip: string): boolean {
  // Remove port if present (IPv4:port format)
  const cleanIp = ip.split(':')[0];

  // Check against all PayFast IP ranges
  return PAYFAST_IP_RANGES.some((range) => ipInRange(cleanIp, range));
}

/**
 * Build PayFast subscription payment data
 * Returns the complete payment data object ready for form submission
 */
export function buildSubscriptionPaymentData(options: {
  userId: string;
  amount: number;
  itemName: string;
  email: string;
  merchantReference: string;
}): Record<string, string> {
  const config = getPayFastConfig();
  const appUrl = process.env.NEXT_PUBLIC_APP_URL || 'http://localhost:3000';

  const paymentData: Record<string, string> = {
    merchant_id: config.merchantId,
    merchant_key: config.merchantKey,
    return_url: `${appUrl}/settings/subscription?status=success`,
    cancel_url: `${appUrl}/settings/subscription?status=cancelled`,
    notify_url: `${appUrl}/api/webhooks/payfast`,

    // Item details
    item_name: options.itemName,
    item_description: 'Monthly subscription for property management',

    // Amount
    amount: options.amount.toFixed(2),

    // Subscription details
    subscription_type: '1', // Subscription
    recurring_amount: options.amount.toFixed(2), // Same as initial amount
    frequency: '3', // Monthly billing
    cycles: '0', // Infinite cycles

    // Customer details
    email_address: options.email,

    // Custom fields for tracking
    custom_str1: options.userId,
    custom_str2: options.merchantReference,
  };

  // Generate signature
  const signature = generateSignature(paymentData, config.sandbox ? config.passphrase : undefined);

  return {
    ...paymentData,
    signature,
  };
}

/**
 * Generate a unique merchant reference for tracking payments
 */
export function generateMerchantReference(userId: string): string {
  const timestamp = Date.now();
  const random = Math.random().toString(36).substring(2, 8);
  return `SUB_${userId}_${timestamp}_${random}`.toUpperCase();
}

/**
 * Validate PayFast webhook data
 * Performs all necessary security checks:
 * - Signature verification
 * - IP verification
 * - Amount verification
 */
export function validateWebhookData(
  data: Record<string, string | number>,
  signature: string,
  clientIp: string,
  expectedAmount: number
): {
  valid: boolean;
  signatureVerified: boolean;
  ipVerified: boolean;
  amountVerified: boolean;
  errors: string[];
} {
  const config = getPayFastConfig();
  const errors: string[] = [];

  // 1. Verify signature
  const signatureVerified = verifySignature(
    data,
    signature,
    config.sandbox ? config.passphrase : undefined
  );
  if (!signatureVerified) {
    errors.push('Invalid signature');
  }

  // 2. Verify IP
  const ipVerified = verifyPayFastIP(clientIp);
  if (!ipVerified) {
    errors.push('Invalid source IP');
  }

  // 3. Verify amount
  const receivedAmount = parseFloat(String(data.amount_gross || 0));
  const amountVerified = Math.abs(receivedAmount - expectedAmount) < 0.01; // Allow 1 cent difference
  if (!amountVerified) {
    errors.push(`Amount mismatch: expected ${expectedAmount}, received ${receivedAmount}`);
  }

  return {
    valid: errors.length === 0,
    signatureVerified,
    ipVerified,
    amountVerified,
    errors,
  };
}
