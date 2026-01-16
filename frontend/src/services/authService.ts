/**
 * Authentication Service
 * Handles user authentication via Supabase Auth.
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
}

/**
 * Sign up a new user with email and password.
 */
export async function signUp({ email, password }: AuthCredentials): Promise<AuthResult> {
  const { data, error } = await supabase.auth.signUp({
    email,
    password,
  });

  return {
    user: data.user,
    session: data.session,
    error,
  };
}

/**
 * Sign in an existing user with email and password.
 */
export async function signIn({ email, password }: AuthCredentials): Promise<AuthResult> {
  const { data, error } = await supabase.auth.signInWithPassword({
    email,
    password,
  });

  return {
    user: data.user,
    session: data.session,
    error,
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
