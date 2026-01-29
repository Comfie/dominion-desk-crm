'use client';

import { use, useState } from 'react';
import { useRouter } from 'next/navigation';
import Link from 'next/link';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { ArrowLeft, Plus, TrendingUp, Trash2, Edit2 } from 'lucide-react';
import { format } from 'date-fns';

import { PageHeader } from '@/components/shared';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Textarea } from '@/components/ui/textarea';
import { Skeleton } from '@/components/ui/skeleton';
import { Badge } from '@/components/ui/badge';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from '@/components/ui/dialog';
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
} from '@/components/ui/alert-dialog';
import { useToast } from '@/hooks/use-toast';

interface Valuation {
  id: string;
  valuationAmount: number;
  valuationType: string;
  valuedBy: string | null;
  valuationDate: string;
  notes: string | null;
  createdAt: string;
}

interface Property {
  id: string;
  name: string;
  address: string;
  purchasePrice: number | null;
  purchaseDate: string | null;
  currentValuation: number | null;
  lastValuationDate: string | null;
}

const valuationTypeLabels: Record<string, string> = {
  PURCHASE: 'Purchase Price',
  MARKET: 'Market Valuation',
  MUNICIPAL: 'Municipal Valuation',
  INSURANCE: 'Insurance Valuation',
  BANK: 'Bank Valuation',
};

const formatCurrency = (amount: number) =>
  new Intl.NumberFormat('en-ZA', { style: 'currency', currency: 'ZAR' }).format(amount);

export default function PropertyValuationsPage({ params }: { params: Promise<{ id: string }> }) {
  const { id } = use(params);
  const router = useRouter();
  const queryClient = useQueryClient();
  const { toast } = useToast();

  const [addDialogOpen, setAddDialogOpen] = useState(false);
  const [editDialogOpen, setEditDialogOpen] = useState(false);
  const [deleteDialogOpen, setDeleteDialogOpen] = useState(false);
  const [selectedValuation, setSelectedValuation] = useState<Valuation | null>(null);
  const [formData, setFormData] = useState({
    valuationType: 'MARKET',
    valuationAmount: '',
    valuationDate: new Date().toISOString().split('T')[0],
    valuedBy: '',
    notes: '',
  });

  // Fetch property with valuations
  const { data: property, isLoading: loadingProperty } = useQuery<Property>({
    queryKey: ['property', id],
    queryFn: async () => {
      const res = await fetch(`/api/properties/${id}`);
      if (!res.ok) throw new Error('Failed to fetch property');
      return res.json();
    },
  });

  const { data: valuations, isLoading: loadingValuations } = useQuery<Valuation[]>({
    queryKey: ['valuations', id],
    queryFn: async () => {
      const res = await fetch(`/api/properties/${id}/valuations`);
      if (!res.ok) throw new Error('Failed to fetch valuations');
      return res.json();
    },
  });

  const addMutation = useMutation({
    mutationFn: async (data: typeof formData) => {
      const res = await fetch(`/api/properties/${id}/valuations`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          ...data,
          valuationAmount: parseFloat(data.valuationAmount),
          valuationDate: new Date(data.valuationDate).toISOString(),
        }),
      });
      if (!res.ok) {
        const err = await res.json();
        throw new Error(err.error || 'Failed to add valuation');
      }
      return res.json();
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['valuations', id] });
      queryClient.invalidateQueries({ queryKey: ['property', id] });
      setAddDialogOpen(false);
      resetForm();
      toast({ title: 'Valuation added', description: 'Property value has been updated.' });
    },
    onError: (error: Error) => {
      toast({ title: 'Error', description: error.message, variant: 'destructive' });
    },
  });

  const updateMutation = useMutation({
    mutationFn: async (data: typeof formData) => {
      if (!selectedValuation) throw new Error('No valuation selected');
      const res = await fetch(`/api/properties/${id}/valuations/${selectedValuation.id}`, {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          ...data,
          valuationAmount: parseFloat(data.valuationAmount),
          valuationDate: new Date(data.valuationDate).toISOString(),
        }),
      });
      if (!res.ok) {
        const err = await res.json();
        throw new Error(err.error || 'Failed to update valuation');
      }
      return res.json();
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['valuations', id] });
      queryClient.invalidateQueries({ queryKey: ['property', id] });
      setEditDialogOpen(false);
      setSelectedValuation(null);
      resetForm();
      toast({ title: 'Valuation updated', description: 'Property value has been recalculated.' });
    },
    onError: (error: Error) => {
      toast({ title: 'Error', description: error.message, variant: 'destructive' });
    },
  });

  const deleteMutation = useMutation({
    mutationFn: async (valuationId: string) => {
      const res = await fetch(`/api/properties/${id}/valuations/${valuationId}`, {
        method: 'DELETE',
      });
      if (!res.ok) {
        const err = await res.json();
        throw new Error(err.error || 'Failed to delete valuation');
      }
      return res.json();
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['valuations', id] });
      queryClient.invalidateQueries({ queryKey: ['property', id] });
      setDeleteDialogOpen(false);
      setSelectedValuation(null);
      toast({ title: 'Valuation deleted', description: 'Property value has been recalculated.' });
    },
    onError: (error: Error) => {
      toast({ title: 'Error', description: error.message, variant: 'destructive' });
    },
  });

  const resetForm = () => {
    setFormData({
      valuationType: 'MARKET',
      valuationAmount: '',
      valuationDate: new Date().toISOString().split('T')[0],
      valuedBy: '',
      notes: '',
    });
  };

  const openAddDialog = () => {
    resetForm();
    setAddDialogOpen(true);
  };

  const openEditDialog = (valuation: Valuation) => {
    setSelectedValuation(valuation);
    setFormData({
      valuationType: valuation.valuationType,
      valuationAmount: valuation.valuationAmount.toString(),
      valuationDate: new Date(valuation.valuationDate).toISOString().split('T')[0],
      valuedBy: valuation.valuedBy || '',
      notes: valuation.notes || '',
    });
    setEditDialogOpen(true);
  };

  const openDeleteDialog = (valuation: Valuation) => {
    setSelectedValuation(valuation);
    setDeleteDialogOpen(true);
  };

  const handleAdd = (e: React.FormEvent) => {
    e.preventDefault();
    if (!formData.valuationAmount || parseFloat(formData.valuationAmount) <= 0) {
      toast({ title: 'Error', description: 'Please enter a valid amount', variant: 'destructive' });
      return;
    }
    addMutation.mutate(formData);
  };

  const handleUpdate = (e: React.FormEvent) => {
    e.preventDefault();
    if (!formData.valuationAmount || parseFloat(formData.valuationAmount) <= 0) {
      toast({ title: 'Error', description: 'Please enter a valid amount', variant: 'destructive' });
      return;
    }
    updateMutation.mutate(formData);
  };

  const handleDelete = () => {
    if (selectedValuation) {
      deleteMutation.mutate(selectedValuation.id);
    }
  };

  if (loadingProperty) {
    return (
      <div className="space-y-6">
        <Skeleton className="h-12 w-64" />
        <Skeleton className="h-48 w-full" />
      </div>
    );
  }

  if (!property) {
    return (
      <div className="py-12 text-center">
        <p className="text-muted-foreground">Property not found</p>
        <Button onClick={() => router.push('/properties')} className="mt-4">
          Back to Properties
        </Button>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      <PageHeader
        title="Property Valuations"
        description={`${property.name} - ${property.address}`}
      >
        <div className="flex gap-2">
          <Button variant="ghost" asChild>
            <Link href={`/properties/${id}`}>
              <ArrowLeft className="mr-2 h-4 w-4" />
              Back
            </Link>
          </Button>
          <Button onClick={openAddDialog}>
            <Plus className="mr-2 h-4 w-4" />
            Add Valuation
          </Button>
        </div>
      </PageHeader>

      {/* Current Value Summary */}
      <div className="grid gap-4 sm:grid-cols-3">
        <Card>
          <CardHeader className="pb-2">
            <CardTitle className="text-sm font-medium">Purchase Price</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">
              {property.purchasePrice ? formatCurrency(Number(property.purchasePrice)) : 'Not set'}
            </div>
            {property.purchaseDate && (
              <p className="text-muted-foreground text-xs">
                {format(new Date(property.purchaseDate), 'PPP')}
              </p>
            )}
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="pb-2">
            <CardTitle className="text-sm font-medium">Current Value</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold text-green-600">
              {property.currentValuation
                ? formatCurrency(Number(property.currentValuation))
                : 'Not valued'}
            </div>
            {property.lastValuationDate && (
              <p className="text-muted-foreground text-xs">
                Last valued: {format(new Date(property.lastValuationDate), 'PPP')}
              </p>
            )}
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="pb-2">
            <CardTitle className="text-sm font-medium">Appreciation</CardTitle>
          </CardHeader>
          <CardContent>
            {property.purchasePrice && property.currentValuation ? (
              <>
                <div
                  className={`text-2xl font-bold ${
                    Number(property.currentValuation) >= Number(property.purchasePrice)
                      ? 'text-green-600'
                      : 'text-red-600'
                  }`}
                >
                  {(
                    ((Number(property.currentValuation) - Number(property.purchasePrice)) /
                      Number(property.purchasePrice)) *
                    100
                  ).toFixed(1)}
                  %
                </div>
                <p className="text-muted-foreground text-xs">
                  {formatCurrency(
                    Number(property.currentValuation) - Number(property.purchasePrice)
                  )}
                </p>
              </>
            ) : (
              <div className="text-muted-foreground text-2xl font-bold">N/A</div>
            )}
          </CardContent>
        </Card>
      </div>

      {/* Valuation History */}
      <Card>
        <CardHeader>
          <CardTitle>Valuation History</CardTitle>
          <CardDescription>Track property value changes over time</CardDescription>
        </CardHeader>
        <CardContent>
          {loadingValuations ? (
            <div className="space-y-4">
              {[...Array(3)].map((_, i) => (
                <Skeleton key={i} className="h-16 w-full" />
              ))}
            </div>
          ) : valuations && valuations.length > 0 ? (
            <div className="space-y-4">
              {valuations.map((valuation, index) => (
                <div
                  key={valuation.id}
                  className="flex items-center justify-between border-b pb-4 last:border-0 last:pb-0"
                >
                  <div className="flex items-center gap-4">
                    <div
                      className={`flex h-10 w-10 items-center justify-center rounded-full ${
                        index === 0 ? 'bg-green-100' : 'bg-muted'
                      }`}
                    >
                      <TrendingUp
                        className={`h-5 w-5 ${index === 0 ? 'text-green-600' : 'text-muted-foreground'}`}
                      />
                    </div>
                    <div>
                      <div className="flex items-center gap-2">
                        <p className="font-semibold">
                          {formatCurrency(Number(valuation.valuationAmount))}
                        </p>
                        <Badge variant="outline">
                          {valuationTypeLabels[valuation.valuationType] || valuation.valuationType}
                        </Badge>
                      </div>
                      <div className="text-muted-foreground flex items-center gap-2 text-sm">
                        <span>{format(new Date(valuation.valuationDate), 'PPP')}</span>
                        {valuation.valuedBy && <span>• {valuation.valuedBy}</span>}
                      </div>
                      {valuation.notes && (
                        <p className="text-muted-foreground mt-1 text-sm">{valuation.notes}</p>
                      )}
                    </div>
                  </div>
                  <div className="flex gap-2">
                    <Button variant="ghost" size="icon" onClick={() => openEditDialog(valuation)}>
                      <Edit2 className="h-4 w-4" />
                    </Button>
                    <Button variant="ghost" size="icon" onClick={() => openDeleteDialog(valuation)}>
                      <Trash2 className="text-destructive h-4 w-4" />
                    </Button>
                  </div>
                </div>
              ))}
            </div>
          ) : (
            <div className="py-8 text-center">
              <TrendingUp className="text-muted-foreground/50 mx-auto h-12 w-12" />
              <p className="text-muted-foreground mt-4">No valuations recorded yet</p>
              <Button onClick={openAddDialog} className="mt-4">
                <Plus className="mr-2 h-4 w-4" />
                Add First Valuation
              </Button>
            </div>
          )}
        </CardContent>
      </Card>

      {/* Add Valuation Dialog */}
      <Dialog open={addDialogOpen} onOpenChange={setAddDialogOpen}>
        <DialogContent className="max-w-md">
          <DialogHeader>
            <DialogTitle>Add Valuation</DialogTitle>
            <DialogDescription>Record a new property valuation</DialogDescription>
          </DialogHeader>
          <form onSubmit={handleAdd} className="space-y-4">
            <div className="space-y-2">
              <Label>Valuation Type</Label>
              <select
                value={formData.valuationType}
                onChange={(e) => setFormData({ ...formData, valuationType: e.target.value })}
                className="border-input focus-visible:ring-ring flex h-10 w-full rounded-md border bg-transparent px-3 py-2 text-sm"
                required
              >
                <option value="PURCHASE">Purchase Price</option>
                <option value="MARKET">Market Valuation</option>
                <option value="MUNICIPAL">Municipal Valuation</option>
                <option value="INSURANCE">Insurance Valuation</option>
                <option value="BANK">Bank Valuation</option>
              </select>
            </div>

            <div className="space-y-2">
              <Label>Amount (R)</Label>
              <Input
                type="number"
                value={formData.valuationAmount}
                onChange={(e) => setFormData({ ...formData, valuationAmount: e.target.value })}
                placeholder="1500000"
                min="0"
                step="0.01"
                required
              />
            </div>

            <div className="space-y-2">
              <Label>Valuation Date</Label>
              <Input
                type="date"
                value={formData.valuationDate}
                onChange={(e) => setFormData({ ...formData, valuationDate: e.target.value })}
                required
              />
            </div>

            <div className="space-y-2">
              <Label>Valued By</Label>
              <Input
                value={formData.valuedBy}
                onChange={(e) => setFormData({ ...formData, valuedBy: e.target.value })}
                placeholder="e.g., Property24, Bank Name, Agent"
              />
            </div>

            <div className="space-y-2">
              <Label>Notes</Label>
              <Textarea
                value={formData.notes}
                onChange={(e) => setFormData({ ...formData, notes: e.target.value })}
                placeholder="Any additional details..."
                rows={3}
              />
            </div>

            <DialogFooter>
              <Button type="button" variant="outline" onClick={() => setAddDialogOpen(false)}>
                Cancel
              </Button>
              <Button type="submit" disabled={addMutation.isPending}>
                {addMutation.isPending ? 'Saving...' : 'Add Valuation'}
              </Button>
            </DialogFooter>
          </form>
        </DialogContent>
      </Dialog>

      {/* Edit Valuation Dialog */}
      <Dialog open={editDialogOpen} onOpenChange={setEditDialogOpen}>
        <DialogContent className="max-w-md">
          <DialogHeader>
            <DialogTitle>Edit Valuation</DialogTitle>
            <DialogDescription>Update the property valuation details</DialogDescription>
          </DialogHeader>
          <form onSubmit={handleUpdate} className="space-y-4">
            <div className="space-y-2">
              <Label>Valuation Type</Label>
              <select
                value={formData.valuationType}
                onChange={(e) => setFormData({ ...formData, valuationType: e.target.value })}
                className="border-input focus-visible:ring-ring flex h-10 w-full rounded-md border bg-transparent px-3 py-2 text-sm"
                required
              >
                <option value="PURCHASE">Purchase Price</option>
                <option value="MARKET">Market Valuation</option>
                <option value="MUNICIPAL">Municipal Valuation</option>
                <option value="INSURANCE">Insurance Valuation</option>
                <option value="BANK">Bank Valuation</option>
              </select>
            </div>

            <div className="space-y-2">
              <Label>Amount (R)</Label>
              <Input
                type="number"
                value={formData.valuationAmount}
                onChange={(e) => setFormData({ ...formData, valuationAmount: e.target.value })}
                placeholder="1500000"
                min="0"
                step="0.01"
                required
              />
            </div>

            <div className="space-y-2">
              <Label>Valuation Date</Label>
              <Input
                type="date"
                value={formData.valuationDate}
                onChange={(e) => setFormData({ ...formData, valuationDate: e.target.value })}
                required
              />
            </div>

            <div className="space-y-2">
              <Label>Valued By</Label>
              <Input
                value={formData.valuedBy}
                onChange={(e) => setFormData({ ...formData, valuedBy: e.target.value })}
                placeholder="e.g., Property24, Bank Name, Agent"
              />
            </div>

            <div className="space-y-2">
              <Label>Notes</Label>
              <Textarea
                value={formData.notes}
                onChange={(e) => setFormData({ ...formData, notes: e.target.value })}
                placeholder="Any additional details..."
                rows={3}
              />
            </div>

            <DialogFooter>
              <Button type="button" variant="outline" onClick={() => setEditDialogOpen(false)}>
                Cancel
              </Button>
              <Button type="submit" disabled={updateMutation.isPending}>
                {updateMutation.isPending ? 'Saving...' : 'Save Changes'}
              </Button>
            </DialogFooter>
          </form>
        </DialogContent>
      </Dialog>

      {/* Delete Confirmation Dialog */}
      <AlertDialog open={deleteDialogOpen} onOpenChange={setDeleteDialogOpen}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>Delete Valuation</AlertDialogTitle>
            <AlertDialogDescription>
              Are you sure you want to delete this valuation? This action cannot be undone.
              {selectedValuation && (
                <span className="mt-2 block font-medium">
                  {formatCurrency(Number(selectedValuation.valuationAmount))} -{' '}
                  {valuationTypeLabels[selectedValuation.valuationType]}
                </span>
              )}
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel>Cancel</AlertDialogCancel>
            <AlertDialogAction
              onClick={handleDelete}
              className="bg-destructive text-destructive-foreground hover:bg-destructive/90"
            >
              {deleteMutation.isPending ? 'Deleting...' : 'Delete'}
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </div>
  );
}
