const defaultOptions: Intl.DateTimeFormatOptions = {
  year: 'numeric',
  month: 'long',
  day: 'numeric',
  timeZone: 'UTC'
};

const dateFormatter = new Intl.DateTimeFormat('en-US', defaultOptions);

export function getFormattedDate(date: Date | string): string {
  if (!date) return '';

  try {
    let dateObj: Date;
    if (date instanceof Date) {
      // If it's already a Date object, use it directly
      dateObj = date;
    } else if (typeof date === 'string' && /^\d{4}-\d{2}-\d{2}$/.test(date)) {
      // For date-only strings (YYYY-MM-DD), treat as local date not UTC
      const [year, month, day] = date.split('-').map(Number);
      dateObj = new Date(year, month - 1, day);
    } else {
      dateObj = new Date(date);
    }
    return dateFormatter.format(dateObj);
  } catch (e) {
    return new Date(date).toISOString().split('T')[0];
  }
}

export function formatDate(date: Date | string): string {
  return getFormattedDate(date);
}

export function formatDateTime(date: Date | string): string {
  if (!date) return '';
  const dateObj = date instanceof Date ? date : new Date(date);
  return dateObj.toLocaleString('en-US');
}

export function sortMDByDate(posts: any[]): any[] {
  return posts.sort((a, b) => {
    const aDate = new Date(a.data.publishDate);
    const bDate = new Date(b.data.publishDate);
    return bDate.getTime() - aDate.getTime();
  });
}

export function getYear(date: Date | string): number {
  const dateObj = date instanceof Date ? date : new Date(date);
  return dateObj.getFullYear();
}