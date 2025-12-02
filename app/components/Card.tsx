import React from 'react';

interface CardProps {
  children: React.ReactNode;
  className?: string;
  noPadding?: boolean;
}

export const Card: React.FC<CardProps> = ({ children, className = '', noPadding = false }) => {
  return (
    <div
      className={`overflow-hidden rounded-2xl border border-slate-100 bg-white shadow-xl shadow-slate-200/50 ${className}`}
    >
      <div className={noPadding ? '' : 'p-6 sm:p-8'}>{children}</div>
    </div>
  );
};
