// Format: DD-MM-YYYY (always 4-digit year)
export function toBackend(dateStr: string): string {
  // Input: YYYY-MM-DD (ISO) -> Output: DD-MM-YYYY
  const [y, m, d] = dateStr.split('-').map(Number);
  return `${String(d).padStart(2, '0')}-${String(m).padStart(2, '0')}-${y}`;
}

export function toFrontend(backendDate: string): string {
  // Input: DD-MM-YYYY -> Output: YYYY-MM-DD (ISO)
  const [d, m, y] = backendDate.split('-').map(Number);
  return `${y}-${String(m).padStart(2, '0')}-${String(d).padStart(2, '0')}`;
}

export function todayDDMMYYYY(): string {
  const d = new Date();
  return `${String(d.getDate()).padStart(2, '0')}-${String(d.getMonth() + 1).padStart(2, '0')}-${d.getFullYear()}`;
}
