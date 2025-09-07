import React, { useEffect, useMemo, useState } from "react";

import SuggestTemplateModal from "./components/SuggestTemplateModal";

/**
 * App.jsx — with "템플릿 문구 제안" integration (patched A안)
 * - SuggestTemplateModal v2 사용 (templates.json import 제거된 모달)
 * - onSubmit 핸들러 추가 → /api/suggest 로 제출
 */

// ===== Brand color (탭/주요 버튼) =====
const BRAND = { bg: "#0F5E9C", border: "#0F5E9C", text: "#ffffff" };
// ===== Selected chip style (부드러운 노랑톤) =====
const CHIP_ON_STYLE = { backgroundColor: "#FEF3C7", borderColor: "#FACC15", color: "#111827" }; // amber-100/400

export default function App() {
  const [tab, setTab] = useState(() => {
    try { return localStorage.getItem("ui_tab") || "physical"; } catch { return "physical"; }
  });
  useEffect(()=> { try { localStorage.setItem("ui_tab", tab); } catch {} }, [tab]);

  // ⬇️ 제안 모달 상태
  const [suggestOpen, setSuggestOpen] = useState(false);

  // ⬇️ 템플릿 제안 제출 핸들러 (A안)
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
      <SuggestTemplateModal open={suggestOpen} onClose={()=>setSuggestOpen(false)} onSubmit={handleTemplateSuggestion} />

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

// ===== 유틸 =====
function saveLS(k, v) { try { localStorage.setItem(k, JSON.stringify(v)); } catch {} }
function loadLS(k, fallback) {
  try { const v = localStorage.getItem(k); return v ? JSON.parse(v) : fallback; } catch { return fallback; }
}
function emitChange(){ try { window.dispatchEvent(new Event('vetreport-change')); } catch {} }
function clampBlanks(s){
  return (s || "")
    .replace(/
/g, "
")
    .replace(/
{3,}/g, "

")
    .replace(/[ 	]+
/g, "
")
    .trim();
}

function Card({ title, subtitle, children, right }) {
  return (
    <section className="bg-white rounded-2xl shadow-sm border border-slate-200">
      <div className="flex items-start justify-between gap-3 px-5 py-4 border-b border-slate-100">
        <div>
          <h2 className="text-lg font-semibold text-slate-950">{title}</h2>
          {subtitle && <div className="text-xs text-slate-600">{subtitle}</div>}
        </div>
        {right}
      </div>
      <div className="p-5">
        {children}
      </div>
    </section>
  );
}

function Field({ label, children, hint, right, col=1 }){
  return (
    <div className={`grid grid-cols-12 items-start gap-2 ${col===2? 'md:grid-cols-12':'grid-cols-12'}`}>
      <div className="col-span-12 md:col-span-2">
        <div className="text-sm font-semibold text-slate-950">{label}</div>
        {hint && <div className="text-xs text-slate-600">{hint}</div>}
      </div>
      <div className="col-span-12 md:col-span-10 flex items-center gap-2 flex-wrap">
        {children}
        {right}
      </div>
    </div>
  );
}

function TextArea({ value, onChange, rows=5, placeholder }){
  return (
    <textarea
      className="w-full rounded-xl border border-slate-300 px-3 py-2 text-slate-950 resize-y"
      rows={rows}
      value={value}
      placeholder={placeholder}
      onChange={(e)=> onChange(e.target.value)}
    />
  );
}

function CopyBtn({ text }){
  return (
    <button
      onClick={()=>{ try{ navigator.clipboard.writeText(text); alert('복사되었습니다!'); } catch(e){ alert('복사 실패: '+e); } }}
      className="h-9 px-3 rounded-xl border border-slate-300 text-sm text-slate-950 hover:bg-slate-50"
    >
      복사
    </button>
  );
}

function SegTab({ value, onChange }){
  return (
    <div className="inline-flex items-center rounded-xl bg-white border border-slate-200 overflow-hidden">
      {[
        {id:'physical', label:'신체검사'},
        {id:'dental', label:'치과검사'},
        {id:'overall', label:'종합소견'},
      ].map(opt => (
        <button key={opt.id}
          className={`px-3 py-1.5 text-sm ${value===opt.id? 'bg-[#0F5E9C] text-white':'text-slate-900 hover:bg-slate-50'}`}
          onClick={()=> onChange(opt.id)}>
          {opt.label}
        </button>
      ))}
    </div>
  );
}

function Header({ tab, onTab, onSuggest }){
  return (
    <header className="sticky top-0 z-40 backdrop-blur bg-white/80 border-b border-slate-200">
      <div className="mx-auto max-w-6xl px-4 md:px-6 lg:px-8 py-3 flex items-center justify-between">
        <div className="flex items-center gap-3">
          <img src="/logo.png" alt="logo" className="w-12 h-12" />
          <div>
            <div className="text-xl font-bold text-slate-950">FORCAT 건강검진 결과서 Editor v1.0</div>
            <div className="text-xs text-slate-600">BCS 및 신체/치과/종합소견 작성 도우미</div>
          </div>
        </div>
        <div className="flex items-center gap-3">
          <SegTab value={tab} onChange={onTab} />
          <button onClick={onSuggest} className="h-9 px-3 rounded-xl border border-slate-300 text-sm text-slate-950 hover:bg-slate-50">템플릿 제안</button>
        </div>
      </div>
    </header>
  );
}

function Footer(){
  return (
    <footer className="py-10 text-center text-xs text-slate-500">© 2025 FORCAT. All rights reserved.</footer>
  );
}

// ========== 도메인 로직&컴포넌트 (물리검사/치과/종합소견) ==========
// 아래 내용은 기존 App (29).jsx의 구현을 그대로 유지합니다.

function _pickDentalDesc(items){
  const arr = items.filter(Boolean).map(s => s.trim());
  return arr.length ? arr.join(", ") : "특이사항 없음";
}

function getBCSText(level){
  switch(level){
    case 1: return "BCS 1/9: 매우 마름";
    case 2: return "BCS 2/9: 마름";
    case 3: return "BCS 3/9: 저체중";
    case 4: return "BCS 4/9: 약간 저체중";
    case 5: return "BCS 5/9: 정상";
    case 6: return "BCS 6/9: 과체중";
    case 7: return "BCS 7/9: 비만";
    case 8: return "BCS 8/9: 중증 비만";
    case 9: return "BCS 9/9: 극심한 비만";
    default: return "";
  }
}

function getDentalOpts(){
  return ["치석", "치은염", "치아우식", "치아파절", "치아마모", "구취", "치주낭", "치주출혈"]
}

function makePhysText({bcs, note}){
  const parts = [];
  if (bcs) parts.push(getBCSText(bcs));
  if (note) parts.push(note.trim());
  return clampBlanks(parts.join("

"));
}

function PhysicalExamCard(){
  const [bcs, setBcs] = useState(5);
  const [note, setNote] = useState("");
  return (
    <Card title="신체검사" subtitle="BCS 및 신체검사 소견 입력 → 자동 문구">
      <div className="space-y-3">
        <Field label="BCS" hint="1~9 단계">
          <input type="range" min={1} max={9} value={bcs} onChange={(e)=> setBcs(Number(e.target.value))} />
          <div className="text-sm text-slate-900">{bcs}/9</div>
        </Field>
        <Field label="메모(선택)" hint="중요 관찰 메모">
          <TextArea value={note} onChange={setNote} rows={4} placeholder="예: 복부 촉진 시 경미한 통증 반응" />
        </Field>
        <Field label="자동 문구">
          <div className="flex items-center gap-2 w-full">
            <TextArea value={makePhysText({bcs, note})} onChange={()=>{}} rows={5} />
            <CopyBtn text={makePhysText({bcs, note})} />
          </div>
        </Field>
      </div>
    </Card>
  );
}

function makeDentalText({items, note}){
  const picked = _pickDentalDesc(items);
  const parts = [picked];
  if (note) parts.push(note.trim());
  return clampBlanks(parts.join("

"));
}

function DentalFindingsCard(){
  const [items, setItems] = useState([]);
  const [note, setNote] = useState("");

  const opts = getDentalOpts();

  return (
    <Card title="치과 검사" subtitle="항목 선택 → 자동 문구">
      <div className="space-y-3">
        <Field label="항목">
          <div className="flex flex-wrap gap-2">
            {opts.map(opt => {
              const on = items.includes(opt);
              return (
                <button key={opt}
                  className={`h-8 px-3 rounded-xl border text-sm ${on? 'border-amber-400' : 'border-slate-300'} ${on? 'bg-amber-100' : 'bg-white'} text-slate-950`}
                  style={on? CHIP_ON_STYLE : undefined}
                  onClick={()=> setItems(prev => prev.includes(opt) ? prev.filter(v=>v!==opt) : [...prev, opt])}
                >{opt}</button>
              );
            })}
          </div>
        </Field>
        <Field label="메모(선택)">
          <TextArea value={note} onChange={setNote} rows={4} placeholder="예: 우측 상악 제4전구치 치석 우세" />
        </Field>
        <Field label="자동 문구">
          <div className="flex items-center gap-2 w-full">
            <TextArea value={makeDentalText({items, note})} onChange={()=>{}} rows={5} />
            <CopyBtn text={makeDentalText({items, note})} />
          </div>
        </Field>
      </div>
    </Card>
  );
}

function makeOverallText({major, minor, tag, text}){
  const cat = major ? `${major}${minor? `/${minor}`:''}` : "";
  const t = [cat && `[#${cat}]`, tag && `(${tag})`, text].filter(Boolean).join(" ");
  return clampBlanks(t);
}

function OverallAssessmentCard(){
  const cats = useMemo(()=> ([
    { id:"혈액검사", subs:["CBC","혈액화학","기타"] },
    { id:"소변검사", subs:["UA","UPC","기타"] },
    { id:"방사선", subs:["X-ray","CT","기타"] },
    { id:"초음파", subs:["복부","심장","기타"] },
    { id:"특정질환", subs:["내분비","감염","기타"] },
  ]), []);

  const [major, setMajor] = useState("");
  const [minor, setMinor] = useState("");
  const [tag, setTag] = useState("");
  const [text, setText] = useState("");

  return (
    <Card title="종합 소견" subtitle="대분류/중분류/태그/설명 → 자동 문구">
      <div className="space-y-3">
        <Field label="대분류">
          <div className="flex flex-wrap gap-2">
            {cats.map(c => (
              <button key={c.id}
                className={`h-8 px-3 rounded-xl border text-sm ${major===c.id? 'border-amber-400' : 'border-slate-300'} ${major===c.id? 'bg-amber-100' : 'bg-white'} text-slate-950`}
                style={major===c.id? CHIP_ON_STYLE : undefined}
                onClick={()=> { setMajor(c.id); setMinor(""); }}
              >{c.id}</button>
            ))}
          </div>
        </Field>
        <Field label="중분류">
          <div className="flex flex-wrap gap-2">
            {(cats.find(c=>c.id===major)?.subs || []).map(s => (
              <button key={s}
                className={`h-8 px-3 rounded-xl border text-sm ${minor===s? 'border-amber-400' : 'border-slate-300'} ${minor===s? 'bg-amber-100' : 'bg-white'} text-slate-950`}
                style={minor===s? CHIP_ON_STYLE : undefined}
                onClick={()=> setMinor(s)}
              >{s}</button>
            ))}
          </div>
        </Field>
        <Field label="태그">
          <input className="w-full rounded-xl border border-slate-300 px-3 py-2 text-slate-950" value={tag} onChange={e=> setTag(e.target.value)} placeholder="버튼 이름 같은 짧은 태그" />
        </Field>
        <Field label="설명">
          <TextArea value={text} onChange={setText} rows={5} placeholder="예: 혈액검사에서 ALT가 경미하게 상승되어 재검 권장" />
        </Field>
        <Field label="자동 문구">
          <div className="flex items-center gap-2 w-full">
            <TextArea value={makeOverallText({major, minor, tag, text})} onChange={()=>{}} rows={4} />
            <CopyBtn text={makeOverallText({major, minor, tag, text})} />
          </div>
        </Field>
      </div>
    </Card>
  );
}

function OutputPanel(){
  const [open, setOpen] = useState(false); // 기본 접힘
  const [txt, setTxt] = useState("");
  useEffect(()=>{
    const on = ()=>{
      // 예시로 깔끔한 출력만 유지
      setTxt("출력 예시: 사용자가 선택/입력한 내용을 조합해 생성된 문장");
    };
    window.addEventListener('vetreport-change', on);
    return ()=> window.removeEventListener('vetreport-change', on);
  }, []);

  return (
    <Card
      title="최종 검진 소견"
      subtitle="선택/입력 내용을 조합한 최종 문장"
      right={<button onClick={()=> setOpen(o=>!o)} className="h-8 px-3 rounded-xl border border-slate-300 text-sm text-slate-950 hover:bg-slate-50">{open ? "접기" : "펼치기"}</button>}
    >
      {open ? (
        <div className="space-y-2">
          <TextArea value={txt} onChange={setTxt} rows={6} />
          <div className="flex items-center gap-2">
            <CopyBtn text={txt} />
            <button className="h-9 px-3 rounded-xl border border-slate-300 text-sm text-slate-950 hover:bg-slate-50">Pad에 보내기</button>
          </div>
        </div>
      ) : (
        <div className="text-xs text-slate-900">접힌 상태입니다. “펼치기”를 눌러 결과를 확인하세요.</div>
      )}
    </Card>
  );
}

function PolisherPanel(){
  const [open, setOpen] = useState(false); // 기본 접힘
  const [txt, setTxt] = useState("");
  return (
    <Card
      title="AI 문장 다듬기"
      subtitle="(미구현상태입니다)"
      right={<button onClick={()=> setOpen(o=>!o)} className="h-8 px-3 rounded-xl border border-slate-300 text-sm text-slate-950 hover:bg-slate-50">{open ? "접기" : "펼치기"}</button>}
    >
      {open ? (
        <>
          <TextArea value={txt} onChange={setTxt} rows={6} placeholder="예: 최종문장을 붙여넣고 톤을 다듬어 주세요" />
          <div className="flex items-center gap-2">
            <button className="h-9 px-3 rounded-xl border border-slate-300 text-sm text-slate-950 hover:bg-slate-50">다듬기</button>
            <button className="h-9 px-3 rounded-xl border border-slate-300 text-sm text-slate-950 hover:bg-slate-50">원문 복원</button>
          </div>
        </>
      ) : (
        <div className="text-xs text-slate-900">접힌 상태입니다. “펼치기”를 눌러 AI 도우미를 사용하세요.</div>
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
      right={<button onClick={()=> setOpen(o=>!o)} className="h-8 px-3 rounded-xl border border-slate-300 text-sm text-slate-950 hover:bg-slate-50">{open ? "접기" : "펼치기"}</button>}
    >
      {open ? (
        <>
          <ul className="list-disc pl-5 space-y-1 text-sm text-slate-950">
            <li>각종 내용 템플릿 수정은 src/data/templates.json</li>
            <li>사용자 제안은 suggestions/pending/*.json</li>
            <li>운영자 승인 시 /api/approve 호출로 templates.json 반영</li>
          </ul>
          <div className="mt-3 text-sm text-slate-950">
            <b>다음 단계 제안</b>
            <ol className="list-decimal pl-5 mt-1 space-y-1">
              <li> GPT 문장 다듬기 , 키워드 입력시 소견 작성 구현</li>
            </ol>
          </div>
        </>
      ) : (
        <div className="text-xs text-slate-900">접힌 상태입니다. “펼치기”를 눌러 도움말을 확인하세요.</div>
      )}
    </Card>
  );
}
