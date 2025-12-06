'use client';

import { useState } from 'react';
import { useRouter } from 'next/navigation';
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from '@/components/ui/dialog';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';
import { useToast } from '@/hooks/use-toast';
import { UserPlus, Loader2 } from 'lucide-react';

interface CreateUserDialogProps {
  onUserCreated?: () => void;
}

export function CreateUserDialog({ onUserCreated }: CreateUserDialogProps) {
  const [open, setOpen] = useState(false);
  const [loading, setLoading] = useState(false);
  const [formData, setFormData] = useState({
    email: '',
    firstName: '',
    lastName: '',
    subscriptionTier: 'FREE',
  });
  const { toast } = useToast();
  const router = useRouter();

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);

    try {
      const response = await fetch('/api/admin/users/create', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(formData),
      });

      const data = await response.json();

      if (!response.ok) {
        throw new Error(data.error || 'Failed to create user');
      }

      toast({
        title: 'Success',
        description: `User account created successfully. ${data.emailSent ? 'Welcome email sent.' : 'Email sending failed - please contact the user manually.'}`,
      });

      // Reset form and close dialog
      setFormData({
        email: '',
        firstName: '',
        lastName: '',
        subscriptionTier: 'FREE',
      });
      setOpen(false);

      // Refresh the user list
      if (onUserCreated) {
        onUserCreated();
      } else {
        router.refresh();
      }
    } catch (error) {
      console.error('Error creating user:', error);
      toast({
        title: 'Error',
        description: error instanceof Error ? error.message : 'Failed to create user account',
        variant: 'destructive',
      });
    } finally {
      setLoading(false);
    }
  };

  return (
    <Dialog open={open} onOpenChange={setOpen}>
      <DialogTrigger asChild>
        <Button>
          <UserPlus className="mr-2 h-4 w-4" />
          Create User
        </Button>
      </DialogTrigger>
      <DialogContent className="sm:max-w-[500px]">
        <form onSubmit={handleSubmit}>
          <DialogHeader>
            <DialogTitle>Create New User Account</DialogTitle>
            <DialogDescription>
              Create a new landlord account. The user will receive an email with their login
              credentials and will be required to change their password on first login.
            </DialogDescription>
          </DialogHeader>
          <div className="grid gap-4 py-4">
            <div className="grid gap-2">
              <Label htmlFor="email">Email Address *</Label>
              <Input
                id="email"
                type="email"
                placeholder="user@example.com"
                value={formData.email}
                onChange={(e) => setFormData({ ...formData, email: e.target.value })}
                required
                disabled={loading}
              />
            </div>
            <div className="grid grid-cols-2 gap-4">
              <div className="grid gap-2">
                <Label htmlFor="firstName">First Name *</Label>
                <Input
                  id="firstName"
                  type="text"
                  placeholder="John"
                  value={formData.firstName}
                  onChange={(e) => setFormData({ ...formData, firstName: e.target.value })}
                  required
                  disabled={loading}
                />
              </div>
              <div className="grid gap-2">
                <Label htmlFor="lastName">Last Name *</Label>
                <Input
                  id="lastName"
                  type="text"
                  placeholder="Doe"
                  value={formData.lastName}
                  onChange={(e) => setFormData({ ...formData, lastName: e.target.value })}
                  required
                  disabled={loading}
                />
              </div>
            </div>
            <div className="grid gap-2">
              <Label htmlFor="subscriptionTier">Subscription Tier</Label>
              <Select
                value={formData.subscriptionTier}
                onValueChange={(value) => setFormData({ ...formData, subscriptionTier: value })}
                disabled={loading}
              >
                <SelectTrigger id="subscriptionTier">
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="FREE">Free (1 property)</SelectItem>
                  <SelectItem value="STARTER">Starter (5 properties - R199/month)</SelectItem>
                  <SelectItem value="PROFESSIONAL">
                    Professional (20 properties - R499/month)
                  </SelectItem>
                  <SelectItem value="ENTERPRISE">Enterprise (Unlimited - R999/month)</SelectItem>
                </SelectContent>
              </Select>
            </div>
          </div>
          <DialogFooter>
            <Button
              type="button"
              variant="outline"
              onClick={() => setOpen(false)}
              disabled={loading}
            >
              Cancel
            </Button>
            <Button type="submit" disabled={loading}>
              {loading && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}
              Create Account
            </Button>
          </DialogFooter>
        </form>
      </DialogContent>
    </Dialog>
  );
}
