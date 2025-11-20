'use client';

import { useState } from 'react';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import Link from 'next/link';
import {
  ArrowLeft,
  Mail,
  Calendar,
  DollarSign,
  Wrench,
  FileText,
  Send,
  Plus,
  Pencil,
  Trash2,
  Loader2,
} from 'lucide-react';

import { PageHeader } from '@/components/shared';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
  AlertDialogTrigger,
} from '@/components/ui/alert-dialog';
import { formatDate } from '@/lib/utils';

// Built-in templates
const builtInTemplates = [
  {
    id: 'bookingConfirmation',
    name: 'Booking Confirmation',
    description: 'Send a confirmation email to guests after their booking is confirmed',
    icon: Calendar,
    color: 'text-green-600',
    bgColor: 'bg-green-100',
    fields: ['Guest Name', 'Property Name', 'Check-in Date', 'Check-out Date', 'Total Amount'],
    preview: `Dear {{guestName}},

Thank you for your booking! Here are your reservation details:

Property: {{propertyName}}
Check-in: {{checkIn}}
Check-out: {{checkOut}}
Total Amount: {{totalAmount}}

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
    preview: `Dear {{guestName}},

This is a reminder that your check-in is scheduled for {{checkIn}}.

Property: {{propertyName}}
Address: {{address}}

Check-in Instructions:
{{instructions}}

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
    preview: `Dear {{recipientName}},

This is a friendly reminder that a payment is due.

Amount Due: {{amount}}
Due Date: {{dueDate}}
Property: {{propertyName}}
Payment Type: {{paymentType}}

Please ensure payment is made by the due date to avoid any late fees.

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
    preview: `Dear {{recipientName}},

We wanted to update you on the status of your maintenance request.

Request: {{title}}
Status: {{status}}
Details: {{description}}
Scheduled Date: {{scheduledDate}}

If you have any questions, please don't hesitate to contact us.

Best regards,
Property Management Team`,
  },
];

interface CustomTemplate {
  id: string;
  name: string;
  description: string | null;
  subject: string;
  body: string;
  messageType: string;
  variables: string[] | null;
  category: string | null;
  isActive: boolean;
  createdAt: string;
}

async function fetchTemplates() {
  const response = await fetch('/api/templates');
  if (!response.ok) throw new Error('Failed to fetch templates');
  return response.json();
}

export default function MessageTemplatesPage() {
  const queryClient = useQueryClient();
  const [deletingId, setDeletingId] = useState<string | null>(null);

  const { data, isLoading } = useQuery({
    queryKey: ['templates'],
    queryFn: fetchTemplates,
  });

  const deleteMutation = useMutation({
    mutationFn: async (id: string) => {
      const response = await fetch(`/api/templates/${id}`, {
        method: 'DELETE',
      });
      if (!response.ok) throw new Error('Failed to delete template');
      return response.json();
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['templates'] });
      setDeletingId(null);
    },
  });

  const customTemplates: CustomTemplate[] = data?.templates || [];

  return (
    <div className="space-y-6">
      <PageHeader
        title="Message Templates"
        description="Use built-in templates or create your own custom templates"
      >
        <div className="flex gap-2">
          <Link href="/messages/templates/new">
            <Button>
              <Plus className="mr-2 h-4 w-4" />
              Create Template
            </Button>
          </Link>
          <Link href="/messages">
            <Button variant="outline">
              <ArrowLeft className="mr-2 h-4 w-4" />
              Back to Messages
            </Button>
          </Link>
        </div>
      </PageHeader>

      <Tabs defaultValue="builtin" className="space-y-6">
        <TabsList>
          <TabsTrigger value="builtin">Built-in Templates</TabsTrigger>
          <TabsTrigger value="custom">Custom Templates ({customTemplates.length})</TabsTrigger>
        </TabsList>

        <TabsContent value="builtin">
          <div className="grid gap-6 md:grid-cols-2">
            {builtInTemplates.map((template) => {
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
        </TabsContent>

        <TabsContent value="custom">
          {isLoading ? (
            <div className="flex items-center justify-center py-8">
              <Loader2 className="h-8 w-8 animate-spin" />
            </div>
          ) : customTemplates.length === 0 ? (
            <Card>
              <CardContent className="py-8 text-center">
                <FileText className="text-muted-foreground mx-auto mb-4 h-12 w-12" />
                <h3 className="mb-2 text-lg font-semibold">No custom templates</h3>
                <p className="text-muted-foreground mb-4">
                  Create your own templates for frequently used messages
                </p>
                <Link href="/messages/templates/new">
                  <Button>
                    <Plus className="mr-2 h-4 w-4" />
                    Create Template
                  </Button>
                </Link>
              </CardContent>
            </Card>
          ) : (
            <div className="grid gap-6 md:grid-cols-2">
              {customTemplates.map((template) => (
                <Card key={template.id} className="flex flex-col">
                  <CardHeader>
                    <div className="flex items-start justify-between">
                      <div>
                        <CardTitle className="text-lg">{template.name}</CardTitle>
                        {template.description && (
                          <CardDescription>{template.description}</CardDescription>
                        )}
                      </div>
                      <div className="flex items-center gap-1">
                        {!template.isActive && <Badge variant="secondary">Inactive</Badge>}
                        <Badge variant="outline">{template.messageType}</Badge>
                      </div>
                    </div>
                  </CardHeader>
                  <CardContent className="flex flex-1 flex-col">
                    <div className="mb-2">
                      <p className="text-sm font-medium">Subject:</p>
                      <p className="text-muted-foreground text-sm">{template.subject}</p>
                    </div>

                    {template.variables && template.variables.length > 0 && (
                      <div className="mb-4">
                        <p className="mb-2 text-sm font-medium">Variables:</p>
                        <div className="flex flex-wrap gap-1">
                          {template.variables.map((variable) => (
                            <span key={variable} className="bg-muted rounded px-2 py-1 text-xs">
                              {`{{${variable}}}`}
                            </span>
                          ))}
                        </div>
                      </div>
                    )}

                    <div className="mb-4 flex-1">
                      <p className="mb-2 text-sm font-medium">Body:</p>
                      <div className="bg-muted max-h-32 overflow-y-auto rounded-lg p-3">
                        <pre className="text-xs whitespace-pre-wrap">{template.body}</pre>
                      </div>
                    </div>

                    <p className="text-muted-foreground mb-4 text-xs">
                      Created {formatDate(template.createdAt)}
                    </p>

                    <div className="flex gap-2">
                      <Link href={`/messages/new?customTemplate=${template.id}`} className="flex-1">
                        <Button className="w-full">
                          <Send className="mr-2 h-4 w-4" />
                          Use
                        </Button>
                      </Link>
                      <Link href={`/messages/templates/${template.id}/edit`}>
                        <Button variant="outline" size="icon">
                          <Pencil className="h-4 w-4" />
                        </Button>
                      </Link>
                      <AlertDialog>
                        <AlertDialogTrigger asChild>
                          <Button
                            variant="outline"
                            size="icon"
                            className="text-red-600 hover:bg-red-50 hover:text-red-700"
                          >
                            <Trash2 className="h-4 w-4" />
                          </Button>
                        </AlertDialogTrigger>
                        <AlertDialogContent>
                          <AlertDialogHeader>
                            <AlertDialogTitle>Delete Template</AlertDialogTitle>
                            <AlertDialogDescription>
                              Are you sure you want to delete &quot;{template.name}&quot;? This
                              action cannot be undone.
                            </AlertDialogDescription>
                          </AlertDialogHeader>
                          <AlertDialogFooter>
                            <AlertDialogCancel>Cancel</AlertDialogCancel>
                            <AlertDialogAction
                              onClick={() => {
                                setDeletingId(template.id);
                                deleteMutation.mutate(template.id);
                              }}
                              className="bg-red-600 hover:bg-red-700"
                              disabled={deleteMutation.isPending && deletingId === template.id}
                            >
                              {deleteMutation.isPending && deletingId === template.id ? (
                                <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                              ) : null}
                              Delete
                            </AlertDialogAction>
                          </AlertDialogFooter>
                        </AlertDialogContent>
                      </AlertDialog>
                    </div>
                  </CardContent>
                </Card>
              ))}
            </div>
          )}
        </TabsContent>
      </Tabs>
    </div>
  );
}
