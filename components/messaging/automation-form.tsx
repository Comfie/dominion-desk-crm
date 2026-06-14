'use client';

import { useState, useEffect, useRef } from 'react';
import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { z } from 'zod';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Textarea } from '@/components/ui/textarea';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';
import { Checkbox } from '@/components/ui/checkbox';
import { Switch } from '@/components/ui/switch';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Alert, AlertDescription } from '@/components/ui/alert';
import { Loader2, AlertCircle, Sparkles } from 'lucide-react';
import { VariableSuggestions } from './variable-suggestions';

const automationSchema = z.object({
  name: z.string().min(1, 'Name is required').max(100),
  description: z.string().optional(),
  triggerType: z.string().min(1, 'Trigger type is required'),
  triggerOffset: z.number().int().optional(),
  triggerTimeOfDay: z
    .string()
    .regex(/^\d{2}:\d{2}$/)
    .optional()
    .or(z.literal('')),
  messageType: z.string().min(1, 'Message type is required'),
  subject: z.string().max(200).optional(),
  bodyTemplate: z.string().min(1, 'Message body is required'),
  useAiEnhancement: z.boolean(),
  aiTone: z.string().optional(),
  applyToRentalType: z.string().optional(),
  propertyIds: z.array(z.string()).optional(),
  isActive: z.boolean(),
});

type AutomationFormData = z.infer<typeof automationSchema>;

interface AutomationFormProps {
  initialData?: Partial<AutomationFormData>;
  properties?: Array<{ id: string; name: string }>;
  onSubmit: (data: AutomationFormData) => Promise<void>;
  onCancel?: () => void;
  isLoading?: boolean;
}

const triggerOptions = [
  { value: 'BOOKING_CREATED', label: 'Booking Created', offset: 0 },
  { value: 'BOOKING_CONFIRMED', label: 'Booking Confirmed', offset: 0 },
  { value: 'CHECK_IN_REMINDER', label: 'Check-in Reminder', offset: -24 },
  { value: 'CHECK_IN_INSTRUCTIONS', label: 'Check-in Instructions', offset: -2 },
  { value: 'CHECK_OUT_REMINDER', label: 'Check-out Reminder', offset: -24 },
  { value: 'CHECK_OUT_INSTRUCTIONS', label: 'Check-out Instructions', offset: 24 },
  { value: 'BOOKING_COMPLETED', label: 'Booking Completed', offset: 0 },
  { value: 'PAYMENT_REMINDER', label: 'Payment Reminder', offset: -72 },
  { value: 'PAYMENT_RECEIVED', label: 'Payment Received', offset: 0 },
  { value: 'PAYMENT_OVERDUE', label: 'Payment Overdue', offset: 24 },
  { value: 'MAINTENANCE_SCHEDULED', label: 'Maintenance Scheduled', offset: -24 },
  { value: 'MAINTENANCE_COMPLETED', label: 'Maintenance Completed', offset: 0 },
  { value: 'REVIEW_REQUEST', label: 'Review Request', offset: 48 },
  { value: 'LEASE_RENEWAL_REMINDER', label: 'Lease Renewal Reminder', offset: -720 },
  { value: 'CUSTOM_DATE', label: 'Custom Date', offset: 0 },
];

export function AutomationForm({
  initialData,
  properties = [],
  onSubmit,
  onCancel,
  isLoading = false,
}: AutomationFormProps) {
  const [error, setError] = useState<string | null>(null);
  const bodyTextareaRef = useRef<HTMLTextAreaElement>(null);

  const {
    register,
    handleSubmit,
    formState: { errors },
    setValue,
    watch,
    reset,
  } = useForm<AutomationFormData>({
    resolver: zodResolver(automationSchema),
    defaultValues: {
      isActive: true,
      useAiEnhancement: false,
      messageType: 'EMAIL',
      triggerOffset: 0,
      ...initialData,
    },
  });

  const triggerType = watch('triggerType');
  const messageType = watch('messageType');
  const useAiEnhancement = watch('useAiEnhancement');
  const selectedPropertyIds = watch('propertyIds') || [];

  // Get register props and merge refs
  const { ref: bodyRegisterRef, ...bodyRegisterRest } = register('bodyTemplate');

  useEffect(() => {
    if (initialData) {
      reset({
        ...initialData,
        triggerTimeOfDay: initialData.triggerTimeOfDay || '',
      });
    }
  }, [initialData, reset]);

  // Auto-set trigger offset when trigger type changes
  useEffect(() => {
    if (triggerType && !initialData?.triggerOffset) {
      const trigger = triggerOptions.find((t) => t.value === triggerType);
      if (trigger) {
        setValue('triggerOffset', trigger.offset);
      }
    }
  }, [triggerType, initialData, setValue]);

  const handleVariableClick = (variable: string) => {
    const textarea = bodyTextareaRef.current;
    if (textarea) {
      const start = textarea.selectionStart;
      const end = textarea.selectionEnd;
      const currentValue = watch('bodyTemplate') || '';
      const newValue = currentValue.slice(0, start) + variable + currentValue.slice(end);
      setValue('bodyTemplate', newValue);

      // Set cursor position after inserted variable
      setTimeout(() => {
        textarea.focus();
        textarea.setSelectionRange(start + variable.length, start + variable.length);
      }, 0);
    }
  };

  const handlePropertyToggle = (propertyId: string) => {
    const current = selectedPropertyIds;
    const updated = current.includes(propertyId)
      ? current.filter((id) => id !== propertyId)
      : [...current, propertyId];
    setValue('propertyIds', updated);
  };

  const onFormSubmit = async (data: AutomationFormData) => {
    setError(null);
    try {
      await onSubmit(data);
    } catch (err: any) {
      setError(err.message || 'Failed to save automation');
    }
  };

  return (
    <form onSubmit={handleSubmit(onFormSubmit)} className="space-y-6">
      {error && (
        <Alert variant="destructive">
          <AlertCircle className="h-4 w-4" />
          <AlertDescription>{error}</AlertDescription>
        </Alert>
      )}

      {/* Basic Information */}
      <Card>
        <CardHeader>
          <CardTitle>Basic Information</CardTitle>
          <CardDescription>Give your automation a name and description</CardDescription>
        </CardHeader>
        <CardContent className="space-y-4">
          <div className="space-y-2">
            <Label htmlFor="name">Automation Name *</Label>
            <Input id="name" {...register('name')} placeholder="e.g., Check-in Instructions" />
            {errors.name && <p className="text-sm text-red-600">{errors.name.message}</p>}
          </div>

          <div className="space-y-2">
            <Label htmlFor="description">Description</Label>
            <Textarea
              id="description"
              {...register('description')}
              placeholder="Brief description of what this automation does"
              rows={2}
            />
          </div>

          <div className="flex items-center space-x-2">
            <Switch
              checked={watch('isActive')}
              onCheckedChange={(checked) => setValue('isActive', checked)}
            />
            <Label>Active (automation will run automatically)</Label>
          </div>
        </CardContent>
      </Card>

      {/* Trigger Configuration */}
      <Card>
        <CardHeader>
          <CardTitle>Trigger Configuration</CardTitle>
          <CardDescription>When should this message be sent?</CardDescription>
        </CardHeader>
        <CardContent className="space-y-4">
          <div className="space-y-2">
            <Label htmlFor="triggerType">Trigger Event *</Label>
            <Select value={triggerType} onValueChange={(value) => setValue('triggerType', value)}>
              <SelectTrigger>
                <SelectValue placeholder="Select trigger event" />
              </SelectTrigger>
              <SelectContent>
                {triggerOptions.map((option) => (
                  <SelectItem key={option.value} value={option.value}>
                    {option.label}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
            {errors.triggerType && (
              <p className="text-sm text-red-600">{errors.triggerType.message}</p>
            )}
          </div>

          <div className="grid grid-cols-2 gap-4">
            <div className="space-y-2">
              <Label htmlFor="triggerOffset">Offset (hours)</Label>
              <Input
                id="triggerOffset"
                type="number"
                {...register('triggerOffset', { valueAsNumber: true })}
                placeholder="0"
              />
              <p className="text-muted-foreground text-xs">
                Negative = before event, Positive = after event
              </p>
            </div>

            <div className="space-y-2">
              <Label htmlFor="triggerTimeOfDay">Time of Day</Label>
              <Input
                id="triggerTimeOfDay"
                type="time"
                {...register('triggerTimeOfDay')}
                placeholder="09:00"
              />
              <p className="text-muted-foreground text-xs">Optional: Send at specific time</p>
            </div>
          </div>
        </CardContent>
      </Card>

      {/* Message Configuration */}
      <Card>
        <CardHeader>
          <CardTitle>Message Configuration</CardTitle>
          <CardDescription>Configure your message content</CardDescription>
        </CardHeader>
        <CardContent className="space-y-4">
          <div className="space-y-2">
            <Label htmlFor="messageType">Message Type *</Label>
            <Select value={messageType} onValueChange={(value) => setValue('messageType', value)}>
              <SelectTrigger>
                <SelectValue placeholder="Select message type" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="EMAIL">Email</SelectItem>
                <SelectItem value="IN_APP">In-App Notification</SelectItem>
              </SelectContent>
            </Select>
          </div>

          {messageType === 'EMAIL' && (
            <div className="space-y-2">
              <Label htmlFor="subject">Email Subject</Label>
              <Input
                id="subject"
                {...register('subject')}
                placeholder="e.g., Your check-in instructions for {{propertyName}}"
              />
            </div>
          )}

          <div className="space-y-2">
            <Label htmlFor="bodyTemplate">Message Body *</Label>
            <Textarea
              id="bodyTemplate"
              {...bodyRegisterRest}
              ref={(e) => {
                bodyRegisterRef(e);
                bodyTextareaRef.current = e;
              }}
              placeholder="Write your message template here. Use variables like {{guestName}} to personalize."
              rows={8}
              className="font-mono text-sm"
            />
            {errors.bodyTemplate && (
              <p className="text-sm text-red-600">{errors.bodyTemplate.message}</p>
            )}
          </div>

          {/* Variable Suggestions */}
          {triggerType && (
            <VariableSuggestions triggerType={triggerType} onVariableClick={handleVariableClick} />
          )}

          {/* AI Enhancement */}
          <div className="space-y-4 rounded-lg border p-4">
            <div className="flex items-center justify-between">
              <div className="space-y-1">
                <div className="flex items-center gap-2">
                  <Sparkles className="h-4 w-4 text-purple-600" />
                  <Label>AI Enhancement (Coming Soon)</Label>
                </div>
                <p className="text-muted-foreground text-xs">
                  Let AI improve your message tone and style
                </p>
              </div>
              <Switch
                checked={useAiEnhancement}
                onCheckedChange={(checked) => setValue('useAiEnhancement', checked)}
                disabled
              />
            </div>

            {useAiEnhancement && (
              <div className="space-y-2">
                <Label htmlFor="aiTone">AI Tone</Label>
                <Select
                  value={watch('aiTone')}
                  onValueChange={(value) => setValue('aiTone', value)}
                >
                  <SelectTrigger>
                    <SelectValue placeholder="Select tone" />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="PROFESSIONAL">Professional</SelectItem>
                    <SelectItem value="FRIENDLY">Friendly</SelectItem>
                    <SelectItem value="CASUAL">Casual</SelectItem>
                    <SelectItem value="FORMAL">Formal</SelectItem>
                    <SelectItem value="WARM">Warm</SelectItem>
                  </SelectContent>
                </Select>
              </div>
            )}
          </div>
        </CardContent>
      </Card>

      {/* Filters */}
      <Card>
        <CardHeader>
          <CardTitle>Filters (Optional)</CardTitle>
          <CardDescription>Limit which bookings/tenants receive this message</CardDescription>
        </CardHeader>
        <CardContent className="space-y-4">
          <div className="space-y-2">
            <Label htmlFor="applyToRentalType">Rental Type</Label>
            <Select
              value={watch('applyToRentalType') || 'BOTH'}
              onValueChange={(value) => setValue('applyToRentalType', value)}
            >
              <SelectTrigger>
                <SelectValue placeholder="All rental types" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="BOTH">All Properties</SelectItem>
                <SelectItem value="LONG_TERM">Long-term Only</SelectItem>
                <SelectItem value="SHORT_TERM">Short-term Only</SelectItem>
              </SelectContent>
            </Select>
          </div>

          {properties.length > 0 && (
            <div className="space-y-2">
              <Label>Specific Properties</Label>
              <div className="max-h-48 space-y-2 overflow-y-auto rounded-lg border p-3">
                {properties.map((property) => (
                  <div key={property.id} className="flex items-center space-x-2">
                    <Checkbox
                      id={`property-${property.id}`}
                      checked={selectedPropertyIds.includes(property.id)}
                      onCheckedChange={() => handlePropertyToggle(property.id)}
                    />
                    <label
                      htmlFor={`property-${property.id}`}
                      className="text-sm leading-none font-medium peer-disabled:cursor-not-allowed peer-disabled:opacity-70"
                    >
                      {property.name}
                    </label>
                  </div>
                ))}
              </div>
              <p className="text-muted-foreground text-xs">
                Leave empty to apply to all properties
              </p>
            </div>
          )}
        </CardContent>
      </Card>

      {/* Form Actions */}
      <div className="flex justify-end gap-4">
        {onCancel && (
          <Button type="button" variant="outline" onClick={onCancel} disabled={isLoading}>
            Cancel
          </Button>
        )}
        <Button type="submit" disabled={isLoading}>
          {isLoading && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}
          {initialData ? 'Update Automation' : 'Create Automation'}
        </Button>
      </div>
    </form>
  );
}
