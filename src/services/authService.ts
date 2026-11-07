import {
  createUserWithEmailAndPassword,
  signInWithEmailAndPassword,
  signInWithPopup,
  GoogleAuthProvider,
  signOut as fbSignOut,
  sendPasswordResetEmail,
  sendSignInLinkToEmail,
  isSignInWithEmailLink,
  signInWithEmailLink,
  User as FbUser,
} from 'firebase/auth';
import { doc, getDoc, setDoc, updateDoc } from 'firebase/firestore';
import { auth, db } from '../firebase/config';
import { handleFirestoreError, OperationType } from '../firebase/errors';
import { User, UserRole, CreatorProfile } from '../types';
import { saveCreatorProfile, getCreatorProfileByUserId } from './creatorService';

const googleProvider = new GoogleAuthProvider();

export async function registerWithEmail(
  fullName: string,
  email: string,
  password: string,
  username: string,
  role: UserRole = 'creator'
): Promise<User> {
  const cred = await createUserWithEmailAndPassword(auth, email, password);
  const fbUser = cred.user;
  const cleanUsername = username.toLowerCase().trim().replace(/^@/, '');

  // Check admin override for bootstrapped administrator
  const finalRole: UserRole = fbUser.email === 'EmmybikeCEO@gmail.com' ? 'admin' : (role === 'admin' ? 'creator' : role);

  const newUser: User = {
    uid: fbUser.uid,
    fullName,
    email: fbUser.email || email,
    username: cleanUsername,
    role: finalRole,
    accountStatus: 'active',
    emailVerified: fbUser.emailVerified,
    createdAt: new Date().toISOString(),
    updatedAt: new Date().toISOString(),
  };

  try {
    await setDoc(doc(db, 'users', fbUser.uid), newUser);
    
    // Automatically initialize Creator Profile so their page is live and they can go straight to the dashboard
    if (finalRole === 'creator' || finalRole === 'admin') {
      await saveCreatorProfile({
        userId: fbUser.uid,
        displayName: fullName || 'Creator',
        username: cleanUsername,
        published: true,
        theme: 'crimson',
      }).catch(console.warn);
    }
  } catch (err) {
    handleFirestoreError(err, OperationType.CREATE, `users/${fbUser.uid}`);
  }

  return newUser;
}

export async function loginWithEmail(email: string, password: string): Promise<FbUser> {
  const cred = await signInWithEmailAndPassword(auth, email, password);
  return cred.user;
}

/**
 * Sends a passwordless one-time authentication link to the user's email.
 */
export async function sendOneTimeEmailLink(email: string): Promise<void> {
  const actionCodeSettings = {
    url: `${window.location.origin}/auth/login?emailLink=true`,
    handleCodeInApp: true,
  };
  await sendSignInLinkToEmail(auth, email, actionCodeSettings);
  window.localStorage.setItem('buymedata_email_for_link', email);
}

/**
 * Completes sign-in with the one-time email link.
 */
export async function completeEmailLinkSignIn(
  email: string,
  claimedUsername?: string
): Promise<{ fbUser: FbUser; isNew: boolean }> {
  if (!isSignInWithEmailLink(auth, window.location.href)) {
    throw new Error('Invalid or expired email sign-in link.');
  }

  const cred = await signInWithEmailLink(auth, email, window.location.href);
  const fbUser = cred.user;
  window.localStorage.removeItem('buymedata_email_for_link');

  const userDocRef = doc(db, 'users', fbUser.uid);
  let userSnap;
  try {
    userSnap = await getDoc(userDocRef);
  } catch (err) {
    handleFirestoreError(err, OperationType.GET, `users/${fbUser.uid}`);
  }

  if (!userSnap.exists()) {
    const rawName = fbUser.displayName || email.split('@')[0];
    const cleanUsername = (claimedUsername || email.split('@')[0] || `user_${Date.now()}`)
      .toLowerCase()
      .trim()
      .replace(/[^a-z0-9_]/g, '')
      .slice(0, 30);

    const finalRole: UserRole = fbUser.email === 'EmmybikeCEO@gmail.com' ? 'admin' : 'creator';

    const newUser: User = {
      uid: fbUser.uid,
      fullName: rawName,
      email: fbUser.email || email,
      username: cleanUsername,
      role: finalRole,
      accountStatus: 'active',
      emailVerified: true,
      createdAt: new Date().toISOString(),
      updatedAt: new Date().toISOString(),
    };

    await setDoc(userDocRef, newUser);

    // Initialize Creator Profile immediately
    await saveCreatorProfile({
      userId: fbUser.uid,
      displayName: rawName,
      username: cleanUsername,
      published: true,
      theme: 'crimson',
    }).catch(console.warn);

    return { fbUser, isNew: true };
  }

  return { fbUser, isNew: false };
}

export async function loginWithGoogle(claimedUsername?: string): Promise<{ fbUser: FbUser; isNew: boolean }> {
  const cred = await signInWithPopup(auth, googleProvider);
  const fbUser = cred.user;

  // Check if profile exists in users collection
  const userDocRef = doc(db, 'users', fbUser.uid);
  let userSnap;
  try {
    userSnap = await getDoc(userDocRef);
  } catch (err) {
    handleFirestoreError(err, OperationType.GET, `users/${fbUser.uid}`);
  }

  if (!userSnap.exists()) {
    const rawName = fbUser.displayName || 'Creator';
    const fallbackUsername = (fbUser.email?.split('@')[0] || `user_${Date.now()}`)
      .toLowerCase()
      .replace(/[^a-z0-9_]/g, '')
      .slice(0, 30);

    const cleanUsername = (claimedUsername || fallbackUsername).toLowerCase().trim().replace(/^@/, '');
    const finalRole: UserRole = fbUser.email === 'EmmybikeCEO@gmail.com' ? 'admin' : 'creator';

    const newUser: User = {
      uid: fbUser.uid,
      fullName: rawName,
      email: fbUser.email || '',
      username: cleanUsername,
      role: finalRole,
      accountStatus: 'active',
      emailVerified: fbUser.emailVerified,
      createdAt: new Date().toISOString(),
      updatedAt: new Date().toISOString(),
    };

    try {
      await setDoc(userDocRef, newUser);

      // Automatically initialize Creator Profile so their page is live and they can go straight to the dashboard
      await saveCreatorProfile({
        userId: fbUser.uid,
        displayName: rawName,
        username: cleanUsername,
        profileImage: fbUser.photoURL || undefined,
        published: true,
        theme: 'crimson',
      }).catch(console.warn);
    } catch (err) {
      handleFirestoreError(err, OperationType.CREATE, `users/${fbUser.uid}`);
    }

    return { fbUser, isNew: true };
  } else {
    // If existing user already has a user doc, make sure creator profile is also ensured
    const existingProfile = await getCreatorProfileByUserId(fbUser.uid);
    if (!existingProfile) {
      const uData = userSnap.data() as User;
      await saveCreatorProfile({
        userId: fbUser.uid,
        displayName: uData.fullName || fbUser.displayName || 'Creator',
        username: uData.username || claimedUsername || fbUser.email?.split('@')[0] || `user_${Date.now()}`,
        profileImage: fbUser.photoURL || undefined,
        published: true,
        theme: 'crimson',
      }).catch(console.warn);
    }
  }

  return { fbUser, isNew: false };
}

export async function getUserProfile(uid: string): Promise<User | null> {
  try {
    const snap = await getDoc(doc(db, 'users', uid));
    if (snap.exists()) {
      return snap.data() as User;
    }
    return null;
  } catch (err) {
    console.error('Failed to get user profile:', err);
    return null;
  }
}

export async function resetPassword(email: string): Promise<void> {
  await sendPasswordResetEmail(auth, email);
}

export async function logoutUser(): Promise<void> {
  await fbSignOut(auth);
}
