import React, { useState } from 'react';
import {
  Calendar,
  BookOpen,
  Award,
  Clock,
  User,
  CheckCircle2,
  FileText,
  AlertTriangle,
  ChevronLeft,
} from 'lucide-react';
import type { RecitationRecord, UserAccount } from '../types';

interface StudentDetailModalProps {
  student: UserAccount;
  recitations: RecitationRecord[];
  onClose: () => void;
}

export const StudentDetailModal: React.FC<StudentDetailModalProps> = ({
  student,
  recitations,
  onClose,
}) => {
  const [selectedFilter, setSelectedFilter] = useState<string>('all');

  const studentRecitations = recitations.filter(
    (r) => r.studentId === student.id || r.studentName === student.username
  );

  const totalVerses = studentRecitations.reduce((acc, r) => acc + (r.versesCount || 0), 0);
  const totalPages = studentRecitations.reduce((acc, r) => acc + (r.pagesCount || 0), 0);

  const filteredList = studentRecitations.filter((r) => {
    if (selectedFilter === 'all') return true;
    return r.type === selectedFilter;
  });

  return (
    <div className="fixed inset-0 z-[1000] bg-[#053B50]/70 backdrop-blur-sm flex items-center justify-center p-3 sm:p-4">
      <div className="bg-[#FFFFFF] border-2 border-[#E8DAC8] rounded-2xl w-full max-w-2xl shadow-2xl overflow-hidden flex flex-col max-h-[92vh]">
        {/* Header */}
        <div className="bg-[#053B50] text-[#FFFFFF] p-5 flex items-center justify-between">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-full bg-[#E8DAC8]/20 flex items-center justify-center text-[#E8DAC8]">
              <User className="w-5 h-5" />
            </div>
            <div>
              <h3 className="font-black text-lg text-[#FFFFFF]">{student.username}</h3>
              <p className="text-xs text-[#E8DAC8]">
                {student.complexName || 'مجمع عزم القرآني'} • {student.circleName || 'الحلقة'}
              </p>
            </div>
          </div>
          <button
            type="button"
            onClick={onClose}
            className="text-xs bg-[#FFFFFF]/15 hover:bg-[#FFFFFF]/25 text-[#FFFFFF] px-3 py-1.5 rounded-lg transition-colors cursor-pointer"
          >
            إغلاق
          </button>
        </div>

        {/* Stats Strip */}
        <div className="grid grid-cols-3 gap-2 p-4 bg-[#F7F3EE] border-b border-[#E8DAC8] text-center">
          <div className="bg-[#FFFFFF] p-2.5 rounded-xl border border-[#E8DAC8]">
            <span className="block text-[11px] text-[#053B50]/70 font-semibold mb-0.5">مجموع الآيات</span>
            <span className="text-base sm:text-lg font-black text-[#053B50] font-mono">{totalVerses}</span>
          </div>
          <div className="bg-[#FFFFFF] p-2.5 rounded-xl border border-[#E8DAC8]">
            <span className="block text-[11px] text-[#053B50]/70 font-semibold mb-0.5">مجموع الأوجه</span>
            <span className="text-base sm:text-lg font-black text-[#053B50] font-mono">{totalPages}</span>
          </div>
          <div className="bg-[#FFFFFF] p-2.5 rounded-xl border border-[#E8DAC8]">
            <span className="block text-[11px] text-[#053B50]/70 font-semibold mb-0.5">جلسات التسميع</span>
            <span className="text-base sm:text-lg font-black text-[#053B50] font-mono">{studentRecitations.length}</span>
          </div>
        </div>

        {/* Content Body */}
        <div className="p-4 sm:p-5 overflow-y-auto space-y-4 flex-1">
          {/* Filters */}
          <div className="flex items-center justify-between gap-2 flex-wrap">
            <span className="text-xs font-bold text-[#053B50] flex items-center gap-1">
              <FileText className="w-4 h-4 text-[#053B50]" />
              <span>سجل التسميع والحفظ المفصل:</span>
            </span>

            <div className="flex gap-1">
              {['all', 'جديد', 'مراجعة صغرى', 'تراكمي'].map((type) => (
                <button
                  key={type}
                  type="button"
                  onClick={() => setSelectedFilter(type)}
                  className={`text-xs px-2.5 py-1 rounded-lg border transition-all cursor-pointer ${
                    selectedFilter === type
                      ? 'bg-[#053B50] text-[#FFFFFF] border-[#053B50] font-bold'
                      : 'bg-[#FFFFFF] text-[#053B50] border-[#E8DAC8] hover:border-[#053B50]'
                  }`}
                >
                  {type === 'all' ? 'الكل' : type}
                </button>
              ))}
            </div>
          </div>

          {/* Recitation Records List */}
          {filteredList.length === 0 ? (
            <div className="text-center py-10 bg-[#F7F3EE] rounded-xl border border-dashed border-[#E8DAC8] text-[#053B50]/60 text-xs">
              لا توجد سجلات تسميع مسجلة لهذا الطالب تحت هذا التصنيف
            </div>
          ) : (
            <div className="space-y-3">
              {filteredList.map((rec) => (
                <div
                  key={rec.id}
                  className="bg-[#FFFFFF] border border-[#E8DAC8] rounded-xl p-3.5 hover:border-[#053B50]/50 transition-colors shadow-xs"
                >
                  <div className="flex items-center justify-between mb-2">
                    <div className="flex items-center gap-2">
                      <span className="bg-[#053B50] text-[#FFFFFF] text-[11px] font-bold px-2 py-0.5 rounded-md">
                        {rec.type}
                      </span>
                      <span className="font-bold text-sm text-[#053B50]">
                        سورة {rec.surah} (الآيات {rec.ayahFrom} - {rec.ayahTo})
                      </span>
                    </div>

                    <span className="text-[11px] text-[#053B50]/65 flex items-center gap-1 font-mono">
                      <Calendar className="w-3 h-3 text-[#053B50]" />
                      <span>{rec.date}</span>
                    </span>
                  </div>

                  <div className="grid grid-cols-2 gap-2 text-xs bg-[#F7F3EE] p-2 rounded-lg border border-[#E8DAC8]/60 mb-2">
                    <div>
                      <span className="text-[#053B50]/70 font-medium">عدد الأوجه المسمعة: </span>
                      <span className="font-bold text-[#053B50] font-mono">{rec.pagesCount} أوجه</span>
                    </div>
                    <div>
                      <span className="text-[#053B50]/70 font-medium">عدد الآيات: </span>
                      <span className="font-bold text-[#053B50] font-mono">{rec.versesCount} آية</span>
                    </div>
                  </div>

                  {rec.notes && (
                    <div className="text-xs text-emerald-800 bg-emerald-50 border border-emerald-100 p-2 rounded-lg flex items-start gap-1.5 mb-1.5">
                      <CheckCircle2 className="w-3.5 h-3.5 text-emerald-600 shrink-0 mt-0.5" />
                      <span><strong>ملاحظات الحفظ: </strong>{rec.notes}</span>
                    </div>
                  )}

                  {rec.complaints && (
                    <div className="text-xs text-amber-900 bg-amber-50 border border-amber-200 p-2 rounded-lg flex items-start gap-1.5">
                      <AlertTriangle className="w-3.5 h-3.5 text-amber-700 shrink-0 mt-0.5" />
                      <span><strong>سجل الشكاوى أو التنبيهات: </strong>{rec.complaints}</span>
                    </div>
                  )}
                </div>
              ))}
            </div>
          )}
        </div>

        {/* Footer */}
        <div className="p-3 bg-[#F7F3EE] border-t border-[#E8DAC8] flex justify-end">
          <button
            type="button"
            onClick={onClose}
            className="bg-[#053B50] text-[#FFFFFF] text-xs font-bold px-5 py-2 rounded-xl hover:bg-[#042E3F] transition-colors cursor-pointer"
          >
            إغلاق السجل
          </button>
        </div>
      </div>
    </div>
  );
};
