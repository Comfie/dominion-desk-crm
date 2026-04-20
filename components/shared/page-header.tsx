import type { ElementType } from 'react';
import { cn } from '@/lib/utils';

interface PageHeaderProps {
  title: string;
  description?: string;
  children?: React.ReactNode;
  className?: string;
  icon?: ElementType<{ className?: string }>;
}

export function PageHeader({
  title,
  description,
  children,
  className,
  icon: Icon,
}: PageHeaderProps) {
  return (
    <div
      className={cn('flex flex-col gap-3 sm:flex-row sm:items-end sm:justify-between', className)}
    >
      <div className="min-w-0 space-y-2">
        <div className="flex items-start gap-2.5">
          {Icon && <Icon className="text-muted-foreground mt-1 h-5 w-5 shrink-0" />}
          <h1 className="shell-title text-foreground min-w-0 font-semibold">{title}</h1>
        </div>
        {description && <p className="shell-support max-w-3xl">{description}</p>}
      </div>
      {children && <div className="flex flex-wrap items-center gap-2">{children}</div>}
    </div>
  );
}
