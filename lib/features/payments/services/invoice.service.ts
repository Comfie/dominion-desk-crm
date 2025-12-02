import { PaymentWithDetails } from '../repositories/payment.repository';

/**
 * Invoice Service
 * Handles invoice generation (HTML-based for email and display)
 */
export class InvoiceService {
  /**
   * Generate HTML invoice for email
   */
  generateInvoiceHTML(payment: PaymentWithDetails): string {
    const property = payment.property || payment.tenant?.properties?.[0]?.property;
    const tenant = payment.tenant;
    const organization = payment.user;

    // Format currency
    const formatCurrency = (amount: number | string) => {
      const num = typeof amount === 'string' ? parseFloat(amount) : amount;
      return new Intl.NumberFormat('en-ZA', {
        style: 'currency',
        currency: payment.currency || 'ZAR',
      }).format(num);
    };

    // Format date
    const formatDate = (date: Date | null | undefined) => {
      if (!date) return 'N/A';
      return new Intl.DateTimeFormat('en-ZA', {
        year: 'numeric',
        month: 'long',
        day: 'numeric',
      }).format(new Date(date));
    };

    return `
<!DOCTYPE html>
<html lang="en">
<head>
  <meta charset="UTF-8">
  <meta name="viewport" content="width=device-width, initial-scale=1.0">
  <title>Invoice ${payment.invoiceNumber || payment.paymentReference}</title>
  <style>
    body {
      font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, 'Helvetica Neue', Arial, sans-serif;
      line-height: 1.6;
      color: #333;
      max-width: 800px;
      margin: 0 auto;
      padding: 20px;
      background-color: #f5f5f5;
    }
    .invoice-container {
      background-color: white;
      border-radius: 8px;
      box-shadow: 0 2px 4px rgba(0,0,0,0.1);
      padding: 40px;
    }
    .invoice-header {
      border-bottom: 3px solid #2563eb;
      padding-bottom: 20px;
      margin-bottom: 30px;
    }
    .invoice-title {
      font-size: 32px;
      font-weight: bold;
      color: #1e40af;
      margin: 0 0 10px 0;
    }
    .invoice-number {
      font-size: 14px;
      color: #6b7280;
    }
    .invoice-details {
      display: grid;
      grid-template-columns: 1fr 1fr;
      gap: 30px;
      margin-bottom: 30px;
    }
    .detail-section h3 {
      font-size: 14px;
      font-weight: 600;
      text-transform: uppercase;
      color: #6b7280;
      margin: 0 0 10px 0;
    }
    .detail-section p {
      margin: 5px 0;
      font-size: 14px;
    }
    .invoice-table {
      width: 100%;
      border-collapse: collapse;
      margin: 30px 0;
    }
    .invoice-table th {
      background-color: #f3f4f6;
      padding: 12px;
      text-align: left;
      font-size: 12px;
      font-weight: 600;
      text-transform: uppercase;
      color: #6b7280;
      border-bottom: 2px solid #e5e7eb;
    }
    .invoice-table td {
      padding: 15px 12px;
      border-bottom: 1px solid #e5e7eb;
      font-size: 14px;
    }
    .invoice-total {
      background-color: #eff6ff;
      border: 2px solid #2563eb;
      border-radius: 8px;
      padding: 20px;
      margin: 30px 0;
      text-align: right;
    }
    .total-label {
      font-size: 18px;
      font-weight: 600;
      color: #1e40af;
      margin-bottom: 5px;
    }
    .total-amount {
      font-size: 32px;
      font-weight: bold;
      color: #1e40af;
    }
    .banking-details {
      background-color: #f9fafb;
      border-left: 4px solid #10b981;
      padding: 20px;
      margin: 30px 0;
      border-radius: 4px;
    }
    .banking-details h3 {
      font-size: 16px;
      font-weight: 600;
      color: #047857;
      margin: 0 0 15px 0;
    }
    .banking-row {
      display: flex;
      justify-content: space-between;
      padding: 8px 0;
      border-bottom: 1px solid #e5e7eb;
    }
    .banking-row:last-child {
      border-bottom: none;
    }
    .banking-label {
      font-weight: 600;
      color: #6b7280;
      font-size: 14px;
    }
    .banking-value {
      font-family: 'Courier New', monospace;
      color: #111827;
      font-size: 14px;
    }
    .payment-instructions {
      background-color: #fef3c7;
      border-left: 4px solid #f59e0b;
      padding: 15px 20px;
      margin: 20px 0;
      border-radius: 4px;
    }
    .payment-instructions h4 {
      font-size: 14px;
      font-weight: 600;
      color: #92400e;
      margin: 0 0 10px 0;
    }
    .payment-instructions p {
      margin: 5px 0;
      font-size: 13px;
      color: #78350f;
    }
    .invoice-footer {
      margin-top: 40px;
      padding-top: 20px;
      border-top: 2px solid #e5e7eb;
      text-align: center;
      font-size: 12px;
      color: #6b7280;
    }
    .status-badge {
      display: inline-block;
      padding: 6px 12px;
      border-radius: 20px;
      font-size: 12px;
      font-weight: 600;
      text-transform: uppercase;
    }
    .status-pending {
      background-color: #fef3c7;
      color: #92400e;
    }
    .status-paid {
      background-color: #d1fae5;
      color: #065f46;
    }
    .status-overdue {
      background-color: #fee2e2;
      color: #991b1b;
    }
  </style>
</head>
<body>
  <div class="invoice-container">
    <!-- Header -->
    <div class="invoice-header">
      <h1 class="invoice-title">RENTAL INVOICE</h1>
      <div class="invoice-number">
        Invoice #: <strong>${payment.invoiceNumber || payment.paymentReference}</strong>
        <span class="status-badge status-${payment.status.toLowerCase()}">${payment.status}</span>
      </div>
    </div>

    <!-- Details -->
    <div class="invoice-details">
      <!-- From -->
      <div class="detail-section">
        <h3>From</h3>
        <p><strong>${organization?.companyName || `${organization?.firstName || ''} ${organization?.lastName || ''}` || 'Property Management'}</strong></p>
        ${organization?.email ? `<p>Email: ${organization.email}</p>` : ''}
        ${organization?.phone ? `<p>Phone: ${organization.phone}</p>` : ''}
      </div>

      <!-- To -->
      <div class="detail-section">
        <h3>Bill To</h3>
        <p><strong>${tenant?.name || 'Tenant'}</strong></p>
        ${tenant?.email ? `<p>Email: ${tenant.email}</p>` : ''}
        ${tenant?.phone ? `<p>Phone: ${tenant.phone}</p>` : ''}
      </div>

      <!-- Invoice Date -->
      <div class="detail-section">
        <h3>Invoice Date</h3>
        <p>${formatDate(payment.createdAt)}</p>
      </div>

      <!-- Due Date -->
      <div class="detail-section">
        <h3>Due Date</h3>
        <p><strong>${formatDate(payment.dueDate)}</strong></p>
      </div>
    </div>

    <!-- Property Details -->
    ${
      property
        ? `
    <div class="detail-section" style="margin-bottom: 20px;">
      <h3>Property</h3>
      <p><strong>${property.name}</strong></p>
      ${property.address ? `<p>${property.address}</p>` : ''}
    </div>
    `
        : ''
    }

    <!-- Invoice Table -->
    <table class="invoice-table">
      <thead>
        <tr>
          <th>Description</th>
          <th style="width: 150px; text-align: right;">Amount</th>
        </tr>
      </thead>
      <tbody>
        <tr>
          <td>
            <strong>${payment.description || 'Monthly Rent'}</strong>
            ${payment.notes ? `<br><small style="color: #6b7280;">${payment.notes}</small>` : ''}
          </td>
          <td style="text-align: right; font-weight: 600;">
            ${formatCurrency(Number(payment.amount))}
          </td>
        </tr>
      </tbody>
    </table>

    <!-- Total -->
    <div class="invoice-total">
      <div class="total-label">Total Amount Due</div>
      <div class="total-amount">${formatCurrency(Number(payment.amount))}</div>
    </div>

    <!-- Banking Details -->
    ${
      organization?.bankName
        ? `
    <div class="banking-details">
      <h3><� Banking Details for Payment</h3>
      ${
        organization.bankName
          ? `
      <div class="banking-row">
        <span class="banking-label">Bank Name:</span>
        <span class="banking-value">${organization.bankName}</span>
      </div>
      `
          : ''
      }
      ${
        organization.bankAccountName
          ? `
      <div class="banking-row">
        <span class="banking-label">Account Name:</span>
        <span class="banking-value">${organization.bankAccountName}</span>
      </div>
      `
          : ''
      }
      ${
        organization.bankAccountNumber
          ? `
      <div class="banking-row">
        <span class="banking-label">Account Number:</span>
        <span class="banking-value">${organization.bankAccountNumber}</span>
      </div>
      `
          : ''
      }
      ${
        organization.bankBranchCode
          ? `
      <div class="banking-row">
        <span class="banking-label">Branch Code:</span>
        <span class="banking-value">${organization.bankBranchCode}</span>
      </div>
      `
          : ''
      }
      ${
        organization.bankSwiftCode
          ? `
      <div class="banking-row">
        <span class="banking-label">SWIFT Code:</span>
        <span class="banking-value">${organization.bankSwiftCode}</span>
      </div>
      `
          : ''
      }
      <div class="banking-row">
        <span class="banking-label">Payment Reference:</span>
        <span class="banking-value">${payment.paymentReference}</span>
      </div>
    </div>
    `
        : ''
    }

    <!-- Payment Instructions -->
    ${
      organization?.paymentInstructions
        ? `
    <div class="payment-instructions">
      <h4>� Payment Instructions</h4>
      <p>${organization.paymentInstructions}</p>
    </div>
    `
        : `
    <div class="payment-instructions">
      <h4>� Payment Instructions</h4>
      <p>" Please use the payment reference <strong>${payment.paymentReference}</strong> when making your payment</p>
      <p>" Payment is due by <strong>${formatDate(payment.dueDate)}</strong></p>
      <p>" Please send proof of payment to ${organization?.email || 'the property manager'}</p>
    </div>
    `
    }

    <!-- Footer -->
    <div class="invoice-footer">
      <p>Thank you for your prompt payment!</p>
      <p>For any queries regarding this invoice, please contact us at ${organization?.email || 'your property manager'}.</p>
      <p style="margin-top: 15px; font-size: 11px;">
        This is a computer-generated invoice. Generated on ${formatDate(new Date())}
      </p>
    </div>
  </div>
</body>
</html>
    `.trim();
  }

  /**
   * Generate plain text invoice for email (fallback)
   */
  generateInvoiceText(payment: PaymentWithDetails): string {
    const property = payment.property || payment.tenant?.properties?.[0]?.property;
    const tenant = payment.tenant;
    const organization = payment.user;

    const formatCurrency = (amount: number | string) => {
      const num = typeof amount === 'string' ? parseFloat(amount) : amount;
      return new Intl.NumberFormat('en-ZA', {
        style: 'currency',
        currency: payment.currency || 'ZAR',
      }).format(num);
    };

    const formatDate = (date: Date | null | undefined) => {
      if (!date) return 'N/A';
      return new Intl.DateTimeFormat('en-ZA', {
        year: 'numeric',
        month: 'long',
        day: 'numeric',
      }).format(new Date(date));
    };

    return `
PPPPPPPPPPPPPPPPPPPPPPPPPPPPPPPPPPPPPPPPPPPPPPPPPPPPPPPPPPPPPPP
                      RENTAL INVOICE
PPPPPPPPPPPPPPPPPPPPPPPPPPPPPPPPPPPPPPPPPPPPPPPPPPPPPPPPPPPPPPP

Invoice #: ${payment.invoiceNumber || payment.paymentReference}
Status: ${payment.status}
Issue Date: ${formatDate(payment.createdAt)}
Due Date: ${formatDate(payment.dueDate)}

                                                               
FROM:
${organization?.companyName || `${organization?.firstName || ''} ${organization?.lastName || ''}` || 'Property Management'}
${organization?.email ? `Email: ${organization.email}` : ''}
${organization?.phone ? `Phone: ${organization.phone}` : ''}

BILL TO:
${tenant?.name || 'Tenant'}
${tenant?.email ? `Email: ${tenant.email}` : ''}
${tenant?.phone ? `Phone: ${tenant.phone}` : ''}

${
  property
    ? `PROPERTY:
${property.name}
${property.address || ''}`
    : ''
}

                                                               
DESCRIPTION                                              AMOUNT
                                                               
${payment.description || 'Monthly Rent'}
                                              ${formatCurrency(Number(payment.amount))}
                                                               

                          TOTAL AMOUNT DUE: ${formatCurrency(Number(payment.amount))}

                                                               
BANKING DETAILS FOR PAYMENT:
                                                               
${organization?.bankName ? `Bank Name: ${organization.bankName}` : ''}
${organization?.bankAccountName ? `Account Name: ${organization.bankAccountName}` : ''}
${organization?.bankAccountNumber ? `Account Number: ${organization.bankAccountNumber}` : ''}
${organization?.bankBranchCode ? `Branch Code: ${organization.bankBranchCode}` : ''}
${organization?.bankSwiftCode ? `SWIFT Code: ${organization.bankSwiftCode}` : ''}
Payment Reference: ${payment.paymentReference}

                                                               
PAYMENT INSTRUCTIONS:
                                                               
${
  organization?.paymentInstructions ||
  `" Please use the payment reference ${payment.paymentReference} when making your payment
" Payment is due by ${formatDate(payment.dueDate)}
" Please send proof of payment to ${organization?.email || 'the property manager'}`
}

                                                               
Thank you for your prompt payment!

For any queries regarding this invoice, please contact us at
${organization?.email || 'your property manager'}.

This is a computer-generated invoice.
Generated on ${formatDate(new Date())}
PPPPPPPPPPPPPPPPPPPPPPPPPPPPPPPPPPPPPPPPPPPPPPPPPPPPPPPPPPPPPPP
    `.trim();
  }
}

export const invoiceService = new InvoiceService();
