'use client';

import Link from 'next/link';
import { ArrowLeft, Mail, Calendar, DollarSign, Wrench, FileText, Send } from 'lucide-react';

import { PageHeader } from '@/components/shared';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';

const templates = [
  {
    id: 'bookingConfirmation',
    name: 'Booking Confirmation',
    description: 'Send a confirmation email to guests after their booking is confirmed',
    icon: Calendar,
    color: 'text-green-600',
    bgColor: 'bg-green-100',
    fields: ['Guest Name', 'Property Name', 'Check-in Date', 'Check-out Date', 'Total Amount'],
    preview: `Dear [Guest Name],

Thank you for your booking! Here are your reservation details:

Property: [Property Name]
Check-in: [Check-in Date]
Check-out: [Check-out Date]
Total Amount: [Total Amount]

If you have any questions, please don't hesitate to contact us.

Best regards,
Property Management Team`,
  },
  {
    id: 'checkInReminder',
    name: 'Check-in Reminder',
    description: 'Remind guests about their upcoming check-in with important details',
    icon: Mail,
    color: 'text-blue-600',
    bgColor: 'bg-blue-100',
    fields: ['Guest Name', 'Property Name', 'Check-in Date', 'Address', 'Instructions'],
    preview: `Dear [Guest Name],

This is a reminder that your check-in is scheduled for [Check-in Date].

Property: [Property Name]
Address: [Address]

Check-in Instructions:
[Instructions]

We look forward to hosting you!

Best regards,
Property Management Team`,
  },
  {
    id: 'paymentReminder',
    name: 'Payment Reminder',
    description: 'Send a friendly reminder about upcoming or overdue payments',
    icon: DollarSign,
    color: 'text-yellow-600',
    bgColor: 'bg-yellow-100',
    fields: ['Recipient Name', 'Amount', 'Due Date', 'Property Name', 'Payment Type'],
    preview: `Dear [Recipient Name],

This is a friendly reminder that a payment is due.

Amount Due: [Amount]
Due Date: [Due Date]
Property: [Property Name]
Payment Type: [Payment Type]

Please ensure payment is made by the due date to avoid any late fees.

If you have already made this payment, please disregard this notice.

Best regards,
Property Management Team`,
  },
  {
    id: 'maintenanceUpdate',
    name: 'Maintenance Update',
    description: 'Update tenants or guests about maintenance request status',
    icon: Wrench,
    color: 'text-purple-600',
    bgColor: 'bg-purple-100',
    fields: ['Recipient Name', 'Request Title', 'Status', 'Description', 'Scheduled Date'],
    preview: `Dear [Recipient Name],

We wanted to update you on the status of your maintenance request.

Request: [Request Title]
Status: [Status]
Details: [Description]
Scheduled Date: [Scheduled Date]

If you have any questions, please don't hesitate to contact us.

Best regards,
Property Management Team`,
  },
  {
    id: 'generic',
    name: 'Custom Message',
    description: 'Create a custom message with your own subject and content',
    icon: FileText,
    color: 'text-gray-600',
    bgColor: 'bg-gray-100',
    fields: ['Recipient Name', 'Subject', 'Message Body'],
    preview: `Dear [Recipient Name],

[Your custom message content here]

Best regards,
Property Management Team`,
  },
];

export default function MessageTemplatesPage() {
  return (
    <div className="space-y-6">
      <PageHeader
        title="Message Templates"
        description="Use pre-built templates to quickly send common messages"
      >
        <Link href="/messages">
          <Button variant="outline">
            <ArrowLeft className="mr-2 h-4 w-4" />
            Back to Messages
          </Button>
        </Link>
      </PageHeader>

      <div className="grid gap-6 md:grid-cols-2">
        {templates.map((template) => {
          const Icon = template.icon;
          return (
            <Card key={template.id} className="flex flex-col">
              <CardHeader>
                <div className="flex items-start gap-4">
                  <div className={`rounded-lg p-2 ${template.bgColor}`}>
                    <Icon className={`h-6 w-6 ${template.color}`} />
                  </div>
                  <div className="flex-1">
                    <CardTitle className="text-lg">{template.name}</CardTitle>
                    <CardDescription>{template.description}</CardDescription>
                  </div>
                </div>
              </CardHeader>
              <CardContent className="flex flex-1 flex-col">
                <div className="mb-4">
                  <p className="mb-2 text-sm font-medium">Template Fields:</p>
                  <div className="flex flex-wrap gap-1">
                    {template.fields.map((field) => (
                      <span key={field} className="bg-muted rounded px-2 py-1 text-xs">
                        {field}
                      </span>
                    ))}
                  </div>
                </div>

                <div className="mb-4 flex-1">
                  <p className="mb-2 text-sm font-medium">Preview:</p>
                  <div className="bg-muted max-h-48 overflow-y-auto rounded-lg p-3">
                    <pre className="text-xs whitespace-pre-wrap">{template.preview}</pre>
                  </div>
                </div>

                <Link href={`/messages/new?template=${template.id}`}>
                  <Button className="w-full">
                    <Send className="mr-2 h-4 w-4" />
                    Use Template
                  </Button>
                </Link>
              </CardContent>
            </Card>
          );
        })}
      </div>
    </div>
  );
}
