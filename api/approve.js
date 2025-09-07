// /api/approve.js
import { Octokit } from "octokit";
const owner="...", repo="...", branch="main";

export default async function handler(req, res) {
  try {
    if (req.method !== "POST") return res.status(405).json({error:"Method not allowed"});
    const { files } = req.body || {}; // ["suggestions/pending/2025-...json", ...]

    const octokit = new Octokit({ auth: process.env.GITHUB_TOKEN });

    // 1) templates.json 읽기
    const path = "src/data/templates.json"; // 프로젝트 경로에 맞춰 수정
    const { data: file } = await octokit.request("GET /repos/{owner}/{repo}/contents/{path}", { owner, repo, path, ref: branch });
    const shaTemplates = file.sha;
    const templates = JSON.parse(Buffer.from(file.content, "base64").toString("utf8"));

    // 2) 제안들 읽어서 병합
    for (const f of files) {
      const { data: S } = await octokit.request("GET /repos/{owner}/{repo}/contents/{path}", { owner, repo, path: f, ref: branch });
      const sug = JSON.parse(Buffer.from(S.content, "base64").toString("utf8"));

      if (sug.target === "physical") {
        // 신체검사(육안검사) → templates.physical.looks에 push
        templates.physical.looks.push({ title: sug.tag, text: sug.text });
      } else {
        // 종합소견 → templates.overall에 push
        templates.overall.push({
          cat: sug.major, sub: sug.minor || "기타", tag: sug.tag, text: sug.text
        });
      }
    }

    // 3) templates.json 업데이트
    const newContent = Buffer.from(JSON.stringify(templates, null, 2)).toString("base64");
    await octokit.request("PUT /repos/{owner}/{repo}/contents/{path}", {
      owner, repo, path, branch,
      message: `feat(templates): apply ${files.length} suggestion(s)`,
      content: newContent, sha: shaTemplates
    });

    // 4) pending 파일들 정리 (삭제 or 이동)
    for (const f of files) {
      // 삭제 예시
      const { data: F } = await octokit.request("GET /repos/{owner}/{repo}/contents/{path}", { owner, repo, path: f, ref: branch });
      await octokit.request("DELETE /repos/{owner}/{repo}/contents/{path}", {
        owner, repo, path: f, branch, message: `chore(suggest): remove ${f}`, sha: F.sha
      });
    }

    res.json({ ok: true });
  } catch (e) {
    console.error(e); res.status(500).json({ error: String(e.message || e) });
  }
}
