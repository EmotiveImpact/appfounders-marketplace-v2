// Mock user roles for development
export type UserRole = 'admin' | 'developer' | 'tester' | 'guest';

interface User {
  id: string;
  name: string;
  email: string;
  role: UserRole;
}

// Mock current user for development
let currentUser: User | null = {
  id: '1',
  name: 'John Doe',
  email: 'john@example.com',
  role: 'developer'
};

// Check if user is authenticated
export const isAuthenticated = (): boolean => {
  return !!currentUser;
};

// Get current user
export const getCurrentUser = (): User | null => {
  return currentUser;
};

// Set current user (for testing)
export const setCurrentUser = (user: User | null): void => {
  currentUser = user;
};

// Check if user has a specific role
export const hasRole = (role: UserRole): boolean => {
  if (!currentUser) return false;
  
  // Super admin has access to everything
  if (currentUser.role === 'admin') return true;
  
  return currentUser.role === role;
};

// Check if user has permission to create blog posts
export const canCreateBlog = (): boolean => {
  if (!currentUser) return false;
  
  // Only admins and developers can create blogs
  return ['admin', 'developer'].includes(currentUser.role);
};

// Check if user has permission to edit blog posts
export const canEditBlog = (authorId: string): boolean => {
  if (!currentUser) return false;
  
  // Admins can edit any blog
  if (currentUser.role === 'admin') return true;
  
  // Users can only edit their own blogs
  return currentUser.id === authorId;
};
