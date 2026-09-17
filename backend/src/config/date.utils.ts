// Format: DD-MM-YYYY (always 4-digit year)
export function toISO(dateStr: string): string {
  const [d, m, y] = dateStr.split('-').map(Number);
  return `${y}-${String(m).padStart(2, '0')}-${String(d).padStart(2, '0')}`;
}

export function fromISO(isoDate: string): string {
  const [y, m, d] = isoDate.split('-').map(Number);
  return `${String(d).padStart(2, '0')}-${String(m).padStart(2, '0')}-${y}`;
}

// Returns current date as DD-MM-YYYY
export function todayDDMMYYYY(): string {
  const d = new Date();
  return `${String(d.getDate()).padStart(2, '0')}-${String(d.getMonth() + 1).padStart(2, '0')}-${d.getFullYear()}`;
}
