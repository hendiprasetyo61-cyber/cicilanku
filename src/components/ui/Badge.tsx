import React from 'react';
import { InstallmentStatus, LoanStatus } from '@/lib/types';

export interface BadgeProps {
  status?: InstallmentStatus | LoanStatus | 'transfer' | 'tunai' | 'nombok' | 'surplus';
  label?: string;
  size?: 'sm' | 'md';
  className?: string;
}

export const Badge: React.FC<BadgeProps> = ({ status, label, size = 'sm', className = '' }) => {
  const getBadgeConfig = () => {
    switch (status) {
      case 'lunas':
        return { text: label || 'Lunas', style: 'bg-emerald-50 text-emerald-700 border-emerald-200' };
      case 'sebagian':
        return { text: label || 'Sebagian', style: 'bg-amber-50 text-amber-700 border-amber-200' };
      case 'belum':
        return { text: label || 'Belum Bayar', style: 'bg-slate-100 text-slate-700 border-slate-200' };
      case 'telat':
        return { text: label || 'Telat Jatuh Tempo', style: 'bg-rose-50 text-rose-700 border-rose-200' };
      case 'aktif':
        return { text: label || 'Aktif', style: 'bg-blue-50 text-blue-700 border-blue-200' };
      case 'transfer':
        return { text: label || 'Transfer Bank', style: 'bg-indigo-50 text-indigo-700 border-indigo-200' };
      case 'tunai':
        return { text: label || 'Tunai / Cash', style: 'bg-teal-50 text-teal-700 border-teal-200' };
      case 'nombok':
        return { text: label || 'Menalangi', style: 'bg-rose-50 text-rose-700 border-rose-200' };
      case 'surplus':
        return { text: label || 'Surplus Setor', style: 'bg-emerald-50 text-emerald-700 border-emerald-200' };
      default:
        return { text: label || '', style: 'bg-slate-100 text-slate-700 border-slate-200' };
    }
  };

  const config = getBadgeConfig();
  const sizeClasses = size === 'sm' ? 'text-[11px] px-2.5 py-0.5' : 'text-xs px-3 py-1 font-medium';

  return (
    <span
      className={`inline-flex items-center justify-center font-semibold rounded-full border shadow-2xs ${sizeClasses} ${config.style} ${className}`}
    >
      {config.text}
    </span>
  );
};
