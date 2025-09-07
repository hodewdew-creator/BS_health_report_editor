import React, { useEffect, useMemo, useState } from "react";
import SuggestTemplateModal from "./components/SuggestTemplateModal";

/**
 * NOTE:
 * - 이 파일은 "템플릿 문구 제안" 모달 연결이 포함된 App.jsx 예시입니다.
 * - 나머지 섹션(신체검사/치과/종합소견 등)은 기존 프로젝트에 있던 컴포넌트를 그대로 유지하세요.
 * - 아래의 <MainLayout/> 내부에 기존 섹션들을 그대로 붙여 사용하면 됩니다.
 */

export default function App() {
  const [tab, setTab] = useState(() => {
    try { return localStorage.getItem("ui_tab") || "physical"; } catch { return "physical"; }
  });
  const [suggestOpen, setSuggestOpen] = useState(false);

  useEffect(() => {
    try { localStorage.setItem("ui_tab", tab); } catch {}
  }, [tab]);

  return (
    <>
      <Header tab={tab} onTab={setTab} onSuggest={() => setSuggestOpen(true)} />

      <SuggestTemplateModal
        open={suggestOpen}
        onClose={() => setSuggestOpen(false)}
        secretHint="(공유된 코드)"
      />

      <main className="mx-auto max-w-6xl px-4 md:px-6 lg:px-8 py-6">
        <MainLayout tab={tab} onTab={setTab} />
      </main>

      <Footer />
    </>
  );
}

/*********************************
 * Header / Footer
 *********************************/
function Header({ tab, onTab, onSuggest = () => {} }) {
  return (
    <header className="sticky top-0 z-10 backdrop-blur bg-slate-50/85 border-b border-slate-200">
      <div className="mx-auto max-w-6xl px-4 md:px-6 lg:px-8 py-3.5">
        <div className="flex items-center justify-between gap-4">
          {/* 좌측: 로고 + 타이틀 */}
          <div className="flex items-center gap-3.5 min-w-0">
            <img
              src="/baeksan-logo.png"
              alt="FORCAT"
              className="w-16 h-16 md:w-20 md:h-20 rounded-lg bg-white object-contain p-1 shadow-sm shrink-0"
            />
            <div className="min-w-0">
              <div className="text-xl md:text-3xl font-bold tracking-tight text-slate-950 truncate">
                FORCAT 건강검진 결과서 Editor v.1.0
              </div>
              <div className="text-sm text-slate-900">
                백산동물병원 · 내부용
              </div>
            </div>
          </div>

          {/* 우측: 액션들 */}
          <div className="flex items-center gap-3 flex-wrap justify-end">
            <a
              href="#"
              onClick={(e)=>{ e.preventDefault(); if(confirm("모든 데이터를 초기화할까요?")) { localStorage.clear(); location.reload(); } }}
              className="text-xs font-bold text-slate-900 hover:text-slate-950"
              title="모든 데이터(로컬저장) 초기화"
            >
              초기화
            </a>

            <button
              onClick={onSuggest}
              className="text-xs font-semibold text-slate-950 px-3 py-1.5 rounded-lg border border-slate-300 hover:bg-slate-50 shrink-0"
              title="새 템플릿 문구를 제안합니다"
            >
              템플릿 문구 제안
            </button>
          </div>
        </div>
      </div>
    </header>
  );
}

function Footer(){
  return (
    <footer className="mt-12 border-t border-slate-200 py-6 text-center text-xs text-slate-500">
      © FORCAT · Baeksan Animal Hospital
    </footer>
  );
}

/*********************************
 * Main (섹션 래퍼)
 * - 기존 프로젝트에서 사용하던 섹션 컴포넌트(신체검사/치과/종합소견 등)를
 *   아래 컨테이너에 그대로 배치하세요.
 *********************************/
function MainLayout({ tab, onTab }){
  return (
    <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
      {/* 좌측: 입력 섹션들 */}
      <section className="space-y-6">
        {/* TODO: 기존의 PhysicalExamCard / DentalCard / SummaryCard 등 컴포넌트 삽입 */}
        <PlaceholderCard title="좌측 입력 섹션">
          <p className="text-sm text-slate-600">여기에 기존 입력 카드들을 붙여 넣으세요.</p>
        </PlaceholderCard>
      </section>

      {/* 우측: 미리보기/최종 소견 등 */}
      <section className="space-y-6">
        {/* TODO: 기존 우측 미리보기/최종 소견 컴포넌트 삽입 */}
        <PlaceholderCard title="우측 요약/미리보기 섹션">
          <p className="text-sm text-slate-600">여기에 기존 우측 카드들을 붙여 넣으세요.</p>
        </PlaceholderCard>
      </section>
    </div>
  );
}

function PlaceholderCard({ title, children }){
  return (
    <div className="rounded-2xl border border-slate-200 bg-white shadow-sm p-4">
      <div className="text-sm font-semibold text-slate-900 mb-2">{title}</div>
      {children}
    </div>
  );
}
