// api/polish.js
import OpenAI from "openai";

export default async function handler(req, res) {
  if (req.method !== "POST") return res.status(405).json({ error: "Method Not Allowed" });

  try {
    const { text = "", tone = "중립", length = "보통", format = "일반문장" } = req.body || {};
    if (!text.trim()) return res.status(400).json({ error: "text is required" });

    const openai = new OpenAI({ apiKey: process.env.OPENAI_API_KEY });

    const system = [
      "너는 수의학 건강검진 결과를 환자 보호자에게 전달하기 좋게 문장을 다듬는 보조가이드다.",
      "사실 왜곡 금지, 의학적 단정 금지(추정/가능성 표현 유지).",
      `어투: ${tone} / 길이: ${length} / 형식: ${format}.`,
      "줄바꿈과 글머리표는 원문 구조를 최대한 보존하되 문장만 매끄럽게.",
      "숫자/단위/기호는 그대로 유지(필요 시 한국어 단위 병기).",
    ].join("\n");

    const user = [
      "다듬을 원문:",
      "```",
      text,
      "```",
      "",
      "출력은 한국어만. 앞뒤 공백 제거."
    ].join("\n");

    const r = await openai.chat.completions.create({
      model: "gpt-4o-mini",          // 원하면 gpt-4o, gpt-4.1-mini 등으로 교체 가능
      temperature: 0.2,
      messages: [
        { role: "system", content: system },
        { role: "user", content: user }
      ]
    });

    const out = r.choices?.[0]?.message?.content?.trim() || "";
    return res.status(200).json({ result: out });
  } catch (err) {
    console.error(err);
    return res.status(500).json({ error: "polish_failed" });
  }
}
