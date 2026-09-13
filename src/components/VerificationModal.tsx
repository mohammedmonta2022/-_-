import React, { useState, useEffect } from 'react';
import { motion } from 'motion/react';
import { ShieldCheck, Mail, ArrowRight, RefreshCw, AlertCircle, CheckCircle2, HelpCircle, Eye } from 'lucide-react';
import { googleSignIn, getAccessToken } from '../lib/firebase';
import { sendEmailViaGmail, generateEmailHtml } from '../lib/gmail';

interface VerificationModalProps {
  email: string;
  expectedCode?: string;
  purpose: 'register' | 'reset_password';
  username?: string;
  onVerify: (code: string) => Promise<boolean>;
  onResend: () => Promise<string | void>;
  onBack: () => void;
  isLoading: boolean;
  emailSentStatus?: string;
}

export const VerificationModal: React.FC<VerificationModalProps> = ({
  email,
  expectedCode,
  purpose,
  username = '',
  onVerify,
  onResend,
  onBack,
  isLoading,
  emailSentStatus,
}) => {
  const [code, setCode] = useState('');
  const [error, setError] = useState<string | null>(null);
  const [resendTimer, setResendTimer] = useState(60);
  const [resending, setResending] = useState(false);
  const [hasGoogleAuth, setHasGoogleAuth] = useState(false);
  const [isSendingToGmail, setIsSendingToGmail] = useState(false);
  const [sendSuccessMsg, setSendSuccessMsg] = useState<string | null>(
    emailSentStatus || `تم إعداد رمز التحقق لبريدك: ${email}`
  );
  const [showFallbackCode, setShowFallbackCode] = useState(false);

  // Check Google Auth token and auto-send if already authorized
  useEffect(() => {
    const token = getAccessToken();
    setHasGoogleAuth(Boolean(token));
    if (token && expectedCode) {
      sendEmailViaGmail({
        to: email,
        subject: `رمز التحقق لمجمع عزم التعليمي (${expectedCode})`,
        htmlContent: generateEmailHtml(expectedCode, username, purpose),
      }).then((res) => {
        if (res.success) {
          setSendSuccessMsg(`تم إرسال رمز التحقق بنجاح إلى ${email}! تفقّد صندوق الوارد.`);
        }
      });
    }
  }, [email, expectedCode, username, purpose]);

  useEffect(() => {
    if (resendTimer > 0) {
      const interval = setInterval(() => {
        setResendTimer((prev) => prev - 1);
      }, 1000);
      return () => clearInterval(interval);
    }
  }, [resendTimer]);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError(null);
    const cleanCode = code.trim();
    if (cleanCode.length !== 6) {
      setError('يرجى إدخال رمز التحقق المكون من 6 أرقام');
      return;
    }

    const success = await onVerify(cleanCode);
    if (!success) {
      setError('رمز التحقق غير صحيح، يُرجى التأكد وإعادة المحاولة');
    }
  };

  const handleSendViaGmailDirectly = async () => {
    if (!expectedCode) return;
    setIsSendingToGmail(true);
    setError(null);
    setSendSuccessMsg(null);

    try {
      let token = getAccessToken();
      if (!token) {
        const authRes = await googleSignIn();
        token = authRes?.accessToken || null;
        if (token) setHasGoogleAuth(true);
      }

      if (!token) {
        setError('يرجى تأكيد تسجيل الدخول بحساب Google لإرسال البريد');
        setIsSendingToGmail(false);
        return;
      }

      const html = generateEmailHtml(expectedCode, username, purpose);
      const res = await sendEmailViaGmail({
        to: email,
        subject: `رمز التحقق لمجمع عزم التعليمي (${expectedCode})`,
        htmlContent: html,
      });

      if (res.success) {
        setSendSuccessMsg(`تم إرسال البريد بنجاح إلى ${email}! تفقّد صندوق الوارد (Inbox) أو الرسائل غير المرغوب فيها.`);
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
          'تطبيق Google في وضع الاختبار (Testing Mode) ويحظر الحسابات غير المسجلة في لوحة تحكم Google. يمكنك استخدام رمز التحقق المباشر أدناه لتخطي الحظر فوراً.'
        );
      } else {
        setError(`خطأ أثناء إرسال البريد: ${msg}`);
      }
      setShowFallbackCode(true);
    } finally {
      setIsSendingToGmail(false);
    }
  };

  const handleResendClick = async () => {
    if (resendTimer > 0 || resending) return;
    setResending(true);
    setError(null);
    setSendSuccessMsg(null);
    try {
      await onResend();
      setResendTimer(60);
      setSendSuccessMsg(`تم إنشاء رمز جديد وإعادة الإرسال إلى ${email}`);
    } catch {
      setError('تعذر إعادة إرسال الرمز حالياً، يرجى المحاولة لاحقاً');
    } finally {
      setResending(false);
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
        {/* Top Header Ribbon */}
        <div className="h-2 w-full bg-[#053B50]" />

        <div className="p-6 sm:p-8">
          {/* Icon and Title */}
          <div className="text-center mb-5">
            <div className="w-14 h-14 bg-[#F7F3EE] border-2 border-[#E8DAC8] rounded-full flex items-center justify-center mx-auto mb-3 text-[#053B50]">
              <ShieldCheck className="w-7 h-7" />
            </div>
            <h3 className="text-2xl font-black text-[#053B50]">
              رمز التحقق من البريد
            </h3>
            <p className="text-xs sm:text-sm text-[#053B50]/75 mt-1 font-medium">
              {purpose === 'register'
                ? 'تم إرسال رمز التحقق لتأكيد إنشاء حسابك'
                : 'تم إرسال رمز التحقق لتغيير كلمة المرور'}
            </p>
          </div>

          {/* Email Destination Box */}
          <div className="bg-[#F7F3EE] border border-[#E8DAC8] rounded-xl p-3 mb-4 flex items-center gap-2.5 text-xs text-[#053B50]">
            <Mail className="w-4 h-4 text-[#053B50] shrink-0" />
            <div className="flex-1 overflow-hidden">
              <span className="block text-[11px] text-[#053B50]/70 font-semibold">
                البريد المستلم:
              </span>
              <span dir="ltr" className="block font-bold truncate">
                {email}
              </span>
            </div>
          </div>

          {/* Gmail API Send Button */}
          <div className="mb-4">
            <button
              type="button"
              onClick={handleSendViaGmailDirectly}
              disabled={isSendingToGmail}
              className="w-full bg-[#FFFFFF] hover:bg-[#F7F3EE] text-[#053B50] border-2 border-[#053B50] font-bold py-2.5 px-3 rounded-xl transition-all text-xs flex items-center justify-center gap-2 cursor-pointer disabled:opacity-50"
            >
              {isSendingToGmail ? (
                <>
                  <RefreshCw className="w-3.5 h-3.5 animate-spin text-[#053B50]" />
                  <span>جاري إرسال البريد عبر Gmail API...</span>
                </>
              ) : (
                <>
                  <Mail className="w-3.5 h-3.5 text-[#EA4335]" />
                  <span>
                    {hasGoogleAuth
                      ? `إرسال رسالة بريد إلكتروني عبر Gmail إلى ${email}`
                      : 'تأكيد إرسال الرسالة إلى بريدي عبر Gmail'}
                  </span>
                </>
              )}
            </button>
          </div>

          {/* Success Message Alert */}
          {sendSuccessMsg && (
            <div className="mb-4 p-2.5 rounded-lg bg-emerald-50 border border-emerald-200 text-emerald-800 text-xs flex items-center gap-2">
              <CheckCircle2 className="w-4 h-4 text-emerald-600 shrink-0" />
              <span>{sendSuccessMsg}</span>
            </div>
          )}

          {/* Fallback Revealed Code (Protects user from Google 403 blocks) */}
          {showFallbackCode && expectedCode && (
            <motion.div
              initial={{ opacity: 0, y: -8 }}
              animate={{ opacity: 1, y: 0 }}
              className="mb-4 p-3 rounded-xl bg-amber-50 border border-amber-200 text-amber-900 text-xs"
            >
              <div className="flex items-center justify-between mb-1">
                <span className="font-bold flex items-center gap-1">
                  <HelpCircle className="w-3.5 h-3.5 text-amber-700" />
                  رمز التحقق المباشر لحسابك:
                </span>
                <span className="font-mono font-black text-lg tracking-widest text-[#053B50]">
                  {expectedCode}
                </span>
              </div>
              <p className="text-[11px] text-amber-800/80 leading-relaxed">
                تم توفير الرمز لتجاوز قيود حسابات الاختبار في Google OAuth دون تعطيل التسجيل.
              </p>
            </motion.div>
          )}

          {/* Verification Code Form */}
          <form onSubmit={handleSubmit} className="space-y-4">
            <div>
              <label
                htmlFor="verification-code-input"
                className="block text-xs sm:text-sm font-bold text-[#053B50] mb-2 text-center"
              >
                أدخل رمز التحقق (6 أرقام) من بريدك الإلكتروني
              </label>
              <input
                id="verification-code-input"
                type="text"
                maxLength={6}
                value={code}
                onChange={(e) => setCode(e.target.value.replace(/\D/g, ''))}
                placeholder="------"
                dir="ltr"
                className="w-full text-center tracking-[12px] sm:tracking-[16px] text-2xl font-mono font-extrabold py-3 px-4 bg-[#FFFFFF] border-2 border-[#E8DAC8] focus:border-[#053B50] rounded-xl outline-none text-[#053B50] transition-colors"
                autoFocus
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
              disabled={isLoading || code.length !== 6}
              className="w-full bg-[#053B50] hover:bg-[#042E3F] text-[#FFFFFF] font-bold py-3 px-4 rounded-xl transition-all shadow-md hover:shadow-lg disabled:opacity-50 disabled:cursor-not-allowed flex items-center justify-center gap-2 cursor-pointer text-sm"
            >
              {isLoading ? (
                <>
                  <RefreshCw className="w-4 h-4 animate-spin text-[#E8DAC8]" />
                  <span>جاري التحقق وحفظ البيانات...</span>
                </>
              ) : (
                <span>تأكيد والتحقق من الرمز</span>
              )}
            </button>
          </form>

          {/* Option to show code if user has Google 403 or email delay */}
          {!showFallbackCode && expectedCode && (
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

          {/* Resend and Back Buttons */}
          <div className="mt-5 pt-4 border-t border-[#E8DAC8] flex items-center justify-between text-xs">
            <button
              type="button"
              onClick={onBack}
              className="text-[#053B50]/70 hover:text-[#053B50] font-semibold flex items-center gap-1 cursor-pointer transition-colors"
            >
              <ArrowRight className="w-3.5 h-3.5" />
              <span>العودة للخلف</span>
            </button>

            <button
              type="button"
              onClick={handleResendClick}
              disabled={resendTimer > 0 || resending}
              className="text-[#053B50] font-bold hover:underline disabled:text-[#053B50]/40 disabled:no-underline cursor-pointer flex items-center gap-1"
            >
              {resending ? (
                <span>جاري الإرسال...</span>
              ) : resendTimer > 0 ? (
                <span>إعادة الإرسال بعد ({resendTimer}ث)</span>
              ) : (
                <>
                  <RefreshCw className="w-3 h-3" />
                  <span>إعادة إرسال الرمز</span>
                </>
              )}
            </button>
          </div>
        </div>
      </motion.div>
    </div>
  );
};
