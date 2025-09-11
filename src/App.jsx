// src/App.jsx (with Google Login Gate)
import React, { useEffect, useMemo, useState } from "react";
import templates from "./data/templates.json";
import { listenAuth, loginWithGoogle, logout } from "./lib/firebase";

/**
 * App.jsx — UI Polish v5.1 (+ Google Login Gate)
 * - 로그인 전: 헤더만 보이고 본문 영역은 로그인 카드 표시
 * - 로그인 후: 기존 본문 그대로 표시, 헤더 우측에 이메일/로그아웃
 * - 나머지 UI/로직은 기존과 동일
 */

// ===== Brand color (탭/주요 버튼) =====
const BRAND = { bg: "#0F5E9C", border: "#0F5E9C", text: "#ffffff" };
// ===== Selected chip style (부드러운 노랑톤) =====
const CHIP_ON_STYLE = { backgroundColor: "#FEF3C7", borderColor: "#FACC15", color: "#111827" }; // amber-100/400

export default function App() {
  // 🔐 로그인 상태
  const [user, setUser] = useState(null);
  const [ready, setReady] = useState(false);
  useEffect(() => {
    const off = listenAuth(u => { setUser(u); setReady(true); });
    return () => off();
  }, []);

  const [tab, setTab] = useState(() => {
    try { return localStorage.getItem("ui_tab") || "physical"; } catch { return "physical"; }
  });
  useEffect(()=> { try { localStorage.setItem("ui_tab", tab); } catch {} }, [tab]);

  if (!ready) return null; // 초기 깜빡임 방지

  return (
    <div className="min-h-screen bg-slate-50 text-slate-900 antialiased">
      <Header tab={tab} onTab={setTab} user={user} onLogout={logout} />

      {user ? (
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
      ) : (
        <div className="mx-auto max-w-6xl px-4 md:px-6 lg:px-8 py-12">
          <div className="grid place-items-center">
            <div className="rounded-2xl border border-slate-200 bg-white p-8 w-[92%] max-w-md text-center shadow-sm">
              <p className="text-base text-slate-700">Google 로그인 후 이용 가능합니다.</p>
              <button
                onClick={loginWithGoogle}
                className="mt-6 rounded-xl px-4 py-2 bg-slate-900 text-white hover:bg-slate-800"
              >
                Google로 로그인
              </button>
            </div>
          </div>
        </div>
      )}

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
};

function saveLS(k, v) { try { localStorage.setItem(k, JSON.stringify(v)); } catch {} }
function loadLS(k, fallback) {
  try { const v = localStorage.getItem(k); return v ? JSON.parse(v) : fallback; } catch { return fallback; }
}
function emitChange(){ try { window.dispatchEvent(new Event('vetreport-change')); } catch {} }
function clampBlanks(s){
  return (s || "").replace(/\r\n/g, "\n").replace(/\n{3,}/g, "\n\n").replace(/[ \t]+\n/g, "\n").trim();
}

function Card({ title, subtitle, children, right }) {
  return (
    <section className="bg-white rounded-2xl shadow-sm border border-slate-200">
      <div className="flex items-start justify-between gap-3 px-5 py-4 border-b border-slate-100">
        <div>
          <h2 className="text-lg font-semibold text-slate-950">{title}</h2>
          {subtitle ? <p className="text-sm text-slate-900 mt-0.5">{subtitle}</p> : null}
        </div>
        <div className="flex-shrink-0">{right}</div>
      </div>
      <div className="p-5">{children}</div>
    </section>
  );
}
function Field({ label, children, hint }) {
  return (
    <label className="block">
      <div className="mb-1 text-sm font-semibold text-slate-950">{label}</div>
      {children}
      {hint ? <div className="mt-1 text-xs text-slate-900">{hint}</div> : null}
    </label>
  );
}
function TextArea({ value, onChange, rows = 5, placeholder }) {
  return (
    <textarea
      className="w-full rounded-xl border border-slate-300 px-3 py-2 focus:outline-none focus:ring-2 focus:ring-blue-500/40 focus:border-blue-500 resize-y text-slate-950"
      rows={rows}
      value={value}
      onChange={(e)=> onChange(e.target.value)}
      placeholder={placeholder}
    />
  );
}
function CopyBtn({ text, label = "복사", className = "" }) {
  return (
    <button
      onClick={async ()=>{ try { await navigator.clipboard.writeText(text || ""); } catch {} }}
      className={"inline-flex items-center justify-center h-9 px-3 rounded-xl border border-slate-300 text-sm text-slate-950 hover:bg-slate-50 active:scale-[.99] " + className}
    >
      {label}
    </button>
  );
}

/*********************************
 * Header / Footer
 *********************************/
function Header({ tab, onTab, user, onLogout }) {
  return (
    <header className="sticky top-0 z-10 backdrop-blur bg-slate-50/85 border-b border-slate-200">
      <div className="mx-auto max-w-6xl px-4 md:px-6 lg:px-8 py-3.5">
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-3.5">
            <img
              src="/baeksan-logo.png"
              alt="FORCAT"
              className="w-20 h-20 rounded-lg bg-white object-contain p-1 shadow-sm"
            />
            <div>
              <div className="text-2xl md:text-3xl font-bold tracking-tight text-slate-950">
                FORCAT 건강검진 결과서 Editor v.1.0
              </div>
              <div className="text-sm text-slate-900">
                백산동물병원 · 내부용
              </div>
            </div>
          </div>

          <div className="flex items-center gap-3">

            <a
  href="#"
  onClick={(e) => {
    e.preventDefault();
    // ✅ 우리 앱 데이터만 정리 (Firebase auth 키는 건드리지 않음)
    const APP_KEYS = [
      "vetreport_phys",
      "vetreport_dental",
      "vetreport_overall",
      "vetreport_output",
      // 필요시 "ui_tab" 추가 가능
    ];
    try {
      APP_KEYS.forEach(k => localStorage.removeItem(k));
    } catch {}

    // UI 갱신
    try { window.dispatchEvent(new Event("vetreport-change")); } catch {}
    location.reload();
  }}
  className="text-xs font-bold text-slate-900 hover:text-slate-950"
  title="모든 데이터(로컬저장) 초기화"
>
  초기화
</a>

            

            {user ? (
              <div className="flex items-center gap-2">
                <span className="text-xs text-slate-600">{user.email}</span>
                <button
                  onClick={onLogout}
                  className="h-7 px-3 rounded-lg border border-slate-300 text-xs text-slate-950 hover:bg-slate-50"
                >
                  로그아웃
                </button>
              </div>
            ) : null}
          </div>
        </div>

        {/* 섹션 탭: 로그인 후에만 */}
        {user ? (
          <div className="mt-3 flex items-center gap-2">
            <SegTab label="신체검사" active={tab==="physical"} onClick={()=> onTab("physical")} />
            <SegTab label="치과검사" active={tab==="dental"} onClick={()=> onTab("dental")} />
            <SegTab label="종합소견" active={tab==="overall"} onClick={()=> onTab("overall")} />
          </div>
        ) : null}
      </div>
    </header>
  );
}
function SegTab({ label, active, onClick }){
  return (
    <button
      onClick={onClick}
      className={
        "px-3.5 py-2 rounded-lg border text-sm md:text-base font-semibold transition " +
        (active
          ? "text-white shadow-sm"
          : "bg-white text-slate-950 border-slate-300 hover:bg-slate-50")
      }
      style={active ? { backgroundColor: BRAND.bg, borderColor: BRAND.border } : {}}
    >
      {label}
    </button>
  );
}
function Footer(){
  return (
    <footer className="py-6 text-center text-xs text-slate-900">
      <div className="mx-auto max-w-6xl px-4">
        © {new Date().getFullYear()} Vet Report Tools · 로컬에서 동작(데이터: localStorage)
      </div>
    </footer>
  );
}

/*********************************
 * BCS & Dental 기본값 + 헬퍼
 *********************************/
const DEFAULT_BCS_TEXT = {
  1: `■ 심한 저체중 (BCS 1/9): 털이 짧으면 늑골(갈비뼈)이 육안상 명확히 확인될 정도이며, 만져지는 피하지방이 없습니다. 척추뼈와 대퇴골 부분이 도드라집니다.
- 많이 야윈 상태입니다. 근육과 지방의 적절한 증량이 시급합니다.`,
  2: `■ 저체중 (BCS 2/9): 털이 짧으면 육안상 늑골(갈비뼈)이 확인될 정도이며, 척추뼈가 도드라집니다. 만져지는 지방이 거의 없습니다.
- 야윈 상태입니다. 근육과 지방의 적절한 증량이 추천됩니다.`,
  3: `■ 마른 편 (BCS 3/9): 지방량이 적어 늑골(갈비뼈)이 쉽게 만져지며, 허리뼈가 육안상·촉진상 명확하게 도드라지고 복부에도 최소한의 지방만 존재합니다.
- 적절한 증량이 추천됩니다.`,
  4: `■ 약간 마른 편 (BCS 4/9): 늑골(갈비뼈)이 적은 지방으로 덮여 있으며, 늑골 뒤쪽으로 허리 부위가 도드라지고 복부의 fat pad(아랫배 지방)가 적은 상태입니다.
- 다소 마른 편이나 정상입니다. 주기적인 체중 체크를 해주세요.`,
  5: `■ 이상적 체형 (BCS 5/9): 적절한 체형입니다. 적정량의 지방이 덮인 늑골(갈비뼈)이 만져지며, 뒤편으로 허리가 관찰됩니다. 최소의 fat pad(하복부 지방)가 확인됩니다.
- 주기적인 체중 체크를 해주세요.`,
  6: `■ 과체중 경향 (BCS 6/9): 적정량보다 약간 많은 지방이 늑골(갈비뼈)을 덮고 있고, 허리와 하복부 지방도 있는 편이나 심하지는 않습니다.
- 주기적인 체중 측정을 해주시고, 체중이 더 늘지 않도록 해주세요.`,
  7: `■ 과체중 (BCS 7/9): 많은 지방 때문에 늑골(갈비뼈)이 쉽게 만져지지 않습니다. 허리가 쉽게 구분되지 않습니다. 육안상 복부가 둥글게 관찰되며, 중등량의 하복부 지방이 확인됩니다.
- 주기적인 체중 측정을 해주세요. 우선은 현 체중의 10 %의 체중감량을 추천드립니다. 감량속도는 1주에 1% 이내가 권장됩니다.`,
  8: `■ 비만 (BCS 8/9): 두터운 지방으로 인해 늑골(갈비뼈)이 잘 만져지지 않습니다. 허리가 구분되지 않으며, 복부가 전체적으로 둥글고 하복부 지방(fat pad)이 과다합니다.
- 비만으로 인한 활동성 감소가 있을 수 있으며, 주기적인 체중 측정과 체중조절이 필요합니다. 우선은 현 체중의  15%의 체중감량을 추천드립니다. 너무 급격한 체중감량은 지방간의 위험성이 있으니, 식이 조절 및 먹이퍼즐, 운동등을 통해 제한된 속도(1주에 1% 이내)의 감량을 추천드립니다.`,
  9: `■ 중증 비만 (BCS 9/9): 두꺼운 지방층으로 늑골(갈비뼈)이 촉진되지 않습니다. 과다한 지방이 허리, 얼굴, 사지에 있습니다.
- 골관절염, 당뇨 등 관련한 질환 발생 위험성이 있으며, 주기적인 체중 측정과 체중조절이 시급합니다. 우선은 현 체중의 20%의 체중감량을 추천드립니다. 너무 급격한 체중감량은 지방간의 위험성이 있으니, 식이 조절 및 먹이퍼즐, 운동등을 통해 제한된 속도(1주에 1% 이내)의 감량을 추천드립니다. `,
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
function getBCSText(bcs){ return DEFAULT_BCS_TEXT[bcs] || DEFAULT_BCS_TEXT[5]; }
function getDentalOpts(){ return DEFAULT_DENTAL_OPTS; }

/*********************************
 * 1) 신체검사
 *********************************/
const defaultPhys = { bcs: 5, looks: {} };
const PHYS_LOOKS = templates.physical.looks.map(r => ({ title: r.title, desc: r.text }));

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
  const [hover, setHover] = useState(""); // 호버 프리뷰
  const text = useMemo(()=> makePhysText(phys), [phys]);

  // ⬇️ 추가: 아직 어떤 육안검사도 선택 안 되어 있으면 '정상'을 기본 체크(1회)
  useEffect(() => {
    const hasAny = phys?.looks && Object.values(phys.looks).some(Boolean);
    const hasNormalTag = PHYS_LOOKS.some(p => p.title === "정상");
    if (!hasAny && hasNormalTag) {
      setPhys(prev => ({
        ...prev,
        looks: { ...(prev.looks || {}), "정상": true },
      }));
    }
    // mount 시 한 번만 실행
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  // 변경사항 저장 + 우측 패널 갱신 이벤트
  useEffect(()=> { saveLS(key.phys, phys); emitChange(); }, [phys]);

  return (
    <Card title="① 신체검사" subtitle="BCS 및 신체검사 소견 입력 → 자동 문구" right={<CopyBtn text={text} />}>
      <Field label={`BCS: ${phys.bcs}/9`}>
        <input
          type="range"
          min={1}
          max={9}
          value={phys.bcs}
          onChange={(e)=> setPhys({ ...phys, bcs: Number(e.target.value) })}
          className="w-full"
        />
        <div className="mt-2 text-sm text-slate-950 whitespace-pre-wrap">
          {getBCSText(phys.bcs)}
        </div>
      </Field>

      <div className="mt-4">
        <div className="mb-1 text-sm text-slate-950 font-semibold">육안검사 선택</div>
        <div className="flex flex-wrap gap-2">
          {PHYS_LOOKS.map((opt) => {
            const on = !!(phys.looks && phys.looks[opt.title]);
            return (
              <button
                key={opt.title}
                onMouseEnter={()=> setHover(opt.desc)}
                onMouseLeave={()=> setHover("")}
                onClick={() => {
                  const next = { ...(phys.looks || {}) };
                  next[opt.title] = !on;
                  setPhys({ ...phys, looks: next });
                }}
                className={"px-2 py-1 text-xs rounded-lg border active:scale-[.98] " + (on ? "" : "bg-white text-slate-950 border-slate-300 hover:bg-slate-50")}
                style={on ? CHIP_ON_STYLE : {}}
                title={opt.desc}
              >
                {opt.title}
              </button>
            );
          })}
        </div>
        {/* 호버 프리뷰 */}
        {hover && (
          <div
            className="mt-3 rounded-xl border text-sm p-3 whitespace-pre-wrap"
            style={{ backgroundColor: "#EFF6FF", borderColor: "#BFDBFE", color: "#0B3C7A" }}
          >
            {hover}
          </div>
        )}
      </div>

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
  return clampBlanks(lines.filter(Boolean).join("\n"));
}
const defaultDental = {
  status: "양호",
  gingivitis: "none",
  calculus: "none",
  fracture: "없음",
  tr: "의심 없음",
  missing: "없음",
  scaling: "권장되지 않음",
  wrap: "- 평소 주기적인 치아관리 (양치) 및 구강 체크를 잘 해주시기 바랍니다.",
  note: "",
};
function DentalFindingsCard(){
  const [d, setD] = useState(loadLS(key.dental, defaultDental));
  const text = useMemo(()=> makeDentalText(d), [d]);
  useEffect(()=> { saveLS(key.dental, d); emitChange(); }, [d]);
  const opts = getDentalOpts();

  return (
    <Card title="② 치과 소견" subtitle="항목 선택 → 통합 소견" right={<CopyBtn text={text} />}>
      <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
        <Field label="전체 상태 평가">
          <select className="w-full rounded-xl border border-slate-300 px-3 py-2 text-slate-950" value={d.status} onChange={(e)=> setD({ ...d, status: e.target.value })}>
            {opts.status.map((s)=> <option key={s} value={s}>{s}</option>)}
          </select>
        </Field>
        <Field label="치은염 Grade">
          <select className="w-full rounded-xl border border-slate-300 px-3 py-2 text-slate-950" value={d.gingivitis} onChange={(e)=> setD({ ...d, gingivitis: e.target.value })}>
            {opts.gingivitis.map((g)=> <option key={g} value={g}>{g}</option>)}
          </select>
        </Field>
        <Field label="치석 Grade">
          <select className="w-full rounded-xl border border-slate-300 px-3 py-2 text-slate-950" value={d.calculus} onChange={(e)=> setD({ ...d, calculus: e.target.value })}>
            {opts.calculus.map((g)=> <option key={g} value={g}>{g}</option>)}
          </select>
        </Field>
        <Field label="파절 여부">
          <select className="w-full rounded-xl border border-slate-300 px-3 py-2 text-slate-950" value={d.fracture} onChange={(e)=> setD({ ...d, fracture: e.target.value })}>
            {opts.fracture.map((g)=> <option key={g} value={g}>{g}</option>)}
          </select>
        </Field>
        <Field label="TR(치아흡수성 병변)">
          <select className="w-full rounded-xl border border-slate-300 px-3 py-2 text-slate-950" value={d.tr} onChange={(e)=> setD({ ...d, tr: e.target.value })}>
            {opts.tr.map((g)=> <option key={g} value={g}>{g}</option>)}
          </select>
        </Field>
        <Field label="결손치">
          <select className="w-full rounded-xl border border-slate-300 px-3 py-2 text-slate-950" value={d.missing} onChange={(e)=> setD({ ...d, missing: e.target.value })}>
            {opts.missing.map((g)=> <option key={g} value={g}>{g}</option>)}
          </select>
        </Field>
        <Field label="스케일링 권장">
          <select className="w-full rounded-xl border border-slate-300 px-3 py-2 text-slate-950" value={d.scaling} onChange={(e)=> setD({ ...d, scaling: e.target.value })}>
            {opts.scaling.map((g)=> <option key={g} value={g}>{g}</option>)}
          </select>
        </Field>
        <Field label="마무리 소견">
          <input className="w-full rounded-xl border border-slate-300 px-3 py-2 text-slate-950" value={d.wrap} onChange={(e)=> setD({ ...d, wrap: e.target.value })} />
        </Field>
      </div>
      <div className="mt-3">
        <Field label="추가 코멘트(끝부분에 추가됩니다.)"><TextArea value={d.note} onChange={(v)=> setD({ ...d, note: v })} rows={3} /></Field>
      </div>
      <div className="mt-3">
        <Field label="미리보기"><TextArea value={text} onChange={()=>{}} rows={10} /></Field>
      </div>
    </Card>
  );
}

/*********************************
 * 3) 종합 소견 — 태그 팔레트
 *********************************/

const OVERALL_TAGS = templates.overall;
const TAGS = OVERALL_TAGS.map((r, idx) => ({ ...r, _id: idx }));

const CHIP = {
  off: "bg-white text-slate-950 border-slate-300 hover:bg-slate-50",
  on:  "", // style로 적용
};

const defaultOverall = {
  // CBC + Chem => blood로 통합
  picks: { physical: true, blood: false, ua: false, xr: false, us: false, disease: false },
  addenda: "",
  tagSel: {}, // { [id]: true }
};

function makeOverallText(o){
  const lines = [];
  const picked = Object.keys(o.tagSel || {}).filter(id => o.tagSel[id]);
  if (picked.length){
    for (const t of TAGS){
      if (picked.includes(String(t._id))){
        const txt = (t.text || "").trim();
        if (txt) lines.push(`■ ${txt}`);
      }
    }
  }
  if (o.addenda?.trim()) lines.push(`추가 안내: ${o.addenda.trim()}`);
  return clampBlanks(lines.join("\n"));
}

function OverallAssessmentCard(){
  const [o, setO] = useState(loadLS(key.overall, defaultOverall));
  const [q, setQ] = useState("");        // 검색어
  const [hover, setHover] = useState(""); // 호버 프리뷰 텍스트
  const preview = useMemo(()=> makeOverallText(o), [o]);
  useEffect(()=> { saveLS(key.overall, o); emitChange(); }, [o]);

  // 저장값 호환 (cbc/chem → blood)
  useEffect(()=>{
    setO(prev => {
      const p = { ...(prev.picks || {}) };
      let changed = false;
      if ((p.cbc || p.chem) && !p.blood) { p.blood = true; changed = true; }
      if ('cbc' in p) { delete p.cbc; changed = true; }
      if ('chem' in p) { delete p.chem; changed = true; }
      // 누락키 보정
      ["physical","blood","ua","xr","us","disease"].forEach(k=>{ if (p[k]===undefined) { p[k]=false; changed=true; }});
      return changed ? { ...prev, picks: p } : prev;
    });
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  const labelMap = {
    physical: "일반결과",
    blood: "혈액검사(BA)",
    ua: "소변검사(UA)",
    xr: "방사선(X-ray)",
    us: "초음파(Us)",
    disease: "특정질환",
  };

  function togglePick(k){ setO(prev => ({ ...prev, picks: { ...prev.picks, [k]: !prev.picks[k] }})); }
  function toggleTag(id){ setO(prev => ({ ...prev, tagSel: { ...prev.tagSel, [id]: !prev.tagSel?.[id] }})); }
  function removeTag(id){ setO(prev => { const t={...prev.tagSel}; delete t[id]; return { ...prev, tagSel:t }; }); }

  // 활성 대분류 집합
  const activeCats = useMemo(()=>{
    const s = new Set(); Object.entries(o.picks||{}).forEach(([k,v])=> { if (v) {
      const cat = ({ physical:"신체검사", blood:"혈액검사", ua:"소변검사", xr:"방사선", us:"복부초음파", disease:"특정질환" })[k];
      if (cat) s.add(cat);
    }});
    return s;
  }, [o.picks]);

  // 태그풀 → 검색필터 → 그룹핑(sub)
  const tagPool = useMemo(()=> TAGS.filter(r => activeCats.has(r.cat)), [activeCats]);
  const filtered = useMemo(()=> {
    const qq = q.trim().toLowerCase();
    if (!qq) return tagPool;
    return tagPool.filter(r =>
      (r.tag && r.tag.toLowerCase().includes(qq)) ||
      (r.text && r.text.toLowerCase().includes(qq))
    );
  }, [tagPool, q]);

  const grouped = useMemo(()=> {
    const g = new Map();
    for (const r of filtered){
      const k = r.sub || "기타";
      if (!g.has(k)) g.set(k, []);
      g.get(k).push(r);
    }
    return Array.from(g.entries()); // [ [sub, rows[]], ... ]
  }, [filtered]);

  const selectedObjs = useMemo(()=> {
    const ids = Object.keys(o.tagSel||{}).filter(id => o.tagSel[id]);
    const set = new Set(ids);
    return TAGS.filter(t => set.has(String(t._id)));
  }, [o.tagSel]);

  return (
    <Card title="③ 종합 소견" subtitle="검사 결과 분류 체크박스 선택하면 나타나는 태그를 클릭해주세요. 상세 문구 추가됩니다. " right={<CopyBtn text={preview} />}>
      {/* 체크박스 */}
      <div className="grid grid-cols-2 md:grid-cols-3 gap-2">
        {Object.entries(labelMap).map(([k, v]) => (
          <label key={k} className="flex items-center gap-2 px-3 py-2 rounded-xl border border-slate-300 bg-white hover:bg-slate-50">
            <input type="checkbox" checked={!!o.picks[k]} onChange={()=> togglePick(k)} />
            <span className="text-sm font-semibold text-slate-950">{v}</span>
          </label>
        ))}
      </div>

      {/* 검색 + 결과수 */}
      <div className="mt-3 flex items-center gap-2">
        <input
          className="flex-1 rounded-xl border border-slate-300 px-3 py-2 text-sm text-slate-950"
          placeholder="태그/내용 검색"
          value={q}
          onChange={(e)=> setQ(e.target.value)}
        />
        <span className="text-xs font-semibold text-slate-950">{filtered.length}개</span>
      </div>

      {/* 선택된 태그 트레이 */}
      {selectedObjs.length > 0 && (
        <div className="mt-3">
          <div className="text-xs font-semibold text-slate-950 mb-1">선택된 태그</div>
          <div className="flex flex-wrap gap-2">
            {selectedObjs.map(r => (
              <button key={r._id} onClick={()=> removeTag(String(r._id))}
                className="px-2 py-1 text-xs rounded-lg border bg-slate-100 text-slate-950 border-slate-200 hover:bg-slate-200">
                {r.tag} <span className="ml-1 opacity-70">✕</span>
              </button>
            ))}
          </div>
        </div>
      )}

      {/* 태그 그룹: 중분류 오른쪽 같은 줄에 태그 (모바일은 wrap) */}
      {grouped.length > 0 && (
        <div className="mt-4 space-y-3">
          {grouped.map(([sub, rows]) => (
            <div key={sub} className="flex flex-wrap md:flex-nowrap items-start gap-3">
              <div className="shrink-0 whitespace-nowrap text-[12px] font-semibold tracking-wide text-slate-950 px-2 py-1 bg-slate-100 rounded-md border border-slate-200">
                {sub}
              </div>
              <div className="flex-1 min-w-0 flex flex-wrap gap-2">
                {rows.map(row => {
                  const picked = !!(o.tagSel && o.tagSel[row._id]);
                  return (
                    <button
                      key={row._id}
                      onMouseEnter={()=> setHover(row.text || "")}
                      onMouseLeave={()=> setHover("")}
                      className={`px-2 py-1 text-xs rounded-lg border active:scale-[.98] ${picked ? CHIP_ON_STYLE : "bg-white text-slate-950 border-slate-300 hover:bg-slate-50"}`}
                      style={picked ? CHIP_ON_STYLE : {}}
                      title={`${row.cat} · ${row.sub}`}
                      onClick={()=> toggleTag(String(row._id))}
                    >
                      {row.tag}
                    </button>
                  );
                })}
              </div>
            </div>
          ))}
        </div>
      )}

      {/* 호버 프리뷰 — 태그와 추가안내 사이, 고정영역 */}
      <div className="mt-4 rounded-xl border text-sm p-3 whitespace-pre-wrap transition-all"
           style={{ minHeight: hover ? "64px" : "0px", backgroundColor: hover ? "#FFF7ED" : "transparent",
                    borderColor: hover ? "#FED7AA" : "transparent", color: "#7C2D12" }}>
        {hover}
      </div>

      {/* 자유 입력 — 추가안내 (placeholder 제거) */}
      <div className="mt-3">
        <Field label="추가 안내 문구 (선택)">
          <TextArea
            value={o.addenda}
            onChange={(v)=> setO({ ...o, addenda: v })}
            rows={3}
          />
        </Field>
      </div>

      {/* 미리보기 */}
      <div className="mt-3">
        <Field label="미리보기">
          <TextArea value={preview} onChange={()=>{}} rows={8} />
        </Field>
      </div>
    </Card>
  );
}

/*********************************
 * 우측 패널: 출력 & 폴리셔 & 도움말
 *********************************/
function OutputPanel(){
  const compute = () => {
    const phys = loadLS(key.phys, defaultPhys);
    const dental = loadLS(key.dental, defaultDental);
    const overall = loadLS(key.overall, defaultOverall);

    const H1 = (s)=> `【${s}】`;
    const join = (...parts)=> clampBlanks(parts.filter(Boolean).join("\n\n"));

    const physText = makePhysText(phys);
    const dentalText = makeDentalText(dental);
    const overallText = makeOverallText(overall);

    return join(
      `${H1("신체검사")}\n${physText}`,
      `${H1("치과 소견")}\n${dentalText}`,
      `${H1("종합 소견")}\n${overallText}`
    );
  };

  const [txt, setTxt] = useState(compute());
  const [open, setOpen] = useState(false); // 기본 접힘
  useEffect(()=>{
    const h=()=> setTxt(compute());
    window.addEventListener('vetreport-change',h);
    return ()=> window.removeEventListener('vetreport-change',h);
  },[]);
  useEffect(()=> saveLS(key.output, txt), [txt]);

  return (
    <Card
      title="전체 소견 취합"
      subtitle="(수동 수정 가능)"
      right={
        <div className="inline-flex items-center gap-2">
          <CopyBtn text={txt} />
          <button
            onClick={()=> setOpen(o=>!o)}
            className="inline-flex items-center justify-center h-9 px-3 rounded-xl border border-slate-300 text-sm text-slate-950 hover:bg-slate-50"
          >
            {open ? "접기" : "펼치기"}
          </button>
        </div>
      }
    >
      {open ? (
        <TextArea value={txt} onChange={setTxt} rows={20} />
      ) : (
        <div className="text-xs text-slate-900">접힌 상태입니다. “펼치기”를 눌러 내용을 확인하세요.</div>
      )}
      <div className="mt-2 text-xs text-slate-900">Tip: 섹션을 수정하면 이 영역이 자동 갱신됩니다. </div>
    </Card>
  );
}

function PolisherPanel() {
  const [input, setInput] = useState("");
  const [out, setOut] = useState("");
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");
  const [open, setOpen] = useState(false); // ← 시작 시 접힘

  async function polish(mode) {
    setLoading(true); setError("");
    try {
      const resp = await fetch("/api/polish", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ text: input, length: mode }),
      });
      const data = await resp.json();
      if (!resp.ok) throw new Error(data?.error || "unknown_error");
      setOut(data.result || "");
    } catch (e) {
      setError("다듬기 중 오류가 발생했습니다. 잠시 후 다시 시도해주세요.");
    } finally {
      setLoading(false);
    }
  }

  return (
<Card
  title="AI 소견 다듬기"
  right={
    <div className="flex items-center gap-2 whitespace-nowrap">
      {/* CopyBtn이 className 지원 시 */}
      {"className" in CopyBtn.prototype ? (
        <CopyBtn text={out} className="h-9 px-3 text-sm leading-none" />
      ) : (
        // 지원 안 하면 래퍼로 강제 높이 맞춤
        <div className="h-9 inline-flex items-center">
          <CopyBtn text={out} />
        </div>
      )}

      <button
        onClick={() => setOpen(o => !o)}
        className="inline-flex h-9 px-3 items-center justify-center rounded-xl border border-slate-300 text-sm leading-none hover:bg-slate-50"
        aria-expanded={open}
      >
        {open ? "접기" : "펼치기"}
      </button>
    </div>
      }
    >
      {open ? (
        <div className="grid grid-cols-1 gap-3">
          <Field label="원문">
            <TextArea value={input} onChange={setInput} rows={6} placeholder="키워드/문장 입력" />
          </Field>

          <div className="flex items-center gap-2">
            <button
              onClick={() => polish("짧게")}
              disabled={loading || !input.trim()}
              className={"rounded-xl px-4 py-2 text-white " + (loading || !input.trim() ? "bg-slate-400" : "bg-slate-900 hover:bg-slate-800")}
            >
              {loading ? "다듬는 중..." : "짧게 다듬기"}
            </button>
            <button
              onClick={() => polish("길게")}
              disabled={loading || !input.trim()}
              className={"rounded-xl px-4 py-2 text-white " + (loading || !input.trim() ? "bg-slate-400" : "bg-slate-900 hover:bg-slate-800")}
            >
              {loading ? "다듬는 중..." : "길게 다듬기"}
            </button>
          </div>

          <Field label="결과">
            <TextArea value={out} onChange={setOut} rows={10} placeholder="소견 다듬기 결과" />
          </Field>

          {error ? <div className="mt-2 text-sm text-red-600">{error}</div> : null}
        </div>
      ) : (
        <div className="text-xs text-slate-900">“펼치기”를 눌러 내용을 확인하세요.</div>
      )}
    </Card>
  );
}




function AboutPanel(){
  const [open, setOpen] = useState(false); // 기본 접힘
  return (
    <Card
      title="도움말"
      subtitle="설계 목표 & 사용 팁"
      right={<button onClick={()=> setOpen(o=>!o)} className="inline-flex items-center justify-center h-9 px-3 rounded-xl border border-slate-300 text-sm text-slate-950 hover:bg-slate-50">{open ? "접기" : "펼치기"}</button>}
    >
      {open ? (
        <>
          <ul className="list-disc pl-5 space-y-1 text-sm text-slate-950">
            <li>AI 소견 다듬기는 GPT 4o를 사용합니다.</li>
          </ul>
          <div className="mt-3 text-sm text-slate-950">
            <b>다음 단계 제안</b>
            <ol className="list-decimal pl-5 mt-1 space-y-1">
              <li> 완성본입니다. 차후에는 다양한 소견 템플릿만 추가 예정!</li>

            </ol>
          </div>
        </>
      ) : (
        <div className="text-xs text-slate-900">접힌 상태입니다. “펼치기”를 눌러 도움말을 확인하세요.</div>
      )}
    </Card>
  );
}
