/**
 * Authentication Context
 * Provides auth state and methods to the entire app.
 */

import {
  createContext,
  useContext,
  useState,
  useEffect,
  useCallback,
  ReactNode,
} from "react";
import type { User, Session } from "@supabase/supabase-js";
import * as authService from "../services/authService";
import { syncUser, getUserStats } from "../services/userSyncService";
import type { CreditInfo, UserBadge } from "../types";

interface AuthContextType {
  user: User | null;
  session: Session | null;
  isLoading: boolean;
  isAuthenticated: boolean;
  credits: CreditInfo | null;
  badge: UserBadge | null;
  creditsLoading: boolean;
  refreshCredits: () => Promise<void>;
  signIn: (
    email: string,
    password: string,
  ) => Promise<{ error: string | null }>;
  signUp: (
    email: string,
    password: string,
    fullName: string,
  ) => Promise<{ error: string | null; needsConfirmation: boolean }>;
  signInWithGoogle: () => Promise<{ error: string | null }>;
  signOut: () => Promise<void>;
}

const AuthContext = createContext<AuthContextType | undefined>(undefined);

export function AuthProvider({ children }: { children: ReactNode }) {
  const [user, setUser] = useState<User | null>(null);
  const [session, setSession] = useState<Session | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [credits, setCredits] = useState<CreditInfo | null>(null);
  const [badge, setBadge] = useState<UserBadge | null>(null);
  const [creditsLoading, setCreditsLoading] = useState(false);
  const [creditsFetched, setCreditsFetched] = useState(false);

  // Fetch credits from API - only fetches once per session
  const refreshCredits = useCallback(async () => {
    setCreditsLoading(true);
    try {
      const stats = await getUserStats();
      setCredits(stats.credits || null);
      setBadge(stats.badge || null);
      setCreditsFetched(true);
    } catch (error) {
      console.error("Failed to fetch credits:", error);
    } finally {
      setCreditsLoading(false);
    }
  }, []);

  useEffect(() => {
    // Get initial session
    authService.getSession().then(async (session) => {
      setSession(session);
      setUser(session?.user ?? null);
      setIsLoading(false);

      // Sync user to local database if logged in
      if (session?.user) {
        try {
          await syncUser();
        } catch {
          // Silent sync failure - non-critical
        }
      }
    });

    // Subscribe to auth changes
    const {
      data: { subscription },
    } = authService.onAuthStateChange(async (user, session) => {
      setUser(user);
      setSession(session);
      setIsLoading(false);

      // Sync user to local database when they log in
      if (user && session) {
        try {
          await syncUser();
        } catch {
          // Silent sync failure - non-critical
        }
      }
    });

    return () => {
      subscription.unsubscribe();
    };
  }, []);

  // Fetch credits ONCE when user logs in (not on every render)
  // Uses user.id to track identity changes, not the user object itself
  useEffect(() => {
    if (user && !creditsFetched) {
      refreshCredits();
    } else if (!user) {
      setCredits(null);
      setBadge(null);
      setCreditsFetched(false);
    }
  }, [user?.id]); // Only depend on user.id, not the whole user object

  const signIn = async (email: string, password: string) => {
    const result = await authService.signIn({ email, password });
    if (result.error) {
      return { error: result.error.message };
    }
    return { error: null };
  };

  const signUp = async (email: string, password: string, fullName: string) => {
    const result = await authService.signUp({ email, password, fullName });
    if (result.error) {
      return { error: result.error.message, needsConfirmation: false };
    }
    // If needsConfirmation is true, user was created but needs to confirm email
    if (result.needsConfirmation) {
      return { error: null, needsConfirmation: true };
    }
    return { error: null, needsConfirmation: false };
  };

  const signInWithGoogle = async () => {
    const result = await authService.signInWithGoogle();
    if (result.error) {
      return { error: result.error.message };
    }
    return { error: null };
  };

  const signOut = async () => {
    await authService.signOut();
    setUser(null);
    setSession(null);
    setCredits(null);
    setBadge(null);
  };

  return (
    <AuthContext.Provider
      value={{
        user,
        session,
        isLoading,
        isAuthenticated: !!user,
        credits,
        badge,
        creditsLoading,
        refreshCredits,
        signIn,
        signUp,
        signInWithGoogle,
        signOut,
      }}
    >
      {children}
    </AuthContext.Provider>
  );
}

export function useAuth() {
  const context = useContext(AuthContext);
  if (!context) {
    throw new Error("useAuth must be used within an AuthProvider");
  }
  return context;
}
