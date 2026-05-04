/**
 * Menghasilkan slug yang ramah URL dari sebuah string.
 * 
 * Contoh:
 * - "Susu Bendera Cokelat" -> "susu-bendera-cokelat"
 * - "Minyak Goreng 2L !!!" -> "minyak-goreng-2l"
 * - " Buah Naga "          -> "buah-naga"
 */
export const generateSlug = (text: string): string => {
  return text
    .toLowerCase()
    .trim()
    .replace(/[^a-z0-9]+/g, "-") // Ganti semua karakter non-alfanumerik dengan "-"
    .replace(/(^-|-$)/g, "");    // Hapus "-" di awal atau akhir string
};
