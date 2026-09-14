import React, { useState } from 'react';
import { ArrowLeftRight, Building2, X, AlertCircle } from 'lucide-react';
import type { QuranCircle, QuranComplex } from '../types';

interface MoveCircleModalProps {
  circle: QuranCircle;
  currentComplexName: string;
  availableComplexes: QuranComplex[];
  isOpen: boolean;
  onClose: () => void;
  onMove: (circleId: string, targetComplexId: string, targetComplexName: string) => Promise<void>;
}

export const MoveCircleModal: React.FC<MoveCircleModalProps> = ({
  circle,
  currentComplexName,
  availableComplexes,
  isOpen,
  onClose,
  onMove,
}) => {
  // Other complexes where this circle does not currently belong
  const otherComplexes = availableComplexes.filter((c) => c.id !== circle.complexId);
  const [targetComplexId, setTargetComplexId] = useState(otherComplexes[0]?.id || '');
  const [isSubmitting, setIsSubmitting] = useState(false);

  if (!isOpen) return null;

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!targetComplexId) return;
    const targetComp = availableComplexes.find((c) => c.id === targetComplexId);
    if (!targetComp) return;

    setIsSubmitting(true);
    try {
      await onMove(circle.id, targetComp.id, targetComp.name);
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
              <ArrowLeftRight className="w-5 h-5" />
            </div>
            <h3 className="text-base font-black text-[#053B50]">
              نقل الحلقة لمجمع قرآني آخر
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
          {/* Current Info */}
          <div className="bg-[#F7F3EE] p-3.5 rounded-xl border border-[#E8DAC8] space-y-2">
            <div className="flex items-center justify-between">
              <span className="text-xs text-[#053B50]/70 font-bold">الحلقة المراد نقلها:</span>
              <strong className="text-xs text-[#053B50] font-black">{circle.name}</strong>
            </div>
            <div className="flex items-center justify-between">
              <span className="text-xs text-[#053B50]/70 font-bold">المجمع الحالي:</span>
              <span className="text-xs text-[#053B50] font-semibold">{currentComplexName}</span>
            </div>
          </div>

          {/* Target Complex Selector */}
          <div>
            <label className="block font-bold text-[#053B50] mb-1">
              اختر المجمع الجديد المراد نقل الحلقة إليه: <span className="text-red-500">*</span>
            </label>

            {otherComplexes.length === 0 ? (
              <div className="p-3 bg-amber-50 border border-amber-200 rounded-xl text-amber-800 text-xs flex items-center gap-2">
                <AlertCircle className="w-4 h-4 shrink-0" />
                <span>لا يوجد مجمعات أخرى متاحة للنقل إليها. يرجى إضافة مجمع جديد أولاً.</span>
              </div>
            ) : (
              <select
                required
                value={targetComplexId}
                onChange={(e) => setTargetComplexId(e.target.value)}
                className="w-full p-2.5 border-2 border-[#E8DAC8] rounded-xl outline-none focus:border-[#053B50] text-xs text-[#053B50] font-bold"
              >
                {otherComplexes.map((c) => (
                  <option key={c.id} value={c.id}>
                    {c.name} {c.locationName ? `(${c.locationName})` : ''}
                  </option>
                ))}
              </select>
            )}
          </div>

          {/* Automatic consistency note */}
          <div className="p-3 bg-blue-50 border border-blue-200 rounded-xl text-blue-900 text-[11px] leading-relaxed">
            💡 <strong>تحديث تلقائي:</strong> سيتم تحديث تبعية الحلقة وجميع الطلاب المسجلين بها إلى المجمع الجديد فوراً للحفاظ على اتساق الإحصائيات وسجلات التسميع.
          </div>

          {/* Actions */}
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
              disabled={isSubmitting || otherComplexes.length === 0 || !targetComplexId}
              className="bg-[#053B50] hover:bg-[#042E3F] text-[#FFFFFF] text-xs font-bold px-5 py-2.5 rounded-xl shadow-md cursor-pointer disabled:opacity-50 flex items-center gap-1.5"
            >
              <ArrowLeftRight className="w-4 h-4" />
              <span>{isSubmitting ? 'جاري النقل...' : 'تأكيد نقل الحلقة'}</span>
            </button>
          </div>
        </form>
      </div>
    </div>
  );
};
