import { describe, it, expect } from 'vitest';
import { calculateLoanBalance, determineInstallmentStatus } from '../lib/calculations/balance';

describe('Kalkulator Saldo & Posisi Kas CicilanKu', () => {
  it('harus menghitung kondisi nombok (posisi kas negatif) jika pemilik akun bayar Shopee lebih banyak dari setoran teman', () => {
    // Skenario HP Rp 3.000.000
    // Pemilik sudah bayar ke Shopee cicilan 1 dan 2 = Rp 1.000.000
    // Teman baru setor Rp 350.000 + Rp 200.000 = Rp 550.000
    // Posisi kas: 550.000 - 1.000.000 = -450.000 (Pemilik menalangi Rp 450.000)
    const summary = calculateLoanBalance(
      { total_tagihan: 3000000 },
      [
        { cicilan_ke: 1, jatuh_tempo: '2024-02-15', total_tagihan: 500000, sudah_dibayar: 500000, status: 'lunas' },
        { cicilan_ke: 2, jatuh_tempo: '2024-03-15', total_tagihan: 500000, sudah_dibayar: 500000, status: 'lunas' },
        { cicilan_ke: 3, jatuh_tempo: '2024-04-15', total_tagihan: 500000, sudah_dibayar: 0, status: 'belum' },
        { cicilan_ke: 4, jatuh_tempo: '2024-05-15', total_tagihan: 500000, sudah_dibayar: 0, status: 'belum' },
        { cicilan_ke: 5, jatuh_tempo: '2024-06-15', total_tagihan: 500000, sudah_dibayar: 0, status: 'belum' },
        { cicilan_ke: 6, jatuh_tempo: '2024-07-15', total_tagihan: 500000, sudah_dibayar: 0, status: 'belum' },
      ],
      [
        { jumlah: 350000 },
        { jumlah: 200000 },
      ],
      new Date('2024-03-20')
    );

    expect(summary.totalTagihanLoan).toBe(3000000);
    expect(summary.totalSetorTeman).toBe(550000);
    expect(summary.sisaUtangTeman).toBe(2450000);
    expect(summary.totalDibayarKeShopee).toBe(1000000);
    expect(summary.sisaTagihanShopee).toBe(2000000);
    expect(summary.posisiKas).toBe(-450000);
    expect(summary.isNombok).toBe(true);
    expect(summary.nominalNombok).toBe(450000);
    expect(summary.statusPinjaman).toBe('aktif');
  });

  it('harus menghitung posisi kas surplus jika teman menyetor lebih cepat / lebih banyak', () => {
    // Skenario: Teman setor langsung Rp 1.500.000
    // Pemilik baru bayar Shopee cicilan 1 = Rp 500.000
    // Posisi kas: 1.500.000 - 500.000 = +1.000.000 (Surplus kas)
    const summary = calculateLoanBalance(
      { total_tagihan: 3000000 },
      [
        { cicilan_ke: 1, jatuh_tempo: '2024-02-15', total_tagihan: 500000, sudah_dibayar: 500000, status: 'lunas' },
        { cicilan_ke: 2, jatuh_tempo: '2024-03-15', total_tagihan: 500000, sudah_dibayar: 0, status: 'belum' },
      ],
      [{ jumlah: 1500000 }]
    );

    expect(summary.posisiKas).toBe(1000000);
    expect(summary.isNombok).toBe(false);
    expect(summary.nominalNombok).toBe(0);
    expect(summary.sisaUtangTeman).toBe(1500000);
  });

  it('harus mendeteksi status "telat" secara otomatis jika melewati tanggal jatuh tempo dan belum lunas', () => {
    const today = new Date('2024-04-20');

    // Jatuh tempo 15 April 2024, belum bayar sama sekali
    const statusBelum = determineInstallmentStatus(500000, 0, '2024-04-15', today);
    expect(statusBelum).toBe('telat');

    // Jatuh tempo 15 April 2024, bayar sebagian (Rp 200.000 dari Rp 500.000)
    const statusSebagian = determineInstallmentStatus(500000, 200000, '2024-04-15', today);
    expect(statusSebagian).toBe('telat');

    // Jatuh tempo 15 April 2024, sudah lunas
    const statusLunas = determineInstallmentStatus(500000, 500000, '2024-04-15', today);
    expect(statusLunas).toBe('lunas');

    // Jatuh tempo 25 April 2024 (belum lewat)
    const statusBelumLewat = determineInstallmentStatus(500000, 0, '2024-04-25', today);
    expect(statusBelumLewat).toBe('belum');
  });

  it('harus menetapkan status pinjaman "lunas" jika seluruh cicilan shopee lunas dan teman sudah melunasi seluruh utang', () => {
    const summary = calculateLoanBalance(
      { total_tagihan: 1000000 },
      [
        { cicilan_ke: 1, jatuh_tempo: '2024-01-15', total_tagihan: 500000, sudah_dibayar: 500000, status: 'lunas' },
        { cicilan_ke: 2, jatuh_tempo: '2024-02-15', total_tagihan: 500000, sudah_dibayar: 500000, status: 'lunas' },
      ],
      [
        { jumlah: 600000 },
        { jumlah: 400000 },
      ]
    );

    expect(summary.sisaUtangTeman).toBe(0);
    expect(summary.sisaTagihanShopee).toBe(0);
    expect(summary.posisiKas).toBe(0);
    expect(summary.statusPinjaman).toBe('lunas');
    expect(summary.persentaseSetorTeman).toBe(100);
    expect(summary.persentaseBayarShopee).toBe(100);
  });

  it('tetap berstatus "aktif" jika cicilan shopee lunas tapi teman masih ada sisa utang', () => {
    const summary = calculateLoanBalance(
      { total_tagihan: 1000000 },
      [
        { cicilan_ke: 1, jatuh_tempo: '2024-01-15', total_tagihan: 500000, sudah_dibayar: 500000, status: 'lunas' },
        { cicilan_ke: 2, jatuh_tempo: '2024-02-15', total_tagihan: 500000, sudah_dibayar: 500000, status: 'lunas' },
      ],
      [
        { jumlah: 700000 }, // Teman masih kurang Rp 300.000
      ]
    );

    expect(summary.sisaUtangTeman).toBe(300000);
    expect(summary.statusPinjaman).toBe('aktif');
    expect(summary.isNombok).toBe(true);
    expect(summary.nominalNombok).toBe(300000);
  });
});
