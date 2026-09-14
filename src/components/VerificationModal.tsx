import React, { useState, useEffect } from 'react';
import { motion } from 'motion/react';
import {
  Mail,
  ShieldCheck,
  AlertCircle,
  CheckCircle2,
  RefreshCw,
  ArrowRight,
} from 'lucide-react';
import { getSavedSenderToken } from '../lib/firebase';
import { sendEmailViaGmail, generateEmailHtml } from '../lib/gmail';

interface VerificationModalProps {
  email: string;
  username: string;
  expectedCode?: string;
  purpose: 'register' | 'reset_password';
  onVerify: (enteredCode: string) => Promise<boolean>;
  onResend: () => Promise<void>;
  onBack: () => void;
  isLoading: boolean;
  emailSentStatus?: string;
}

export const VerificationModal: React.FC<VerificationModalProps> = ({
  email,
  username,
  expectedCode,
  purpose,
  onVerify,
  onResend,
  onBack,
  isLoading,
}) => {
  const [code, setCode] = useState('');
  const [error, setError] = useState<string | null>(null);
  const [resending, setResending] = useState(false);
  const [resendTimer, setResendTimer] = useState(60);
  const [sendSuccessMsg, setSendSuccessMsg] = useState<string | null>(
    `تم إرسال رمز التحقق إلى بريدك الإلكتروني: ${email}`
  );

  // Prevent background page scrolling while modal is open
  useEffect(() => {
    const originalStyle = document.body.style.overflow;
    document.body.style.overflow = 'hidden';
    return () => {
      document.body.style.overflow = originalStyle;
    };
  }, []);

  // Automatic send using the sender account stored in database
  useEffect(() => {
    async function triggerAuthorizedSend() {
      try {
        const token = await getSavedSenderToken();
        if (token && expectedCode) {
          sendEmailViaGmail({
            to: email,
            subject: `رمز التحقق لمجمع عزم التعليمي (${expectedCode})`,
            htmlContent: generateEmailHtml(expectedCode, username, purpose),
          }).then((res) => {
            if (res.success) {
              setSendSuccessMsg(`تم إرسال رمز التحقق بنجاح إلى بريدك الإلكتروني (${email})`);
            }
          });
        }
      } catch (err) {
        console.error('Error dispatching verification email:', err);
      }
    }
    triggerAuthorizedSend();
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
      setError('رمز التحقق غير صحيح أو منتهي الصلاحية، يُرجى التأكد وإعادة المحاولة');
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
      setSendSuccessMsg(`تم إرسال رمز جديد إلى بريدك الإلكتروني: ${email}`);
    } catch {
      setError('تعذر إعادة إرسال الرمز حالياً، يرجى المحاولة لاحقاً');
    } finally {
      setResending(false);
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
        {/* Top Header Ribbon */}
        <div className="h-2 w-full bg-[#053B50]" />

        <div className="p-6 sm:p-8">
          {/* Icon and Title */}
          <div className="text-center mb-5">
            <div className="w-14 h-14 bg-[#F7F3EE] border-2 border-[#E8DAC8] rounded-full flex items-center justify-center mx-auto mb-3 text-[#053B50]">
              <ShieldCheck className="w-7 h-7" />
            </div>
            <h3 className="text-2xl font-black text-[#053B50]">
              تأكيد البريد الإلكتروني
            </h3>
            <p className="text-xs sm:text-sm text-[#053B50]/75 mt-1 font-medium">
              {purpose === 'register'
                ? 'تم إرسال رمز التحقق لتأكيد إنشاء حسابك'
                : 'تم إرسال رمز التحقق لتغيير كلمة المرور'}
            </p>
          </div>

          {/* Clean Email Display */}
          <div className="bg-[#F7F3EE] border border-[#E8DAC8] rounded-xl p-3.5 mb-4 flex items-center gap-2.5 text-xs text-[#053B50]">
            <Mail className="w-4 h-4 text-[#053B50] shrink-0" />
            <div className="flex-1 overflow-hidden">
              <span className="block text-[11px] text-[#053B50]/70 font-semibold mb-0.5">
                البريد الإلكتروني المسجل:
              </span>
              <span dir="ltr" className="block font-bold truncate text-[#053B50] text-sm">
                {email}
              </span>
            </div>
          </div>

          {/* Success Message Alert */}
          {sendSuccessMsg && (
            <div className="mb-4 p-3 rounded-xl bg-emerald-50 border border-emerald-200 text-emerald-800 text-xs flex items-center gap-2">
              <CheckCircle2 className="w-4 h-4 text-emerald-600 shrink-0" />
              <span className="font-medium">{sendSuccessMsg}</span>
            </div>
          )}

          {/* Verification Code Form */}
          <form onSubmit={handleSubmit} className="space-y-4">
            <div>
              <label
                htmlFor="verification-code-input"
                className="block text-xs sm:text-sm font-bold text-[#053B50] mb-2 text-center"
              >
                أدخل رمز التحقق (6 أرقام)
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
                  <span>جاري تأكيد الرمز...</span>
                </>
              ) : (
                <span>تأكيد الرمز والمتابعة</span>
              )}
            </button>
          </form>

          {/* Resend and Back Buttons */}
          <div className="mt-5 pt-4 border-t border-[#E8DAC8] flex items-center justify-between text-xs">
            <button
              type="button"
              onClick={onBack}
              className="text-[#053B50]/70 hover:text-[#053B50] font-semibold flex items-center gap-1 cursor-pointer transition-colors"
            >
              <ArrowRight className="w-3.5 h-3.5" />
              <span>العودة</span>
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
                  <RefreshCw className="w-3.5 h-3.5" />
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
