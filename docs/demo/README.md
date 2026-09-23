# Demo data (test.dominiondesk.com)

Refresh before any demo so every date is current:

```bash
DEMO_REFRESH_CONFIRM_HOST=gondola.proxy.rlwy.net:11985 npx tsx prisma/seed-demo-refresh.ts
```

The script only touches `@mailinator.com` demo accounts, refuses to run unless the
host is confirmed, and regenerates `sample-bank-statement.csv` to match the new data.
Real client workspaces on the test database are never modified.

## Logins

- Landlord: `landlord.propertycrm@mailinator.com` (existing password, unchanged)
- Tenants: `<first>.<last>.dd@mailinator.com` (e.g. `thandi.moyo.dd@mailinator.com`),
  password printed by the script (or set `DEMO_TENANT_PASSWORD`)

## The story (current month)

| Tenant           | Unit                     | Rent    | State before upload | On statement                                         |
| ---------------- | ------------------------ | ------- | ------------------- | ---------------------------------------------------- |
| Thandi Moyo      | Loveday Court Unit 2     | R8 500  | Overdue             | Reference DD-7K3M9Q → strong match                   |
| Pieter Botha     | Melville Cottage         | R9 200  | Overdue             | Own reference → strong match; lease ends in ~38 days |
| Sipho Dube       | Loveday Court Unit 5     | R7 200  | Overdue             | Surname + amount → possible match                    |
| Ayesha Patel     | Fourways Gardens 18      | R14 500 | Overdue             | Surname + amount → possible match                    |
| Lerato Khumalo   | 12 Jan Smuts Ave Cottage | R6 500  | Overdue             | R3 000 partial → stays short R3 500                  |
| Johan van Wyk    | Loveday Court Unit 7     | R9 800  | Overdue             | Nothing → stays in arrears                           |
| Nomvula Mahlangu | Loveday Court Unit 3     | R7 900  | Already paid        | —                                                    |

Also on the statement: a R950 cash deposit and bank interest (mark "Not rent"),
plus debits that are ignored. Menlyn Maine Studio 407 is vacant with a viewing enquiry.

## 10-minute demo flow

1. Dashboard: overdue rent, "Who has paid this month?" card.
2. Financials → Bank Reconciliation → upload `sample-bank-statement.csv`.
3. "Confirm 2 strong matches", then review the two possible matches and confirm.
4. Lerato shows as partially paid; Johan remains in arrears. Open Rent Collection.
5. Tenant references card → "Send" opens WhatsApp with the message.
6. Log in as `thandi.moyo.dd@mailinator.com` to show the portal and reference.
7. Tasks: lease renewal (Pieter) and arrears follow-up (Johan). Maintenance: geyser job.

Re-run the refresh script to reset for the next demo.
