export interface UserAccount {
  id?: string;
  username: string;
  email: string;
  password: string;
  createdAt: string;
  isVerified: boolean;
  role?: 'admin' | 'user';
  isOfficialSender?: boolean;
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
  configuredAt?: string;
}

export type AuthTab = 'login' | 'register';
