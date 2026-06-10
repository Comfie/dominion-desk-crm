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
import { formatDate } from '@/lib/utils';
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
      <DialogContent className="max-h-[90vh] max-w-2xl overflow-y-auto border-white/10 bg-[#101826] text-white">
        <DialogHeader>
          <DialogTitle className="flex items-center gap-2 text-white">
            <DollarSign className="h-5 w-5" />
            Payment Details
          </DialogTitle>
          <DialogDescription className="text-white/60">
            {payment.description || 'Rent Payment'} - Ref: {payment.paymentReference}
          </DialogDescription>
        </DialogHeader>

        <div className="space-y-6">
          <div className="rounded-[1.35rem] border border-white/10 bg-white/[0.03] p-5">
            <div className="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
              <div>
                <p className="portal-eyebrow">Amount due</p>
                <div className="mt-2 text-3xl font-bold text-white">
                  {payment.currency} {Number(payment.amount).toFixed(2)}
                </div>
              </div>
              <Badge
                variant={config.variant}
                className={`${config.className} flex items-center gap-1 border`}
              >
                {config.icon}
                {getStatusText()}
              </Badge>
            </div>
          </div>

          <Separator className="bg-white/10" />

          <div className="grid gap-4 rounded-[1.35rem] border border-white/10 bg-white/[0.03] p-5 sm:grid-cols-2">
            {payment.property && (
              <div className="flex items-start gap-3">
                <Building2 className="mt-0.5 h-5 w-5 flex-shrink-0 text-white/45" />
                <div>
                  <p className="text-sm text-white/50">Property</p>
                  <p className="font-medium text-white">{payment.property.name}</p>
                  {payment.property.address && (
                    <p className="text-sm text-white/55">{payment.property.address}</p>
                  )}
                </div>
              </div>
            )}

            {payment.dueDate && (
              <div className="flex items-start gap-3">
                <Calendar className="mt-0.5 h-5 w-5 flex-shrink-0 text-white/45" />
                <div>
                  <p className="text-sm text-white/50">Due Date</p>
                  <p className="font-medium text-white">{formatDate(payment.dueDate)}</p>
                </div>
              </div>
            )}

            {payment.paymentDate && payment.status === 'PAID' && (
              <div className="flex items-start gap-3">
                <CheckCircle2 className="mt-0.5 h-5 w-5 flex-shrink-0 text-emerald-300" />
                <div>
                  <p className="text-sm text-white/50">Payment Date</p>
                  <p className="font-medium text-white">{formatDate(payment.paymentDate)}</p>
                </div>
              </div>
            )}

            <div>
              <p className="text-sm text-white/50">Reference</p>
              <p className="font-medium text-white">{payment.paymentReference}</p>
            </div>
          </div>

          <div className="space-y-4">
            <h3 className="flex items-center gap-2 font-semibold text-white">
              <FileText className="h-4 w-4" />
              Proof of Payment
            </h3>

            {isPendingVerification && (
              <div className="rounded-[1.25rem] border border-blue-400/20 bg-blue-500/10 p-4">
                <div className="flex items-start gap-3">
                  <FileCheck className="mt-0.5 h-5 w-5 flex-shrink-0 text-blue-300" />
                  <div>
                    <p className="font-medium text-white">Awaiting Verification</p>
                    <p className="text-sm text-blue-100/80">
                      Your proof of payment has been submitted. {landlordName} will review and
                      verify it shortly.
                    </p>
                    {payment.proofUploadedAt && (
                      <p className="mt-1 text-xs text-blue-200/70">
                        Uploaded on {formatDate(payment.proofUploadedAt)}
                      </p>
                    )}
                  </div>
                </div>
                {payment.proofOfPaymentUrl && (
                  <Button
                    variant="outline"
                    size="sm"
                    className="mt-3 border-white/10 bg-white/5 text-white hover:bg-white/10"
                    onClick={() => window.open(payment.proofOfPaymentUrl!, '_blank')}
                  >
                    <ExternalLink className="mr-2 h-4 w-4" />
                    View Uploaded Proof
                  </Button>
                )}
              </div>
            )}

            {isVerified && hasProof && (
              <div className="rounded-[1.25rem] border border-emerald-400/20 bg-emerald-500/10 p-4">
                <div className="flex items-start gap-3">
                  <CheckCircle2 className="mt-0.5 h-5 w-5 flex-shrink-0 text-emerald-300" />
                  <div>
                    <p className="font-medium text-white">Payment Verified</p>
                    <p className="text-sm text-emerald-100/80">
                      Your proof of payment has been verified and the payment is marked as paid.
                    </p>
                    {payment.verifiedAt && (
                      <p className="mt-1 text-xs text-emerald-200/70">
                        Verified on {formatDate(payment.verifiedAt)}
                      </p>
                    )}
                  </div>
                </div>
              </div>
            )}

            {payment.verificationNotes && payment.status === 'PENDING' && (
              <div className="rounded-[1.25rem] border border-amber-400/20 bg-amber-500/10 p-4">
                <div className="flex items-start gap-3">
                  <XCircle className="mt-0.5 h-5 w-5 flex-shrink-0 text-amber-300" />
                  <div>
                    <p className="font-medium text-white">Previous Proof Rejected</p>
                    <p className="text-sm text-amber-100/80">{payment.verificationNotes}</p>
                    <p className="mt-1 text-xs text-amber-200/70">
                      Please upload a valid proof of payment.
                    </p>
                  </div>
                </div>
              </div>
            )}

            {canUploadProof && !showUploadForm && (
              <Button
                onClick={() => setShowUploadForm(true)}
                variant={payment.verificationNotes ? 'default' : 'outline'}
                size="sm"
                className={
                  payment.verificationNotes
                    ? 'w-full bg-sky-400 text-slate-950 hover:bg-sky-300'
                    : 'w-full border-white/10 bg-white/5 text-white hover:bg-white/10'
                }
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
                <p className="py-2 text-center text-sm text-white/55">
                  This payment has been marked as paid.
                </p>
              )}
          </div>

          <Separator className="bg-white/10" />

          <div
            className={
              canUploadProof
                ? 'grid gap-2 sm:grid-cols-[minmax(0,1fr)_minmax(0,1fr)_auto]'
                : 'grid gap-2 sm:grid-cols-[minmax(0,1fr)_auto]'
            }
          >
            {canUploadProof && (
              <Button
                className="cursor-not-allowed border-white/10 bg-white/10 text-white/55 hover:bg-white/10"
                disabled
              >
                <CreditCard className="mr-2 h-4 w-4" />
                Pay Online
                <Badge variant="secondary" className="ml-2">
                  Soon
                </Badge>
              </Button>
            )}
            <Button
              variant="outline"
              className="border-white/10 bg-white/5 text-white hover:bg-white/10"
              onClick={() => window.open(`/api/tenant/payments/${payment.id}/invoice`, '_blank')}
            >
              <Download className="mr-2 h-4 w-4" />
              View Invoice
            </Button>
            <Button
              variant="outline"
              className="border-white/10 bg-white/5 text-white hover:bg-white/10"
              onClick={() => onOpenChange(false)}
            >
              Close
            </Button>
          </div>
        </div>
      </DialogContent>
    </Dialog>
  );
}
