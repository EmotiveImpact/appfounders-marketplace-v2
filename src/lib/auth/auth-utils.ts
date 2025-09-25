/**
 * Auth utilities for handling authentication-related functions
 */

// Helper function to check if we're in a browser environment
const isBrowser = () => typeof window !== 'undefined';

/**
 * Sets authentication cookies for middleware compatibility
 * @param user User object to store in cookies
 */
export function setAuthCookies(user: any): void {
  if (!isBrowser()) return;
  
  try {
    // Set the auth cookie with the user data
    document.cookie = `auth-user=${encodeURIComponent(JSON.stringify({
      id: user.id,
      email: user.email,
      name: user.name,
      role: user.role
    }))}; path=/; max-age=86400; SameSite=Lax`;
    
    // For development environment, we might also want to store in localStorage
    localStorage.setItem('mock-auth-user', JSON.stringify(user));
    
    // Trigger a storage event for any listeners
    window.dispatchEvent(new Event('storage'));
  } catch (error) {
    console.error('Error setting auth cookies:', error);
  }
}

/**
 * Clears all authentication cookies and storage
 */
export function clearAuthCookies(): void {
  if (!isBrowser()) return;
  
  try {
    // Remove the auth cookie
    document.cookie = 'auth-user=; path=/; expires=Thu, 01 Jan 1970 00:00:00 GMT; SameSite=Lax';
    
    // Remove from localStorage
    localStorage.removeItem('mock-auth-user');
    
    // Trigger a storage event for any listeners
    window.dispatchEvent(new Event('storage'));
  } catch (error) {
    console.error('Error clearing auth cookies:', error);
  }
}

/**
 * Gets the current user from cookies if available
 * @returns User object or null if not authenticated
 */
export function getUserFromCookies(): any | null {
  if (!isBrowser()) return null;
  
  try {
    // Get the auth cookie
    const cookies = document.cookie.split(';');
    const authCookie = cookies.find(cookie => cookie.trim().startsWith('auth-user='));
    
    if (!authCookie) return null;
    
    // Parse the user from the cookie
    const cookieValue = authCookie.split('=')[1];
    return JSON.parse(decodeURIComponent(cookieValue));
  } catch (error) {
    console.error('Error getting user from cookies:', error);
    return null;
  }
}
