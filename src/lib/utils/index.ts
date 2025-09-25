// Re-export all utilities from utils.ts
export * from '../utils';

// Additional browser utility
export function isBrowser(): boolean {
  return typeof window !== 'undefined';
}
