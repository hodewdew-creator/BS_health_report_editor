import React, { useEffect, useMemo, useState } from "react";
import templates from "./data/templates.json";
import SuggestTemplateModal from "./components/SuggestTemplateModal";

/**
 * A안(메인에 쌓기) 최종 적용 단계별 가이드
 *
 * 1) UI 교체
 *    - SuggestTemplateModal.jsx를 v2 버전으로 교체 (이미 교체 완료)
 *    - 제출 시크릿 필드 제거, 신체검사/종합소견 구분 UI 반영
 *
 * 2) App.jsx에 onSubmit 연결
 *    - SuggestTemplateModal 호출 부분에 onSubmit 추가
 *    - 예시:
 *      <SuggestTemplateModal
        open={suggestOpen}
        onClose={()=>setSuggestOpen(false)}
        onSubmit={handleTemplateSuggestion}
      />
 *
 * 3) Vercel 서버리스 API 추가
 *    - /api/suggest.js: 제안 내용을 main 레포의 suggestions/pending 폴더에 JSON 파일로 커밋
 *    - /api/approve.js: 관리자 승인 시 templates.json에 반영하고, pending 파일 정리
 *
 * 4) Vercel 환경변수 설정
 *    - GITHUB_TOKEN (repo write 권한 있는 PAT)
 *
 * 5) (선택) 관리자용 검토 페이지 구현
 *    - suggestions/pending/*.json 목록 불러오기
 *    - 체크박스 선택 후 "확인" 버튼 → /api/approve.js 호출
 *
 * 👉 이 흐름으로 "사용자 제안 → suggestions/pending에 저장 → 관리자 확인 후 templates.json 반영" 가능
 */

export default function App() {
  const [tab, setTab] = useState(() => {
    try { return localStorage.getItem("ui_tab") || "physical"; } catch { return "physical"; }
  });
  useEffect(()=> { try { localStorage.setItem("ui_tab", tab); } catch {} }, [tab]);

  // ⬇️ 제안 모달 상태
  const [suggestOpen, setSuggestOpen] = useState(false);

  // ⬇️ 템플릿 제안 제출 핸들러 (2단계)
  const handleTemplateSuggestion = async (payload) => {
    try {
      const r = await fetch("/api/suggest", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(payload),
      });
      let data = {};
      try { data = await r.json(); } catch {}
      if (!r.ok) {
        alert("저장 실패: " + (data?.error || r.status));
        return;
      }
      alert("제안이 저장되었습니다. (관리자 확인 후 반영)");
    } catch (e) {
      alert("네트워크 오류: " + e);
    }
  };

  return (
    <div className="min-h-screen bg-slate-50 text-slate-900 antialiased">
      <Header tab={tab} onTab={setTab} onSuggest={()=>setSuggestOpen(true)} />
      {/* 제안 모달 */}
      <SuggestTemplateModal
        open={suggestOpen}
        onClose={()=>setSuggestOpen(false)}        onSubmit={handleTemplateSuggestion}
/>

      <main className="mx-auto max-w-6xl p-4 md:p-6 lg:p-8 grid grid-cols-1 lg:grid-cols-3 gap-4">
        <div className="lg:col-span-2 space-y-4">
          {tab === "physical" && <PhysicalExamCard />}
          {tab === "dental" && <DentalFindingsCard />}
          {tab === "overall" && <OverallAssessmentCard />}
        </div>

        <div className="lg:col-span-1 space-y-4 lg:sticky top-24 self-start">
          <OutputPanel />
          <PolisherPanel />
          <AboutPanel />
        </div>
      </main>
      <Footer />
    </div>
  );
}

// ✅ 요약: UI 교체 → onSubmit 연결 → /api/suggest & /api/approve 추가 → GITHUB_TOKEN 세팅 → (선택) 관리자 페이지
