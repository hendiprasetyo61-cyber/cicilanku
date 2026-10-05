import { describe, it, expect } from 'vitest';
import { generateInstallmentSchedule, calculateDueDate } from '../lib/calculations/installment';

describe('Kalkulator Jadwal Cicilan Shopee PayLater', () => {
  it('harus menghitung bunga 0% dengan pembagian rata sempurna (HP Rp 3.000.000 tenor 6 bulan)', () => {
    const result = generateInstallmentSchedule({
      hargaPokok: 3000000,
      bungaPersenPerBulan: 0,
      metodeBunga: 'flat',
      biayaAdmin: 0,
      alokasiAdmin: 'pertama',
      tenorBulan: 6,
      tanggalMulai: '2024-01-01',
      tanggalJatuhTempo: 15,
    });

    expect(result.installments.length).toBe(6);
    expect(result.totalPokok).toBe(3000000);
    expect(result.totalBunga).toBe(0);
    expect(result.totalTagihan).toBe(3000000);

    // Tiap bulan harus pas Rp 500.000
    result.installments.forEach((inst) => {
      expect(inst.pokok).toBe(500000);
      expect(inst.bunga).toBe(0);
      expect(inst.total_tagihan).toBe(500000);
    });
  });

  it('harus menangani selisih pembulatan rupiah pada bunga 0% dengan nominal ganjil (Rp 1.000.000 tenor 3 bulan)', () => {
    const result = generateInstallmentSchedule({
      hargaPokok: 1000000,
      bungaPersenPerBulan: 0,
      metodeBunga: 'flat',
      biayaAdmin: 0,
      alokasiAdmin: 'pertama',
      tenorBulan: 3,
      tanggalMulai: '2024-01-01',
      tanggalJatuhTempo: 10,
    });

    expect(result.installments.length).toBe(3);
    expect(result.installments[0].pokok).toBe(333333);
    expect(result.installments[1].pokok).toBe(333333);
    // Selisih Rp 1 dialokasikan ke bulan terakhir
    expect(result.installments[2].pokok).toBe(333334);
    expect(result.totalPokok).toBe(1000000);
    expect(result.totalTagihan).toBe(1000000);
  });

  it('harus menghitung bunga Flat dengan benar (Rp 2.000.000 tenor 4 bulan bunga 2% per bulan)', () => {
    const result = generateInstallmentSchedule({
      hargaPokok: 2000000,
      bungaPersenPerBulan: 2,
      metodeBunga: 'flat',
      biayaAdmin: 0,
      alokasiAdmin: 'pertama',
      tenorBulan: 4,
      tanggalMulai: '2024-02-01',
      tanggalJatuhTempo: 5,
    });

    // Pokok: 2.000.000 / 4 = 500.000 / bln
    // Bunga flat: 2.000.000 * 2% = 40.000 / bln
    // Total per bulan = 540.000
    expect(result.installments[0].pokok).toBe(500000);
    expect(result.installments[0].bunga).toBe(40000);
    expect(result.installments[0].total_tagihan).toBe(540000);

    expect(result.totalBunga).toBe(160000);
    expect(result.totalTagihan).toBe(2160000);
  });

  it('harus menghitung bunga Efektif (Anuitas) dan memastikan total pokok terlunasi penuh', () => {
    const result = generateInstallmentSchedule({
      hargaPokok: 6000000,
      bungaPersenPerBulan: 2.95,
      metodeBunga: 'efektif',
      biayaAdmin: 0,
      alokasiAdmin: 'pertama',
      tenorBulan: 6,
      tanggalMulai: '2024-03-01',
      tanggalJatuhTempo: 20,
    });

    expect(result.installments.length).toBe(6);
    expect(result.totalPokok).toBe(6000000);

    // Di bunga efektif, proporsi bunga menurun setiap bulan, pokok meningkat
    const bungaBulan1 = result.installments[0].bunga;
    const bungaBulanTerakhir = result.installments[5].bunga;
    expect(bungaBulan1).toBeGreaterThan(bungaBulanTerakhir);

    // Total tagihan harus sama persis dengan totalPokok + totalBunga
    expect(result.totalTagihan).toBe(result.totalPokok + result.totalBunga);
  });

  it('harus mengalokasikan biaya admin ke cicilan pertama dengan opsi "pertama"', () => {
    const result = generateInstallmentSchedule({
      hargaPokok: 1200000,
      bungaPersenPerBulan: 0,
      metodeBunga: 'flat',
      biayaAdmin: 50000,
      alokasiAdmin: 'pertama',
      tenorBulan: 3,
      tanggalMulai: '2024-01-01',
      tanggalJatuhTempo: 25,
    });

    // Pokok: 400.000
    // Bulan 1: 400.000 + 50.000 admin = 450.000
    // Bulan 2: 400.000
    // Bulan 3: 400.000
    expect(result.installments[0].total_tagihan).toBe(450000);
    expect(result.installments[1].total_tagihan).toBe(400000);
    expect(result.installments[2].total_tagihan).toBe(400000);
    expect(result.totalTagihan).toBe(1250000);
  });

  it('harus membagi rata biaya admin ke seluruh tenor dengan opsi "rata"', () => {
    const result = generateInstallmentSchedule({
      hargaPokok: 1200000,
      bungaPersenPerBulan: 0,
      metodeBunga: 'flat',
      biayaAdmin: 30000,
      alokasiAdmin: 'rata',
      tenorBulan: 3,
      tanggalMulai: '2024-01-01',
      tanggalJatuhTempo: 25,
    });

    // Admin 30.000 / 3 = 10.000 per bulan
    // Tagihan per bulan: 400.000 + 10.000 = 410.000
    expect(result.installments[0].total_tagihan).toBe(410000);
    expect(result.installments[1].total_tagihan).toBe(410000);
    expect(result.installments[2].total_tagihan).toBe(410000);
    expect(result.totalTagihan).toBe(1230000);
  });

  it('harus menghitung tanggal jatuh tempo yang valid bahkan jika tanggal 31 di Februari', () => {
    const dueDateFeb = calculateDueDate('2024-01-15', 31, 2);
    // Tahun 2024 adalah tahun kabisat (Februari = 29 hari)
    expect(dueDateFeb).toBe('2024-02-29');
  });
});
