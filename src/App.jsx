import React, { useEffect, useMemo, useState } from "react";

/*
  ▶ TailwindCSS 사용
  ▶ 데이터는 브라우저 localStorage 에 저장되어 자동 보존됩니다.
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
          <CustomSnippetManager />
          <TemplateEditor />
        </div>
        {/* 우측: 출력/도움말 */}
        <div className="lg:col-span-1 space-y-4">
          <OutputPanel />
          <PolisherPanel />
          <DataBackupPanel />
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
  custom: "vetreport_custom_snippets",
  output: "vetreport_output",
  templates: "vetreport_templates", // { BCS_TEXT, dentalOpts }
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
function downloadJSON(filename, data) {
  const blob = new Blob([JSON.stringify(data, null, 2)], { type: "application/json" });
  const url = URL.createObjectURL(blob);
  const a = document.createElement("a");
  a.href = url; a.download = filename; a.click();
  URL.revokeObjectURL(url);
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
  <button onClick={async ()=>{ try { await navigator.clipboard.writeText(text || ""); } catch {} }} className="rounded-xl border border-slate-300 px-3 py-1.5 text-sm hover:bg-slate-50 active:scale-[.99]">{label}</button>
); }

/*********************************
 * Header / Footer
 *********************************/
function Header() {
  return (
    <header className="sticky top-0 z-10 backdrop-blur bg-slate-50/75 border-b border-slate-200">
      <div className="mx-auto max-w-6xl px-4 md:px-6 lg:px-8 py-3.5 flex items-center justify-between">
        <div className="flex items-center gap-3.5">
          {/* 로고 */}
          <img
            src="/baeksan-logo.png"
            alt="Baeksan Animal Hospital"
            className="w-10 h-10 rounded-lg bg-white object-contain p-1 shadow-sm"
          />
          {/* 타이틀 */}
          <div>
            <div className="text-lg md:text-xl font-semibold tracking-tight">
              건강검진 보고서 에디터
            </div>
            <div className="text-sm text-slate-500">
              백산동물병원 · 내부용
            </div>
          </div>
        </div>

        <div className="flex items-center gap-2">
          <span className="inline-flex items-center px-2.5 py-1 rounded-full text-xs bg-slate-100 text-slate-700 border border-slate-200">
            MVP
          </span>
          <a
            href="#"
            onClick={(e)=>{ e.preventDefault(); localStorage.clear(); location.reload(); }}
            className="text-xs text-slate-500 hover:text-slate-700"
            title="모든 데이터(로컬저장) 초기화"
          >
            초기화
          </a>
        </div>
      </div>
    </header>
  );
}
function Footer(){
  return (
    <footer className="py-6 text-center text-xs text-slate-500">
      <div className="mx-auto max-w-6xl px-4">
        © {new Date().getFullYear()} Vet Report Tools · 로컬에서 동작(데이터: localStorage)
      </div>
    </footer>
  );
}

/*********************************
 * BCS & Dental 템플릿 기본값 + 헬퍼
 *********************************/
const DEFAULT_BCS_TEXT = {
  1: `⏹ 심한 저체중 (BCS 1/9): 털이 짧으면 늑골(갈비뼈)이 육안상 명확히 확인될 정도이며, 만져지는 피하지방이 없습니다. 척추뼈와 대퇴골 부분이 도드라집니다.
- 많이 야윈 상태입니다. 근육과 지방의 적절한 증량이 시급합니다.`,

  2: `⏹ 저체중 (BCS 2/9): 털이 짧으면 육안상 늑골(갈비뼈)이 확인될 정도이며, 척추뼈가 도드라집니다. 만져지는 지방이 거의 없습니다.
- 야윈 상태입니다. 근육과 지방의 적절한 증량이 추천됩니다.`,

  3: `⏹ 마른 편 (BCS 3/9): 지방량이 적어 늑골(갈비뼈)이 쉽게 만져지며, 허리뼈가 육안상·촉진상 명확하게 도드라지고 복부에도 최소한의 지방만 존재합니다.
- 마른 상태입니다. 적절한 증량이 추천됩니다.`,

  4: `⏹ 약간 마른 편 (BCS 4/9): 늑골(갈비뼈)이 적은 지방으로 덮여 있으며, 늑골 뒤쪽으로 허리 부위가 도드라지고 복부의 fat pad(아랫배 지방)가 적은 상태입니다.
- 다소 마른 편이나 정상입니다. 주기적인 체중 체크를 해주세요.`,

  5: `⏹ 이상적 체형 (BCS 5/9): 적절한 체형입니다. 적정량의 지방이 덮인 늑골(갈비뼈)이 만져지며, 뒤편으로 허리가 관찰됩니다. 최소의 fat pad(하복부 지방)가 확인됩니다.
- 이상적인 체형입니다. 주기적인 체중 체크를 해주세요.`,

  6: `⏹ 과체중 경향 (BCS 6/9): 적정량보다 약간 많은 지방이 늑골(갈비뼈)을 덮고 있고, 허리와 하복부 지방도 있는 편이나 심하지는 않습니다.
- 주기적인 체중 측정을 해주시고, 체중이 더 늘지 않도록 해주세요.`,

  7: `⏹ 과체중 (BCS 7/9): 많은 지방 때문에 늑골(갈비뼈)이 쉽게 만져지지 않습니다. 허리가 쉽게 구분되지 않습니다. 육안상 복부가 둥글게 관찰되며, 중등량의 하복부 지방이 확인됩니다.
- 과체중 상태입니다. 주기적인 체중 측정을 해주세요. 우선은 현 체중의 10 %의 체중감량을 추천드립니다. 감량속도는 1주에 1% 이내가 권장됩니다.`,

  8: `⏹ 비만 (BCS 8/9): 두터운 지방으로 인해 늑골(갈비뼈)이 잘 만져지지 않습니다. 허리가 구분되지 않으며, 복부가 전체적으로 둥글고 하복부 지방(fat pad)이 과다합니다.
- 비만 상태입니다. 이로 인한 활동성 감소가 있을 수 있으며, 주기적인 체중 측정과 체중조절이 필요합니다. 우선은 현 체중의  15%의 체중감량을 추천드립니다. 너무 급한 체중감량은 지방간 위험성이 있으니, 식이 조절 및 먹이퍼즐, 운동등을 통해 적정 속도의 감량을 추천드리며, 감량속도는 1주에 1% 이내가 권장됩니다.`,

  9: `⏹ 중증 비만 (BCS 9/9): 두꺼운 지방층으로 늑골(갈비뼈)이 촉진되지 않습니다. 과다한 지방이 허리, 얼굴, 사지에 있습니다.
- 비만 상태입니다. 골관절염, 당뇨 등 관련한 질환 발생 가능성이 높으며, 주기적인 체중 측정과 체중조절이 시급합니다. 우선은 현 체중의 20%의 체중감량을 추천드립니다. 너무 급한 체중감량은 지방간 위험성이 있으니, 식이 조절 및 먹이퍼즐, 운동등을 통해 적정 속도의 감량을 추천드리며, 감량속도는 1주에 1% 이내가 권장됩니다. `,
};

const DEFAULT_DENTAL_OPTS = {
  status: ["양호", "경미한염증", "심한염증/치료", "발치필요","신체검사불가"],
  gingivitis: ["None", "Grade 1", "Grade 2", "Grade 3"],
  calculus: ["None", "Grade 1", "Grade 2", "Grade 3"],
  fracture: ["없음", "의심", "확인/깨짐", "확인/신경노출"],
  tr: ["의심 없음", "의심", "확인/완전흡수","확인/모니터링","확인/치료 필요"],
  missing: ["없음", "의심", "확인"],
  scaling: ["권장되지 않음", "경미한 권장", "강력한 권장","금일진행완료"],
};

const PHYS_LOOKS = [
  { title: "정상", desc: "⏹ 신체검사상 특이적인 이상소견 확인되지 않았습니다." },
  { title: "피부종괴", desc: "⏹ [병변부위] 에서 papule(구진)/mass(종괴) 확인됩니다. 크기가 크고/작고 유동적/근육에고정 되어있으며 염증성/비염증성 으로, 세포검사를 추천드립니다/세포검사상 []가 의심됩니다. 크기가 커지거나 염증을 유발할 경우 제거가 추천됩니다." },
  { title: "비만세포종", desc: "⏹ MCT(Mast cell tumor, 비만세포종)가 의심됩니다. 현재 특이 소견은 없으나, 지속적으로 소양감(간지러움증) 및 상처가 생길 경우에는 수술적 제거를 추천드립니다. 복부 초음파 상에서 추가적인 복강내 종괴 의심 소견은 확인되지 않습니다." },
  { title: "과잉그루밍", desc: "⏹ 자가손상성(핥음, 긁음) 유발되었을 것으로 생각되는 병변이 [병변부위에서] 확인됩니다. 통증, 혹은 다른 질환 및 스트레스 요인이 증상을 유발했을 수 있으며, 정도가 심할 경우 처치 및 내복약 투약 여부를 상의해주세요." },
  { title: "하복부과잉그루밍", desc: "⏹ 스트레스 혹은 알러지성 소인으로 인한 하복부 과잉 그루밍이 의심됩니다. 환부 자체는 현재 치료를 요하지 않으나, 증상이 심해서 환묘복, 넥칼라 등으로 진정이 되지 않을 경우, 내복약 투여를 고려해 볼 수 있습니다." },
  { title: "발가락과잉그루밍", desc: "⏹ 발가락 과잉그루밍 관련하여, 현재로서는 피부에 치료를 요하는 병변이 확인되지는 않습니다. 알러지성 지간염, 습진(세균,곰팡이 감염), 스트레스성 과잉그루밍 가능성이 있습니다. 넥칼라 및 소독 등 보존적 치료를 먼저 진행해보시고, 발적, 가피(딱지) 등 개선후에도 다시 과잉그루밍이 확인될 경우에는 내복약 투약을 고려해볼 수 있습니다." },
  { title: "발바닥피부염", desc: "⏹ 부종 및 발적이 확인됩니다. 고양이 발바닥 피부염 (feline pododermaitis) 가능성이 가장 높다고 생각되며, 호산구성 육아종이나 다른 피부/면역계 질환 가능성도 배제되지 않습니다. 내복약 투약 반응에 따라 관리 해보시는 것을 추천드립니다." },
  { title: "발톱과각화증,궤양", desc: "⏹ 사지 발톱이 과도하게 길어져 있으며 과각화 및 변형이 확인되었고, 발바닥 패드의 각질 및 무통성 궤양성 병변이 확인되었습니다. Feline pododermatitis (발바닥피부염), Cutaneous horn(피각), pemphigus (천포창) 등 면역매개성 질환 가능성이 있으며, 감염(fungal infection 등)가능성도 배제되지 않은 상태입니다. 차후 진단을 위한 추가적인 검사를 고려해볼 수 있습니다. 발톱은 주기적으로 클리핑 해주세요" },
  { title: "마른눈꼽-만성URTD", desc: "⏹ 현재는 비강쪽은 큰 이상은 없으며, 양쪽 눈 내안각쪽에 마른 노란 눈꼽만 소량 관찰되었습니다. URTD (고양이 상부 호흡기 질환) 이 만성적으로 있을 가능성이 높으며, 코가 삼출물로 많이 막히거나, 결막염 증세, 재채기 등이 동반될 경우에는 증상완화를 위해 내복약을 고려해보실 수 있습니다. 평소 습도 관리, 네뷸라이저 관리 등을 해주시는 것도 좋습니다." },
  { title: "만성URTD-단두종", desc: "⏹ 눈물량증가/ 신체검사상 눈물량 증가가 확인되며, 해부학적인 구조, 눈물관 폐색 원인이 있을 것으로 생각됩니다. 다만 호흡기증상 (재채기, 콧물)등이 동반될 경우, 허피스 감염이 동반되어 있을 수 있어, 치료여부를 상담하시는 것을 추천드립니다." },
  { title: "검갈색정상귀지", desc: "⏹ 검갈색귀지/ 양측 이도내 검갈색 귀지가 있는 편입니다. 염증, 부종 등 외이염 소견은 확인되지 않아, 종종 자극되지 않을 정도로 닦아주시면 됩니다." }
];


const DENTAL_DESC = {
  status: {
    "양호": "- 전반적으로 구강내 상태 양호합니다.",
    "경미한염증": "- 관리가 필요한 경미한 치과 소견이 있습니다.",
    "심한염증/치료": "- 집중관리 및 치료를 요하는 치과 소견이 있습니다.",
    "발치필요": "- 심한 염증 혹은 발치가 필요한 치아가 있습니다.",
    "신체검사불가": "- 아이가 예민하여 면밀한 구강내 상태 관찰이 힘든 상태입니다. 구강내 통증호소, 침흘림 등 특이사항이 있으실 경우에는, 마취 후 육안 및 방사선 촬영 등을 추천드립니다."
  },
  gingivitis: {
    "None": "- 정상적인 잇몸상태입니다.",
    "none": "- 정상적인 잇몸상태입니다.",
    "Grade 1": "- 경미한 부종 및 색변화, 경계부위의 미약한 치은염(잇몸염증)이 확인됩니다.",
    "grade1": "- 경미한 부종 및 색변화, 경계부위의 미약한 치은염(잇몸염증)이 확인됩니다.",
    "Grade 2": "- 중등도의 부종 및 잇몸부위 염증이 확인됩니다. 출혈이 있을 수 있습니다.",
    "grade2": "- 중등도의 부종 및 잇몸부위 염증이 확인됩니다. 출혈이 있을 수 있습니다.",
    "Grade 3": "- 심한 잇몸 부종 및 염증소견이 확인됩니다. 쉽게 출혈이 생길 수 있습니다.",
    "grade3": "- 심한 잇몸 부종 및 염증소견이 확인됩니다. 쉽게 출혈이 생길 수 있습니다."
  },
  calculus: {
    "None": "- 치석이 없는 상태입니다.",
    "none": "- 치석이 없는 상태입니다.",
    "Grade 1": "- 얇은 치석이 치아 표면의 1/3 이내로 확인됩니다.",
    "grade1": "- 얇은 치석이 치아 표면의 1/3 이내로 확인됩니다.",
    "Grade 2": "- 치석이 표면의 1/3~2/3 이내로 쌓인 형태로 확인됩니다.",
    "grade2": "- 치석이 표면의 1/3~2/3 이내로 쌓인 형태로 확인됩니다.",
    "Grade 3": "- 다량의 치석이 표면의 2/3 이상으로 뒤덮힌 형태로 확인됩니다.",
    "grade3": "- 다량의 치석이 표면의 2/3 이상으로 뒤덮힌 형태로 확인됩니다."
  },
  fracture: {
    "없음": "- 부러진 치아가 없습니다.",
    "의심": "- 치아 끝이 약간 깨졌을 수 있으며, 정상일 가능성도 있습니다.",
    "확인/깨짐": "- 부러진 치아가 있습니다. 육안상 신경이 지나가지 않는 끝부분(Enamel)의 깨짐으로 보여 치료를 바로 진행해야할 상태는 아닌것으로 생각됩니다. 병변의 변화나 통증이 있는지 모니터링 추천드립니다.",
    "확인/신경노출": "- 부러진 치아가 있습니다. 육안상 치수(신경)가 노출된 것으로 의심되며, 치과방사선 촬영을 통한 뿌리 상태 체크가 추천됩니다. 결과에 따라 발치가 필요할 수 있습니다. 모니터링을 진행하실 경우에는 병변의 변화나 통증여부의 관찰이 필요합니다."
  },
  tr: {
    "의심 없음": "- 고양이 치아흡수성 병변(FORL)이 의심되는 치아는 없습니다.",
    "의심": "- 고양이 치아흡수성 병변(FORL)이 의심되는 치아가 있습니다.",
    "확인/완전흡수": "- 고양이 치아흡수성 병변(FORL)이 의심되는 치아가 있으나, end stage로서 흡수가 거의 끝난 상태로 생각됩니다. 치아방사선 촬영을 통해 정확한 진행 정도 및 다른 치아의 추가적인 이환여부를 확인할 수 있습니다. 일반적으로 통증을 유발할 수 있습니다. 증상이 있고 뿌리가 남아있을 경우, 혹은 다른 치아도 의심되는 경우 추가 검사 및 발치에 대하여 상담해보시는 것을 추천드립니다.",
    "확인/모니터링": "- 고양이 치아흡수성 병변(FORL)이 의심되는 치아가 있습니다. 치아방사선 촬영을 통해 정확한 진행 정도 및 다른 치아의 추가적인 이환여부를 확인할 수 있습니다. 일반적으로 통증을 유발할 수 있습니다. 증상이 있거나 추가 검사 및 발치에 대하여 상담해보시는 것을 추천드립니다.",
    "확인/치료": "- 고양이 치아흡수성 병변(FORL)이 확인됩니다. 치아방사선 촬영을 통해 정확한 진행 정도 및 다른 치아의 추가적인 이환여부를 확인할 수 있습니다. 현재 통증 및 염증을 유발할 수 있는 것으로 보여, 추가 검사 및 발치에 대하여 상담해보시는 것을 추천드립니다.",
    "확인/치료 필요": "- 고양이 치아흡수성 병변(FORL)이 확인됩니다. 치아방사선 촬영을 통해 정확한 진행 정도 및 다른 치아의 추가적인 이환여부를 확인할 수 있습니다. 현재 통증 및 염증을 유발할 수 있는 것으로 보여, 추가 검사 및 발치에 대하여 상담해보시는 것을 추천드립니다."
  },
  missing: {
    "없음": "- 빠지거나 발치한 치아가 없습니다.",
    "의심": "- 빠지거나 발치한 치아가 있을 수 있으나, 정확한 평가가 필요합니다.",
    "확인": "- 빠지거나 발치한 치아가 있습니다."
  },
  scaling: {
    "권장되지 않음": "- 현재는 스케일링은 필요없습니다.",
    "경미한 권장": "- 스케일링이 시급한 정도는 아니나 진행해주시면 좋은 상태입니다.",
    "경미한권장": "- 스케일링이 시급한 정도는 아니나 진행해주시면 좋은 상태입니다.",
    "강력한 권장": "- 스케일링이 추천됩니다.",
    "금일진행완료": "- 금일 스케일링으로 구강내 치석을 모두 제거한 상태입니다."
  }
};

function _pickDentalDesc(group, value){
  const table = (DENTAL_DESC[group] || {});
  if (value in table) return table[value];
  const v = (value || "").toLowerCase().replace(/\s+/g, "");
  for (const k of Object.keys(table)){
    if (k.toLowerCase().replace(/\s+/g, "") === v) return table[k];
  }
  return "";
}

function getTemplates(){ return loadLS(key.templates, {}); }
function getBCSText(bcs){ const t = getTemplates().BCS_TEXT || DEFAULT_BCS_TEXT; return t[bcs] || DEFAULT_BCS_TEXT[bcs]; }
function getDentalOpts(){ return getTemplates().dentalOpts || DEFAULT_DENTAL_OPTS; }

/*********************************
 * 1) 신체검사
 *********************************/
const defaultPhys = { bcs: 5, looks: {} };

function makePhysText(p){
  const NL = String.fromCharCode(10);
  const base = getBCSText(p.bcs);
  const chosen = (PHYS_LOOKS || [])
    .filter(x => (p.looks && p.looks[x.title]))
    .map(x => x.desc);
  if (!chosen.length) return base;
  return [base, "", "<육안검사>", ...chosen].join(NL);
}


function PhysicalExamCard(){
  const [phys, setPhys] = useState(loadLS(key.phys, defaultPhys));
  const text = useMemo(()=> makePhysText(phys), [phys]);

  useEffect(()=> { saveLS(key.phys, phys); emitChange(); }, [phys]);

  return (
    <Card title="① 신체검사" subtitle="BCS 및 신체검사 소견 입력 → 자동 문구" right={<CopyBtn text={text} />}>
      {/* 단일 필드: 슬라이더 + 설명 (전체 너비) */}
      <Field label={`BCS: ${phys.bcs}/9`}>
        <input
          type="range"
          min={1}
          max={9}
          value={phys.bcs}
          onChange={(e)=> setPhys({ ...phys, bcs: Number(e.target.value) })}
          className="w-full"
        />
        {/* 줄바꿈 유지해서 설명 표시 */}
        <div className="mt-2 text-sm text-slate-600 whitespace-pre-wrap">
          {getBCSText(phys.bcs)}
        </div>
      </Field>
{/* 육안검사: 작은 토글 버튼 리스트 */}
<div className="mt-4">
  <div className="mb-1 text-sm font-medium text-slate-700">육안검사 선택</div>
  <div className="flex flex-wrap gap-2">
    {PHYS_LOOKS.map((opt) => {
      const on = !!(phys.looks && phys.looks[opt.title]);
      return (
        <button
          key={opt.title}
          onClick={() => {
            const next = { ...(phys.looks || {}) };
            next[opt.title] = !on;
            setPhys({ ...phys, looks: next });
          }}
          className={
            "px-2 py-1 text-xs rounded-lg border active:scale-[.98] " +
            (on
              ? "bg-blue-600 text-white border-blue-600"
              : "bg-white text-slate-700 border-slate-300 hover:bg-slate-50")
          }
          title={opt.desc}
        >
          {opt.title}
        </button>
      );
    })}
  </div>
</div>

{/* 미리보기: BCS + 육안검사 합본 미리보기 */}
<div className="mt-3">
  <Field label="미리보기">
    <TextArea value={text} onChange={() => {}} rows={8} />
  </Field>
</div>

    </Card>
  );
}


/*********************************
 * 2) 치과 소견
 *********************************/
const defaultDental = {
  status: "양호",
  gingivitis: "none",
  calculus: "none",
  fracture: "없음",
  tr: "의심 없음",
  missing: "없음",
  scaling: "권장되지 않음",
  wrap: "평소 주기적인 치아관리 (양치) 및 구강 체크를 잘 해주시기 바랍니다.",
  note: "",
};
function makeDentalText(d){
  const lines = [];
  lines.push(_pickDentalDesc("status", d.status));
  lines.push(_pickDentalDesc("gingivitis", d.gingivitis));
  lines.push(_pickDentalDesc("calculus", d.calculus));
  lines.push(_pickDentalDesc("fracture", d.fracture));
  lines.push(_pickDentalDesc("tr", d.tr));
  lines.push(_pickDentalDesc("missing", d.missing));
  lines.push(_pickDentalDesc("scaling", d.scaling));
  if (d.wrap?.trim()) lines.push(d.wrap.trim());
  if (d.note?.trim()) lines.push(`- 추가 코멘트: ${d.note.trim()}`);
  return lines.filter(Boolean).join("\n");
}
function DentalFindingsCard(){
  const [d, setD] = useState(loadLS(key.dental, defaultDental));
  const text = useMemo(()=> makeDentalText(d), [d]);
  const [ver, setVer] = useState(0); // 템플릿 변경시 옵션 재렌더용
  useEffect(()=>{ const h=()=> setVer(v=>v+1); window.addEventListener('vetreport-change',h); return ()=> window.removeEventListener('vetreport-change',h); },[]);
  useEffect(()=> { saveLS(key.dental, d); emitChange(); }, [d]);

  const opts = getDentalOpts();

  return (
    <Card title="② 치과 소견" subtitle="항목 선택 → 통합 소견" right={<CopyBtn text={text} />}>
      <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
        <Field label="전체 상태 평가">
          <select className="w-full rounded-xl border border-slate-300 px-3 py-2" value={d.status} onChange={(e)=> setD({ ...d, status: e.target.value })}>
            {opts.status.map((s)=> <option key={s} value={s}>{s}</option>)}
          </select>
        </Field>
        <Field label="치은염 Grade">
          <select className="w-full rounded-xl border border-slate-300 px-3 py-2" value={d.gingivitis} onChange={(e)=> setD({ ...d, gingivitis: e.target.value })}>
            {opts.gingivitis.map((g)=> <option key={g} value={g}>{g}</option>)}
          </select>
        </Field>
        <Field label="치석 Grade">
          <select className="w-full rounded-xl border border-slate-300 px-3 py-2" value={d.calculus} onChange={(e)=> setD({ ...d, calculus: e.target.value })}>
            {opts.calculus.map((g)=> <option key={g} value={g}>{g}</option>)}
          </select>
        </Field>
        <Field label="골절 여부">
          <select className="w-full rounded-xl border border-slate-300 px-3 py-2" value={d.fracture} onChange={(e)=> setD({ ...d, fracture: e.target.value })}>
            {opts.fracture.map((g)=> <option key={g} value={g}>{g}</option>)}
          </select>
        </Field>
        <Field label="TR(치아흡수성 병변)">
          <select className="w-full rounded-xl border border-slate-300 px-3 py-2" value={d.tr} onChange={(e)=> setD({ ...d, tr: e.target.value })}>
            {opts.tr.map((g)=> <option key={g} value={g}>{g}</option>)}
          </select>
        </Field>
        <Field label="결손치">
          <select className="w-full rounded-xl border border-slate-300 px-3 py-2" value={d.missing} onChange={(e)=> setD({ ...d, missing: e.target.value })}>
            {opts.missing.map((g)=> <option key={g} value={g}>{g}</option>)}
          </select>
        </Field>
        <Field label="스케일링 권장">
          <select className="w-full rounded-xl border border-slate-300 px-3 py-2" value={d.scaling} onChange={(e)=> setD({ ...d, scaling: e.target.value })}>
            {opts.scaling.map((g)=> <option key={g} value={g}>{g}</option>)}
          </select>
        </Field>
        <Field label="마무리 소견">
          <input className="w-full rounded-xl border border-slate-300 px-3 py-2" value={d.wrap} onChange={(e)=> setD({ ...d, wrap: e.target.value })} />
        </Field>
      </div>
      <div className="mt-3">
        <Field label="추가 코멘트(끝부분에 추가됩니다.)"><TextArea value={d.note} onChange={(v)=> setD({ ...d, note: v })} rows={3} /></Field>
      </div>
      <div className="mt-3">
        <Field label="미리보기"><TextArea value={text} onChange={()=>{}} rows={6} /></Field>
      </div>
    </Card>
  );
}

/*********************************
 * 3) 종합 소견
 *********************************/
const defaultOverall = {
  picks: { physical: true, cbc: false, chem: false, ua: false, xr: false, us: false, disease: false },
  diseaseNote: "",
  addenda: "",
};
function makeOverallText(o, physText, customBlocks){
  const sel = o.picks || {};
  const lines = [];
  if (sel.physical) lines.push(`신체검사: ${physText.split("\n")[0]}`);
  if (sel.cbc) lines.push("혈액검사(CBC): 이상 소견 확인/추적 필요 여부를 종합하여 안내드립니다.");
  if (sel.chem) lines.push("혈액화학(Chem): 간/신장/전해질 등 주요 지표를 종합 평가했습니다.");
  if (sel.ua) lines.push("뇨검사(UA): 비중/침사/단백 등 소견 기반으로 해석했습니다.");
  if (sel.xr) lines.push("방사선: 흉복부 영상에서 구조적 이상 여부를 검토했습니다.");
  if (sel.us) lines.push("복부초음파: 장기별 에코 패턴과 크기 변화를 평가했습니다.");
  if (sel.disease && o.diseaseNote?.trim()) lines.push(`특정질환 특이소견: ${o.diseaseNote.trim()}`);
  if (customBlocks?.length){ customBlocks.forEach(b=>{ if(b.enabled) lines.push(`${b.title}: ${b.body}`); }); }
  const tail = o.addenda?.trim() ? `\n추가 안내: ${o.addenda.trim()}` : "";
  return lines.join("\n") + tail;
}
function OverallAssessmentCard(){
  const [phys] = useState(loadLS(key.phys, defaultPhys));
  const physText = useMemo(()=> makePhysText(phys), [phys]);
  const [o, setO] = useState(loadLS(key.overall, defaultOverall));
  const [custom] = useState(loadLS(key.custom, []));
  const preview = useMemo(()=> makeOverallText(o, physText, custom), [o, physText, custom]);
  useEffect(()=> { saveLS(key.overall, o); emitChange(); }, [o]);

  return (
    <Card title="③ 종합 소견" subtitle="여러 검사 선택 → 일괄 소견" right={<CopyBtn text={preview} />}>
      <div className="grid grid-cols-2 md:grid-cols-3 gap-2">
        {Object.entries(o.picks).map(([k,v])=> (
          <label key={k} className="flex items-center gap-2 px-3 py-2 rounded-xl border border-slate-300 bg-white hover:bg-slate-50">
            <input type="checkbox" checked={v} onChange={()=> setO({ ...o, picks: { ...o.picks, [k]: !v } })} />
            <span className="text-sm">{({
              physical: "신체검사", cbc: "혈액검사(CBC)", chem: "혈액화학(Chem)", ua: "뇨검사(UA)", xr: "방사선", us: "복부초음파", disease: "특정질환 특이소견"
            })[k]}</span>
          </label>
        ))}
      </div>
      <div className="mt-3 grid grid-cols-1 md:grid-cols-2 gap-3">
        <Field label="특정질환 특이소견 (선택)"><TextArea value={o.diseaseNote} onChange={(v)=> setO({ ...o, diseaseNote: v })} rows={6} placeholder="예: HCM 의심 소견..." /></Field>
        <Field label="추가 안내 문구 (선택)"><TextArea value={o.addenda} onChange={(v)=> setO({ ...o, addenda: v })} rows={6} placeholder="식이/운동/재검 권장 등" /></Field>
      </div>
      <div className="mt-3"><Field label="미리보기"><TextArea value={preview} onChange={()=>{}} rows={8} /></Field></div>
    </Card>
  );
}

/*********************************
 * 4) 사용자 정의 소견(스니펫)
 *********************************/
function CustomSnippetManager() {
  const [snips, setSnips] = useState(loadLS(key.custom, []));
  const [draft, setDraft] = useState({ title: "", body: "" });
  const [bulkOpen, setBulkOpen] = useState(false);
  const [bulkText, setBulkText] = useState("");
  useEffect(()=> saveLS(key.custom, snips), [snips]);
  useEffect(()=> emitChange(), [snips]);
  function add(){ if(!draft.title.trim()||!draft.body.trim()) return; setSnips([{ id: crypto.randomUUID(), title: draft.title.trim(), body: draft.body.trim(), enabled: true }, ...snips]); setDraft({ title: "", body: "" }); }
  function del(id){ setSnips(snips.filter(s=> s.id!==id)); }
  function toggle(id){ setSnips(snips.map(s=> s.id===id ? { ...s, enabled: !s.enabled } : s)); }
  function exportSnips(){ downloadJSON("snippets.json", snips); }
  function importSnips(e){ const file=e.target.files?.[0]; if(!file) return; const reader=new FileReader(); reader.onload=()=>{ try{ const arr=JSON.parse(reader.result); if(Array.isArray(arr)) setSnips(arr); }catch{} }; reader.readAsText(file); e.target.value=""; }
  function doBulkAdd(){ const lines=bulkText.split(/\n+/).map(l=>l.trim()).filter(Boolean); const items=lines.map(l=>{ const [title,...rest]=l.split("|"); return { id: crypto.randomUUID(), title:(title||"").trim(), body: rest.join("|").trim(), enabled:true }; }).filter(x=>x.title&&x.body); if(items.length) setSnips([...items, ...snips]); setBulkText(""); setBulkOpen(false); }
  return (
    <Card title="④ 사용자 정의 소견" subtitle="자주 쓰는 문구 저장/내보내기/불러오기/대량추가" right={<CopyBtn text={snips.filter(s=>s.enabled).map(s=>`${s.title}: ${s.body}`).join("\n")} label="선택문구 복사" /> }>
      <div className="flex gap-2 mb-3">
        <button onClick={exportSnips} className="rounded-xl border border-slate-300 px-3 py-2 text-sm">내보내기</button>
        <label className="rounded-xl border border-slate-300 px-3 py-2 text-sm cursor-pointer">불러오기<input type="file" accept="application/json" className="hidden" onChange={importSnips} /></label>
        <button onClick={()=> setBulkOpen(!bulkOpen)} className="rounded-xl border border-slate-300 px-3 py-2 text-sm">대량추가</button>
      </div>
      {bulkOpen && (
        <div className="mb-3 p-3 border border-dashed rounded-xl">
          <div className="text-xs text-slate-500 mb-2">한 줄에 <b>제목|내용</b> 형식으로 붙여넣기</div>
          <TextArea value={bulkText} onChange={setBulkText} rows={5} />
          <div className="flex gap-2 mt-2">
            <button onClick={doBulkAdd} className="rounded-xl bg-blue-600 text-white px-3 py-2">반영</button>
            <button onClick={()=>{setBulkText(""); setBulkOpen(false);}} className="rounded-xl border px-3 py-2">취소</button>
          </div>
        </div>
      )}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-3">
        <Field label="제목"><input value={draft.title} onChange={(e)=> setDraft({ ...draft, title: e.target.value })} className="w-full rounded-xl border px-3 py-2" placeholder="예: 만성 신질환 교육" /></Field>
        <Field label="내용"><TextArea value={draft.body} onChange={(v)=> setDraft({ ...draft, body: v })} rows={4} placeholder="소견 본문" /></Field>
        <div className="flex items-end"><button onClick={add} className="w-full rounded-xl bg-blue-600 text-white px-4 py-2">추가</button></div>
      </div>
      <div className="mt-4 space-y-2">
        {snips.length===0 ? <div className="text-sm text-slate-500">저장된 스니펫 없음</div> : snips.map((s)=> (
          <div key={s.id} className="flex items-start gap-3 p-3 rounded-xl border">
            <input type="checkbox" className="mt-1" checked={s.enabled} onChange={()=> toggle(s.id)} />
            <div className="flex-1">
              <div className="text-sm font-semibold">{s.title}</div>
              <div className="text-sm whitespace-pre-wrap">{s.body}</div>
            </div>
            <button onClick={()=> del(s.id)} className="text-xs text-red-600">삭제</button>
          </div>
        ))}
      </div>
    </Card>
  );
}

/*********************************
 * 템플릿 편집 (BCS & 치과)
 *********************************/
function TemplateEditor(){
  const [tpl, setTpl] = useState(loadLS(key.templates, { BCS_TEXT: DEFAULT_BCS_TEXT, dentalOpts: DEFAULT_DENTAL_OPTS }));
  useEffect(()=> { saveLS(key.templates, tpl); emitChange(); }, [tpl]);
  function setBCS(i,v){ setTpl({ ...tpl, BCS_TEXT: { ...(tpl.BCS_TEXT||{}), [i]: v } }); }
  function setDental(field, v){ setTpl({ ...tpl, dentalOpts: { ...(tpl.dentalOpts||DEFAULT_DENTAL_OPTS), [field]: v.split(/\s*,\s*/).filter(Boolean) } }); }
  return (
    <Card title="템플릿 편집" subtitle="BCS 문구 & 치과 선택지 커스터마이즈">
      <div className="space-y-4">
        <div>
          <div className="text-sm font-semibold mb-2">BCS 안내 문구 (1~9)</div>
          <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
            {Array.from({length:9}).map((_,i)=>{
              const idx = i+1; const val = (tpl.BCS_TEXT||DEFAULT_BCS_TEXT)[idx];
              return (
                <Field key={idx} label={`BCS ${idx}/9`}>
                  <TextArea value={val} onChange={(v)=> setBCS(idx, v)} rows={2} />
                </Field>
              );
            })}
          </div>
        </div>
        <div>
          <div className="text-sm font-semibold mb-2">치과 선택지 (콤마로 구분)</div>
          <Row>
            {Object.keys(DEFAULT_DENTAL_OPTS).map((field)=> (
              <Field key={field} label={field}>
                <input className="w-full rounded-xl border px-3 py-2" value={(tpl.dentalOpts?.[field] || DEFAULT_DENTAL_OPTS[field]).join(", ")} onChange={(e)=> setDental(field, e.target.value)} />
              </Field>
            ))}
          </Row>
        </div>
      </div>
    </Card>
  );
}

/*********************************
 * 백업/복원
 *********************************/
function DataBackupPanel(){
  const data = {
    [key.phys]: loadLS(key.phys, {}),
    [key.dental]: loadLS(key.dental, {}),
    [key.overall]: loadLS(key.overall, {}),
    [key.custom]: loadLS(key.custom, []),
    [key.templates]: loadLS(key.templates, { BCS_TEXT: DEFAULT_BCS_TEXT, dentalOpts: DEFAULT_DENTAL_OPTS }),
    [key.output]: loadLS(key.output, ""),
    [key.dentalOpts]: loadLS(key.dentalOpts, DEFAULT_DENTAL_OPTS), // 과거 호환
  };
  function exportAll(){ downloadJSON("vetreport-backup.json", data); }
  function importAll(e){
    const file = e.target.files?.[0]; if(!file) return;
    const reader = new FileReader();
    reader.onload = () => {
      try {
        const obj = JSON.parse(reader.result);
        Object.entries(obj).forEach(([k,v])=> saveLS(k, v));
        location.reload();
      } catch{}
    };
    reader.readAsText(file);
    e.target.value="";
  }
  return (
    <Card title="백업/복원" subtitle="모든 데이터 한 번에 저장/불러오기">
      <div className="flex gap-2">
        <button onClick={exportAll} className="rounded-xl border px-3 py-2 text-sm">전체 내보내기</button>
        <label className="rounded-xl border px-3 py-2 text-sm cursor-pointer">전체 불러오기
          <input type="file" accept="application/json" className="hidden" onChange={importAll} />
        </label>
      </div>
      <div className="text-xs text-slate-500 mt-2">* JSON 한 파일로 떨어집니다. 다른 PC로 옮기거나 초기화 후 복원에 사용.</div>
    </Card>
  );
}

/*********************************
 * 우측 패널: 출력 & 폴리셔
 *********************************/
function OutputPanel(){
  const compute = () => {
    const phys = loadLS(key.phys, defaultPhys);
    const dental = loadLS(key.dental, defaultDental);
    const overall = loadLS(key.overall, defaultOverall);
    const snips = loadLS(key.custom, []);
    const physText = makePhysText(phys);
    const dentalText = makeDentalText(dental);
    const overallText = makeOverallText(overall, physText, snips);
    return `【신체검사】\n${physText}\n\n【치과 소견】\n${dentalText}\n\n【종합 소견】\n${overallText}`;
  };
  const [txt, setTxt] = useState(compute());
  useEffect(()=>{ const h=()=> setTxt(compute()); window.addEventListener('vetreport-change',h); return ()=> window.removeEventListener('vetreport-change',h); },[]);
  useEffect(()=> saveLS(key.output, txt), [txt]);
  return (
    <Card title="최종 건강검진 소견 " subtitle="전체 섹션 문구 취합" right={<CopyBtn text={txt} />}>
      <TextArea value={txt} onChange={setTxt} rows={20} />
      <div className="mt-2 text-xs text-slate-500">Tip: 섹션을 수정하면 이 영역이 자동 갱신됩니다. (이 창에서 수동 수정도 가능).</div>
    </Card>
  );
}
function PolisherPanel(){
  const [input, setInput] = useState("");
  const [out, setOut] = useState("");
  function tidy(text){ return text.replace(/\s+\./g, ".").replace(/\s{2,}/g, " ").replace(/\n{3,}/g, "\n\n").trim(); }
  return (
    <Card title="GPT 연결(준비중) · 문장 다듬기" subtitle="간단한 공백/줄바꿈 정리">
      <Field label="원문"><TextArea value={input} onChange={setInput} rows={6} placeholder="자유 입력" /></Field>
      <div className="mt-2 flex items-center gap-2">
        <button onClick={()=> setOut(tidy(input))} className="rounded-xl bg-slate-900 text-white px-4 py-2">문장 다듬기</button>
        <CopyBtn text={out} />
      </div>
      <div className="mt-2"><Field label="결과"><TextArea value={out} onChange={setOut} rows={8} /></Field></div>
    </Card>
  );
}

/*********************************
 * 도움말 패널
 *********************************/
function AboutPanel(){
  return (
    <Card title="도움말" subtitle="설계 목표 & 다음 단계">
      <ul className="list-disc pl-5 space-y-1 text-sm text-slate-700">
        <li>모든 출력에는 <b>복사</b> 버튼이 있어 차트에 바로 붙여넣기 가능</li>
        <li>데이터는 브라우저 <b>localStorage</b>에 저장되어 재방문 시 유지</li>
        <li>스니펫을 내보내기/불러오기/대량추가로 관리 (한 줄: 제목|내용)</li>
        <li>템플릿 편집기로 BCS 문구·치과 선택지를 화면에서 바로 수정</li>
        <li>백업/복원: 모든 데이터를 JSON 한 파일로 저장/복구</li>
      </ul>
      <div className="mt-3 text-sm text-slate-500">
        <b>다음 단계 제안</b>
        <ol className="list-decimal pl-5 mt-1 space-y-1">
          <li>복합소견 룰(조건부) 빌더 — 예: BCS≥7 & 치석 G3↑ → 자동 권고</li>
          <li>혈액/뇨/영상 결과 템플릿 라이브러리 추가 (현재 매크로 이식)</li>
          <li>OpenAI API 연결 — 톤/길이 옵션으로 자동 리라이팅</li>
          <li>PWA 패키징 — 오프라인 사용 & 바탕화면 설치</li>
        </ol>
      </div>
    </Card>
  );
}
