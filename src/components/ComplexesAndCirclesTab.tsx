import React, { useState } from 'react';
import {
  Building2,
  Plus,
  MapPin,
  ChevronLeft,
  Users,
  Award,
  BookOpen,
  Calendar,
  Layers,
  Sparkles,
  Pencil,
  Trash2,
  ArrowLeftRight,
} from 'lucide-react';
import type { QuranComplex, QuranCircle, RecitationRecord, UserAccount } from '../types';
import { GoogleMapPicker } from './GoogleMapPicker';
import { ComplexDetailView } from './ComplexDetailView';
import { CircleDetailView } from './CircleDetailView';
import { StudentDetailModal } from './StudentDetailModal';
import { EditComplexModal } from './EditComplexModal';
import { EditCircleModal } from './EditCircleModal';
import { MoveCircleModal } from './MoveCircleModal';
import { ConfirmDeleteModal } from './ConfirmDeleteModal';

interface ComplexesAndCirclesTabProps {
  complexes: QuranComplex[];
  circles: QuranCircle[];
  recitations: RecitationRecord[];
  users: UserAccount[];
  selectedDate: string;
  onDateChange: (date: string) => void;
  onAddComplex: (name: string, locationName: string, lat?: number, lng?: number) => Promise<void>;
  onAddCircle: (complexId: string, name: string, teacherId?: string, teacherName?: string) => Promise<void>;
  onAddRecitation: (recitation: Omit<RecitationRecord, 'id' | 'createdAt'>) => Promise<void>;
  onUpdateComplex?: (complexId: string, data: { name: string; locationName: string; latitude?: number; longitude?: number }) => Promise<void>;
  onDeleteComplex?: (complexId: string) => Promise<void>;
  onUpdateCircle?: (circleId: string, data: { name: string; teacherId?: string; teacherName?: string }) => Promise<void>;
  onDeleteCircle?: (circleId: string) => Promise<void>;
  onMoveCircle?: (circleId: string, targetComplexId: string, targetComplexName: string) => Promise<void>;
}

export const ComplexesAndCirclesTab: React.FC<ComplexesAndCirclesTabProps> = ({
  complexes,
  circles,
  recitations,
  users,
  selectedDate,
  onDateChange,
  onAddComplex,
  onAddCircle,
  onAddRecitation,
  onUpdateComplex,
  onDeleteComplex,
  onUpdateCircle,
  onDeleteCircle,
  onMoveCircle,
}) => {
  // Navigation stack: overview | complexDetail | circleDetail
  const [activeComplex, setActiveComplex] = useState<QuranComplex | null>(null);
  const [activeCircle, setActiveCircle] = useState<QuranCircle | null>(null);
  const [selectedStudentForModal, setSelectedStudentForModal] = useState<UserAccount | null>(null);

  // Add Complex Modal State
  const [showAddComplexModal, setShowAddComplexModal] = useState(false);
  const [newComplexName, setNewComplexName] = useState('');
  const [newComplexLocation, setNewComplexLocation] = useState('');
  const [newComplexLat, setNewComplexLat] = useState<number | undefined>(undefined);
  const [newComplexLng, setNewComplexLng] = useState<number | undefined>(undefined);
  const [showMapPicker, setShowMapPicker] = useState(false);
  const [isSubmittingComplex, setIsSubmittingComplex] = useState(false);

  // Add Circle Modal State
  const [circleTargetComplex, setCircleTargetComplex] = useState<QuranComplex | null>(null);
  const [newCircleName, setNewCircleName] = useState('');
  const [selectedTeacherId, setSelectedTeacherId] = useState('');
  const [isSubmittingCircle, setIsSubmittingCircle] = useState(false);

  // Add Recitation Modal State
  const [showAddRecitationModal, setShowAddRecitationModal] = useState(false);
  const [recitationTargetCircle, setRecitationTargetCircle] = useState<QuranCircle | null>(null);
  const [recStudentName, setRecStudentName] = useState('');
  const [recType, setRecType] = useState<RecitationRecord['type']>('جديد');
  const [recSurah, setRecSurah] = useState('البقرة');
  const [recAyahFrom, setRecAyahFrom] = useState(1);
  const [recAyahTo, setRecAyahTo] = useState(25);
  const [recPages, setRecPages] = useState(2);
  const [recVerses, setRecVerses] = useState(25);
  const [recNotes, setRecNotes] = useState('حفظ متقن ومتميز');
  const [recComplaints, setRecComplaints] = useState('');

  // Modals state for Edit / Delete / Move
  const [editingComplex, setEditingComplex] = useState<QuranComplex | null>(null);
  const [deletingComplex, setDeletingComplex] = useState<QuranComplex | null>(null);
  const [editingCircle, setEditingCircle] = useState<QuranCircle | null>(null);
  const [deletingCircle, setDeletingCircle] = useState<QuranCircle | null>(null);
  const [movingCircle, setMovingCircle] = useState<QuranCircle | null>(null);
  const [isDeleting, setIsDeleting] = useState(false);

  const teachers = users.filter((u) => u.role === 'teacher');
  const students = users.filter((u) => u.role === 'student');

  // Edit / Delete / Move handlers
  const handleSaveEditComplex = async (
    complexId: string,
    data: { name: string; locationName: string; latitude?: number; longitude?: number }
  ) => {
    if (onUpdateComplex) {
      await onUpdateComplex(complexId, data);
    }
    if (activeComplex && activeComplex.id === complexId) {
      setActiveComplex((prev) => (prev ? { ...prev, ...data } : null));
    }
  };

  const handleConfirmDeleteComplex = async () => {
    if (!deletingComplex) return;
    setIsDeleting(true);
    try {
      if (onDeleteComplex) {
        await onDeleteComplex(deletingComplex.id);
      }
      if (activeComplex?.id === deletingComplex.id) {
        setActiveComplex(null);
        setActiveCircle(null);
      }
      setDeletingComplex(null);
    } finally {
      setIsDeleting(false);
    }
  };

  const handleSaveEditCircle = async (
    circleId: string,
    data: { name: string; teacherId?: string; teacherName?: string }
  ) => {
    if (onUpdateCircle) {
      await onUpdateCircle(circleId, data);
    }
    if (activeCircle && activeCircle.id === circleId) {
      setActiveCircle((prev) => (prev ? { ...prev, ...data } : null));
    }
  };

  const handleConfirmDeleteCircle = async () => {
    if (!deletingCircle) return;
    setIsDeleting(true);
    try {
      if (onDeleteCircle) {
        await onDeleteCircle(deletingCircle.id);
      }
      if (activeCircle?.id === deletingCircle.id) {
        setActiveCircle(null);
      }
      setDeletingCircle(null);
    } finally {
      setIsDeleting(false);
    }
  };

  const handleConfirmMoveCircle = async (
    circleId: string,
    targetComplexId: string,
    targetComplexName: string
  ) => {
    if (onMoveCircle) {
      await onMoveCircle(circleId, targetComplexId, targetComplexName);
    }
    if (activeCircle && activeCircle.id === circleId) {
      setActiveCircle((prev) => (prev ? { ...prev, complexId: targetComplexId } : null));
      const targetParent = complexes.find((c) => c.id === targetComplexId);
      if (targetParent) {
        setActiveComplex(targetParent);
      }
    }
    setMovingCircle(null);
  };

  const handleCreateComplex = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!newComplexName.trim()) return;
    setIsSubmittingComplex(true);
    try {
      await onAddComplex(
        newComplexName.trim(),
        newComplexLocation.trim() || 'حي المجمع القرآني',
        newComplexLat,
        newComplexLng
      );
      setNewComplexName('');
      setNewComplexLocation('');
      setNewComplexLat(undefined);
      setNewComplexLng(undefined);
      setShowAddComplexModal(false);
    } finally {
      setIsSubmittingComplex(false);
    }
  };

  const handleCreateCircle = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!circleTargetComplex || !newCircleName.trim()) return;
    setIsSubmittingCircle(true);
    try {
      const teacherObj = teachers.find((t) => t.id === selectedTeacherId);
      await onAddCircle(
        circleTargetComplex.id,
        newCircleName.trim(),
        teacherObj?.id || '',
        teacherObj?.username || ''
      );
      setNewCircleName('');
      setSelectedTeacherId('');
      setCircleTargetComplex(null);
    } finally {
      setIsSubmittingCircle(false);
    }
  };

  const handleCreateRecitation = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!recitationTargetCircle || !recStudentName.trim()) return;
    try {
      await onAddRecitation({
        studentId: `std_${Date.now()}`,
        studentName: recStudentName.trim(),
        circleId: recitationTargetCircle.id,
        circleName: recitationTargetCircle.name,
        complexId: recitationTargetCircle.complexId,
        date: selectedDate,
        type: recType,
        surah: recSurah.trim(),
        ayahFrom: Number(recAyahFrom),
        ayahTo: Number(recAyahTo),
        pagesCount: Number(recPages),
        versesCount: Number(recVerses),
        notes: recNotes.trim(),
        complaints: recComplaints.trim(),
      });
      setShowAddRecitationModal(false);
      setRecStudentName('');
      setRecComplaints('');
    } catch (err) {
      console.error(err);
    }
  };

  // Fresh references to activeComplex and activeCircle from latest props
  const currentActiveComplex = activeComplex
    ? complexes.find((c) => c.id === activeComplex.id) || activeComplex
    : null;

  const currentActiveCircle = activeCircle
    ? circles.find((c) => c.id === activeCircle.id) || activeCircle
    : null;

  const renderModals = () => (
    <>
      {editingComplex && (
        <EditComplexModal
          complex={editingComplex}
          isOpen={!!editingComplex}
          onClose={() => setEditingComplex(null)}
          onSave={handleSaveEditComplex}
        />
      )}

      {deletingComplex && (
        <ConfirmDeleteModal
          isOpen={!!deletingComplex}
          title="تأكيد حذف المجمع القرآني"
          itemName={deletingComplex.name}
          itemType="complex"
          isDeleting={isDeleting}
          onConfirm={handleConfirmDeleteComplex}
          onClose={() => setDeletingComplex(null)}
        />
      )}

      {editingCircle && (
        <EditCircleModal
          circle={editingCircle}
          teachers={teachers}
          isOpen={!!editingCircle}
          onClose={() => setEditingCircle(null)}
          onSave={handleSaveEditCircle}
        />
      )}

      {movingCircle && (
        <MoveCircleModal
          circle={movingCircle}
          currentComplexName={
            complexes.find((c) => c.id === movingCircle.complexId)?.name || 'المجمع الحالي'
          }
          availableComplexes={complexes}
          isOpen={!!movingCircle}
          onClose={() => setMovingCircle(null)}
          onMove={handleConfirmMoveCircle}
        />
      )}

      {deletingCircle && (
        <ConfirmDeleteModal
          isOpen={!!deletingCircle}
          title="تأكيد حذف الحلقة القرآنية"
          itemName={deletingCircle.name}
          itemType="circle"
          isDeleting={isDeleting}
          onConfirm={handleConfirmDeleteCircle}
          onClose={() => setDeletingCircle(null)}
        />
      )}

      {/* MODAL: Add Circle to Complex */}
      {circleTargetComplex && (
        <div className="fixed inset-0 z-[1000] bg-[#053B50]/70 backdrop-blur-sm flex items-center justify-center p-4">
          <div className="bg-[#FFFFFF] border-2 border-[#E8DAC8] rounded-2xl w-full max-w-md p-6 shadow-2xl">
            <h3 className="text-lg font-black text-[#053B50] mb-1">
              إضافة حلقة قرآنية جديدة
            </h3>
            <p className="text-xs text-[#053B50]/70 mb-4">
              إلحاق حلقة قرآنية بمجمع: <strong>{circleTargetComplex.name}</strong>
            </p>

            <form onSubmit={handleCreateCircle} className="space-y-4 text-xs">
              <div>
                <label className="block font-bold text-[#053B50] mb-1">اسم الحلقة <span className="text-red-500">*</span></label>
                <input
                  type="text"
                  required
                  value={newCircleName}
                  onChange={(e) => setNewCircleName(e.target.value)}
                  placeholder="مثال: حلقة الإتقان، حلقة التبيان..."
                  className="w-full p-2.5 border-2 border-[#E8DAC8] rounded-xl outline-none focus:border-[#053B50] text-sm text-[#053B50]"
                  autoFocus
                />
              </div>

              <div>
                <label className="block font-bold text-[#053B50] mb-1">إلحاق معلم بالحلقة (اختياري الآن):</label>
                <select
                  value={selectedTeacherId}
                  onChange={(e) => setSelectedTeacherId(e.target.value)}
                  className="w-full p-2.5 border-2 border-[#E8DAC8] rounded-xl outline-none focus:border-[#053B50] text-xs text-[#053B50]"
                >
                  <option value="">-- اختر معلماً من القائمة أو حدده لاحقاً --</option>
                  {teachers.map((t) => (
                    <option key={t.id} value={t.id}>
                      {t.username} ({t.email})
                    </option>
                  ))}
                </select>
                <span className="block text-[11px] text-[#053B50]/60 mt-1">
                  يمكنك أيضاً إضافة المعلمين وتعيينهم مباشرة من تبويب "الحسابات".
                </span>
              </div>

              <div className="flex items-center justify-end gap-2 pt-2">
                <button
                  type="button"
                  onClick={() => setCircleTargetComplex(null)}
                  className="px-4 py-2 text-xs font-bold text-[#053B50] hover:bg-[#E8DAC8] rounded-xl cursor-pointer"
                >
                  إلغاء
                </button>
                <button
                  type="submit"
                  disabled={isSubmittingCircle || !newCircleName.trim()}
                  className="bg-[#053B50] hover:bg-[#042E3F] text-[#FFFFFF] text-xs font-bold px-5 py-2.5 rounded-xl shadow-md cursor-pointer disabled:opacity-50"
                >
                  {isSubmittingCircle ? 'جاري الإضافة...' : 'أضف الحلقة'}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </>
  );

  // If viewing circle detail
  if (currentActiveCircle && currentActiveComplex) {
    return (
      <>
        <CircleDetailView
          circle={currentActiveCircle}
          complexName={currentActiveComplex.name}
          recitations={recitations}
          students={students}
          selectedDate={selectedDate}
          onSelectStudent={(st) => setSelectedStudentForModal(st)}
          onBack={() => setActiveCircle(null)}
          onAddRecitation={(circle) => {
            setRecitationTargetCircle(circle);
            setShowAddRecitationModal(true);
          }}
          onEditCircle={(c) => setEditingCircle(c)}
          onMoveCircle={(c) => setMovingCircle(c)}
          onDeleteCircle={(c) => setDeletingCircle(c)}
        />

        {selectedStudentForModal && (
          <StudentDetailModal
            student={selectedStudentForModal}
            recitations={recitations}
            onClose={() => setSelectedStudentForModal(null)}
          />
        )}

        {/* Add Recitation Modal */}
        {showAddRecitationModal && recitationTargetCircle && (
          <div className="fixed inset-0 z-[1000] bg-[#053B50]/70 backdrop-blur-sm flex items-center justify-center p-4">
            <div className="bg-[#FFFFFF] border-2 border-[#E8DAC8] rounded-2xl w-full max-w-md p-6 shadow-2xl">
              <h3 className="text-lg font-black text-[#053B50] mb-3">
                تسجيل تسميع طالب في ({recitationTargetCircle.name})
              </h3>
              <form onSubmit={handleCreateRecitation} className="space-y-3 text-xs">
                <div>
                  <label className="block font-bold text-[#053B50] mb-1">اسم الطالب:</label>
                  <input
                    type="text"
                    required
                    value={recStudentName}
                    onChange={(e) => setRecStudentName(e.target.value)}
                    placeholder="مثال: صالح بن خالد المطيري"
                    className="w-full p-2 border border-[#E8DAC8] rounded-lg outline-none focus:border-[#053B50]"
                  />
                </div>

                <div className="grid grid-cols-2 gap-2">
                  <div>
                    <label className="block font-bold text-[#053B50] mb-1">نوع التسميع:</label>
                    <select
                      value={recType}
                      onChange={(e) => setRecType(e.target.value as RecitationRecord['type'])}
                      className="w-full p-2 border border-[#E8DAC8] rounded-lg outline-none focus:border-[#053B50]"
                    >
                      <option value="جديد">جديد</option>
                      <option value="مراجعة صغرى">مراجعة صغرى</option>
                      <option value="تراكمي">تراكمي</option>
                      <option value="تثبيت">تثبيت</option>
                    </select>
                  </div>
                  <div>
                    <label className="block font-bold text-[#053B50] mb-1">السورة:</label>
                    <input
                      type="text"
                      required
                      value={recSurah}
                      onChange={(e) => setRecSurah(e.target.value)}
                      placeholder="البقرة"
                      className="w-full p-2 border border-[#E8DAC8] rounded-lg outline-none focus:border-[#053B50]"
                    />
                  </div>
                </div>

                <div className="grid grid-cols-2 gap-2">
                  <div>
                    <label className="block font-bold text-[#053B50] mb-1">من آية:</label>
                    <input
                      type="number"
                      value={recAyahFrom}
                      onChange={(e) => setRecAyahFrom(Number(e.target.value))}
                      className="w-full p-2 border border-[#E8DAC8] rounded-lg outline-none focus:border-[#053B50]"
                    />
                  </div>
                  <div>
                    <label className="block font-bold text-[#053B50] mb-1">إلى آية:</label>
                    <input
                      type="number"
                      value={recAyahTo}
                      onChange={(e) => setRecAyahTo(Number(e.target.value))}
                      className="w-full p-2 border border-[#E8DAC8] rounded-lg outline-none focus:border-[#053B50]"
                    />
                  </div>
                </div>

                <div className="grid grid-cols-2 gap-2">
                  <div>
                    <label className="block font-bold text-[#053B50] mb-1">عدد الأوجه:</label>
                    <input
                      type="number"
                      value={recPages}
                      onChange={(e) => setRecPages(Number(e.target.value))}
                      className="w-full p-2 border border-[#E8DAC8] rounded-lg outline-none focus:border-[#053B50]"
                    />
                  </div>
                  <div>
                    <label className="block font-bold text-[#053B50] mb-1">عدد الآيات:</label>
                    <input
                      type="number"
                      value={recVerses}
                      onChange={(e) => setRecVerses(Number(e.target.value))}
                      className="w-full p-2 border border-[#E8DAC8] rounded-lg outline-none focus:border-[#053B50]"
                    />
                  </div>
                </div>

                <div>
                  <label className="block font-bold text-[#053B50] mb-1">ملاحظات الحفظ:</label>
                  <input
                    type="text"
                    value={recNotes}
                    onChange={(e) => setRecNotes(e.target.value)}
                    placeholder="متقن، يحتاج مراجعة أحكام النون..."
                    className="w-full p-2 border border-[#E8DAC8] rounded-lg outline-none focus:border-[#053B50]"
                  />
                </div>

                <div>
                  <label className="block font-bold text-[#053B50] mb-1">الشكاوى والتنبيهات (إن وجدت):</label>
                  <input
                    type="text"
                    value={recComplaints}
                    onChange={(e) => setRecComplaints(e.target.value)}
                    placeholder="ملاحظات سلوكية أو غياب متكرر..."
                    className="w-full p-2 border border-[#E8DAC8] rounded-lg outline-none focus:border-[#053B50]"
                  />
                </div>

                <div className="flex justify-end gap-2 pt-3">
                  <button
                    type="button"
                    onClick={() => setShowAddRecitationModal(false)}
                    className="px-3 py-2 bg-gray-100 hover:bg-gray-200 rounded-lg font-bold cursor-pointer"
                  >
                    إلغاء
                  </button>
                  <button
                    type="submit"
                    className="px-4 py-2 bg-[#053B50] text-white rounded-lg font-bold cursor-pointer"
                  >
                    حفظ التسميع
                  </button>
                </div>
              </form>
            </div>
          </div>
        )}

        {renderModals()}
      </>
    );
  }

  // If viewing complex detail
  if (currentActiveComplex) {
    return (
      <>
        <ComplexDetailView
          complex={currentActiveComplex}
          circles={circles}
          recitations={recitations}
          students={students}
          teachers={teachers}
          selectedDate={selectedDate}
          onSelectCircle={(circle) => setActiveCircle(circle)}
          onSelectStudent={(student) => setSelectedStudentForModal(student)}
          onBack={() => setActiveComplex(null)}
          onEditComplex={(c) => setEditingComplex(c)}
          onDeleteComplex={(c) => setDeletingComplex(c)}
          onAddCircle={(c) => setCircleTargetComplex(c)}
          onEditCircle={(c) => setEditingCircle(c)}
          onMoveCircle={(c) => setMovingCircle(c)}
          onDeleteCircle={(c) => setDeletingCircle(c)}
        />

        {selectedStudentForModal && (
          <StudentDetailModal
            student={selectedStudentForModal}
            recitations={recitations}
            onClose={() => setSelectedStudentForModal(null)}
          />
        )}

        {renderModals()}
      </>
    );
  }

  // OVERVIEW OF ALL COMPLEXES
  return (
    <div className="space-y-6">
      {/* Top Controls: Add Complex Button & Date Selector */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 bg-[#FFFFFF] border-2 border-[#E8DAC8] p-5 rounded-2xl shadow-xs">
        <div>
          <h2 className="text-xl sm:text-2xl font-black text-[#053B50]">
            المجمعات والحلقات القرآنية
          </h2>
          <p className="text-xs text-[#053B50]/75 mt-0.5">
            إدارة المجمعات التعليمية، الحلقات، المعلمين، وتحديد مواقع الجوامع عبر خرائط جوجل
          </p>
        </div>

        <div className="flex items-center gap-2 flex-wrap">
          {/* Historical Date Picker */}
          <div className="flex items-center gap-1.5 bg-[#F7F3EE] border border-[#E8DAC8] px-3 py-1.5 rounded-xl text-xs">
            <Calendar className="w-3.5 h-3.5 text-[#053B50]" />
            <span className="font-bold text-[#053B50]">تاريخ الإحصائيات:</span>
            <input
              type="date"
              value={selectedDate}
              onChange={(e) => onDateChange(e.target.value)}
              className="bg-transparent font-bold text-[#053B50] outline-none cursor-pointer"
            />
          </div>

          <button
            type="button"
            onClick={() => setShowAddComplexModal(true)}
            className="bg-[#053B50] hover:bg-[#042E3F] text-[#FFFFFF] text-xs font-bold px-4 py-2.5 rounded-xl flex items-center gap-1.5 shadow-md cursor-pointer transition-colors"
          >
            <Plus className="w-4 h-4 text-[#E8DAC8]" />
            <span>إضافة مجمع قرآني جديد</span>
          </button>
        </div>
      </div>

      {/* Complexes List */}
      {complexes.length === 0 ? (
        <div className="bg-[#FFFFFF] border-2 border-dashed border-[#E8DAC8] rounded-2xl p-12 text-center text-[#053B50]/70">
          <Building2 className="w-12 h-12 mx-auto mb-3 text-[#053B50]/40" />
          <h3 className="font-bold text-base text-[#053B50]">لا يوجد أي مجمع قرآني مضاف بعد</h3>
          <p className="text-xs mt-1">اضغط على زر "إضافة مجمع قرآني جديد" لبدء إضافة المجمعات والحلقات.</p>
        </div>
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
          {complexes.map((complex) => {
            const complexCircles = circles.filter((c) => c.complexId === complex.id);
            const complexRecs = recitations.filter(
              (r) => r.complexId === complex.id && r.date === selectedDate
            );
            const totalPages = complexRecs.reduce((a, b) => a + (b.pagesCount || 0), 0);
            const totalVerses = complexRecs.reduce((a, b) => a + (b.versesCount || 0), 0);

            return (
              <div
                key={complex.id}
                className="bg-[#FFFFFF] border-2 border-[#E8DAC8] hover:border-[#053B50] rounded-2xl p-5 shadow-xs transition-all flex flex-col justify-between group"
              >
                <div>
                  {/* Card Header */}
                  <div className="flex items-start justify-between mb-3 gap-2">
                    <div className="flex items-center gap-3 min-w-0">
                      <div className="w-11 h-11 rounded-xl bg-[#053B50] text-[#FFFFFF] flex items-center justify-center shrink-0 shadow-xs">
                        <Building2 className="w-6 h-6 text-[#E8DAC8]" />
                      </div>
                      <div className="min-w-0">
                        <h3
                          onClick={() => setActiveComplex(complex)}
                          className="font-black text-base text-[#053B50] hover:underline cursor-pointer truncate"
                        >
                          {complex.name}
                        </h3>
                        {complex.locationName && (
                          <p className="text-xs text-[#053B50]/70 flex items-center gap-1 mt-0.5">
                            <MapPin className="w-3 h-3 text-[#053B50] shrink-0" />
                            <span className="truncate max-w-[150px]">{complex.locationName}</span>
                          </p>
                        )}
                      </div>
                    </div>

                    <div className="flex items-center gap-1 shrink-0">
                      <button
                        type="button"
                        onClick={(e) => {
                          e.stopPropagation();
                          setEditingComplex(complex);
                        }}
                        className="p-1.5 text-[#053B50] hover:bg-[#E8DAC8] rounded-xl border border-[#E8DAC8] transition-colors cursor-pointer"
                        title="تعديل المجمع"
                      >
                        <Pencil className="w-3.5 h-3.5" />
                      </button>
                      <button
                        type="button"
                        onClick={(e) => {
                          e.stopPropagation();
                          setDeletingComplex(complex);
                        }}
                        className="p-1.5 text-red-600 hover:bg-red-100 rounded-xl border border-red-200 transition-colors cursor-pointer"
                        title="حذف المجمع"
                      >
                        <Trash2 className="w-3.5 h-3.5" />
                      </button>
                    </div>
                  </div>

                  {/* Complex Quick Stats */}
                  <div className="grid grid-cols-2 gap-2 my-3 p-2.5 bg-[#F7F3EE] rounded-xl border border-[#E8DAC8] text-center text-xs">
                    <div>
                      <span className="text-[11px] text-[#053B50]/70 block font-semibold">عدد الحلقات</span>
                      <span className="font-bold text-[#053B50] text-sm">{complexCircles.length} حلقة</span>
                    </div>
                    <div>
                      <span className="text-[11px] text-[#053B50]/70 block font-semibold">إنجاز اليوم</span>
                      <span className="font-bold text-[#053B50] text-sm font-mono">{totalPages} وجه</span>
                    </div>
                  </div>

                  {/* Circles in this complex */}
                  <div className="space-y-1.5 mb-4">
                    <span className="text-[11px] font-bold text-[#053B50]/80 block">
                      حلقات المجمع ({complexCircles.length}):
                    </span>
                    {complexCircles.length === 0 ? (
                      <span className="text-xs text-[#053B50]/50 italic block">لا توجد حلقات مضافة بعد</span>
                    ) : (
                      <div className="flex flex-wrap gap-1.5 max-h-24 overflow-y-auto">
                        {complexCircles.map((circle) => (
                          <button
                            key={circle.id}
                            type="button"
                            onClick={() => {
                              setActiveComplex(complex);
                              setActiveCircle(circle);
                            }}
                            className="text-[11px] font-semibold bg-[#FFFFFF] border border-[#E8DAC8] hover:border-[#053B50] text-[#053B50] px-2.5 py-1 rounded-lg transition-colors cursor-pointer"
                          >
                            {circle.name}
                          </button>
                        ))}
                      </div>
                    )}
                  </div>
                </div>

                {/* Card Action Buttons */}
                <div className="pt-3 border-t border-[#E8DAC8] flex items-center justify-between gap-2">
                  <button
                    type="button"
                    onClick={() => setCircleTargetComplex(complex)}
                    className="flex-1 bg-[#F7F3EE] hover:bg-[#E8DAC8] text-[#053B50] text-xs font-bold py-2 rounded-xl border border-[#E8DAC8] flex items-center justify-center gap-1 cursor-pointer transition-colors"
                  >
                    <Plus className="w-3.5 h-3.5" />
                    <span>أضف حلقات</span>
                  </button>

                  <button
                    type="button"
                    onClick={() => setActiveComplex(complex)}
                    className="flex-1 bg-[#053B50] hover:bg-[#042E3F] text-[#FFFFFF] text-xs font-bold py-2 rounded-xl flex items-center justify-center gap-1 cursor-pointer transition-colors"
                  >
                    <span>عرض إحصائياته</span>
                    <ChevronLeft className="w-3.5 h-3.5" />
                  </button>
                </div>
              </div>
            );
          })}
        </div>
      )}

      {/* MODAL: Add Complex */}
      {showAddComplexModal && (
        <div className="fixed inset-0 z-[1000] bg-[#053B50]/70 backdrop-blur-sm flex items-center justify-center p-4">
          <div className="bg-[#FFFFFF] border-2 border-[#E8DAC8] rounded-2xl w-full max-w-md p-6 shadow-2xl">
            <h3 className="text-lg font-black text-[#053B50] mb-2 flex items-center gap-2">
              <Building2 className="w-5 h-5 text-[#053B50]" />
              <span>إضافة مجمع قرآني جديد</span>
            </h3>
            <p className="text-xs text-[#053B50]/70 mb-4">
              أدخل اسم المجمع وحدد موقعه الجغرافي للجامع من خرائط جوجل
            </p>

            <form onSubmit={handleCreateComplex} className="space-y-4 text-xs">
              <div>
                <label className="block font-bold text-[#053B50] mb-1">اسم المجمع القرآني <span className="text-red-500">*</span></label>
                <input
                  type="text"
                  required
                  value={newComplexName}
                  onChange={(e) => setNewComplexName(e.target.value)}
                  placeholder="مثال: مجمع جامع عزم النموذجي لتحفيظ القرآن"
                  className="w-full p-2.5 border-2 border-[#E8DAC8] rounded-xl outline-none focus:border-[#053B50] text-sm text-[#053B50]"
                  autoFocus
                />
              </div>

              <div>
                <label className="block font-bold text-[#053B50] mb-1">موقع الجامع / المجمع:</label>
                <div className="flex gap-2">
                  <input
                    type="text"
                    value={newComplexLocation}
                    onChange={(e) => setNewComplexLocation(e.target.value)}
                    placeholder="مثال: حي النزهة، شارع عثمان بن عفان"
                    className="flex-1 p-2.5 border-2 border-[#E8DAC8] rounded-xl outline-none focus:border-[#053B50] text-xs text-[#053B50]"
                  />
                  <button
                    type="button"
                    onClick={() => setShowMapPicker(true)}
                    className="bg-[#F7F3EE] hover:bg-[#E8DAC8] text-[#053B50] border border-[#E8DAC8] px-3 py-2 rounded-xl font-bold flex items-center gap-1 cursor-pointer transition-colors"
                  >
                    <MapPin className="w-4 h-4 text-[#053B50]" />
                    <span>من الخريطة</span>
                  </button>
                </div>
                {newComplexLat && newComplexLng && (
                  <span className="block text-[11px] text-emerald-700 font-mono mt-1">
                    ✓ تم تثبيت الإحداثيات: ({newComplexLat}, {newComplexLng})
                  </span>
                )}
              </div>

              <div className="flex items-center justify-end gap-2 pt-2">
                <button
                  type="button"
                  onClick={() => setShowAddComplexModal(false)}
                  className="px-4 py-2 text-xs font-bold text-[#053B50] hover:bg-[#E8DAC8] rounded-xl cursor-pointer"
                >
                  إلغاء
                </button>
                <button
                  type="submit"
                  disabled={isSubmittingComplex || !newComplexName.trim()}
                  className="bg-[#053B50] hover:bg-[#042E3F] text-[#FFFFFF] text-xs font-bold px-5 py-2.5 rounded-xl shadow-md cursor-pointer disabled:opacity-50"
                >
                  {isSubmittingComplex ? 'جاري الإضافة...' : 'إضافة المجمع'}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* MODAL: Google Maps Picker */}
      {showMapPicker && (
        <GoogleMapPicker
          initialLat={newComplexLat || 24.7136}
          initialLng={newComplexLng || 46.6753}
          initialName={newComplexLocation}
          onSelectLocation={(locName, lat, lng) => {
            setNewComplexLocation(locName);
            setNewComplexLat(lat);
            setNewComplexLng(lng);
          }}
          onClose={() => setShowMapPicker(false)}
        />
      )}

      {/* Modals for Edit / Move / Delete / Add Circle */}
      {renderModals()}
    </div>
  );
};
