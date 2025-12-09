# System Test Plan & UAT Checklist

This document serves as a comprehensive checklist for User Acceptance Testing (UAT). Use it to verify that all system features are functioning as expected.

## Legend

- `[ ]` Pending
- `[x]` Passed
- `[!]` Failed / Issue Found
- `[-]` Not Applicable / Skipped

---

## 1. Authentication & Account Management

### 1.1 Login & Registration

- [ ] **Sign Up**: Register a new account with valid details.
- [ ] **Sign Up Validation**: Try registering with invalid email or short password (expect errors).
- [ ] **Login**: Log in with valid credentials.
- [ ] **Login Validation**: Try logging in with incorrect password/email.
- [ ] **Redirect**: Ensure successful login redirects to the Dashboard.

### 1.2 Password Recovery

- [ ] **Forgot Password**: Request a password reset link via email.
- [ ] **Reset Password**: Click email link and successfully set a new password.
- [ ] **Login with New Password**: Verify login works with the new password.

### 1.3 User Profile & Settings

- [ ] **View Profile**: Navigate to Settings -> Profile.
- [ ] **Update Profile**: Change name or contact details and save.
- [ ] **Change Password**: Navigate to Settings -> Security and update password.
- [ ] **Two-Factor Auth (if available)**: Enable/Disable 2FA.

---

## 2. Dashboard & Navigation

### 2.1 Overview

- [ ] **Stats Loading**: Verify dashboard cards (Properties, Tenants, etc.) load correct numbers.
- [ ] **Graphs/Charts**: Ensure charts render without errors.
- [ ] **Recent Activity**: Check if recent actions are logged in the feed.

### 2.2 Navigation

- [ ] **Sidebar Links**: Click all sidebar links; ensure executing correct routing.
- [ ] **Mobile Menu**: Test responsive menu on smaller screens.
- [ ] **Active State**: Ensure current page is highlighted in the menu.

---

## 3. Property Management

### 3.1 Property Listing

- [ ] **View List**: Properties load in the list view.
- [ ] **Pagination**: Navigate between pages of properties (if > 10 items).
- [ ] **Search/Filter**: Search for a specific property by name or address.

### 3.2 Add Property

- [ ] **Create Form**: Open "Add Property" form.
- [ ] **Validation**: Try submitting empty form.
- [ ] **Success**: Fill all fields, upload image, submit. Verify redirected to property or list.
- [ ] **Data Verification**: Confirm the new property appears in the list.

### 3.3 Property Details

- [ ] **View Details**: Click a property to view comprehensive details.
- [ ] **Edit Property**: Update details (e.g., name, units count) and save.
- [ ] **Delete Property**: Delete a test property (confirm warning dialog).

---

## 4. Tenant Management

### 4.1 Tenant Listing

- [ ] **View List**: Tenants load correctly.
- [ ] **Search**: Find tenant by name/email.

### 4.2 Tenant Operations

- [ ] **Add Tenant**: Create a new tenant record.
- [ ] **Assign Property**: Link tenant to a specific Property/Unit.
- [ ] **Lease Dates**: Set lease start and end dates.
- [ ] **Edit Tenant**: Update contact info.
- [ ] **Archive/Move-out**: Process a tenant move-out.

---

## 5. Financial Management

### 5.1 Income & Payments

- [ ] **Record Payment**: Manually record a rent payment for a tenant.
- [ ] **Receipt Generation**: Generate/Resend receipt for a payment.
- [ ] **Overdue Tracking**: Verify overdue payments are flagged.

### 5.2 Expenses

- [ ] **Log Expense**: Add a new expense record (e.g., "Plumbing Repair").
- [ ] **Categorization**: Assign category (Maintenance, Utilities, etc.).
- [ ] **Expense Listing**: View tracking of all expenses.

### 5.3 Reports

- [ ] **Financial Summary**: View Income vs Expenses report.
- [ ] **Date Filtering**: Filter reports by month/year.

---

## 6. Maintenance & Tasks

### 6.1 Maintenance Requests

- [ ] **Create Request**: Log a new maintenance issue.
- [ ] **View List**: See all active requests.
- [ ] **Status Update**: Change status (e.g., Pending -> In Progress -> Completed).

### 6.2 Task Integration

- [ ] **Create Task**: Generate a task from a maintenance request.
- [ ] **Sync**: Verify task completion updates the maintenance request status (if feature enabled).
- [ ] **Task Board**: View tasks in key task management view.

---

## 7. Communication & Other

### 7.1 Messages

- [ ] **Inbox**: View incoming messages/inquiries.
- [ ] **Reply**: Send a reply to a message.

### 7.2 Notifications

- [ ] **Alerts**: Check for system notifications (e.g., New Expense, Lease Expiry).
- [ ] **Mark Read**: Mark notifications as read.

### 7.3 Documents

- [ ] **Upload**: Upload a document (lease, contract).
- [ ] **Download**: Retrieve a stored document.

---

## 8. Admin & System Settings

### 8.1 System Configurations

- [ ] **Banking Settings**: Configure bank account details.
- [ ] **Integrations**: Check status of external services (Stripe, etc.).

### 8.2 User Management (Admin Only)

- [ ] **List Users**: View all system users (Landlords, Tenants).
- [ ] **Create Admin**: Create a new admin/landlord account.
- [ ] **Roles**: specific verify role-based access limits (if applicable).

### 8.3 Subscription

- [ ] **Plan View**: View current subscription tier.
- [ ] **Billing History**: View past invoices.
