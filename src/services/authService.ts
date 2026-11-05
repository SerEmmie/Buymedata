import {
  createUserWithEmailAndPassword,
  signInWithEmailAndPassword,
  signInWithPopup,
  GoogleAuthProvider,
  signOut as fbSignOut,
  sendPasswordResetEmail,
  User as FbUser,
} from 'firebase/auth';
import { doc, getDoc, setDoc, updateDoc } from 'firebase/firestore';
import { auth, db } from '../firebase/config';
import { handleFirestoreError, OperationType } from '../firebase/errors';
import { User, UserRole } from '../types';

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

  // Check admin override for bootstrapped administrator
  const finalRole: UserRole = fbUser.email === 'EmmybikeCEO@gmail.com' ? 'admin' : (role === 'admin' ? 'creator' : role);

  const newUser: User = {
    uid: fbUser.uid,
    fullName,
    email: fbUser.email || email,
    username: username.toLowerCase().trim(),
    role: finalRole,
    accountStatus: 'active',
    emailVerified: fbUser.emailVerified,
    createdAt: new Date().toISOString(),
    updatedAt: new Date().toISOString(),
  };

  try {
    await setDoc(doc(db, 'users', fbUser.uid), newUser);
  } catch (err) {
    handleFirestoreError(err, OperationType.CREATE, `users/${fbUser.uid}`);
  }

  return newUser;
}

export async function loginWithEmail(email: string, password: string): Promise<FbUser> {
  const cred = await signInWithEmailAndPassword(auth, email, password);
  return cred.user;
}

export async function loginWithGoogle(): Promise<{ fbUser: FbUser; isNew: boolean }> {
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
    const cleanUsername = (fbUser.email?.split('@')[0] || `user_${Date.now()}`)
      .toLowerCase()
      .replace(/[^a-z0-9_]/g, '')
      .slice(0, 30);

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
    } catch (err) {
      handleFirestoreError(err, OperationType.CREATE, `users/${fbUser.uid}`);
    }

    return { fbUser, isNew: true };
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
