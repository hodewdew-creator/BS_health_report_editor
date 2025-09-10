import OpenAI from "openai";
const client = new OpenAI({ apiKey: process.env.OPENAI_API_KEY });

export default async function handler(req, res) {
  if (req.method !== "POST") return res.status(405).end();

  try {
    const { text, length } = req.body; // "짧게" or "길게"

    const completion = await client.chat.completions.create({
      model: "gpt-4o",
      messages: [
        {
          role: "system",
          content: `
너는 수의사가 보호자에게 전달할 건강검진 종합소견을 작성하는 보조자이다.
입력은 키워드, 불완전한 문장, 또는 어색한 표현일 수 있다.

출력 규칙:
- 반드시 "■" 기호로 시작하는 결과 문장으로 작성한다.
- 보호자가 이해할 수 있도록 전문적이면서 친절한 어조를 유지한다.
- 여러 소견이 있으면 줄바꿈 후 각각 "■"로 구분한다.
- 길이 지침:
  - 짧게: 핵심만 간단히 요약
  - 길게: 보호자가 이해하기 쉽게 충분한 설명을 덧붙임

출력 예시 스타일은 아래 문장들과 유사해야 한다:

■ 혈액검사상 경도의 탈수가 의심됩니다. 현재로서는 큰 이상은 없으나, 장기적인 신장·췌장 기능 유지에는 적절한 수분 공급이 중요합니다. 음수량 증가 노력을 해주시는 것이 좋습니다.

■ 혈액검사상 간수치의 경미한 상승이 확인됩니다. 현재 간의 초음파 검사상 특별한 병변이 보이지 않고 수치 상승이 심하지 않아 주기적인 모니터링을 추천드리나, 지속적으로 수치가 높아지거나 병변이 확인될 경우 원인 파악을 위한 간 조직검사 및 간 보호제 복용 등이 필요할 수 있습니다.

■ ''는 병원으로의 이동, 병원 환경과 핸들링에 쉽게 불안감을 느끼는 아이입니다. 공격성으로 인해 아이를 더 자세히 살필 수 없을 뿐만 아니라, 이러한 부정적인 심리는 건강 상태에도 영향을 미쳐 특발성 방광염, 식욕저하, 구토 등을 유발할 수 있습니다. 병원에서의 경험이 긍정적이고 좋은 경험이 될 수 있도록 보호자님의 배려가 필요하며, 내원전 안정제 복용, 펠리웨이(합성 고양이 얼굴 호르몬 제품; 고양이에게 안정감을 주는데 도움이 됨) 사용, 평상시에도 이동장에 친숙해지도록 이동장 훈련을 해주세요.
          `,
        },
        {
          role: "user",
          content: `다음 입력을 ${length} 작성 지침에 맞춰 다듬어주세요:\n${text}`,
        },
      ],
      temperature: 0.3,
    });

    const result = completion.choices[0].message.content.trim();
    res.status(200).json({ result });
  } catch (e) {
    console.error(e);
    res.status(500).json({ error: "AI 요청 중 오류가 발생했습니다." });
  }
}
