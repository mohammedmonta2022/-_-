import React, { useState, useEffect } from 'react';
import { motion } from 'motion/react';
import {
  LayoutDashboard,
  Building2,
  Users,
  LogOut,
  Mail,
  CheckCircle2,
  AlertCircle,
  RefreshCw,
  Send,
  Sparkles,
} from 'lucide-react';
import type { UserAccount, SystemConfig, QuranComplex, QuranCircle, RecitationRecord } from '../types';
import {
  authorizeSenderEmail,
  getSystemConfig,
  getSavedSenderToken,
  getComplexes,
  getCircles,
  getRecitations,
  getAllUsers,
  addComplex,
  addCircle,
  addRecitation,
  createUserAccount,
  createBatchUsers,
  deleteUserAccount,
  updateUserAccount,
  saveSystemConfig,
  seedInitialQuranDataIfEmpty,
} from '../lib/firebase';
import { HomeDashboardTab } from './HomeDashboardTab';
import { ComplexesAndCirclesTab } from './ComplexesAndCirclesTab';
import { AccountsTab } from './AccountsTab';
import { StudentDetailModal } from './StudentDetailModal';

interface WelcomeDashboardProps {
  user: UserAccount;
  onLogout: () => void;
}

export const WelcomeDashboard: React.FC<WelcomeDashboardProps> = ({ user, onLogout }) => {
  // Tabs: 'home' | 'complexes' | 'accounts' | 'settings'
  const [activeTab, setActiveTab] = useState<'home' | 'complexes' | 'accounts' | 'settings'>('home');

  // Selected Date for stats (default today)
  const [selectedDate, setSelectedDate] = useState<string>(
    new Date().toISOString().split('T')[0]
  );

  // Data states
  const [complexes, setComplexes] = useState<QuranComplex[]>([]);
  const [circles, setCircles] = useState<QuranCircle[]>([]);
  const [recitations, setRecitations] = useState<RecitationRecord[]>([]);
  const [usersList, setUsersList] = useState<UserAccount[]>([]);
  const [systemConfig, setSystemConfig] = useState<SystemConfig | null>(null);
  const [isLoadingData, setIsLoadingData] = useState(true);

  // Selected student for detail popup modal
  const [selectedStudentForModal, setSelectedStudentForModal] = useState<UserAccount | null>(null);

  // Mailer settings state
  const [hasGmailAuth, setHasGmailAuth] = useState(false);
  const [isAuthorizing, setIsAuthorizing] = useState(false);
  const [authSuccessMsg, setAuthSuccessMsg] = useState<string | null>(null);
  const [errorMsg, setErrorMsg] = useState<string | null>(null);

  const isSenderAdmin = Boolean(
    user.isOfficialSender ||
    user.role === 'general_admin' ||
    user.role === 'admin'
  );

  const loadAllData = async () => {
    setIsLoadingData(true);
    try {
      // Seed sample data if empty so admin immediately sees the counters and rankings
      await seedInitialQuranDataIfEmpty();

      const [comps, circs, recs, allUsers, config, token] = await Promise.all([
        getComplexes(),
        getCircles(),
        getRecitations(),
        getAllUsers(),
        getSystemConfig(),
        getSavedSenderToken(),
      ]);

      setComplexes(comps);
      setCircles(circs);
      setRecitations(recs);
      setUsersList(allUsers);
      setSystemConfig(config);

      if (config?.isAuthorized && token) {
        setHasGmailAuth(true);
      } else {
        setHasGmailAuth(false);
      }
    } catch (err) {
      console.error('Error loading dashboard data:', err);
    } finally {
      setIsLoadingData(false);
    }
  };

  useEffect(() => {
    loadAllData();
  }, []);

  const handleAuthorizeSender = async () => {
    setIsAuthorizing(true);
    setAuthSuccessMsg(null);
    setErrorMsg(null);
    try {
      const res = await authorizeSenderEmail(user.email);
      if (res.success) {
        setHasGmailAuth(true);
        setAuthSuccessMsg(
          'تم تفعيل وتثبيت بريد الإرسال بنجاح في قاعدة البيانات! بريدك الآن هو المعتمد لإرسال رموز التحقق لجميع المستخدمين.'
        );
        const updated = await getSystemConfig();
        setSystemConfig(updated);
      } else {
        setErrorMsg(res.error || 'تعذر استكمال إعداد بريد الإرسال');
      }
    } catch (err) {
      console.error('Google auth error:', err);
      setErrorMsg('حدث خطأ أثناء إجراء الربط مع البريد');
    } finally {
      setIsAuthorizing(false);
    }
  };

  // Complex Creation
  const handleAddComplex = async (name: string, locationName: string, lat?: number, lng?: number) => {
    await addComplex(name, locationName, lat, lng);
    const updatedComps = await getComplexes();
    setComplexes(updatedComps);
  };

  // Circle Creation
  const handleAddCircle = async (
    complexId: string,
    name: string,
    teacherId?: string,
    teacherName?: string
  ) => {
    await addCircle(complexId, name, teacherId, teacherName);
    const updatedCircs = await getCircles();
    setCircles(updatedCircs);
  };

  // Recitation Creation
  const handleAddRecitation = async (rec: Omit<RecitationRecord, 'id' | 'createdAt'>) => {
    await addRecitation(rec);
    const updatedRecs = await getRecitations();
    setRecitations(updatedRecs);
  };

  // Single User Creation
  const handleCreateSingleUser = async (data: {
    username: string;
    password: string;
    email?: string;
    role: UserAccount['role'];
    complexId?: string;
    complexName?: string;
    circleId?: string;
    circleName?: string;
  }) => {
    await createUserAccount({
      username: data.username,
      password: data.password,
      email: data.email || '',
      role: data.role,
      isVerified: true,
      createdAt: new Date().toISOString(),
      complexId: data.complexId,
      complexName: data.complexName,
      circleId: data.circleId,
      circleName: data.circleName,
    });
    const updated = await getAllUsers();
    setUsersList(updated);
  };

  // Batch User Creation
  const handleCreateBatchUsers = async (
    names: string[],
    role: UserAccount['role'],
    defaultPassword: string,
    complexId?: string,
    complexName?: string,
    circleId?: string,
    circleName?: string
  ) => {
    const res = await createBatchUsers(
      names,
      role,
      defaultPassword,
      complexId,
      complexName,
      circleId,
      circleName
    );
    const updated = await getAllUsers();
    setUsersList(updated);
    return res;
  };

  // Delete User
  const handleDeleteUser = async (userId: string) => {
    await deleteUserAccount(userId);
    const updated = await getAllUsers();
    setUsersList(updated);
  };

  // Update User
  const handleUpdateUser = async (userId: string, data: Partial<UserAccount>) => {
    await updateUserAccount(userId, data);
    const updated = await getAllUsers();
    setUsersList(updated);
  };

  // Toggle External Registration
  const handleTogglePublicRegistration = async (allow: boolean) => {
    await saveSystemConfig({ allowPublicRegistration: allow });
    setSystemConfig((prev) => (prev ? { ...prev, allowPublicRegistration: allow } : null));
  };

  return (
    <motion.div
      key="admin-management-system"
      id="admin-management-system"
      initial={{ opacity: 0, y: 10 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.3 }}
      className="w-full max-w-7xl mx-auto space-y-6"
    >
      {/* Top Navbar Header */}
      <header className="bg-[#FFFFFF] border-2 border-[#E8DAC8] rounded-2xl p-4 sm:p-5 shadow-sm flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        {/* Brand & User info */}
        <div className="flex items-center gap-3">
          <div className="w-12 h-12 rounded-2xl bg-[#053B50] flex items-center justify-center text-[#E8DAC8] shadow-xs">
            <Building2 className="w-6 h-6" />
          </div>
          <div>
            <div className="flex items-center gap-2">
              <h1 className="font-black text-lg text-[#053B50]">
                نظام إدارة المجمعات القرآنية
              </h1>
              <span className="bg-[#E8DAC8]/40 border border-[#E8DAC8] text-[#053B50] text-[11px] font-bold px-2 py-0.5 rounded-full">
                المشرف العام
              </span>
            </div>
            <p className="text-xs text-[#053B50]/70">
              مرحباً بك، <strong className="text-[#053B50]">{user.username}</strong> ({user.email || 'مسؤول النظام'})
            </p>
          </div>
        </div>

        {/* Action Controls */}
        <div className="flex items-center gap-2 self-end sm:self-center">
          <button
            type="button"
            onClick={loadAllData}
            className="p-2 bg-[#F7F3EE] hover:bg-[#E8DAC8] text-[#053B50] border border-[#E8DAC8] rounded-xl transition-colors cursor-pointer"
            title="تحديث البيانات"
          >
            <RefreshCw className={`w-4 h-4 ${isLoadingData ? 'animate-spin' : ''}`} />
          </button>

          <button
            type="button"
            onClick={onLogout}
            className="bg-red-50 hover:bg-red-100 text-red-700 border border-red-200 text-xs font-bold px-4 py-2 rounded-xl flex items-center gap-1.5 transition-colors cursor-pointer"
          >
            <LogOut className="w-4 h-4" />
            <span>تسجيل الخروج</span>
          </button>
        </div>
      </header>

      {/* Main Navigation Tabs */}
      <nav className="bg-[#FFFFFF] border-2 border-[#E8DAC8] p-1.5 rounded-2xl shadow-xs flex items-center gap-2 overflow-x-auto">
        <button
          type="button"
          onClick={() => setActiveTab('home')}
          className={`flex-1 min-w-[140px] py-3 px-4 rounded-xl text-xs sm:text-sm font-black flex items-center justify-center gap-2 transition-all cursor-pointer ${
            activeTab === 'home'
              ? 'bg-[#053B50] text-[#FFFFFF] shadow-sm'
              : 'bg-transparent text-[#053B50] hover:bg-[#F7F3EE]'
          }`}
        >
          <LayoutDashboard className="w-4 h-4" />
          <span>الصفحة الرئيسية (الإحصائيات)</span>
        </button>

        <button
          type="button"
          onClick={() => setActiveTab('complexes')}
          className={`flex-1 min-w-[140px] py-3 px-4 rounded-xl text-xs sm:text-sm font-black flex items-center justify-center gap-2 transition-all cursor-pointer ${
            activeTab === 'complexes'
              ? 'bg-[#053B50] text-[#FFFFFF] shadow-sm'
              : 'bg-transparent text-[#053B50] hover:bg-[#F7F3EE]'
          }`}
        >
          <Building2 className="w-4 h-4" />
          <span>المجمعات والحلقات</span>
        </button>

        <button
          type="button"
          onClick={() => setActiveTab('accounts')}
          className={`flex-1 min-w-[140px] py-3 px-4 rounded-xl text-xs sm:text-sm font-black flex items-center justify-center gap-2 transition-all cursor-pointer ${
            activeTab === 'accounts'
              ? 'bg-[#053B50] text-[#FFFFFF] shadow-sm'
              : 'bg-transparent text-[#053B50] hover:bg-[#F7F3EE]'
          }`}
        >
          <Users className="w-4 h-4" />
          <span>إدارة الحسابات</span>
        </button>

        <button
          type="button"
          onClick={() => setActiveTab('settings')}
          className={`flex-1 min-w-[140px] py-3 px-4 rounded-xl text-xs sm:text-sm font-black flex items-center justify-center gap-2 transition-all cursor-pointer ${
            activeTab === 'settings'
              ? 'bg-[#053B50] text-[#FFFFFF] shadow-sm'
              : 'bg-transparent text-[#053B50] hover:bg-[#F7F3EE]'
          }`}
        >
          <Mail className="w-4 h-4" />
          <span>إعدادات بريد الإرسال</span>
        </button>
      </nav>

      {/* Tab 1: Home Dashboard Tab with Counters */}
      {activeTab === 'home' && (
        <HomeDashboardTab
          complexes={complexes}
          circles={circles}
          recitations={recitations}
          users={usersList}
          selectedDate={selectedDate}
          onNavigateToComplexes={() => setActiveTab('complexes')}
          onSelectStudent={(st) => setSelectedStudentForModal(st)}
        />
      )}

      {/* Tab 2: Complexes and Circles Tab */}
      {activeTab === 'complexes' && (
        <ComplexesAndCirclesTab
          complexes={complexes}
          circles={circles}
          recitations={recitations}
          users={usersList}
          selectedDate={selectedDate}
          onDateChange={(d) => setSelectedDate(d)}
          onAddComplex={handleAddComplex}
          onAddCircle={handleAddCircle}
          onAddRecitation={handleAddRecitation}
        />
      )}

      {/* Tab 3: Accounts Tab */}
      {activeTab === 'accounts' && (
        <AccountsTab
          users={usersList}
          complexes={complexes}
          circles={circles}
          allowPublicRegistration={systemConfig?.allowPublicRegistration ?? true}
          onTogglePublicRegistration={handleTogglePublicRegistration}
          onCreateSingleUser={handleCreateSingleUser}
          onCreateBatchUsers={handleCreateBatchUsers}
          onDeleteUser={handleDeleteUser}
          onUpdateUser={handleUpdateUser}
        />
      )}

      {/* Tab 4: Mailer Settings Tab */}
      {activeTab === 'settings' && (
        <div className="bg-[#FFFFFF] border-2 border-[#E8DAC8] rounded-2xl p-6 sm:p-10 shadow-xs max-w-3xl mx-auto space-y-6">
          <div className="flex items-center gap-3">
            <div className="w-12 h-12 rounded-xl bg-[#053B50] text-[#E8DAC8] flex items-center justify-center">
              <Mail className="w-6 h-6" />
            </div>
            <div>
              <h2 className="text-xl font-black text-[#053B50]">
                تفويض بريد الإرسال المعتمد للنظام
              </h2>
              <p className="text-xs text-[#053B50]/75">
                تثبيت الحساب المخول بإرسال رسائل التحقق وتغيير كلمات المرور للمسجلين الجدد
              </p>
            </div>
          </div>

          <div className="bg-[#F7F3EE] p-4 rounded-xl border border-[#E8DAC8] text-xs text-[#053B50]/80 space-y-2">
            <div className="flex justify-between items-center">
              <span>البريد الإلكتروني المعتمد الحالي للإرسال:</span>
              <strong className="font-mono text-[#053B50]">{systemConfig?.senderEmail || user.email}</strong>
            </div>
            <div className="flex justify-between items-center">
              <span>حالة التفويض الدائم:</span>
              {hasGmailAuth ? (
                <span className="text-emerald-700 font-bold flex items-center gap-1">
                  <CheckCircle2 className="w-4 h-4" /> مفعل ومحفوظ في قاعدة البيانات
                </span>
              ) : (
                <span className="text-amber-700 font-bold flex items-center gap-1">
                  <AlertCircle className="w-4 h-4" /> بانتظار التفويض
                </span>
              )}
            </div>
          </div>

          {authSuccessMsg && (
            <div className="p-3 bg-emerald-100 text-emerald-800 rounded-xl text-xs font-bold flex items-center gap-2">
              <CheckCircle2 className="w-4 h-4 text-emerald-600 shrink-0" />
              <span>{authSuccessMsg}</span>
            </div>
          )}

          {errorMsg && (
            <div className="p-3 bg-red-100 text-red-800 rounded-xl text-xs font-bold flex items-center gap-2">
              <AlertCircle className="w-4 h-4 text-red-600 shrink-0" />
              <span>{errorMsg}</span>
            </div>
          )}

          <div className="pt-2">
            <button
              type="button"
              onClick={handleAuthorizeSender}
              disabled={isAuthorizing}
              className="bg-[#053B50] hover:bg-[#042E3F] text-[#FFFFFF] font-bold text-xs px-6 py-3 rounded-xl flex items-center gap-2 shadow-md cursor-pointer disabled:opacity-50"
            >
              <Send className="w-4 h-4 text-[#E8DAC8]" />
              <span>{isAuthorizing ? 'جاري الربط مع Google...' : hasGmailAuth ? 'إعادة تفويض وتحديث الصلاحية' : 'تفويض وإرسال من هذا الحساب'}</span>
            </button>
          </div>
        </div>
      )}

      {/* Modal: Student Detail & Recitation History */}
      {selectedStudentForModal && (
        <StudentDetailModal
          student={selectedStudentForModal}
          recitations={recitations}
          onClose={() => setSelectedStudentForModal(null)}
        />
      )}
    </motion.div>
  );
};
