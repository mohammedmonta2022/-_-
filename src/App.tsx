/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import React, { useState } from 'react';
import {
  User,
  Lock,
  Eye,
  EyeOff,
  LogIn,
  CheckCircle2,
  HelpCircle,
  X,
  ArrowRight,
  Phone,
  Mail,
  GraduationCap
} from 'lucide-react';
import { motion, AnimatePresence } from 'motion/react';
import { AnimatedBackground } from './components/AnimatedBackground';

export default function App() {
  // Form State
  const [username, setUsername] = useState('');
  const [password, setPassword] = useState('');
  const [showPassword, setShowPassword] = useState(false);
  const [rememberMe, setRememberMe] = useState(false);

  // Flow State
  const [isLoading, setIsLoading] = useState(false);
  const [isLoggedIn, setIsLoggedIn] = useState(false);
  const [showForgotModal, setShowForgotModal] = useState(false);
  const [loginTime, setLoginTime] = useState<string>('');

  const handleLogin = (e: React.FormEvent) => {
    e.preventDefault();
    setIsLoading(true);

    // "ولو وش ما كتب ما تفرق" - accepts any input gracefully with smooth feedback
    setTimeout(() => {
      setIsLoading(false);
      setIsLoggedIn(true);
      const now = new Date();
      setLoginTime(
        now.toLocaleTimeString('ar-SA', {
          hour: '2-digit',
          minute: '2-digit',
        })
      );
    }, 600);
  };

  const handleLogout = () => {
    setIsLoggedIn(false);
    setUsername('');
    setPassword('');
  };

  const displayUser = username.trim() ? username.trim() : 'المستخدم الكريم';

  return (
    <div className="min-h-screen flex flex-col justify-between bg-[#FFFFFF] text-[#053B50] selection:bg-[#E8DAC8] selection:text-[#053B50] relative overflow-x-hidden">
      {/* Living Vibrant Animated Background */}
      <AnimatedBackground />

      {/* Top Header Navigation */}
      <header
        id="app-header"
        className="w-full bg-[#FFFFFF]/85 backdrop-blur-md border-b border-[#E8DAC8]/70 sticky top-0 z-20 shadow-[0_2px_12px_rgba(5,59,80,0.04)]"
      >
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 h-20 flex items-center justify-between">
          {/* Complex Title Without Logo */}
          <div className="flex flex-col justify-center">
            <h1 className="text-2xl sm:text-3xl font-black tracking-tight text-[#053B50] leading-tight">
              مجمع عزم التعليمي
            </h1>
            <span className="text-xs sm:text-sm font-semibold text-[#053B50]/70 tracking-wide mt-0.5">
              بوابة الدخول الموحدة
            </span>
          </div>

          {/* Educational Motto Badge */}
          <div className="hidden sm:flex items-center gap-2 bg-[#F7F3EE] border border-[#E8DAC8] px-4 py-1.5 rounded-full text-xs font-semibold text-[#053B50] shadow-xs">
            <GraduationCap className="w-4 h-4 text-[#053B50]" />
            <span>نحو بيئة تعليمية رائدة ومستدامة</span>
          </div>
        </div>

        {/* Top White & Cream Decorative Divider Ribbon */}
        <div className="w-full h-1 bg-gradient-to-r from-[#053B50] via-[#E8DAC8] to-[#053B50]" />
      </header>

      {/* Main Content Area */}
      <main className="flex-1 flex items-center justify-center p-4 sm:p-6 lg:p-8 z-10 my-4 sm:my-8">
        <div className="w-full max-w-md">
          <AnimatePresence mode="wait">
            {!isLoggedIn ? (
              /* --- LOGIN CARD --- */
              <motion.div
                key="login-card"
                id="login-card"
                initial={{ opacity: 0, y: 18 }}
                animate={{ opacity: 1, y: 0 }}
                exit={{ opacity: 0, y: -18 }}
                transition={{ duration: 0.35, ease: 'easeOut' }}
                className="bg-[#FFFFFF]/95 backdrop-blur-md rounded-2xl border-2 border-[#E8DAC8] shadow-[0_16px_40px_rgba(5,59,80,0.09)] overflow-hidden relative"
              >
                {/* Top Accent Ribbon */}
                <div className="h-2 w-full bg-[#053B50]" />

                <div className="p-6 sm:p-8">
                  {/* Card Title Header without Logo */}
                  <div className="text-center mb-7">
                    <h2 className="text-2xl sm:text-3xl font-black text-[#053B50]">
                      تسجيل الدخول
                    </h2>
                    <p className="text-sm text-[#053B50]/75 mt-2 font-medium">
                      مرحباً بك في البوابة الرسمية لمجمع عزم التعليمي
                    </p>
                  </div>

                  {/* Form */}
                  <form onSubmit={handleLogin} className="space-y-5">
                    {/* Username Input */}
                    <div>
                      <label
                        htmlFor="username-input"
                        className="block text-sm font-bold text-[#053B50] mb-1.5"
                      >
                        اسم المستخدم
                      </label>
                      <div className="relative">
                        <div className="absolute inset-y-0 right-0 pr-3.5 flex items-center pointer-events-none text-[#053B50]/60">
                          <User className="w-5 h-5" />
                        </div>
                        <input
                          id="username-input"
                          type="text"
                          required
                          value={username}
                          onChange={(e) => setUsername(e.target.value)}
                          placeholder="أدخل اسم المستخدم أو البريد الإلكتروني"
                          className="w-full bg-[#FFFFFF] border-2 border-[#E8DAC8] text-[#053B50] placeholder-[#053B50]/40 rounded-xl pr-11 pl-4 py-3.5 text-sm font-medium focus:outline-none focus:border-[#053B50] focus:ring-2 focus:ring-[#053B50]/10 transition-all duration-200"
                        />
                      </div>
                    </div>

                    {/* Password Input */}
                    <div>
                      <div className="flex items-center justify-between mb-1.5">
                        <label
                          htmlFor="password-input"
                          className="block text-sm font-bold text-[#053B50]"
                        >
                          كلمة المرور
                        </label>
                        <button
                          type="button"
                          id="forgot-password-btn"
                          onClick={() => setShowForgotModal(true)}
                          className="text-xs font-semibold text-[#053B50]/80 hover:text-[#053B50] hover:underline transition-colors cursor-pointer"
                        >
                          نسيت كلمة المرور؟
                        </button>
                      </div>
                      <div className="relative">
                        <div className="absolute inset-y-0 right-0 pr-3.5 flex items-center pointer-events-none text-[#053B50]/60">
                          <Lock className="w-5 h-5" />
                        </div>
                        <input
                          id="password-input"
                          type={showPassword ? 'text' : 'password'}
                          required
                          value={password}
                          onChange={(e) => setPassword(e.target.value)}
                          placeholder="أدخل كلمة المرور"
                          className="w-full bg-[#FFFFFF] border-2 border-[#E8DAC8] text-[#053B50] placeholder-[#053B50]/40 rounded-xl pr-11 pl-11 py-3.5 text-sm font-medium focus:outline-none focus:border-[#053B50] focus:ring-2 focus:ring-[#053B50]/10 transition-all duration-200"
                        />
                        <button
                          type="button"
                          aria-label={showPassword ? 'إخفاء كلمة المرور' : 'إظهار كلمة المرور'}
                          onClick={() => setShowPassword(!showPassword)}
                          className="absolute inset-y-0 left-0 pl-3.5 flex items-center text-[#053B50]/60 hover:text-[#053B50] transition-colors cursor-pointer"
                        >
                          {showPassword ? <EyeOff className="w-5 h-5" /> : <Eye className="w-5 h-5" />}
                        </button>
                      </div>
                    </div>

                    {/* Remember me & Helper text */}
                    <div className="flex items-center justify-between pt-1">
                      <label
                        htmlFor="remember-me-checkbox"
                        className="flex items-center gap-2 cursor-pointer select-none text-xs sm:text-sm font-semibold text-[#053B50]/90"
                      >
                        <input
                          id="remember-me-checkbox"
                          type="checkbox"
                          checked={rememberMe}
                          onChange={(e) => setRememberMe(e.target.checked)}
                          className="w-4 h-4 rounded border-2 border-[#E8DAC8] text-[#053B50] focus:ring-[#053B50] accent-[#053B50] cursor-pointer"
                        />
                        <span>تذكر بيانات الدخول</span>
                      </label>

                      <span className="text-[11px] font-medium text-[#053B50]/60 bg-[#F7F3EE] px-2.5 py-1 rounded">
                        دخول آمن ومشفّر
                      </span>
                    </div>

                    {/* Submit Button */}
                    <button
                      type="submit"
                      id="login-submit-btn"
                      disabled={isLoading}
                      className="w-full mt-4 bg-[#053B50] hover:bg-[#042E3F] active:scale-[0.99] text-[#FFFFFF] font-bold py-3.5 px-6 rounded-xl shadow-md hover:shadow-lg transition-all duration-200 flex items-center justify-center gap-2 group cursor-pointer disabled:opacity-80"
                    >
                      {isLoading ? (
                        <>
                          <div className="w-5 h-5 border-2 border-[#FFFFFF] border-t-transparent rounded-full animate-spin" />
                          <span>جارٍ التحقق والدخول...</span>
                        </>
                      ) : (
                        <>
                          <LogIn className="w-5 h-5 transition-transform group-hover:-translate-x-1" />
                          <span className="text-base">تسجيل الدخول</span>
                        </>
                      )}
                    </button>
                  </form>
                </div>
              </motion.div>
            ) : (
              /* --- SUCCESS / WELCOME STATE CARD --- */
              <motion.div
                key="welcome-card"
                id="welcome-card"
                initial={{ opacity: 0, scale: 0.95 }}
                animate={{ opacity: 1, scale: 1 }}
                exit={{ opacity: 0, scale: 0.95 }}
                transition={{ duration: 0.35, ease: 'easeOut' }}
                className="bg-[#FFFFFF]/95 backdrop-blur-md rounded-2xl border-2 border-[#E8DAC8] shadow-[0_16px_40px_rgba(5,59,80,0.09)] overflow-hidden"
              >
                <div className="h-2 w-full bg-[#053B50]" />

                <div className="p-6 sm:p-8 text-center">
                  <div className="w-16 h-16 bg-[#E8DAC8]/40 border-2 border-[#E8DAC8] rounded-full flex items-center justify-center mx-auto mb-4 text-[#053B50]">
                    <CheckCircle2 className="w-10 h-10 text-[#053B50]" />
                  </div>

                  <span className="inline-block bg-[#E8DAC8]/50 text-[#053B50] text-xs font-bold px-3 py-1 rounded-full mb-2">
                    تم تسجيل الدخول بنجاح
                  </span>

                  <h2 className="text-2xl sm:text-3xl font-extrabold text-[#053B50]">
                    أهلاً بك، {displayUser}!
                  </h2>
                  <p className="text-sm text-[#053B50]/80 mt-1">
                    أنت الآن متصل ببوابة مجمع عزم التعليمي
                  </p>

                  {/* Profile & Session Card */}
                  <div className="mt-6 bg-[#F7F3EE] border border-[#E8DAC8] rounded-xl p-4 text-right space-y-2.5">
                    <div className="flex items-center justify-between text-xs text-[#053B50]">
                      <span className="font-semibold">المؤسسة:</span>
                      <span className="font-bold">مجمع عزم التعليمي</span>
                    </div>

                    <div className="flex items-center justify-between text-xs text-[#053B50]">
                      <span className="font-semibold">اسم الحساب:</span>
                      <span className="font-bold">{displayUser}</span>
                    </div>

                    <div className="flex items-center justify-between text-xs text-[#053B50]">
                      <span className="font-semibold">وقت التسجيل:</span>
                      <span className="font-bold">{loginTime || 'الآن'}</span>
                    </div>

                    <div className="flex items-center justify-between text-xs text-[#053B50]">
                      <span className="font-semibold">حالة الجلسة:</span>
                      <span className="inline-flex items-center gap-1 font-bold text-emerald-700 bg-emerald-50 px-2 py-0.5 rounded-full border border-emerald-200">
                        <span className="w-1.5 h-1.5 rounded-full bg-emerald-600 animate-pulse" />
                        جلسة نشطة
                      </span>
                    </div>
                  </div>

                  {/* Return / Logout Button */}
                  <button
                    type="button"
                    id="logout-btn"
                    onClick={handleLogout}
                    className="w-full mt-6 bg-[#053B50] hover:bg-[#042E3F] active:scale-[0.99] text-[#FFFFFF] font-bold py-3 px-6 rounded-xl shadow transition-all duration-200 flex items-center justify-center gap-2 cursor-pointer"
                  >
                    <ArrowRight className="w-5 h-5 rotate-180" />
                    <span>تسجيل الخروج والعودة</span>
                  </button>
                </div>
              </motion.div>
            )}
          </AnimatePresence>
        </div>
      </main>

      {/* Forgot Password Modal */}
      <AnimatePresence>
        {showForgotModal && (
          <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-[#053B50]/40 backdrop-blur-xs">
            <motion.div
              initial={{ opacity: 0, scale: 0.95 }}
              animate={{ opacity: 1, scale: 1 }}
              exit={{ opacity: 0, scale: 0.95 }}
              className="bg-[#FFFFFF] border-2 border-[#E8DAC8] rounded-2xl max-w-md w-full p-6 shadow-2xl relative"
            >
              <button
                type="button"
                onClick={() => setShowForgotModal(false)}
                className="absolute top-4 left-4 text-[#053B50]/60 hover:text-[#053B50] p-1 rounded-lg hover:bg-[#F7F3EE] transition-colors cursor-pointer"
              >
                <X className="w-5 h-5" />
              </button>

              <div className="flex items-center gap-3 mb-4">
                <div className="w-10 h-10 rounded-xl bg-[#E8DAC8]/40 border border-[#E8DAC8] flex items-center justify-center text-[#053B50]">
                  <HelpCircle className="w-6 h-6" />
                </div>
                <div>
                  <h3 className="text-lg font-bold text-[#053B50]">استعادة كلمة المرور</h3>
                  <p className="text-xs text-[#053B50]/70">إدارة الدعم الفني لمجمع عزم</p>
                </div>
              </div>

              <p className="text-sm text-[#053B50]/80 leading-relaxed mb-5">
                لإعادة تعيين كلمة المرور الخاصة بحسابك في مجمع عزم التعليمي، يُرجى مراجعة إدارة
                تقنية المعلومات بالمجمع أو التواصل عبر قنوات الدعم المعتمدة:
              </p>

              <div className="bg-[#F7F3EE] border border-[#E8DAC8] rounded-xl p-3.5 space-y-2.5 text-xs text-[#053B50] mb-5">
                <div className="flex items-center gap-2 font-medium">
                  <Phone className="w-4 h-4 text-[#053B50]" />
                  <span>هاتف الدعم المباشر:</span>
                  <span dir="ltr" className="font-bold">920000000</span>
                </div>
                <div className="flex items-center gap-2 font-medium">
                  <Mail className="w-4 h-4 text-[#053B50]" />
                  <span>البريد المخصص:</span>
                  <span dir="ltr" className="font-bold">support@azm.edu.sa</span>
                </div>
              </div>

              <button
                type="button"
                onClick={() => setShowForgotModal(false)}
                className="w-full bg-[#053B50] hover:bg-[#042E3F] text-[#FFFFFF] font-bold py-2.5 px-4 rounded-xl transition-colors cursor-pointer text-sm"
              >
                فهمت، حسناً
              </button>
            </motion.div>
          </div>
        )}
      </AnimatePresence>

      {/* Footer Area with Exact Required Text */}
      <footer
        id="app-footer"
        className="w-full bg-[#FFFFFF]/90 backdrop-blur-sm border-t border-[#E8DAC8] py-6 px-4 z-10"
      >
        <div className="max-w-7xl mx-auto flex flex-col sm:flex-row items-center justify-between gap-4 text-center sm:text-right">
          {/* Exact phrase requested: "جميع الحقوق محفوظة لمجمع عزم التعليمي" */}
          <div className="flex items-center gap-2">
            <div className="w-2.5 h-2.5 rounded-full bg-[#053B50]" />
            <p className="text-sm font-bold text-[#053B50]">
              جميع الحقوق محفوظة لمجمع عزم التعليمي
            </p>
          </div>

          {/* Color accents */}
          <div className="flex items-center gap-2">
            <span className="w-3.5 h-3.5 rounded-full bg-[#053B50] border border-[#E8DAC8]" title="كحلي بترولي #053B50" />
            <span className="w-3.5 h-3.5 rounded-full bg-[#E8DAC8] border border-[#053B50]/20" title="بيج فاتح #E8DAC8" />
            <span className="w-3.5 h-3.5 rounded-full bg-[#FFFFFF] border border-[#053B50]/30" title="أبيض #FFFFFF" />
          </div>
        </div>
      </footer>
    </div>
  );
}
