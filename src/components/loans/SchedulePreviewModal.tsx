'use client';

import React from 'react';
import { Modal } from '@/components/ui/Modal';
import { GeneratedSchedule } from '@/lib/types';
import { formatRupiah, formatTanggalIndo } from '@/lib/formatters';

export interface SchedulePreviewModalProps {
  isOpen: boolean;
  onClose: () => void;
  schedule: GeneratedSchedule | null;
  namaBarang: string;
}

export const SchedulePreviewModal: React.FC<SchedulePreviewModalProps> = ({
  isOpen,
  onClose,
  schedule,
  namaBarang,
}) => {
  if (!schedule) return null;

  return (
    <Modal
      isOpen={isOpen}
      onClose={onClose}
      title="Pratinjau Jadwal Cicilan SPayLater"
      description={`Simulasi ${schedule.installments.length} bulan cicilan untuk: ${namaBarang || 'Barang'}`}
      maxWidth="lg"
    >
      <div className="space-y-4">
        {/* Ringkasan Header */}
        <div className="grid grid-cols-3 gap-2 rounded-xl bg-slate-50 p-3 text-center border border-slate-200/80">
          <div>
            <span className="text-[11px] text-slate-500 block font-medium">Total Pokok</span>
            <span className="text-xs sm:text-sm font-bold text-slate-800">{formatRupiah(schedule.totalPokok)}</span>
          </div>
          <div>
            <span className="text-[11px] text-slate-500 block font-medium">Total Bunga</span>
            <span className="text-xs sm:text-sm font-bold text-amber-600">{formatRupiah(schedule.totalBunga)}</span>
          </div>
          <div>
            <span className="text-[11px] text-slate-500 block font-medium">Total Tagihan</span>
            <span className="text-xs sm:text-sm font-extrabold text-shopee-600">{formatRupiah(schedule.totalTagihan)}</span>
          </div>
        </div>

        {/* Tabel Rincian */}
        <div className="overflow-x-auto rounded-xl border border-slate-200">
          <table className="w-full text-left text-xs">
            <thead className="bg-slate-100/80 text-slate-700 font-semibold border-b border-slate-200">
              <tr>
                <th className="py-2.5 px-3">Bulan</th>
                <th className="py-2.5 px-3">Jatuh Tempo</th>
                <th className="py-2.5 px-3 text-right">Pokok</th>
                <th className="py-2.5 px-3 text-right">Bunga</th>
                <th className="py-2.5 px-3 text-right font-bold text-slate-900">Total / Bln</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-100">
              {schedule.installments.map((inst) => (
                <tr key={inst.cicilan_ke} className="hover:bg-slate-50/70 transition">
                  <td className="py-2.5 px-3 font-semibold text-slate-800">Bulan ke-{inst.cicilan_ke}</td>
                  <td className="py-2.5 px-3 text-slate-600">{formatTanggalIndo(inst.jatuh_tempo, true)}</td>
                  <td className="py-2.5 px-3 text-right text-slate-700">{formatRupiah(inst.pokok)}</td>
                  <td className="py-2.5 px-3 text-right text-amber-600 font-medium">{formatRupiah(inst.bunga)}</td>
                  <td className="py-2.5 px-3 text-right font-bold text-slate-900">{formatRupiah(inst.total_tagihan)}</td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>

        <p className="text-[11px] text-slate-500 italic">
          * Selisih pembulatan desimal Rupiah secara otomatis dialokasikan ke cicilan bulan terakhir sehingga total kalkulasi tepat hingga Rp 1.
        </p>
      </div>
    </Modal>
  );
};
