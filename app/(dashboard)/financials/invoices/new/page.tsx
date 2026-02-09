'use client';

import { useState, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Textarea } from '@/components/ui/textarea';
import { Checkbox } from '@/components/ui/checkbox';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';
import { useToast } from '@/hooks/use-toast';
import { Loader2, Plus, Trash2, ArrowLeft } from 'lucide-react';
import { PaymentType } from '@prisma/client';
import Link from 'next/link';

interface LineItem {
  id: string;
  description: string;
  amount: string;
  type: PaymentType;
}

export default function NewInvoicePage() {
  const router = useRouter();
  const { toast } = useToast();
  const [loading, setLoading] = useState(false);
  const [tenants, setTenants] = useState<any[]>([]);
  const [properties, setProperties] = useState<any[]>([]);
  const [selectedTenantProperties, setSelectedTenantProperties] = useState<any[]>([]);

  const [formData, setFormData] = useState({
    tenantId: '',
    propertyId: '',
    dueDate: '',
    notes: '',
    sendEmail: true,
  });

  const [lineItems, setLineItems] = useState<LineItem[]>([
    {
      id: crypto.randomUUID(),
      description: '',
      amount: '',
      type: PaymentType.OTHER,
    },
  ]);

  useEffect(() => {
    fetchTenants();
    fetchProperties();
  }, []);

  useEffect(() => {
    if (formData.tenantId) {
      fetchTenantProperties(formData.tenantId);
    } else {
      setSelectedTenantProperties([]);
      setFormData({ ...formData, propertyId: '' });
    }
  }, [formData.tenantId]);

  const fetchTenants = async () => {
    try {
      const response = await fetch('/api/tenants');
      if (response.ok) {
        const result = await response.json();
        setTenants(result.data || []);
      }
    } catch (error) {
      console.error('Error fetching tenants:', error);
    }
  };

  const fetchProperties = async () => {
    try {
      const response = await fetch('/api/properties');
      if (response.ok) {
        const result = await response.json();
        setProperties(result.data || []);
      }
    } catch (error) {
      console.error('Error fetching properties:', error);
    }
  };

  const fetchTenantProperties = async (tenantId: string) => {
    try {
      const response = await fetch(`/api/tenants/${tenantId}/properties`);
      if (response.ok) {
        const data = await response.json();
        setSelectedTenantProperties(data || []);

        // Auto-select property if tenant has only one active lease
        if (data.length === 1) {
          setFormData({ ...formData, propertyId: data[0].property.id });
        }
      }
    } catch (error) {
      console.error('Error fetching tenant properties:', error);
    }
  };

  const addLineItem = () => {
    setLineItems([
      ...lineItems,
      {
        id: crypto.randomUUID(),
        description: '',
        amount: '',
        type: PaymentType.OTHER,
      },
    ]);
  };

  const removeLineItem = (id: string) => {
    if (lineItems.length === 1) {
      toast({ title: 'At least one line item is required', variant: 'destructive' });
      return;
    }
    setLineItems(lineItems.filter((item) => item.id !== id));
  };

  const updateLineItem = (id: string, field: keyof LineItem, value: string) => {
    setLineItems(lineItems.map((item) => (item.id === id ? { ...item, [field]: value } : item)));
  };

  const calculateTotal = () => {
    return lineItems.reduce((sum, item) => {
      const amount = parseFloat(item.amount) || 0;
      return sum + amount;
    }, 0);
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);

    try {
      // Validation
      if (!formData.tenantId) {
        toast({ title: 'Please select a tenant', variant: 'destructive' });
        return;
      }

      if (!formData.propertyId) {
        toast({ title: 'Please select a property', variant: 'destructive' });
        return;
      }

      if (!formData.dueDate) {
        toast({ title: 'Please select a due date', variant: 'destructive' });
        return;
      }

      const invalidLineItems = lineItems.filter(
        (item) => !item.description || !item.amount || parseFloat(item.amount) <= 0
      );

      if (invalidLineItems.length > 0) {
        toast({
          title: 'Please fill in all line items with valid amounts',
          variant: 'destructive',
        });
        return;
      }

      const payload = {
        tenantId: formData.tenantId,
        propertyId: formData.propertyId,
        dueDate: formData.dueDate,
        lineItems: lineItems.map((item) => ({
          description: item.description,
          amount: parseFloat(item.amount),
          type: item.type,
        })),
        notes: formData.notes,
        sendEmail: formData.sendEmail,
      };

      const response = await fetch('/api/invoices/manual', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(payload),
      });

      if (!response.ok) {
        const error = await response.json();
        throw new Error(error.error || 'Failed to create invoice');
      }

      const result = await response.json();

      toast({ title: 'Invoice created successfully' });
      router.push(`/financials/payments/${result.payment.id}`);
    } catch (error: any) {
      console.error('Error creating invoice:', error);
      toast({ title: error.message || 'Failed to create invoice', variant: 'destructive' });
    } finally {
      setLoading(false);
    }
  };

  const paymentTypes = [
    { value: PaymentType.RENT, label: 'Rent' },
    { value: PaymentType.UTILITIES, label: 'Utilities' },
    { value: PaymentType.LATE_FEE, label: 'Late Fee' },
    { value: PaymentType.DEPOSIT, label: 'Deposit' },
    { value: PaymentType.DAMAGE, label: 'Maintenance/Damage' },
    { value: PaymentType.OTHER, label: 'Other' },
  ];

  // Debug: verify component loaded
  console.log('NewInvoicePage loaded - key fix applied');

  const totalAmount = calculateTotal();

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex items-center gap-4">
        <Button variant="ghost" size="icon" asChild>
          <Link href="/financials/rent-collection">
            <ArrowLeft className="h-5 w-5" />
          </Link>
        </Button>
        <div>
          <h1 className="text-3xl font-bold tracking-tight">Create Manual Invoice</h1>
          <p className="text-muted-foreground">
            Create an invoice for utilities, late fees, or other charges
          </p>
        </div>
      </div>

      <form onSubmit={handleSubmit} className="space-y-6">
        {/* Basic Information */}
        <Card>
          <CardHeader>
            <CardTitle>Invoice Details</CardTitle>
          </CardHeader>
          <CardContent className="space-y-4">
            <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
              <div className="space-y-2">
                <Label htmlFor="tenant">Tenant *</Label>
                <Select
                  value={formData.tenantId}
                  onValueChange={(value) => setFormData({ ...formData, tenantId: value })}
                  required
                >
                  <SelectTrigger id="tenant">
                    <SelectValue placeholder="Select tenant" />
                  </SelectTrigger>
                  <SelectContent>
                    {tenants.map((tenant) => (
                      <SelectItem key={tenant.id} value={tenant.id}>
                        {tenant.firstName} {tenant.lastName} ({tenant.email})
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>

              <div className="space-y-2">
                <Label htmlFor="property">Property *</Label>
                <Select
                  value={formData.propertyId}
                  onValueChange={(value) => setFormData({ ...formData, propertyId: value })}
                  disabled={!formData.tenantId}
                  required
                >
                  <SelectTrigger id="property">
                    <SelectValue placeholder="Select property" />
                  </SelectTrigger>
                  <SelectContent>
                    {selectedTenantProperties.length > 0 ? (
                      selectedTenantProperties.map((lease: any) => {
                        const today = new Date();
                        const moveInDate = lease.moveInDate
                          ? new Date(lease.moveInDate)
                          : new Date(lease.leaseStartDate);
                        const hasStarted = moveInDate <= today;
                        const leaseEndDate = lease.leaseEndDate
                          ? new Date(lease.leaseEndDate)
                          : null;
                        const hasEnded = leaseEndDate && leaseEndDate < today;

                        let status = '';
                        if (hasEnded) {
                          status = ' (Ended)';
                        } else if (!hasStarted) {
                          status = ` (Starts ${moveInDate.toLocaleDateString()})`;
                        } else {
                          status = ' (Current)';
                        }

                        return (
                          <SelectItem key={lease.property.id} value={lease.property.id}>
                            {lease.property.name}
                            {lease.unitLabel && ` - ${lease.unitLabel}`}
                            {status}
                          </SelectItem>
                        );
                      })
                    ) : (
                      <SelectItem value="_" disabled>
                        {formData.tenantId ? 'No active leases' : 'Select a tenant first'}
                      </SelectItem>
                    )}
                  </SelectContent>
                </Select>
              </div>

              <div className="space-y-2">
                <Label htmlFor="dueDate">Due Date *</Label>
                <Input
                  id="dueDate"
                  type="date"
                  value={formData.dueDate}
                  onChange={(e) => setFormData({ ...formData, dueDate: e.target.value })}
                  required
                />
              </div>
            </div>
          </CardContent>
        </Card>

        {/* Line Items */}
        <Card>
          <CardHeader>
            <div className="flex items-center justify-between">
              <CardTitle>Line Items</CardTitle>
              <Button type="button" variant="outline" size="sm" onClick={addLineItem}>
                <Plus className="mr-1 h-4 w-4" />
                Add Item
              </Button>
            </div>
          </CardHeader>
          <CardContent className="space-y-4">
            {lineItems.map((item, index) => (
              <div key={item.id} className="space-y-4 rounded-lg border p-4">
                <div className="flex items-center justify-between">
                  <h4 className="font-medium">Item {index + 1}</h4>
                  {lineItems.length > 1 && (
                    <Button
                      type="button"
                      variant="ghost"
                      size="icon"
                      onClick={() => removeLineItem(item.id)}
                    >
                      <Trash2 className="text-destructive h-4 w-4" />
                    </Button>
                  )}
                </div>

                <div className="grid grid-cols-1 gap-4 sm:grid-cols-3">
                  <div className="space-y-2 sm:col-span-2">
                    <Label htmlFor={`description-${item.id}`}>Description *</Label>
                    <Input
                      id={`description-${item.id}`}
                      value={item.description}
                      onChange={(e) => updateLineItem(item.id, 'description', e.target.value)}
                      placeholder="e.g., Water and electricity"
                      required
                    />
                  </div>

                  <div className="space-y-2">
                    <Label htmlFor={`amount-${item.id}`}>Amount *</Label>
                    <Input
                      id={`amount-${item.id}`}
                      type="number"
                      step="0.01"
                      min="0.01"
                      value={item.amount}
                      onChange={(e) => updateLineItem(item.id, 'amount', e.target.value)}
                      placeholder="0.00"
                      required
                    />
                  </div>

                  <div className="space-y-2">
                    <Label htmlFor={`type-${item.id}`}>Type</Label>
                    <Select
                      value={item.type}
                      onValueChange={(value: PaymentType) => updateLineItem(item.id, 'type', value)}
                    >
                      <SelectTrigger id={`type-${item.id}`}>
                        <SelectValue />
                      </SelectTrigger>
                      <SelectContent>
                        {paymentTypes.map((type) => (
                          <SelectItem key={`${item.id}-${type.value}`} value={type.value}>
                            {type.label}
                          </SelectItem>
                        ))}
                      </SelectContent>
                    </Select>
                  </div>
                </div>
              </div>
            ))}

            <div className="flex justify-end border-t pt-4">
              <div className="text-right">
                <p className="text-muted-foreground text-sm">Total Amount</p>
                <p className="text-2xl font-bold">R{totalAmount.toFixed(2)}</p>
              </div>
            </div>
          </CardContent>
        </Card>

        {/* Additional Information */}
        <Card>
          <CardHeader>
            <CardTitle>Additional Information</CardTitle>
          </CardHeader>
          <CardContent className="space-y-4">
            <div className="space-y-2">
              <Label htmlFor="notes">Notes</Label>
              <Textarea
                id="notes"
                value={formData.notes}
                onChange={(e) => setFormData({ ...formData, notes: e.target.value })}
                placeholder="Optional notes or instructions for the tenant"
                rows={3}
              />
            </div>

            <div className="flex items-center space-x-2">
              <Checkbox
                id="sendEmail"
                checked={formData.sendEmail}
                onCheckedChange={(checked) =>
                  setFormData({ ...formData, sendEmail: checked as boolean })
                }
              />
              <label
                htmlFor="sendEmail"
                className="text-sm leading-none font-medium peer-disabled:cursor-not-allowed peer-disabled:opacity-70"
              >
                Send invoice email to tenant
              </label>
            </div>
          </CardContent>
        </Card>

        {/* Actions */}
        <div className="flex justify-end gap-4">
          <Button type="button" variant="outline" onClick={() => router.back()} disabled={loading}>
            Cancel
          </Button>
          <Button type="submit" disabled={loading}>
            {loading && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}
            Create Invoice
          </Button>
        </div>
      </form>
    </div>
  );
}
