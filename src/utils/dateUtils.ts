// ─────────────────────────────────────────────
// Armimo / አርምሞ — Date & Time Utilities
// ─────────────────────────────────────────────

import * as Crypto from 'expo-crypto';

// ── ID Generation ─────────────────────────────
export function generateId(): string {
  return Crypto.randomUUID();
}

// ── Date Formatting ───────────────────────────
export function toISODateString(date: Date): string {
  const y = date.getFullYear();
  const m = String(date.getMonth() + 1).padStart(2, '0');
  const d = String(date.getDate()).padStart(2, '0');
  return `${y}-${m}-${d}`;
}

export function isToday(dateStr: string): boolean {
  if (!dateStr) return false;
  if (dateStr.includes('T')) {
    const d = new Date(dateStr);
    if (isNaN(d.getTime())) return false;
    return toISODateString(d) === toISODateString(new Date());
  }
  return dateStr === toISODateString(new Date());
}

export function isPast(dateStr: string): boolean {
  if (!dateStr) return false;
  let cleanDateStr = dateStr;
  if (dateStr.includes('T')) {
    const d = new Date(dateStr);
    if (isNaN(d.getTime())) return false;
    cleanDateStr = toISODateString(d);
  }
  const today = toISODateString(new Date());
  return cleanDateStr < today;
}

export function isFuture(dateStr: string): boolean {
  if (!dateStr) return false;
  let cleanDateStr = dateStr;
  if (dateStr.includes('T')) {
    const d = new Date(dateStr);
    if (isNaN(d.getTime())) return false;
    cleanDateStr = toISODateString(d);
  }
  const today = toISODateString(new Date());
  return cleanDateStr > today;
}

export function formatDate(isoString: string, lang: 'en' | 'am' = 'en'): string {
  const date = new Date(isoString);
  if (isNaN(date.getTime())) return '';
  return date.toLocaleDateString(lang === 'am' ? 'am-ET' : 'en-US', {
    day: 'numeric',
    month: 'short',
    year: 'numeric',
  });
}

export function formatRelativeDate(isoString: string, lang: 'en' | 'am' = 'en'): string {
  const date = new Date(isoString);
  const now = new Date();
  const diffMs = date.getTime() - now.getTime();
  const diffDays = Math.ceil(diffMs / (1000 * 60 * 60 * 24));

  if (lang === 'am') {
    if (diffDays === 0) return 'ዛሬ';
    if (diffDays === 1) return 'ነገ';
    if (diffDays === -1) return 'ትናንት';
    if (diffDays < -1) return `${Math.abs(diffDays)} ቀናት በፊት`;
    if (diffDays <= 7) return `ከ ${diffDays} ቀናት በኋላ`;
    return formatDate(isoString, 'am');
  }

  if (diffDays === 0) return 'Today';
  if (diffDays === 1) return 'Tomorrow';
  if (diffDays === -1) return 'Yesterday';
  if (diffDays < -1) return `${Math.abs(diffDays)} days ago`;
  if (diffDays <= 7) return `In ${diffDays} days`;
  return formatDate(isoString, 'en');
}

export function formatTime(isoString: string): string {
  const date = new Date(isoString);
  return date.toLocaleTimeString('en-US', { hour: '2-digit', minute: '2-digit', hour12: true });
}

// ── Duration Formatting ───────────────────────
export function formatSeconds(totalSeconds: number): string {
  const mins = Math.floor(totalSeconds / 60);
  const secs = totalSeconds % 60;
  return `${String(mins).padStart(2, '0')}:${String(secs).padStart(2, '0')}`;
}

export function formatMinutes(totalMinutes: number): string {
  if (totalMinutes < 60) return `${totalMinutes}m`;
  const hours = Math.floor(totalMinutes / 60);
  const mins = totalMinutes % 60;
  return mins > 0 ? `${hours}h ${mins}m` : `${hours}h`;
}

export function formatHours(totalSeconds: number): string {
  const hours = totalSeconds / 3600;
  if (hours < 1) return `${Math.round(totalSeconds / 60)}m`;
  return `${hours.toFixed(1)}h`;
}

// ── Time Parsing ──────────────────────────────
export function timeStringToMinutes(time: string): number {
  const [hours = 0, minutes = 0] = time.split(':').map(Number);
  return hours * 60 + minutes;
}

export function minutesToTimeString(totalMinutes: number): string {
  const hours = Math.floor(totalMinutes / 60) % 24;
  const mins = totalMinutes % 60;
  return `${String(hours).padStart(2, '0')}:${String(mins).padStart(2, '0')}`;
}

export function formatTimeString(time: string, use12Hour = true, useEthiopianTimeVal = false): string {
  const [h = 0, m = 0] = time.split(':').map(Number);
  if (useEthiopianTimeVal) {
    return formatEthiopianTime(h, m);
  }
  if (!use12Hour) return time;
  const ampm = h >= 12 ? 'PM' : 'AM';
  const hour = h % 12 || 12;
  return `${hour}:${String(m).padStart(2, '0')} ${ampm}`;
}

// ── Ethiopian Time ────────────────────────────
// Ethiopian clock starts at 6:00 AM (gregorian) = 12:00 (Ethiopian)
export function toEthiopianTime(gregorianHour: number, gregorianMinute: number): { hour: number; minute: number; period: string } {
  let ethHour = (gregorianHour + 6) % 12;
  if (ethHour === 0) ethHour = 12;
  const period = gregorianHour >= 6 && gregorianHour < 18 ? 'ቀን' : 'ምሽት';
  return { hour: ethHour, minute: gregorianMinute, period };
}

export function formatEthiopianTime(gregorianHour: number, gregorianMinute: number): string {
  const { hour, minute, period } = toEthiopianTime(gregorianHour, gregorianMinute);
  return `${hour}:${String(minute).padStart(2, '0')} ${period}`;
}

export function ethiopianToGregorianTime(ethHour: number, ethMinute: number, period: 'ቀን' | 'ምሽት'): { hour: number; minute: number } {
  let gregHour = 0;
  if (period === 'ቀን') {
    if (ethHour === 12) {
      gregHour = 6;
    } else {
      gregHour = ethHour + 6;
    }
  } else { // 'ምሽት'
    if (ethHour === 12) {
      gregHour = 18;
    } else if (ethHour < 6) {
      gregHour = ethHour + 18;
    } else { // 6 to 11
      gregHour = ethHour - 6;
    }
  }
  return { hour: gregHour, minute: ethMinute };
}

// ── Ethiopian Calendar (JDN Conversion) ───────
// Production-grade Gregorian to Ethiopian calendar conversion using Julian Day Numbers (JDN).
// Handles leap years and year boundaries accurately for all dates.
export const EthiopianMonths = [
  'መስከረም', 'ጥቅምት', 'ህዳር', 'ታህሳስ', 'ጥር', 'የካቲት',
  'መጋቢት', 'ሚያዚያ', 'ግንቦት', 'ሰኔ', 'ሐምሌ', 'ነሐሴ', 'ጳጉሜ',
];

export const EthiopianMonthsEn = [
  'Meskerem', 'Tikimt', 'Hidar', 'Tahsas', 'Tir', 'Yekatit',
  'Megabit', 'Miyazia', 'Ginbot', 'Sene', 'Hamle', 'Nehase', 'Pagume',
];

function gregorianToJDN(year: number, month: number, day: number): number {
  let y = year;
  let m = month;
  if (m <= 2) {
    y -= 1;
    m += 12;
  }
  const a = Math.floor(y / 100);
  const b = Math.floor(a / 4);
  const c = 2 - a + b;
  const e = Math.floor(365.25 * (y + 4716));
  const f = Math.floor(30.6001 * (m + 1));
  return c + day + e + f - 1524;
}

export function getEthiopianDate(gregorianDate: Date): { day: number; month: number; year: number } {
  const jdn = gregorianToJDN(gregorianDate.getFullYear(), gregorianDate.getMonth() + 1, gregorianDate.getDate());
  const r = (jdn - 1723856) % 1461;
  const n = r % 365 + 365 * Math.floor(r / 1460);
  const year = 4 * Math.floor((jdn - 1723856) / 1461) + Math.floor(r / 365) - Math.floor(r / 1460);
  const month = Math.floor(n / 30) + 1;
  const day = n % 30 + 1;
  return { day, month: Math.min(month, 13), year };
}

export function formatEthiopianDate(gregorianDate: Date, lang: 'en' | 'am' = 'am'): string {
  const { day, month, year } = getEthiopianDate(gregorianDate);
  if (lang === 'am') {
    const monthName = EthiopianMonths[month - 1] ?? '';
    return `${monthName} ${day} ቀን ${year} ዓ.ም`;
  } else {
    const monthName = EthiopianMonthsEn[month - 1] ?? '';
    return `${monthName} ${day}, ${year}`;
  }
}

// ── Week Helpers ─────────────────────────────
export function getLast7Days(): string[] {
  return Array.from({ length: 7 }, (_, i) => {
    const d = new Date();
    d.setDate(d.getDate() - i);
    return toISODateString(d);
  });
}

export function getLast84Days(): string[] {
  return Array.from({ length: 84 }, (_, i) => {
    const d = new Date();
    d.setDate(d.getDate() - i);
    return toISODateString(d);
  });
}

export function getDayName(dayIndex: number, lang: 'en' | 'am' = 'en'): string {
  const en = ['Sun', 'Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat'];
  const am = ['እሁድ', 'ሰኞ', 'ማክሰ', 'ረቡዕ', 'ሐሙስ', 'አርብ', 'ቅዳሜ'];
  return lang === 'am' ? (am[dayIndex] ?? '') : (en[dayIndex] ?? '');
}
