import bcrypt from 'bcryptjs';
import { db } from '@/lib/database/neon-client';

export interface User {
  id: string;
  email: string;
  name: string;
  role: string;
  avatar_url?: string;
  created_at: string;
  updated_at: string;
}

export interface CreateUserData {
  email: string;
  password: string;
  name: string;
  role: 'developer' | 'tester' | 'admin';
}

export interface SignInData {
  email: string;
  password: string;
}

// Hash password
export async function hashPassword(password: string): Promise<string> {
  const saltRounds = 12;
  return await bcrypt.hash(password, saltRounds);
}

// Verify password
export async function verifyPassword(password: string, hashedPassword: string): Promise<boolean> {
  return await bcrypt.compare(password, hashedPassword);
}

// Create new user
export async function createUser(userData: CreateUserData): Promise<User> {
  const { email, password, name, role } = userData;

  // Check if user already exists
  const existingUser = await db.getUserByEmail(email);
  if (existingUser) {
    throw new Error('User with this email already exists');
  }

  // Validate email format
  const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
  if (!emailRegex.test(email)) {
    throw new Error('Invalid email format');
  }

  // Validate password strength
  if (password.length < 8) {
    throw new Error('Password must be at least 8 characters long');
  }

  // Validate role
  if (!['developer', 'tester', 'admin'].includes(role)) {
    throw new Error('Invalid role specified');
  }

  // Hash password
  const passwordHash = await hashPassword(password);

  // Create user in database
  const newUser = await db.createUser({
    email,
    name,
    role,
    passwordHash,
  });

  // Return user without password hash
  const { password_hash, ...userWithoutPassword } = newUser as any;
  return userWithoutPassword;
}

// Sign in user
export async function signInUser(signInData: SignInData): Promise<User> {
  const { email, password } = signInData;

  // Get user from database
  const user = await db.getUserByEmail(email);
  if (!user) {
    throw new Error('Invalid email or password');
  }

  // Verify password
  const isValidPassword = await verifyPassword(password, user.password_hash);
  if (!isValidPassword) {
    throw new Error('Invalid email or password');
  }

  // Return user without password hash
  const { password_hash, ...userWithoutPassword } = user;
  return userWithoutPassword;
}

// Get user by ID
export async function getUserById(id: string): Promise<User | null> {
  return await db.getUserById(id);
}

// Update user
export async function updateUser(
  id: string, 
  updates: Partial<Pick<User, 'name' | 'avatar_url' | 'role'>>
): Promise<User> {
  return await db.updateUser(id, updates);
}

// Change password
export async function changePassword(
  userId: string, 
  currentPassword: string, 
  newPassword: string
): Promise<void> {
  // Get user with password hash
  const user = await db.getUserByEmail((await db.getUserById(userId))?.email || '');
  if (!user) {
    throw new Error('User not found');
  }

  // Verify current password
  const isValidPassword = await verifyPassword(currentPassword, user.password_hash);
  if (!isValidPassword) {
    throw new Error('Current password is incorrect');
  }

  // Validate new password
  if (newPassword.length < 8) {
    throw new Error('New password must be at least 8 characters long');
  }

  // Hash new password
  const newPasswordHash = await hashPassword(newPassword);

  // Update password in database
  await db.sql`
    UPDATE users 
    SET password_hash = ${newPasswordHash}, updated_at = NOW()
    WHERE id = ${userId}
  `;
}

// Email verification (placeholder for future implementation)
export async function sendVerificationEmail(email: string): Promise<void> {
  // TODO: Implement email verification with SendGrid/Resend
  console.log(`Verification email would be sent to: ${email}`);
}

// Password reset (placeholder for future implementation)
export async function sendPasswordResetEmail(email: string): Promise<void> {
  // TODO: Implement password reset with SendGrid/Resend
  console.log(`Password reset email would be sent to: ${email}`);
}

// Validate user session (for middleware)
export async function validateUserSession(userId: string): Promise<User | null> {
  try {
    return await getUserById(userId);
  } catch (error) {
    console.error('Session validation error:', error);
    return null;
  }
}
