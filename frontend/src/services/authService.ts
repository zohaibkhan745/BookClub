/**
 * Authentication Service
 * Handles user authentication via Supabase Auth.
 * Provides consistent, frontend-friendly error responses.
 */

import { supabase } from '../lib/supabase';
import type { User, Session, AuthError } from '@supabase/supabase-js';

export interface AuthResult {
  user: User | null;
  session: Session | null;
  error: AuthError | null;
}

export interface AuthCredentials {
  email: string;
  password: string;
  fullName?: string;
}

/**
 * Standard error codes for authentication operations.
 */
export const AUTH_ERROR_CODES = {
  EMAIL_EXISTS: 'EMAIL_EXISTS',
  INVALID_CREDENTIALS: 'INVALID_CREDENTIALS',
  USER_NOT_FOUND: 'USER_NOT_FOUND',
  WEAK_PASSWORD: 'WEAK_PASSWORD',
  INVALID_EMAIL: 'INVALID_EMAIL',
  NETWORK_ERROR: 'NETWORK_ERROR',
  UNKNOWN_ERROR: 'UNKNOWN_ERROR',
} as const;

export interface FormattedAuthError {
  code: keyof typeof AUTH_ERROR_CODES;
  message: string;
  field?: 'email' | 'password';
}

/**
 * Parse Supabase auth errors into consistent, frontend-friendly format.
 */
function formatAuthError(error: AuthError): FormattedAuthError {
  const errorMessage = error.message.toLowerCase();

  // Email already registered (409 Conflict equivalent)
  if (errorMessage.includes('user already registered') || 
      errorMessage.includes('email already in use')) {
    return {
      code: 'EMAIL_EXISTS',
      message: 'An account with this email already exists. Please sign in instead.',
      field: 'email',
    };
  }

  // Invalid login credentials (user doesn't exist or wrong password)
  if (errorMessage.includes('invalid login credentials') ||
      errorMessage.includes('invalid credentials')) {
    return {
      code: 'INVALID_CREDENTIALS',
      message: 'Invalid email or password. Please check your credentials and try again.',
    };
  }

  // User not found
  if (errorMessage.includes('user not found')) {
    return {
      code: 'USER_NOT_FOUND',
      message: 'No account found with this email. Please sign up first.',
      field: 'email',
    };
  }

  // Weak password
  if (errorMessage.includes('password') && 
      (errorMessage.includes('weak') || errorMessage.includes('at least'))) {
    return {
      code: 'WEAK_PASSWORD',
      message: 'Password must be at least 6 characters long.',
      field: 'password',
    };
  }

  // Invalid email format
  if (errorMessage.includes('invalid email') || errorMessage.includes('email format')) {
    return {
      code: 'INVALID_EMAIL',
      message: 'Please enter a valid email address.',
      field: 'email',
    };
  }

  // Network error
  if (errorMessage.includes('network') || errorMessage.includes('fetch')) {
    return {
      code: 'NETWORK_ERROR',
      message: 'Unable to connect. Please check your internet connection.',
    };
  }

  // Default fallback
  return {
    code: 'UNKNOWN_ERROR',
    message: error.message || 'An unexpected error occurred. Please try again.',
  };
}

/**
 * Sign up a new user with email and password.
 * 
 * Error Handling:
 * - EMAIL_EXISTS: Email already registered (409 equivalent)
 * - WEAK_PASSWORD: Password doesn't meet requirements
 * - INVALID_EMAIL: Email format is invalid
 * 
 * Note: Supabase handles email uniqueness at the database level,
 * ensuring no duplicate accounts can be created.
 */
export async function signUp({ email, password, fullName }: AuthCredentials): Promise<AuthResult & { formattedError?: FormattedAuthError; needsConfirmation?: boolean }> {
  const { data, error } = await supabase.auth.signUp({
    email,
    password,
    options: {
      data: {
        full_name: fullName || '',
      },
    },
  });

  // Check if email confirmation is required
  // When confirmation is required: user exists but session is null and no error
  const needsConfirmation = !error && data.user && !data.session ? true : undefined;

  return {
    user: data.user,
    session: data.session,
    error,
    formattedError: error ? formatAuthError(error) : undefined,
    needsConfirmation,
  };
}

/**
 * Sign in an existing user with email and password.
 * 
 * Security Note: Supabase verifies user existence before password validation
 * internally, but returns generic "Invalid credentials" to prevent user enumeration.
 * 
 * Error Handling:
 * - INVALID_CREDENTIALS: Wrong email or password
 * - NETWORK_ERROR: Connection issues
 */
export async function signIn({ email, password }: AuthCredentials): Promise<AuthResult & { formattedError?: FormattedAuthError }> {
  const { data, error } = await supabase.auth.signInWithPassword({
    email,
    password,
  });

  return {
    user: data.user,
    session: data.session,
    error,
    formattedError: error ? formatAuthError(error) : undefined,
  };
}

/**
 * Sign out the current user.
 */
export async function signOut(): Promise<{ error: AuthError | null }> {
  const { error } = await supabase.auth.signOut();
  return { error };
}

/**
 * Get the current session.
 */
export async function getSession(): Promise<Session | null> {
  const { data } = await supabase.auth.getSession();
  return data.session;
}

/**
 * Get the current user.
 */
export async function getCurrentUser(): Promise<User | null> {
  const { data } = await supabase.auth.getUser();
  return data.user;
}

/**
 * Get the current access token for API calls.
 */
export async function getAccessToken(): Promise<string | null> {
  const session = await getSession();
  return session?.access_token ?? null;
}

/**
 * Subscribe to auth state changes.
 */
export function onAuthStateChange(
  callback: (user: User | null, session: Session | null) => void
) {
  return supabase.auth.onAuthStateChange((_event, session) => {
    callback(session?.user ?? null, session);
  });
}
