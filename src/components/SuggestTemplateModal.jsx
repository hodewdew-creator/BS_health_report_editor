import { useState } from "react";

export default function SuggestTemplateModal({ open, onClose, secretHint="" }){
  const [category,setCategory]=useState(""); const [sub,setSub]=useState("");
  const [tag,setTag]=useState(""); const [text,setText]=useState("");
  const [notes,setNotes]=useState(""); const [submitter,setSubmitter]=useState("");
  const [secret,setSecret]=useState(""); const [status,setStatus]=useState("");
  if(!open) return null;

  async function submit(){
    try{
      setStatus("제출 중...");
      const r=await fetch("/api/suggest-pr",{method:"POST",headers:{"Content-Type":"application/json"},
        body:JSON.stringify({secret,category,sub,tag,text,notes,submitter})});
      const j=await r.json(); if(!r.ok) throw new Error(j.error||"failed");
      setStatus(`✅ 제출 완료! PR 링크: ${j.pr_url}`);
    }catch(e){ setStatus("❌ 오류: "+e.message); }
  }

  return (
    <div className="fixed inset-0 z-[9999] bg-black/30 flex items-center justify-center p-4">
      <div className="w-full max-w-2xl bg-white rounded-2xl shadow-xl border p-4">
        <div className="flex items-center justify-between">
          <h2 className="text-lg font-bold">템플릿 문구 제안</h2>
          <button className="text-sm text-slate-600" onClick={onClose}>닫기</button>
        </div>

        <div className="mt-3 grid grid-cols-1 md:grid-cols-2 gap-2">
          <input className="border rounded-lg px-3 py-2" placeholder="대분류(예: 종합소견/신체검사)"
            value={category} onChange={e=>setCategory(e.target.value)} />
          <input className="border rounded-lg px-3 py-2" placeholder="중분류(선택)"
            value={sub} onChange={e=>setSub(e.target.value)} />
          <input className="border rounded-lg px-3 py-2 md:col-span-2" placeholder="태그(버튼 이름) *"
            value={tag} onChange={e=>setTag(e.target.value)} />
          <textarea className="border rounded-lg px-3 py-2 md:col-span-2 h-32" placeholder="내용(설명) *"
            value={text} onChange={e=>setText(e.target.value)} />
          <input className="border rounded-lg px-3 py-2" placeholder="제안자(선택)"
            value={submitter} onChange={e=>setSubmitter(e.target.value)} />
          <input className="border rounded-lg px-3 py-2" placeholder={`제출 시크릿 ${secretHint}`}
            value={secret} onChange={e=>setSecret(e.target.value)} />
        </div>

        <div className="mt-3 flex gap-2">
          <button className="px-4 py-2 rounded-xl border" onClick={onClose}>취소</button>
          <button className="px-4 py-2 rounded-xl text-white" style={{backgroundColor:"#0F5E9C"}} onClick={submit}>보내기</button>
        </div>

        <div className="mt-2 text-sm text-slate-600">{status}</div>
      </div>
    </div>
  );
}
