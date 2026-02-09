'use client';

import { Fragment, useState } from 'react';
import { PaymentStatus } from '@prisma/client';
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from '@/components/ui/table';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import {
  ChevronDown,
  ChevronRight,
  CheckCircle2,
  Clock,
  AlertCircle,
  FileText,
  Send,
  Eye,
} from 'lucide-react';
import Link from 'next/link';

interface TenantPaymentData {
  lease: {
    id: string;
    unitLabel: string | null;
  };
  tenant: {
    id: string;
    firstName: string;
    lastName: string;
    email: string;
  };
  unitLabel: string | null;
  monthlyRent: number;
  payment: {
    id: string;
    amount: number;
    status: PaymentStatus;
    dueDate: Date | null;
    paymentDate: Date | null;
    invoiceNumber: string | null;
    invoiceUrl: string | null;
    proofOfPaymentUrl: string | null;
    proofUploadedAt: Date | null;
  } | null;
  daysOverdue: number;
}

interface PropertyPaymentData {
  property: {
    id: string;
    name: string;
    address: string | null;
  };
  tenants: TenantPaymentData[];
  subtotals: {
    expected: number;
    collected: number;
    outstanding: number;
    paidCount: number;
    totalCount: number;
  };
}

interface RentCollectionGridProps {
  data: PropertyPaymentData[];
  currency?: string;
  onRecordPayment?: (payment: any, tenant: any, property: any) => void;
  onSendReminder?: (payment: any, tenant: any) => void;
  onVerifyProof?: (payment: any) => void;
}

export function RentCollectionGrid({
  data,
  currency = 'ZAR',
  onRecordPayment,
  onSendReminder,
  onVerifyProof,
}: RentCollectionGridProps) {
  const [expandedProperties, setExpandedProperties] = useState<Set<string>>(
    new Set(data.map((p) => p.property.id)) // Expand all by default
  );

  const toggleProperty = (propertyId: string) => {
    const newExpanded = new Set(expandedProperties);
    if (newExpanded.has(propertyId)) {
      newExpanded.delete(propertyId);
    } else {
      newExpanded.add(propertyId);
    }
    setExpandedProperties(newExpanded);
  };

  const formatCurrency = (amount: number) => {
    return new Intl.NumberFormat('en-ZA', {
      style: 'currency',
      currency,
    }).format(amount);
  };

  const formatDate = (date: Date | null) => {
    if (!date) return '-';
    return new Date(date).toLocaleDateString('en-ZA', {
      month: 'short',
      day: 'numeric',
    });
  };

  const getStatusBadge = (tenant: TenantPaymentData) => {
    const payment = tenant.payment;

    if (!payment) {
      return (
        <Badge variant="outline" className="gap-1">
          <Clock className="h-3 w-3" />
          Not Generated
        </Badge>
      );
    }

    switch (payment.status) {
      case PaymentStatus.PAID:
        return (
          <Badge variant="default" className="gap-1 bg-green-600">
            <CheckCircle2 className="h-3 w-3" />
            PAID ({formatDate(payment.paymentDate)})
          </Badge>
        );
      case PaymentStatus.OVERDUE:
        return (
          <Badge variant="destructive" className="gap-1">
            <AlertCircle className="h-3 w-3" />
            OVERDUE ({tenant.daysOverdue} days)
          </Badge>
        );
      case PaymentStatus.PENDING_VERIFICATION:
        return (
          <Badge
            variant="secondary"
            className="gap-1 bg-yellow-100 text-yellow-800 dark:bg-yellow-900 dark:text-yellow-200"
          >
            <Eye className="h-3 w-3" />
            PENDING VERIFICATION
          </Badge>
        );
      case PaymentStatus.PENDING:
        return (
          <Badge variant="outline" className="gap-1">
            <Clock className="h-3 w-3" />
            PENDING
          </Badge>
        );
      default:
        return <Badge variant="outline">{payment.status}</Badge>;
    }
  };

  const getActions = (tenant: TenantPaymentData, property: PropertyPaymentData['property']) => {
    const payment = tenant.payment;

    if (!payment) {
      return (
        <Button
          size="sm"
          variant="outline"
          onClick={() => onRecordPayment?.(null, tenant.tenant, property)}
        >
          Record Payment
        </Button>
      );
    }

    switch (payment.status) {
      case PaymentStatus.PAID:
        return (
          <Button size="sm" variant="ghost" asChild>
            <Link href={`/financials/payments/${payment.id}`}>
              <FileText className="mr-1 h-4 w-4" />
              View Invoice
            </Link>
          </Button>
        );
      case PaymentStatus.PENDING_VERIFICATION:
        return (
          <div className="flex gap-2">
            <Button size="sm" variant="default" onClick={() => onVerifyProof?.(payment)}>
              <Eye className="mr-1 h-4 w-4" />
              Verify Proof
            </Button>
          </div>
        );
      case PaymentStatus.PENDING:
      case PaymentStatus.OVERDUE:
        return (
          <div className="flex gap-2">
            <Button
              size="sm"
              variant="outline"
              onClick={() => onRecordPayment?.(payment, tenant.tenant, property)}
            >
              Record Payment
            </Button>
            <Button
              size="sm"
              variant="ghost"
              onClick={() => onSendReminder?.(payment, tenant.tenant)}
            >
              <Send className="mr-1 h-4 w-4" />
              Send Reminder
            </Button>
          </div>
        );
      default:
        return null;
    }
  };

  if (!data || data.length === 0) {
    return (
      <div className="rounded-lg border p-8 text-center">
        <p className="text-muted-foreground">
          No properties with active leases found for this period.
        </p>
      </div>
    );
  }

  return (
    <div className="rounded-lg border">
      <Table>
        <TableHeader>
          <TableRow>
            <TableHead className="w-[300px]">Property</TableHead>
            <TableHead>Tenant</TableHead>
            <TableHead>Unit</TableHead>
            <TableHead className="text-right">Rent</TableHead>
            <TableHead>Status</TableHead>
            <TableHead className="text-right">Actions</TableHead>
          </TableRow>
        </TableHeader>
        <TableBody>
          {data.map((propertyData) => {
            const isExpanded = expandedProperties.has(propertyData.property.id);
            const { subtotals } = propertyData;

            return (
              <Fragment key={propertyData.property.id}>
                {/* Property Row */}
                <TableRow
                  className="bg-muted/50 hover:bg-muted cursor-pointer font-medium"
                  onClick={() => toggleProperty(propertyData.property.id)}
                >
                  <TableCell>
                    <div className="flex items-center gap-2">
                      {isExpanded ? (
                        <ChevronDown className="h-4 w-4" />
                      ) : (
                        <ChevronRight className="h-4 w-4" />
                      )}
                      <div>
                        <div className="font-semibold">{propertyData.property.name}</div>
                        {propertyData.property.address && (
                          <div className="text-muted-foreground text-xs">
                            {propertyData.property.address}
                          </div>
                        )}
                      </div>
                    </div>
                  </TableCell>
                  <TableCell colSpan={2}></TableCell>
                  <TableCell className="text-right">{formatCurrency(subtotals.expected)}</TableCell>
                  <TableCell>
                    <Badge
                      variant={
                        subtotals.paidCount === subtotals.totalCount ? 'default' : 'secondary'
                      }
                    >
                      {subtotals.paidCount}/{subtotals.totalCount} Paid
                    </Badge>
                  </TableCell>
                  <TableCell className="text-right">
                    <span className="text-muted-foreground text-sm">
                      Collected: {formatCurrency(subtotals.collected)}
                    </span>
                  </TableCell>
                </TableRow>

                {/* Tenant Rows */}
                {isExpanded &&
                  propertyData.tenants.map((tenant) => (
                    <TableRow key={`${tenant.tenant.id}-${tenant.lease.id}`}>
                      <TableCell className="pl-12">{/* Empty - indent under property */}</TableCell>
                      <TableCell>
                        <div>
                          <div className="font-medium">
                            {tenant.tenant.firstName} {tenant.tenant.lastName}
                          </div>
                          <div className="text-muted-foreground text-xs">{tenant.tenant.email}</div>
                        </div>
                      </TableCell>
                      <TableCell>{tenant.unitLabel || '-'}</TableCell>
                      <TableCell className="text-right">
                        {formatCurrency(tenant.monthlyRent)}
                      </TableCell>
                      <TableCell>{getStatusBadge(tenant)}</TableCell>
                      <TableCell className="text-right">
                        {getActions(tenant, propertyData.property)}
                      </TableCell>
                    </TableRow>
                  ))}
              </Fragment>
            );
          })}
        </TableBody>
      </Table>
    </div>
  );
}
