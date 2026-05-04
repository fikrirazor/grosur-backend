/**
 * Menghasilkan objek Date awal (startDate) dan akhir (endDate) untuk bulan/tahun tertentu.
 * Digunakan untuk kalkulasi manual yang membutuhkan objek Date murni.
 * 
 * Contoh: 
 * - getMonthRange(5, 2024) -> { startDate: 1 Mei 2024, endDate: 31 Mei 2024 }
 */
export const getMonthRange = (month?: number, year?: number) => {
  if (!year) return { startDate: undefined, endDate: undefined };

  if (month) {
    const startDate = new Date(year, month - 1, 1);
    const endDate = new Date(year, month, 0, 23, 59, 59, 999);
    return { startDate, endDate };
  } else {
    const startDate = new Date(year, 0, 1);
    const endDate = new Date(year, 11, 31, 23, 59, 59, 999);
    return { startDate, endDate };
  }
};

/**
 * Membuat filter range tanggal yang siap digunakan dalam query Prisma.
 * Menghasilkan format { createdAt: { gte: Date, lte: Date } }.
 */
export const buildDateFilter = (month?: number, year?: number) => {
  const { startDate, endDate } = getMonthRange(month, year);
  if (!startDate || !endDate) return {};

  return {
    createdAt: {
      gte: startDate,
      lte: endDate,
    },
  };
};

/**
 * Menghasilkan label teks yang manusiawi untuk periode tertentu.
 * Digunakan untuk judul laporan atau summary.
 * 
 * Contoh:
 * - getPeriodLabel(5, 2024) -> "5/2024"
 * - getPeriodLabel(undefined, 2024) -> "2024"
 */
export const getPeriodLabel = (month?: number, year?: number) => {
  if (month && year) return `${month}/${year}`;
  if (year) return `${year}`;
  return "All Time";
};
