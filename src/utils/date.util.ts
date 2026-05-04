/**
 * Returns raw startDate and endDate for a given month and year.
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
 * Builds a date range filter for Prisma queries based on optional month and year.
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
 * Returns a human-readable label for a given month and year.
 */
export const getPeriodLabel = (month?: number, year?: number) => {
  if (month && year) return `${month}/${year}`;
  if (year) return `${year}`;
  return "All Time";
};
