import React, { useState } from 'react';
import {
  Building2,
  MapPin,
  Users,
  Award,
  ChevronRight,
  BookOpen,
  Calendar,
  Sparkles,
  ArrowRight,
  UserCheck,
} from 'lucide-react';
import type { QuranComplex, QuranCircle, RecitationRecord, UserAccount } from '../types';
import { AnimatedCounter } from './AnimatedCounter';

interface ComplexDetailViewProps {
  complex: QuranComplex;
  circles: QuranCircle[];
  recitations: RecitationRecord[];
  students: UserAccount[];
  teachers: UserAccount[];
  selectedDate: string;
  onSelectCircle: (circle: QuranCircle) => void;
  onSelectStudent: (student: UserAccount) => void;
  onBack: () => void;
}

export const ComplexDetailView: React.FC<ComplexDetailViewProps> = ({
  complex,
  circles,
  recitations,
  students,
  selectedDate,
  onSelectCircle,
  onSelectStudent,
  onBack,
}) => {
  const complexCircles = circles.filter((c) => c.complexId === complex.id);
  const complexCircleIds = new Set(complexCircles.map((c) => c.id));

  // Recitations for this complex matching selected date
  const dateRecitations = recitations.filter(
    (r) =>
      (r.complexId === complex.id || complexCircleIds.has(r.circleId)) &&
      r.date === selectedDate
  );

  // Total verses and pages recited in complex on selected date
  const versesCount = dateRecitations.reduce((acc, r) => acc + (r.versesCount || 0), 0);
  const pagesCount = dateRecitations.reduce((acc, r) => acc + (r.pagesCount || 0), 0);

  // Circle with highest achievement today
  const circleAchievementMap: Record<string, { name: string; verses: number; pages: number }> = {};
  dateRecitations.forEach((r) => {
    if (!circleAchievementMap[r.circleId]) {
      circleAchievementMap[r.circleId] = { name: r.circleName, verses: 0, pages: 0 };
    }
    circleAchievementMap[r.circleId].verses += r.versesCount || 0;
    circleAchievementMap[r.circleId].pages += r.pagesCount || 0;
  });

  const topCircleEntry = Object.values(circleAchievementMap).sort(
    (a, b) => b.verses - a.verses
  )[0];

  // Top teacher with students
  const teacherAchievementMap: Record<string, { name: string; verses: number }> = {};
  dateRecitations.forEach((r) => {
    const c = complexCircles.find((x) => x.id === r.circleId);
    const tName = c?.teacherName || 'الشيخ المشرف';
    if (!teacherAchievementMap[tName]) teacherAchievementMap[tName] = { name: tName, verses: 0 };
    teacherAchievementMap[tName].verses += r.versesCount || 0;
  });
  const topTeacher = Object.values(teacherAchievementMap).sort((a, b) => b.verses - a.verses)[0];

  // Top 5 Students in complex by pages recited
  const studentPagesMap: Record<string, { name: string; studentId: string; pages: number; verses: number }> = {};
  dateRecitations.forEach((r) => {
    if (!studentPagesMap[r.studentId]) {
      studentPagesMap[r.studentId] = {
        name: r.studentName,
        studentId: r.studentId,
        pages: 0,
        verses: 0,
      };
    }
    studentPagesMap[r.studentId].pages += r.pagesCount || 0;
    studentPagesMap[r.studentId].verses += r.versesCount || 0;
  });

  const top5Students = Object.values(studentPagesMap)
    .sort((a, b) => b.pages - a.pages)
    .slice(0, 5);

  return (
    <div className="space-y-6">
      {/* Top back banner */}
      <div className="flex items-center justify-between bg-[#F7F3EE] p-4 rounded-2xl border border-[#E8DAC8]">
        <button
          type="button"
          onClick={onBack}
          className="flex items-center gap-2 text-xs font-bold text-[#053B50] hover:text-[#042E3F] cursor-pointer"
        >
          <ArrowRight className="w-4 h-4" />
          <span>الرجوع لكافة المجمعات</span>
        </button>

        <div className="flex items-center gap-2 text-xs font-bold text-[#053B50]">
          <Calendar className="w-4 h-4" />
          <span>تاريخ التقرير المعروض: <span className="font-mono">{selectedDate}</span></span>
        </div>
      </div>

      {/* Complex Header Card */}
      <div className="bg-[#FFFFFF] border-2 border-[#E8DAC8] rounded-2xl p-6 shadow-sm">
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
          <div className="flex items-start gap-4">
            <div className="w-14 h-14 rounded-2xl bg-[#053B50] text-[#FFFFFF] flex items-center justify-center shrink-0 shadow-md">
              <Building2 className="w-7 h-7 text-[#E8DAC8]" />
            </div>
            <div>
              <span className="text-xs font-bold text-[#053B50]/70 bg-[#E8DAC8]/40 px-2.5 py-0.5 rounded-full">
                إحصائيات المجمع القرآني
              </span>
              <h2 className="text-2xl font-black text-[#053B50] mt-1">{complex.name}</h2>
              {complex.locationName && (
                <p className="text-xs text-[#053B50]/70 flex items-center gap-1 mt-1">
                  <MapPin className="w-3.5 h-3.5 text-[#053B50]" />
                  <span>{complex.locationName}</span>
                </p>
              )}
            </div>
          </div>

          <div className="flex gap-2">
            {complex.latitude && complex.longitude && (
              <a
                href={`https://www.google.com/maps?q=${complex.latitude},${complex.longitude}`}
                target="_blank"
                rel="noreferrer"
                className="bg-[#F7F3EE] hover:bg-[#E8DAC8] text-[#053B50] text-xs font-bold px-3 py-2 rounded-xl border border-[#E8DAC8] flex items-center gap-1.5 transition-colors"
              >
                <MapPin className="w-3.5 h-3.5" />
                <span>عرض على خرائط جوجل</span>
              </a>
            )}
          </div>
        </div>
      </div>

      {/* 4 Core Achievement Cards for Complex */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
        {/* Card 1: Verses Recited */}
        <div className="bg-[#FFFFFF] border-2 border-[#E8DAC8] p-5 rounded-2xl shadow-xs">
          <span className="text-xs font-bold text-[#053B50]/70 block mb-1">عدد الآيات المسمعة</span>
          <div className="text-3xl font-black text-[#053B50] my-1">
            <AnimatedCounter to={versesCount} />
          </div>
          <span className="text-[11px] text-[#053B50]/60">مجموع آيات طلاب المجمع</span>
        </div>

        {/* Card 2: Pages Recited */}
        <div className="bg-[#FFFFFF] border-2 border-[#E8DAC8] p-5 rounded-2xl shadow-xs">
          <span className="text-xs font-bold text-[#053B50]/70 block mb-1">عدد الأوجه المسمعة اليوم</span>
          <div className="text-3xl font-black text-[#053B50] my-1">
            <AnimatedCounter to={pagesCount} />
          </div>
          <span className="text-[11px] text-[#053B50]/60">صفحات المصحف المنجزة</span>
        </div>

        {/* Card 3: Top Circle */}
        <div className="bg-[#FFFFFF] border-2 border-[#E8DAC8] p-5 rounded-2xl shadow-xs">
          <span className="text-xs font-bold text-[#053B50]/70 block mb-1">أكثر حلقة فيها إنجاز</span>
          <div className="text-base font-black text-[#053B50] truncate my-1.5">
            {topCircleEntry ? topCircleEntry.name : 'لا توجد بيانات'}
          </div>
          <span className="text-[11px] text-emerald-700 font-bold">
            {topCircleEntry ? `${topCircleEntry.verses} آية مسمعة` : '—'}
          </span>
        </div>

        {/* Card 4: Top Teacher */}
        <div className="bg-[#FFFFFF] border-2 border-[#E8DAC8] p-5 rounded-2xl shadow-xs">
          <span className="text-xs font-bold text-[#053B50]/70 block mb-1">أكثر شيخ إنجازاً مع طلابه</span>
          <div className="text-base font-black text-[#053B50] truncate my-1.5">
            {topTeacher ? topTeacher.name : 'الشيخ المشرف'}
          </div>
          <span className="text-[11px] text-emerald-700 font-bold">
            {topTeacher ? `${topTeacher.verses} آية مسمعة` : '—'}
          </span>
        </div>
      </div>

      {/* Top 5 Students in Complex */}
      <div className="bg-[#FFFFFF] border-2 border-[#E8DAC8] rounded-2xl p-6 shadow-xs">
        <div className="flex items-center justify-between mb-4">
          <h3 className="font-bold text-base text-[#053B50] flex items-center gap-2">
            <Award className="w-5 h-5 text-amber-500" />
            <span>الطلاب الخمسة الأوائل على المجمع (الأكثر تسميعاً للأوجه):</span>
          </h3>
          <span className="text-xs font-semibold text-[#053B50]/70">تاريخ {selectedDate}</span>
        </div>

        {top5Students.length === 0 ? (
          <div className="text-center py-8 bg-[#F7F3EE] rounded-xl text-xs text-[#053B50]/60">
            لم يتم رصد تسميع للطلاب في هذا التاريخ بعد
          </div>
        ) : (
          <div className="grid grid-cols-1 sm:grid-cols-5 gap-3">
            {top5Students.map((st, idx) => {
              const fullStudent = students.find((s) => s.id === st.studentId) || {
                id: st.studentId,
                username: st.name,
                email: '',
                role: 'student',
                createdAt: '',
                isVerified: true,
                complexName: complex.name,
              };

              return (
                <div
                  key={st.studentId}
                  onClick={() => onSelectStudent(fullStudent)}
                  className="bg-[#F7F3EE] hover:bg-[#E8DAC8]/40 border border-[#E8DAC8] rounded-xl p-3 text-center cursor-pointer transition-all hover:scale-102 shadow-2xs relative"
                >
                  <div className="absolute top-2 right-2 w-5 h-5 rounded-full bg-[#053B50] text-[#FFFFFF] text-[11px] font-bold flex items-center justify-center">
                    {idx + 1}
                  </div>
                  <div className="w-10 h-10 rounded-full bg-[#FFFFFF] border border-[#E8DAC8] mx-auto mb-2 flex items-center justify-center text-[#053B50]">
                    <UserCheck className="w-5 h-5 text-[#053B50]" />
                  </div>
                  <h4 className="font-bold text-xs text-[#053B50] truncate">{st.name}</h4>
                  <div className="mt-2 pt-2 border-t border-[#E8DAC8]/60 text-[11px]">
                    <span className="font-black text-[#053B50] font-mono text-sm">{st.pages}</span>{' '}
                    <span className="text-[#053B50]/70 font-semibold">أوجه</span>
                  </div>
                  <span className="text-[10px] text-[#053B50]/60 block font-mono">({st.verses} آية)</span>
                </div>
              );
            })}
          </div>
        )}
      </div>

      {/* Circles List Under This Complex */}
      <div className="bg-[#FFFFFF] border-2 border-[#E8DAC8] rounded-2xl p-6 shadow-xs">
        <div className="flex items-center justify-between mb-4">
          <h3 className="font-bold text-base text-[#053B50] flex items-center gap-2">
            <BookOpen className="w-5 h-5 text-[#053B50]" />
            <span>حلقات المجمع ({complexCircles.length} حلقة):</span>
          </h3>
          <span className="text-xs text-[#053B50]/70">انقر على أي حلقة لعرض سجل إنجازها اليومي والطلبة</span>
        </div>

        {complexCircles.length === 0 ? (
          <div className="text-center py-8 bg-[#F7F3EE] rounded-xl text-xs text-[#053B50]/60">
            لا توجد حلقات مضافة لهذا المجمع حتى الآن
          </div>
        ) : (
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-3">
            {complexCircles.map((circle) => {
              const circleRecs = dateRecitations.filter((r) => r.circleId === circle.id);
              const cPages = circleRecs.reduce((a, b) => a + (b.pagesCount || 0), 0);
              const cVerses = circleRecs.reduce((a, b) => a + (b.versesCount || 0), 0);

              return (
                <div
                  key={circle.id}
                  onClick={() => onSelectCircle(circle)}
                  className="bg-[#F7F3EE] hover:bg-[#FFFFFF] border-2 border-[#E8DAC8] hover:border-[#053B50] p-4 rounded-xl cursor-pointer transition-all shadow-2xs group"
                >
                  <div className="flex items-start justify-between">
                    <div>
                      <h4 className="font-black text-sm text-[#053B50] group-hover:text-[#053B50]">
                        {circle.name}
                      </h4>
                      <p className="text-xs text-[#053B50]/70 mt-0.5">
                        المعلم: {circle.teacherName || 'لم يعين معلم بعد'}
                      </p>
                    </div>
                    <ChevronRight className="w-4 h-4 text-[#053B50]/40 group-hover:text-[#053B50] rotate-180 transition-transform" />
                  </div>

                  <div className="mt-3 pt-3 border-t border-[#E8DAC8] flex items-center justify-between text-xs">
                    <span className="text-[#053B50]/80">إنجاز اليوم:</span>
                    <span className="font-bold text-[#053B50] font-mono">
                      {cPages} أوجه ({cVerses} آية)
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
