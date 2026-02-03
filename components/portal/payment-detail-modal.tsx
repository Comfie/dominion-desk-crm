'use client';

import { useState } from 'react';
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogDescription,
} from '@/components/ui/dialog';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { Separator } from '@/components/ui/separator';
import {
  Calendar,
  Building2,
  DollarSign,
  Download,
  Upload,
  FileCheck,
  Clock,
  CheckCircle2,
  XCircle,
  ExternalLink,
  FileText,
  CreditCard,
} from 'lucide-react';
import { formatCurrency, formatDate } from '@/lib/utils';
import { ProofUploadForm } from './proof-upload-form';

interface PaymentDetailModalProps {
  payment: {
    id: string;
    amount: number;
    currency: string;
    dueDate: string | null;
    paymentDate: string | null;
    status: string;
    description: string | null;
    paymentReference: string;
    proofOfPaymentUrl?: string | null;
    proofOfPaymentName?: string | null;
    proofUploadedAt?: string | null;
    proofNotes?: string | null;
    verifiedAt?: string | null;
    verificationNotes?: string | null;
    property: {
      id: string;
      name: string;
      address: string | null;
    } | null;
    user: {
      firstName: string | null;
      lastName: string | null;
      companyName: string | null;
      email: string;
      phone: string | null;
    };
  } | null;
  open: boolean;
  onOpenChange: (open: boolean) => void;
  onProofUploaded?: () => void;
}

const statusConfig: Record<
  string,
  { variant: 'default' | 'secondary' | 'destructive'; className: string; icon: React.ReactNode }
> = {
  PAID: {
    variant: 'default',
    className: 'bg-green-600',
    icon: <CheckCircle2 className="h-4 w-4" />,
  },
  PENDING: {
    variant: 'secondary',
    className: 'bg-yellow-600',
    icon: <Clock className="h-4 w-4" />,
  },
  PENDING_VERIFICATION: {
    variant: 'secondary',
    className: 'bg-blue-600',
    icon: <FileCheck className="h-4 w-4" />,
  },
  OVERDUE: {
    variant: 'destructive',
    className: 'bg-red-600',
    icon: <XCircle className="h-4 w-4" />,
  },
  PARTIALLY_PAID: {
    variant: 'secondary',
    className: 'bg-orange-600',
    icon: <Clock className="h-4 w-4" />,
  },
  FAILED: {
    variant: 'destructive',
    className: 'bg-red-700',
    icon: <XCircle className="h-4 w-4" />,
  },
};

export function PaymentDetailModal({
  payment,
  open,
  onOpenChange,
  onProofUploaded,
}: PaymentDetailModalProps) {
  const [showUploadForm, setShowUploadForm] = useState(false);

  if (!payment) return null;

  const config = statusConfig[payment.status] || statusConfig.PENDING;
  const canUploadProof = payment.status === 'PENDING' || payment.status === 'OVERDUE';
  const hasProof = !!payment.proofOfPaymentUrl;
  const isPendingVerification = payment.status === 'PENDING_VERIFICATION';
  const isVerified = payment.status === 'PAID' && payment.verifiedAt;
  const landlordName =
    payment.user.companyName ||
    `${payment.user.firstName || ''} ${payment.user.lastName || ''}`.trim() ||
    'Your Landlord';

  const handleUploadSuccess = () => {
    setShowUploadForm(false);
    onProofUploaded?.();
  };

  const getStatusText = () => {
    switch (payment.status) {
      case 'PAID':
        return 'Paid';
      case 'PENDING':
        return 'Pending';
      case 'PENDING_VERIFICATION':
        return 'Awaiting Verification';
      case 'OVERDUE':
        return 'Overdue';
      case 'PARTIALLY_PAID':
        return 'Partially Paid';
      default:
        return payment.status.replace('_', ' ');
    }
  };

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-h-[90vh] max-w-lg overflow-y-auto">
        <DialogHeader>
          <DialogTitle className="flex items-center gap-2">
            <DollarSign className="h-5 w-5" />
            Payment Details
          </DialogTitle>
          <DialogDescription>
            {payment.description || 'Rent Payment'} - Ref: {payment.paymentReference}
          </DialogDescription>
        </DialogHeader>

        <div className="space-y-6">
          {/* Amount and Status */}
          <div className="flex items-center justify-between">
            <div>
              <div className="text-3xl font-bold">
                {payment.currency} {Number(payment.amount).toFixed(2)}
              </div>
            </div>
            <Badge
              variant={config.variant}
              className={`${config.className} flex items-center gap-1`}
            >
              {config.icon}
              {getStatusText()}
            </Badge>
          </div>

          <Separator />

          {/* Payment Information */}
          <div className="space-y-4">
            {payment.property && (
              <div className="flex items-start gap-3">
                <Building2 className="text-muted-foreground mt-0.5 h-5 w-5 flex-shrink-0" />
                <div>
                  <p className="text-muted-foreground text-sm">Property</p>
                  <p className="font-medium">{payment.property.name}</p>
                  {payment.property.address && (
                    <p className="text-muted-foreground text-sm">{payment.property.address}</p>
                  )}
                </div>
              </div>
            )}

            {payment.dueDate && (
              <div className="flex items-start gap-3">
                <Calendar className="text-muted-foreground mt-0.5 h-5 w-5 flex-shrink-0" />
                <div>
                  <p className="text-muted-foreground text-sm">Due Date</p>
                  <p className="font-medium">{formatDate(payment.dueDate)}</p>
                </div>
              </div>
            )}

            {payment.paymentDate && payment.status === 'PAID' && (
              <div className="flex items-start gap-3">
                <CheckCircle2 className="mt-0.5 h-5 w-5 flex-shrink-0 text-green-600" />
                <div>
                  <p className="text-muted-foreground text-sm">Payment Date</p>
                  <p className="font-medium">{formatDate(payment.paymentDate)}</p>
                </div>
              </div>
            )}
          </div>

          <Separator />

          {/* Proof of Payment Section */}
          <div className="space-y-4">
            <h3 className="flex items-center gap-2 font-semibold">
              <FileText className="h-4 w-4" />
              Proof of Payment
            </h3>

            {isPendingVerification && (
              <div className="rounded-lg border border-blue-200 bg-blue-50 p-4 dark:border-blue-800 dark:bg-blue-950/50">
                <div className="flex items-start gap-3">
                  <FileCheck className="mt-0.5 h-5 w-5 flex-shrink-0 text-blue-600" />
                  <div>
                    <p className="font-medium text-blue-800 dark:text-blue-200">
                      Awaiting Verification
                    </p>
                    <p className="text-sm text-blue-700 dark:text-blue-300">
                      Your proof of payment has been submitted. {landlordName} will review and
                      verify it shortly.
                    </p>
                    {payment.proofUploadedAt && (
                      <p className="mt-1 text-xs text-blue-600 dark:text-blue-400">
                        Uploaded on {formatDate(payment.proofUploadedAt)}
                      </p>
                    )}
                  </div>
                </div>
                {payment.proofOfPaymentUrl && (
                  <Button
                    variant="outline"
                    size="sm"
                    className="mt-3"
                    onClick={() => window.open(payment.proofOfPaymentUrl!, '_blank')}
                  >
                    <ExternalLink className="mr-2 h-4 w-4" />
                    View Uploaded Proof
                  </Button>
                )}
              </div>
            )}

            {isVerified && hasProof && (
              <div className="rounded-lg border border-green-200 bg-green-50 p-4 dark:border-green-800 dark:bg-green-950/50">
                <div className="flex items-start gap-3">
                  <CheckCircle2 className="mt-0.5 h-5 w-5 flex-shrink-0 text-green-600" />
                  <div>
                    <p className="font-medium text-green-800 dark:text-green-200">
                      Payment Verified
                    </p>
                    <p className="text-sm text-green-700 dark:text-green-300">
                      Your proof of payment has been verified and the payment is marked as paid.
                    </p>
                    {payment.verifiedAt && (
                      <p className="mt-1 text-xs text-green-600 dark:text-green-400">
                        Verified on {formatDate(payment.verifiedAt)}
                      </p>
                    )}
                  </div>
                </div>
              </div>
            )}

            {payment.verificationNotes && payment.status === 'PENDING' && (
              <div className="rounded-lg border border-amber-200 bg-amber-50 p-4 dark:border-amber-800 dark:bg-amber-950/50">
                <div className="flex items-start gap-3">
                  <XCircle className="mt-0.5 h-5 w-5 flex-shrink-0 text-amber-600" />
                  <div>
                    <p className="font-medium text-amber-800 dark:text-amber-200">
                      Previous Proof Rejected
                    </p>
                    <p className="text-sm text-amber-700 dark:text-amber-300">
                      {payment.verificationNotes}
                    </p>
                    <p className="mt-1 text-xs text-amber-600 dark:text-amber-400">
                      Please upload a valid proof of payment.
                    </p>
                  </div>
                </div>
              </div>
            )}

            {canUploadProof && !showUploadForm && (
              <Button
                onClick={() => setShowUploadForm(true)}
                className="w-full"
                variant={payment.verificationNotes ? 'default' : 'outline'}
              >
                <Upload className="mr-2 h-4 w-4" />
                {payment.verificationNotes ? 'Upload New Proof' : 'Upload Proof of Payment'}
              </Button>
            )}

            {showUploadForm && (
              <ProofUploadForm
                paymentId={payment.id}
                onSuccess={handleUploadSuccess}
                onCancel={() => setShowUploadForm(false)}
              />
            )}

            {!canUploadProof &&
              !isPendingVerification &&
              !isVerified &&
              payment.status === 'PAID' && (
                <p className="text-muted-foreground py-2 text-center text-sm">
                  This payment has been marked as paid.
                </p>
              )}
          </div>

          <Separator />

          {/* Actions */}
          <div className="flex flex-wrap gap-2">
            {canUploadProof && (
              <Button
                className="flex-1"
                onClick={() => (window.location.href = `/portal/payments/${payment.id}/pay`)}
              >
                <CreditCard className="mr-2 h-4 w-4" />
                Pay Online
              </Button>
            )}
            <Button
              variant="outline"
              className="flex-1"
              onClick={() => window.open(`/api/tenant/payments/${payment.id}/invoice`, '_blank')}
            >
              <Download className="mr-2 h-4 w-4" />
              View Invoice
            </Button>
            <Button variant="outline" onClick={() => onOpenChange(false)}>
              Close
            </Button>
          </div>
        </div>
      </DialogContent>
    </Dialog>
  );
}
