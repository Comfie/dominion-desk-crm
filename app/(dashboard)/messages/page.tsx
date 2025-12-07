'use client';

import { useState } from 'react';
import { useQuery } from '@tanstack/react-query';
import Link from 'next/link';
import {
  Mail,
  MessageSquare,
  ArrowDownLeft,
  ArrowUpRight,
  AlertCircle,
  Plus,
  Search,
  FileText,
} from 'lucide-react';

import { PageHeader } from '@/components/shared';
import { MessageCard } from '@/components/messages/message-card';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Skeleton } from '@/components/ui/skeleton';
import { Pagination } from '@/components/ui/pagination';

async function fetchMessages(params: {
  direction?: string;
  type?: string;
  status?: string;
  search?: string;
  page?: number;
}) {
  const searchParams = new URLSearchParams();
  if (params.direction) searchParams.set('direction', params.direction);
  if (params.type) searchParams.set('type', params.type);
  if (params.status) searchParams.set('status', params.status);
  if (params.search) searchParams.set('search', params.search);
  if (params.page) searchParams.set('page', params.page.toString());

  const response = await fetch(`/api/messages?${searchParams.toString()}`);
  if (!response.ok) throw new Error('Failed to fetch messages');
  return response.json();
}

export default function MessagesPage() {
  const [direction, setDirection] = useState('');
  const [messageType, setMessageType] = useState('');
  const [status, setStatus] = useState('');
  const [search, setSearch] = useState('');
  const [searchInput, setSearchInput] = useState('');
  const [page, setPage] = useState(1);
  const { data, isLoading, error } = useQuery({
    queryKey: ['messages', direction, messageType, status, search, page],
    queryFn: () =>
      fetchMessages({
        direction: direction || undefined,
        type: messageType || undefined,
        status: status || undefined,
        search: search || undefined,
      }),
  });

  const handleSearch = (e: React.FormEvent) => {
    e.preventDefault();
    setSearch(searchInput);
  };

  return (
    <div className="space-y-6">
      <PageHeader title="Messages" description="Manage all communications with guests and tenants">
        <div className="flex gap-2">
          <Link href="/messages/templates">
            <Button variant="outline">
              <FileText className="mr-2 h-4 w-4" />
              Templates
            </Button>
          </Link>
          <Link href="/messages/new">
            <Button>
              <Plus className="mr-2 h-4 w-4" />
              Compose
            </Button>
          </Link>
        </div>
      </PageHeader>

      {/* Summary Cards */}
      {data?.summary && (
        <div className="grid gap-4 md:grid-cols-4">
          <Card>
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <CardTitle className="text-sm font-medium">Total Messages</CardTitle>
              <Mail className="text-muted-foreground h-4 w-4" />
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold">{data.summary.totalMessages}</div>
            </CardContent>
          </Card>

          <Card>
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <CardTitle className="text-sm font-medium">Unread</CardTitle>
              <ArrowDownLeft className="h-4 w-4 text-green-600" />
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold">{data.summary.unreadCount}</div>
            </CardContent>
          </Card>

          <Card>
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <CardTitle className="text-sm font-medium">Sent Today</CardTitle>
              <ArrowUpRight className="h-4 w-4 text-blue-600" />
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold">{data.summary.sentToday}</div>
            </CardContent>
          </Card>

          <Card>
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <CardTitle className="text-sm font-medium">Failed</CardTitle>
              <AlertCircle className="h-4 w-4 text-red-600" />
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold text-red-600">{data.summary.failedCount}</div>
            </CardContent>
          </Card>
        </div>
      )}

      {/* Filters */}
      <Card>
        <CardContent className="pt-6">
          <div className="flex flex-col gap-4 md:flex-row md:items-center">
            <form onSubmit={handleSearch} className="flex flex-1 gap-2">
              <div className="relative flex-1">
                <Search className="text-muted-foreground absolute top-1/2 left-3 h-4 w-4 -translate-y-1/2" />
                <Input
                  placeholder="Search messages..."
                  value={searchInput}
                  onChange={(e) => setSearchInput(e.target.value)}
                  className="pl-10"
                />
              </div>
              <Button type="submit" variant="secondary">
                Search
              </Button>
            </form>

            <div className="flex gap-2">
              <select
                value={direction}
                onChange={(e) => setDirection(e.target.value)}
                className="border-input bg-background ring-offset-background placeholder:text-muted-foreground focus-visible:ring-ring flex h-9 rounded-md border px-3 py-1 text-sm shadow-sm transition-colors focus-visible:ring-1 focus-visible:outline-none"
              >
                <option value="">All Directions</option>
                <option value="INBOUND">Inbound</option>
                <option value="OUTBOUND">Outbound</option>
              </select>

              <select
                value={messageType}
                onChange={(e) => setMessageType(e.target.value)}
                className="border-input bg-background ring-offset-background placeholder:text-muted-foreground focus-visible:ring-ring flex h-9 rounded-md border px-3 py-1 text-sm shadow-sm transition-colors focus-visible:ring-1 focus-visible:outline-none"
              >
                <option value="">All Types</option>
                <option value="EMAIL">Email</option>
                <option value="SMS">SMS</option>
                <option value="WHATSAPP">WhatsApp</option>
                <option value="IN_APP">In-App</option>
              </select>

              <select
                value={status}
                onChange={(e) => setStatus(e.target.value)}
                className="border-input bg-background ring-offset-background placeholder:text-muted-foreground focus-visible:ring-ring flex h-9 rounded-md border px-3 py-1 text-sm shadow-sm transition-colors focus-visible:ring-1 focus-visible:outline-none"
              >
                <option value="">All Status</option>
                <option value="DRAFT">Draft</option>
                <option value="SENT">Sent</option>
                <option value="DELIVERED">Delivered</option>
                <option value="READ">Read</option>
                <option value="FAILED">Failed</option>
              </select>
            </div>
          </div>
        </CardContent>
      </Card>

      {/* Messages List */}
      {isLoading ? (
        <div className="space-y-4">
          {[...Array(5)].map((_, i) => (
            <Skeleton key={i} className="h-32" />
          ))}
        </div>
      ) : error ? (
        <Card>
          <CardContent className="py-8 text-center">
            <p className="text-muted-foreground">Failed to load messages</p>
          </CardContent>
        </Card>
      ) : data?.messages.length === 0 ? (
        <Card>
          <CardContent className="py-8 text-center">
            <MessageSquare className="text-muted-foreground mx-auto mb-4 h-12 w-12" />
            <h3 className="mb-2 text-lg font-semibold">No messages found</h3>
            <p className="text-muted-foreground mb-4">
              {search || direction || messageType || status
                ? 'Try adjusting your filters'
                : 'Start by composing a new message'}
            </p>
            <Link href="/messages/new">
              <Button>
                <Plus className="mr-2 h-4 w-4" />
                Compose Message
              </Button>
            </Link>
          </CardContent>
        </Card>
      ) : (
        <div className="space-y-4">
          {data.messages.map(
            (message: {
              id: string;
              subject?: string | null;
              message: string;
              messageType: string;
              direction: string;
              recipientEmail?: string | null;
              recipientPhone?: string | null;
              status: string;
              createdAt: string;
              booking?: {
                id: string;
                guestName: string;
                property?: {
                  id: string;
                  name: string;
                } | null;
              } | null;
              tenant?: {
                id: string;
                firstName: string;
                lastName: string;
                email: string;
              } | null;
            }) => (
              <MessageCard key={message.id} message={message} />
            )
          )}

          {/* Pagination controls */}
          {data.pagination && data.pagination.pages > 1 && (
            <Pagination
              currentPage={data.pagination.page}
              totalPages={data.pagination.pages}
              totalItems={data.pagination.total}
              itemsPerPage={data.pagination.limit}
              onPageChange={setPage}
            />
          )}
        </div>
      )}
    </div>
  );
}
