'use client';

import { useState, use } from 'react';
import { useRouter } from 'next/navigation';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { ArrowLeft, Plus, Trash2, Camera, AlertTriangle, CheckCircle } from 'lucide-react';
import { format } from 'date-fns';

import { PageHeader } from '@/components/shared';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Textarea } from '@/components/ui/textarea';
import { Badge } from '@/components/ui/badge';
import { Skeleton } from '@/components/ui/skeleton';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Separator } from '@/components/ui/separator';
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from '@/components/ui/dialog';
import { useToast } from '@/hooks/use-toast';

interface InspectionItem {
  id: string;
  category: string;
  itemName: string;
  condition: string;
  notes: string | null;
  photos: string[] | null;
  actionRequired: boolean;
  actionNotes: string | null;
  estimatedCost: number | null;
}

interface Inspection {
  id: string;
  inspectionType: string;
  status: string;
  overallCondition: string | null;
  overallNotes: string | null;
  scheduledDate: string;
  completedDate: string | null;
  inspector: string | null;
  followUpRequired: boolean;
  followUpNotes: string | null;
  property: { id: string; name: string; address: string; city: string };
  tenant: { id: string; firstName: string; lastName: string; email: string } | null;
  items: InspectionItem[];
}

const statusColors: Record<string, string> = {
  SCHEDULED: 'bg-blue-500/10 text-blue-500',
  IN_PROGRESS: 'bg-yellow-500/10 text-yellow-500',
  COMPLETED: 'bg-green-500/10 text-green-500',
  CANCELLED: 'bg-gray-500/10 text-gray-500',
};

const conditionColors: Record<string, string> = {
  EXCELLENT: 'text-green-600 bg-green-50',
  GOOD: 'text-lime-600 bg-lime-50',
  FAIR: 'text-yellow-600 bg-yellow-50',
  POOR: 'text-orange-600 bg-orange-50',
  CRITICAL: 'text-red-600 bg-red-50',
};

const typeLabels: Record<string, string> = {
  MOVE_IN: 'Move In',
  MOVE_OUT: 'Move Out',
  ROUTINE: 'Routine',
  MAINTENANCE: 'Maintenance',
  ANNUAL: 'Annual',
  PRE_PURCHASE: 'Pre-purchase',
};

const defaultCategories = [
  'Living Room',
  'Kitchen',
  'Bedroom',
  'Bathroom',
  'Exterior',
  'Garage',
  'Other',
];

export default function InspectionDetailPage({ params }: { params: Promise<{ id: string }> }) {
  const { id } = use(params);
  const router = useRouter();
  const queryClient = useQueryClient();
  const { toast } = useToast();

  const [addItemDialogOpen, setAddItemDialogOpen] = useState(false);
  const [newItem, setNewItem] = useState({
    category: '',
    itemName: '',
    condition: 'GOOD',
    notes: '',
    actionRequired: false,
    actionNotes: '',
    estimatedCost: '',
  });

  const { data: inspection, isLoading } = useQuery<Inspection>({
    queryKey: ['inspection', id],
    queryFn: async () => {
      const res = await fetch(`/api/inspections/${id}`);
      if (!res.ok) throw new Error('Failed to fetch inspection');
      return res.json();
    },
  });

  const updateMutation = useMutation({
    mutationFn: async (data: Partial<Inspection>) => {
      const res = await fetch(`/api/inspections/${id}`, {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(data),
      });
      if (!res.ok) throw new Error('Failed to update inspection');
      return res.json();
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['inspection', id] });
      toast({ title: 'Updated', description: 'Inspection updated successfully.' });
    },
    onError: (error: Error) => {
      toast({ title: 'Error', description: error.message, variant: 'destructive' });
    },
  });

  const addItemMutation = useMutation({
    mutationFn: async (data: typeof newItem) => {
      const res = await fetch(`/api/inspections/${id}/items`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          ...data,
          estimatedCost: data.estimatedCost ? parseFloat(data.estimatedCost) : null,
        }),
      });
      if (!res.ok) throw new Error('Failed to add item');
      return res.json();
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['inspection', id] });
      setAddItemDialogOpen(false);
      setNewItem({
        category: '',
        itemName: '',
        condition: 'GOOD',
        notes: '',
        actionRequired: false,
        actionNotes: '',
        estimatedCost: '',
      });
      toast({ title: 'Item added', description: 'Inspection item added successfully.' });
    },
    onError: (error: Error) => {
      toast({ title: 'Error', description: error.message, variant: 'destructive' });
    },
  });

  const markComplete = () => {
    updateMutation.mutate({
      status: 'COMPLETED',
      completedDate: new Date().toISOString(),
    } as Partial<Inspection>);
  };

  const handleAddItem = (e: React.FormEvent) => {
    e.preventDefault();
    if (!newItem.category || !newItem.itemName) {
      toast({
        title: 'Error',
        description: 'Category and item name are required',
        variant: 'destructive',
      });
      return;
    }
    addItemMutation.mutate(newItem);
  };

  if (isLoading) {
    return (
      <div className="space-y-6">
        <Skeleton className="h-12 w-64" />
        <Skeleton className="h-48 w-full" />
        <Skeleton className="h-64 w-full" />
      </div>
    );
  }

  if (!inspection) {
    return (
      <div className="py-12 text-center">
        <p className="text-muted-foreground">Inspection not found</p>
        <Button onClick={() => router.push('/inspections')} className="mt-4">
          Back to Inspections
        </Button>
      </div>
    );
  }

  // Group items by category
  const itemsByCategory = inspection.items.reduce(
    (acc, item) => {
      if (!acc[item.category]) acc[item.category] = [];
      acc[item.category].push(item);
      return acc;
    },
    {} as Record<string, InspectionItem[]>
  );

  const actionItems = inspection.items.filter((item) => item.actionRequired);
  const totalEstimatedCost = actionItems.reduce((sum, item) => sum + (item.estimatedCost || 0), 0);

  return (
    <div className="space-y-6">
      <PageHeader
        title={`${typeLabels[inspection.inspectionType] || inspection.inspectionType} Inspection`}
        description={`${inspection.property.name} - ${inspection.property.address}`}
      >
        <div className="flex gap-2">
          <Button variant="ghost" onClick={() => router.back()}>
            <ArrowLeft className="mr-2 h-4 w-4" />
            Back
          </Button>
          {inspection.status !== 'COMPLETED' && (
            <Button onClick={markComplete} disabled={updateMutation.isPending}>
              <CheckCircle className="mr-2 h-4 w-4" />
              Mark Complete
            </Button>
          )}
        </div>
      </PageHeader>

      {/* Status and Info Cards */}
      <div className="grid gap-4 sm:grid-cols-3">
        <Card>
          <CardHeader className="pb-2">
            <CardTitle className="text-sm">Status</CardTitle>
          </CardHeader>
          <CardContent>
            <Badge className={statusColors[inspection.status]}>
              {inspection.status.replace('_', ' ')}
            </Badge>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="pb-2">
            <CardTitle className="text-sm">Scheduled</CardTitle>
          </CardHeader>
          <CardContent>
            <p className="font-medium">{format(new Date(inspection.scheduledDate), 'PPP')}</p>
            {inspection.completedDate && (
              <p className="text-muted-foreground text-xs">
                Completed: {format(new Date(inspection.completedDate), 'PPP')}
              </p>
            )}
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="pb-2">
            <CardTitle className="text-sm">Inspector</CardTitle>
          </CardHeader>
          <CardContent>
            <p className="font-medium">{inspection.inspector || 'Not assigned'}</p>
          </CardContent>
        </Card>
      </div>

      {/* Action Items Summary */}
      {actionItems.length > 0 && (
        <Card className="border-orange-200 bg-orange-50/50">
          <CardHeader>
            <CardTitle className="flex items-center gap-2 text-orange-700">
              <AlertTriangle className="h-5 w-5" />
              Action Required ({actionItems.length} items)
            </CardTitle>
            {totalEstimatedCost > 0 && (
              <CardDescription>
                Estimated repair cost: R{totalEstimatedCost.toLocaleString()}
              </CardDescription>
            )}
          </CardHeader>
          <CardContent>
            <ul className="space-y-2">
              {actionItems.map((item) => (
                <li key={item.id} className="flex justify-between text-sm">
                  <span>
                    <strong>{item.category}</strong> - {item.itemName}
                  </span>
                  {item.estimatedCost && <span>R{item.estimatedCost.toLocaleString()}</span>}
                </li>
              ))}
            </ul>
          </CardContent>
        </Card>
      )}

      {/* Inspection Items */}
      <Card>
        <CardHeader className="flex flex-row items-center justify-between">
          <div>
            <CardTitle>Inspection Items</CardTitle>
            <CardDescription>{inspection.items.length} items inspected</CardDescription>
          </div>
          <Button onClick={() => setAddItemDialogOpen(true)}>
            <Plus className="mr-2 h-4 w-4" />
            Add Item
          </Button>
        </CardHeader>
        <CardContent>
          {Object.keys(itemsByCategory).length > 0 ? (
            <div className="space-y-6">
              {Object.entries(itemsByCategory).map(([category, items]) => (
                <div key={category}>
                  <h4 className="mb-3 font-semibold">{category}</h4>
                  <div className="space-y-2">
                    {items.map((item) => (
                      <div
                        key={item.id}
                        className="flex items-start justify-between rounded-lg border p-3"
                      >
                        <div className="flex-1">
                          <div className="flex items-center gap-2">
                            <span className="font-medium">{item.itemName}</span>
                            <Badge className={conditionColors[item.condition]}>
                              {item.condition}
                            </Badge>
                            {item.actionRequired && (
                              <Badge variant="destructive" className="text-xs">
                                Action Required
                              </Badge>
                            )}
                          </div>
                          {item.notes && (
                            <p className="text-muted-foreground mt-1 text-sm">{item.notes}</p>
                          )}
                          {item.actionNotes && (
                            <p className="mt-1 text-sm text-orange-600">
                              Action: {item.actionNotes}
                            </p>
                          )}
                        </div>
                        {item.estimatedCost && (
                          <span className="text-sm font-medium">
                            R{item.estimatedCost.toLocaleString()}
                          </span>
                        )}
                      </div>
                    ))}
                  </div>
                  <Separator className="mt-4" />
                </div>
              ))}
            </div>
          ) : (
            <div className="py-8 text-center">
              <Camera className="text-muted-foreground/50 mx-auto h-12 w-12" />
              <p className="text-muted-foreground mt-4">No items added yet</p>
              <Button onClick={() => setAddItemDialogOpen(true)} className="mt-4">
                <Plus className="mr-2 h-4 w-4" />
                Add First Item
              </Button>
            </div>
          )}
        </CardContent>
      </Card>

      {/* Add Item Dialog */}
      <Dialog open={addItemDialogOpen} onOpenChange={setAddItemDialogOpen}>
        <DialogContent className="max-w-md">
          <DialogHeader>
            <DialogTitle>Add Inspection Item</DialogTitle>
            <DialogDescription>Add a new item to the inspection checklist</DialogDescription>
          </DialogHeader>
          <form onSubmit={handleAddItem} className="space-y-4">
            <div className="space-y-2">
              <Label>Category</Label>
              <select
                value={newItem.category}
                onChange={(e) => setNewItem({ ...newItem, category: e.target.value })}
                className="border-input focus-visible:ring-ring flex h-10 w-full rounded-md border bg-transparent px-3 py-2 text-sm"
                required
              >
                <option value="">Select category</option>
                {defaultCategories.map((cat) => (
                  <option key={cat} value={cat}>
                    {cat}
                  </option>
                ))}
              </select>
            </div>

            <div className="space-y-2">
              <Label>Item Name</Label>
              <Input
                value={newItem.itemName}
                onChange={(e) => setNewItem({ ...newItem, itemName: e.target.value })}
                placeholder="e.g., Refrigerator, Door, Window"
                required
              />
            </div>

            <div className="space-y-2">
              <Label>Condition</Label>
              <select
                value={newItem.condition}
                onChange={(e) => setNewItem({ ...newItem, condition: e.target.value })}
                className="border-input focus-visible:ring-ring flex h-10 w-full rounded-md border bg-transparent px-3 py-2 text-sm"
              >
                <option value="EXCELLENT">Excellent</option>
                <option value="GOOD">Good</option>
                <option value="FAIR">Fair</option>
                <option value="POOR">Poor</option>
                <option value="CRITICAL">Critical</option>
              </select>
            </div>

            <div className="space-y-2">
              <Label>Notes</Label>
              <Textarea
                value={newItem.notes}
                onChange={(e) => setNewItem({ ...newItem, notes: e.target.value })}
                placeholder="Condition details..."
                rows={2}
              />
            </div>

            <div className="flex items-center gap-2">
              <input
                type="checkbox"
                id="actionRequired"
                checked={newItem.actionRequired}
                onChange={(e) => setNewItem({ ...newItem, actionRequired: e.target.checked })}
                className="h-4 w-4"
              />
              <Label htmlFor="actionRequired">Action Required</Label>
            </div>

            {newItem.actionRequired && (
              <>
                <div className="space-y-2">
                  <Label>Action Notes</Label>
                  <Textarea
                    value={newItem.actionNotes}
                    onChange={(e) => setNewItem({ ...newItem, actionNotes: e.target.value })}
                    placeholder="What needs to be done..."
                    rows={2}
                  />
                </div>
                <div className="space-y-2">
                  <Label>Estimated Cost (R)</Label>
                  <Input
                    type="number"
                    value={newItem.estimatedCost}
                    onChange={(e) => setNewItem({ ...newItem, estimatedCost: e.target.value })}
                    placeholder="0.00"
                  />
                </div>
              </>
            )}

            <DialogFooter>
              <Button type="button" variant="outline" onClick={() => setAddItemDialogOpen(false)}>
                Cancel
              </Button>
              <Button type="submit" disabled={addItemMutation.isPending}>
                {addItemMutation.isPending ? 'Adding...' : 'Add Item'}
              </Button>
            </DialogFooter>
          </form>
        </DialogContent>
      </Dialog>
    </div>
  );
}
