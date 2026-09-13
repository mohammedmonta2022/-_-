export interface UserAccount {
  id?: string;
  username: string;
  email: string;
  password: string;
  createdAt: string;
  isVerified: boolean;
}

export interface VerificationCodeRecord {
  id?: string;
  email: string;
  code: string;
  purpose: 'register' | 'reset_password';
  createdAt: string;
  expiresAt: string;
}

export type AuthTab = 'login' | 'register';
