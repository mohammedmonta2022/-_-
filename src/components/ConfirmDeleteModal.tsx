import React from 'react';
import { AlertTriangle, Trash2, X } from 'lucide-react';

interface ConfirmDeleteModalProps {
  isOpen: boolean;
  title?: string;
  itemName: string;
  itemType: 'complex' | 'circle';
  warningMessage?: string;
  isDeleting?: boolean;
  onConfirm: () => void;
  onClose: () => void;
}

export const ConfirmDeleteModal: React.FC<ConfirmDeleteModalProps> = ({
  isOpen,
  title = 'تأكيد الحذف',
  itemName,
  itemType,
  warningMessage,
  isDeleting = false,
  onConfirm,
  onClose,
}) => {
  if (!isOpen) return null;

  const defaultWarning =
    itemType === 'complex'
      ? 'تحذير: سيؤدي حذف المجمع إلى حذف كافة الحلقات التابعة له وفك ارتباط الطلبة المسجلين به.'
      : 'تحذير: سيؤدي حذف الحلقة إلى فك ارتباط الطلبة والمعلم بهذه الحلقة.';

  return (
    <div className="fixed inset-0 z-[1100] bg-[#053B50]/70 backdrop-blur-sm flex items-center justify-center p-4">
      <div
        className="bg-[#FFFFFF] border-2 border-red-200 rounded-2xl w-full max-w-md p-6 shadow-2xl relative animate-in fade-in zoom-in-95 duration-150"
        role="dialog"
        aria-modal="true"
      >
        {/* Close Button */}
        <button
          type="button"
          onClick={onClose}
          disabled={isDeleting}
          className="absolute top-4 left-4 text-gray-400 hover:text-[#053B50] p-1 rounded-lg transition-colors cursor-pointer"
        >
          <X className="w-5 h-5" />
        </button>

        {/* Header Icon */}
        <div className="w-14 h-14 mx-auto mb-4 rounded-2xl bg-red-50 border border-red-200 flex items-center justify-center text-red-600 shadow-xs">
          <AlertTriangle className="w-7 h-7" />
        </div>

        {/* Title and Confirmation Question */}
        <div className="text-center mb-5">
          <h3 className="text-lg font-black text-[#053B50] mb-1">{title}</h3>
          <p className="text-base font-black text-red-600 mt-1">
            هل تريد الحذف؟ تأكيد طبعاً
          </p>
          <div className="mt-3 bg-[#F7F3EE] p-3 rounded-xl border border-[#E8DAC8]">
            <span className="text-xs text-[#053B50]/70 block font-semibold">
              {itemType === 'complex' ? 'المجمع القرآني المراد حذفه:' : 'الحلقة المراد حذفها:'}
            </span>
            <strong className="text-sm text-[#053B50] block mt-0.5 font-bold">
              {itemName}
            </strong>
          </div>
          <p className="text-xs text-red-600/90 font-semibold mt-2.5 leading-relaxed">
            {warningMessage || defaultWarning}
          </p>
        </div>

        {/* Action Buttons */}
        <div className="flex items-center justify-end gap-2 pt-2 border-t border-[#E8DAC8]">
          <button
            type="button"
            onClick={onClose}
            disabled={isDeleting}
            className="flex-1 py-2.5 px-4 text-xs font-bold text-[#053B50] bg-gray-100 hover:bg-gray-200 rounded-xl cursor-pointer transition-colors"
          >
            إلغاء الأمر
          </button>
          <button
            type="button"
            onClick={onConfirm}
            disabled={isDeleting}
            className="flex-1 py-2.5 px-4 text-xs font-bold text-white bg-red-600 hover:bg-red-700 disabled:opacity-50 rounded-xl shadow-md cursor-pointer transition-colors flex items-center justify-center gap-1.5"
          >
            <Trash2 className="w-4 h-4" />
            <span>{isDeleting ? 'جاري الحذف...' : 'نعم، تأكيد الحذف طبعاً'}</span>
          </button>
        </div>
      </div>
    </div>
  );
};
