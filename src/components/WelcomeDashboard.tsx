import React, { useState, useEffect } from 'react';
import { motion } from 'motion/react';
import {
  CheckCircle2,
  LogOut,
  User,
  Mail,
  Calendar,
  Sparkles,
  BookOpen,
  Award,
  FileText,
  Shield,
  Send,
  RefreshCw,
  AlertCircle,
  Database,
} from 'lucide-react';
import type { UserAccount, SystemConfig } from '../types';
import {
  authorizeSenderEmail,
  getSystemConfig,
  getSavedSenderToken,
} from '../lib/firebase';

interface WelcomeDashboardProps {
  user: UserAccount;
  onLogout: () => void;
}

export const WelcomeDashboard: React.FC<WelcomeDashboardProps> = ({ user, onLogout }) => {
  const [hasGmailAuth, setHasGmailAuth] = useState(false);
  const [isAuthorizing, setIsAuthorizing] = useState(false);
  const [authSuccessMsg, setAuthSuccessMsg] = useState<string | null>(null);
  const [errorMsg, setErrorMsg] = useState<string | null>(null);
  const [systemConfig, setSystemConfig] = useState<SystemConfig | null>(null);
  const [loadingConfig, setLoadingConfig] = useState(true);

  const isSenderAdmin = Boolean(user.isOfficialSender || user.role === 'admin');

  // Load persistent authorization directly from Firebase Firestore
  useEffect(() => {
    async function loadConfig() {
      setLoadingConfig(true);
      try {
        const config = await getSystemConfig();
        setSystemConfig(config);
        const token = await getSavedSenderToken();
        if (config?.isAuthorized && token) {
          setHasGmailAuth(true);
        } else {
          setHasGmailAuth(false);
        }
      } catch (err) {
        console.error('Error loading config from Firestore:', err);
      } finally {
        setLoadingConfig(false);
      }
    }
    loadConfig();
  }, [user.email]);

  const handleAuthorizeSender = async () => {
    setIsAuthorizing(true);
    setAuthSuccessMsg(null);
    setErrorMsg(null);
    try {
      const res = await authorizeSenderEmail(user.email);
      if (res.success) {
        setHasGmailAuth(true);
        setAuthSuccessMsg(
          'تم حفظ وتثبيت التفويض في قاعدة بيانات Firebase Firestore بنجاح! بريدك الآن هو بريد الإرسال المعتمد الدائم لجميع المستخدمين.'
        );
        const updated = await getSystemConfig();
        setSystemConfig(updated);
      } else {
        setErrorMsg(res.error || 'تعذر حفظ التفويض في Firebase Firestore');
      }
    } catch (err) {
      console.error('Google auth error:', err);
      setErrorMsg('حدث خطأ أثناء إجراء التفويض مع Google');
    } finally {
      setIsAuthorizing(false);
    }
  };

  return (
    <motion.div
      key="welcome-dashboard"
      id="welcome-dashboard"
      initial={{ opacity: 0, scale: 0.97, y: 15 }}
      animate={{ opacity: 1, scale: 1, y: 0 }}
      exit={{ opacity: 0, scale: 0.97, y: -15 }}
      transition={{ duration: 0.3 }}
      className="w-full max-w-2xl bg-[#FFFFFF] rounded-2xl border-2 border-[#E8DAC8] shadow-[0_16px_40px_rgba(5,59,80,0.09)] overflow-hidden"
    >
      {/* Top Accent Ribbon */}
      <div className="h-2.5 w-full bg-gradient-to-r from-[#053B50] via-[#E8DAC8] to-[#053B50]" />

      <div className="p-6 sm:p-10">
        {/* Welcome Header */}
        <div className="text-center mb-8">
          <div className="w-18 h-18 bg-[#F7F3EE] border-2 border-[#E8DAC8] rounded-full flex items-center justify-center mx-auto mb-4 text-[#053B50] shadow-sm">
            <CheckCircle2 className="w-10 h-10 text-emerald-600" />
          </div>

          <div className="inline-flex items-center gap-1.5 bg-[#E8DAC8]/40 border border-[#E8DAC8] px-3.5 py-1 rounded-full text-xs font-bold text-[#053B50] mb-3">
            <Sparkles className="w-3.5 h-3.5 text-[#053B50]" />
            <span>تم تسجيل الدخول بنجاح عبر بوابة عزم الموحدة</span>
          </div>

          <h2 className="text-3xl sm:text-4xl font-black text-[#053B50] tracking-tight mb-2">
            مرحباً بك يا {user.username}!
          </h2>
          <p className="text-sm sm:text-base text-[#053B50]/75 font-medium max-w-md mx-auto">
            أهلاً وسهلاً بك في البوابة الإلكترونية لمجمع عزم التعليمي. حسابك نشط ومحفوظ بأمان في قاعدة بيانات Firebase Firestore.
          </p>
        </div>

        {/* User Profile Card */}
        <div className="bg-[#F7F3EE] border border-[#E8DAC8] rounded-2xl p-5 sm:p-6 mb-6">
          <div className="flex items-center justify-between mb-4">
            <h3 className="text-sm font-bold text-[#053B50] flex items-center gap-2">
              <User className="w-4 h-4 text-[#053B50]" />
              <span>معلومات الحساب المسجل</span>
            </h3>

            {isSenderAdmin && (
              <span className="bg-[#053B50] text-[#FFFFFF] text-[11px] font-bold px-3 py-1 rounded-full flex items-center gap-1">
                <Shield className="w-3 h-3 text-[#E8DAC8]" />
                <span>بريد الإرسال الرسمي المعتمد للنظام</span>
              </span>
            )}
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 text-xs sm:text-sm">
            <div className="bg-[#FFFFFF] p-3 rounded-xl border border-[#E8DAC8]">
              <span className="text-[#053B50]/70 block text-xs font-semibold mb-1">اسم المستخدم:</span>
              <span className="font-bold text-[#053B50]">{user.username}</span>
            </div>

            <div className="bg-[#FFFFFF] p-3 rounded-xl border border-[#E8DAC8]">
              <span className="text-[#053B50]/70 block text-xs font-semibold mb-1">البريد الإلكتروني:</span>
              <span dir="ltr" className="font-bold text-[#053B50] block truncate">
                {user.email}
              </span>
            </div>

            <div className="bg-[#FFFFFF] p-3 rounded-xl border border-[#E8DAC8]">
              <span className="text-[#053B50]/70 block text-xs font-semibold mb-1">حالة الحساب:</span>
              <span className="inline-flex items-center gap-1 font-bold text-emerald-700">
                <CheckCircle2 className="w-3.5 h-3.5" />
                <span>حساب موثق ونشط سحابياً</span>
              </span>
            </div>

            <div className="bg-[#FFFFFF] p-3 rounded-xl border border-[#E8DAC8]">
              <span className="text-[#053B50]/70 block text-xs font-semibold mb-1">قاعدة البيانات:</span>
              <span className="font-bold text-[#053B50] flex items-center gap-1">
                <Database className="w-3.5 h-3.5 text-[#053B50]" />
                <span>Firebase Firestore السحابية</span>
              </span>
            </div>
          </div>
        </div>

        {/* Sender Admin Control Box (Dedicated for First User / Admin) */}
        {isSenderAdmin && (
          <div className="mb-6 p-5 rounded-2xl bg-amber-50/80 border-2 border-amber-300 text-xs text-[#053B50]">
            <div className="flex items-center justify-between mb-2">
              <div className="flex items-center gap-2">
                <Send className="w-4 h-4 text-[#053B50]" />
                <h4 className="font-bold text-sm text-[#053B50]">
                  إعدادات وتفويض بريد الإرسال المعتمد (Firebase)
                </h4>
              </div>

              {hasGmailAuth ? (
                <span className="inline-flex items-center gap-1 bg-emerald-100 text-emerald-800 text-[11px] font-bold px-2.5 py-0.5 rounded-full">
                  <CheckCircle2 className="w-3 h-3 text-emerald-600" />
                  <span>مفوض ومحفوظ في فايربيس</span>
                </span>
              ) : (
                <span className="inline-flex items-center gap-1 bg-amber-200 text-amber-900 text-[11px] font-bold px-2.5 py-0.5 rounded-full">
                  <AlertCircle className="w-3 h-3 text-amber-700" />
                  <span>بانتظار التفويض السحابي</span>
                </span>
              )}
            </div>

            <p className="text-[#053B50]/80 leading-relaxed mb-3">
              بريدك الإلكتروني (<strong>{user.email}</strong>) مسجل كبريد الإرسال الرسمي لمجمع عزم. عند تفويضه، يتم حفظ رمز التفويض مباشرة في فايربيس لإرسال رموز التحقق لجميع الطلاب والمستخدمين الجدد تلقائياً.
            </p>

            {/* Persistent Status Details */}
            {systemConfig && (
              <div className="bg-[#FFFFFF] p-3 rounded-xl border border-amber-200 mb-3 space-y-1 text-[11px]">
                <div className="flex justify-between">
                  <span className="text-[#053B50]/70">بريد الإرسال المحفوظ في فايربيس:</span>
                  <span dir="ltr" className="font-bold text-[#053B50]">{systemConfig.senderEmail}</span>
                </div>
                {systemConfig.authorizedAt && (
                  <div className="flex justify-between">
                    <span className="text-[#053B50]/70">تاريخ حفظ التفويض السحابي:</span>
                    <span className="font-medium text-[#053B50]">
                      {new Date(systemConfig.authorizedAt).toLocaleString('ar-SA')}
                    </span>
                  </div>
                )}
              </div>
            )}

            {authSuccessMsg && (
              <div className="mb-3 p-2.5 rounded-lg bg-emerald-100 text-emerald-800 font-semibold flex items-center gap-2">
                <CheckCircle2 className="w-4 h-4 text-emerald-600 shrink-0" />
                <span>{authSuccessMsg}</span>
              </div>
            )}

            {errorMsg && (
              <div className="mb-3 p-2.5 rounded-lg bg-red-100 text-red-800 font-semibold flex items-center gap-2">
                <AlertCircle className="w-4 h-4 text-red-600 shrink-0" />
                <span>{errorMsg}</span>
              </div>
            )}

            <button
              type="button"
              onClick={handleAuthorizeSender}
              disabled={isAuthorizing}
              className="bg-[#053B50] hover:bg-[#042E3F] text-[#FFFFFF] font-bold py-2.5 px-4 rounded-xl transition-all flex items-center gap-2 cursor-pointer shadow-sm text-xs disabled:opacity-50"
            >
              {isAuthorizing ? (
                <>
                  <RefreshCw className="w-3.5 h-3.5 animate-spin" />
                  <span>جاري التفويض وحفظ البيانات في فايربيس...</span>
                </>
              ) : hasGmailAuth ? (
                <>
                  <RefreshCw className="w-3.5 h-3.5 text-[#E8DAC8]" />
                  <span>تحديث/تجديد تفويض Google في فايربيس</span>
                </>
              ) : (
                <>
                  <Mail className="w-3.5 h-3.5 text-[#E8DAC8]" />
                  <span>تأكيد وحفظ تفويض Google في فايربيس لإرسال الإيميلات للجميع</span>
                </>
              )}
            </button>
          </div>
        )}

        {/* Quick Portal Services */}
        <div className="mb-8">
          <h3 className="text-xs sm:text-sm font-bold text-[#053B50] mb-3">
            خدمات مجمع عزم التعليمي المتاحة لك:
          </h3>
          <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
            <div className="p-3 rounded-xl border border-[#E8DAC8] hover:border-[#053B50] bg-[#FFFFFF] transition-colors cursor-pointer text-center">
              <BookOpen className="w-5 h-5 mx-auto mb-1.5 text-[#053B50]" />
              <span className="block font-bold text-xs text-[#053B50]">المقررات والدروس</span>
              <span className="text-[11px] text-[#053B50]/65">المحتوى التعليمي</span>
            </div>
            <div className="p-3 rounded-xl border border-[#E8DAC8] hover:border-[#053B50] bg-[#FFFFFF] transition-colors cursor-pointer text-center">
              <Award className="w-5 h-5 mx-auto mb-1.5 text-[#053B50]" />
              <span className="block font-bold text-xs text-[#053B50]">النتائج والتقارير</span>
              <span className="text-[11px] text-[#053B50]/65">التقييم المستمر</span>
            </div>
            <div className="p-3 rounded-xl border border-[#E8DAC8] hover:border-[#053B50] bg-[#FFFFFF] transition-colors cursor-pointer text-center">
              <FileText className="w-5 h-5 mx-auto mb-1.5 text-[#053B50]" />
              <span className="block font-bold text-xs text-[#053B50]">الجدول الدراسي</span>
              <span className="text-[11px] text-[#053B50]/65">المواعيد اليومية</span>
            </div>
          </div>
        </div>

        {/* Logout Button */}
        <div className="pt-2 border-t border-[#E8DAC8] flex justify-end">
          <button
            type="button"
            onClick={onLogout}
            className="w-full sm:w-auto bg-[#F7F3EE] hover:bg-[#E8DAC8] text-[#053B50] border border-[#E8DAC8] font-bold py-2.5 px-6 rounded-xl transition-colors flex items-center justify-center gap-2 cursor-pointer text-sm"
          >
            <LogOut className="w-4 h-4" />
            <span>تسجيل الخروج من البوابة</span>
          </button>
        </div>
      </div>
    </motion.div>
  );
};
