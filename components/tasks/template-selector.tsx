'use client';

import { useState } from 'react';
import { useQuery } from '@tanstack/react-query';
import { FileText, Check, ChevronDown, Loader2, ListChecks, Star } from 'lucide-react';

import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from '@/components/ui/dialog';
import { cn } from '@/lib/utils';

interface ChecklistItem {
  item: string;
  isRequired: boolean;
  sortOrder: number;
}

interface TaskTemplate {
  id: string;
  userId: string | null;
  name: string;
  description: string | null;
  taskType: string;
  priority: string;
  checklist: ChecklistItem[] | null;
  isSystem: boolean;
  category: string | null;
  createdAt: string;
}

interface TemplateSelectorProps {
  onSelect: (template: TaskTemplate) => void;
  selectedTemplateId?: string;
}

const categoryLabels: Record<string, string> = {
  'check-in': 'Check-In',
  'check-out': 'Check-Out',
  inspection: 'Inspection',
  'move-in': 'Move-In',
  'move-out': 'Move-Out',
  lease: 'Lease',
  other: 'Other',
};

const priorityColors: Record<string, string> = {
  LOW: 'bg-gray-100 text-gray-700',
  NORMAL: 'bg-blue-100 text-blue-700',
  HIGH: 'bg-orange-100 text-orange-700',
  URGENT: 'bg-red-100 text-red-700',
};

export function TemplateSelector({ onSelect, selectedTemplateId }: TemplateSelectorProps) {
  const [open, setOpen] = useState(false);
  const [selectedTemplate, setSelectedTemplate] = useState<TaskTemplate | null>(null);

  // Fetch templates
  const { data, isLoading } = useQuery({
    queryKey: ['task-templates'],
    queryFn: async () => {
      const response = await fetch('/api/tasks/templates');
      if (!response.ok) throw new Error('Failed to fetch templates');
      return response.json() as Promise<{
        data: TaskTemplate[];
        categories: Record<string, TaskTemplate[]>;
        total: number;
      }>;
    },
  });

  const handleSelectTemplate = (template: TaskTemplate) => {
    setSelectedTemplate(template);
  };

  const handleApplyTemplate = () => {
    if (selectedTemplate) {
      onSelect(selectedTemplate);
      setOpen(false);
    }
  };

  const categories = data?.categories || {};
  const sortedCategoryKeys = Object.keys(categories).sort((a, b) => {
    // System categories first, then alphabetically
    const systemCategories = [
      'check-in',
      'check-out',
      'inspection',
      'move-in',
      'move-out',
      'lease',
    ];
    const aIndex = systemCategories.indexOf(a);
    const bIndex = systemCategories.indexOf(b);
    if (aIndex !== -1 && bIndex !== -1) return aIndex - bIndex;
    if (aIndex !== -1) return -1;
    if (bIndex !== -1) return 1;
    return a.localeCompare(b);
  });

  return (
    <Dialog open={open} onOpenChange={setOpen}>
      <DialogTrigger asChild>
        <Button variant="outline" className="w-full justify-between">
          <span className="flex items-center gap-2">
            <FileText className="h-4 w-4" />
            {selectedTemplateId ? 'Change Template' : 'Use a Template'}
          </span>
          <ChevronDown className="h-4 w-4 opacity-50" />
        </Button>
      </DialogTrigger>
      <DialogContent className="flex h-[90vh] max-h-[90vh] w-[95vw] max-w-6xl flex-col overflow-hidden">
        <DialogHeader>
          <DialogTitle>Select a Task Template</DialogTitle>
          <DialogDescription>
            Choose a template to quickly create a task with pre-filled details and checklist items.
          </DialogDescription>
        </DialogHeader>

        <div className="min-h-0 flex-1 overflow-hidden">
          {isLoading ? (
            <div className="flex h-full items-center justify-center py-8">
              <Loader2 className="h-6 w-6 animate-spin" />
            </div>
          ) : (
            <div className="flex h-full min-h-0 gap-4">
              {/* Template list */}
              <div className="min-h-0 flex-1 space-y-4 overflow-y-auto pr-2">
                {sortedCategoryKeys.length === 0 ? (
                  <p className="text-muted-foreground py-8 text-center text-sm">
                    No templates available
                  </p>
                ) : (
                  sortedCategoryKeys.map((category) => (
                    <div key={category}>
                      <h4 className="text-muted-foreground mb-2 text-xs font-semibold tracking-wide uppercase">
                        {categoryLabels[category] || category}
                      </h4>
                      <div className="space-y-1">
                        {categories[category].map((template) => (
                          <button
                            key={template.id}
                            onClick={() => handleSelectTemplate(template)}
                            className={cn(
                              'flex w-full items-center gap-3 rounded-lg border p-3 text-left transition-colors',
                              selectedTemplate?.id === template.id
                                ? 'border-primary bg-primary/10'
                                : 'hover:bg-muted/60 border-transparent'
                            )}
                          >
                            <div className="flex-1">
                              <div className="flex items-center gap-2">
                                <span className="font-medium">{template.name}</span>
                                {template.isSystem && (
                                  <Star className="h-3 w-3 fill-yellow-400 text-yellow-400" />
                                )}
                              </div>
                              {template.description && (
                                <p className="text-muted-foreground mt-1 line-clamp-1 text-xs">
                                  {template.description}
                                </p>
                              )}
                              <div className="mt-2 flex items-center gap-2">
                                <Badge variant="secondary" className="text-xs">
                                  {template.taskType.replace(/_/g, ' ')}
                                </Badge>
                                <Badge className={cn('text-xs', priorityColors[template.priority])}>
                                  {template.priority}
                                </Badge>
                                {template.checklist && template.checklist.length > 0 && (
                                  <span className="text-muted-foreground flex items-center gap-1 text-xs">
                                    <ListChecks className="h-3 w-3" />
                                    {template.checklist.length} items
                                  </span>
                                )}
                              </div>
                            </div>
                            {selectedTemplate?.id === template.id && (
                              <Check className="text-primary h-5 w-5" />
                            )}
                          </button>
                        ))}
                      </div>
                    </div>
                  ))
                )}
              </div>

              {/* Preview panel */}
              {selectedTemplate && (
                <div className="w-80 shrink-0 border-l pl-4">
                  <h4 className="mb-3 font-semibold">Preview</h4>
                  <div className="space-y-3">
                    <div>
                      <p className="text-muted-foreground text-xs">Name</p>
                      <p className="text-sm font-medium">{selectedTemplate.name}</p>
                    </div>
                    {selectedTemplate.description && (
                      <div>
                        <p className="text-muted-foreground text-xs">Description</p>
                        <p className="text-sm">{selectedTemplate.description}</p>
                      </div>
                    )}
                    <div>
                      <p className="text-muted-foreground text-xs">Type</p>
                      <p className="text-sm">{selectedTemplate.taskType.replace(/_/g, ' ')}</p>
                    </div>
                    <div>
                      <p className="text-muted-foreground text-xs">Priority</p>
                      <Badge className={cn('text-xs', priorityColors[selectedTemplate.priority])}>
                        {selectedTemplate.priority}
                      </Badge>
                    </div>
                    {selectedTemplate.checklist && selectedTemplate.checklist.length > 0 && (
                      <div>
                        <p className="text-muted-foreground mb-2 text-xs">
                          Checklist ({selectedTemplate.checklist.length} items)
                        </p>
                        <ul className="max-h-40 space-y-1 overflow-y-auto text-sm">
                          {selectedTemplate.checklist.map((item, index) => (
                            <li key={index} className="flex items-start gap-2">
                              <span className="text-muted-foreground mt-0.5">
                                {item.isRequired ? '●' : '○'}
                              </span>
                              <span className={cn(item.isRequired && 'font-medium')}>
                                {item.item}
                                {item.isRequired && (
                                  <span className="ml-1 text-xs text-orange-600">*</span>
                                )}
                              </span>
                            </li>
                          ))}
                        </ul>
                      </div>
                    )}
                  </div>
                </div>
              )}
            </div>
          )}
        </div>

        <div className="flex justify-end gap-2 border-t pt-4">
          <Button variant="outline" onClick={() => setOpen(false)}>
            Cancel
          </Button>
          <Button onClick={handleApplyTemplate} disabled={!selectedTemplate}>
            Apply Template
          </Button>
        </div>
      </DialogContent>
    </Dialog>
  );
}
