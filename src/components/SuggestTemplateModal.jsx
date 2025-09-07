import React, { useEffect, useState } from "react";

/**
 * SuggestTemplateModal — v2.1 (fixed)
 * - templates.json을 import하지 않습니다.
 * - 대상 분리: 종합소견 / 신체검사(육안검사)
 * - 입력 필드: 대상에 따라 보이는 필드 달라짐
 *   • 신체검사: [태그(버튼 이름)*, 내용(설명)*]
 *   • 종합소견: [대분류*, 중분류(선택), 태그(버튼 이름)*, 내용(설명)*]
 * - 제출 시크릿 제거
 * - 필수값 유효성 검사 + 에러 메시지
 * - ESC/배경 클릭으로 닫기
 * - props: { open, onClose, onSubmit(payload) }
 *   • payload (overall): { target:'overall', major, minor?, tag, text, proposer? }
 *   • payload (physical): { target:'physical', tag, text, proposer? }
 */

export default function SuggestTemplateModal({ open, onClose, onSubmit }) {
  const [target, setTarget] = useState("overall"); // overall | physical

  // 공통
  const [tag, setTag] = useState("");
  const [text, setText] = useState("");
  const [proposer, setProposer] = useState("");

  // 종합소견 전용
  const [major, setMajor] = useState("");
  const [minor, setMinor] = useState("");

  const [err, setErr] = useState("");

  useEffect(() => {
    if (!open) return;
    const onKey = (e) => { if (e.key === "Escape") onClose?.(); };
    window.addEventListener("keydown", onKey);
    return () => window.removeEventListener("keydown", onKey);
  }, [open, onClose]);

  useEffect(() => { if (!open) reset(); }, [open]);

  function reset(){
    setTarget("overall"); setTag(""); setText(""); setProposer(""); setMajor(""); setMinor(""); setErr("");
  }

  function validate(){
    if (!tag.trim()) return "태그(버튼 이름)을 입력해 주세요.";
    if (!text.trim()) return "내용(설명)을 입력해 주세요.";
    if (target === "overall" && !major.trim()) return "대분류를 입력해 주세요.";
    return "";
  }

  function handleSubmit(){
    const e = validate();
    if (e) { setErr(e); return; }
    const payload = target === "overall"
      ? { target, major: major.trim(), minor: minor.trim(), tag: tag.trim(), text: text.trim(), proposer: proposer.trim() }
      : { target, tag: tag.trim(), text: text.trim(), proposer: proposer.trim() };
    try { onSubmit?.(payload); } finally { onClose?.(); }
  }

  if (!open) return null;

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center">
      {/* backdrop */}
      <div className="absolute inset-0 bg-black/30" onClick={onClose} />

      {/* dialog */}
      <div className="relative w-[min(720px,92vw)] rounded-2xl bg-white shadow-xl border border-slate-200 p-4 md:p-5">
        <div className="flex items-start justify-between mb-3">
          <div>
            <div className="text-lg font-semibold text-slate-950">템플릿 문구 제안</div>
            <div className="text-xs text-slate-600">대상에 맞는 필드만 보입니다.</div>
          </div>
          <button onClick={onClose} className="text-slate-500 hover:text-slate-700">닫기</button>
        </div>

        {/* target switch */}
        <div className="mb-3 flex items-center gap-3">
          <label className="inline-flex items-center gap-2">
            <input type="radio" name="target" value="overall" checked={target==="overall"} onChange={()=>setTarget("overall")} />
            <span className="text-sm font-medium text-slate-900">종합소견</span>
          </label>
          <label className="inline-flex items-center gap-2">
            <input type="radio" name="target" value="physical" checked={target==="physical"} onChange={()=>setTarget("physical")} />
            <span className="text-sm font-medium text-slate-900">신체검사(육안검사)</span>
          </label>
        </div>

        {/* fields */}
        <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
          {target === "overall" && (
            <>
              <div className="md:col-span-1">
                <Input label="대분류* (예: 혈액검사/소변/방사선/초음파/특정질환)" value={major} onChange={setMajor} />
              </div>
              <div className="md:col-span-1">
                <Input label="중분류(선택)" value={minor} onChange={setMinor} />
              </div>
            </>
          )}
          <div className={target === "overall" ? "md:col-span-1" : "md:col-span-2"}>
            <Input label="태그(버튼 이름)*" value={tag} onChange={setTag} />
          </div>
          <div className="md:col-span-2">
            <Textarea label="내용(설명)*" value={text} onChange={setText} rows={6} />
          </div>
          <div className="md:col-span-2">
            <Input label="제안자(선택)" value={proposer} onChange={setProposer} />
          </div>
        </div>

        {err && <div className="mt-2 text-sm text-rose-600">{err}</div>}

        <div className="mt-4 flex items-center justify-end gap-2">
          <button onClick={onClose} className="h-9 px-3 rounded-xl border border-slate-300 text-sm text-slate-900 hover:bg-slate-50">취소</button>
          <button onClick={handleSubmit} className="h-9 px-4 rounded-xl text-white bg-[#0F5E9C]">보내기</button>
        </div>
      </div>
    </div>
  );
}

function Input({ label, value, onChange }) {
  return (
    <label className="block">
      <div className="mb-1 text-sm font-semibold text-slate-950">{label}</div>
      <input
        className="w-full rounded-xl border border-slate-300 px-3 py-2 text-slate-950"
        value={value}
        onChange={(e)=> onChange(e.target.value)}
      />
    </label>
  );
}

function Textarea({ label, value, onChange, rows=5 }) {
  return (
    <label className="block">
      <div className="mb-1 text-sm font-semibold text-slate-950">{label}</div>
      <textarea
        className="w-full rounded-xl border border-slate-300 px-3 py-2 text-slate-950 resize-y"
        rows={rows}
        value={value}
        onChange={(e)=> onChange(e.target.value)}
      />
    </label>
  );
}
