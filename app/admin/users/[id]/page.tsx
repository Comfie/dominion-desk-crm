'use client';

import { use, useEffect, useState } from 'react';
import { useRouter } from 'next/navigation';
import { format } from 'date-fns';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { SubscriptionTierBadge, SubscriptionStatusBadge } from '@/components/admin';
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from '@/components/ui/dialog';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';
import { Label } from '@/components/ui/label';
import { Input } from '@/components/ui/input';
import { Textarea } from '@/components/ui/textarea';
import { useToast } from '@/hooks/use-toast';
import {
  ArrowLeft,
  Mail,
  Phone,
  Calendar,
  Building2,
  Users,
  DollarSign,
  Ban,
  CheckCircle,
  Edit,
  Send,
} from 'lucide-react';
import { logger } from '@/lib/shared/logger';

interface UserDetails {
  id: string;
  email: string;
  firstName: string;
  lastName: string;
  phone: string | null;
  role: string;
  accountType: string;
  subscriptionTier: string;
  subscriptionStatus: string;
  trialEndsAt: string | null;
  subscriptionEndsAt: string | null;
  isActive: boolean;
  emailVerified: boolean;
  lastLogin: string | null;
  createdAt: string;
  mrr: number;
  _count: {
    properties: number;
    bookings: number;
    tenants: number;
    payments: number;
    maintenanceRequests: number;
  };
  properties: Array<{
    id: string;
    name: string;
    address: string;
    city: string;
    propertyType: string;
    status: string;
    createdAt: string;
  }>;
  subscriptionHistory: Array<{
    id: string;
    action: string;
    fromTier: string | null;
    toTier: string | null;
    fromStatus: string | null;
    toStatus: string | null;
    changedBy: string | null;
    createdAt: string;
  }>;
}

export default function UserDetailsPage({
  params,
  searchParams,
}: {
  params: Promise<{ id: string }>;
  searchParams: Promise<{ action?: string }>;
}) {
  const resolvedParams = use(params);
  const resolvedSearchParams = use(searchParams);
  const router = useRouter();
  const { toast } = useToast();
  const [user, setUser] = useState<UserDetails | null>(null);
  const [loading, setLoading] = useState(true);
  const [editDialogOpen, setEditDialogOpen] = useState(false);
  const [emailDialogOpen, setEmailDialogOpen] = useState(false);
  const [subscriptionData, setSubscriptionData] = useState({
    accountType: '',
    subscriptionTier: '',
    subscriptionStatus: '',
    subscriptionEndsAt: '',
  });
  const [emailData, setEmailData] = useState({
    subject: '',
    message: '',
  });

  useEffect(() => {
    fetchUserDetails();
  }, [resolvedParams.id]);

  // Auto-open edit dialog if action=edit in URL
  useEffect(() => {
    if (resolvedSearchParams.action === 'edit' && user) {
      setEditDialogOpen(true);
    }
  }, [resolvedSearchParams.action, user]);

  const fetchUserDetails = async () => {
    try {
      setLoading(true);
      const response = await fetch(`/api/admin/users/${resolvedParams.id}`);

      if (!response.ok) {
        const errorData = await response.json();
        console.error('API Error:', errorData);
        throw new Error(errorData.error || errorData.details || 'Failed to fetch user details');
      }

      const data = await response.json();
      setUser(data);
      setSubscriptionData({
        accountType: data.accountType,
        subscriptionTier: data.subscriptionTier,
        subscriptionStatus: data.subscriptionStatus,
        subscriptionEndsAt: data.subscriptionEndsAt
          ? format(new Date(data.subscriptionEndsAt), 'yyyy-MM-dd')
          : '',
      });
    } catch (error) {
      console.error('Error fetching user:', error);
      toast({
        title: 'Error',
        description: error instanceof Error ? error.message : 'Failed to load user details.',
        variant: 'destructive',
      });
    } finally {
      setLoading(false);
    }
  };

  const handleUpdateSubscription = async () => {
    try {
      if (subscriptionData.accountType && subscriptionData.accountType !== user?.accountType) {
        const accountResponse = await fetch(`/api/admin/users/${resolvedParams.id}`, {
          method: 'PUT',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({ accountType: subscriptionData.accountType }),
        });

        if (!accountResponse.ok) {
          const errorData = await accountResponse.json();
          throw new Error(errorData.error || 'Failed to update account type');
        }
      }

      const response = await fetch(`/api/admin/subscriptions`, {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          userId: resolvedParams.id,
          subscriptionTier: subscriptionData.subscriptionTier,
          subscriptionStatus: subscriptionData.subscriptionStatus,
          subscriptionEndsAt: subscriptionData.subscriptionEndsAt || null,
        }),
      });

      if (!response.ok) {
        const errorData = await response.json();
        throw new Error(errorData.error || 'Failed to update subscription');
      }

      toast({
        title: 'Success',
        description: `Account updated: ${subscriptionData.accountType}, ${subscriptionData.subscriptionTier} (${subscriptionData.subscriptionStatus})`,
      });
      setEditDialogOpen(false);

      // Refresh the user details to show updated data
      await fetchUserDetails();
    } catch (error) {
      console.error('Error updating subscription:', error);
      toast({
        title: 'Error',
        description: error instanceof Error ? error.message : 'Failed to update subscription.',
        variant: 'destructive',
      });
    }
  };

  const handleToggleActive = async () => {
    if (!user) return;

    try {
      const response = await fetch(`/api/admin/users/${resolvedParams.id}`, {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ isActive: !user.isActive }),
      });

      if (!response.ok) {
        throw new Error('Failed to update user');
      }

      toast({
        title: 'Success',
        description: `User ${!user.isActive ? 'activated' : 'deactivated'} successfully.`,
      });
      fetchUserDetails();
    } catch (error) {
      // Error logging
      logger.error('Failed to Update', { error });
      toast({
        title: 'Error',
        description: 'Failed to update user status.',
        variant: 'destructive',
      });
    }
  };

  const handleSendEmail = async () => {
    try {
      const response = await fetch(`/api/admin/users/${resolvedParams.id}/email`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(emailData),
      });

      if (!response.ok) {
        throw new Error('Failed to send email');
      }

      toast({
        title: 'Success',
        description: 'Email sent successfully.',
      });
      setEmailDialogOpen(false);
      setEmailData({ subject: '', message: '' });
    } catch (error) {
      // Error logging
      logger.error('Failed to Send Email', { error });
      toast({
        title: 'Error',
        description: 'Failed to send email. Feature coming soon.',
        variant: 'destructive',
      });
    }
  };

  if (loading) {
    return (
      <div className="flex min-h-[400px] items-center justify-center">
        <div className="text-center">
          <div className="inline-block h-8 w-8 animate-spin rounded-full border-4 border-solid border-current border-r-transparent"></div>
          <p className="text-muted-foreground mt-2">Loading user details...</p>
        </div>
      </div>
    );
  }

  if (!user) {
    return (
      <div className="space-y-6">
        <div className="text-center">
          <p className="text-muted-foreground">User not found</p>
          <Button onClick={() => router.back()} className="mt-4">
            Go Back
          </Button>
        </div>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-4">
          <Button variant="ghost" size="icon" onClick={() => router.back()}>
            <ArrowLeft className="h-5 w-5" />
          </Button>
          <div>
            <h1 className="text-3xl font-bold">
              {user.firstName} {user.lastName}
            </h1>
            <p className="text-muted-foreground">{user.email}</p>
          </div>
        </div>
        <div className="flex gap-2">
          <Button variant="outline" onClick={() => setEmailDialogOpen(true)}>
            <Send className="mr-2 h-4 w-4" />
            Send Email
          </Button>
          <Button variant="outline" onClick={() => setEditDialogOpen(true)}>
            <Edit className="mr-2 h-4 w-4" />
            Edit Account
          </Button>
          <Button variant={user.isActive ? 'destructive' : 'default'} onClick={handleToggleActive}>
            {user.isActive ? (
              <>
                <Ban className="mr-2 h-4 w-4" />
                Deactivate
              </>
            ) : (
              <>
                <CheckCircle className="mr-2 h-4 w-4" />
                Activate
              </>
            )}
          </Button>
        </div>
      </div>

      {/* Status Badges */}
      <div className="flex gap-2">
        {!user.isActive && <Badge variant="destructive">Inactive</Badge>}
        {user.emailVerified && <Badge variant="outline">Email Verified</Badge>}
      </div>

      {/* Stats Grid */}
      <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-4">
        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">MRR</CardTitle>
            <DollarSign className="text-muted-foreground h-4 w-4" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">R{user.mrr}</div>
            <p className="text-muted-foreground text-xs">Monthly recurring revenue</p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Properties</CardTitle>
            <Building2 className="text-muted-foreground h-4 w-4" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{user._count.properties}</div>
            <p className="text-muted-foreground text-xs">Total properties</p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Tenants</CardTitle>
            <Users className="text-muted-foreground h-4 w-4" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{user._count.tenants}</div>
            <p className="text-muted-foreground text-xs">Registered tenants</p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Bookings</CardTitle>
            <Calendar className="text-muted-foreground h-4 w-4" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{user._count.bookings}</div>
            <p className="text-muted-foreground text-xs">Total bookings</p>
          </CardContent>
        </Card>
      </div>

      {/* Account Information */}
      <Card>
        <CardHeader>
          <CardTitle>Account Information</CardTitle>
        </CardHeader>
        <CardContent className="space-y-4">
          <div className="grid gap-4 md:grid-cols-2">
            <div>
              <p className="text-muted-foreground text-sm font-medium">Email</p>
              <div className="mt-1 flex items-center gap-2">
                <Mail className="text-muted-foreground h-4 w-4" />
                <p>{user.email}</p>
              </div>
            </div>

            <div>
              <p className="text-muted-foreground text-sm font-medium">Phone</p>
              <div className="mt-1 flex items-center gap-2">
                <Phone className="text-muted-foreground h-4 w-4" />
                <p>{user.phone || 'Not provided'}</p>
              </div>
            </div>

            <div>
              <p className="text-muted-foreground text-sm font-medium">Account Type</p>
              <p className="mt-1">{user.accountType}</p>
            </div>

            <div>
              <p className="text-muted-foreground text-sm font-medium">Member Since</p>
              <p className="mt-1">{format(new Date(user.createdAt), 'MMM dd, yyyy')}</p>
            </div>

            <div>
              <p className="text-muted-foreground text-sm font-medium">Last Login</p>
              <p className="mt-1">
                {user.lastLogin ? format(new Date(user.lastLogin), 'MMM dd, yyyy HH:mm') : 'Never'}
              </p>
            </div>

            <div>
              <p className="text-muted-foreground text-sm font-medium">Status</p>
              <div className="mt-1">
                {user.isActive ? (
                  <Badge variant="outline" className="bg-green-100 text-green-800">
                    Active
                  </Badge>
                ) : (
                  <Badge variant="outline" className="bg-red-100 text-red-800">
                    Inactive
                  </Badge>
                )}
              </div>
            </div>
          </div>
        </CardContent>
      </Card>

      {/* Subscription Information */}
      <Card>
        <CardHeader>
          <CardTitle>Subscription Details</CardTitle>
        </CardHeader>
        <CardContent className="space-y-4">
          <div className="grid gap-4 md:grid-cols-2">
            <div>
              <p className="text-muted-foreground text-sm font-medium">Tier</p>
              <div className="mt-1">
                <SubscriptionTierBadge tier={user.subscriptionTier as any} />
              </div>
            </div>

            <div>
              <p className="text-muted-foreground text-sm font-medium">Status</p>
              <div className="mt-1">
                <SubscriptionStatusBadge status={user.subscriptionStatus as any} />
              </div>
            </div>

            <div>
              <p className="text-muted-foreground text-sm font-medium">Monthly Revenue</p>
              <p className="mt-1 text-lg font-semibold">R{user.mrr}</p>
            </div>

            {user.subscriptionEndsAt && (
              <div>
                <p className="text-muted-foreground text-sm font-medium">Next Billing Date</p>
                <p className="mt-1">{format(new Date(user.subscriptionEndsAt), 'MMM dd, yyyy')}</p>
              </div>
            )}

            {user.trialEndsAt && (
              <div>
                <p className="text-muted-foreground text-sm font-medium">Trial Ends</p>
                <p className="mt-1">{format(new Date(user.trialEndsAt), 'MMM dd, yyyy')}</p>
              </div>
            )}
          </div>
        </CardContent>
      </Card>

      {/* Subscription History */}
      {user.subscriptionHistory.length > 0 && (
        <Card>
          <CardHeader>
            <CardTitle>Subscription History</CardTitle>
            <CardDescription>Recent subscription changes</CardDescription>
          </CardHeader>
          <CardContent>
            <div className="space-y-4">
              {user.subscriptionHistory.map((history) => (
                <div
                  key={history.id}
                  className="flex items-start justify-between border-b pb-4 last:border-0 last:pb-0"
                >
                  <div className="space-y-1">
                    <div className="flex items-center gap-2">
                      <Badge variant="outline" className="capitalize">
                        {history.action.replace('_', ' ')}
                      </Badge>
                      {history.fromTier && history.toTier && (
                        <p className="text-muted-foreground text-sm">
                          {history.fromTier} → {history.toTier}
                        </p>
                      )}
                      {history.fromStatus && history.toStatus && (
                        <p className="text-muted-foreground text-sm">
                          {history.fromStatus} → {history.toStatus}
                        </p>
                      )}
                    </div>
                    <p className="text-muted-foreground text-xs">
                      {format(new Date(history.createdAt), 'MMM dd, yyyy HH:mm')}
                    </p>
                  </div>
                </div>
              ))}
            </div>
          </CardContent>
        </Card>
      )}

      {/* Properties List */}
      {user.properties.length > 0 && (
        <Card>
          <CardHeader>
            <CardTitle>Recent Properties</CardTitle>
            <CardDescription>Last 10 properties created</CardDescription>
          </CardHeader>
          <CardContent>
            <div className="space-y-4">
              {user.properties.map((property) => (
                <div
                  key={property.id}
                  className="flex items-center justify-between border-b pb-4 last:border-0 last:pb-0"
                >
                  <div>
                    <p className="font-medium">{property.name}</p>
                    <p className="text-muted-foreground text-sm">
                      {property.address}, {property.city}
                    </p>
                    <div className="mt-1 flex gap-2">
                      <Badge variant="outline">{property.propertyType}</Badge>
                      <Badge variant="outline">{property.status}</Badge>
                    </div>
                  </div>
                  <p className="text-muted-foreground text-sm">
                    {format(new Date(property.createdAt), 'MMM dd, yyyy')}
                  </p>
                </div>
              ))}
            </div>
          </CardContent>
        </Card>
      )}

      {/* Edit Account Dialog */}
      <Dialog open={editDialogOpen} onOpenChange={setEditDialogOpen}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Edit Account</DialogTitle>
            <DialogDescription>
              Update the landlord's account type and subscription
            </DialogDescription>
          </DialogHeader>
          <div className="space-y-4">
            <div>
              <Label htmlFor="accountType">Account Type</Label>
              <Select
                value={subscriptionData.accountType}
                onValueChange={(value) =>
                  setSubscriptionData({ ...subscriptionData, accountType: value })
                }
              >
                <SelectTrigger>
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="INDIVIDUAL">Individual</SelectItem>
                  <SelectItem value="COMPANY">Company</SelectItem>
                  <SelectItem value="AGENCY">Property Agency</SelectItem>
                </SelectContent>
              </Select>
            </div>

            <div>
              <Label htmlFor="tier">Subscription Tier</Label>
              <Select
                value={subscriptionData.subscriptionTier}
                onValueChange={(value) =>
                  setSubscriptionData({ ...subscriptionData, subscriptionTier: value })
                }
              >
                <SelectTrigger>
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="FREE">Free</SelectItem>
                  <SelectItem value="STARTER">Starter (R199/mo)</SelectItem>
                  <SelectItem value="PROFESSIONAL">Professional (R499/mo)</SelectItem>
                  <SelectItem value="ENTERPRISE">Enterprise (R999/mo)</SelectItem>
                </SelectContent>
              </Select>
            </div>

            <div>
              <Label htmlFor="status">Status</Label>
              <Select
                value={subscriptionData.subscriptionStatus}
                onValueChange={(value) =>
                  setSubscriptionData({ ...subscriptionData, subscriptionStatus: value })
                }
              >
                <SelectTrigger>
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="TRIAL">Trial</SelectItem>
                  <SelectItem value="ACTIVE">Active</SelectItem>
                  <SelectItem value="PAST_DUE">Past Due</SelectItem>
                  <SelectItem value="CANCELLED">Cancelled</SelectItem>
                  <SelectItem value="EXPIRED">Expired</SelectItem>
                </SelectContent>
              </Select>
            </div>

            <div>
              <Label htmlFor="endsAt">Next Billing Date</Label>
              <Input
                type="date"
                value={subscriptionData.subscriptionEndsAt}
                onChange={(e) =>
                  setSubscriptionData({ ...subscriptionData, subscriptionEndsAt: e.target.value })
                }
              />
            </div>
          </div>
          <DialogFooter>
            <Button variant="outline" onClick={() => setEditDialogOpen(false)}>
              Cancel
            </Button>
            <Button onClick={handleUpdateSubscription}>Save Changes</Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* Send Email Dialog */}
      <Dialog open={emailDialogOpen} onOpenChange={setEmailDialogOpen}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Send Email to {user.firstName}</DialogTitle>
            <DialogDescription>Send an important message to this landlord</DialogDescription>
          </DialogHeader>
          <div className="space-y-4">
            <div>
              <Label htmlFor="subject">Subject</Label>
              <Input
                id="subject"
                placeholder="Enter email subject"
                value={emailData.subject}
                onChange={(e) => setEmailData({ ...emailData, subject: e.target.value })}
              />
            </div>

            <div>
              <Label htmlFor="message">Message</Label>
              <Textarea
                id="message"
                placeholder="Enter your message"
                rows={6}
                value={emailData.message}
                onChange={(e) => setEmailData({ ...emailData, message: e.target.value })}
              />
            </div>
          </div>
          <DialogFooter>
            <Button variant="outline" onClick={() => setEmailDialogOpen(false)}>
              Cancel
            </Button>
            <Button onClick={handleSendEmail}>
              <Send className="mr-2 h-4 w-4" />
              Send Email
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  );
}
