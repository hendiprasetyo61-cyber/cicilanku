import React from 'react';

export interface CardProps extends React.HTMLAttributes<HTMLDivElement> {
  glass?: boolean;
  hoverable?: boolean;
}

export const Card: React.FC<CardProps> = ({
  children,
  glass = true,
  hoverable = false,
  className = '',
  ...props
}) => {
  return (
    <div
      className={`rounded-2xl p-5 ${
        glass ? 'glass-card' : 'bg-white border border-slate-200/80 shadow-sm'
      } ${hoverable ? 'glass-card-hover' : ''} ${className}`}
      {...props}
    >
      {children}
    </div>
  );
};
