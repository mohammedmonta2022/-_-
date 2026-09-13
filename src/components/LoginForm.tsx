import React, { useState } from 'react';
import { User, Lock, Eye, EyeOff, AlertCircle, LogIn } from 'lucide-react';
import { findUser } from '../lib/firebase';
import type { UserAccount } from '../types';

interface LoginFormProps {
  onLoginSuccess: (user: UserAccount) => void;
  onSwitchToRegister: () => void;
  onForgotPassword: () => void;
  successMessage?: string | null;
}

export const LoginForm: React.FC<LoginFormProps> = ({
  onLoginSuccess,
  onSwitchToRegister,
  onForgotPassword,
  successMessage,
}) => {
  const [identifier, setIdentifier] = useState('');
  const [password, setPassword] = useState('');
  const [showPassword, setShowPassword] = useState(false);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError(null);

    const cleanId = identifier.trim();
    if (!cleanId || !password) {
      setError('يرجى كتابة اسم المستخدم أو البريد وكلمة المرور');
      return;
    }

    setLoading(true);
    try {
      // 1. Search user in Firestore
      const user = await findUser(cleanId);
      if (!user) {
        setError('بيانات الدخول غير صحيحة، أو لم يتم إنشاء هذا الحساب بعد');
        setLoading(false);
        return;
      }

      // 2. Validate password
      if (user.password !== password) {
        setError('كلمة المرور غير صحيحة، يرجى المحاولة مرة أخرى');
        setLoading(false);
        return;
      }

      // 3. Success
      onLoginSuccess(user);
    } catch (err: unknown) {
      const msg = err instanceof Error ? err.message : String(err);
      setError(`خطأ أثناء تسجيل الدخول: ${msg}`);
    } finally {
      setLoading(false);
    }
  };

  return (
    <div>
      {successMessage && (
        <div className="mb-4 p-3 rounded-xl bg-emerald-50 border border-emerald-200 text-emerald-800 text-xs font-semibold flex items-center gap-2">
          <span>{successMessage}</span>
        </div>
      )}

      <form onSubmit={handleSubmit} className="space-y-4">
        {/* Username / Email */}
        <div>
          <label
            htmlFor="login-identifier"
            className="block text-xs sm:text-sm font-bold text-[#053B50] mb-1.5"
          >
            اسم المستخدم أو البريد الإلكتروني
          </label>
          <div className="relative">
            <div className="absolute inset-y-0 right-0 pr-3.5 flex items-center pointer-events-none text-[#053B50]/60">
              <User className="w-4 h-4" />
            </div>
            <input
              id="login-identifier"
              type="text"
              value={identifier}
              onChange={(e) => setIdentifier(e.target.value)}
              placeholder="اسم المستخدم أو user@example.com"
              className="w-full pr-10 pl-4 py-2.5 bg-[#FFFFFF] border-2 border-[#E8DAC8] focus:border-[#053B50] rounded-xl outline-none text-[#053B50] text-sm transition-colors"
            />
          </div>
        </div>

        {/* Password */}
        <div>
          <div className="flex items-center justify-between mb-1.5">
            <label
              htmlFor="login-password"
              className="block text-xs sm:text-sm font-bold text-[#053B50]"
            >
              كلمة المرور
            </label>
            <button
              type="button"
              onClick={onForgotPassword}
              className="text-xs font-semibold text-[#053B50]/70 hover:text-[#053B50] hover:underline cursor-pointer"
            >
              نسيت كلمة المرور؟
            </button>
          </div>
          <div className="relative">
            <div className="absolute inset-y-0 right-0 pr-3.5 flex items-center pointer-events-none text-[#053B50]/60">
              <Lock className="w-4 h-4" />
            </div>
            <input
              id="login-password"
              type={showPassword ? 'text' : 'password'}
              value={password}
              onChange={(e) => setPassword(e.target.value)}
              placeholder="••••••••"
              dir="ltr"
              className="w-full pr-10 pl-11 py-2.5 bg-[#FFFFFF] border-2 border-[#E8DAC8] focus:border-[#053B50] rounded-xl outline-none text-[#053B50] text-sm transition-colors text-right"
            />
            <button
              type="button"
              onClick={() => setShowPassword(!showPassword)}
              className="absolute inset-y-0 left-0 pl-3.5 flex items-center text-[#053B50]/60 hover:text-[#053B50] cursor-pointer"
            >
              {showPassword ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
            </button>
          </div>
        </div>

        {/* Error Alert */}
        {error && (
          <div className="p-3 rounded-xl bg-red-50 border border-red-200 text-red-700 text-xs flex items-center gap-2">
            <AlertCircle className="w-4 h-4 text-red-600 shrink-0" />
            <span>{error}</span>
          </div>
        )}

        {/* Submit Button */}
        <button
          type="submit"
          disabled={loading}
          className="w-full mt-2 bg-[#053B50] hover:bg-[#042E3F] text-[#FFFFFF] font-bold py-3 px-4 rounded-xl transition-all shadow-md hover:shadow-lg disabled:opacity-50 flex items-center justify-center gap-2 cursor-pointer text-sm"
        >
          {loading ? (
            <>
              <div className="w-4 h-4 border-2 border-[#FFFFFF] border-t-transparent rounded-full animate-spin" />
              <span>جاري تسجيل الدخول...</span>
            </>
          ) : (
            <>
              <LogIn className="w-4 h-4 text-[#E8DAC8]" />
              <span>تسجيل الدخول</span>
            </>
          )}
        </button>

        {/* Switch to Register */}
        <div className="pt-2 text-center text-xs text-[#053B50]/80">
          <span>ليس لديك حساب بعد؟ </span>
          <button
            type="button"
            onClick={onSwitchToRegister}
            className="text-[#053B50] font-bold underline hover:text-[#042E3F] cursor-pointer mr-1"
          >
            إنشاء حساب جديد
          </button>
        </div>
      </form>
    </div>
  );
};
