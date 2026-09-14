import React, { useState, useEffect } from 'react';
import { motion } from 'motion/react';
import {
  KeyRound,
  Mail,
  Lock,
  Eye,
  EyeOff,
  AlertCircle,
  CheckCircle2,
  RefreshCw,
  X,
  ArrowLeft,
  ArrowRight,
  ShieldCheck,
  Copy,
  Check,
  User,
} from 'lucide-react';
import {
  findUser,
  saveVerificationCode,
  verifyCode,
  updateUserPassword,
  getSavedSenderToken,
} from '../lib/firebase';
import { sendEmailViaGmail, generateEmailHtml } from '../lib/gmail';

interface ForgotPasswordModalProps {
  isOpen?: boolean;
  onClose: () => void;
  onSuccess: () => void;
}

export const ForgotPasswordModal: React.FC<ForgotPasswordModalProps> = ({
  isOpen = true,
  onClose,
  onSuccess,
}) => {
  const [step, setStep] = useState<'input_identifier' | 'verify_and_reset' | 'completed'>('input_identifier');
  const [identifier, setIdentifier] = useState('');
  const [targetUserId, setTargetUserId] = useState('');
  const [targetEmail, setTargetEmail] = useState('');
  const [targetUsername, setTargetUsername] = useState('');

  const [activeCode, setActiveCode] = useState('');
  const [code, setCode] = useState('');
  const [newPassword, setNewPassword] = useState('');
  const [confirmPassword, setConfirmPassword] = useState('');
  const [showPassword, setShowPassword] = useState(false);

  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [emailNotice, setEmailNotice] = useState<string | null>(null);
  const [isEmailSentSuccess, setIsEmailSentSuccess] = useState(false);
  const [copiedCode, setCopiedCode] = useState(false);

  // Timer for resending verification code
  const [resendTimer, setResendTimer] = useState(60);
  const [isResending, setIsResending] = useState(false);

  // Prevent background scroll when modal is open
  useEffect(() => {
    if (isOpen) {
      const prev = document.body.style.overflow;
      document.body.style.overflow = 'hidden';
      return () => {
        document.body.style.overflow = prev;
      };
    }
  }, [isOpen]);

  // Resend cooldown timer
  useEffect(() => {
    if (step === 'verify_and_reset' && resendTimer > 0) {
      const timer = setInterval(() => {
        setResendTimer((prev) => prev - 1);
      }, 1000);
      return () => clearInterval(timer);
    }
  }, [step, resendTimer]);

  if (!isOpen) return null;

  // Step 1: Search user and send code
  const handleRequestCode = async (e: React.FormEvent) => {
    e.preventDefault();
    setError(null);
    const cleanId = identifier.trim();
    if (!cleanId) {
      setError('يرجى إدخال اسم المستخدم أو البريد الإلكتروني المسجل');
      return;
    }

    setLoading(true);
    try {
      const user = await findUser(cleanId);
      if (!user) {
        setError('لم يتم العثور على أي حساب مسجل بهذا الاسم أو البريد الإلكتروني. يرجى التأكد من كتابة الاسم بدقة.');
        setLoading(false);
        return;
      }

      const foundUserId = user.id || '';
      const foundEmail = user.email || '';
      const foundUsername = user.username || '';

      setTargetUserId(foundUserId);
      setTargetEmail(foundEmail);
      setTargetUsername(foundUsername);

      const generatedCode = Math.floor(100000 + Math.random() * 900000).toString();
      setActiveCode(generatedCode);

      // Persist code in Firestore
      if (foundEmail) {
        await saveVerificationCode(foundEmail, generatedCode, 'reset_password');
      }

      // Try sending email via Gmail
      let emailDispatched = false;
      try {
        const token = await getSavedSenderToken();
        if (token && foundEmail) {
          const res = await sendEmailViaGmail({
            to: foundEmail,
            subject: `رمز استعادة كلمة المرور - مجمع عزم التعليمي (${generatedCode})`,
            htmlContent: generateEmailHtml(generatedCode, foundUsername, 'reset_password'),
          });
          if (res.success) {
            emailDispatched = true;
          }
        }
      } catch (err) {
        console.warn('Gmail API dispatch attempt:', err);
      }

      setIsEmailSentSuccess(emailDispatched);
      if (emailDispatched) {
        setEmailNotice(`تم إرسال رمز التحقق بنجاح إلى بريدك الإلكتروني: ${foundEmail}`);
      } else {
        setEmailNotice(
          'تعذر الإرسال التلقائي للبريد عبر مزود الخدمة حالياً. لتسهيل الدخول الفوري، رمز التحقق الخاص بحسابك معروض بالأسفل.'
        );
      }

      setResendTimer(60);
      setStep('verify_and_reset');
    } catch (err: unknown) {
      const msg = err instanceof Error ? err.message : String(err);
      setError(`خطأ أثناء البحث عن الحساب: ${msg}`);
    } finally {
      setLoading(false);
    }
  };

  // Re-send code handler
  const handleResendCode = async () => {
    if (resendTimer > 0 || isResending) return;
    setIsResending(true);
    setError(null);
    try {
      const newCode = Math.floor(100000 + Math.random() * 900000).toString();
      setActiveCode(newCode);

      if (targetEmail) {
        await saveVerificationCode(targetEmail, newCode, 'reset_password');
      }

      let emailDispatched = false;
      try {
        const token = await getSavedSenderToken();
        if (token && targetEmail) {
          const res = await sendEmailViaGmail({
            to: targetEmail,
            subject: `رمز استعادة كلمة المرور الجديد - مجمع عزم التعليمي (${newCode})`,
            htmlContent: generateEmailHtml(newCode, targetUsername, 'reset_password'),
          });
          if (res.success) {
            emailDispatched = true;
          }
        }
      } catch (err) {
        console.warn('Gmail API resend attempt:', err);
      }

      setIsEmailSentSuccess(emailDispatched);
      if (emailDispatched) {
        setEmailNotice(`تم إرسال رمز جديد إلى بريدك الإلكتروني: ${targetEmail}`);
      } else {
        setEmailNotice('تم تحديث رمز التحقق الجديد بنجاح ومعروض بالأسفل لتسهيل المتابعة.');
      }
      setResendTimer(60);
    } catch (err: unknown) {
      const msg = err instanceof Error ? err.message : String(err);
      setError(`تعذر إعادة إرسال الرمز: ${msg}`);
    } finally {
      setIsResending(false);
    }
  };

  // Step 2: Reset password
  const handleResetPassword = async (e: React.FormEvent) => {
    e.preventDefault();
    setError(null);

    const cleanCode = code.trim();
    if (cleanCode.length !== 6) {
      setError('يرجى إدخال رمز التحقق المكون من 6 أرقام');
      return;
    }

    if (newPassword.length < 6) {
      setError('كلمة المرور الجديدة يجب ألا تقل عن 6 أحرف أو خانات');
      return;
    }

    if (newPassword !== confirmPassword) {
      setError('كلمة المرور الجديدة وتأكيدها غير متطابقتين');
      return;
    }

    setLoading(true);
    try {
      // 1. Verify code: check active session code first OR Firestore
      let isValidCode = cleanCode === activeCode;
      if (!isValidCode && targetEmail) {
        const verification = await verifyCode(targetEmail, cleanCode, 'reset_password');
        isValidCode = verification.success;
      }

      if (!isValidCode) {
        setError('رمز التحقق المدخل غير صحيح أو منتهي الصلاحية');
        setLoading(false);
        return;
      }

      // 2. Update password directly in Firestore
      const updated = await updateUserPassword(targetEmail || identifier, newPassword, targetUserId);
      if (!updated) {
        setError('تعذر تحديث كلمة المرور في قاعدة البيانات. يرجى المحاولة مرة أخرى.');
        setLoading(false);
        return;
      }

      setStep('completed');
    } catch (err: unknown) {
      const msg = err instanceof Error ? err.message : String(err);
      setError(`خطأ أثناء تحديث كلمة المرور: ${msg}`);
    } finally {
      setLoading(false);
    }
  };

  // Copy code utility
  const handleCopyCode = () => {
    if (activeCode) {
      navigator.clipboard.writeText(activeCode);
      setCopiedCode(true);
      setTimeout(() => setCopiedCode(false), 2000);
    }
  };

  return (
    <div className="fixed inset-0 z-[999] overflow-y-auto overflow-x-hidden bg-[#053B50]/75 backdrop-blur-sm flex min-h-full items-center justify-center p-3 sm:p-4">
      <motion.div
        initial={{ opacity: 0, scale: 0.95, y: 15 }}
        animate={{ opacity: 1, scale: 1, y: 0 }}
        exit={{ opacity: 0, scale: 0.95, y: 15 }}
        transition={{ duration: 0.22 }}
        className="relative w-full max-w-md bg-[#FFFFFF] rounded-2xl border-2 border-[#E8DAC8] shadow-2xl overflow-hidden my-auto z-10"
      >
        {/* Header Ribbon */}
        <div className="h-2 w-full bg-[#053B50]" />

        <div className="p-6 sm:p-7 relative">
          <button
            type="button"
            onClick={onClose}
            className="absolute top-4 left-4 text-[#053B50]/60 hover:text-[#053B50] p-1.5 rounded-lg hover:bg-[#F7F3EE] transition-colors cursor-pointer"
            aria-label="إغلاق النافذة"
          >
            <X className="w-5 h-5" />
          </button>

          {/* STEP 1: Find User */}
          {step === 'input_identifier' && (
            <div>
              <div className="text-center mb-6">
                <div className="w-12 h-12 bg-[#F7F3EE] border border-[#E8DAC8] rounded-full flex items-center justify-center mx-auto mb-2.5 text-[#053B50]">
                  <KeyRound className="w-6 h-6" />
                </div>
                <h3 className="text-xl font-black text-[#053B50]">
                  استعادة كلمة المرور
                </h3>
                <p className="text-xs text-[#053B50]/75 mt-1">
                  أدخل اسم المستخدم أو البريد الإلكتروني المسجل في البوابة
                </p>
              </div>

              <form onSubmit={handleRequestCode} className="space-y-4">
                <div>
                  <label
                    htmlFor="forgot-identifier-input"
                    className="block text-xs font-bold text-[#053B50] mb-1.5"
                  >
                    اسم المستخدم أو البريد الإلكتروني
                  </label>
                  <div className="relative">
                    <input
                      id="forgot-identifier-input"
                      type="text"
                      value={identifier}
                      onChange={(e) => setIdentifier(e.target.value)}
                      placeholder="مثال: azm_user أو email@example.com"
                      className="w-full pr-3 pl-9 py-2.5 bg-[#FFFFFF] border-2 border-[#E8DAC8] focus:border-[#053B50] rounded-xl outline-none text-[#053B50] text-sm"
                      autoFocus
                    />
                    <User className="w-4 h-4 text-[#053B50]/50 absolute left-3 top-3 pointer-events-none" />
                  </div>
                  <p className="text-[11px] text-[#053B50]/60 mt-1">
                    يمكنك البحث باسم المستخدم أو بالبريد الإلكتروني
                  </p>
                </div>

                {error && (
                  <div className="p-3 rounded-xl bg-red-50 border border-red-200 text-red-700 text-xs flex items-start gap-2">
                    <AlertCircle className="w-4 h-4 text-red-600 shrink-0 mt-0.5" />
                    <span>{error}</span>
                  </div>
                )}

                <button
                  type="submit"
                  disabled={loading || !identifier.trim()}
                  className="w-full bg-[#053B50] hover:bg-[#042E3F] text-[#FFFFFF] font-bold py-3 px-4 rounded-xl transition-colors shadow-md disabled:opacity-50 flex items-center justify-center gap-2 cursor-pointer text-sm"
                >
                  {loading ? (
                    <>
                      <RefreshCw className="w-4 h-4 animate-spin text-[#E8DAC8]" />
                      <span>جاري البحث عن الحساب...</span>
                    </>
                  ) : (
                    <span>متابعة والتحقق من الحساب</span>
                  )}
                </button>
              </form>
            </div>
          )}

          {/* STEP 2: Verify Code & Reset Password */}
          {step === 'verify_and_reset' && (
            <div>
              <div className="text-center mb-4">
                <div className="w-11 h-11 bg-[#F7F3EE] border border-[#E8DAC8] rounded-full flex items-center justify-center mx-auto mb-2 text-[#053B50]">
                  <Lock className="w-5 h-5" />
                </div>
                <h3 className="text-xl font-black text-[#053B50]">
                  تعيين كلمة المرور الجديدة
                </h3>
                <div className="mt-1 inline-flex items-center gap-1.5 px-3 py-1 bg-[#F7F3EE] border border-[#E8DAC8] rounded-lg text-xs text-[#053B50]">
                  <User className="w-3.5 h-3.5 text-[#053B50]/70" />
                  <span className="font-bold">{targetUsername}</span>
                  {targetEmail && (
                    <span dir="ltr" className="text-[#053B50]/70">({targetEmail})</span>
                  )}
                </div>
              </div>

              {/* Status Notice Alert */}
              {emailNotice && (
                <div
                  className={`mb-3.5 p-3 rounded-xl text-xs flex items-start gap-2 border ${
                    isEmailSentSuccess
                      ? 'bg-emerald-50 border-emerald-200 text-emerald-800'
                      : 'bg-amber-50 border-amber-200 text-amber-900'
                  }`}
                >
                  {isEmailSentSuccess ? (
                    <CheckCircle2 className="w-4 h-4 text-emerald-600 shrink-0 mt-0.5" />
                  ) : (
                    <ShieldCheck className="w-4 h-4 text-amber-600 shrink-0 mt-0.5" />
                  )}
                  <span>{emailNotice}</span>
                </div>
              )}

              {/* Instant Verification Code Card (shown if email service is not connected/sent) */}
              {(!isEmailSentSuccess && activeCode) && (
                <div className="mb-4 p-3.5 bg-[#F7F3EE] border-2 border-dashed border-[#053B50]/30 rounded-xl">
                  <div className="flex items-center justify-between mb-1.5">
                    <span className="text-xs font-bold text-[#053B50]">
                      رمز التحقق المباشر لحسابك:
                    </span>
                    <button
                      type="button"
                      onClick={() => setCode(activeCode)}
                      className="text-[11px] text-[#053B50] font-bold underline hover:text-[#042E3F] cursor-pointer"
                    >
                      تعبئة الرمز تلقائياً
                    </button>
                  </div>
                  <div className="flex items-center justify-between bg-[#FFFFFF] border border-[#E8DAC8] px-3.5 py-2 rounded-lg">
                    <span dir="ltr" className="font-mono text-xl font-black text-[#053B50] tracking-[8px]">
                      {activeCode}
                    </span>
                    <button
                      type="button"
                      onClick={handleCopyCode}
                      className="p-1.5 text-[#053B50]/70 hover:text-[#053B50] rounded-md hover:bg-[#F7F3EE] transition-colors cursor-pointer"
                      title="نسخ الرمز"
                    >
                      {copiedCode ? <Check className="w-4 h-4 text-emerald-600" /> : <Copy className="w-4 h-4" />}
                    </button>
                  </div>
                </div>
              )}

              <form onSubmit={handleResetPassword} className="space-y-3.5">
                {/* 6-digit Code */}
                <div>
                  <div className="flex items-center justify-between mb-1">
                    <label
                      htmlFor="reset-code-input"
                      className="block text-xs font-bold text-[#053B50]"
                    >
                      أدخل رمز التحقق (6 أرقام)
                    </label>
                    <button
                      type="button"
                      onClick={handleResendCode}
                      disabled={resendTimer > 0 || isResending}
                      className="text-[11px] text-[#053B50] font-semibold hover:underline disabled:text-[#053B50]/40 disabled:no-underline cursor-pointer flex items-center gap-1"
                    >
                      {isResending ? (
                        <span>جاري الإرسال...</span>
                      ) : resendTimer > 0 ? (
                        <span>إعادة الإرسال بعد ({resendTimer}ث)</span>
                      ) : (
                        <>
                          <RefreshCw className="w-3 h-3" />
                          <span>إعادة إرسال رمز جديد</span>
                        </>
                      )}
                    </button>
                  </div>
                  <input
                    id="reset-code-input"
                    type="text"
                    maxLength={6}
                    value={code}
                    onChange={(e) => setCode(e.target.value.replace(/\D/g, ''))}
                    placeholder="------"
                    dir="ltr"
                    className="w-full text-center tracking-[12px] font-mono text-xl font-bold py-2.5 px-3 bg-[#FFFFFF] border-2 border-[#E8DAC8] focus:border-[#053B50] rounded-xl outline-none text-[#053B50]"
                    autoFocus
                  />
                </div>

                {/* New Password */}
                <div>
                  <label
                    htmlFor="new-password-input"
                    className="block text-xs font-bold text-[#053B50] mb-1"
                  >
                    كلمة المرور الجديدة
                  </label>
                  <div className="relative">
                    <input
                      id="new-password-input"
                      type={showPassword ? 'text' : 'password'}
                      value={newPassword}
                      onChange={(e) => setNewPassword(e.target.value)}
                      placeholder="6 خانات على الأقل"
                      dir="ltr"
                      className="w-full pr-3 pl-9 py-2 bg-[#FFFFFF] border-2 border-[#E8DAC8] focus:border-[#053B50] rounded-xl outline-none text-[#053B50] text-sm text-right"
                    />
                    <button
                      type="button"
                      onClick={() => setShowPassword(!showPassword)}
                      className="absolute inset-y-0 left-0 pl-3 flex items-center text-[#053B50]/60 hover:text-[#053B50] cursor-pointer"
                    >
                      {showPassword ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
                    </button>
                  </div>
                </div>

                {/* Confirm New Password */}
                <div>
                  <label
                    htmlFor="confirm-new-password-input"
                    className="block text-xs font-bold text-[#053B50] mb-1"
                  >
                    تأكيد كلمة المرور الجديدة
                  </label>
                  <input
                    id="confirm-new-password-input"
                    type={showPassword ? 'text' : 'password'}
                    value={confirmPassword}
                    onChange={(e) => setConfirmPassword(e.target.value)}
                    placeholder="أعد كتابة كلمة المرور"
                    dir="ltr"
                    className="w-full px-3 py-2 bg-[#FFFFFF] border-2 border-[#E8DAC8] focus:border-[#053B50] rounded-xl outline-none text-[#053B50] text-sm text-right"
                  />
                </div>

                {error && (
                  <div className="p-2.5 rounded-lg bg-red-50 border border-red-200 text-red-700 text-xs flex items-center gap-1.5">
                    <AlertCircle className="w-4 h-4 text-red-600 shrink-0" />
                    <span>{error}</span>
                  </div>
                )}

                <button
                  type="submit"
                  disabled={loading || code.length !== 6 || !newPassword}
                  className="w-full bg-[#053B50] hover:bg-[#042E3F] text-[#FFFFFF] font-bold py-2.5 px-4 rounded-xl transition-colors shadow-md disabled:opacity-50 flex items-center justify-center gap-2 cursor-pointer text-sm"
                >
                  {loading ? (
                    <>
                      <RefreshCw className="w-4 h-4 animate-spin text-[#E8DAC8]" />
                      <span>جاري تحديث كلمة المرور...</span>
                    </>
                  ) : (
                    <span>تأكيد وتحديث كلمة المرور</span>
                  )}
                </button>
              </form>

              <div className="mt-4 text-center">
                <button
                  type="button"
                  onClick={() => {
                    setStep('input_identifier');
                    setError(null);
                  }}
                  className="text-xs text-[#053B50]/70 hover:text-[#053B50] underline cursor-pointer flex items-center justify-center gap-1 mx-auto"
                >
                  <ArrowRight className="w-3.5 h-3.5" />
                  <span>الرجوع للبحث عن حساب آخر</span>
                </button>
              </div>
            </div>
          )}

          {/* STEP 3: Completed Successfully */}
          {step === 'completed' && (
            <div className="text-center py-4">
              <div className="w-14 h-14 bg-emerald-50 border-2 border-emerald-200 rounded-full flex items-center justify-center mx-auto mb-3 text-emerald-600">
                <CheckCircle2 className="w-8 h-8" />
              </div>
              <h3 className="text-xl font-black text-[#053B50] mb-2">
                تم تغيير كلمة المرور بنجاح!
              </h3>
              <p className="text-xs text-[#053B50]/80 mb-6">
                تم تحديث كلمة المرور الخاصة بحسابك في مجمع عزم التعليمي بنجاح. يمكنك الآن استخدام كلمة المرور الجديدة لتسجيل الدخول.
              </p>
              <button
                type="button"
                onClick={onSuccess}
                className="w-full bg-[#053B50] hover:bg-[#042E3F] text-[#FFFFFF] font-bold py-2.5 px-4 rounded-xl transition-colors shadow-md cursor-pointer text-sm flex items-center justify-center gap-2"
              >
                <span>الانتقال لتسجيل الدخول</span>
                <ArrowLeft className="w-4 h-4" />
              </button>
            </div>
          )}
        </div>
      </motion.div>
    </div>
  );
};
