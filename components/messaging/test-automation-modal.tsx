'use client';

import { useState } from 'react';
import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { z } from 'zod';
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from '@/components/ui/dialog';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Alert, AlertDescription } from '@/components/ui/alert';
import { AlertCircle, CheckCircle2, Loader2, Send } from 'lucide-react';

const testSchema = z.object({
  recipientEmail: z.string().email('Valid email is required').optional().or(z.literal('')),
  recipientPhone: z.string().optional(),
});

type TestForm = z.infer<typeof testSchema>;

interface TestAutomationModalProps {
  automation: {
    id: string;
    name: string;
    messageType: string;
  } | null;
  open: boolean;
  onOpenChange: (open: boolean) => void;
  onTest: (id: string, data: TestForm) => Promise<void>;
}

export function TestAutomationModal({
  automation,
  open,
  onOpenChange,
  onTest,
}: TestAutomationModalProps) {
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [success, setSuccess] = useState(false);

  const {
    register,
    handleSubmit,
    formState: { errors },
    reset,
  } = useForm<TestForm>({
    resolver: zodResolver(testSchema),
  });

  const onSubmit = async (data: TestForm) => {
    if (!automation) return;

    // Validate based on message type
    if (automation.messageType === 'EMAIL' && !data.recipientEmail) {
      setError('Email address is required for email messages');
      return;
    }

    if (
      (automation.messageType === 'SMS' || automation.messageType === 'WHATSAPP') &&
      !data.recipientPhone
    ) {
      setError('Phone number is required for SMS/WhatsApp messages');
      return;
    }

    setIsSubmitting(true);
    setError(null);
    setSuccess(false);

    try {
      await onTest(automation.id, data);
      setSuccess(true);
      setTimeout(() => {
        onOpenChange(false);
        setSuccess(false);
        reset();
      }, 2000);
    } catch (err: any) {
      setError(err.message || 'Failed to send test message');
    } finally {
      setIsSubmitting(false);
    }
  };

  if (!automation) return null;

  const requiresEmail = automation.messageType === 'EMAIL';
  const requiresPhone = automation.messageType === 'SMS' || automation.messageType === 'WHATSAPP';

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-md">
        <DialogHeader>
          <DialogTitle>Test Automation</DialogTitle>
          <DialogDescription>
            Send a test message to verify your automation is working correctly.
          </DialogDescription>
        </DialogHeader>

        <form onSubmit={handleSubmit(onSubmit)} className="space-y-4">
          {error && (
            <Alert variant="destructive">
              <AlertCircle className="h-4 w-4" />
              <AlertDescription>{error}</AlertDescription>
            </Alert>
          )}

          {success && (
            <Alert className="border-green-200 bg-green-50">
              <CheckCircle2 className="h-4 w-4 text-green-600" />
              <AlertDescription className="text-green-800">
                Test message sent successfully!
              </AlertDescription>
            </Alert>
          )}

          <div className="space-y-4">
            <div className="bg-muted rounded-lg p-3">
              <p className="text-sm">
                <span className="font-medium">Automation:</span> {automation.name}
              </p>
              <p className="text-muted-foreground text-sm">
                <span className="font-medium">Message Type:</span> {automation.messageType}
              </p>
            </div>

            {(requiresEmail || !requiresPhone) && (
              <div className="space-y-2">
                <Label htmlFor="recipientEmail">
                  Recipient Email {requiresEmail && <span className="text-red-600">*</span>}
                </Label>
                <Input
                  id="recipientEmail"
                  type="email"
                  {...register('recipientEmail')}
                  placeholder="test@example.com"
                />
                {errors.recipientEmail && (
                  <p className="text-sm text-red-600">{errors.recipientEmail.message}</p>
                )}
              </div>
            )}

            {requiresPhone && (
              <div className="space-y-2">
                <Label htmlFor="recipientPhone">
                  Recipient Phone <span className="text-red-600">*</span>
                </Label>
                <Input
                  id="recipientPhone"
                  type="tel"
                  {...register('recipientPhone')}
                  placeholder="+27 12 345 6789"
                />
                {errors.recipientPhone && (
                  <p className="text-sm text-red-600">{errors.recipientPhone.message}</p>
                )}
              </div>
            )}

            <Alert>
              <AlertCircle className="h-4 w-4" />
              <AlertDescription className="text-sm">
                The test message will use sample data for template variables. No actual booking or
                tenant data will be used.
              </AlertDescription>
            </Alert>
          </div>

          <DialogFooter>
            <Button
              type="button"
              variant="outline"
              onClick={() => onOpenChange(false)}
              disabled={isSubmitting}
            >
              Cancel
            </Button>
            <Button type="submit" disabled={isSubmitting || success}>
              {isSubmitting && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}
              {!isSubmitting && !success && <Send className="mr-2 h-4 w-4" />}
              {success ? 'Sent!' : 'Send Test'}
            </Button>
          </DialogFooter>
        </form>
      </DialogContent>
    </Dialog>
  );
}
