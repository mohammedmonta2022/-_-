import { initializeApp, getApps, getApp } from 'firebase/app';
import {
  getFirestore,
  collection,
  doc,
  setDoc,
  getDocs,
  query,
  where,
  deleteDoc,
} from 'firebase/firestore';
import {
  getAuth,
  signInWithPopup,
  GoogleAuthProvider,
  onAuthStateChanged,
  type User,
} from 'firebase/auth';
import type { UserAccount, VerificationCodeRecord } from '../types';
import firebaseConfig from '../../firebase-applet-config.json';

// Initialize Firebase App safely
const app = !getApps().length ? initializeApp(firebaseConfig) : getApp();
export const db = getFirestore(app);
export const auth = getAuth(app);

// Google Provider with Gmail Send scope
const provider = new GoogleAuthProvider();
provider.addScope('https://www.googleapis.com/auth/gmail.send');

// In-memory token cache (never stored in localStorage per security guidelines)
let cachedAccessToken: string | null = null;
let isSigningIn = false;

/**
 * Initialize Auth State Listener
 */
export const initAuth = (
  onAuthSuccess?: (user: User, token: string) => void,
  onAuthFailure?: () => void
) => {
  return onAuthStateChanged(auth, async (user: User | null) => {
    if (user) {
      if (cachedAccessToken) {
        if (onAuthSuccess) onAuthSuccess(user, cachedAccessToken);
      } else if (!isSigningIn) {
        cachedAccessToken = null;
        if (onAuthFailure) onAuthFailure();
      }
    } else {
      cachedAccessToken = null;
      if (onAuthFailure) onAuthFailure();
    }
  });
};

/**
 * Connect or sign in via Google to acquire Gmail send access token
 */
export const googleSignIn = async (): Promise<{ user: User; accessToken: string } | null> => {
  try {
    isSigningIn = true;
    const result = await signInWithPopup(auth, provider);
    const credential = GoogleAuthProvider.credentialFromResult(result);
    if (!credential?.accessToken) {
      throw new Error('تعذر استخراج رمز التفويض من Google');
    }

    cachedAccessToken = credential.accessToken;
    return { user: result.user, accessToken: cachedAccessToken };
  } catch (error) {
    console.error('Sign in / OAuth error:', error);
    throw error;
  } finally {
    isSigningIn = false;
  }
};

/**
 * Get current in-memory access token
 */
export const getAccessToken = (): string | null => {
  return cachedAccessToken;
};

/**
 * Logout from Firebase Auth
 */
export const logoutAuth = async () => {
  await auth.signOut();
  cachedAccessToken = null;
};

// Collections
const USERS_COLLECTION = 'users';
const VERIFICATION_COLLECTION = 'verification_codes';

// Local storage cache keys for instant responsiveness and resilience
const LOCAL_USERS_KEY = 'azm_users_store_v1';
const LOCAL_CODES_KEY = 'azm_codes_store_v1';

function getLocalUsers(): UserAccount[] {
  try {
    const raw = localStorage.getItem(LOCAL_USERS_KEY);
    return raw ? JSON.parse(raw) : [];
  } catch {
    return [];
  }
}

function saveLocalUsers(users: UserAccount[]): void {
  try {
    localStorage.setItem(LOCAL_USERS_KEY, JSON.stringify(users));
  } catch {
    // Ignore quota errors
  }
}

function getLocalCodes(): VerificationCodeRecord[] {
  try {
    const raw = localStorage.getItem(LOCAL_CODES_KEY);
    return raw ? JSON.parse(raw) : [];
  } catch {
    return [];
  }
}

function saveLocalCodes(codes: VerificationCodeRecord[]): void {
  try {
    localStorage.setItem(LOCAL_CODES_KEY, JSON.stringify(codes));
  } catch {
    // Ignore quota errors
  }
}

/**
 * Executes a promise with an automatic timeout to prevent the UI from freezing
 */
async function withTimeout<T>(promise: Promise<T>, ms: number, fallback: T): Promise<T> {
  let timer: ReturnType<typeof setTimeout>;
  const timeoutPromise = new Promise<T>((resolve) => {
    timer = setTimeout(() => resolve(fallback), ms);
  });
  try {
    const result = await Promise.race([promise, timeoutPromise]);
    clearTimeout(timer!);
    return result;
  } catch {
    clearTimeout(timer!);
    return fallback;
  }
}

/**
 * Save user to Firestore and Local Cache
 */
export async function createUserAccount(user: Omit<UserAccount, 'id'>): Promise<string> {
  const cleanEmail = user.email.toLowerCase().trim();
  const cleanUsername = user.username.trim();
  const id = `user_${Date.now()}_${Math.random().toString(36).substring(2, 7)}`;

  const newUserData: UserAccount = {
    ...user,
    id,
    email: cleanEmail,
    username: cleanUsername,
  };

  // 1. Immediately cache locally
  const currentUsers = getLocalUsers();
  const filtered = currentUsers.filter(
    (u) => u.email !== cleanEmail && u.username.toLowerCase() !== cleanUsername.toLowerCase()
  );
  filtered.push(newUserData);
  saveLocalUsers(filtered);

  // 2. Persist to Firestore with timeout
  try {
    const userRef = doc(collection(db, USERS_COLLECTION), id);
    await withTimeout(setDoc(userRef, newUserData), 3000, null);
  } catch (err) {
    console.info('Cloud sync deferred, saved locally');
  }

  return id;
}

/**
 * Find user by either username or email with instant fallback
 */
export async function findUser(identifier: string): Promise<UserAccount | null> {
  const cleanId = identifier.trim();
  const lower = cleanId.toLowerCase();

  // 1. Check local cache first for instant response
  const localUsers = getLocalUsers();
  const localMatch = localUsers.find(
    (u) => u.email.toLowerCase() === lower || u.username.toLowerCase() === lower
  );

  // 2. Attempt Firestore query with 2500ms timeout
  const firestoreQuery = async (): Promise<UserAccount | null> => {
    try {
      // Try email
      const qEmail = query(
        collection(db, USERS_COLLECTION),
        where('email', '==', lower)
      );
      const emailSnap = await getDocs(qEmail);
      if (!emailSnap.empty) {
        const d = emailSnap.docs[0];
        const account = { id: d.id, ...d.data() } as UserAccount;
        // Sync local cache
        const all = getLocalUsers().filter((u) => u.email !== account.email);
        all.push(account);
        saveLocalUsers(all);
        return account;
      }

      // Try username
      const qUser = query(
        collection(db, USERS_COLLECTION),
        where('username', '==', cleanId)
      );
      const userSnap = await getDocs(qUser);
      if (!userSnap.empty) {
        const d = userSnap.docs[0];
        const account = { id: d.id, ...d.data() } as UserAccount;
        const all = getLocalUsers().filter((u) => u.username !== account.username);
        all.push(account);
        saveLocalUsers(all);
        return account;
      }
    } catch {
      // Return local match on any Firestore issue
    }
    return null;
  };

  const cloudUser = await withTimeout(firestoreQuery(), 2500, null);
  return cloudUser || localMatch || null;
}

/**
 * Save a 6-digit verification code with 10-minute expiration
 */
export async function saveVerificationCode(
  email: string,
  code: string,
  purpose: 'register' | 'reset_password'
): Promise<void> {
  const cleanEmail = email.toLowerCase().trim();
  const now = new Date();
  const expiresAt = new Date(now.getTime() + 10 * 60 * 1000);

  const newRecord: VerificationCodeRecord = {
    email: cleanEmail,
    code: code.trim(),
    purpose,
    createdAt: now.toISOString(),
    expiresAt: expiresAt.toISOString(),
  };

  // 1. Immediately save to local storage
  const codes = getLocalCodes().filter(
    (c) => !(c.email === cleanEmail && c.purpose === purpose)
  );
  codes.push(newRecord);
  saveLocalCodes(codes);

  // 2. Persist to Firestore with safety timeout
  try {
    const codeRef = doc(collection(db, VERIFICATION_COLLECTION));
    await withTimeout(setDoc(codeRef, newRecord), 2500, null);
  } catch {
    // Local record handles this safely
  }
}

/**
 * Validate verification code
 */
export async function verifyCode(
  email: string,
  inputCode: string,
  purpose: 'register' | 'reset_password'
): Promise<{ success: boolean; message: string }> {
  const cleanEmail = email.toLowerCase().trim();
  const cleanInput = inputCode.trim();

  // 1. Check local codes first
  const localCodes = getLocalCodes();
  const localMatch = localCodes.find(
    (c) => c.email === cleanEmail && c.purpose === purpose
  );

  if (localMatch) {
    if (localMatch.code === cleanInput) {
      const expires = new Date(localMatch.expiresAt).getTime();
      if (Date.now() <= expires) {
        // Clear code after successful verification
        saveLocalCodes(localCodes.filter((c) => c !== localMatch));
        return { success: true, message: 'تم التحقق بنجاح' };
      }
    }
  }

  // 2. Fallback to Firestore check with timeout
  try {
    const q = query(
      collection(db, VERIFICATION_COLLECTION),
      where('email', '==', cleanEmail),
      where('purpose', '==', purpose)
    );
    const snap = await withTimeout(getDocs(q), 2500, null);

    if (snap && !snap.empty) {
      for (const d of snap.docs) {
        const data = d.data() as VerificationCodeRecord;
        if (data.code === cleanInput) {
          const expires = new Date(data.expiresAt).getTime();
          if (Date.now() <= expires) {
            deleteDoc(d.ref).catch(() => {});
            return { success: true, message: 'تم التحقق بنجاح' };
          }
        }
      }
    }
  } catch {
    // Handled
  }

  if (localMatch && localMatch.code !== cleanInput) {
    return { success: false, message: 'رمز التحقق غير صحيح، يُرجى التأكد وإعادة المحاولة' };
  }

  return { success: false, message: 'رمز التحقق غير صحيح أو انتهت صلاحيته' };
}

/**
 * Update user password
 */
export async function updateUserPassword(email: string, newPassword: string): Promise<boolean> {
  const cleanEmail = email.toLowerCase().trim();

  // 1. Update in local storage
  const users = getLocalUsers();
  const idx = users.findIndex((u) => u.email === cleanEmail);
  if (idx !== -1) {
    users[idx].password = newPassword;
    saveLocalUsers(users);
  }

  // 2. Update in Firestore with timeout
  try {
    const q = query(
      collection(db, USERS_COLLECTION),
      where('email', '==', cleanEmail)
    );
    const snap = await withTimeout(getDocs(q), 2500, null);
    if (snap && !snap.empty) {
      const userDoc = snap.docs[0];
      await withTimeout(setDoc(userDoc.ref, { password: newPassword }, { merge: true }), 2500, null);
      return true;
    }
  } catch {
    // Local update succeeded
  }

  return idx !== -1;
}
