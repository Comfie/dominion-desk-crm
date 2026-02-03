'use client';

import { useState } from 'react';
import { useRouter, useSearchParams } from 'next/navigation';
import { Check, CreditCard, Loader2, AlertTriangle } from 'lucide-react';

import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from '@/components/ui/dialog';
import { Button } from '@/components/ui/button';
import { Alert, AlertDescription } from '@/components/ui/alert';
import { formatCurrency } from '@/lib/utils';

interface SubscriptionCalculation {
  baseFee: number;
  totalPropertyFees: number;
  totalMonthlyFee: number;
  activePropertyCount: number;
  freePropertyCount: number;
  chargeablePropertyCount: number;
}

interface SubscribeModalProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  currentBilling: SubscriptionCalculation;
}

export function SubscribeModal({ open, onOpenChange, currentBilling }: SubscribeModalProps) {
  const router = useRouter();
  const searchParams = useSearchParams();
  const [isInitiating, setIsInitiating] = useState(false);
  const [error, setError] = useState<string | null>(null);

  // Check for return status from PayFast
  const status = searchParams.get('status');

  const handleSubscribe = async () => {
    try {
      setIsInitiating(true);
      setError(null);

      // Call initiate subscription API
      const response = await fetch('/api/payfast/initiate-subscription', {
        method: 'POST',
      });

      if (!response.ok) {
        const data = await response.json();
        throw new Error(data.error || 'Failed to initiate subscription');
      }

      const { paymentData, payfastUrl } = await response.json();

      // Create a form and submit to PayFast
      const form = document.createElement('form');
      form.method = 'POST';
      form.action = payfastUrl;

      // Add all payment data as hidden inputs
      Object.entries(paymentData).forEach(([key, value]) => {
        const input = document.createElement('input');
        input.type = 'hidden';
        input.name = key;
        input.value = String(value);
        form.appendChild(input);
      });

      document.body.appendChild(form);
      form.submit();
    } catch (err) {
      setError(err instanceof Error ? err.message : 'An error occurred');
      setIsInitiating(false);
    }
  };

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="sm:max-w-md">
        <DialogHeader>
          <DialogTitle className="flex items-center gap-2">
            <CreditCard className="h-5 w-5" />
            Subscribe to DominionDesk
          </DialogTitle>
          <DialogDescription>
            Activate your subscription to unlock full access to all features
          </DialogDescription>
        </DialogHeader>

        <div className="space-y-4">
          {/* Return Status Messages */}
          {status === 'success' && (
            <Alert>
              <Check className="h-4 w-4" />
              <AlertDescription>
                Payment successful! Your subscription is being activated.
              </AlertDescription>
            </Alert>
          )}

          {status === 'cancelled' && (
            <Alert variant="destructive">
              <AlertTriangle className="h-4 w-4" />
              <AlertDescription>
                Payment was cancelled. You can try again when ready.
              </AlertDescription>
            </Alert>
          )}

          {/* Error Message */}
          {error && (
            <Alert variant="destructive">
              <AlertTriangle className="h-4 w-4" />
              <AlertDescription>{error}</AlertDescription>
            </Alert>
          )}

          {/* Billing Summary */}
          <div className="space-y-3 rounded-lg border p-4">
            <h4 className="font-medium">Your Monthly Subscription</h4>

            <div className="space-y-2 text-sm">
              <div className="flex justify-between">
                <span className="text-muted-foreground">Base subscription</span>
                <span className="font-medium">{formatCurrency(currentBilling.baseFee)}</span>
              </div>

              {currentBilling.activePropertyCount > currentBilling.freePropertyCount && (
                <div className="flex justify-between">
                  <span className="text-muted-foreground">
                    Property fees ({currentBilling.chargeablePropertyCount}{' '}
                    {currentBilling.chargeablePropertyCount === 1 ? 'property' : 'properties'})
                  </span>
                  <span className="font-medium">
                    {formatCurrency(currentBilling.totalPropertyFees)}
                  </span>
                </div>
              )}

              <div className="flex justify-between border-t pt-2">
                <span className="font-semibold">Total Monthly</span>
                <span className="text-primary text-lg font-bold">
                  {formatCurrency(currentBilling.totalMonthlyFee)}
                </span>
              </div>
            </div>
          </div>

          {/* Features List */}
          <div className="space-y-2">
            <h4 className="text-sm font-medium">What&apos;s included:</h4>
            <ul className="text-muted-foreground space-y-1.5 text-sm">
              <li className="flex items-center gap-2">
                <Check className="h-4 w-4 flex-shrink-0 text-green-600" />
                <span>Unlimited properties and tenants</span>
              </li>
              <li className="flex items-center gap-2">
                <Check className="h-4 w-4 flex-shrink-0 text-green-600" />
                <span>Automatic rent collection tracking</span>
              </li>
              <li className="flex items-center gap-2">
                <Check className="h-4 w-4 flex-shrink-0 text-green-600" />
                <span>Maintenance request management</span>
              </li>
              <li className="flex items-center gap-2">
                <Check className="h-4 w-4 flex-shrink-0 text-green-600" />
                <span>Document storage and organization</span>
              </li>
              <li className="flex items-center gap-2">
                <Check className="h-4 w-4 flex-shrink-0 text-green-600" />
                <span>Financial reporting and analytics</span>
              </li>
              <li className="flex items-center gap-2">
                <Check className="h-4 w-4 flex-shrink-0 text-green-600" />
                <span>Cancel anytime</span>
              </li>
            </ul>
          </div>

          {/* Payment Info */}
          <div className="bg-muted/50 rounded-lg p-3 text-sm">
            <p className="text-muted-foreground">
              You will be redirected to PayFast to complete your payment securely. Your subscription
              will activate immediately upon successful payment.
            </p>
          </div>
        </div>

        <DialogFooter className="gap-2 sm:gap-0">
          <Button variant="outline" onClick={() => onOpenChange(false)} disabled={isInitiating}>
            Cancel
          </Button>
          <Button onClick={handleSubscribe} disabled={isInitiating}>
            {isInitiating ? (
              <>
                <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                Redirecting to PayFast...
              </>
            ) : (
              <>
                <CreditCard className="mr-2 h-4 w-4" />
                Subscribe Now
              </>
            )}
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}
