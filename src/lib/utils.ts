import { type ClassValue, clsx } from "clsx";
import { twMerge } from "tailwind-merge";
import { format } from "date-fns";

export function cn(...inputs: ClassValue[]) {
  return twMerge(clsx(inputs));
}

export function formatCurrency(amount: number): string {
  return new Intl.NumberFormat('en-US', {
    style: 'currency',
    currency: 'USD',
  }).format(amount);
}

export function formatDate(date: string | Date): string {
  return format(new Date(date), 'MMM d, yyyy');
}

export function truncateText(text: string, maxLength: number): string {
  if (text.length <= maxLength) return text;
  return text.slice(0, maxLength) + '...';
}

export function getAppTypeIcon(type: string): string {
  const types: Record<string, string> = {
    IOS: '📱',
    ANDROID: '🤖',
    WEB: '🌐',
    MAC: '💻',
    PC: '🖥️',
  };

  return types[type.toUpperCase()] || '📱';
}

export function isBrowser(): boolean {
  return typeof window !== 'undefined';
}
