# Cron Jobs Configuration

## Disabled Cron Jobs (Free Tier Limitation)

The following cron jobs are disabled in `vercel.json` due to Vercel free tier limitations.
They can be manually triggered or re-enabled when upgrading to a paid plan.

### 1. Message Processing

- **Endpoint**: `POST /api/messaging/scheduled/process`
- **Schedule**: Every 10 minutes (`*/10 * * * *`)
- **Purpose**: Process and send scheduled messages

### 2. Monthly Payment Generation

- **Endpoint**: `POST /api/payments/generate-monthly`
- **Schedule**: 25th of each month at midnight (`0 0 25 * *`)
- **Purpose**: Automatically generate monthly rent payments for all active tenants

### 3. Payment Reminders

- **Endpoint**: `POST /api/payments/send-reminders`
- **Schedule**: Daily at 9:00 AM (`0 9 * * *`)
- **Purpose**: Send payment reminder emails for upcoming and overdue payments

### 4. Mark Overdue Payments

- **Endpoint**: `POST /api/payments/mark-overdue`
- **Schedule**: Daily at midnight (`0 0 * * *`)
- **Purpose**: Automatically mark payments as OVERDUE when past due date

## Manual Triggering

Until cron jobs are enabled, you can manually trigger these endpoints:

```bash
# Process scheduled messages
curl -X POST https://your-domain.com/api/messaging/scheduled/process

# Generate monthly payments
curl -X POST https://your-domain.com/api/payments/generate-monthly

# Send payment reminders
curl -X POST https://your-domain.com/api/payments/send-reminders

# Mark overdue payments
curl -X POST https://your-domain.com/api/payments/mark-overdue
```

## Re-enabling for Production

When upgrading to a paid Vercel plan, restore the cron configuration in `vercel.json`:

```json
{
  "crons": [
    {
      "path": "/api/messaging/scheduled/process",
      "schedule": "*/10 * * * *"
    },
    {
      "path": "/api/payments/generate-monthly",
      "schedule": "0 0 25 * *"
    },
    {
      "path": "/api/payments/send-reminders",
      "schedule": "0 9 * * *"
    },
    {
      "path": "/api/payments/mark-overdue",
      "schedule": "0 0 * * *"
    }
  ]
}
```
