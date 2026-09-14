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
  writeBatch,
} from 'firebase/firestore';
import {
  getAuth,
  signInWithPopup,
  GoogleAuthProvider,
  onAuthStateChanged,
  type User,
} from 'firebase/auth';
import type {
  UserAccount,
  VerificationCodeRecord,
  SystemConfig,
  QuranComplex,
  QuranCircle,
  RecitationRecord,
} from '../types';
import firebaseConfig from '../../firebase-applet-config.json';

// Initialize Firebase App safely
const app = !getApps().length ? initializeApp(firebaseConfig) : getApp();

// Connect specifically to the named Firestore database ID
const firestoreDbId = firebaseConfig.firestoreDatabaseId || 'ai-studio-8693706e-c5dd-4536-89e2-841d263fe9b5';
export const db = getFirestore(app, firestoreDbId);
export const auth = getAuth(app);

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
    console.log(`[Firestore] Connected successfully to database: ${firestoreDbId}`);
  } catch {
    console.info('[Firestore] Initialized database connection:', firestoreDbId);
  }
})();

// In-memory & localStorage token cache
const LOCAL_STORAGE_SENDER_TOKEN_KEY = 'azm_authorized_sender_token';
let cachedAccessToken: string | null =
  (typeof window !== 'undefined' ? localStorage.getItem(LOCAL_STORAGE_SENDER_TOKEN_KEY) : null) || null;
let isSigningIn = false;

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

export const googleSignIn = async (): Promise<{ user: User; accessToken: string } | null> => {
  try {
    isSigningIn = true;
    const result = await signInWithPopup(auth, provider);
    const credential = GoogleAuthProvider.credentialFromResult(result);
    if (!credential?.accessToken) {
      throw new Error('تعذر استخراج رمز التفويض من Google');
    }

    setAccessToken(credential.accessToken);
    return { user: result.user, accessToken: credential.accessToken };
  } catch (error) {
    console.error('Sign in / OAuth error:', error);
    throw error;
  } finally {
    isSigningIn = false;
  }
};

export const getAccessToken = (): string | null => {
  if (cachedAccessToken) return cachedAccessToken;
  if (typeof window !== 'undefined') {
    const local = localStorage.getItem(LOCAL_STORAGE_SENDER_TOKEN_KEY);
    if (local) {
      cachedAccessToken = local;
      return local;
    }
  }
  return null;
};

export const setAccessToken = (token: string | null): void => {
  cachedAccessToken = token;
  if (typeof window !== 'undefined') {
    if (token) {
      localStorage.setItem(LOCAL_STORAGE_SENDER_TOKEN_KEY, token);
    } else {
      localStorage.removeItem(LOCAL_STORAGE_SENDER_TOKEN_KEY);
    }
  }
};

export const logoutAuth = async () => {
  await auth.signOut();
  setAccessToken(null);
};

// Firestore Collections
const USERS_COLLECTION = 'users';
const VERIFICATION_COLLECTION = 'verification_codes';
const SYSTEM_CONFIG_COLLECTION = 'system_config';
const MAILER_DOC_ID = 'mailer_settings';
const COMPLEXES_COLLECTION = 'quran_complexes';
const CIRCLES_COLLECTION = 'quran_circles';
const RECITATIONS_COLLECTION = 'recitations';

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
    allowPublicRegistration: true,
  };

  const updated: SystemConfig = {
    senderEmail: config.senderEmail ?? current.senderEmail,
    senderName: config.senderName ?? current.senderName,
    isConfigured: config.isConfigured ?? current.isConfigured,
    firstUserRegistered: config.firstUserRegistered ?? current.firstUserRegistered,
    isAuthorized: config.isAuthorized !== undefined ? config.isAuthorized : current.isAuthorized,
    accessToken: config.accessToken ?? current.accessToken,
    authorizedAt: config.authorizedAt ?? current.authorizedAt,
    authorizedBy: config.authorizedBy ?? current.authorizedBy,
    configuredAt: new Date().toISOString(),
    allowPublicRegistration: config.allowPublicRegistration !== undefined ? config.allowPublicRegistration : (current.allowPublicRegistration ?? true),
  };

  const ref = doc(db, SYSTEM_CONFIG_COLLECTION, MAILER_DOC_ID);
  await setDoc(ref, updated, { merge: true });
}

/**
 * Retrieve the saved Official Sender token directly from LocalStorage or Firebase Firestore
 */
export async function getSavedSenderToken(): Promise<string | null> {
  const token = getAccessToken();
  if (token) {
    return token;
  }
  try {
    const config = await getSystemConfig();
    if (config?.accessToken && config.isAuthorized) {
      setAccessToken(config.accessToken);
      return config.accessToken;
    }
  } catch (err) {
    console.error('[Firestore] Error fetching sender token:', err);
  }
  return null;
}

/**
 * Request Google OAuth token using Google Identity Services (GSI) or Firebase Auth popup
 */
export async function requestGoogleOAuthToken(): Promise<{ accessToken: string; email?: string }> {
  // Strategy 1: Google Identity Services (GSI)
  if (typeof window !== 'undefined' && (window as unknown as { google?: { accounts?: { oauth2?: { initTokenClient: Function } } } })?.google?.accounts?.oauth2) {
    try {
      const gOauth = (window as unknown as { google: { accounts: { oauth2: { initTokenClient: Function } } } }).google.accounts.oauth2;
      const gClient = gOauth.initTokenClient({
        client_id: firebaseConfig.oAuthClientId || '576155598063-9sigjmhkijl03raan3lj117q6sjbcnb6.apps.googleusercontent.com',
        scope: 'https://www.googleapis.com/auth/gmail.send email profile',
        callback: () => {},
      });

      const tokenPromise = new Promise<{ accessToken: string; email?: string }>((resolve, reject) => {
        gClient.callback = (resp: { error?: string; error_description?: string; access_token?: string }) => {
          if (resp?.error) {
            reject(new Error(resp.error_description || resp.error || 'Google OAuth Error'));
          } else if (resp?.access_token) {
            resolve({ accessToken: resp.access_token });
          } else {
            reject(new Error('لم يتم استلام رمز تفويض Google'));
          }
        };
      });

      gClient.requestAccessToken({ prompt: 'consent' });
      const result = await tokenPromise;
      if (result.accessToken) {
        setAccessToken(result.accessToken);
        return result;
      }
    } catch (gsiErr) {
      console.warn('[OAuth] Google Identity Services attempt fell through, trying Firebase Auth...', gsiErr);
    }
  }

  // Strategy 2: Firebase Auth signInWithPopup
  const authRes = await googleSignIn();
  if (authRes?.accessToken) {
    return { accessToken: authRes.accessToken, email: authRes.user.email || undefined };
  }

  throw new Error('تعذر إتمام تفويض حساب Google');
}

/**
 * Authorize the First User / Admin / Supervisor Gmail account and persist the authorization permanently in Firestore!
 */
export async function authorizeSenderEmail(
  userEmail: string,
  options?: {
    forceSaveOnly?: boolean;
    explicitToken?: string;
    senderName?: string;
    authorizedBy?: string;
  }
): Promise<{ success: boolean; error?: string; accessToken?: string }> {
  try {
    const cleanEmail = userEmail.trim().toLowerCase();
    let token: string | undefined = options?.explicitToken;

    // If not direct database authorization only, request Google token
    if (!options?.forceSaveOnly && !token) {
      try {
        const oauthRes = await requestGoogleOAuthToken();
        token = oauthRes.accessToken;
      } catch (oauthErr) {
        console.warn('OAuth prompt warning (proceeding with permanent database authorization):', oauthErr);
      }
    }

    if (token) {
      setAccessToken(token);
    }

    // Save permanently to Firestore system_config
    await saveSystemConfig({
      senderEmail: cleanEmail,
      senderName: options?.senderName || 'مجمع عزم التعليمي',
      isConfigured: true,
      isAuthorized: true,
      accessToken: token || getAccessToken() || '',
      authorizedAt: new Date().toISOString(),
      authorizedBy: options?.authorizedBy || cleanEmail,
    });

    return { success: true, accessToken: token };
  } catch (err) {
    const msg = err instanceof Error ? err.message : String(err);
    return { success: false, error: msg };
  }
}

/**
 * De-authorize the sender email
 */
export async function deauthorizeSenderEmail(): Promise<void> {
  setAccessToken(null);
  await saveSystemConfig({
    isAuthorized: false,
    accessToken: '',
    authorizedAt: '',
  });
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
 */
export async function createUserAccount(user: Omit<UserAccount, 'id'>): Promise<string> {
  const cleanEmail = user.email ? user.email.toLowerCase().trim() : '';
  const cleanUsername = user.username.trim();
  const id = `user_${Date.now()}_${Math.random().toString(36).substring(2, 7)}`;

  const existingConfig = await getSystemConfig();
  const isFirstUser = !existingConfig || !existingConfig.firstUserRegistered || !existingConfig.senderEmail;

  const determinedRole = user.role || (isFirstUser ? 'general_admin' : 'student');

  const newUserData: UserAccount = {
    ...user,
    id,
    email: cleanEmail,
    username: cleanUsername,
    role: determinedRole,
    isOfficialSender: user.isOfficialSender !== undefined ? user.isOfficialSender : (isFirstUser || determinedRole === 'general_admin'),
    createdAt: user.createdAt || new Date().toISOString(),
    isVerified: user.isVerified ?? false,
  };

  const userDocRef = doc(db, USERS_COLLECTION, id);
  await setDoc(userDocRef, newUserData);

  if (isFirstUser && cleanEmail) {
    await saveSystemConfig({
      senderEmail: cleanEmail,
      isConfigured: true,
      firstUserRegistered: true,
    });
  }

  return id;
}

/**
 * Batch create multiple accounts with unified password and role
 */
export async function createBatchUsers(
  usernames: string[],
  role: UserAccount['role'],
  defaultPassword: string,
  complexId?: string,
  complexName?: string,
  circleId?: string,
  circleName?: string
): Promise<{ count: number }> {
  const batch = writeBatch(db);
  let count = 0;
  const now = new Date().toISOString();

  for (const name of usernames) {
    const trimmed = name.trim();
    if (!trimmed) continue;
    const id = `user_${Date.now()}_${Math.random().toString(36).substring(2, 7)}_${count}`;
    const userDocRef = doc(db, USERS_COLLECTION, id);
    const newUserData: UserAccount = {
      id,
      username: trimmed,
      email: `${trimmed.toLowerCase().replace(/[^a-z0-9]/g, '')}_${Math.floor(1000 + Math.random() * 9000)}@azm-quran.edu`,
      password: defaultPassword,
      createdAt: now,
      isVerified: true,
      role: role || 'student',
      complexId,
      complexName,
      circleId,
      circleName,
    };
    batch.set(userDocRef, newUserData);
    count++;
  }

  if (count > 0) {
    await batch.commit();
  }
  return { count };
}

/**
 * Update user account details
 */
export async function updateUserAccount(userId: string, data: Partial<UserAccount>): Promise<boolean> {
  try {
    const userDoc = doc(db, USERS_COLLECTION, userId);
    await setDoc(userDoc, data, { merge: true });
    return true;
  } catch (err) {
    console.error('[Firestore] Error updating user:', err);
    return false;
  }
}

/**
 * Delete user account from Firestore
 */
export async function deleteUserAccount(userId: string): Promise<boolean> {
  try {
    const userDoc = doc(db, USERS_COLLECTION, userId);
    await deleteDoc(userDoc);
    return true;
  } catch (err) {
    console.error('[Firestore] Error deleting user:', err);
    return false;
  }
}

/**
 * List all users
 */
export async function getAllUsers(): Promise<UserAccount[]> {
  try {
    const snap = await getDocs(collection(db, USERS_COLLECTION));
    return snap.docs.map((d) => ({ id: d.id, ...d.data() } as UserAccount));
  } catch (err) {
    console.error('[Firestore] Error fetching users:', err);
    return [];
  }
}

/**
 * Find user strictly in Firebase Firestore
 */
export async function findUser(identifier: string): Promise<UserAccount | null> {
  const cleanId = identifier.trim();
  const cleanEmail = cleanId.toLowerCase();

  try {
    const qEmail = query(
      collection(db, USERS_COLLECTION),
      where('email', '==', cleanEmail)
    );
    const emailSnap = await getDocs(qEmail);
    if (!emailSnap.empty) {
      const d = emailSnap.docs[0];
      return { id: d.id, ...d.data() } as UserAccount;
    }

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
 * Save a 6-digit verification code strictly to Firebase Firestore
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

  const codeRef = doc(collection(db, VERIFICATION_COLLECTION));
  await setDoc(codeRef, newRecord);
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
            await deleteDoc(d.ref).catch(() => {});
            return { success: true, message: 'تم التحقق بنجاح' };
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
      return true;
    }
  } catch (err) {
    console.error('[Firestore] Error updating user password in Firestore:', err);
    throw err;
  }

  return false;
}

// ==========================================
// QURAN COMPLEXES & CIRCLES FIRESTORE CRUD
// ==========================================

export async function addComplex(name: string, locationName?: string, lat?: number, lng?: number): Promise<QuranComplex> {
  const id = `complex_${Date.now()}_${Math.random().toString(36).substring(2, 6)}`;
  const complex: QuranComplex = {
    id,
    name: name.trim(),
    locationName: locationName?.trim() || '',
    latitude: lat,
    longitude: lng,
    createdAt: new Date().toISOString(),
  };
  await setDoc(doc(db, COMPLEXES_COLLECTION, id), complex);
  return complex;
}

export async function updateComplex(
  complexId: string,
  data: { name?: string; locationName?: string; latitude?: number; longitude?: number }
): Promise<boolean> {
  try {
    const complexDoc = doc(db, COMPLEXES_COLLECTION, complexId);
    await setDoc(complexDoc, data, { merge: true });

    // If complex name was updated, also update complexName in users
    if (data.name) {
      const usersSnap = await getDocs(
        query(collection(db, USERS_COLLECTION), where('complexId', '==', complexId))
      );
      if (!usersSnap.empty) {
        const batch = writeBatch(db);
        usersSnap.docs.forEach((uDoc) => {
          batch.update(uDoc.ref, { complexName: data.name });
        });
        await batch.commit();
      }
    }
    return true;
  } catch (err) {
    console.error('[Firestore] Error updating complex:', err);
    return false;
  }
}

export async function deleteComplex(complexId: string): Promise<boolean> {
  try {
    // 1. Delete complex document
    await deleteDoc(doc(db, COMPLEXES_COLLECTION, complexId));

    // 2. Delete circles belonging to this complex
    const circsSnap = await getDocs(
      query(collection(db, CIRCLES_COLLECTION), where('complexId', '==', complexId))
    );
    const batch = writeBatch(db);
    circsSnap.docs.forEach((cDoc) => {
      batch.delete(cDoc.ref);
    });

    // 3. Unlink users associated with this complex
    const usersSnap = await getDocs(
      query(collection(db, USERS_COLLECTION), where('complexId', '==', complexId))
    );
    usersSnap.docs.forEach((uDoc) => {
      batch.update(uDoc.ref, { complexId: '', complexName: '', circleId: '', circleName: '' });
    });

    await batch.commit();
    return true;
  } catch (err) {
    console.error('[Firestore] Error deleting complex:', err);
    return false;
  }
}

export async function getComplexes(): Promise<QuranComplex[]> {
  try {
    const snap = await getDocs(collection(db, COMPLEXES_COLLECTION));
    return snap.docs.map((d) => ({ id: d.id, ...d.data() } as QuranComplex));
  } catch (err) {
    console.error('[Firestore] Error fetching complexes:', err);
    return [];
  }
}

export async function getCircles(complexId?: string): Promise<QuranCircle[]> {
  try {
    let q = query(collection(db, CIRCLES_COLLECTION));
    if (complexId) {
      q = query(q, where('complexId', '==', complexId));
    }
    const snap = await getDocs(q);
    return snap.docs.map((d) => ({ id: d.id, ...d.data() } as QuranCircle));
  } catch (err) {
    console.error('[Firestore] Error fetching circles:', err);
    return [];
  }
}

export async function addCircle(
  complexId: string,
  name: string,
  teacherId?: string,
  teacherName?: string
): Promise<QuranCircle> {
  const id = `circle_${Date.now()}_${Math.random().toString(36).substring(2, 6)}`;
  const circle: QuranCircle = {
    id,
    complexId,
    name: name.trim(),
    teacherId: teacherId || '',
    teacherName: teacherName || '',
    createdAt: new Date().toISOString(),
  };
  await setDoc(doc(db, CIRCLES_COLLECTION, id), circle);
  return circle;
}

export async function updateCircle(
  circleId: string,
  data: { name?: string; teacherId?: string; teacherName?: string }
): Promise<boolean> {
  try {
    const circleDoc = doc(db, CIRCLES_COLLECTION, circleId);
    await setDoc(circleDoc, data, { merge: true });

    // If circle name was updated, update users assigned to this circle
    if (data.name) {
      const usersSnap = await getDocs(
        query(collection(db, USERS_COLLECTION), where('circleId', '==', circleId))
      );
      if (!usersSnap.empty) {
        const batch = writeBatch(db);
        usersSnap.docs.forEach((uDoc) => {
          batch.update(uDoc.ref, { circleName: data.name });
        });
        await batch.commit();
      }
    }
    return true;
  } catch (err) {
    console.error('[Firestore] Error updating circle:', err);
    return false;
  }
}

export async function deleteCircle(circleId: string): Promise<boolean> {
  try {
    // 1. Delete circle doc
    await deleteDoc(doc(db, CIRCLES_COLLECTION, circleId));

    // 2. Unlink users from this circle
    const usersSnap = await getDocs(
      query(collection(db, USERS_COLLECTION), where('circleId', '==', circleId))
    );
    if (!usersSnap.empty) {
      const batch = writeBatch(db);
      usersSnap.docs.forEach((uDoc) => {
        batch.update(uDoc.ref, { circleId: '', circleName: '' });
      });
      await batch.commit();
    }
    return true;
  } catch (err) {
    console.error('[Firestore] Error deleting circle:', err);
    return false;
  }
}

export async function moveCircle(
  circleId: string,
  targetComplexId: string,
  targetComplexName: string
): Promise<boolean> {
  try {
    // 1. Update circle's complexId
    const circleDoc = doc(db, CIRCLES_COLLECTION, circleId);
    await setDoc(circleDoc, { complexId: targetComplexId }, { merge: true });

    // 2. Update all users/students in this circle so complexId and complexName match the new complex
    const usersSnap = await getDocs(
      query(collection(db, USERS_COLLECTION), where('circleId', '==', circleId))
    );
    if (!usersSnap.empty) {
      const batch = writeBatch(db);
      usersSnap.docs.forEach((uDoc) => {
        batch.update(uDoc.ref, {
          complexId: targetComplexId,
          complexName: targetComplexName,
        });
      });
      await batch.commit();
    }
    return true;
  } catch (err) {
    console.error('[Firestore] Error moving circle:', err);
    return false;
  }
}

// ==========================================
// RECITATIONS (تسميع القرآن والسجلات)
// ==========================================

export async function addRecitation(recitation: Omit<RecitationRecord, 'id' | 'createdAt'>): Promise<string> {
  const id = `rec_${Date.now()}_${Math.random().toString(36).substring(2, 6)}`;
  const fullRecord: RecitationRecord = {
    ...recitation,
    id,
    createdAt: new Date().toISOString(),
  };
  await setDoc(doc(db, RECITATIONS_COLLECTION, id), fullRecord);
  return id;
}

export async function getRecitations(filters?: {
  complexId?: string;
  circleId?: string;
  studentId?: string;
  date?: string;
}): Promise<RecitationRecord[]> {
  try {
    let q = query(collection(db, RECITATIONS_COLLECTION));
    if (filters?.complexId) {
      q = query(q, where('complexId', '==', filters.complexId));
    }
    if (filters?.circleId) {
      q = query(q, where('circleId', '==', filters.circleId));
    }
    if (filters?.studentId) {
      q = query(q, where('studentId', '==', filters.studentId));
    }
    if (filters?.date) {
      q = query(q, where('date', '==', filters.date));
    }
    const snap = await getDocs(q);
    return snap.docs.map((d) => ({ id: d.id, ...d.data() } as RecitationRecord));
  } catch (err) {
    console.error('[Firestore] Error fetching recitations:', err);
    return [];
  }
}

/**
 * Seed initial sample Quran educational data if empty to showcase the stats immediately
 */
export async function seedInitialQuranDataIfEmpty(): Promise<void> {
  try {
    const existingComplexes = await getComplexes();
    if (existingComplexes.length > 0) return;

    // 1. Add Default Quran Complexes
    const c1 = await addComplex('مجمع جامع الهدى القرآني', 'حي النزهة - الرياض', 24.7136, 46.6753);
    const c2 = await addComplex('مجمع الإمام نافع لتحفيظ القرآن', 'حي الروضة - الرياض', 24.7431, 46.7725);
    const c3 = await addComplex('مجمع الإمام عاصم النموذجي', 'حي الياسمين - الرياض', 24.8122, 46.6341);

    // 2. Add Circles
    const cir1 = await addCircle(c1.id, 'حلقة الإتقان (الفجر)', 'teacher_1', 'الشيخ عبدالرحمن السديس');
    const cir2 = await addCircle(c1.id, 'حلقة التبيان (العصر)', 'teacher_2', 'الشيخ مشاري راشد');
    const cir3 = await addCircle(c2.id, 'حلقة الماهر بالقرآن', 'teacher_3', 'الشيخ ماهر المعيقلي');
    const cir4 = await addCircle(c3.id, 'حلقة الفرقان (المغرب)', 'teacher_4', 'الشيخ سعد الغامدي');

    // 3. Add Students
    const today = new Date().toISOString().split('T')[0];
    const yesterday = new Date(Date.now() - 86400000).toISOString().split('T')[0];

    const students = [
      { name: 'عبدالله بن أحمد الفهيد', circle: cir1, complex: c1 },
      { name: 'محمد بن يوسف القحطاني', circle: cir1, complex: c1 },
      { name: 'عمر بن خالد السليمان', circle: cir2, complex: c1 },
      { name: 'سعد بن عبدالعزيز الدوسري', circle: cir3, complex: c2 },
      { name: 'إبراهيم بن صالح الغامدي', circle: cir3, complex: c2 },
      { name: 'خالد بن ناصر العتيبي', circle: cir4, complex: c3 },
      { name: 'فيصل بن نايف المطيري', circle: cir4, complex: c3 },
    ];

    for (let i = 0; i < students.length; i++) {
      const s = students[i];
      const sId = `student_${i + 1}`;
      await setDoc(doc(db, USERS_COLLECTION, sId), {
        id: sId,
        username: s.name,
        email: `student${i + 1}@azm-quran.edu`,
        password: 'password123',
        role: 'student',
        isVerified: true,
        createdAt: new Date().toISOString(),
        complexId: s.complex.id,
        complexName: s.complex.name,
        circleId: s.circle.id,
        circleName: s.circle.name,
      });

      // Add recitations for today
      await addRecitation({
        studentId: sId,
        studentName: s.name,
        circleId: s.circle.id,
        circleName: s.circle.name,
        complexId: s.complex.id,
        date: today,
        type: i % 2 === 0 ? 'جديد' : 'مراجعة صغرى',
        surah: i === 0 ? 'البقرة' : i === 1 ? 'آل عمران' : i === 2 ? 'النساء' : 'المائدة',
        ayahFrom: 1 + i * 15,
        ayahTo: 30 + i * 25,
        pagesCount: 2 + (i % 4),
        versesCount: 35 + i * 12,
        notes: 'قراءة متقنة مع أحكام التجويد والمدود',
        complaints: 'لا يوجد أي ملاحظات',
      });

      // Add recitations for yesterday
      await addRecitation({
        studentId: sId,
        studentName: s.name,
        circleId: s.circle.id,
        circleName: s.circle.name,
        complexId: s.complex.id,
        date: yesterday,
        type: 'تراكمي',
        surah: 'الكهف',
        ayahFrom: 1,
        ayahTo: 45,
        pagesCount: 3,
        versesCount: 45,
        notes: 'مراجعة ممتازة وحفظ راسخ',
      });
    }

    console.log('[Firestore] Successfully seeded initial Quran education data.');
  } catch (err) {
    console.error('[Firestore] Error seeding initial data:', err);
  }
}
