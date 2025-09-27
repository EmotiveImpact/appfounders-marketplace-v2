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

// Generate URL-friendly slug from app name
export function generateAppSlug(name: string): string {
  return name
    .toLowerCase()
    .replace(/[^a-z0-9\s-]/g, '') // Remove special characters
    .replace(/\s+/g, '-') // Replace spaces with hyphens
    .replace(/-+/g, '-') // Replace multiple hyphens with single hyphen
    .trim()
    .replace(/^-+|-+$/g, ''); // Remove leading/trailing hyphens
}

// Find app by slug
export function findAppBySlug(apps: any[], slug: string): any {
  return apps.find(app => generateAppSlug(app.name) === slug);
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
