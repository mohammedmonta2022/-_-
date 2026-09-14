import React, { useState } from 'react';
import {
  Users,
  UserPlus,
  UserCheck,
  Shield,
  Trash2,
  Edit2,
  Lock,
  Unlock,
  Search,
  CheckCircle2,
  AlertCircle,
  FileSpreadsheet,
  GraduationCap,
  BookOpen,
} from 'lucide-react';
import type { UserAccount, UserRole, QuranComplex, QuranCircle } from '../types';

interface AccountsTabProps {
  users: UserAccount[];
  complexes: QuranComplex[];
  circles: QuranCircle[];
  allowPublicRegistration: boolean;
  onTogglePublicRegistration: (allow: boolean) => Promise<void>;
  onCreateSingleUser: (data: {
    username: string;
    password: string;
    email?: string;
    role: UserRole;
    complexId?: string;
    complexName?: string;
    circleId?: string;
    circleName?: string;
  }) => Promise<void>;
  onCreateBatchUsers: (
    names: string[],
    role: UserRole,
    defaultPassword: string,
    complexId?: string,
    complexName?: string,
    circleId?: string,
    circleName?: string
  ) => Promise<{ count: number }>;
  onDeleteUser: (userId: string) => Promise<void>;
  onUpdateUser: (userId: string, data: Partial<UserAccount>) => Promise<void>;
}

export const AccountsTab: React.FC<AccountsTabProps> = ({
  users,
  complexes,
  circles,
  allowPublicRegistration,
  onTogglePublicRegistration,
  onCreateSingleUser,
  onCreateBatchUsers,
  onDeleteUser,
  onUpdateUser,
}) => {
  const [searchQuery, setSearchQuery] = useState('');
  const [filterRole, setFilterRole] = useState<string>('all');

  // Modals
  const [showSingleModal, setShowSingleModal] = useState(false);
  const [showBatchModal, setShowBatchModal] = useState(false);
  const [editingUser, setEditingUser] = useState<UserAccount | null>(null);

  // Single User Form State
  const [username, setUsername] = useState('');
  const [password, setPassword] = useState('');
  const [email, setEmail] = useState('');
  const [role, setRole] = useState<UserRole>('student');
  const [selectedComplexId, setSelectedComplexId] = useState('');
  const [selectedCircleId, setSelectedCircleId] = useState('');
  const [circleSearchFilter, setCircleSearchFilter] = useState('');
  const [isSubmittingSingle, setIsSubmittingSingle] = useState(false);
  const [singleSuccessMsg, setSingleSuccessMsg] = useState<string | null>(null);

  // Batch User Form State
  const [batchNamesText, setBatchNamesText] = useState('');
  const [batchRole, setBatchRole] = useState<UserRole>('student');
  const [batchPassword, setBatchPassword] = useState('123456');
  const [batchComplexId, setBatchComplexId] = useState('');
  const [batchCircleId, setBatchCircleId] = useState('');
  const [isSubmittingBatch, setIsSubmittingBatch] = useState(false);
  const [batchSuccessMsg, setBatchSuccessMsg] = useState<string | null>(null);

  // Toggling registration state
  const [togglingReg, setTogglingReg] = useState(false);

  // Filter circles according to selected complex
  const availableCircles = circles.filter(
    (c) => !selectedComplexId || c.complexId === selectedComplexId
  );
  const filteredAvailableCircles = availableCircles.filter((c) =>
    c.name.toLowerCase().includes(circleSearchFilter.toLowerCase())
  );

  const batchAvailableCircles = circles.filter(
    (c) => !batchComplexId || c.complexId === batchComplexId
  );

  const handleCreateSingle = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!username.trim() || !password) return;
    setIsSubmittingSingle(true);
    setSingleSuccessMsg(null);
    try {
      const comp = complexes.find((c) => c.id === selectedComplexId);
      const circ = circles.find((c) => c.id === selectedCircleId);
      await onCreateSingleUser({
        username: username.trim(),
        password,
        email: email.trim() || undefined,
        role,
        complexId: comp?.id,
        complexName: comp?.name,
        circleId: circ?.id,
        circleName: circ?.name,
      });
      setSingleSuccessMsg('تمت إضافة الحساب بنجاح!');
      setUsername('');
      setPassword('');
      setEmail('');
      setSelectedComplexId('');
      setSelectedCircleId('');
      setTimeout(() => {
        setShowSingleModal(false);
        setSingleSuccessMsg(null);
      }, 1200);
    } catch (err) {
      console.error(err);
    } finally {
      setIsSubmittingSingle(false);
    }
  };

  const handleCreateBatch = async (e: React.FormEvent) => {
    e.preventDefault();
    const names = batchNamesText
      .split('\n')
      .map((n) => n.trim())
      .filter((n) => n.length > 0);

    if (names.length === 0 || !batchPassword) return;

    setIsSubmittingBatch(true);
    setBatchSuccessMsg(null);
    try {
      const comp = complexes.find((c) => c.id === batchComplexId);
      const circ = circles.find((c) => c.id === batchCircleId);
      const res = await onCreateBatchUsers(
        names,
        batchRole,
        batchPassword,
        comp?.id,
        comp?.name,
        circ?.id,
        circ?.name
      );
      setBatchSuccessMsg(`تمت إضافة دفعة مكونة من (${res.count}) حساب بنجاح وبنفس كلمة المرور!`);
      setBatchNamesText('');
      setTimeout(() => {
        setShowBatchModal(false);
        setBatchSuccessMsg(null);
      }, 1600);
    } catch (err) {
      console.error(err);
    } finally {
      setIsSubmittingBatch(false);
    }
  };

  const handleToggleReg = async () => {
    setTogglingReg(true);
    try {
      await onTogglePublicRegistration(!allowPublicRegistration);
    } finally {
      setTogglingReg(false);
    }
  };

  const filteredUsers = users.filter((u) => {
    const matchSearch =
      u.username.toLowerCase().includes(searchQuery.toLowerCase()) ||
      u.email.toLowerCase().includes(searchQuery.toLowerCase()) ||
      (u.complexName && u.complexName.toLowerCase().includes(searchQuery.toLowerCase())) ||
      (u.circleName && u.circleName.toLowerCase().includes(searchQuery.toLowerCase()));

    if (!matchSearch) return false;
    if (filterRole === 'all') return true;
    return u.role === filterRole;
  });

  return (
    <div className="space-y-6">
      {/* Control Header Strip */}
      <div className="bg-[#FFFFFF] border-2 border-[#E8DAC8] p-5 rounded-2xl shadow-xs">
        <div className="flex flex-col lg:flex-row lg:items-center justify-between gap-4">
          <div>
            <h2 className="text-xl sm:text-2xl font-black text-[#053B50]">
              إدارة الحسابات والصلاحيات
            </h2>
            <p className="text-xs text-[#053B50]/75 mt-0.5">
              إضافة طلاب ومعلمين ومشرفين فردياً أو بالدفعات، والتحكم في إغلاق إنشاء الحسابات الخارجية
            </p>
          </div>

          <div className="flex items-center gap-2 flex-wrap">
            {/* Toggle Public Registration in outside page */}
            <button
              type="button"
              onClick={handleToggleReg}
              disabled={togglingReg}
              className={`text-xs font-bold px-3.5 py-2 rounded-xl border transition-all flex items-center gap-1.5 cursor-pointer ${
                allowPublicRegistration
                  ? 'bg-emerald-50 text-emerald-800 border-emerald-300 hover:bg-emerald-100'
                  : 'bg-red-50 text-red-800 border-red-300 hover:bg-red-100'
              }`}
              title="التحكم في إتاحة أو إغلاق التسجيل المفتوح من شاشة تسجيل الدخول الخارجية"
            >
              {allowPublicRegistration ? (
                <>
                  <Unlock className="w-4 h-4 text-emerald-600" />
                  <span>التسجيل الخارجي: متاح (انقر للإغلاق)</span>
                </>
              ) : (
                <>
                  <Lock className="w-4 h-4 text-red-600" />
                  <span>التسجيل الخارجي: مغلق (انقر للفتح)</span>
                </>
              )}
            </button>

            {/* Add Batch Button */}
            <button
              type="button"
              onClick={() => setShowBatchModal(true)}
              className="bg-[#F7F3EE] hover:bg-[#E8DAC8] text-[#053B50] border border-[#E8DAC8] text-xs font-bold px-4 py-2.5 rounded-xl flex items-center gap-1.5 cursor-pointer transition-colors"
            >
              <FileSpreadsheet className="w-4 h-4 text-[#053B50]" />
              <span>أضف دفعة حسابات</span>
            </button>

            {/* Add Single Account Button */}
            <button
              type="button"
              onClick={() => setShowSingleModal(true)}
              className="bg-[#053B50] hover:bg-[#042E3F] text-[#FFFFFF] text-xs font-bold px-4 py-2.5 rounded-xl flex items-center gap-1.5 shadow-md cursor-pointer transition-colors"
            >
              <UserPlus className="w-4 h-4 text-[#E8DAC8]" />
              <span>إضافة حساب فردي</span>
            </button>
          </div>
        </div>
      </div>

      {/* Filter and Search Bar */}
      <div className="bg-[#FFFFFF] border-2 border-[#E8DAC8] p-4 rounded-2xl shadow-xs flex flex-col sm:flex-row items-center justify-between gap-3">
        {/* Search */}
        <div className="relative w-full sm:w-80">
          <input
            type="text"
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            placeholder="ابحث بالاسم، البريد، الحلقة، المجمع..."
            className="w-full pr-9 pl-4 py-2 border-2 border-[#E8DAC8] rounded-xl outline-none focus:border-[#053B50] text-xs"
          />
          <Search className="w-4 h-4 text-[#053B50]/50 absolute right-3 top-2.5" />
        </div>

        {/* Roles Filter Tabs */}
        <div className="flex gap-1.5 flex-wrap w-full sm:w-auto">
          {[
            { id: 'all', label: 'كافة الحسابات' },
            { id: 'student', label: 'الطلاب' },
            { id: 'teacher', label: 'المعلمون' },
            { id: 'supervisor', label: 'مشرفو المجمعات' },
            { id: 'general_admin', label: 'المشرفون العامون' },
          ].map((r) => (
            <button
              key={r.id}
              type="button"
              onClick={() => setFilterRole(r.id)}
              className={`text-xs px-3 py-1.5 rounded-lg border transition-all cursor-pointer ${
                filterRole === r.id
                  ? 'bg-[#053B50] text-[#FFFFFF] border-[#053B50] font-bold'
                  : 'bg-[#F7F3EE] text-[#053B50] border-[#E8DAC8] hover:border-[#053B50]'
              }`}
            >
              {r.label}
            </button>
          ))}
        </div>
      </div>

      {/* Accounts Table */}
      <div className="bg-[#FFFFFF] border-2 border-[#E8DAC8] rounded-2xl overflow-hidden shadow-xs">
        <div className="overflow-x-auto">
          <table className="w-full text-right text-xs">
            <thead>
              <tr className="bg-[#F7F3EE] border-b-2 border-[#E8DAC8] text-[#053B50]">
                <th className="p-3.5 font-bold">اسم الحساب</th>
                <th className="p-3.5 font-bold">البريد الإلكتروني</th>
                <th className="p-3.5 font-bold">نوع الحساب / الصلاحية</th>
                <th className="p-3.5 font-bold">المجمع / الحلقة</th>
                <th className="p-3.5 font-bold text-center">إجراءات</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-[#E8DAC8]">
              {filteredUsers.length === 0 ? (
                <tr>
                  <td colSpan={5} className="p-8 text-center text-[#053B50]/60">
                    لا توجد أي حسابات تطابق البحث أو الفلتر
                  </td>
                </tr>
              ) : (
                filteredUsers.map((u) => {
                  const isGenAdmin = u.role === 'general_admin' || u.role === 'admin';
                  const isSuper = u.role === 'supervisor';
                  const isTeacher = u.role === 'teacher';

                  return (
                    <tr key={u.id} className="hover:bg-[#F7F3EE]/50 transition-colors">
                      <td className="p-3.5 font-bold text-[#053B50]">
                        <div className="flex items-center gap-2">
                          <div className="w-7 h-7 rounded-full bg-[#E8DAC8]/30 flex items-center justify-center text-[#053B50]">
                            <Users className="w-3.5 h-3.5" />
                          </div>
                          <span>{u.username}</span>
                        </div>
                      </td>

                      <td className="p-3.5 font-mono text-[#053B50]/80" dir="ltr">
                        {u.email || '—'}
                      </td>

                      <td className="p-3.5">
                        <span
                          className={`inline-flex items-center gap-1 px-2.5 py-0.5 rounded-full text-[11px] font-bold ${
                            isGenAdmin
                              ? 'bg-amber-100 text-amber-900 border border-amber-300'
                              : isSuper
                              ? 'bg-purple-100 text-purple-900 border border-purple-200'
                              : isTeacher
                              ? 'bg-blue-100 text-blue-900 border border-blue-200'
                              : 'bg-emerald-100 text-emerald-900 border border-emerald-200'
                          }`}
                        >
                          <Shield className="w-3 h-3" />
                          <span>
                            {isGenAdmin
                              ? 'مشرف عام'
                              : isSuper
                              ? 'مشرف مجمع'
                              : isTeacher
                              ? 'معلم حلقة'
                              : 'طالب'}
                          </span>
                        </span>
                      </td>

                      <td className="p-3.5 text-[#053B50]/80">
                        {isGenAdmin ? (
                          <span className="text-amber-800 font-bold">صلاحيات كاملة على كافة المجمعات</span>
                        ) : (
                          <div>
                            <span className="font-bold text-[#053B50] block">{u.complexName || 'غير محدد'}</span>
                            {u.circleName && <span className="text-[11px] text-[#053B50]/70">حلقة: {u.circleName}</span>}
                          </div>
                        )}
                      </td>

                      <td className="p-3.5 text-center">
                        <div className="flex items-center justify-center gap-1.5">
                          <button
                            type="button"
                            onClick={() => setEditingUser(u)}
                            className="p-1.5 hover:bg-[#E8DAC8] text-[#053B50] rounded-lg transition-colors cursor-pointer"
                            title="تعديل الحساب"
                          >
                            <Edit2 className="w-3.5 h-3.5" />
                          </button>
                          <button
                            type="button"
                            onClick={() => {
                              if (window.confirm(`هل أنت متأكد من حذف حساب (${u.username})؟`)) {
                                if (u.id) onDeleteUser(u.id);
                              }
                            }}
                            className="p-1.5 hover:bg-red-100 text-red-600 rounded-lg transition-colors cursor-pointer"
                            title="حذف الحساب"
                          >
                            <Trash2 className="w-3.5 h-3.5" />
                          </button>
                        </div>
                      </td>
                    </tr>
                  );
                })
              )}
            </tbody>
          </table>
        </div>
      </div>

      {/* MODAL: Single User Creation */}
      {showSingleModal && (
        <div className="fixed inset-0 z-[1000] bg-[#053B50]/70 backdrop-blur-sm flex items-center justify-center p-4">
          <div className="bg-[#FFFFFF] border-2 border-[#E8DAC8] rounded-2xl w-full max-w-lg p-6 shadow-2xl overflow-y-auto max-h-[92vh]">
            <h3 className="text-lg font-black text-[#053B50] mb-1 flex items-center gap-2">
              <UserPlus className="w-5 h-5 text-[#053B50]" />
              <span>إضافة حساب مستخدم جديد</span>
            </h3>
            <p className="text-xs text-[#053B50]/70 mb-4">
              يمكنك إضافة طالب، معلم، مشرف مجمع، أو مشرف عام، وتحديد الحلقات والمجمعات المناسبة
            </p>

            {singleSuccessMsg && (
              <div className="mb-3 p-2.5 bg-emerald-100 text-emerald-800 rounded-xl text-xs font-bold flex items-center gap-1.5">
                <CheckCircle2 className="w-4 h-4 text-emerald-600 shrink-0" />
                <span>{singleSuccessMsg}</span>
              </div>
            )}

            <form onSubmit={handleCreateSingle} className="space-y-3.5 text-xs">
              <div>
                <label className="block font-bold text-[#053B50] mb-1">اسم المستخدم <span className="text-red-500">*</span></label>
                <input
                  type="text"
                  required
                  value={username}
                  onChange={(e) => setUsername(e.target.value)}
                  placeholder="مثال: يوسف بن إبراهيم الصالح"
                  className="w-full p-2.5 border-2 border-[#E8DAC8] rounded-xl outline-none focus:border-[#053B50] text-sm"
                  autoFocus
                />
              </div>

              <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                <div>
                  <label className="block font-bold text-[#053B50] mb-1">كلمة المرور <span className="text-red-500">*</span></label>
                  <input
                    type="password"
                    required
                    value={password}
                    onChange={(e) => setPassword(e.target.value)}
                    placeholder="كلمة مرور الحساب"
                    className="w-full p-2.5 border-2 border-[#E8DAC8] rounded-xl outline-none focus:border-[#053B50]"
                  />
                </div>

                <div>
                  <label className="block font-bold text-[#053B50] mb-1">البريد الإلكتروني (اختياري):</label>
                  <input
                    type="email"
                    value={email}
                    onChange={(e) => setEmail(e.target.value)}
                    placeholder="user@example.com"
                    dir="ltr"
                    className="w-full p-2.5 border-2 border-[#E8DAC8] rounded-xl outline-none focus:border-[#053B50] text-right"
                  />
                </div>
              </div>

              {/* Role Selection */}
              <div>
                <label className="block font-bold text-[#053B50] mb-1">نوع الحساب / الصفة:</label>
                <div className="grid grid-cols-2 sm:grid-cols-4 gap-2">
                  {[
                    { id: 'student', label: 'طالب' },
                    { id: 'teacher', label: 'معلم' },
                    { id: 'supervisor', label: 'مشرف مجمع' },
                    { id: 'general_admin', label: 'مشرف عام' },
                  ].map((r) => (
                    <button
                      key={r.id}
                      type="button"
                      onClick={() => setRole(r.id as UserRole)}
                      className={`py-2 px-1 rounded-xl border text-xs font-bold transition-all cursor-pointer ${
                        role === r.id
                          ? 'bg-[#053B50] text-[#FFFFFF] border-[#053B50]'
                          : 'bg-[#F7F3EE] text-[#053B50] border-[#E8DAC8] hover:border-[#053B50]'
                      }`}
                    >
                      {r.label}
                    </button>
                  ))}
                </div>
              </div>

              {/* Complex and Circle selection if NOT general_admin */}
              {role !== 'general_admin' && (
                <div className="bg-[#F7F3EE] p-3.5 rounded-xl border border-[#E8DAC8] space-y-3">
                  <div>
                    <label className="block font-bold text-[#053B50] mb-1">المجمع التابع له:</label>
                    <select
                      value={selectedComplexId}
                      onChange={(e) => {
                        setSelectedComplexId(e.target.value);
                        setSelectedCircleId('');
                      }}
                      className="w-full p-2 border border-[#E8DAC8] rounded-xl outline-none focus:border-[#053B50] text-xs bg-white"
                    >
                      <option value="">-- اختر المجمع القرآني --</option>
                      {complexes.map((c) => (
                        <option key={c.id} value={c.id}>
                          {c.name}
                        </option>
                      ))}
                    </select>
                  </div>

                  {(role === 'student' || role === 'teacher') && (
                    <div>
                      <label className="block font-bold text-[#053B50] mb-1">
                        الحلقة القرآنية (يمكنك البحث بالاسم):
                      </label>
                      <input
                        type="text"
                        value={circleSearchFilter}
                        onChange={(e) => setCircleSearchFilter(e.target.value)}
                        placeholder="ابحث عن اسم حلقة معينة..."
                        className="w-full p-2 border border-[#E8DAC8] rounded-xl outline-none focus:border-[#053B50] text-xs bg-white mb-2"
                      />
                      <select
                        value={selectedCircleId}
                        onChange={(e) => setSelectedCircleId(e.target.value)}
                        className="w-full p-2 border border-[#E8DAC8] rounded-xl outline-none focus:border-[#053B50] text-xs bg-white"
                      >
                        <option value="">-- اختر الحلقة التابع لها --</option>
                        {filteredAvailableCircles.map((c) => (
                          <option key={c.id} value={c.id}>
                            {c.name} (معلم: {c.teacherName || 'لم يحدد'})
                          </option>
                        ))}
                      </select>
                    </div>
                  )}
                </div>
              )}

              <div className="flex justify-end gap-2 pt-2">
                <button
                  type="button"
                  onClick={() => setShowSingleModal(false)}
                  className="px-4 py-2 bg-gray-100 hover:bg-gray-200 rounded-xl font-bold"
                >
                  إلغاء
                </button>
                <button
                  type="submit"
                  disabled={isSubmittingSingle || !username.trim() || !password}
                  className="px-5 py-2.5 bg-[#053B50] text-[#FFFFFF] rounded-xl font-bold hover:bg-[#042E3F] disabled:opacity-50"
                >
                  {isSubmittingSingle ? 'جاري الحفظ...' : 'إضافة الحساب'}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* MODAL: Batch User Creation (إضافة دفعات) */}
      {showBatchModal && (
        <div className="fixed inset-0 z-[1000] bg-[#053B50]/70 backdrop-blur-sm flex items-center justify-center p-4">
          <div className="bg-[#FFFFFF] border-2 border-[#E8DAC8] rounded-2xl w-full max-w-lg p-6 shadow-2xl overflow-y-auto max-h-[92vh]">
            <h3 className="text-lg font-black text-[#053B50] mb-1 flex items-center gap-2">
              <FileSpreadsheet className="w-5 h-5 text-[#053B50]" />
              <span>إضافة دفعة حسابات (طلاب أو معلمين أو مشرفين)</span>
            </h3>
            <p className="text-xs text-[#053B50]/70 mb-4">
              اكتب أو انسخ جميع الأسماء (كل اسم في سطر مستقل)، وحدد الصلاحية وكلمة مرور موحدة للدفعة.
            </p>

            {batchSuccessMsg && (
              <div className="mb-3 p-2.5 bg-emerald-100 text-emerald-800 rounded-xl text-xs font-bold flex items-center gap-1.5">
                <CheckCircle2 className="w-4 h-4 text-emerald-600 shrink-0" />
                <span>{batchSuccessMsg}</span>
              </div>
            )}

            <form onSubmit={handleCreateBatch} className="space-y-3.5 text-xs">
              <div>
                <label className="block font-bold text-[#053B50] mb-1">
                  قائمة الأسماء (اكتب اسماً في كل سطر) <span className="text-red-500">*</span>:
                </label>
                <textarea
                  rows={6}
                  required
                  value={batchNamesText}
                  onChange={(e) => setBatchNamesText(e.target.value)}
                  placeholder={`عبدالرحمن بن خالد المطيري\nسعد بن صالح الدوسري\nمحمد بن علي القحطاني\nفيصل بن نايف العتيبي...`}
                  className="w-full p-3 border-2 border-[#E8DAC8] rounded-xl outline-none focus:border-[#053B50] text-xs font-medium leading-relaxed"
                  autoFocus
                />
              </div>

              <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                <div>
                  <label className="block font-bold text-[#053B50] mb-1">نوع حسابات الدفعة:</label>
                  <select
                    value={batchRole}
                    onChange={(e) => setBatchRole(e.target.value as UserRole)}
                    className="w-full p-2.5 border-2 border-[#E8DAC8] rounded-xl outline-none focus:border-[#053B50] bg-white font-bold"
                  >
                    <option value="student">طلاب</option>
                    <option value="teacher">معلمون</option>
                    <option value="supervisor">مشرفو مجمعات</option>
                    <option value="general_admin">مشرفون عامون</option>
                  </select>
                </div>

                <div>
                  <label className="block font-bold text-[#053B50] mb-1">كلمة مرور موحدة للدفعة <span className="text-red-500">*</span>:</label>
                  <input
                    type="text"
                    required
                    value={batchPassword}
                    onChange={(e) => setBatchPassword(e.target.value)}
                    placeholder="مثال: azm12345"
                    className="w-full p-2.5 border-2 border-[#E8DAC8] rounded-xl outline-none focus:border-[#053B50] font-mono text-left"
                  />
                </div>
              </div>

              {/* Complex and Circle for Batch if not general_admin */}
              {batchRole !== 'general_admin' && (
                <div className="bg-[#F7F3EE] p-3 rounded-xl border border-[#E8DAC8] space-y-2.5">
                  <div>
                    <label className="block font-bold text-[#053B50] mb-1">إلحاق الدفعة بمجمع:</label>
                    <select
                      value={batchComplexId}
                      onChange={(e) => {
                        setBatchComplexId(e.target.value);
                        setBatchCircleId('');
                      }}
                      className="w-full p-2 border border-[#E8DAC8] rounded-xl outline-none focus:border-[#053B50] bg-white"
                    >
                      <option value="">-- اختر المجمع القرآني --</option>
                      {complexes.map((c) => (
                        <option key={c.id} value={c.id}>
                          {c.name}
                        </option>
                      ))}
                    </select>
                  </div>

                  {(batchRole === 'student' || batchRole === 'teacher') && (
                    <div>
                      <label className="block font-bold text-[#053B50] mb-1">إلحاق الدفعة بحلقة محددة (اختياري):</label>
                      <select
                        value={batchCircleId}
                        onChange={(e) => setBatchCircleId(e.target.value)}
                        className="w-full p-2 border border-[#E8DAC8] rounded-xl outline-none focus:border-[#053B50] bg-white"
                      >
                        <option value="">-- اختر الحلقة أو اتركها لاحقاً --</option>
                        {batchAvailableCircles.map((c) => (
                          <option key={c.id} value={c.id}>
                            {c.name}
                          </option>
                        ))}
                      </select>
                    </div>
                  )}
                </div>
              )}

              <div className="flex justify-end gap-2 pt-2">
                <button
                  type="button"
                  onClick={() => setShowBatchModal(false)}
                  className="px-4 py-2 bg-gray-100 hover:bg-gray-200 rounded-xl font-bold cursor-pointer"
                >
                  إلغاء
                </button>
                <button
                  type="submit"
                  disabled={isSubmittingBatch || !batchNamesText.trim()}
                  className="px-5 py-2.5 bg-[#053B50] text-[#FFFFFF] rounded-xl font-bold hover:bg-[#042E3F] disabled:opacity-50 cursor-pointer shadow-md"
                >
                  {isSubmittingBatch ? 'جاري إنشاء الدفعة في السحابة...' : 'إنشاء وحفظ الدفعة'}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* MODAL: Edit User */}
      {editingUser && (
        <div className="fixed inset-0 z-[1000] bg-[#053B50]/70 backdrop-blur-sm flex items-center justify-center p-4">
          <div className="bg-[#FFFFFF] border-2 border-[#E8DAC8] rounded-2xl w-full max-w-md p-6 shadow-2xl">
            <h3 className="text-lg font-black text-[#053B50] mb-3">تعديل بيانات الحساب</h3>
            <form
              onSubmit={async (e) => {
                e.preventDefault();
                if (editingUser.id) {
                  await onUpdateUser(editingUser.id, {
                    username: editingUser.username,
                    email: editingUser.email,
                    role: editingUser.role,
                    complexName: editingUser.complexName,
                    circleName: editingUser.circleName,
                  });
                  setEditingUser(null);
                }
              }}
              className="space-y-3 text-xs"
            >
              <div>
                <label className="block font-bold text-[#053B50] mb-1">اسم المستخدم:</label>
                <input
                  type="text"
                  value={editingUser.username}
                  onChange={(e) => setEditingUser({ ...editingUser, username: e.target.value })}
                  className="w-full p-2 border border-[#E8DAC8] rounded-xl outline-none focus:border-[#053B50]"
                />
              </div>

              <div>
                <label className="block font-bold text-[#053B50] mb-1">البريد الإلكتروني:</label>
                <input
                  type="email"
                  value={editingUser.email}
                  onChange={(e) => setEditingUser({ ...editingUser, email: e.target.value })}
                  className="w-full p-2 border border-[#E8DAC8] rounded-xl outline-none focus:border-[#053B50]"
                />
              </div>

              <div>
                <label className="block font-bold text-[#053B50] mb-1">نوع الصلاحية:</label>
                <select
                  value={editingUser.role}
                  onChange={(e) => setEditingUser({ ...editingUser, role: e.target.value as UserRole })}
                  className="w-full p-2 border border-[#E8DAC8] rounded-xl outline-none focus:border-[#053B50] bg-white font-bold"
                >
                  <option value="student">طالب</option>
                  <option value="teacher">معلم</option>
                  <option value="supervisor">مشرف مجمع</option>
                  <option value="general_admin">مشرف عام</option>
                </select>
              </div>

              <div className="flex justify-end gap-2 pt-3">
                <button
                  type="button"
                  onClick={() => setEditingUser(null)}
                  className="px-4 py-2 bg-gray-100 hover:bg-gray-200 rounded-xl font-bold cursor-pointer"
                >
                  إلغاء
                </button>
                <button
                  type="submit"
                  className="px-5 py-2 bg-[#053B50] text-[#FFFFFF] rounded-xl font-bold hover:bg-[#042E3F] cursor-pointer"
                >
                  حفظ التعديلات
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
};
