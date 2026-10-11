import React from 'react';

// Mendefinisikan tipe data yang diterima komponen
export interface ProgressProps {
  value: number; // Nilai persentase (0 hingga 100)
  label?: string; // Label opsional di atas grafik
  sublabel?: string; // Teks opsional di bawah grafik
  showPercentage?: boolean; // Pilihan untuk menampilkan angka %
  color?: 'emerald' | 'shopee' | 'amber' | 'blue' | 'rose'; // Pilihan warna
  size?: 'sm' | 'md' | 'lg'; // Pilihan ketebalan grafik
}

export const Progress: React.FC<ProgressProps> = ({
  value = 0,
  label,
  sublabel,
  showPercentage = true,
  color = 'shopee',
  size = 'md',
}) => {
  // 1. Memastikan nilai (value) selalu berada di antara 0 dan 100 agar aman
  const safeValue = Math.min(100, Math.max(0, Number(value) || 0));

  // 2. Menentukan ketebalan grafik berdasarkan prop 'size'
  const sizeClasses = {
    sm: 'h-1.5',
    md: 'h-2.5',
    lg: 'h-4',
  };

  // 3. Menentukan warna garis (foreground) berdasarkan prop 'color'
  const colorClasses = {
    emerald: 'bg-emerald-500',
    shopee: 'bg-shopee-500', // Warna oranye utama
    amber: 'bg-amber-500',
    blue: 'bg-blue-500',
    rose: 'bg-rose-500',
  };

  // 4. Menentukan warna latar (background) yang lebih transparan
  const bgColorClasses = {
    emerald: 'bg-emerald-100',
    shopee: 'bg-orange-100', // Warna latar untuk shopee
    amber: 'bg-amber-100',
    blue: 'bg-blue-100',
    rose: 'bg-rose-100',
  };

  return (
    <div className="w-full flex flex-col gap-1.5">
      {/* Bagian Atas: Label & Persentase (Opsional) */}
      {(label || showPercentage) && (
        <div className="flex justify-between items-end">
          {label && <span className="text-xs font-semibold text-slate-700">{label}</span>}
          {showPercentage && (
            <span
              className={`text-[11px] font-extrabold ${color === 'shopee' ? 'text-shopee-600' : `text-${color}-600`
                }`}
            >
              {Math.round(safeValue)}%
            </span>
          )}
        </div>
      )}

      {/* Bagian Tengah: Batang Grafik (Progress Bar) */}
      <div
        className={`w-full overflow-hidden rounded-full ${bgColorClasses[color]} ${sizeClasses[size]}`}
      >
        <div
          className={`h-full rounded-full transition-all duration-500 ease-out ${colorClasses[color]}`}
          // INI BAGIAN PALING PENTING: Menerapkan lebar secara manual lewat 'style'
          style={{ width: `${safeValue}%` }}
        />
      </div>

      {/* Bagian Bawah: Sublabel (Opsional) */}
      {sublabel && <span className="text-[10px] text-slate-500">{sublabel}</span>}
    </div>
  );
};