import React, { useEffect, useMemo, useState } from "react";

/*
  ▶ TailwindCSS 사용
  ▶ 데이터는 브라우저 localStorage 에 저장됩니다. (초기화 버튼으로 삭제 가능)
*/

export default function App() {
  return (
    <div className="min-h-screen bg-slate-50 text-slate-900">
      <Header />
      <main className="mx-auto max-w-6xl p-4 md:p-6 lg:p-8 grid grid-cols-1 lg:grid-cols-3 gap-4">
        {/* 좌측: 입력 섹션들 */}
        <div className="lg:col-span-2 space-y-4">
          <PhysicalExamCard />
          <DentalFindingsCard />
          <OverallAssessmentCard />
        </div>
        {/* 우측: 출력/도움말 */}
        <div className="lg:col-span-1 space-y-4">
          <OutputPanel />
          <PolisherPanel />
          <AboutPanel />
        </div>
      </main>
      <Footer />
    </div>
  );
}

/*********************************
 * Shared Utils
 *********************************/
const key = {
  phys: "vetreport_phys",
  dental: "vetreport_dental",
  overall: "vetreport_overall",
  output: "vetreport_output",
  dentalOpts: "vetreport_dental_opts", // (과거 호환용)
};

function saveLS(k, v) {
  try { localStorage.setItem(k, JSON.stringify(v)); } catch { /* ignore */ }
}
function loadLS(k, fallback) {
  try {
    const v = localStorage.getItem(k);
    return v ? JSON.parse(v) : fallback;
  } catch { return fallback; }
}
function emitChange(){
  try { window.dispatchEvent(new Event('vetreport-change')); } catch {}
}

function Card({ title, subtitle, children, right }) {
  return (
    <section className="bg-white rounded-2xl shadow-sm border border-slate-200">
      <div className="flex items-start justify-between gap-3 px-5 py-4 border-b border-slate-100">
        <div>
          <h2 className="text-lg font-semibold">{title}</h2>
          {subtitle ? (
            <p className="text-sm text-slate-500 mt-0.5">{subtitle}</p>
          ) : null}
        </div>
        <div>{right}</div>
      </div>
      <div className="p-5">{children}</div>
    </section>
  );
}
function Pill({ children }) { return <span className="inline-flex items-center px-2 py-1 rounded-full text-xs bg-slate-100 text-slate-700 border border-slate-200">{children}</span>; }
function Row({ children }) { return <div className="grid grid-cols-1 md:grid-cols-2 gap-3">{children}</div>; }
function Field({ label, children, hint }) { return (
  <label className="block">
    <div className="mb-1 text-sm font-medium text-slate-700">{label}</div>
    {children}
    {hint ? <div className="mt-1 text-xs text-slate-500">{hint}</div> : null}
  </label>
); }
function TextArea({ value, onChange, rows = 5, placeholder }) { return (
  <textarea className="w-full rounded-xl border border-slate-300 px-3 py-2 focus:outline-none focus:ring-2 focus:ring-blue-500/40 focus:border-blue-500 resize-y" rows={rows} value={value} onChange={(e)=> onChange(e.target.value)} placeholder={placeholder} />
); }
function CopyBtn({ text, label = "복사" }) { return (
  <but
