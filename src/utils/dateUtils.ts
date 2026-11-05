/**
 * Formats a date string (YYYY-MM-DD or ISO) into Brazilian standard day-month-year order: DD/MM/AAAA
 */
export function formatDateBR(dateStr?: string | null): string {
  if (!dateStr) return '';
  const trimmed = dateStr.trim();
  if (!trimmed) return '';

  // Check if already in DD/MM/YYYY or DD-MM-YYYY
  if (/^\d{1,2}[-/]\d{1,2}[-/]\d{4}$/.test(trimmed)) {
    const parts = trimmed.split(/[-/]/);
    const day = parts[0].padStart(2, '0');
    const month = parts[1].padStart(2, '0');
    const year = parts[2];
    return `${day}/${month}/${year}`;
  }

  // Check if in YYYY-MM-DD or YYYY/MM/DD
  if (/^\d{4}[-/]\d{1,2}[-/]\d{1,2}$/.test(trimmed)) {
    const parts = trimmed.split(/[-/]/);
    const year = parts[0];
    const month = parts[1].padStart(2, '0');
    const day = parts[2].padStart(2, '0');
    return `${day}/${month}/${year}`;
  }

  // Fallback: Try Date parsing
  try {
    const parsed = new Date(trimmed);
    if (!isNaN(parsed.getTime())) {
      // Use UTC parts if it's a date-only string to avoid timezone offset
      if (/^\d{4}-\d{2}-\d{2}/.test(trimmed)) {
        const [y, m, d] = trimmed.substring(0, 10).split('-');
        return `${d}/${m}/${y}`;
      }
      const day = String(parsed.getDate()).padStart(2, '0');
      const month = String(parsed.getMonth() + 1).padStart(2, '0');
      const year = parsed.getFullYear();
      return `${day}/${month}/${year}`;
    }
  } catch {
    // Return original if cannot parse
  }

  return trimmed;
}

/**
 * Returns date in DD-MM-AAAA format (with hyphens)
 */
export function formatDateHyphenBR(dateStr?: string | null): string {
  const formatted = formatDateBR(dateStr);
  return formatted ? formatted.replace(/\//g, '-') : '';
}
