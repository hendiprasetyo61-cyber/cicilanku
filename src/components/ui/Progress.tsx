import React from 'react';

// 1. Mendefinisikan tipe data yang diterima komponen
export interface ProgressProps {
  value: number; // Nilai persentase (0 hingga 100)
  label?: string; // Label opsional di atas grafik
  sublabel?: string; // Teks opsional di bawah grafik
  showPercentage?: boolean; // Pilihan untuk menampilkan angka %
  color?: 'emerald' | 'shopee' | 'amber' | 'blue' | 'rose' | 'indigo'; // Pilihan warna
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
  // 2. PERLINDUNGAN LOGIKA (Sangat Penting)
  // Mencegah error NaN atau undefined, otomatis menjadikannya angka 0 - 100
  const safeValue = Math.min(100, Math.max(0, Number(value) || 0));

  // 3. Mengatur ketebalan grafik
  const sizeClasses = {
    sm: 'h-1.5',
    md: 'h-2.5',
    lg: 'h-3.5',
  };

  // 4. MENGGUNAKAN WARNA SOLID YANG SUDAH TERBUKTI BERHASIL
  // Ini menghindari error dari warna gradien yang tidak terdaftar di Tailwind
  const colorClasses = {
    emerald: 'bg-emerald-500',
    shopee: 'bg-shopee-500', // Warna utama aplikasi
    amber: 'bg-amber-500',
    blue: 'bg-blue-500',
    rose: 'bg-rose-500',
    indigo: 'bg-indigo-500',
  };

  // 5. Warna latar (background) yang lebih transparan
  const bgColorClasses = {
    emerald: 'bg-emerald-100',
    shopee: 'bg-orange-100', // Khusus shopee kita pakai latar orange agar serasi
    amber: 'bg-amber-100',
    blue: 'bg-blue-100',
    rose: 'bg-rose-100',
    indigo: 'bg-indigo-100',
  };

  return (
    <div className="w-full flex flex-col gap-1.5">
      {/* Bagian Atas: Label & Persentase */}
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
        className={`w-full overflow-hidden rounded-full ${bgColorClasses[color] || 'bg-slate-100'} ${sizeClasses[size]} border border-slate-200/50`}
      >
        <div
          className={`h-full rounded-full transition-all duration-500 ease-out ${colorClasses[color] || 'bg-slate-500'}`}
          // INI BAGIAN PALING PENTING: Menerapkan lebar secara manual
          style={{ width: `${safeValue}%` }}
        />
      </div>

      {/* Bagian Bawah: Teks sublabel opsional */}
      {sublabel && <span className="text-[10px] text-slate-500">{sublabel}</span>}
    </div>
  );
};