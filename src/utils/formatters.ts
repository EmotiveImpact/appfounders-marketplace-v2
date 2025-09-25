/**
 * Format a duration in seconds to a human-readable string
 */
export function formatDuration(seconds: number): string {
  if (seconds === 0) return '0s';
  
  if (seconds < 60) {
    return `${seconds}s`;
  }
  
  const minutes = Math.floor(seconds / 60);
  const remainingSeconds = seconds % 60;
  
  if (minutes < 60) {
    return remainingSeconds > 0 
      ? `${minutes}m ${remainingSeconds}s` 
      : `${minutes}m`;
  }
  
  const hours = Math.floor(minutes / 60);
  const remainingMinutes = minutes % 60;
  
  if (remainingMinutes === 0 && remainingSeconds === 0) {
    return `${hours}h`;
  } else if (remainingSeconds === 0) {
    return `${hours}h ${remainingMinutes}m`;
  } else if (remainingMinutes === 0) {
    return `${hours}h ${remainingSeconds}s`;
  } else {
    return `${hours}h ${remainingMinutes}m ${remainingSeconds}s`;
  }
}

/**
 * Format a date string to a human-readable format
 */
export function formatDate(dateString: string): string {
  const date = new Date(dateString);
  return new Intl.DateTimeFormat('en-US', {
    year: 'numeric',
    month: 'short',
    day: 'numeric',
    hour: '2-digit',
    minute: '2-digit'
  }).format(date);
}

/**
 * Truncate text with ellipsis if it exceeds maxLength
 */
export function truncateText(text: string, maxLength: number): string {
  if (text.length <= maxLength) return text;
  return text.substring(0, maxLength) + '...';
}
