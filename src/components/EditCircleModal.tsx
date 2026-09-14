import React, { useState } from 'react';
import { BookOpen, X, Check } from 'lucide-react';
import type { QuranCircle, UserAccount } from '../types';

interface EditCircleModalProps {
  circle: QuranCircle;
  teachers: UserAccount[];
  isOpen: boolean;
  onClose: () => void;
  onSave: (circleId: string, data: { name: string; teacherId?: string; teacherName?: string }) => Promise<void>;
}

export const EditCircleModal: React.FC<EditCircleModalProps> = ({
  circle,
  teachers,
  isOpen,
  onClose,
  onSave,
}) => {
  const [name, setName] = useState(circle.name);
  const [selectedTeacherId, setSelectedTeacherId] = useState(circle.teacherId || '');
  const [isSubmitting, setIsSubmitting] = useState(false);

  if (!isOpen) return null;

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!name.trim()) return;
    setIsSubmitting(true);
    try {
      const teacherObj = teachers.find((t) => t.id === selectedTeacherId);
      await onSave(circle.id, {
        name: name.trim(),
        teacherId: teacherObj?.id || '',
        teacherName: teacherObj?.username || '',
      });
      onClose();
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <div className="fixed inset-0 z-[1050] bg-[#053B50]/70 backdrop-blur-sm flex items-center justify-center p-4">
      <div
        className="bg-[#FFFFFF] border-2 border-[#E8DAC8] rounded-2xl w-full max-w-md p-6 shadow-2xl relative"
        role="dialog"
        aria-modal="true"
      >
        {/* Header */}
        <div className="flex items-center justify-between pb-3 border-b border-[#E8DAC8] mb-4">
          <div className="flex items-center gap-2">
            <div className="w-9 h-9 rounded-xl bg-[#053B50] text-[#E8DAC8] flex items-center justify-center">
              <BookOpen className="w-5 h-5" />
            </div>
            <h3 className="text-base font-black text-[#053B50]">
              تعديل بيانات الحلقة القرآنية
            </h3>
          </div>
          <button
            type="button"
            onClick={onClose}
            className="text-gray-400 hover:text-[#053B50] p-1 rounded-lg transition-colors cursor-pointer"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        <form onSubmit={handleSubmit} className="space-y-4 text-xs">
          <div>
            <label className="block font-bold text-[#053B50] mb-1">
              اسم الحلقة القرآنية <span className="text-red-500">*</span>
            </label>
            <input
              type="text"
              required
              value={name}
              onChange={(e) => setName(e.target.value)}
              placeholder="مثال: حلقة الإتقان، حلقة التبيان"
              className="w-full p-2.5 border-2 border-[#E8DAC8] rounded-xl outline-none focus:border-[#053B50] text-sm text-[#053B50]"
              autoFocus
            />
          </div>

          <div>
            <label className="block font-bold text-[#053B50] mb-1">
              المعلم المسؤول عن الحلقة:
            </label>
            <select
              value={selectedTeacherId}
              onChange={(e) => setSelectedTeacherId(e.target.value)}
              className="w-full p-2.5 border-2 border-[#E8DAC8] rounded-xl outline-none focus:border-[#053B50] text-xs text-[#053B50]"
            >
              <option value="">-- بدون معلم (أو عينه لاحقاً) --</option>
              {teachers.map((t) => (
                <option key={t.id} value={t.id}>
                  {t.username} {t.email ? `(${t.email})` : ''}
                </option>
              ))}
            </select>
          </div>

          <div className="flex items-center justify-end gap-2 pt-2 border-t border-[#E8DAC8]">
            <button
              type="button"
              onClick={onClose}
              disabled={isSubmitting}
              className="px-4 py-2 text-xs font-bold text-[#053B50] hover:bg-gray-100 rounded-xl cursor-pointer"
            >
              إلغاء
            </button>
            <button
              type="submit"
              disabled={isSubmitting || !name.trim()}
              className="bg-[#053B50] hover:bg-[#042E3F] text-[#FFFFFF] text-xs font-bold px-5 py-2.5 rounded-xl shadow-md cursor-pointer disabled:opacity-50 flex items-center gap-1.5"
            >
              <Check className="w-4 h-4" />
              <span>{isSubmitting ? 'جاري الحفظ...' : 'حفظ التعديل'}</span>
            </button>
          </div>
        </form>
      </div>
    </div>
  );
};
