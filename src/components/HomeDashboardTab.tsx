import React from 'react';
import {
  Building2,
  Users,
  GraduationCap,
  Shield,
  BookOpen,
  Award,
  Sparkles,
  TrendingUp,
  UserCheck,
  ChevronLeft,
  Calendar,
} from 'lucide-react';
import type { QuranComplex, QuranCircle, RecitationRecord, UserAccount } from '../types';
import { AnimatedCounter } from './AnimatedCounter';

interface HomeDashboardTabProps {
  complexes: QuranComplex[];
  circles: QuranCircle[];
  recitations: RecitationRecord[];
  users: UserAccount[];
  selectedDate: string;
  onNavigateToComplexes: () => void;
  onSelectStudent: (student: UserAccount) => void;
}

export const HomeDashboardTab: React.FC<HomeDashboardTabProps> = ({
  complexes,
  circles,
  recitations,
  users,
  selectedDate,
  onNavigateToComplexes,
  onSelectStudent,
}) => {
  // Counts
  const totalComplexes = complexes.length;
  const totalStudents = users.filter((u) => u.role === 'student').length;
  const totalTeachers = users.filter((u) => u.role === 'teacher').length;
  const totalSupervisors = users.filter(
    (u) => u.role === 'supervisor' || u.role === 'general_admin' || u.role === 'admin'
  ).length;

  // Filter recitations for selected date (default today)
  const todayRecitations = recitations.filter((r) => r.date === selectedDate);
  const totalVersesToday = todayRecitations.reduce((acc, r) => acc + (r.versesCount || 0), 0);
  const totalPagesToday = todayRecitations.reduce((acc, r) => acc + (r.pagesCount || 0), 0);

  // 1. Most accomplished complex (أكثر مجمع إنجازاً)
  const complexAchievementMap: Record<string, { name: string; verses: number; pages: number }> = {};
  todayRecitations.forEach((r) => {
    const cId = r.complexId || 'default';
    if (!complexAchievementMap[cId]) {
      const comp = complexes.find((c) => c.id === cId);
      complexAchievementMap[cId] = {
        name: comp ? comp.name : 'مجمع عزم النموذجي',
        verses: 0,
        pages: 0,
      };
    }
    complexAchievementMap[cId].verses += r.versesCount || 0;
    complexAchievementMap[cId].pages += r.pagesCount || 0;
  });

  const topComplex = Object.values(complexAchievementMap).sort((a, b) => b.verses - a.verses)[0];

  // 2. Most accomplished circle in each complex (أكثر حلقة إنجازاً في كل مجمع)
  const circlesByComplex: Record<string, { complexName: string; circles: Record<string, { name: string; verses: number }> }> = {};
  todayRecitations.forEach((r) => {
    const cId = r.complexId || 'default';
    const comp = complexes.find((c) => c.id === cId);
    const compName = comp ? comp.name : 'مجمع القرآن';

    if (!circlesByComplex[cId]) {
      circlesByComplex[cId] = { complexName: compName, circles: {} };
    }
    if (!circlesByComplex[cId].circles[r.circleId]) {
      circlesByComplex[cId].circles[r.circleId] = { name: r.circleName, verses: 0 };
    }
    circlesByComplex[cId].circles[r.circleId].verses += r.versesCount || 0;
  });

  const topCirclesPerComplex = Object.values(circlesByComplex).map((item) => {
    const bestCircle = Object.values(item.circles).sort((a, b) => b.verses - a.verses)[0];
    return {
      complexName: item.complexName,
      circleName: bestCircle?.name || 'حلقة الإتقان',
      verses: bestCircle?.verses || 0,
    };
  });

  // 3. Top 5 students across all complexes (أكثر ٥ طلاب إنجازاً وتسميعاً)
  const studentStatsMap: Record<string, { studentId: string; name: string; verses: number; pages: number; circleName: string; complexName: string }> = {};
  todayRecitations.forEach((r) => {
    if (!studentStatsMap[r.studentId]) {
      studentStatsMap[r.studentId] = {
        studentId: r.studentId,
        name: r.studentName,
        verses: 0,
        pages: 0,
        circleName: r.circleName,
        complexName: complexes.find((c) => c.id === r.complexId)?.name || 'مجمع عزم',
      };
    }
    studentStatsMap[r.studentId].verses += r.versesCount || 0;
    studentStatsMap[r.studentId].pages += r.pagesCount || 0;
  });

  const top5Students = Object.values(studentStatsMap)
    .sort((a, b) => b.verses - a.verses)
    .slice(0, 5);

  return (
    <div className="space-y-6">
      {/* 4 Animated Primary Counters Banner */}
      <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
        {/* Total Complexes */}
        <div className="bg-[#FFFFFF] border-2 border-[#E8DAC8] p-5 rounded-2xl shadow-xs relative overflow-hidden group hover:border-[#053B50] transition-colors">
          <div className="flex items-center justify-between mb-3">
            <span className="text-xs font-bold text-[#053B50]/75">عدد المجمعات القرآنية</span>
            <div className="w-10 h-10 rounded-xl bg-[#053B50] text-[#FFFFFF] flex items-center justify-center shadow-xs">
              <Building2 className="w-5 h-5 text-[#E8DAC8]" />
            </div>
          </div>
          <div className="text-3xl sm:text-4xl font-black text-[#053B50]">
            <AnimatedCounter to={totalComplexes} />
          </div>
          <p className="text-[11px] text-[#053B50]/60 mt-1">مجمع تعليمي نشط</p>
        </div>

        {/* Total Students */}
        <div className="bg-[#FFFFFF] border-2 border-[#E8DAC8] p-5 rounded-2xl shadow-xs relative overflow-hidden group hover:border-[#053B50] transition-colors">
          <div className="flex items-center justify-between mb-3">
            <span className="text-xs font-bold text-[#053B50]/75">عدد طلاب المجمعات</span>
            <div className="w-10 h-10 rounded-xl bg-[#053B50] text-[#FFFFFF] flex items-center justify-center shadow-xs">
              <GraduationCap className="w-5 h-5 text-[#E8DAC8]" />
            </div>
          </div>
          <div className="text-3xl sm:text-4xl font-black text-[#053B50]">
            <AnimatedCounter to={totalStudents} />
          </div>
          <p className="text-[11px] text-[#053B50]/60 mt-1">طالب مسجل في الحلقات</p>
        </div>

        {/* Total Teachers */}
        <div className="bg-[#FFFFFF] border-2 border-[#E8DAC8] p-5 rounded-2xl shadow-xs relative overflow-hidden group hover:border-[#053B50] transition-colors">
          <div className="flex items-center justify-between mb-3">
            <span className="text-xs font-bold text-[#053B50]/75">عدد معلمين المجمعات</span>
            <div className="w-10 h-10 rounded-xl bg-[#053B50] text-[#FFFFFF] flex items-center justify-center shadow-xs">
              <Users className="w-5 h-5 text-[#E8DAC8]" />
            </div>
          </div>
          <div className="text-3xl sm:text-4xl font-black text-[#053B50]">
            <AnimatedCounter to={totalTeachers} />
          </div>
          <p className="text-[11px] text-[#053B50]/60 mt-1">معلم وقارئ مجاز</p>
        </div>

        {/* Total Supervisors */}
        <div className="bg-[#FFFFFF] border-2 border-[#E8DAC8] p-5 rounded-2xl shadow-xs relative overflow-hidden group hover:border-[#053B50] transition-colors">
          <div className="flex items-center justify-between mb-3">
            <span className="text-xs font-bold text-[#053B50]/75">عدد مشرفين المجمعات</span>
            <div className="w-10 h-10 rounded-xl bg-[#053B50] text-[#FFFFFF] flex items-center justify-center shadow-xs">
              <Shield className="w-5 h-5 text-[#E8DAC8]" />
            </div>
          </div>
          <div className="text-3xl sm:text-4xl font-black text-[#053B50]">
            <AnimatedCounter to={totalSupervisors} />
          </div>
          <p className="text-[11px] text-[#053B50]/60 mt-1">مشرف إداري وميداني</p>
        </div>
      </div>

      {/* Recitation Day Stats Strip */}
      <div className="bg-gradient-to-r from-[#053B50] to-[#084B66] text-[#FFFFFF] p-6 rounded-2xl border-2 border-[#E8DAC8] shadow-sm">
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
          <div className="flex items-center gap-4">
            <div className="w-14 h-14 rounded-2xl bg-[#E8DAC8]/20 flex items-center justify-center text-[#E8DAC8] shrink-0">
              <BookOpen className="w-7 h-7" />
            </div>
            <div>
              <span className="text-xs font-bold text-[#E8DAC8] uppercase tracking-wide">
                إنجاز التسميع القرآني
              </span>
              <h3 className="text-xl sm:text-2xl font-black text-[#FFFFFF] mt-0.5">
                عدد الآيات المسمعة اليوم
              </h3>
              <p className="text-xs text-[#E8DAC8]/90 mt-1">
                تاريخ {selectedDate} • مجموع ما رتل وحفظ الطلاب في كافة المجمعات
              </p>
            </div>
          </div>

          <div className="flex items-center gap-6 self-end sm:self-center bg-[#FFFFFF]/10 backdrop-blur-xs px-6 py-3.5 rounded-2xl border border-[#FFFFFF]/15">
            <div className="text-center">
              <span className="text-[11px] text-[#E8DAC8] block">الآيات</span>
              <div className="text-3xl sm:text-4xl font-black text-[#FFFFFF] font-mono">
                <AnimatedCounter to={totalVersesToday} />
              </div>
            </div>
            <div className="w-px h-10 bg-[#FFFFFF]/20" />
            <div className="text-center">
              <span className="text-[11px] text-[#E8DAC8] block">الأوجه</span>
              <div className="text-3xl sm:text-4xl font-black text-[#E8DAC8] font-mono">
                <AnimatedCounter to={totalPagesToday} />
              </div>
            </div>
          </div>
        </div>
      </div>

      {/* Section: Most Accomplished Complex & Circles in each Complex */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {/* Most Accomplished Complex */}
        <div className="bg-[#FFFFFF] border-2 border-[#E8DAC8] rounded-2xl p-6 shadow-xs flex flex-col justify-between">
          <div>
            <div className="flex items-center justify-between mb-4">
              <h3 className="font-bold text-base text-[#053B50] flex items-center gap-2">
                <Award className="w-5 h-5 text-amber-500" />
                <span>أكثر مجمع إنجازاً:</span>
              </h3>
              <span className="text-xs text-[#053B50]/60 font-medium">اليوم</span>
            </div>

            {topComplex ? (
              <div className="bg-[#F7F3EE] border border-[#E8DAC8] rounded-2xl p-5 mb-4">
                <div className="flex items-center justify-between">
                  <div className="flex items-center gap-3">
                    <div className="w-12 h-12 rounded-xl bg-[#053B50] text-[#FFFFFF] flex items-center justify-center">
                      <Building2 className="w-6 h-6 text-[#E8DAC8]" />
                    </div>
                    <div>
                      <h4 className="font-black text-lg text-[#053B50]">{topComplex.name}</h4>
                      <p className="text-xs text-[#053B50]/70 mt-0.5">
                        حقق أعلى حصيلة تلاوة وتسميع اليوم
                      </p>
                    </div>
                  </div>
                </div>

                <div className="grid grid-cols-2 gap-3 mt-4 pt-4 border-t border-[#E8DAC8] text-center">
                  <div className="bg-[#FFFFFF] p-2.5 rounded-xl border border-[#E8DAC8]">
                    <span className="text-[11px] text-[#053B50]/70 font-semibold block">إجمالي الآيات</span>
                    <span className="text-xl font-black text-[#053B50] font-mono">
                      <AnimatedCounter to={topComplex.verses} />
                    </span>
                  </div>
                  <div className="bg-[#FFFFFF] p-2.5 rounded-xl border border-[#E8DAC8]">
                    <span className="text-[11px] text-[#053B50]/70 font-semibold block">إجمالي الأوجه</span>
                    <span className="text-xl font-black text-[#053B50] font-mono">
                      <AnimatedCounter to={topComplex.pages} />
                    </span>
                  </div>
                </div>
              </div>
            ) : (
              <div className="p-8 text-center bg-[#F7F3EE] rounded-xl text-xs text-[#053B50]/60">
                لا توجد بيانات تسميع مسجلة بعد في تاريخ اليوم
              </div>
            )}
          </div>

          <button
            type="button"
            onClick={onNavigateToComplexes}
            className="w-full bg-[#F7F3EE] hover:bg-[#E8DAC8] text-[#053B50] font-bold text-xs py-2.5 rounded-xl border border-[#E8DAC8] flex items-center justify-center gap-1.5 cursor-pointer transition-colors"
          >
            <span>استعراض كافة المجمعات والحلقات</span>
            <ChevronLeft className="w-4 h-4" />
          </button>
        </div>

        {/* Most Accomplished Circle in Each Complex */}
        <div className="bg-[#FFFFFF] border-2 border-[#E8DAC8] rounded-2xl p-6 shadow-xs flex flex-col justify-between">
          <div>
            <div className="flex items-center justify-between mb-4">
              <h3 className="font-bold text-base text-[#053B50] flex items-center gap-2">
                <Sparkles className="w-5 h-5 text-[#053B50]" />
                <span>أكثر حلقة إنجازاً في كل مجمع:</span>
              </h3>
              <span className="text-xs text-[#053B50]/60 font-medium">اليوم</span>
            </div>

            {topCirclesPerComplex.length === 0 ? (
              <div className="p-8 text-center bg-[#F7F3EE] rounded-xl text-xs text-[#053B50]/60">
                لم يتم تسجيل إنجازات للحلقات في هذا التاريخ حتى الآن
              </div>
            ) : (
              <div className="space-y-2.5 max-h-64 overflow-y-auto pr-1">
                {topCirclesPerComplex.map((item, idx) => (
                  <div
                    key={idx}
                    className="p-3 bg-[#F7F3EE] rounded-xl border border-[#E8DAC8] flex items-center justify-between hover:border-[#053B50] transition-colors"
                  >
                    <div>
                      <span className="text-[11px] text-[#053B50]/70 font-semibold block">
                        {item.complexName}
                      </span>
                      <h5 className="font-bold text-sm text-[#053B50] mt-0.5">
                        {item.circleName}
                      </h5>
                    </div>

                    <div className="text-left">
                      <span className="text-xs font-black text-[#053B50] font-mono block">
                        {item.verses} آية
                      </span>
                      <span className="text-[10px] text-emerald-700 font-bold">الحلقة الأولى</span>
                    </div>
                  </div>
                ))}
              </div>
            )}
          </div>

          <p className="text-[11px] text-[#053B50]/60 text-center mt-3">
            يتم تحديث ترتيب الحلقات في كل مجمع بصورة فورية مع كل جلسة تسميع.
          </p>
        </div>
      </div>

      {/* Top 5 Students Across All Complexes */}
      <div className="bg-[#FFFFFF] border-2 border-[#E8DAC8] rounded-2xl p-6 shadow-xs">
        <div className="flex items-center justify-between mb-4">
          <div>
            <h3 className="font-bold text-base text-[#053B50] flex items-center gap-2">
              <Award className="w-5 h-5 text-amber-500" />
              <span>أكثر ٥ طلاب إنجازاً في المجمعات وتسميعاً:</span>
            </h3>
            <p className="text-xs text-[#053B50]/70 mt-0.5">
              انقر على أي طالب لاستعراض سجله الكامل والشكاوى والملاحظات
            </p>
          </div>
          <span className="text-xs font-bold text-[#053B50] bg-[#F7F3EE] px-3 py-1 rounded-lg border border-[#E8DAC8]">
            أفضل 5 طلاب
          </span>
        </div>

        {top5Students.length === 0 ? (
          <div className="text-center py-10 bg-[#F7F3EE] rounded-xl text-xs text-[#053B50]/60">
            لم تسجل بيانات تسميع للطلاب في هذا التاريخ حتى الآن
          </div>
        ) : (
          <div className="grid grid-cols-1 sm:grid-cols-5 gap-3">
            {top5Students.map((st, idx) => {
              const fullUser = users.find((u) => u.id === st.studentId) || {
                id: st.studentId,
                username: st.name,
                email: '',
                role: 'student',
                createdAt: '',
                isVerified: true,
                complexName: st.complexName,
                circleName: st.circleName,
              };

              return (
                <div
                  key={st.studentId}
                  onClick={() => onSelectStudent(fullUser)}
                  className="bg-[#F7F3EE] hover:bg-[#FFFFFF] border-2 border-[#E8DAC8] hover:border-[#053B50] p-4 rounded-xl cursor-pointer transition-all shadow-2xs text-center relative group"
                >
                  <div className="w-6 h-6 rounded-full bg-[#053B50] text-[#FFFFFF] font-mono text-xs font-bold flex items-center justify-center mx-auto mb-2 shadow-xs">
                    {idx + 1}
                  </div>

                  <div className="w-12 h-12 rounded-full bg-[#FFFFFF] border-2 border-[#E8DAC8] mx-auto mb-2 flex items-center justify-center text-[#053B50] group-hover:scale-105 transition-transform">
                    <UserCheck className="w-6 h-6 text-[#053B50]" />
                  </div>

                  <h4 className="font-black text-xs sm:text-sm text-[#053B50] truncate">
                    {st.name}
                  </h4>
                  <p className="text-[10px] text-[#053B50]/70 truncate mt-0.5">
                    {st.complexName}
                  </p>

                  <div className="mt-3 pt-2.5 border-t border-[#E8DAC8] text-center">
                    <div className="text-sm font-black text-[#053B50] font-mono">
                      {st.verses} <span className="text-[11px] font-sans font-normal text-[#053B50]/70">آية</span>
                    </div>
                    <span className="text-[10px] text-emerald-700 font-bold block mt-0.5">
                      ({st.pages} أوجه مسمعة)
                    </span>
                  </div>
                </div>
              );
            })}
          </div>
        )}
      </div>
    </div>
  );
};
