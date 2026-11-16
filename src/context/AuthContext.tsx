import React, { createContext, useContext, useEffect, useState, ReactNode, useCallback } from 'react';
import { Session, User as SupabaseUser } from '@supabase/supabase-js';
import { supabase, isSupabaseConfigured } from '../lib/supabaseClient';
import {
  AuthUser,
  ensureUserAndCreatorProfile,
  logoutUser,
  mapSupabaseUser,
} from '../services/authService';
import { getCreatorProfileByUserId, seedDemoDataIfEmpty } from '../services/creatorService';
import { User, CreatorProfile } from '../types';

interface AuthContextType {
  authUser: AuthUser | null;
  fbUser: AuthUser | null; // Alias preserved for seamless compatibility across views
  session: Session | null;
  userProfile: User | null;
  creatorProfile: CreatorProfile | null;
  isAdmin: boolean;
  isSuspended: boolean;
  loading: boolean;
  authError: string | null;
  refreshProfiles: () => Promise<void>;
  logout: () => Promise<void>;
}

const AuthContext = createContext<AuthContextType | undefined>(undefined);

export function AuthProvider({ children }: { children: ReactNode }) {
  const [session, setSession] = useState<Session | null>(null);
  const [authUser, setAuthUser] = useState<AuthUser | null>(null);
  const [userProfile, setUserProfile] = useState<User | null>(null);
  const [creatorProfile, setCreatorProfile] = useState<CreatorProfile | null>(null);
  const [authError, setAuthError] = useState<string | null>(null);
  const [loading, setLoading] = useState(true);

  const syncUserProfiles = useCallback(async (su: SupabaseUser | null) => {
    if (!su) {
      setAuthUser(null);
      setUserProfile(null);
      setCreatorProfile(null);
      setAuthError(null);
      setLoading(false);
      return;
    }

    setAuthUser(mapSupabaseUser(su));

    try {
      const uProf = await ensureUserAndCreatorProfile(su);
      setUserProfile(uProf);

      const cProf = await getCreatorProfileByUserId(su.id);
      setCreatorProfile(cProf);
      setAuthError(null);
    } catch (err) {
      console.error('Error syncing Supabase user profiles:', err);
      setAuthError(err instanceof Error ? err.message : 'Unable to load creator profile.');
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    let isMounted = true;

    seedDemoDataIfEmpty().catch(console.warn);

    if (!isSupabaseConfigured()) {
      setLoading(false);
      return;
    }

    // Hydrate existing session on mount (handles browser refresh & OAuth/Magic Link redirects)
    supabase.auth
      .getSession()
      .then(({ data, error }) => {
        if (!isMounted) return;
        if (error) {
          console.error('Supabase session restore error:', error.message);
          setAuthError(error.message);
          setLoading(false);
          return;
        }
        setSession(data.session);
        syncUserProfiles(data.session?.user ?? null);
      })
      .catch((err) => {
        if (!isMounted) return;
        console.error('Unexpected Supabase session error:', err);
        setLoading(false);
      });

    // Subscribe to real-time auth events (sign in, token refresh, sign out)
    const {
      data: { subscription },
    } = supabase.auth.onAuthStateChange((_event, nextSession) => {
      if (!isMounted) return;
      setSession(nextSession);
      syncUserProfiles(nextSession?.user ?? null);
    });

    return () => {
      isMounted = false;
      subscription.unsubscribe();
    };
  }, [syncUserProfiles]);

  const refreshProfiles = async () => {
    if (!isSupabaseConfigured()) return;
    const { data } = await supabase.auth.getUser();
    if (data.user) {
      await syncUserProfiles(data.user);
    }
  };

  const logout = async () => {
    await logoutUser();
    setSession(null);
    setAuthUser(null);
    setUserProfile(null);
    setCreatorProfile(null);
  };

  const isAdmin =
    authUser?.email === 'EmmybikeCEO@gmail.com' || userProfile?.role === 'admin';

  const isSuspended = userProfile?.accountStatus === 'suspended';

  return (
    <AuthContext.Provider
      value={{
        authUser,
        fbUser: authUser,
        session,
        userProfile,
        creatorProfile,
        isAdmin,
        isSuspended,
        loading,
        authError,
        refreshProfiles,
        logout,
      }}
    >
      {children}
    </AuthContext.Provider>
  );
}

export function useAuth() {
  const context = useContext(AuthContext);
  if (!context) {
    throw new Error('useAuth must be used within an AuthProvider');
  }
  return context;
}
