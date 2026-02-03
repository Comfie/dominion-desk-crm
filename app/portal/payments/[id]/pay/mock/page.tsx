'use client';

import { useState } from 'react';
import { useParams, useRouter, useSearchParams } from 'next/navigation';
import { useMutation, useQueryClient } from '@tanstack/react-query';
import { CreditCard, Lock, CheckCircle2, XCircle, Loader2, Building2 } from 'lucide-react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { useToast } from '@/hooks/use-toast';

export default function MockPaymentPage() {
  const params = useParams();
  const router = useRouter();
  const searchParams = useSearchParams();
  const queryClient = useQueryClient();
  const { toast } = useToast();

  const paymentId = params.id as string;
  const reference = searchParams.get('reference');
  const amount = searchParams.get('amount');

  const [cardNumber, setCardNumber] = useState('');
  const [expiry, setExpiry] = useState('');
  const [cvv, setCvv] = useState('');
  const [paymentStatus, setPaymentStatus] = useState<'idle' | 'processing' | 'success' | 'failed'>(
    'idle'
  );

  const processPayment = useMutation({
    mutationFn: async () => {
      // Simulate payment processing
      await new Promise((resolve) => setTimeout(resolve, 2000));

      // Mock: simulate success or failure based on card number
      // Use 4111111111111111 for success, anything else for failure simulation
      if (cardNumber.replace(/\s/g, '') === '4111111111111111') {
        // Update payment status in database
        const response = await fetch(`/api/tenant/payments/${paymentId}/complete`, {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({
            reference,
            status: 'success',
            paymentMethod: 'CREDIT_CARD',
          }),
        });

        if (!response.ok) {
          throw new Error('Failed to update payment status');
        }

        return { success: true };
      } else {
        throw new Error('Payment declined - Use test card 4111 1111 1111 1111');
      }
    },
    onSuccess: () => {
      setPaymentStatus('success');
      queryClient.invalidateQueries({ queryKey: ['tenant-payments'] });
      toast({
        title: 'Payment successful!',
        description: 'Your payment has been processed.',
      });
    },
    onError: (error: Error) => {
      setPaymentStatus('failed');
      toast({
        title: 'Payment failed',
        description: error.message,
        variant: 'destructive',
      });
    },
  });

  const formatCardNumber = (value: string) => {
    const v = value.replace(/\s+/g, '').replace(/[^0-9]/gi, '');
    const matches = v.match(/\d{4,16}/g);
    const match = (matches && matches[0]) || '';
    const parts: string[] = [];

    for (let i = 0, len = match.length; i < len; i += 4) {
      parts.push(match.substring(i, i + 4));
    }

    if (parts.length) {
      return parts.join(' ');
    } else {
      return value;
    }
  };

  const formatExpiry = (value: string) => {
    const v = value.replace(/\s+/g, '').replace(/[^0-9]/gi, '');
    if (v.length >= 2) {
      return v.substring(0, 2) + '/' + v.substring(2, 4);
    }
    return v;
  };

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    setPaymentStatus('processing');
    processPayment.mutate();
  };

  if (paymentStatus === 'success') {
    return (
      <div className="flex min-h-screen items-center justify-center bg-gradient-to-b from-green-50 to-white p-4">
        <Card className="w-full max-w-md">
          <CardContent className="pt-6 text-center">
            <div className="mx-auto mb-4 flex h-16 w-16 items-center justify-center rounded-full bg-green-100">
              <CheckCircle2 className="h-10 w-10 text-green-600" />
            </div>
            <h2 className="mb-2 text-2xl font-bold text-green-800">Payment Successful!</h2>
            <p className="text-muted-foreground mb-6">
              Your payment of R{Number(amount).toFixed(2)} has been processed successfully.
            </p>
            <p className="text-muted-foreground mb-6 text-sm">Reference: {reference}</p>
            <Button onClick={() => router.push('/portal/payments')} className="w-full">
              Return to Payments
            </Button>
          </CardContent>
        </Card>
      </div>
    );
  }

  if (paymentStatus === 'failed') {
    return (
      <div className="flex min-h-screen items-center justify-center bg-gradient-to-b from-red-50 to-white p-4">
        <Card className="w-full max-w-md">
          <CardContent className="pt-6 text-center">
            <div className="mx-auto mb-4 flex h-16 w-16 items-center justify-center rounded-full bg-red-100">
              <XCircle className="h-10 w-10 text-red-600" />
            </div>
            <h2 className="mb-2 text-2xl font-bold text-red-800">Payment Failed</h2>
            <p className="text-muted-foreground mb-6">
              Your payment could not be processed. Please try again or use a different payment
              method.
            </p>
            <div className="space-y-2">
              <Button onClick={() => setPaymentStatus('idle')} className="w-full">
                Try Again
              </Button>
              <Button
                variant="outline"
                onClick={() => router.push('/portal/payments')}
                className="w-full"
              >
                Return to Payments
              </Button>
            </div>
          </CardContent>
        </Card>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gradient-to-b from-blue-50 to-white">
      {/* Mock Paystack Header */}
      <div className="bg-[#0BA4DB] py-4 text-white">
        <div className="mx-auto flex max-w-md items-center justify-between px-4">
          <div className="flex items-center gap-2">
            <div className="flex h-8 w-8 items-center justify-center rounded bg-white">
              <span className="text-sm font-bold text-[#0BA4DB]">P</span>
            </div>
            <span className="font-semibold">Paystack</span>
            <span className="ml-2 rounded bg-yellow-500 px-2 py-0.5 text-xs text-black">
              TEST MODE
            </span>
          </div>
          <Lock className="h-5 w-5" />
        </div>
      </div>

      <div className="mx-auto max-w-md px-4 py-8">
        {/* Payment Info */}
        <Card className="mb-6">
          <CardHeader className="pb-3">
            <div className="flex items-center gap-3">
              <div className="bg-primary/10 flex h-12 w-12 items-center justify-center rounded-full">
                <Building2 className="text-primary h-6 w-6" />
              </div>
              <div>
                <CardTitle className="text-lg">DominionDesk</CardTitle>
                <CardDescription>Rent Payment</CardDescription>
              </div>
            </div>
          </CardHeader>
          <CardContent>
            <div className="text-3xl font-bold">ZAR {Number(amount).toFixed(2)}</div>
            <p className="text-muted-foreground mt-1 text-sm">Ref: {reference}</p>
          </CardContent>
        </Card>

        {/* Test Card Notice */}
        <div className="mb-6 rounded-lg border border-yellow-200 bg-yellow-50 p-4">
          <p className="text-sm text-yellow-800">
            <strong>Test Mode:</strong> Use card number{' '}
            <code className="rounded bg-yellow-100 px-1">4111 1111 1111 1111</code> with any future
            expiry and CVV.
          </p>
        </div>

        {/* Payment Form */}
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2 text-base">
              <CreditCard className="h-5 w-5" />
              Card Details
            </CardTitle>
          </CardHeader>
          <CardContent>
            <form onSubmit={handleSubmit} className="space-y-4">
              <div>
                <Label htmlFor="cardNumber">Card Number</Label>
                <Input
                  id="cardNumber"
                  placeholder="4111 1111 1111 1111"
                  value={cardNumber}
                  onChange={(e) => setCardNumber(formatCardNumber(e.target.value))}
                  maxLength={19}
                  required
                  disabled={paymentStatus === 'processing'}
                />
              </div>

              <div className="grid grid-cols-2 gap-4">
                <div>
                  <Label htmlFor="expiry">Expiry Date</Label>
                  <Input
                    id="expiry"
                    placeholder="MM/YY"
                    value={expiry}
                    onChange={(e) => setExpiry(formatExpiry(e.target.value))}
                    maxLength={5}
                    required
                    disabled={paymentStatus === 'processing'}
                  />
                </div>
                <div>
                  <Label htmlFor="cvv">CVV</Label>
                  <Input
                    id="cvv"
                    placeholder="123"
                    value={cvv}
                    onChange={(e) => setCvv(e.target.value.replace(/\D/g, '').slice(0, 4))}
                    maxLength={4}
                    required
                    disabled={paymentStatus === 'processing'}
                  />
                </div>
              </div>

              <Button
                type="submit"
                className="w-full bg-[#0BA4DB] hover:bg-[#0993c7]"
                size="lg"
                disabled={paymentStatus === 'processing'}
              >
                {paymentStatus === 'processing' ? (
                  <>
                    <Loader2 className="mr-2 h-5 w-5 animate-spin" />
                    Processing...
                  </>
                ) : (
                  <>Pay ZAR {Number(amount).toFixed(2)}</>
                )}
              </Button>
            </form>
          </CardContent>
        </Card>

        {/* Security Footer */}
        <div className="text-muted-foreground mt-6 text-center text-sm">
          <div className="mb-2 flex items-center justify-center gap-2">
            <Lock className="h-4 w-4" />
            <span>Secured by Paystack</span>
          </div>
          <p>Your card details are encrypted and secure</p>
        </div>

        {/* Cancel Link */}
        <div className="mt-4 text-center">
          <Button
            variant="link"
            onClick={() => router.push('/portal/payments')}
            disabled={paymentStatus === 'processing'}
          >
            Cancel and return to payments
          </Button>
        </div>
      </div>
    </div>
  );
}
