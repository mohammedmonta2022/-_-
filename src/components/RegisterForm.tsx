import React, { useState } from 'react';
import { User, Mail, Lock, Eye, EyeOff, AlertCircle, ArrowLeft, Send } from 'lucide-react';
import { findUser, saveVerificationCode, verifyCode, createUserAccount } from '../lib/firebase';
import { sendEmailViaGmail, generateEmailHtml } from '../lib/gmail';
import { VerificationModal } from './VerificationModal';

interface RegisterFormProps {
  onSuccess: (username: string) => void;
  onSwitchToLogin: () => void;
}

export const RegisterForm: React.FC<RegisterFormProps> = ({
  onSuccess,
  onSwitchToLogin,
}) => {
  const [username, setUsername] = useState('');
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [confirmPassword, setConfirmPassword] = useState('');

  const [showPassword, setShowPassword] = useState(false);
  const [showConfirmPassword, setShowConfirmPassword] = useState(false);

  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  // Verification step state
  const [isVerifying, setIsVerifying] = useState(false);
  const [activeCode, setActiveCode] = useState<string>('');
  const [emailDeliveryNotice, setEmailDeliveryNotice] = useState<string | undefined>(undefined);
  const [verifyLoading, setVerifyLoading] = useState(false);

  // Send verification code
  const handleInitiateRegister = async (e: React.FormEvent) => {
    e.preventDefault();
    setError(null);

    const cleanUsername = username.trim();
    const cleanEmail = email.trim().toLowerCase();

    // Validations
    if (!cleanUsername || !cleanEmail || !password || !confirmPassword) {
      setError('يرجى ملء جميع الحقول المطلوبة');
      return;
    }

    if (cleanUsername.length < 3) {
      setError('اسم المستخدم يجب أن يتكون من 3 أحرف على الأقل');
      return;
    }

    const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
    if (!emailRegex.test(cleanEmail)) {
      setError('يرجى كتابة بريد إلكتروني صحيح وصالح');
      return;
    }

    if (password.length < 6) {
      setError('كلمة المرور يجب ألا تقل عن 6 خانات أو أحرف');
      return;
    }

    if (password !== confirmPassword) {
      setError('كلمة المرور وتأكيد كلمة المرور غير متطابقتين');
      return;
    }

    setLoading(true);

    try {
      // 1. Check if username or email already exists in Firestore
      const existingUser = await findUser(cleanUsername);
      if (existingUser) {
        setError('اسم المستخدم هذا مسجل مسبقاً، يرجى اختيار اسم آخر');
        setLoading(false);
        return;
      }

      const existingEmail = await findUser(cleanEmail);
      if (existingEmail) {
        setError('هذا البريد الإلكتروني مسجل بالفعل، يمكنك تسجيل الدخول');
        setLoading(false);
        return;
      }

      // 2. Generate 6-digit verification code
      const generatedCode = Math.floor(100000 + Math.random() * 900000).toString();
      setActiveCode(generatedCode);

      // 3. Store verification code in Firestore
      await saveVerificationCode(cleanEmail, generatedCode, 'register');

      // 4. Attempt sending email via Gmail in background (non-blocking)
      const html = generateEmailHtml(generatedCode, cleanUsername, 'register');
      sendEmailViaGmail({
        to: cleanEmail,
        subject: `رمز التحقق لمجمع عزم التعليمي (${generatedCode})`,
        htmlContent: html,
      }).catch((err) => {
        console.warn('Background email dispatch:', err);
      });

      setEmailDeliveryNotice(`تم إرسال رمز التحقق إلى: ${cleanEmail}`);
      setIsVerifying(true);
    } catch (err: unknown) {
      const msg = err instanceof Error ? err.message : String(err);
      setError(`حدث خطأ أثناء المعالجة: ${msg}`);
    } finally {
      setLoading(false);
    }
  };

  // Re-send verification code
  const handleResendCode = async () => {
    const cleanEmail = email.trim().toLowerCase();
    const newCode = Math.floor(100000 + Math.random() * 900000).toString();
    setActiveCode(newCode);

    await saveVerificationCode(cleanEmail, newCode, 'register');

    const html = generateEmailHtml(newCode, username.trim(), 'register');
    sendEmailViaGmail({
      to: cleanEmail,
      subject: `رمز التحقق الجديد لمجمع عزم التعليمي (${newCode})`,
      htmlContent: html,
    }).catch((err) => {
      console.warn('Background email resend:', err);
    });
  };

  // Complete registration after verifying code
  const handleVerifyCodeAndSave = async (enteredCode: string): Promise<boolean> => {
    setVerifyLoading(true);
    try {
      // 1. Check code matching against Firestore
      const verifyResult = await verifyCode(email.trim().toLowerCase(), enteredCode, 'register');
      if (!verifyResult.success && enteredCode !== activeCode) {
        return false;
      }

      // 2. Save user to Firestore permanently
      await createUserAccount({
        username: username.trim(),
        email: email.trim().toLowerCase(),
        password: password,
        createdAt: new Date().toISOString(),
        isVerified: true,
      });

      setIsVerifying(false);
      onSuccess(username.trim());
      return true;
    } catch (err) {
      console.error('Error saving user to Firestore:', err);
      return false;
    } finally {
      setVerifyLoading(false);
    }
  };

  return (
    <div>
      <form onSubmit={handleInitiateRegister} className="space-y-4">
        {/* Username */}
        <div>
          <label
            htmlFor="register-username"
            className="block text-xs sm:text-sm font-bold text-[#053B50] mb-1.5"
          >
            اسم المستخدم <span className="text-red-500">*</span>
          </label>
          <div className="relative">
            <div className="absolute inset-y-0 right-0 pr-3.5 flex items-center pointer-events-none text-[#053B50]/60">
              <User className="w-4 h-4" />
            </div>
            <input
              id="register-username"
              type="text"
              value={username}
              onChange={(e) => setUsername(e.target.value)}
              placeholder="مثال: Ahmed_Azm"
              className="w-full pr-10 pl-4 py-2.5 bg-[#FFFFFF] border-2 border-[#E8DAC8] focus:border-[#053B50] rounded-xl outline-none text-[#053B50] text-sm transition-colors"
            />
          </div>
        </div>

        {/* Email */}
        <div>
          <label
            htmlFor="register-email"
            className="block text-xs sm:text-sm font-bold text-[#053B50] mb-1.5"
          >
            البريد الإلكتروني <span className="text-red-500">*</span>
          </label>
          <div className="relative">
            <div className="absolute inset-y-0 right-0 pr-3.5 flex items-center pointer-events-none text-[#053B50]/60">
              <Mail className="w-4 h-4" />
            </div>
            <input
              id="register-email"
              type="email"
              dir="ltr"
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              placeholder="user@example.com"
              className="w-full pr-10 pl-4 py-2.5 bg-[#FFFFFF] border-2 border-[#E8DAC8] focus:border-[#053B50] rounded-xl outline-none text-[#053B50] text-sm transition-colors text-right"
            />
          </div>
          <span className="block text-[11px] text-[#053B50]/60 mt-1">
            سيتم إرسال رمز التحقق المكون من 6 أرقام إلى هذا البريد
          </span>
        </div>

        {/* Password */}
        <div>
          <label
            htmlFor="register-password"
            className="block text-xs sm:text-sm font-bold text-[#053B50] mb-1.5"
          >
            كلمة المرور <span className="text-red-500">*</span>
          </label>
          <div className="relative">
            <div className="absolute inset-y-0 right-0 pr-3.5 flex items-center pointer-events-none text-[#053B50]/60">
              <Lock className="w-4 h-4" />
            </div>
            <input
              id="register-password"
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

        {/* Confirm Password */}
        <div>
          <label
            htmlFor="register-confirm-password"
            className="block text-xs sm:text-sm font-bold text-[#053B50] mb-1.5"
          >
            تأكيد كلمة المرور <span className="text-red-500">*</span>
          </label>
          <div className="relative">
            <div className="absolute inset-y-0 right-0 pr-3.5 flex items-center pointer-events-none text-[#053B50]/60">
              <Lock className="w-4 h-4" />
            </div>
            <input
              id="register-confirm-password"
              type={showConfirmPassword ? 'text' : 'password'}
              value={confirmPassword}
              onChange={(e) => setConfirmPassword(e.target.value)}
              placeholder="••••••••"
              dir="ltr"
              className="w-full pr-10 pl-11 py-2.5 bg-[#FFFFFF] border-2 border-[#E8DAC8] focus:border-[#053B50] rounded-xl outline-none text-[#053B50] text-sm transition-colors text-right"
            />
            <button
              type="button"
              onClick={() => setShowConfirmPassword(!showConfirmPassword)}
              className="absolute inset-y-0 left-0 pl-3.5 flex items-center text-[#053B50]/60 hover:text-[#053B50] cursor-pointer"
            >
              {showConfirmPassword ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
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
              <span>جاري التحقق وإرسال الرمز...</span>
            </>
          ) : (
            <>
              <Send className="w-4 h-4 text-[#E8DAC8]" />
              <span>إرسال رمز التحقق للبريد</span>
            </>
          )}
        </button>

        {/* Switch to Login */}
        <div className="pt-2 text-center text-xs text-[#053B50]/80">
          <span>لديك حساب بالفعل في مجمع عزم؟ </span>
          <button
            type="button"
            onClick={onSwitchToLogin}
            className="text-[#053B50] font-bold underline hover:text-[#042E3F] cursor-pointer mr-1"
          >
            تسجيل الدخول
          </button>
        </div>
      </form>

      {/* Verification Modal overlay */}
      {isVerifying && (
        <VerificationModal
          email={email}
          username={username}
          expectedCode={activeCode}
          purpose="register"
          onVerify={handleVerifyCodeAndSave}
          onResend={handleResendCode}
          onBack={() => setIsVerifying(false)}
          isLoading={verifyLoading}
          emailSentStatus={emailDeliveryNotice}
        />
      )}
    </div>
  );
};
