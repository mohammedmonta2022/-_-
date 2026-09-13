import React from 'react';
import { motion } from 'motion/react';
import { CheckCircle2, LogOut, User, Mail, Calendar, Sparkles, BookOpen, Award, FileText } from 'lucide-react';
import type { UserAccount } from '../types';

interface WelcomeDashboardProps {
  user: UserAccount;
  onLogout: () => void;
}

export const WelcomeDashboard: React.FC<WelcomeDashboardProps> = ({ user, onLogout }) => {
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
            أهلاً وسهلاً بك في البوابة الإلكترونية لمجمع عزم التعليمي. حسابك نشط ومحفوظ بأمان في قاعدة البيانات السحابية.
          </p>
        </div>

        {/* User Profile Card */}
        <div className="bg-[#F7F3EE] border border-[#E8DAC8] rounded-2xl p-5 sm:p-6 mb-8">
          <h3 className="text-sm font-bold text-[#053B50] mb-4 flex items-center gap-2">
            <User className="w-4 h-4 text-[#053B50]" />
            <span>معلومات الحساب المسجل</span>
          </h3>

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
                <span>حساب نشط وموثق بالبريد الإلكتروني</span>
              </span>
            </div>

            <div className="bg-[#FFFFFF] p-3 rounded-xl border border-[#E8DAC8]">
              <span className="text-[#053B50]/70 block text-xs font-semibold mb-1">حفظ البيانات:</span>
              <span className="font-bold text-[#053B50]">
                سحابياً في النظام الموحد لمجمع عزم
              </span>
            </div>
          </div>
        </div>

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
