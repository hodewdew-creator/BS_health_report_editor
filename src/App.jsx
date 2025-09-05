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
    <header className="sticky top-0 z-10 backdrop-blur bg-slate-50/70 border-b border-slate-200">
      <div className="mx-auto max-w-6xl px-4 md:px-6 lg:px-8 py-3 flex items-center justify-between">
        <div className="flex items-center gap-3">
          <div className="w-8 h-8 rounded-xl bg-gradient-to-br from-blue-500 to-indigo-600" />
          <div>
            <div className="text-base font-semibold">건강검진 보고서 에디터</div>
            <div className="text-xs text-slate-500">백산동물병원 · 내부용</div>
          </div>
        </div>
        <div className="flex items-center gap-2">
          <span className="inline-flex items-center px-2 py-1 rounded-full text-xs bg-slate-100 text-slate-700 border border-slate-200">MVP</span>
          <a href="#" onClick={(e)=>{ e.preventDefault(); localStorage.clear(); location.reload(); }} className="text-xs text-slate-500 hover:text-slate-700" title="모든 데이터(로컬저장) 초기화">초기화</a>
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
  status: ["양호", "경미한 치주염 의심", "치주질환 의심", "악취/통증 호소", "발치 필요의심"],
  gingivitis: ["None", "Grade 1", "Grade 2", "Grade 3", "Grade 4"],
  calculus: ["None", "Grade 1", "Grade 2", "Grade 3", "Grade 4"],
  fracture: ["없음", "의심", "확인"],
  tr: ["의심 없음", "의심", "확인/치료 필요"],
  missing: ["없음", "의심", "확인"],
  scaling: ["권장되지 않음", "경미 권장", "권장", "강력 권장 (마취하 치과진료)"],
};
function getTemplates(){ return loadLS(key.templates, {}); }
function getBCSText(bcs){ const t = getTemplates().BCS_TEXT || DEFAULT_BCS_TEXT; return t[bcs] || DEFAULT_BCS_TEXT[bcs]; }
function getDentalOpts(){ return getTemplates().dentalOpts || DEFAULT_DENTAL_OPTS; }

/*********************************
 * 1) 신체검사
 *********************************/
const defaultPhys = { bcs: 5, note: "" };
function makePhysText(p){
  // trend 제거
  const base = `${getBCSText(p.bcs)}`;
  const extra = p.note?.trim() ? `\n- 메모: ${p.note.trim()}` : "";
  return base + extra;
}
function PhysicalExamCard(){
  const [phys, setPhys] = useState(loadLS(key.phys, defaultPhys));
  const text = useMemo(()=> makePhysText(phys), [phys]);
  useEffect(()=> { saveLS(key.phys, phys); emitChange(); }, [phys]);
  return (
    <Card title="① 신체검사" subtitle="BCS 입력 → 자동 문구" right={<CopyBtn text={text} />}>
      <Row>
        <Field label="체중 (kg)" hint="소수점 1자리 권장">
          <input type="number" step="0.1" value={phys.weight} onChange={(e)=> setPhys({ ...phys, weight: e.target.value })}
            className="w-full rounded-xl border border-slate-300 px-3 py-2 focus:outline-none focus:ring-2 focus:ring-blue-500/40 focus:border-blue-500" placeholder="예: 4.2" />
        </Field>
        <Field label={`BCS: ${phys.bcs}/9`} hint="1~9 슬라이더">
          <input type="range" min={1} max={9} value={phys.bcs} onChange={(e)=> setPhys({ ...phys, bcs: Number(e.target.value) })} className="w-full" />
          <div className="mt-2 text-sm text-slate-600">{getBCSText(phys.bcs)}</div>
        </Field>
      </Row>
      <Row>
        <Field label="추가 메모(선택)"><TextArea value={phys.note} onChange={(v)=> setPhys({ ...phys, note: v })} rows={3} /></Field>
        <Field label="미리보기"><TextArea value={text} onChange={()=>{}} rows={6} /></Field>
      </Row>
    </Card>
  );
}

/*********************************
 * 2) 치과 소견
 *********************************/
const defaultDental = {
  status: "양호",
  gingivitis: "Grade 1",
  calculus: "Grade 1",
  fracture: "없음",
  tr: "의심 없음",
  missing: "없음",
  scaling: "권장되지 않음",
  wrap: "정기 치과검진 및 구강위생 관리를 권장합니다.",
  note: "",
};
function makeDentalText(d){
  const parts = [
    `전체 구강상태: ${d.status}.`,
    `치은염: ${d.gingivitis}.`,
    `치석: ${d.calculus}.`,
    `치아 골절: ${d.fracture}.`,
    `치아흡수성 병변(TR): ${d.tr}.`,
    `결손치: ${d.missing}.`,
    `스케일링: ${d.scaling}.`,
    d.wrap ? d.wrap : "",
  ];
  const base = parts.filter(Boolean).join(" ");
  const note = d.note?.trim() ? `\n- 메모: ${d.note.trim()}` : "";
  return base + note;
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
        <Field label="추가 메모(선택)"><TextArea value={d.note} onChange={(v)=> setD({ ...d, note: v })} rows={3} /></Field>
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
    <Card title="출력 (차트에 붙여넣기)" subtitle="전체 섹션 통합 문구" right={<CopyBtn text={txt} />}>
      <TextArea value={txt} onChange={setTxt} rows={20} />
      <div className="mt-2 text-xs text-slate-500">Tip: 섹션을 수정하면 이 영역이 자동 갱신됩니다. 수동 수정 후에도 복사 가능.</div>
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
