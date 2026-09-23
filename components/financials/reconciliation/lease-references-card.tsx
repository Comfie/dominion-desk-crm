'use client';

import { useState } from 'react';
import { Check, Copy, MessageCircle } from 'lucide-react';

import { Button } from '@/components/ui/button';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { useToast } from '@/hooks/use-toast';

import type { LeaseReference } from './types';
import { rand } from './types';

function tenantMessage(ref: LeaseReference) {
  return (
    `Hi ${ref.tenantFirstName}, from now on please use this reference for every rent payment ` +
    `for ${ref.propertyName}${ref.unitLabel ? ` (${ref.unitLabel})` : ''}: ${ref.reference}. ` +
    `It lets us confirm your payment the same day. Thank you!`
  );
}

/** SA mobile numbers → wa.me format (0821234567 → 27821234567). */
function whatsappLink(phone: string | null, text: string) {
  const digits = phone?.replace(/\D/g, '') ?? '';
  const intl = digits.startsWith('0') ? `27${digits.slice(1)}` : digits;
  const target = intl.length >= 10 ? intl : '';
  return `https://wa.me/${target}?text=${encodeURIComponent(text)}`;
}

export function LeaseReferencesCard({ references }: { references: LeaseReference[] }) {
  const { toast } = useToast();
  const [copied, setCopied] = useState<string | null>(null);

  const copy = async (key: string, text: string) => {
    await navigator.clipboard.writeText(text);
    setCopied(key);
    toast({ title: 'Copied to clipboard' });
    setTimeout(() => setCopied(null), 1500);
  };

  return (
    <Card>
      <CardHeader>
        <CardTitle>Tenant payment references</CardTitle>
        <CardDescription>
          Ask each tenant to use their reference on every EFT. Deposits with the reference match
          automatically. It also shows on their invoices and in the tenant portal.
        </CardDescription>
      </CardHeader>
      <CardContent>
        {references.length === 0 ? (
          <p className="text-muted-foreground text-sm">
            Add a tenant with an active lease to get their reference.
          </p>
        ) : (
          <div className="divide-y">
            {references.map((ref) => (
              <div
                key={ref.leaseId}
                className="flex flex-col gap-2 py-3 sm:flex-row sm:items-center sm:justify-between"
              >
                <div className="min-w-0">
                  <p className="truncate font-medium">{ref.tenantName}</p>
                  <p className="text-muted-foreground truncate text-xs">
                    {ref.propertyName}
                    {ref.unitLabel ? ` · ${ref.unitLabel}` : ''} · {rand(ref.monthlyRent)}/month
                  </p>
                </div>
                <div className="flex items-center gap-2">
                  <code className="bg-muted rounded px-2 py-1 font-mono text-sm font-semibold">
                    {ref.reference}
                  </code>
                  <Button
                    size="icon"
                    variant="ghost"
                    className="h-8 w-8"
                    title="Copy reference"
                    onClick={() => void copy(ref.leaseId, ref.reference ?? '')}
                  >
                    {copied === ref.leaseId ? (
                      <Check className="h-4 w-4 text-emerald-600" />
                    ) : (
                      <Copy className="h-4 w-4" />
                    )}
                  </Button>
                  <Button size="sm" variant="outline" asChild>
                    <a
                      href={whatsappLink(ref.tenantPhone, tenantMessage(ref))}
                      target="_blank"
                      rel="noopener noreferrer"
                    >
                      <MessageCircle className="mr-1 h-4 w-4" /> Send
                    </a>
                  </Button>
                </div>
              </div>
            ))}
          </div>
        )}
      </CardContent>
    </Card>
  );
}
