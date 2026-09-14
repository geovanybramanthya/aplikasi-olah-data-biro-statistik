/**
 * PII and Metadata Detection Engine for Survey Question Profiling
 * Identifies respondent personally identifiable information (PII) and system metadata
 * to automatically exclude from default visualization generation.
 */

export const PII_PATTERNS: RegExp[] = [
  /^(timestamp|tanda\s*waktu|waktu(\s*(pengisian|submit|input|tanggapan))?|tanggal(\s*(pengisian|submit|input|tanggapan))?|date(\s*(submitted|created))?)$/i,
  /^(nama|name|full\s*name|nama\s*lengkap|nama\s*\(.*?\)|nama\s*responden|nama\s*mahasiswa|nama\s*fungsionaris)$/i,
  /^(n\.?i\.?m\.?|n\.?p\.?m\.?|n\.?r\.?p\.?|nomor\s*induk(\s*mahasiswa)?|student\s*id)$/i,
  /^(alamat\s*e-?mail|e-?mail(\s*address)?|surel)(\s*\(.*?\))?$/i,
  /^(no\.?\s*(hp|wa|whatsapp|telepon|telp)|nomor\s*(hp|wa|whatsapp|telepon|telp|kontak)|kontak|phone|whatsapp|no\.?\s*telp)(\s*\(.*?\))?$/i,
];

/**
 * Strict evaluation of whether a column header is PII or submission metadata.
 */
export function isStrictPIIHeader(header: string): boolean {
  if (!header) return false;
  const clean = header.trim().replace(/[:\s]+$/, '').replace(/\s+/g, ' ');
  return PII_PATTERNS.some((pattern) => pattern.test(clean));
}

/**
 * Checks if a column header corresponds to PII or submission metadata.
 * @param header - Raw or sanitized header string
 * @returns boolean indicating whether the column contains PII/metadata
 */
export function isPIIColumn(header: string): boolean {
  return isStrictPIIHeader(header);
}

/**
 * Normalizes header string by trimming leading/trailing whitespace
 * and collapsing multiple spaces into a single space.
 */
export function sanitizeHeader(rawHeader: string): string {
  if (!rawHeader) return '';
  return rawHeader.trim().replace(/\s+/g, ' ');
}
