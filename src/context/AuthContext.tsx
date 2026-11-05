import React, { createContext, useContext, useEffect, useState, ReactNode } from 'react';
import { onAuthStateChanged, User as FbUser } from 'firebase/auth';
import { auth } from '../firebase/config';
import { getUserProfile, logoutUser } from '../services/authService';
import { getCreatorProfileByUserId, seedDemoDataIfEmpty } from '../services/creatorService';
import { User, CreatorProfile } from '../types';

interface AuthContextType {
  fbUser: FbUser | null;
  userProfile: User | null;
  creatorProfile: CreatorProfile | null;
  isAdmin: boolean;
  isSuspended: boolean;
  loading: boolean;
  refreshProfiles: () => Promise<void>;
  logout: () => Promise<void>;
}

const AuthContext = createContext<AuthContextType | undefined>(undefined);

export function AuthProvider({ children }: { children: ReactNode }) {
  const [fbUser, setFbUser] = useState<FbUser | null>(null);
  const [userProfile, setUserProfile] = useState<User | null>(null);
  const [creatorProfile, setCreatorProfile] = useState<CreatorProfile | null>(null);
  const [loading, setLoading] = useState(true);

  const fetchProfiles = async (user: FbUser | null) => {
    if (!user) {
      setUserProfile(null);
      setCreatorProfile(null);
      setLoading(false);
      return;
    }

    try {
      const uProf = await getUserProfile(user.uid);
      setUserProfile(uProf);

      const cProf = await getCreatorProfileByUserId(user.uid);
      setCreatorProfile(cProf);
    } catch (err) {
      console.error('Error fetching user profiles:', err);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    // Seed initial demo data once on first app load if database is empty
    seedDemoDataIfEmpty().catch(console.warn);

    const unsubscribe = onAuthStateChanged(auth, (user) => {
      setFbUser(user);
      fetchProfiles(user);
    });

    return () => unsubscribe();
  }, []);

  const refreshProfiles = async () => {
    if (fbUser) {
      await fetchProfiles(fbUser);
    }
  };

  const logout = async () => {
    await logoutUser();
    setFbUser(null);
    setUserProfile(null);
    setCreatorProfile(null);
  };

  const isAdmin =
    fbUser?.email === 'EmmybikeCEO@gmail.com' ||
    userProfile?.role === 'admin';

  const isSuspended = userProfile?.accountStatus === 'suspended';

  return (
    <AuthContext.Provider
      value={{
        fbUser,
        userProfile,
        creatorProfile,
        isAdmin,
        isSuspended,
        loading,
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
