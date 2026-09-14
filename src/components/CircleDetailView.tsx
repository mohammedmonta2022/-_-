import React from 'react';
import {
  Users,
  BookOpen,
  Calendar,
  ArrowRight,
  User,
  Plus,
} from 'lucide-react';
import type { QuranCircle, RecitationRecord, UserAccount } from '../types';
import { AnimatedCounter } from './AnimatedCounter';

interface CircleDetailViewProps {
  circle: QuranCircle;
  complexName: string;
  recitations: RecitationRecord[];
  students: UserAccount[];
  selectedDate: string;
  onSelectStudent: (student: UserAccount) => void;
  onBack: () => void;
  onAddRecitation: (circle: QuranCircle) => void;
}

export const CircleDetailView: React.FC<CircleDetailViewProps> = ({
  circle,
  complexName,
  recitations,
  students,
  selectedDate,
  onSelectStudent,
  onBack,
  onAddRecitation,
}) => {
  // Recitations for this circle on selected date
  const dateRecitations = recitations.filter(
    (r) => r.circleId === circle.id && r.date === selectedDate
  );

  const totalPages = dateRecitations.reduce((acc, r) => acc + (r.pagesCount || 0), 0);
  const totalVerses = dateRecitations.reduce((acc, r) => acc + (r.versesCount || 0), 0);

  // Students belonging to this circle
  const circleStudents = students.filter(
    (s) => s.circleId === circle.id || s.circleName === circle.name
  );

  return (
    <div className="space-y-6">
      {/* Top Banner */}
      <div className="flex items-center justify-between bg-[#F7F3EE] p-4 rounded-2xl border border-[#E8DAC8]">
        <button
          type="button"
          onClick={onBack}
          className="flex items-center gap-2 text-xs font-bold text-[#053B50] hover:text-[#042E3F] cursor-pointer"
        >
          <ArrowRight className="w-4 h-4" />
          <span>العودة لإحصائيات المجمع</span>
        </button>

        <div className="flex items-center gap-2 text-xs font-bold text-[#053B50]">
          <Calendar className="w-4 h-4" />
          <span>تاريخ التقرير: <span className="font-mono">{selectedDate}</span></span>
        </div>
      </div>

      {/* Circle Info Card */}
      <div className="bg-[#FFFFFF] border-2 border-[#E8DAC8] rounded-2xl p-6 shadow-sm">
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
          <div>
            <span className="text-xs font-bold text-[#053B50]/70 bg-[#E8DAC8]/40 px-2.5 py-0.5 rounded-full">
              {complexName}
            </span>
            <h2 className="text-2xl font-black text-[#053B50] mt-1">{circle.name}</h2>
            <p className="text-xs text-[#053B50]/75 mt-1">
              معلم الحلقة: <strong className="text-[#053B50]">{circle.teacherName || 'لم يعين معلم بعد'}</strong>
            </p>
          </div>

          <button
            type="button"
            onClick={() => onAddRecitation(circle)}
            className="bg-[#053B50] hover:bg-[#042E3F] text-[#FFFFFF] text-xs font-bold px-4 py-2.5 rounded-xl flex items-center gap-1.5 shadow-md cursor-pointer transition-colors"
          >
            <Plus className="w-4 h-4 text-[#E8DAC8]" />
            <span>تسجيل تسميع جديد اليوم</span>
          </button>
        </div>
      </div>

      {/* Circle Achievement Quick Stats */}
      <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
        <div className="bg-[#FFFFFF] border-2 border-[#E8DAC8] p-5 rounded-2xl shadow-xs">
          <span className="text-xs font-bold text-[#053B50]/70 block mb-1">إجمالي الأوجه المسمعة</span>
          <div className="text-3xl font-black text-[#053B50] my-1">
            <AnimatedCounter to={totalPages} />
          </div>
          <span className="text-[11px] text-[#053B50]/60">أوجه مسمعة بتاريخ اليوم</span>
        </div>

        <div className="bg-[#FFFFFF] border-2 border-[#E8DAC8] p-5 rounded-2xl shadow-xs">
          <span className="text-xs font-bold text-[#053B50]/70 block mb-1">إجمالي الآيات المسمعة</span>
          <div className="text-3xl font-black text-[#053B50] my-1">
            <AnimatedCounter to={totalVerses} />
          </div>
          <span className="text-[11px] text-[#053B50]/60">مجموع آيات طلاب الحلقة</span>
        </div>

        <div className="bg-[#FFFFFF] border-2 border-[#E8DAC8] p-5 rounded-2xl shadow-xs">
          <span className="text-xs font-bold text-[#053B50]/70 block mb-1">عدد الطلاب المسجلين</span>
          <div className="text-3xl font-black text-[#053B50] my-1">
            <AnimatedCounter to={circleStudents.length || dateRecitations.length} />
          </div>
          <span className="text-[11px] text-[#053B50]/60">طلاب ملتحقون بالحلقة</span>
        </div>
      </div>

      {/* Table of What Each Student Recited Today */}
      <div className="bg-[#FFFFFF] border-2 border-[#E8DAC8] rounded-2xl p-6 shadow-xs">
        <div className="flex items-center justify-between mb-4">
          <div>
            <h3 className="font-bold text-base text-[#053B50]">
              سجل تسميع طلاب الحلقة اليوم:
            </h3>
            <p className="text-xs text-[#053B50]/70">
              انقر على اسم أي طالب للاطلاع على سجله الفردي الكامل (الآيات، الأوجه، الملاحظات، الشكاوى)
            </p>
          </div>
          <span className="text-xs font-bold text-[#053B50] bg-[#F7F3EE] px-3 py-1 rounded-lg border border-[#E8DAC8]">
            {dateRecitations.length} تسميعات مسجلة
          </span>
        </div>

        {dateRecitations.length === 0 ? (
          <div className="text-center py-10 bg-[#F7F3EE] rounded-xl border border-dashed border-[#E8DAC8] text-xs text-[#053B50]/60">
            لم يقم طلاب هذه الحلقة بالتسميع في هذا التاريخ، يمكنك الضغط على "تسجيل تسميع جديد اليوم" أعلاه.
          </div>
        ) : (
          <div className="overflow-x-auto">
            <table className="w-full text-right text-xs">
              <thead>
                <tr className="border-b-2 border-[#E8DAC8] text-[#053B50] bg-[#F7F3EE]">
                  <th className="p-3 font-bold">اسم الطالب</th>
                  <th className="p-3 font-bold">نوع التسميع</th>
                  <th className="p-3 font-bold">ما تم تسميعه اليوم</th>
                  <th className="p-3 font-bold">الأوجه / الآيات</th>
                  <th className="p-3 font-bold">الملاحظات</th>
                  <th className="p-3 font-bold text-center">الإجراء</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-[#E8DAC8]">
                {dateRecitations.map((rec) => {
                  const studentObj = students.find((s) => s.id === rec.studentId) || {
                    id: rec.studentId,
                    username: rec.studentName,
                    email: '',
                    role: 'student',
                    createdAt: '',
                    isVerified: true,
                    circleName: circle.name,
                    complexName,
                  };

                  return (
                    <tr
                      key={rec.id}
                      className="hover:bg-[#F7F3EE]/60 transition-colors"
                    >
                      <td className="p-3">
                        <button
                          type="button"
                          onClick={() => onSelectStudent(studentObj)}
                          className="font-bold text-[#053B50] hover:underline flex items-center gap-1.5 cursor-pointer text-xs"
                        >
                          <User className="w-3.5 h-3.5 text-[#053B50]" />
                          <span>{rec.studentName}</span>
                        </button>
                      </td>

                      <td className="p-3">
                        <span
                          className={`inline-block px-2.5 py-0.5 rounded-full font-bold text-[11px] ${
                            rec.type === 'جديد'
                              ? 'bg-emerald-100 text-emerald-800'
                              : rec.type === 'مراجعة صغرى'
                              ? 'bg-blue-100 text-blue-800'
                              : 'bg-amber-100 text-amber-900'
                          }`}
                        >
                          {rec.type}
                        </span>
                      </td>

                      <td className="p-3 font-bold text-[#053B50]">
                        سورة {rec.surah} (الآيات {rec.ayahFrom} - {rec.ayahTo})
                      </td>

                      <td className="p-3 font-mono font-bold text-[#053B50]">
                        {rec.pagesCount} أوجه ({rec.versesCount} آية)
                      </td>

                      <td className="p-3 text-[#053B50]/75 max-w-xs truncate">
                        {rec.notes || '—'}
                      </td>

                      <td className="p-3 text-center">
                        <button
                          type="button"
                          onClick={() => onSelectStudent(studentObj)}
                          className="bg-[#053B50] hover:bg-[#042E3F] text-[#FFFFFF] text-[11px] font-bold px-3 py-1.5 rounded-lg cursor-pointer transition-colors"
                        >
                          عرض الملف الكامل
                        </button>
                      </td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
          </div>
        )}
      </div>
    </div>
  );
};
