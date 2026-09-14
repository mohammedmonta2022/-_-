import React, { useState } from 'react';
import { motion } from 'motion/react';
import { KeyRound, Mail, Lock, Eye, EyeOff, AlertCircle, CheckCircle2, RefreshCw, X, ArrowLeft, HelpCircle } from 'lucide-react';
import { findUser, saveVerificationCode, verifyCode, updateUserPassword, getSavedSenderToken, authorizeSenderEmail } from '../lib/firebase';
import { sendEmailViaGmail, generateEmailHtml } from '../lib/gmail';

interface ForgotPasswordModalProps {
  isOpen: boolean;
  onClose: () => void;
  onSuccess: () => void;
}

export const ForgotPasswordModal: React.FC<ForgotPasswordModalProps> = ({
  isOpen,
  onClose,
  onSuccess,
}) => {
  const [step, setStep] = useState<'input_identifier' | 'verify_and_reset' | 'completed'>('input_identifier');
  const [identifier, setIdentifier] = useState('');
  const [targetEmail, setTargetEmail] = useState('');
  const [targetUsername, setTargetUsername] = useState('');

  const [code, setCode] = useState('');
  const [newPassword, setNewPassword] = useState('');
  const [confirmPassword, setConfirmPassword] = useState('');
  const [showPassword, setShowPassword] = useState(false);

  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [activeCodePreview, setActiveCodePreview] = useState<string | undefined>(undefined);
  const [emailNotice, setEmailNotice] = useState<string | undefined>(undefined);

  const [isSendingGmail, setIsSendingGmail] = useState(false);
  const [gmailSentSuccess, setGmailSentSuccess] = useState<string | null>(null);
  const [showFallbackCode, setShowFallbackCode] = useState(false);

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
        setError('لم يتم العثور على أي حساب مسجل بهذا الاسم أو البريد');
        setLoading(false);
        return;
      }

      setTargetEmail(user.email);
      setTargetUsername(user.username);

      // Generate random 6-digit code
      const generatedCode = Math.floor(100000 + Math.random() * 900000).toString();
      setActiveCodePreview(generatedCode);

      // Save code in Firestore
      await saveVerificationCode(user.email, generatedCode, 'reset_password');

      // Attempt automatic dispatch via Gmail if token already saved in Firestore
      const token = await getSavedSenderToken();
      if (token) {
        sendEmailViaGmail({
          to: user.email,
          subject: `رمز إعادة تعيين كلمة المرور - مجمع عزم التعليمي (${generatedCode})`,
          htmlContent: generateEmailHtml(generatedCode, user.username, 'reset_password'),
        }).then((res) => {
          if (res.success) {
            setGmailSentSuccess(`تم إرسال الرمز تلقائياً إلى بريدك: ${user.email}`);
          }
        });
      }

      setEmailNotice(`تم إنشاء رمز الأمان وإرساله إلى ${user.email}`);
      setStep('verify_and_reset');
    } catch (err: unknown) {
      const msg = err instanceof Error ? err.message : String(err);
      setError(`خطأ أثناء البحث عن الحساب: ${msg}`);
    } finally {
      setLoading(false);
    }
  };

  // Dispatch via Gmail manually
  const handleSendGmailDirectly = async () => {
    if (!activeCodePreview || !targetEmail) return;
    setIsSendingGmail(true);
    setError(null);
    setGmailSentSuccess(null);

    try {
      let token = await getSavedSenderToken();
      if (!token) {
        const authRes = await authorizeSenderEmail(targetEmail);
        if (!authRes.success) {
          throw new Error(authRes.error || 'تعذر الحصول على تفويض Google');
        }
        token = await getSavedSenderToken();
      }

      if (!token) {
        setError('يرجى تسجيل الدخول بحساب Google للسماح بإرسال البريد وحفظ التفويض في فايربيس');
        setIsSendingGmail(false);
        return;
      }

      const html = generateEmailHtml(activeCodePreview, targetUsername, 'reset_password');
      const res = await sendEmailViaGmail({
        to: targetEmail,
        subject: `رمز إعادة تعيين كلمة المرور - مجمع عزم التعليمي (${activeCodePreview})`,
        htmlContent: html,
      });

      if (res.success) {
        setGmailSentSuccess(`تم إرسال البريد بنجاح إلى ${targetEmail}! تفقّد صندوق الوارد الآن.`);
      } else {
        setError(res.error || 'تعذر إرسال البريد عبر Gmail');
        setShowFallbackCode(true);
      }
    } catch (err: unknown) {
      const msg = err instanceof Error ? err.message : String(err);
      if (
        msg.includes('403') ||
        msg.includes('access_denied') ||
        msg.includes('popup-closed') ||
        msg.includes('blocked')
      ) {
        setError(
          'تطبيق Google في وضع الاختبار (Testing Mode) ويحظر الحسابات غير المسجلة في Google Cloud. يمكنك استخدام رمز التحقق المباشر أدناه لتخطي الحظر.'
        );
      } else {
        setError(`خطأ أثناء إرسال البريد: ${msg}`);
      }
      setShowFallbackCode(true);
    } finally {
      setIsSendingGmail(false);
    }
  };

  // Step 2: Verify code and update password
  const handleResetPassword = async (e: React.FormEvent) => {
    e.preventDefault();
    setError(null);

    const cleanCode = code.trim();
    if (cleanCode.length !== 6) {
      setError('يرجى إدخال رمز التحقق المكون من 6 أرقام');
      return;
    }

    if (newPassword.length < 6) {
      setError('كلمة المرور الجديدة يجب ألا تقل عن 6 خانات أو أحرف');
      return;
    }

    if (newPassword !== confirmPassword) {
      setError('كلمة المرور الجديدة وتأكيدها غير متطابقتين');
      return;
    }

    setLoading(true);
    try {
      const verification = await verifyCode(targetEmail, cleanCode, 'reset_password');
      if (!verification.success) {
        setError(verification.message);
        setLoading(false);
        return;
      }

      // Update password in Firestore
      const updated = await updateUserPassword(targetEmail, newPassword);
      if (!updated) {
        setError('تعذر تحديث كلمة المرور في قاعدة البيانات');
        setLoading(false);
        return;
      }

      setStep('completed');
    } catch (err: unknown) {
      const msg = err instanceof Error ? err.message : String(err);
      setError(`خطأ: ${msg}`);
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-[#053B50]/60 backdrop-blur-xs">
      <motion.div
        initial={{ opacity: 0, scale: 0.95, y: 15 }}
        animate={{ opacity: 1, scale: 1, y: 0 }}
        exit={{ opacity: 0, scale: 0.95, y: 15 }}
        transition={{ duration: 0.25 }}
        className="w-full max-w-md bg-[#FFFFFF] rounded-2xl border-2 border-[#E8DAC8] shadow-2xl overflow-hidden"
      >
        {/* Header Ribbon */}
        <div className="h-2 w-full bg-[#053B50]" />

        <div className="p-6 sm:p-7 relative">
          <button
            type="button"
            onClick={onClose}
            className="absolute top-4 left-4 text-[#053B50]/60 hover:text-[#053B50] p-1.5 rounded-lg hover:bg-[#F7F3EE] transition-colors cursor-pointer"
          >
            <X className="w-5 h-5" />
          </button>

          {/* STEP 1: Find User */}
          {step === 'input_identifier' && (
            <div>
              <div className="text-center mb-6">
                <div className="w-12 h-12 bg-[#F7F3EE] border border-[#E8DAC8] rounded-full flex items-center justify-center mx-auto mb-2 text-[#053B50]">
                  <KeyRound className="w-6 h-6" />
                </div>
                <h3 className="text-xl font-black text-[#053B50]">
                  استعادة كلمة المرور
                </h3>
                <p className="text-xs text-[#053B50]/75 mt-1">
                  أدخل اسم المستخدم أو البريد الإلكتروني للبحث عن حسابك
                </p>
              </div>

              <form onSubmit={handleRequestCode} className="space-y-4">
                <div>
                  <label
                    htmlFor="forgot-identifier-input"
                    className="block text-xs font-bold text-[#053B50] mb-1.5"
                  >
                    اسم المستخدم أو البريد
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
                    <Mail className="w-4 h-4 text-[#053B50]/50 absolute left-3 top-3 pointer-events-none" />
                  </div>
                </div>

                {error && (
                  <div className="p-2.5 rounded-lg bg-red-50 border border-red-200 text-red-700 text-xs flex items-center gap-1.5">
                    <AlertCircle className="w-4 h-4 text-red-600 shrink-0" />
                    <span>{error}</span>
                  </div>
                )}

                <button
                  type="submit"
                  disabled={loading || !identifier.trim()}
                  className="w-full bg-[#053B50] hover:bg-[#042E3F] text-[#FFFFFF] font-bold py-2.5 px-4 rounded-xl transition-colors shadow-md disabled:opacity-50 flex items-center justify-center gap-2 cursor-pointer text-sm"
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
                <p className="text-xs text-[#053B50]/75 mt-0.5">
                  تم إعداد رمز التحقق لـ: <span className="font-bold" dir="ltr">{targetEmail}</span>
                </p>
              </div>

              {emailNotice && (
                <div className="mb-3.5 p-2.5 rounded-lg bg-emerald-50 border border-emerald-200 text-emerald-800 text-xs">
                  {emailNotice}
                </div>
              )}

              {/* Real Gmail Dispatch Button */}
              <div className="mb-3.5">
                <button
                  type="button"
                  onClick={handleSendGmailDirectly}
                  disabled={isSendingGmail}
                  className="w-full bg-[#FFFFFF] hover:bg-[#F7F3EE] text-[#053B50] border-2 border-[#053B50] font-bold py-2 px-3 rounded-xl transition-all text-xs flex items-center justify-center gap-2 cursor-pointer disabled:opacity-50"
                >
                  {isSendingGmail ? (
                    <>
                      <RefreshCw className="w-3.5 h-3.5 animate-spin text-[#053B50]" />
                      <span>جاري إرسال البريد عبر Gmail API...</span>
                    </>
                  ) : (
                    <>
                      <Mail className="w-3.5 h-3.5 text-[#EA4335]" />
                      <span>إرسال الرمز فعلياً عبر Gmail إلى بريدي</span>
                    </>
                  )}
                </button>
              </div>

              {gmailSentSuccess && (
                <div className="mb-3.5 p-2 rounded-lg bg-emerald-50 border border-emerald-200 text-emerald-800 text-xs flex items-center gap-1.5">
                  <CheckCircle2 className="w-4 h-4 text-emerald-600 shrink-0" />
                  <span>{gmailSentSuccess}</span>
                </div>
              )}

              {/* Fallback Revealed Code if blocked */}
              {showFallbackCode && activeCodePreview && (
                <motion.div
                  initial={{ opacity: 0, y: -8 }}
                  animate={{ opacity: 1, y: 0 }}
                  className="mb-3.5 p-3 rounded-xl bg-amber-50 border border-amber-200 text-amber-900 text-xs"
                >
                  <div className="flex items-center justify-between mb-1">
                    <span className="font-bold flex items-center gap-1">
                      <HelpCircle className="w-3.5 h-3.5 text-amber-700" />
                      رمز التحقق المباشر لحسابك:
                    </span>
                    <span className="font-mono font-black text-lg tracking-widest text-[#053B50]">
                      {activeCodePreview}
                    </span>
                  </div>
                  <p className="text-[11px] text-amber-800/80 leading-relaxed">
                    تم توفير الرمز لتجاوز حظر Google 403 ومتابعة تغيير كلمة المرور فوراً.
                  </p>
                </motion.div>
              )}

              <form onSubmit={handleResetPassword} className="space-y-3.5">
                {/* 6-digit Code */}
                <div>
                  <label
                    htmlFor="reset-code-input"
                    className="block text-xs font-bold text-[#053B50] mb-1 text-center"
                  >
                    رمز التحقق (6 أرقام)
                  </label>
                  <input
                    id="reset-code-input"
                    type="text"
                    maxLength={6}
                    value={code}
                    onChange={(e) => setCode(e.target.value.replace(/\D/g, ''))}
                    placeholder="------"
                    dir="ltr"
                    className="w-full text-center tracking-[12px] font-mono text-xl font-bold py-2 px-3 bg-[#FFFFFF] border-2 border-[#E8DAC8] focus:border-[#053B50] rounded-xl outline-none text-[#053B50]"
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
                      <span>جاري التحديث والحفظ...</span>
                    </>
                  ) : (
                    <span>تحديث كلمة المرور والدخول</span>
                  )}
                </button>
              </form>

              {/* Direct code toggle if Google 403 occurs */}
              {!showFallbackCode && activeCodePreview && (
                <div className="mt-3 text-center">
                  <button
                    type="button"
                    onClick={() => setShowFallbackCode(true)}
                    className="text-[11px] text-[#053B50]/60 hover:text-[#053B50] underline cursor-pointer inline-flex items-center gap-1"
                  >
                    <Eye className="w-3 h-3" />
                    <span>واجهت حظر Google أو لم يصلك البريد؟ اضغط هنا لعرض الرمز</span>
                  </button>
                </div>
              )}

              <div className="mt-4 text-center">
                <button
                  type="button"
                  onClick={() => setStep('input_identifier')}
                  className="text-xs text-[#053B50]/70 hover:text-[#053B50] underline cursor-pointer"
                >
                  الرجوع للبحث عن حساب آخر
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
