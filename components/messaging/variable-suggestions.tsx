'use client';

import { Badge } from '@/components/ui/badge';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Info } from 'lucide-react';

interface VariableSuggestionsProps {
  triggerType: string;
  onVariableClick?: (variable: string) => void;
}

const bookingVariables = [
  { name: 'guestName', description: 'Guest full name' },
  { name: 'guestEmail', description: 'Guest email address' },
  { name: 'guestPhone', description: 'Guest phone number' },
  { name: 'propertyName', description: 'Property name' },
  { name: 'propertyAddress', description: 'Property full address' },
  { name: 'checkInDate', description: 'Check-in date' },
  { name: 'checkInTime', description: 'Check-in time' },
  { name: 'checkOutDate', description: 'Check-out date' },
  { name: 'checkOutTime', description: 'Check-out time' },
  { name: 'totalAmount', description: 'Total booking amount' },
  { name: 'bookingReference', description: 'Booking reference number' },
  { name: 'numberOfGuests', description: 'Number of guests' },
  { name: 'numberOfNights', description: 'Number of nights' },
];

const tenantVariables = [
  { name: 'tenantName', description: 'Tenant full name' },
  { name: 'tenantEmail', description: 'Tenant email address' },
  { name: 'propertyName', description: 'Property name' },
  { name: 'propertyAddress', description: 'Property full address' },
  { name: 'leaseStartDate', description: 'Lease start date' },
  { name: 'leaseEndDate', description: 'Lease end date' },
  { name: 'monthlyRent', description: 'Monthly rent amount' },
];

const maintenanceVariables = [
  { name: 'propertyName', description: 'Property name' },
  { name: 'propertyAddress', description: 'Property full address' },
  { name: 'requestTitle', description: 'Maintenance request title' },
  { name: 'requestDescription', description: 'Request description' },
  { name: 'scheduledDate', description: 'Scheduled date' },
  { name: 'assignedTo', description: 'Assigned contractor' },
];

const paymentVariables = [
  { name: 'tenantName', description: 'Tenant full name' },
  { name: 'amount', description: 'Payment amount' },
  { name: 'dueDate', description: 'Payment due date' },
  { name: 'propertyName', description: 'Property name' },
  { name: 'paymentReference', description: 'Payment reference' },
];

const dedupeVariables = (variables: { name: string; description: string }[]) => {
  const seen = new Set<string>();
  return variables.filter((variable) => {
    if (seen.has(variable.name)) {
      return false;
    }
    seen.add(variable.name);
    return true;
  });
};

const getVariablesForTrigger = (triggerType: string) => {
  if (
    triggerType.includes('BOOKING') ||
    triggerType.includes('CHECK_IN') ||
    triggerType.includes('CHECK_OUT') ||
    triggerType.includes('REVIEW')
  ) {
    return dedupeVariables(bookingVariables);
  }

  if (triggerType.includes('PAYMENT') || triggerType.includes('LEASE')) {
    return dedupeVariables([...tenantVariables, ...paymentVariables]);
  }

  if (triggerType.includes('MAINTENANCE')) {
    return dedupeVariables(maintenanceVariables);
  }

  return dedupeVariables(bookingVariables); // Default
};

export function VariableSuggestions({ triggerType, onVariableClick }: VariableSuggestionsProps) {
  const variables = getVariablesForTrigger(triggerType);

  return (
    <Card>
      <CardHeader>
        <div className="flex items-center gap-2">
          <Info className="h-4 w-4 text-blue-600" />
          <CardTitle className="text-sm">Available Variables</CardTitle>
        </div>
        <CardDescription>
          Click on a variable to insert it into your message template
        </CardDescription>
      </CardHeader>
      <CardContent>
        <div className="flex flex-wrap gap-2">
          {variables.map((variable) => (
            <Badge
              key={variable.name}
              variant="secondary"
              className="hover:bg-primary hover:text-primary-foreground cursor-pointer transition-colors"
              onClick={() => onVariableClick?.(`{{${variable.name}}}`)}
              title={variable.description}
            >
              {`{{${variable.name}}}`}
            </Badge>
          ))}
        </div>
        <div className="text-muted-foreground mt-4 text-xs">
          <p className="mb-1 font-medium">Usage Example:</p>
          <code className="bg-muted rounded px-2 py-1">
            Hi {`{{guestName}}`}, your booking at {`{{propertyName}}`} is confirmed!
          </code>
        </div>
      </CardContent>
    </Card>
  );
}
