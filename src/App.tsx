/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import React, { useState, useEffect } from 'react';
import { GraduationCap, LogIn, UserPlus, Lock } from 'lucide-react';
import { motion, AnimatePresence } from 'motion/react';
import { AnimatedBackground } from './components/AnimatedBackground';
import { LoginForm } from './components/LoginForm';
import { RegisterForm } from './components/RegisterForm';
import { ForgotPasswordModal } from './components/ForgotPasswordModal';
import { WelcomeDashboard } from './components/WelcomeDashboard';
import { getSystemConfig, findUser } from './lib/firebase';
import type { UserAccount, AuthTab } from './types';

const STORAGE_KEY_AUTH_USER = 'azm_auth_user_session';

export default function App() {
  const [currentTab, setCurrentTab] = useState<AuthTab>('login');
  // Initialize currentUser from localStorage for instant, permanent persistence
  const [currentUser, setCurrentUser] = useState<UserAccount | null>(() => {
    try {
      const saved = localStorage.getItem(STORAGE_KEY_AUTH_USER);
      if (saved) {
        return JSON.parse(saved) as UserAccount;
      }
    } catch (e) {
      console.error('Error reading saved session from localStorage:', e);
    }
    return null;
  });

  const [showForgotModal, setShowForgotModal] = useState(false);
  const [registrationNotice, setRegistrationNotice] = useState<string | null>(null);
  const [allowPublicRegistration, setAllowPublicRegistration] = useState(true);

  // Sync saved session with Firestore to ensure roles and state are fresh
  useEffect(() => {
    if (currentUser?.username) {
      findUser(currentUser.username)
        .then((latest) => {
          if (latest) {
            setCurrentUser(latest);
            try {
              localStorage.setItem(STORAGE_KEY_AUTH_USER, JSON.stringify(latest));
            } catch (err) {
              console.warn('Failed to update localStorage session:', err);
            }
          }
        })
        .catch((err) => {
          console.warn('Session background sync error:', err);
        });
    }
  }, []);

  useEffect(() => {
    async function checkPublicRegistration() {
      try {
        const config = await getSystemConfig();
        if (config && config.allowPublicRegistration !== undefined) {
          setAllowPublicRegistration(config.allowPublicRegistration);
        }
      } catch (err) {
        console.error('Error checking registration status:', err);
      }
    }
    checkPublicRegistration();
  }, [currentUser]);

  const handleRegisterSuccess = (username: string) => {
    setRegistrationNotice(`تم إنشاء حسابك بنجاح يا ${username}! يمكنك الآن تسجيل الدخول.`);
    setCurrentTab('login');
  };

  const handleLoginSuccess = (user: UserAccount) => {
    setCurrentUser(user);
    try {
      localStorage.setItem(STORAGE_KEY_AUTH_USER, JSON.stringify(user));
    } catch (err) {
      console.warn('Failed to save session to localStorage:', err);
    }
    setRegistrationNotice(null);
  };

  const handleLogout = () => {
    try {
      localStorage.removeItem(STORAGE_KEY_AUTH_USER);
    } catch (err) {
      console.warn('Failed to remove session from localStorage:', err);
    }
    setCurrentUser(null);
  };

  return (
    <div className="min-h-screen flex flex-col justify-between bg-[#FFFFFF] text-[#053B50] selection:bg-[#E8DAC8] selection:text-[#053B50] relative overflow-x-hidden">
      {/* Living Vibrant Animated Background */}
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
              نظام إدارة المجمعات والحلقات القرآنية الموحد
            </span>
          </div>

          {/* Educational Motto Badge */}
          <div className="hidden sm:flex items-center gap-2 bg-[#F7F3EE] border border-[#E8DAC8] px-4 py-1.5 rounded-full text-xs font-semibold text-[#053B50] shadow-xs">
            <GraduationCap className="w-4 h-4 text-[#053B50]" />
            <span>نحو بيئة تعليمية قرآنية رائدة ومستدامة</span>
          </div>
        </div>

        {/* Top Decorative Divider Ribbon */}
        <div className="w-full h-1 bg-gradient-to-r from-[#053B50] via-[#E8DAC8] to-[#053B50]" />
      </header>

      {/* Main Content Area */}
      <main className="flex-1 flex items-center justify-center p-4 sm:p-6 lg:p-8 z-10 my-4 sm:my-8">
        <AnimatePresence mode="wait">
          {currentUser ? (
            /* --- SUPERVISOR / USER DASHBOARD SYSTEM --- */
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
                      if (allowPublicRegistration) {
                        setCurrentTab('register');
                        setRegistrationNotice(null);
                      }
                    }}
                    className={`flex-1 py-2 rounded-lg text-xs sm:text-sm font-bold flex items-center justify-center gap-1.5 transition-all cursor-pointer ${
                      currentTab === 'register'
                        ? 'bg-[#053B50] text-[#FFFFFF] shadow-sm'
                        : 'text-[#053B50]/70 hover:text-[#053B50]'
                    }`}
                  >
                    {allowPublicRegistration ? (
                      <>
                        <UserPlus className="w-3.5 h-3.5" />
                        <span>إنشاء حساب</span>
                      </>
                    ) : (
                      <>
                        <Lock className="w-3.5 h-3.5 text-[#053B50]/50" />
                        <span className="text-[#053B50]/50">التسجيل مغلق</span>
                      </>
                    )}
                  </button>
                </div>

                {/* Active Tab Form */}
                {currentTab === 'login' ? (
                  <LoginForm
                    onLoginSuccess={handleLoginSuccess}
                    onSwitchToRegister={() => {
                      if (allowPublicRegistration) {
                        setCurrentTab('register');
                        setRegistrationNotice(null);
                      }
                    }}
                    onForgotPassword={() => setShowForgotModal(true)}
                    successMessage={registrationNotice}
                  />
                ) : allowPublicRegistration ? (
                  <RegisterForm
                    onSuccess={handleRegisterSuccess}
                    onSwitchToLogin={() => {
                      setCurrentTab('login');
                      setRegistrationNotice(null);
                    }}
                  />
                ) : (
                  <div className="text-center py-8 bg-[#F7F3EE] rounded-xl border border-[#E8DAC8] p-4">
                    <Lock className="w-8 h-8 text-amber-600 mx-auto mb-2" />
                    <h4 className="font-bold text-sm text-[#053B50]">تم إغلاق التسجيل الخارجي</h4>
                    <p className="text-xs text-[#053B50]/70 mt-1 mb-4">
                      قام المشرف العام بتعطيل إنشاء الحسابات من الخارج. يتم إنشاء الحسابات حالياً حصرياً عبر إدارة النظام.
                    </p>
                    <button
                      type="button"
                      onClick={() => setCurrentTab('login')}
                      className="bg-[#053B50] text-[#FFFFFF] text-xs font-bold px-4 py-2 rounded-xl"
                    >
                      العودة لتسجيل الدخول
                    </button>
                  </div>
                )}
              </div>
            </motion.div>
          )}
        </AnimatePresence>
      </main>

      {/* Forgot Password Modal */}
      {showForgotModal && (
        <ForgotPasswordModal
          isOpen={showForgotModal}
          onClose={() => setShowForgotModal(false)}
          onSuccess={() => {
            setShowForgotModal(false);
            setRegistrationNotice('تم تحديث كلمة المرور بنجاح! يمكنك الآن تسجيل الدخول بكلمة المرور الجديدة.');
          }}
        />
      )}

      {/* Footer */}
      <footer className="w-full bg-[#FFFFFF] border-t border-[#E8DAC8]/70 py-4 px-4 text-center z-10">
        <p className="text-xs text-[#053B50]/65 font-medium">
          جميع الحقوق محفوظة © {new Date().getFullYear()} • مجمع عزم التعليمي لإدارة الحلقات والمجمعات القرآنية
        </p>
      </footer>
    </div>
  );
}
