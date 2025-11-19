import type { LucideIcon } from 'lucide-react';

import { cn } from '@/lib/utils';

interface EmptyStateProps {
  icon?: LucideIcon;
  title: string;
  description?: string;
  children?: React.ReactNode;
  className?: string;
}

export function EmptyState({
  icon: Icon,
  title,
  description,
  children,
  className,
}: EmptyStateProps) {
  return (
    <div
      className={cn(
        'flex flex-col items-center justify-center rounded-lg border border-dashed p-8 text-center',
        className
      )}
    >
      {Icon && (
        <div className="bg-muted flex h-12 w-12 items-center justify-center rounded-full">
          <Icon className="text-muted-foreground h-6 w-6" />
        </div>
      )}
      <h3 className="mt-4 text-lg font-semibold">{title}</h3>
      {description && <p className="text-muted-foreground mt-2 text-sm">{description}</p>}
      {children && <div className="mt-6">{children}</div>}
    </div>
  );
}
