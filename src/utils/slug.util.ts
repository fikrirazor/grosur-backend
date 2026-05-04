// untuk menghasilkan slug dari teks, contoh: "Contoh Teks" akan diubah menjadi "contoh-teks"
// @param text: string

export const generateSlug = (text: string): string => {
  return text
    .toLowerCase()
    .replace(/[^a-z0-9]+/g, "-")
    .replace(/^-+|-+$/g, "");
};
