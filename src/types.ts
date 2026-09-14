export type UserRole = 'general_admin' | 'supervisor' | 'teacher' | 'student';

export interface UserAccount {
  id?: string;
  username: string;
  email: string;
  password?: string;
  createdAt: string;
  isVerified: boolean;
  role: UserRole | 'admin' | 'user';
  isOfficialSender?: boolean;
  complexId?: string;       // المجمع الذي ينتمي إليه (للطالب / المعلم / المشرف)
  complexName?: string;
  circleId?: string;        // الحلقة التي ينتمي إليها
  circleName?: string;
}

export interface QuranComplex {
  id: string;
  name: string;
  locationName?: string;
  latitude?: number;
  longitude?: number;
  createdAt: string;
}

export interface QuranCircle {
  id: string;
  complexId: string;
  name: string;
  teacherId?: string;
  teacherName?: string;
  createdAt: string;
}

export interface RecitationRecord {
  id: string;
  studentId: string;
  studentName: string;
  circleId: string;
  circleName: string;
  complexId: string;
  date: string; // YYYY-MM-DD
  type: 'جديد' | 'مراجعة صغرى' | 'تراكمي' | 'تثبيت';
  surah: string;
  ayahFrom: number;
  ayahTo: number;
  pagesCount: number;
  versesCount: number;
  notes?: string;
  complaints?: string;
  createdAt: string;
}

export interface VerificationCodeRecord {
  id?: string;
  email: string;
  code: string;
  purpose: 'register' | 'reset_password';
  createdAt: string;
  expiresAt: string;
}

export interface SystemConfig {
  senderEmail: string;
  senderName: string;
  isConfigured: boolean;
  firstUserRegistered: boolean;
  isAuthorized?: boolean;
  accessToken?: string;
  authorizedAt?: string;
  authorizedBy?: string;
  configuredAt?: string;
  allowPublicRegistration?: boolean; // إمكانية إغلاق إنشاء الحسابات من الخارج
}

export type AuthTab = 'login' | 'register';
