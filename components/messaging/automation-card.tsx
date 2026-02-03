'use client';

import { Mail, Send, MoreVertical, Edit, Trash2, TestTube, Power, Clock, Zap } from 'lucide-react';
import { Card, CardContent } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { Switch } from '@/components/ui/switch';
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from '@/components/ui/dropdown-menu';

interface AutomationCardProps {
  automation: {
    id: string;
    name: string;
    description: string | null;
    triggerType: string;
    messageType: string;
    isActive: boolean;
    totalSent: number;
    totalOpened: number;
    totalClicked: number;
    createdAt: Date | string;
  };
  onEdit?: (id: string) => void;
  onDelete?: (id: string) => void;
  onTest?: (id: string) => void;
  onToggle?: (id: string, isActive: boolean) => void;
}

const triggerLabels: Record<string, string> = {
  BOOKING_CREATED: 'Booking Created',
  BOOKING_CONFIRMED: 'Booking Confirmed',
  CHECK_IN_REMINDER: 'Check-in Reminder',
  CHECK_IN_INSTRUCTIONS: 'Check-in Instructions',
  CHECK_OUT_REMINDER: 'Check-out Reminder',
  CHECK_OUT_INSTRUCTIONS: 'Check-out Instructions',
  BOOKING_COMPLETED: 'Booking Completed',
  PAYMENT_REMINDER: 'Payment Reminder',
  PAYMENT_RECEIVED: 'Payment Received',
  PAYMENT_OVERDUE: 'Payment Overdue',
  MAINTENANCE_SCHEDULED: 'Maintenance Scheduled',
  MAINTENANCE_COMPLETED: 'Maintenance Completed',
  REVIEW_REQUEST: 'Review Request',
  LEASE_RENEWAL_REMINDER: 'Lease Renewal Reminder',
  CUSTOM_DATE: 'Custom Date',
};

const messageTypeIcons: Record<string, any> = {
  EMAIL: Mail,
  SMS: Send,
  WHATSAPP: Zap,
  IN_APP: Clock,
};

export function AutomationCard({
  automation,
  onEdit,
  onDelete,
  onTest,
  onToggle,
}: AutomationCardProps) {
  const MessageIcon = messageTypeIcons[automation.messageType] || Mail;

  return (
    <Card className="group transition-all hover:shadow-lg">
      <CardContent className="p-4">
        <div className="space-y-4">
          {/* Header with status and actions */}
          <div className="flex items-start justify-between">
            <div className="flex-1 space-y-1">
              <div className="flex flex-wrap items-center gap-2">
                <Badge
                  variant={automation.isActive ? 'default' : 'secondary'}
                  className={automation.isActive ? 'bg-green-600' : 'bg-gray-400'}
                >
                  {automation.isActive ? 'Active' : 'Inactive'}
                </Badge>
                <Badge variant="outline">
                  <MessageIcon className="mr-1 h-3 w-3" />
                  {automation.messageType}
                </Badge>
              </div>
              <h3 className="text-lg font-semibold">{automation.name}</h3>
              {automation.description && (
                <p className="text-muted-foreground line-clamp-2 text-sm">
                  {automation.description}
                </p>
              )}
            </div>

            <DropdownMenu>
              <DropdownMenuTrigger asChild>
                <Button
                  variant="ghost"
                  size="icon"
                  className="h-8 w-8 opacity-0 transition-opacity group-hover:opacity-100"
                >
                  <MoreVertical className="h-4 w-4" />
                </Button>
              </DropdownMenuTrigger>
              <DropdownMenuContent align="end">
                {onEdit && (
                  <DropdownMenuItem onClick={() => onEdit(automation.id)}>
                    <Edit className="mr-2 h-4 w-4" />
                    Edit Automation
                  </DropdownMenuItem>
                )}
                {onTest && (
                  <DropdownMenuItem onClick={() => onTest(automation.id)}>
                    <TestTube className="mr-2 h-4 w-4" />
                    Send Test
                  </DropdownMenuItem>
                )}
                {onDelete && (
                  <>
                    <DropdownMenuSeparator />
                    <DropdownMenuItem
                      onClick={() => onDelete(automation.id)}
                      className="text-red-600 focus:text-red-600"
                    >
                      <Trash2 className="mr-2 h-4 w-4" />
                      Delete Automation
                    </DropdownMenuItem>
                  </>
                )}
              </DropdownMenuContent>
            </DropdownMenu>
          </div>

          {/* Trigger Information */}
          <div className="bg-muted rounded-lg p-3">
            <div className="flex items-center gap-2 text-sm">
              <Clock className="text-muted-foreground h-4 w-4" />
              <span className="font-medium">Trigger:</span>
              <span>{triggerLabels[automation.triggerType] || automation.triggerType}</span>
            </div>
          </div>

          {/* Analytics */}
          {automation.totalSent > 0 && (
            <div className="grid grid-cols-3 gap-2 text-center text-sm">
              <div className="rounded-lg bg-blue-50 p-2">
                <div className="font-bold text-blue-700">{automation.totalSent}</div>
                <div className="text-xs text-blue-600">Sent</div>
              </div>
              <div className="rounded-lg bg-green-50 p-2">
                <div className="font-bold text-green-700">{automation.totalOpened}</div>
                <div className="text-xs text-green-600">Opened</div>
              </div>
              <div className="rounded-lg bg-purple-50 p-2">
                <div className="font-bold text-purple-700">{automation.totalClicked}</div>
                <div className="text-xs text-purple-600">Clicked</div>
              </div>
            </div>
          )}

          {/* Toggle and Created Date */}
          <div className="flex items-center justify-between border-t pt-2">
            <span className="text-muted-foreground text-xs">
              Created {new Date(automation.createdAt).toLocaleDateString()}
            </span>
            {onToggle && (
              <div className="flex items-center gap-2">
                <span className="text-xs font-medium">
                  {automation.isActive ? 'Active' : 'Inactive'}
                </span>
                <Switch
                  checked={automation.isActive}
                  onCheckedChange={(checked) => onToggle(automation.id, checked)}
                />
              </div>
            )}
          </div>
        </div>
      </CardContent>
    </Card>
  );
}
