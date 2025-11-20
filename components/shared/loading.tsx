import { Loader2 } from 'lucide-react';

import { cn } from '@/lib/utils';

interface LoadingProps {
  className?: string;
  size?: 'sm' | 'md' | 'lg';
  text?: string;
}

const sizeClasses = {
  sm: 'h-4 w-4',
  md: 'h-6 w-6',
  lg: 'h-8 w-8',
};

export function Loading({ className, size = 'md', text }: LoadingProps) {
  return (
    <div className={cn('flex flex-col items-center justify-center gap-2', className)}>
      <Loader2 className={cn('text-primary animate-spin', sizeClasses[size])} />
      {text && <p className="text-muted-foreground text-sm">{text}</p>}
    </div>
  );
}

export function PageLoading() {
  return (
    <div className="flex min-h-[400px] items-center justify-center">
      <Loading size="lg" text="Loading..." />
    </div>
  );
}

export function FullPageLoading() {
  return (
    <div className="flex min-h-screen items-center justify-center">
      <Loading size="lg" text="Loading..." />
    </div>
  );
}
