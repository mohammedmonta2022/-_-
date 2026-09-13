/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import React, { useState } from 'react';
import { GraduationCap, LogIn, UserPlus } from 'lucide-react';
import { motion, AnimatePresence } from 'motion/react';
import { AnimatedBackground } from './components/AnimatedBackground';
import { LoginForm } from './components/LoginForm';
import { RegisterForm } from './components/RegisterForm';
import { ForgotPasswordModal } from './components/ForgotPasswordModal';
import { WelcomeDashboard } from './components/WelcomeDashboard';
import type { UserAccount, AuthTab } from './types';

export default function App() {
  const [currentTab, setCurrentTab] = useState<AuthTab>('login');
  const [currentUser, setCurrentUser] = useState<UserAccount | null>(null);
  const [showForgotModal, setShowForgotModal] = useState(false);
  const [registrationNotice, setRegistrationNotice] = useState<string | null>(null);

  const handleRegisterSuccess = (username: string) => {
    setRegistrationNotice(`تم إنشاء حسابك بنجاح يا ${username}! يمكنك الآن تسجيل الدخول.`);
    setCurrentTab('login');
  };

  const handleLoginSuccess = (user: UserAccount) => {
    setCurrentUser(user);
    setRegistrationNotice(null);
  };

  const handleLogout = () => {
    setCurrentUser(null);
  };

  return (
    <div className="min-h-screen flex flex-col justify-between bg-[#FFFFFF] text-[#053B50] selection:bg-[#E8DAC8] selection:text-[#053B50] relative overflow-x-hidden">
      {/* Living Vibrant Animated Background (Hardware Accelerated 60+ FPS) */}
      <AnimatedBackground />

      {/* Top Header Navigation */}
      <header
        id="app-header"
        className="w-full bg-[#FFFFFF] border-b border-[#E8DAC8]/70 sticky top-0 z-20 shadow-[0_2px_12px_rgba(5,59,80,0.04)]"
      >
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 h-20 flex items-center justify-between">
          {/* Complex Title Without Logo */}
          <div className="flex flex-col justify-center">
            <h1 className="text-2xl sm:text-3xl font-black tracking-tight text-[#053B50] leading-tight">
              مجمع عزم التعليمي
            </h1>
            <span className="text-xs sm:text-sm font-semibold text-[#053B50]/70 tracking-wide mt-0.5">
              بوابة الدخول وإنشاء الحسابات الموحدة
            </span>
          </div>

          {/* Educational Motto Badge */}
          <div className="hidden sm:flex items-center gap-2 bg-[#F7F3EE] border border-[#E8DAC8] px-4 py-1.5 rounded-full text-xs font-semibold text-[#053B50] shadow-xs">
            <GraduationCap className="w-4 h-4 text-[#053B50]" />
            <span>نحو بيئة تعليمية رائدة ومستدامة</span>
          </div>
        </div>

        {/* Top Decorative Divider Ribbon */}
        <div className="w-full h-1 bg-gradient-to-r from-[#053B50] via-[#E8DAC8] to-[#053B50]" />
      </header>

      {/* Main Content Area */}
      <main className="flex-1 flex items-center justify-center p-4 sm:p-6 lg:p-8 z-10 my-4 sm:my-8">
        <AnimatePresence mode="wait">
          {currentUser ? (
            /* --- WELCOME DASHBOARD (مرحباً بك يا [اسم المستخدم]) --- */
            <WelcomeDashboard
              key="welcome-screen"
              user={currentUser}
              onLogout={handleLogout}
            />
          ) : (
            /* --- AUTH CARD (LOGIN & REGISTER) --- */
            <motion.div
              key="auth-card"
              id="auth-card"
              initial={{ opacity: 0, y: 14 }}
              animate={{ opacity: 1, y: 0 }}
              exit={{ opacity: 0, y: -14 }}
              transition={{ duration: 0.25, ease: 'easeOut' }}
              className="w-full max-w-md bg-[#FFFFFF] rounded-2xl border-2 border-[#E8DAC8] shadow-[0_16px_40px_rgba(5,59,80,0.08)] overflow-hidden relative"
            >
              {/* Top Accent Ribbon */}
              <div className="h-2 w-full bg-[#053B50]" />

              <div className="p-6 sm:p-8">
                {/* Title Header */}
                <div className="text-center mb-6">
                  <h2 className="text-2xl sm:text-3xl font-black text-[#053B50]">
                    {currentTab === 'login' ? 'تسجيل الدخول' : 'إنشاء حساب جديد'}
                  </h2>
                  <p className="text-xs sm:text-sm text-[#053B50]/75 mt-1.5 font-medium">
                    {currentTab === 'login'
                      ? 'مرحباً بك مجدداً في بوابة مجمع عزم التعليمي'
                      : 'انضم إلى مجمع عزم التعليمي وأنشئ حسابك في خطوات بسيطة'}
                  </p>
                </div>

                {/* Tabs Switcher */}
                <div className="flex rounded-xl bg-[#F7F3EE] p-1 border border-[#E8DAC8] mb-6">
                  <button
                    type="button"
                    onClick={() => {
                      setCurrentTab('login');
                      setRegistrationNotice(null);
                    }}
                    className={`flex-1 py-2 rounded-lg text-xs sm:text-sm font-bold flex items-center justify-center gap-1.5 transition-all cursor-pointer ${
                      currentTab === 'login'
                        ? 'bg-[#053B50] text-[#FFFFFF] shadow-sm'
                        : 'text-[#053B50]/70 hover:text-[#053B50]'
                    }`}
                  >
                    <LogIn className="w-3.5 h-3.5" />
                    <span>تسجيل الدخول</span>
                  </button>

                  <button
                    type="button"
                    onClick={() => {
                      setCurrentTab('register');
                      setRegistrationNotice(null);
                    }}
                    className={`flex-1 py-2 rounded-lg text-xs sm:text-sm font-bold flex items-center justify-center gap-1.5 transition-all cursor-pointer ${
                      currentTab === 'register'
                        ? 'bg-[#053B50] text-[#FFFFFF] shadow-sm'
                        : 'text-[#053B50]/70 hover:text-[#053B50]'
                    }`}
                  >
                    <UserPlus className="w-3.5 h-3.5" />
                    <span>إنشاء حساب</span>
                  </button>
                </div>

                {/* Active Tab Form */}
                {currentTab === 'login' ? (
                  <LoginForm
                    onLoginSuccess={handleLoginSuccess}
                    onSwitchToRegister={() => {
                      setCurrentTab('register');
                      setRegistrationNotice(null);
                    }}
                    onForgotPassword={() => setShowForgotModal(true)}
                    successMessage={registrationNotice}
                  />
                ) : (
                  <RegisterForm
                    onSuccess={handleRegisterSuccess}
                    onSwitchToLogin={() => {
                      setCurrentTab('login');
                      setRegistrationNotice(null);
                    }}
                  />
                )}
              </div>
            </motion.div>
          )}
        </AnimatePresence>
      </main>

      {/* Forgot Password Modal */}
      <ForgotPasswordModal
        isOpen={showForgotModal}
        onClose={() => setShowForgotModal(false)}
        onSuccess={() => {
          setShowForgotModal(false);
          setCurrentTab('login');
          setRegistrationNotice('تم تحديث كلمة المرور بنجاح. يمكنك الآن تسجيل الدخول.');
        }}
      />

      {/* Footer Area with Exact Required Text */}
      <footer
        id="app-footer"
        className="w-full bg-[#FFFFFF] border-t border-[#E8DAC8] py-6 px-4 z-10"
      >
        <div className="max-w-7xl mx-auto flex flex-col sm:flex-row items-center justify-between gap-4 text-center sm:text-right">
          {/* Exact phrase requested: "جميع الحقوق محفوظة لمجمع عزم التعليمي" */}
          <div className="flex items-center gap-2">
            <div className="w-2.5 h-2.5 rounded-full bg-[#053B50]" />
            <p className="text-sm font-bold text-[#053B50]">
              جميع الحقوق محفوظة لمجمع عزم التعليمي
            </p>
          </div>

          {/* Educational Identity and Verification Status */}
          <div className="flex items-center gap-3 text-xs text-[#053B50]/75">
            <span className="hidden sm:inline">نظام البوابة الإلكترونية المعتمد</span>
            <span className="w-1.5 h-1.5 rounded-full bg-[#E8DAC8]" />
            <span className="font-semibold">بوابة 2026</span>
          </div>
        </div>
      </footer>
    </div>
  );
}
