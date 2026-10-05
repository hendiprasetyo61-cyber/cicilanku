import React from 'react';

export interface ProgressProps {
  value: number; // 0 - 100
  label?: string;
  sublabel?: string;
  color?: 'shopee' | 'emerald' | 'indigo' | 'amber';
  size?: 'sm' | 'md' | 'lg';
  showPercentage?: boolean;
}

export const Progress: React.FC<ProgressProps> = ({
  value,
  label,
  sublabel,
  color = 'shopee',
  size = 'md',
  showPercentage = true,
}) => {
  const clampedValue = Math.min(100, Math.max(0, value));

  const colors = {
    shopee: 'bg-gradient-to-r from-shopee-400 to-shopee-500',
    emerald: 'bg-gradient-to-r from-emerald-400 to-emerald-600',
    indigo: 'bg-gradient-to-r from-indigo-400 to-indigo-600',
    amber: 'bg-gradient-to-r from-amber-400 to-amber-500',
  };

  const heights = {
    sm: 'h-1.5',
    md: 'h-2.5',
    lg: 'h-3.5',
  };

  return (
    <div className="w-full space-y-1.5">
      {(label || showPercentage) && (
        <div className="flex justify-between items-center text-xs">
          {label && <span className="font-semibold text-slate-700">{label}</span>}
          {showPercentage && <span className="font-bold text-slate-900">{clampedValue}%</span>}
        </div>
      )}
      <div className={`w-full overflow-hidden rounded-full bg-slate-100 p-0.5 border border-slate-200/60 ${heights[size]}`}>
        <div
          className={`h-full rounded-full transition-all duration-500 ease-out ${colors[color]}`}
          style={{ width: `${clampedValue}%` }}
        />
      </div>
      {sublabel && <p className="text-[11px] text-slate-500">{sublabel}</p>}
    </div>
  );
};
