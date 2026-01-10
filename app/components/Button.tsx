import React from 'react';

interface ButtonProps extends React.ButtonHTMLAttributes<HTMLButtonElement> {
  variant?: 'primary' | 'secondary' | 'outline' | 'ghost' | 'accent';
  size?: 'sm' | 'md' | 'lg' | 'xl';
  fullWidth?: boolean;
}

export const Button: React.FC<ButtonProps> = ({
  children,
  variant = 'primary',
  size = 'md',
  fullWidth = false,
  className = '',
  ...props
}) => {
  const baseStyles =
    'inline-flex items-center justify-center font-semibold transition-all duration-300 focus:outline-none focus:ring-2 focus:ring-offset-2 disabled:opacity-50 disabled:pointer-events-none rounded-lg active:scale-[0.98]';

  const variants = {
    primary:
      'bg-brand-600 text-white hover:bg-brand-700 hover:-translate-y-0.5 focus:ring-brand-500 shadow-lg hover:shadow-xl hover:shadow-brand-500/30',
    accent:
      'bg-accent-500 text-white hover:bg-accent-600 hover:-translate-y-0.5 focus:ring-accent-500 shadow-lg hover:shadow-xl hover:shadow-accent-500/30',
    secondary:
      'bg-white text-slate-900 hover:bg-slate-50 hover:-translate-y-0.5 border border-slate-200 focus:ring-slate-500 shadow-sm hover:shadow-md',
    outline:
      'border-2 border-white/20 text-white hover:bg-white/10 hover:-translate-y-0.5 focus:ring-white backdrop-blur-sm',
    ghost: 'text-slate-600 hover:text-brand-600 hover:bg-brand-50',
  };

  const sizes = {
    sm: 'h-9 px-3 text-sm',
    md: 'h-10 px-4 py-2 text-sm',
    lg: 'h-12 px-6 text-base',
    xl: 'h-14 px-8 text-lg',
  };

  const widthClass = fullWidth ? 'w-full' : '';

  return (
    <button
      className={`${baseStyles} ${variants[variant]} ${sizes[size]} ${widthClass} ${className}`}
      {...props}
    >
      {children}
    </button>
  );
};
