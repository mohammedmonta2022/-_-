import { initializeApp, getApps, getApp } from 'firebase/app';
import {
  getFirestore,
  collection,
  doc,
  setDoc,
  getDoc,
  getDocs,
  query,
  where,
  deleteDoc,
  getDocFromServer,
} from 'firebase/firestore';
import {
  getAuth,
  signInWithPopup,
  GoogleAuthProvider,
  onAuthStateChanged,
  type User,
} from 'firebase/auth';
import type { UserAccount, VerificationCodeRecord, SystemConfig } from '../types';
import firebaseConfig from '../../firebase-applet-config.json';

// Initialize Firebase App safely
const app = !getApps().length ? initializeApp(firebaseConfig) : getApp();

// Connect specifically to the named Firestore database ID
const firestoreDbId = firebaseConfig.firestoreDatabaseId || 'ai-studio-8693706e-c5dd-4536-89e2-841d263fe9b5';
export const db = getFirestore(app, firestoreDbId);
export const auth = getAuth(app);

// Purge any residual local storage from browser to enforce Firebase Firestore only
try {
  localStorage.removeItem('azm_users_store_v1');
  localStorage.removeItem('azm_codes_store_v1');
  localStorage.removeItem('azm_system_config_v1');
  localStorage.removeItem('azm_system_config');
} catch {
  // Ignore
}

// Google Provider with Gmail Send scope
const provider = new GoogleAuthProvider();
provider.addScope('https://www.googleapis.com/auth/gmail.send');
provider.setCustomParameters({
  prompt: 'select_account',
});

// Test connection to Firestore on app startup
(async function testConnection() {
  try {
    await getDocFromServer(doc(db, 'system_config', 'mailer_settings'));
    console.log(`[Firebase Firestore] Connected successfully to database: ${firestoreDbId}`);
  } catch (error) {
    console.info('[Firebase Firestore] Initialized database connection:', firestoreDbId);
  }
})();

// In-memory token cache
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
 * Set access token in memory
 */
export const setAccessToken = (token: string | null): void => {
  cachedAccessToken = token;
};

/**
 * Logout from Firebase Auth
 */
export const logoutAuth = async () => {
  await auth.signOut();
  cachedAccessToken = null;
};

// Firestore Collections
const USERS_COLLECTION = 'users';
const VERIFICATION_COLLECTION = 'verification_codes';
const SYSTEM_CONFIG_COLLECTION = 'system_config';
const MAILER_DOC_ID = 'mailer_settings';

/**
 * Retrieve System Configuration directly from Firestore
 */
export async function getSystemConfig(): Promise<SystemConfig | null> {
  try {
    const ref = doc(db, SYSTEM_CONFIG_COLLECTION, MAILER_DOC_ID);
    const snap = await getDoc(ref);
    if (snap.exists()) {
      return snap.data() as SystemConfig;
    }
  } catch (err) {
    console.error('[Firestore] Error getting system config:', err);
  }
  return null;
}

/**
 * Save System Configuration directly to Firestore
 */
export async function saveSystemConfig(config: Partial<SystemConfig>): Promise<void> {
  const current = (await getSystemConfig()) || {
    senderEmail: '',
    senderName: 'مجمع عزم التعليمي',
    isConfigured: false,
    firstUserRegistered: false,
  };

  const updated: SystemConfig = {
    senderEmail: config.senderEmail ?? current.senderEmail,
    senderName: config.senderName ?? current.senderName,
    isConfigured: config.isConfigured ?? current.isConfigured,
    firstUserRegistered: config.firstUserRegistered ?? current.firstUserRegistered,
    isAuthorized: config.isAuthorized !== undefined ? config.isAuthorized : current.isAuthorized,
    accessToken: config.accessToken ?? current.accessToken,
    authorizedAt: config.authorizedAt ?? current.authorizedAt,
    configuredAt: new Date().toISOString(),
  };

  const ref = doc(db, SYSTEM_CONFIG_COLLECTION, MAILER_DOC_ID);
  await setDoc(ref, updated, { merge: true });
  console.log('[Firestore] System configuration & authorization saved to Firestore:', {
    senderEmail: updated.senderEmail,
    isAuthorized: updated.isAuthorized,
    hasToken: Boolean(updated.accessToken),
  });
}

/**
 * Retrieve the saved Official Sender token directly from Firebase Firestore
 */
export async function getSavedSenderToken(): Promise<string | null> {
  if (cachedAccessToken) {
    return cachedAccessToken;
  }
  try {
    const config = await getSystemConfig();
    if (config?.accessToken && config.isAuthorized) {
      cachedAccessToken = config.accessToken;
      return config.accessToken;
    }
  } catch (err) {
    console.error('[Firestore] Error fetching sender token:', err);
  }
  return null;
}

/**
 * Authorize the First User / Admin Gmail account and persist the authorization permanently in Firestore!
 */
export async function authorizeSenderEmail(userEmail: string): Promise<{ success: boolean; error?: string }> {
  try {
    const authResult = await googleSignIn();
    if (!authResult?.accessToken) {
      throw new Error('تعذر الحصول على رمز التفويض من Google');
    }

    cachedAccessToken = authResult.accessToken;

    // Save directly into Firestore in system_config/mailer_settings
    await saveSystemConfig({
      senderEmail: userEmail || authResult.user.email || '',
      senderName: 'مجمع عزم التعليمي',
      isConfigured: true,
      isAuthorized: true,
      accessToken: authResult.accessToken,
      authorizedAt: new Date().toISOString(),
    });

    return { success: true };
  } catch (err) {
    const msg = err instanceof Error ? err.message : String(err);
    return { success: false, error: msg };
  }
}

/**
 * Check if the system has an official sender email in Firestore
 */
export async function getOfficialSenderEmail(): Promise<string | null> {
  const config = await getSystemConfig();
  if (config && config.senderEmail && config.isConfigured) {
    return config.senderEmail;
  }
  return null;
}

/**
 * Save user strictly to Firebase Firestore.
 * If this is the first user in Firestore, automatically mark them as Admin & Official Sender!
 */
export async function createUserAccount(user: Omit<UserAccount, 'id'>): Promise<string> {
  const cleanEmail = user.email.toLowerCase().trim();
  const cleanUsername = user.username.trim();
  const id = `user_${Date.now()}_${Math.random().toString(36).substring(2, 7)}`;

  // Check if system already has registered users or a sender email in Firestore
  const existingConfig = await getSystemConfig();
  const isFirstUser = !existingConfig || !existingConfig.firstUserRegistered || !existingConfig.senderEmail;

  const newUserData: UserAccount = {
    ...user,
    id,
    email: cleanEmail,
    username: cleanUsername,
    role: user.role || (isFirstUser ? 'admin' : 'user'),
    isOfficialSender: user.isOfficialSender !== undefined ? user.isOfficialSender : isFirstUser,
  };

  // 1. If this is the first user, record in system_config in Firestore
  if (isFirstUser) {
    await saveSystemConfig({
      senderEmail: cleanEmail,
      senderName: 'مجمع عزم التعليمي',
      isConfigured: true,
      firstUserRegistered: true,
    });
  }

  // 2. Persist directly to Firestore users collection
  const userRef = doc(collection(db, USERS_COLLECTION), id);
  await setDoc(userRef, newUserData);
  console.log(`[Firestore] User saved successfully in Firestore: ${cleanUsername} (${id})`);

  return id;
}

/**
 * Find user strictly in Firebase Firestore by username or email
 */
export async function findUser(identifier: string): Promise<UserAccount | null> {
  const cleanId = identifier.trim();
  const lower = cleanId.toLowerCase();

  try {
    // 1. Query Firestore by email
    const qEmail = query(
      collection(db, USERS_COLLECTION),
      where('email', '==', lower)
    );
    const emailSnap = await getDocs(qEmail);
    if (!emailSnap.empty) {
      const d = emailSnap.docs[0];
      return { id: d.id, ...d.data() } as UserAccount;
    }

    // 2. Query Firestore by username
    const qUser = query(
      collection(db, USERS_COLLECTION),
      where('username', '==', cleanId)
    );
    const userSnap = await getDocs(qUser);
    if (!userSnap.empty) {
      const d = userSnap.docs[0];
      return { id: d.id, ...d.data() } as UserAccount;
    }
  } catch (err) {
    console.error('[Firestore] Error finding user in Firestore:', err);
    throw err;
  }

  return null;
}

/**
 * Save a 6-digit verification code strictly to Firebase Firestore with 10-minute expiration
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

  // Persist directly to Firestore verification_codes collection
  const codeRef = doc(collection(db, VERIFICATION_COLLECTION));
  await setDoc(codeRef, newRecord);
  console.log(`[Firestore] Verification code saved in Firestore for: ${cleanEmail}`);
}

/**
 * Validate verification code strictly against Firebase Firestore
 */
export async function verifyCode(
  email: string,
  inputCode: string,
  purpose: 'register' | 'reset_password'
): Promise<{ success: boolean; message: string }> {
  const cleanEmail = email.toLowerCase().trim();
  const cleanInput = inputCode.trim();

  try {
    const q = query(
      collection(db, VERIFICATION_COLLECTION),
      where('email', '==', cleanEmail),
      where('purpose', '==', purpose)
    );
    const snap = await getDocs(q);

    if (!snap.empty) {
      for (const d of snap.docs) {
        const data = d.data() as VerificationCodeRecord;
        if (data.code === cleanInput) {
          const expires = new Date(data.expiresAt).getTime();
          if (Date.now() <= expires) {
            // Delete used code from Firestore
            await deleteDoc(d.ref).catch(() => {});
            return { success: true, message: 'تم التحقق بنجاح من قاعدة بيانات Firebase' };
          }
        }
      }
    }
  } catch (err) {
    console.error('[Firestore] Error verifying code in Firestore:', err);
    throw err;
  }

  return { success: false, message: 'رمز التحقق غير صحيح أو انتهت صلاحيته' };
}

/**
 * Update user password strictly in Firebase Firestore
 */
export async function updateUserPassword(email: string, newPassword: string): Promise<boolean> {
  const cleanEmail = email.toLowerCase().trim();

  try {
    const q = query(
      collection(db, USERS_COLLECTION),
      where('email', '==', cleanEmail)
    );
    const snap = await getDocs(q);
    if (!snap.empty) {
      const userDoc = snap.docs[0];
      await setDoc(userDoc.ref, { password: newPassword }, { merge: true });
      console.log(`[Firestore] Password updated in Firestore for: ${cleanEmail}`);
      return true;
    }
  } catch (err) {
    console.error('[Firestore] Error updating user password in Firestore:', err);
    throw err;
  }

  return false;
}
