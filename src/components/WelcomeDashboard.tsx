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
  ShieldCheck,
  Check,
  Globe,
  Lock,
} from 'lucide-react';
import type { UserAccount, SystemConfig, QuranComplex, QuranCircle, RecitationRecord } from '../types';
import {
  authorizeSenderEmail,
  deauthorizeSenderEmail,
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
  updateComplex,
  deleteComplex,
  updateCircle,
  deleteCircle,
  moveCircle,
} from '../lib/firebase';
import { sendEmailViaGmail } from '../lib/gmail';
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
  const [isSavingDirectly, setIsSavingDirectly] = useState(false);
  const [isSendingTestEmail, setIsSendingTestEmail] = useState(false);
  const [authSuccessMsg, setAuthSuccessMsg] = useState<string | null>(null);
  const [errorMsg, setErrorMsg] = useState<string | null>(null);
  const [testEmailResult, setTestEmailResult] = useState<{ success: boolean; msg: string } | null>(null);
  const [customSenderEmail, setCustomSenderEmail] = useState(user.email || '');
  const [customSenderName, setCustomSenderName] = useState('مجمع عزم التعليمي');

  const isSenderAdmin = Boolean(
    user.isOfficialSender ||
    user.role === 'general_admin' ||
    user.role === 'admin' ||
    user.role === 'supervisor'
  );

  const loadAllData = async () => {
    setIsLoadingData(true);
    try {
      // Seed sample data if empty so admin immediately sees the counters and rankings
      await seedInitialQuranDataIfEmpty();

      const [comps, circs, recs, allUsers, config] = await Promise.all([
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

      if (config?.senderEmail) {
        setCustomSenderEmail(config.senderEmail);
      }
      if (config?.senderName) {
        setCustomSenderName(config.senderName);
      }

      // Check permanent authorization in Firestore
      const isAuthorized = Boolean(config?.isAuthorized && (config?.senderEmail || user.email));
      setHasGmailAuth(isAuthorized);
    } catch (err) {
      console.error('Error loading dashboard data:', err);
    } finally {
      setIsLoadingData(false);
    }
  };

  useEffect(() => {
    loadAllData();
  }, []);

  // Google OAuth Authorization
  const handleAuthorizeWithGoogle = async () => {
    setIsAuthorizing(true);
    setAuthSuccessMsg(null);
    setErrorMsg(null);
    setTestEmailResult(null);
    try {
      const targetEmail = customSenderEmail.trim() || user.email;
      const res = await authorizeSenderEmail(targetEmail, {
        senderName: customSenderName,
        authorizedBy: `${user.username} (${user.role})`,
      });

      if (res.success) {
        setHasGmailAuth(true);
        setAuthSuccessMsg(
          'تم تفويض وتثبيت الحساب بنجاح! تم حفظ التفويض بشكل دائم في قاعدة البيانات وسيبقى مفعلاً دائماً حتى بعد إغلاق الجهاز وتحديث الموقع.'
        );
        const updated = await getSystemConfig();
        setSystemConfig(updated);
      } else {
        setErrorMsg(res.error || 'تعذر استكمال تفويض الحساب عبر Google');
      }
    } catch (err) {
      console.error('Google auth error:', err);
      setErrorMsg('حدث خطأ أثناء إجراء الربط مع Google');
    } finally {
      setIsAuthorizing(false);
    }
  };

  // Direct Permanent Database Authorization (Bypasses popup restrictions)
  const handleDirectPermanentAuthorization = async () => {
    setIsSavingDirectly(true);
    setAuthSuccessMsg(null);
    setErrorMsg(null);
    setTestEmailResult(null);
    try {
      const targetEmail = customSenderEmail.trim() || user.email;
      if (!targetEmail || !targetEmail.includes('@')) {
        setErrorMsg('يرجى كتابة بريد إلكتروني صحيح لاعتماده');
        setIsSavingDirectly(false);
        return;
      }

      const res = await authorizeSenderEmail(targetEmail, {
        forceSaveOnly: true,
        senderName: customSenderName,
        authorizedBy: `${user.username} (${user.role})`,
      });

      if (res.success) {
        setHasGmailAuth(true);
        setAuthSuccessMsg(
          `تم تثبيت واعتماد بريد (${targetEmail}) بشكل دائم للأبد في النظام! تم حفظ الإعدادات في قاعدة البيانات بنجاح.`
        );
        const updated = await getSystemConfig();
        setSystemConfig(updated);
      } else {
        setErrorMsg(res.error || 'تعذر حفظ التفويض في قاعدة البيانات');
      }
    } catch (err) {
      console.error('Direct auth save error:', err);
      setErrorMsg('حدث خطأ أثناء حفظ التفويض في قاعدة البيانات');
    } finally {
      setIsSavingDirectly(false);
    }
  };

  // Send Test Email
  const handleSendTestEmail = async () => {
    setIsSendingTestEmail(true);
    setTestEmailResult(null);
    try {
      const targetEmail = customSenderEmail.trim() || user.email;
      const testHtml = `
        <div dir="rtl" style="font-family: Arial, sans-serif; padding: 24px; color: #053B50; background: #FAF6F0; border-radius: 12px; border: 2px solid #E8DAC8;">
          <h2 style="color: #053B50; margin-bottom: 12px;">مجمع عزم التعليمي - رسالة اختبار التفويض</h2>
          <p style="font-size: 14px; line-height: 1.6;">السلام عليكم ورحمة الله وبركاته،</p>
          <p style="font-size: 14px; line-height: 1.6;">هذه رسالة تجريبية لتأكيد نجاح تفويض بريد المشرف المعتمد لإرسال الرسائل ورموز التحقق.</p>
          <div style="margin: 20px 0; padding: 14px; background: #FFFFFF; border-radius: 8px; border: 1px solid #E8DAC8; font-weight: bold; color: #053B50;">
            حالة الإرسال: فعال ومسجل بنجاح في قاعدة بيانات مجمع عزم التعليمي
          </div>
          <p style="font-size: 12px; color: #666;">تاريخ وتوقيت الاختبار: ${new Date().toLocaleString('ar-SA')}</p>
        </div>
      `;

      const result = await sendEmailViaGmail({
        to: targetEmail,
        subject: `رسالة اختبار تفويض بريد المشرف - مجمع عزم التعليمي`,
        htmlContent: testHtml,
        allowInteractiveAuth: true,
      });

      if (result.success) {
        setTestEmailResult({
          success: true,
          msg: `تم إرسال البريد التجريبي بنجاح إلى (${targetEmail})! الحساب مفعل ويعمل بكفاءة عالية.`,
        });
      } else {
        setTestEmailResult({
          success: false,
          msg: result.error || 'تعذر إرسال البريد التجريبي، يرجى التحقق من تفويض Google أو الصلاحيات.',
        });
      }
    } catch (err) {
      console.error('Test email error:', err);
      setTestEmailResult({
        success: false,
        msg: 'حدث خطأ غير متوقع أثناء إرسال البريد التجريبي.',
      });
    } finally {
      setIsSendingTestEmail(false);
    }
  };

  // De-authorize sender
  const handleDeauthorize = async () => {
    if (!window.confirm('هل أنت متأكد من رغبتك في إلغاء تفويض الحساب الحالي؟')) {
      return;
    }
    await deauthorizeSenderEmail();
    setHasGmailAuth(false);
    const updated = await getSystemConfig();
    setSystemConfig(updated);
    setAuthSuccessMsg('تم إلغاء التفويض بنجاح. يمكنك إعادة التفويض في أي وقت.');
  };

  // Complex Creation
  const handleAddComplex = async (name: string, locationName: string, lat?: number, lng?: number) => {
    await addComplex(name, locationName, lat, lng);
    const updatedComps = await getComplexes();
    setComplexes(updatedComps);
  };

  // Complex Update
  const handleUpdateComplex = async (
    complexId: string,
    data: { name: string; locationName: string; latitude?: number; longitude?: number }
  ) => {
    await updateComplex(complexId, data);
    const [cList, uList] = await Promise.all([getComplexes(), getAllUsers()]);
    setComplexes(cList);
    setUsersList(uList);
  };

  // Complex Delete
  const handleDeleteComplex = async (complexId: string) => {
    await deleteComplex(complexId);
    const [cList, cirList, uList] = await Promise.all([
      getComplexes(),
      getCircles(),
      getAllUsers(),
    ]);
    setComplexes(cList);
    setCircles(cirList);
    setUsersList(uList);
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

  // Circle Update
  const handleUpdateCircle = async (
    circleId: string,
    data: { name: string; teacherId?: string; teacherName?: string }
  ) => {
    await updateCircle(circleId, data);
    const [cirList, uList] = await Promise.all([getCircles(), getAllUsers()]);
    setCircles(cirList);
    setUsersList(uList);
  };

  // Circle Delete
  const handleDeleteCircle = async (circleId: string) => {
    await deleteCircle(circleId);
    const [cirList, uList] = await Promise.all([getCircles(), getAllUsers()]);
    setCircles(cirList);
    setUsersList(uList);
  };

  // Circle Move between complexes
  const handleMoveCircle = async (
    circleId: string,
    targetComplexId: string,
    targetComplexName: string
  ) => {
    await moveCircle(circleId, targetComplexId, targetComplexName);
    const [cirList, uList] = await Promise.all([getCircles(), getAllUsers()]);
    setCircles(cirList);
    setUsersList(uList);
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
          onUpdateComplex={handleUpdateComplex}
          onDeleteComplex={handleDeleteComplex}
          onUpdateCircle={handleUpdateCircle}
          onDeleteCircle={handleDeleteCircle}
          onMoveCircle={handleMoveCircle}
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
        <div className="bg-[#FFFFFF] border-2 border-[#E8DAC8] rounded-2xl p-6 sm:p-8 shadow-xs max-w-3xl mx-auto space-y-6">
          {/* Header */}
          <div className="flex items-start sm:items-center justify-between gap-4 pb-4 border-b border-[#E8DAC8]">
            <div className="flex items-center gap-3">
              <div className="w-12 h-12 rounded-2xl bg-[#053B50] text-[#E8DAC8] flex items-center justify-center shadow-xs">
                <Mail className="w-6 h-6" />
              </div>
              <div>
                <h2 className="text-xl font-black text-[#053B50]">
                  تفويض بريد المشرف المعتمد للنظام
                </h2>
                <p className="text-xs text-[#053B50]/75">
                  اعتماد وتثبيت الحساب المخول بإرسال رسائل التحقق وتغيير كلمات المرور
                </p>
              </div>
            </div>

            <span
              className={`px-3 py-1 rounded-full text-xs font-bold flex items-center gap-1.5 shrink-0 ${
                hasGmailAuth
                  ? 'bg-emerald-100 text-emerald-800 border border-emerald-300'
                  : 'bg-amber-100 text-amber-800 border border-amber-300'
              }`}
            >
              {hasGmailAuth ? (
                <>
                  <CheckCircle2 className="w-3.5 h-3.5" />
                  مفعل ومحفوظ دائماً
                </>
              ) : (
                <>
                  <AlertCircle className="w-3.5 h-3.5" />
                  بانتظار التفويض
                </>
              )}
            </span>
          </div>

          {/* Permanent Status Overview Card */}
          <div className="bg-[#F7F3EE] p-5 rounded-xl border border-[#E8DAC8] space-y-3">
            <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2 text-xs">
              <span className="text-[#053B50]/70 font-bold">البريد الإلكتروني المعتمد حالياً:</span>
              <strong dir="ltr" className="font-mono text-sm text-[#053B50] bg-[#FFFFFF] px-3 py-1 rounded-lg border border-[#E8DAC8]">
                {systemConfig?.senderEmail || user.email || 'لم يحدد بعد'}
              </strong>
            </div>

            <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2 text-xs">
              <span className="text-[#053B50]/70 font-bold">حالة الحفظ والاستمرارية:</span>
              {hasGmailAuth ? (
                <span className="text-emerald-800 font-bold flex items-center gap-1">
                  <ShieldCheck className="w-4 h-4 text-emerald-600" />
                  محفوظ للأبد في قاعدة البيانات (يبقى مفعلاً حتى بعد إغلاق الجهاز أو تحديث الموقع)
                </span>
              ) : (
                <span className="text-amber-800 font-bold flex items-center gap-1">
                  <AlertCircle className="w-4 h-4 text-amber-600" />
                  غير مفوض حالياً
                </span>
              )}
            </div>

            {systemConfig?.authorizedAt && (
              <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2 text-[11px] text-[#053B50]/60 border-t border-[#E8DAC8]/60 pt-2">
                <span>تاريخ آخر تفويض وتثبيت:</span>
                <span dir="ltr">{new Date(systemConfig.authorizedAt).toLocaleString('ar-SA')}</span>
              </div>
            )}

            {systemConfig?.authorizedBy && (
              <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2 text-[11px] text-[#053B50]/60">
                <span>المشرف المفوض:</span>
                <span className="font-bold text-[#053B50]">{systemConfig.authorizedBy}</span>
              </div>
            )}
          </div>

          {/* Email Settings Configuration Form */}
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            <div>
              <label className="block text-xs font-bold text-[#053B50] mb-1.5">
                البريد الإلكتروني للمشرف المراد اعتماده
              </label>
              <input
                type="email"
                value={customSenderEmail}
                onChange={(e) => setCustomSenderEmail(e.target.value)}
                placeholder="supervisor@example.com"
                dir="ltr"
                className="w-full bg-[#FFFFFF] border-2 border-[#E8DAC8] focus:border-[#053B50] rounded-xl px-3.5 py-2.5 text-xs text-[#053B50] outline-none transition-colors"
              />
            </div>

            <div>
              <label className="block text-xs font-bold text-[#053B50] mb-1.5">
                اسم الجهة المرسلة (يظهر في بريد الطلاب)
              </label>
              <input
                type="text"
                value={customSenderName}
                onChange={(e) => setCustomSenderName(e.target.value)}
                placeholder="مجمع عزم التعليمي"
                className="w-full bg-[#FFFFFF] border-2 border-[#E8DAC8] focus:border-[#053B50] rounded-xl px-3.5 py-2.5 text-xs text-[#053B50] outline-none transition-colors"
              />
            </div>
          </div>

          {/* Feedback Messages */}
          {authSuccessMsg && (
            <div className="p-3.5 bg-emerald-50 border border-emerald-200 text-emerald-800 rounded-xl text-xs font-bold flex items-start gap-2.5">
              <CheckCircle2 className="w-4 h-4 text-emerald-600 shrink-0 mt-0.5" />
              <span>{authSuccessMsg}</span>
            </div>
          )}

          {errorMsg && (
            <div className="p-3.5 bg-red-50 border border-red-200 text-red-800 rounded-xl text-xs font-bold flex items-start gap-2.5">
              <AlertCircle className="w-4 h-4 text-red-600 shrink-0 mt-0.5" />
              <span>{errorMsg}</span>
            </div>
          )}

          {testEmailResult && (
            <div
              className={`p-3.5 rounded-xl text-xs font-bold flex items-start gap-2.5 border ${
                testEmailResult.success
                  ? 'bg-emerald-50 border-emerald-200 text-emerald-800'
                  : 'bg-amber-50 border-amber-200 text-amber-900'
              }`}
            >
              {testEmailResult.success ? (
                <CheckCircle2 className="w-4 h-4 text-emerald-600 shrink-0 mt-0.5" />
              ) : (
                <AlertCircle className="w-4 h-4 text-amber-600 shrink-0 mt-0.5" />
              )}
              <span>{testEmailResult.msg}</span>
            </div>
          )}

          {/* Action Buttons */}
          <div className="pt-2 flex flex-col sm:flex-row items-stretch sm:items-center gap-3 flex-wrap">
            {/* Direct Database Permanent Authorization */}
            <button
              type="button"
              onClick={handleDirectPermanentAuthorization}
              disabled={isSavingDirectly || isAuthorizing}
              className="bg-[#053B50] hover:bg-[#042E3F] text-[#FFFFFF] font-bold text-xs px-5 py-3 rounded-xl flex items-center justify-center gap-2 shadow-sm cursor-pointer disabled:opacity-50 transition-colors"
            >
              <ShieldCheck className="w-4 h-4 text-[#E8DAC8]" />
              <span>{isSavingDirectly ? 'جاري الحفظ في قاعدة البيانات...' : 'تثبيت وحفظ التفويض الدائم للأبد'}</span>
            </button>

            {/* Google OAuth Authorization */}
            <button
              type="button"
              onClick={handleAuthorizeWithGoogle}
              disabled={isAuthorizing || isSavingDirectly}
              className="bg-[#FFFFFF] hover:bg-[#F7F3EE] text-[#053B50] border-2 border-[#053B50] font-bold text-xs px-5 py-3 rounded-xl flex items-center justify-center gap-2 shadow-xs cursor-pointer disabled:opacity-50 transition-colors"
            >
              <Globe className="w-4 h-4 text-[#053B50]" />
              <span>{isAuthorizing ? 'جاري الاتصال بـ Google...' : 'ربط وتفويض الحساب عبر Google'}</span>
            </button>

            {/* Test Email Dispatch */}
            <button
              type="button"
              onClick={handleSendTestEmail}
              disabled={isSendingTestEmail}
              className="bg-[#F7F3EE] hover:bg-[#E8DAC8] text-[#053B50] border border-[#E8DAC8] font-bold text-xs px-5 py-3 rounded-xl flex items-center justify-center gap-2 cursor-pointer disabled:opacity-50 transition-colors"
            >
              <Send className="w-4 h-4" />
              <span>{isSendingTestEmail ? 'جاري إرسال البريد التجريبي...' : 'إرسال بريد تجريبي للاختبار'}</span>
            </button>

            {/* De-authorize button */}
            {hasGmailAuth && (
              <button
                type="button"
                onClick={handleDeauthorize}
                className="text-red-700 hover:text-red-800 hover:bg-red-50 text-xs font-bold px-4 py-3 rounded-xl transition-colors cursor-pointer mr-auto"
              >
                إلغاء التفويض
              </button>
            )}
          </div>

          {/* Explanation Box */}
          <div className="p-4 bg-[#F7F3EE]/60 rounded-xl border border-[#E8DAC8] text-[11px] text-[#053B50]/75 space-y-1">
            <p className="font-bold text-[#053B50]">
              🛡️ الضمان الدائم للتفويض:
            </p>
            <p>
              بمجرد النقر على <strong>"تثبيت وحفظ التفويض الدائم للأبد"</strong>، يتم تسجيل بريد المشرف في سجل الإعدادات الأساسية لقاعدة بيانات Firebase. سيبقى الحساب مفوضاً بشكل دائم حتى لو قمت بإعادة تشغيل الجهاز أو إغلاق المتصفح أو تحديث الصفحة.
            </p>
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
