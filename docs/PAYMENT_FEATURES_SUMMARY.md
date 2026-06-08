# Payment Features Implementation Summary

## 1. Online Payment Transaction Fee (3% Configurable)

### What Was Implemented

- **System Setting**: Added `payment.online_transaction_fee_percentage` (default: 3%)
- **Admin Configuration**: Transaction fee percentage can be changed in admin settings
- **Automatic Calculation**: Fee is automatically calculated for card payments
- **User Notification**: Tenants see a clear warning about the fee before paying

### How It Works

1. **Tenant Payment Flow**:
   - Tenant selects "Pay with Card" option
   - System displays: "Note: A 3% service fee will be added for card payments"
   - Payment summary shows:
     - Original amount: R12,000.00
     - Transaction fee (3%): R360.00
     - Total to pay: R12,360.00
   - Button shows total with fee: "Pay ZAR 12,360.00"

2. **Admin Configuration**:
   - Go to Admin Settings → Subscription/Payment Settings
   - Modify `payment.online_transaction_fee_percentage`
   - Changes apply immediately to all new payment attempts

3. **EFT Payments**:
   - No transaction fee for EFT/bank transfer payments
   - Tenants can avoid the fee by choosing EFT option

### Files Modified/Created

- `lib/services/system-settings.service.ts` - Added payment settings functions
- `app/api/tenant/payments/[id]/route.ts` - Returns transaction fee percentage
- `app/portal/payments/[id]/pay/page.tsx` - Displays fee and calculates total
- `prisma/seed.ts` - Initializes default payment settings

## 2. Secure Banking Details Storage

### What Was Implemented

- **Encryption Service**: AES-256-GCM encryption for banking details
- **Separate Storage**: Banking details moved from User table to EncryptedBankingDetails table
- **Environment Key**: Encryption key stored in environment variables (not in database)
- **API Endpoints**: Secure endpoints for managing banking details

### How It Works

1. **Data Storage**:
   - Banking details are encrypted using AES-256-GCM
   - Stored as base64 encoded encrypted strings
   - Encryption key (32 bytes) stored in `BANKING_ENCRYPTION_KEY` env variable

2. **Security Benefits**:
   - Even with database access, banking details cannot be read without encryption key
   - Encryption key is stored separately from database
   - Each landlord's banking details encrypted independently
   - No plain text banking data in database backups

3. **Banking Details Structure**:
   ```typescript
   {
     bankName: string;
     bankAccountName: string;
     bankAccountNumber: string;
     bankBranchCode: string;
     bankSwiftCode?: string;
     paymentInstructions?: string;
   }
   ```

### Files Created

- `lib/services/banking-encryption.service.ts` - Encryption/decryption service
- `app/api/settings/banking/route.ts` - API for managing banking details
- `scripts/migrate-banking-details.ts` - Migration script for existing data
- Schema: `EncryptedBankingDetails` model

### Database Changes

**Removed from User model**:

- `bankName`
- `bankAccountName`
- `bankAccountNumber`
- `bankBranchCode`
- `bankSwiftCode`
- `paymentInstructions`

**Added new model**:

```prisma
model EncryptedBankingDetails {
  id              String    @id @default(cuid())
  userId          String    @unique
  user            User      @relation(...)
  encryptedData   String    @db.Text  // JSON with all banking details
  createdAt       DateTime  @default(now())
  updatedAt       DateTime  @updatedAt
}
```

## API Endpoints

### Banking Details Management

#### GET /api/settings/banking

Get banking details for logged-in landlord.

**Response**:

```json
{
  "hasBankingDetails": true,
  "bankingDetails": {
    "bankName": "First National Bank",
    "bankAccountName": "Demo User Properties",
    "bankAccountNumber": "62012345678",
    "bankBranchCode": "250655",
    "paymentInstructions": "Use payment reference..."
  }
}
```

#### POST /api/settings/banking

Save/update banking details.

**Request**:

```json
{
  "bankName": "First National Bank",
  "bankAccountName": "My Property Business",
  "bankAccountNumber": "62012345678",
  "bankBranchCode": "250655",
  "bankSwiftCode": "FIRNZAJJ",
  "paymentInstructions": "Use ref as bank ref"
}
```

#### DELETE /api/settings/banking

Delete banking details.

## Environment Variables

### Required

Add to `.env`:

```env
# Banking details encryption key (32 bytes hex)
# Generate with: openssl rand -hex 32
BANKING_ENCRYPTION_KEY=536aa264531487cfbe3b87bae1eaf4fac3f223967dfb6d85814e0688974d4b63
```

### Generate New Key

```bash
openssl rand -hex 32
```

⚠️ **IMPORTANT**:

- Keep this key secret
- Never commit to version control
- If key is lost, encrypted banking details cannot be recovered
- Backup this key securely

## Testing

### Test Transaction Fee

1. Login as tenant: `john.smith@example.com` / `Tenant@123`
2. Go to Payments page
3. Click "Pay Now" on any pending payment
4. Select "Pay with Card"
5. Observe:
   - Warning message about 3% fee
   - Fee calculation in payment summary
   - Total with fee on "Pay" button

### Test EFT (No Fee)

1. Select "Pay with Bank Transfer (EFT)" instead
2. Observe:
   - No transaction fee warning
   - No additional fee added
   - Bank details displayed for manual payment

### Test Banking Details

1. Login as landlord: `demo@propertycrm.com` / `Demo@123`
2. Use API or create settings page to:

   ```bash
   # Get banking details
   curl http://localhost:3000/api/settings/banking \
     -H "Cookie: next-auth.session-token=..."

   # Update banking details
   curl -X POST http://localhost:3000/api/settings/banking \
     -H "Content-Type: application/json" \
     -H "Cookie: next-auth.session-token=..." \
     -d '{
       "bankName": "Standard Bank",
       "bankAccountName": "My Properties",
       "bankAccountNumber": "123456789",
       "bankBranchCode": "051001"
     }'
   ```

## Migration from Plain Text

If you have existing banking details in production:

1. Ensure `BANKING_ENCRYPTION_KEY` is set
2. Run migration script:
   ```bash
   npx tsx scripts/migrate-banking-details.ts
   ```
3. Apply schema changes:
   ```bash
   npx prisma db push --accept-data-loss
   ```

## Admin Configuration

To change transaction fee percentage:

1. Access admin settings panel
2. Navigate to Payment Settings
3. Update `payment.online_transaction_fee_percentage`
4. Value is in percentage (e.g., "3" = 3%, "2.5" = 2.5%)

## Future Enhancements

Potential improvements:

1. **UI for Banking Details**:
   - Create settings page for landlords to manage banking details
   - Form validation for bank account numbers
   - Bank name dropdown with South African banks

2. **Transaction Fee Variations**:
   - Different fees per payment method (Visa vs Mastercard)
   - Tiered fees based on payment amount
   - Special rates for certain landlords

3. **Audit Logging**:
   - Log when banking details are viewed/updated
   - Track who accessed banking information
   - Alert on suspicious access patterns

4. **Key Rotation**:
   - Support for rotating encryption keys
   - Re-encrypt data with new keys
   - Zero-downtime key rotation

## Security Considerations

1. **Encryption Key**:
   - Store in environment variables, not database
   - Use different keys for dev/staging/production
   - Implement key rotation policy
   - Backup keys in secure vault (AWS Secrets Manager, etc.)

2. **Access Control**:
   - Only landlords can view their own banking details
   - Admins can access but should be logged
   - Never send banking details to frontend unless necessary

3. **Compliance**:
   - Banking details are not as sensitive as credit cards (don't need PCI DSS)
   - Still good practice to encrypt for POPIA compliance
   - Consider audit logging for compliance requirements

## 3. PayFast Recurring Subscription Billing

### What Was Implemented

- **PayFast Integration**: Complete payment gateway integration for South African market
- **Recurring Payments**: Automated monthly subscription billing with tokenization
- **Subscription Management**: Initiate, activate, cancel, and track subscriptions
- **Invoice Generation**: Automatic invoice creation with detailed breakdown
- **Billing History**: Complete transaction history with pagination
- **Dynamic Pricing**: R299 base + 4% per property (first 2 properties free)
- **Security**: MD5 signature verification, IP whitelisting, timing-safe comparisons

### How It Works

#### 1. Subscription Flow

**Initial Subscription**:

1. Landlord clicks "Subscribe Now" on subscription page
2. System calculates monthly fee based on active properties
3. Modal shows billing breakdown and features
4. User clicks "Subscribe Now" - redirected to PayFast
5. PayFast processes payment and creates subscription token
6. User redirected back with success/cancelled status
7. PayFast sends ITN webhook to activate subscription

**Recurring Billing**:

1. PayFast automatically charges monthly on billing date
2. ITN webhook notifies system of payment
3. System generates invoice and updates subscription
4. User retains access for next billing period

**Cancellation**:

1. User clicks "Cancel Subscription"
2. System marks subscription as CANCELLED
3. User retains access until end of current billing period
4. No further charges occur

#### 2. Pricing Structure

```
Base Fee:              R299.00/month
First 2 Properties:    FREE
Additional Properties: 4% of monthly rent
  - Minimum:          R99.00/property
  - Maximum:          R999.00/property

Example (5 properties @ R10,000 rent each):
  Base Fee:           R299.00
  Property 1-2:       R0.00 (free)
  Property 3:         R400.00 (4% of R10,000)
  Property 4:         R400.00
  Property 5:         R400.00
  Total Monthly:      R1,499.00
```

#### 3. Webhook Security

All PayFast webhooks are validated using three security checks:

1. **Signature Verification**: MD5 hash with passphrase (timing-safe comparison)
2. **IP Whitelisting**: Request must come from PayFast IP ranges
   - `197.97.145.144/28` (197.97.145.144 - 197.97.145.159)
   - `41.74.179.192/27` (41.74.179.192 - 41.74.179.223)
3. **Amount Verification**: Payment amount must match expected subscription amount

### Database Schema

**PayFastSubscription**:

```prisma
model PayFastSubscription {
  id                    String    @id @default(cuid())
  userId                String    @unique
  payfastToken          String?
  payfastSubscriptionId String?   @unique
  merchantReference     String    @unique
  amount                Decimal   @db.Decimal(10, 2)
  frequency             Int       @default(3)  // Monthly
  cycles                Int       @default(0)  // Infinite
  status                PayFastSubscriptionStatus
  startDate             DateTime?
  nextBillingDate       DateTime?
  lastBillingDate       DateTime?
  cancelledAt           DateTime?
  createdAt             DateTime
  updatedAt             DateTime
}

enum PayFastSubscriptionStatus {
  PENDING    // Payment initiated, awaiting completion
  ACTIVE     // Subscription active, recurring billing
  PAUSED     // Temporarily paused (not implemented)
  CANCELLED  // User cancelled, no more billing
  SUSPENDED  // Payment failed, access restricted
  EXPIRED    // Subscription ended
}
```

**BillingInvoice**:

```prisma
model BillingInvoice {
  id                String    @id @default(cuid())
  userId            String
  invoiceNumber     String    @unique  // Format: INV-YYYYMMDD-XXXXX
  periodStart       DateTime
  periodEnd         DateTime
  baseFee           Decimal   @db.Decimal(10, 2)
  propertyFees      Decimal   @db.Decimal(10, 2)
  totalAmount       Decimal   @db.Decimal(10, 2)
  breakdown         Json?     // Detailed per-property breakdown
  status            InvoiceStatus
  paidAt            DateTime?
  payfastPaymentId  String?
  createdAt         DateTime
  updatedAt         DateTime
}

enum InvoiceStatus {
  PENDING    // Invoice created, payment pending
  PAID       // Payment received
  FAILED     // Payment failed
  REFUNDED   // Payment refunded
  CANCELLED  // Invoice cancelled
}
```

**PayFastTransaction**:

```prisma
model PayFastTransaction {
  id                String    @id @default(cuid())
  userId            String?
  payfastPaymentId  String    @unique
  merchantReference String
  paymentStatus     String    // COMPLETE, FAILED, CANCELLED, PENDING
  amountGross       Decimal   @db.Decimal(10, 2)
  amountFee         Decimal   @db.Decimal(10, 2)
  amountNet         Decimal   @db.Decimal(10, 2)
  itnData           Json      // Full webhook payload
  signatureVerified Boolean
  ipVerified        Boolean
  amountVerified    Boolean
  processedAt       DateTime?
  errorMessage      String?
  createdAt         DateTime
}
```

### Files Created

#### Core Services

- `lib/services/payfast.service.ts` - PayFast integration (signature, validation, payment data)
- `lib/services/billing.service.ts` - Invoice generation and billing history
- `lib/services/subscription.service.ts` - Extended with activation/cancellation functions

#### API Routes

- `app/api/payfast/initiate-subscription/route.ts` - Start subscription payment
- `app/api/webhooks/payfast/route.ts` - Handle ITN callbacks from PayFast
- `app/api/subscription/cancel/route.ts` - Cancel active subscription
- `app/api/billing/history/route.ts` - Get paginated billing history

#### UI Components

- `components/subscription/subscribe-modal.tsx` - Subscription modal with billing breakdown
- `app/(dashboard)/settings/subscription/page.tsx` - Updated with subscribe/cancel buttons
- `app/(dashboard)/settings/billing/page.tsx` - Full billing history page

### API Endpoints

#### POST /api/payfast/initiate-subscription

Initiates a PayFast subscription payment.

**Response**:

```json
{
  "paymentData": {
    "merchant_id": "10000100",
    "merchant_key": "46f0cd694581a",
    "amount": "1499.00",
    "item_name": "DominionDesk Subscription",
    "subscription_type": "1",
    "frequency": "3",
    "cycles": "0",
    "email_address": "landlord@example.com",
    "custom_str1": "user_id",
    "custom_str2": "SUB_USERID_1234567890_ABC123",
    "return_url": "https://app.com/settings/subscription?status=success",
    "cancel_url": "https://app.com/settings/subscription?status=cancelled",
    "notify_url": "https://app.com/api/webhooks/payfast",
    "signature": "abc123..."
  },
  "payfastUrl": "https://sandbox.payfast.co.za/eng/process",
  "merchantReference": "SUB_USERID_1234567890_ABC123",
  "amount": 1499.0
}
```

#### POST /api/webhooks/payfast

Receives ITN (Instant Transaction Notification) from PayFast.

**PayFast Sends**:

```
m_payment_id=123456
pf_payment_id=78910
payment_status=COMPLETE
item_name=DominionDesk Subscription
amount_gross=1499.00
amount_fee=43.47
amount_net=1455.53
custom_str1=user_id
custom_str2=SUB_USERID_1234567890_ABC123
token=abc123def456
subscription_id=1234567
signature=md5hash...
```

**Response**: Always returns 200 OK to prevent retries

#### POST /api/subscription/cancel

Cancels active subscription.

**Request**:

```json
{
  "reason": "Optional cancellation reason"
}
```

**Response**:

```json
{
  "success": true,
  "message": "Subscription cancelled successfully",
  "accessUntil": "2026-03-01T00:00:00Z",
  "details": {
    "status": "CANCELLED",
    "note": "You will retain access until the end of your current billing period"
  }
}
```

#### GET /api/billing/history

Gets paginated billing history.

**Query Params**:

- `page` (default: 1)
- `limit` (default: 10, max: 100)

**Response**:

```json
{
  "invoices": [
    {
      "id": "inv_123",
      "invoiceNumber": "INV-20260202-00001",
      "periodStart": "2026-02-01T00:00:00Z",
      "periodEnd": "2026-02-28T23:59:59Z",
      "baseFee": 299.00,
      "propertyFees": 1200.00,
      "totalAmount": 1499.00,
      "breakdown": [...],
      "status": "PAID",
      "paidAt": "2026-02-01T10:30:00Z",
      "payfastPaymentId": "78910",
      "createdAt": "2026-02-01T00:00:00Z"
    }
  ],
  "total": 12,
  "page": 1,
  "totalPages": 2
}
```

### Environment Variables

Add to `.env`:

```env
# PayFast Payment Gateway Configuration
# Sandbox credentials for testing
PAYFAST_MERCHANT_ID="10000100"
PAYFAST_MERCHANT_KEY="46f0cd694581a"
PAYFAST_PASSPHRASE="your_secure_passphrase"
PAYFAST_SANDBOX="true"  # Set to "false" in production

# Application URL for PayFast callbacks
NEXT_PUBLIC_APP_URL="http://localhost:3000"
```

**Production Setup**:

1. Register at https://www.payfast.co.za/
2. Get production merchant ID and key
3. Set `PAYFAST_SANDBOX="false"`
4. Update `NEXT_PUBLIC_APP_URL` to production domain
5. Configure webhook URL in PayFast dashboard

### PayFast Subscription Parameters

```typescript
{
  merchant_id: "10000100",
  merchant_key: "46f0cd694581a",

  // URLs
  return_url: "https://app.com/settings/subscription?status=success",
  cancel_url: "https://app.com/settings/subscription?status=cancelled",
  notify_url: "https://app.com/api/webhooks/payfast",

  // Item details
  item_name: "DominionDesk Subscription",
  item_description: "Monthly subscription for property management",

  // Amount
  amount: "1499.00",

  // Subscription details
  subscription_type: "1",      // 1 = Subscription
  recurring_amount: "1499.00", // Same as initial amount
  frequency: "3",              // 3 = Monthly (1=Daily, 2=Weekly, 4=Quarterly, 5=Biannually, 6=Annually)
  cycles: "0",                 // 0 = Infinite cycles

  // Customer details
  email_address: "landlord@example.com",

  // Tracking
  custom_str1: "user_id",      // User ID
  custom_str2: "SUB_...",      // Merchant reference

  // Security
  signature: "md5hash..."      // MD5 signature of all parameters
}
```

### Testing

#### 1. Test with PayFast Sandbox

1. **Set environment variables**:

   ```env
   PAYFAST_MERCHANT_ID="10000100"
   PAYFAST_MERCHANT_KEY="46f0cd694581a"
   PAYFAST_PASSPHRASE="jt7NOE43FZPn"
   PAYFAST_SANDBOX="true"
   NEXT_PUBLIC_APP_URL="http://localhost:3000"
   ```

2. **Test subscription initiation**:
   - Login as landlord
   - Navigate to Settings → Subscription
   - Click "Subscribe Now"
   - Review billing in modal
   - Click "Subscribe Now" in modal
   - Should redirect to PayFast sandbox

3. **Test PayFast sandbox payment**:
   - Use any card details (sandbox accepts test cards)
   - Complete payment
   - Should redirect back to app with success message

#### 2. Test Webhook with ngrok

PayFast requires a public URL for webhooks. Use ngrok for local testing:

```bash
# Start ngrok
ngrok http 3000

# You'll get a URL like: https://abc123.ngrok.io
```

**Update notify_url** (temporarily for testing):

```typescript
// In lib/services/payfast.service.ts
notify_url: `https://abc123.ngrok.io/api/webhooks/payfast`,
```

**Test webhook**:

1. Complete payment on PayFast
2. PayFast sends ITN to ngrok URL
3. Check server logs for webhook processing
4. Verify subscription activated in database

#### 3. Test Cancellation

1. Login as landlord with ACTIVE subscription
2. Go to Settings → Subscription
3. Click "Cancel Subscription"
4. Confirm cancellation
5. Verify status changed to CANCELLED
6. Check access retained until billing period end

#### 4. Test Billing History

1. Login as landlord with invoices
2. Go to Settings → Subscription
3. View recent invoices in "Billing History" section
4. Click "View All" to see full history
5. Navigate through pages

### PayFast Test Cards (Sandbox)

Use these test cards in PayFast sandbox:

```
Successful Payment:
- Card Number: 4000 0000 0000 0002
- CVV: Any 3 digits
- Expiry: Any future date

Failed Payment:
- Card Number: 4000 0000 0000 0010
- CVV: Any 3 digits
- Expiry: Any future date
```

### Webhook Validation Flow

```
1. PayFast sends POST to /api/webhooks/payfast
   ↓
2. Extract client IP from headers
   ↓
3. Parse form data
   ↓
4. Verify IP is from PayFast ranges
   ↓
5. Calculate MD5 signature (timing-safe)
   ↓
6. Verify signature matches
   ↓
7. Verify amount matches expected
   ↓
8. Log transaction with validation results
   ↓
9. If valid: Process payment_status
   - COMPLETE: Activate subscription, create invoice
   - FAILED: Mark as past due, send notification
   - CANCELLED: Cancel subscription
   ↓
10. Always return 200 OK (prevent retries)
```

### Subscription Status Workflow

```
TRIAL (User registration)
  ↓
  [User clicks Subscribe]
  ↓
PENDING (Payment initiated)
  ↓
  [PayFast webhook: payment_status=COMPLETE]
  ↓
ACTIVE (Subscription active, recurring billing)
  ↓
  [Monthly: PayFast charges, sends webhook]
  ↓
ACTIVE (Continues monthly)

Alternative paths:
- ACTIVE → CANCELLED (User cancels)
- ACTIVE → SUSPENDED (Payment failed)
- ACTIVE → EXPIRED (End of term, if applicable)
```

### Security Best Practices

1. **Signature Verification**:
   - Always verify MD5 signature before processing
   - Use timing-safe comparison to prevent timing attacks
   - Include passphrase in sandbox mode only

2. **IP Whitelisting**:
   - Only accept webhooks from PayFast IP ranges
   - Log rejected IPs for security monitoring
   - Update IP ranges if PayFast notifies of changes

3. **Amount Verification**:
   - Always verify payment amount matches expected
   - Prevent amount tampering attacks
   - Allow ±R0.01 difference for floating point precision

4. **Error Handling**:
   - Always return 200 OK to PayFast (prevent retries)
   - Log all errors for manual investigation
   - Don't expose internal errors to PayFast

5. **Testing**:
   - Never use production credentials in development
   - Use ngrok for webhook testing locally
   - Test all payment statuses (COMPLETE, FAILED, CANCELLED)

### Troubleshooting

**Webhook not receiving**:

- Check `notify_url` is publicly accessible
- Verify firewall allows PayFast IPs
- Check server logs for rejected requests
- Use ngrok for local testing

**Signature verification failing**:

- Verify `PAYFAST_PASSPHRASE` matches dashboard
- Check sandbox vs production mode matches
- Ensure all parameters included in signature
- Use timing-safe comparison

**Amount mismatch**:

- Verify subscription amount calculation correct
- Check for floating point precision issues
- Ensure currency is ZAR (South African Rand)
- Allow ±R0.01 tolerance for rounding

**Subscription not activating**:

- Check webhook processed successfully
- Verify `payment_status` is "COMPLETE"
- Check database for PayFastSubscription record
- Review server logs for errors

### Admin Monitoring & Management

**Admin Dashboard**: `/admin/subscriptions`

Global admins can monitor all landlord subscriptions and payments in real-time.

#### Summary Metrics:

- **Total MRR**: Monthly recurring revenue from all active subscriptions
- **Total Revenue**: All-time earnings from paid invoices
- **Overdue Payments**: Count of landlords with overdue payments
- **Trial Expired**: Count of landlords with expired trials
- **Due Soon**: Payments due within 7 days
- **Active/Cancelled**: Subscription status distribution

#### Landlord List Features:

1. **Search**: By name, email, or company name
2. **Filters**:
   - Subscription Status (ACTIVE, TRIAL, PAST_DUE, CANCELLED)
   - Payment Status (OVERDUE, TRIAL_EXPIRED, DUE_SOON, CURRENT)
3. **Columns**:
   - Landlord info (name, company, email)
   - Subscription status with days overdue
   - Payment status with failed payment count
   - Property count (total and active)
   - Monthly recurring revenue (MRR)
   - Total revenue from all payments
   - Next billing date with countdown
4. **Actions**: View detailed payment history

#### Landlord Details View:

- Complete subscription information
- PayFast subscription details (merchant ref, amounts, dates)
- Recent invoice history (last 10)
- Payment statistics (total revenue, failed payments)
- Property and tenant counts

#### Payment Status Indicators:

| Status            | Meaning                          | Badge Color |
| ----------------- | -------------------------------- | ----------- |
| **CURRENT**       | Active subscription, no issues   | Green       |
| **DUE_SOON**      | Payment due within 7 days        | Yellow      |
| **OVERDUE**       | Payment overdue, PAST_DUE status | Red         |
| **TRIAL_EXPIRED** | Trial ended, no subscription     | Red         |

#### API Endpoint: GET /api/admin/subscriptions

**Query Parameters**:

- `search` - Search by name, email, company
- `status` - Filter by subscription status
- `paymentStatus` - Filter by payment status (OVERDUE, DUE_SOON, etc.)
- `page` - Page number (default: 1)
- `limit` - Results per page (default: 20)

**Response**:

```json
{
  "subscriptions": [...],
  "summary": {
    "totalLandlords": 150,
    "activeSubscriptions": 120,
    "trialUsers": 20,
    "overduePayments": 5,
    "trialExpired": 3,
    "dueSoon": 8,
    "cancelledSubscriptions": 10,
    "totalMRR": 180000.00,
    "totalRevenue": 1250000.00
  },
  "pagination": {
    "page": 1,
    "limit": 20,
    "total": 150,
    "totalPages": 8
  }
}
```

**Each Subscription Includes**:

- Basic landlord info
- Subscription and payment status
- Property counts
- MRR and total revenue
- PayFast subscription details
- Recent invoices (last 10)
- Calculated payment status with days overdue/until due
- Failed payment count

#### Admin Actions

1. **Monitor Overdue Payments**:
   - Filter by `paymentStatus=OVERDUE`
   - See days overdue for each landlord
   - View payment history and failed attempts
   - Contact landlords directly

2. **Track Trial Conversions**:
   - Filter by `status=TRIAL`
   - Monitor trial expiration dates
   - Identify trial users approaching expiration
   - Follow up with conversion campaigns

3. **Revenue Reporting**:
   - Total MRR across all active subscriptions
   - Total revenue from all paid invoices
   - Per-landlord revenue tracking
   - Failed payment impact analysis

4. **Subscription Management** (via PUT /api/admin/subscriptions):
   - Update subscription status
   - Extend trial periods
   - Manual subscription activation
   - Change subscription tier

### Future Enhancements

1. **Subscription Management**:
   - Pause/resume subscriptions
   - Proration for mid-month changes
   - Upgrade/downgrade plans
   - Free trial period extension

2. **Payment Methods**:
   - Multiple payment methods per landlord
   - Backup payment method for failed charges
   - Payment method expiry notifications

3. **Billing Features**:
   - PDF invoice generation
   - Email invoice on payment
   - Tax/VAT calculation and invoicing
   - Receipt generation

4. **Analytics**:
   - Monthly recurring revenue (MRR) tracking
   - Churn rate analysis
   - Failed payment recovery tracking
   - Subscription lifecycle metrics
   - Revenue forecasting

5. **Notifications**:
   - Email on subscription activation
   - Email on payment failure
   - Reminder before card expiry
   - Monthly invoice emails
   - Admin alerts for overdue payments

6. **Admin Tools**:
   - Bulk email to filtered landlords
   - Export subscription data to CSV
   - Revenue reports by date range
   - Dunning automation for failed payments
   - Refund processing interface

## Support

For issues or questions:

- Banking details not decrypting: Check BANKING_ENCRYPTION_KEY is correct
- Migration errors: Ensure EncryptedBankingDetails table exists before migrating
- Key generation: Use `openssl rand -hex 32`
- PayFast webhooks failing: Verify IP whitelisting and signature generation
- Subscription not activating: Check webhook logs and PayFast dashboard
