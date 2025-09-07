// /api/approve.js
import { Octokit } from "octokit";

const owner = process.env.GH_OWNER;
const repo  = process.env.GH_REPO;
const branch = process.env.GH_BRANCH || "main";
const templatesPath = process.env.TEMPLATES_PATH || "src/data/templates.json";
const suggestionsDir = process.env.SUGGESTIONS_DIR || "suggestions/pending";

export default async function handler(req, res) {
  try {
    if (req.method !== "POST") return res.status(405).json({ error: "Method not allowed" });
    if (!process.env.GITHUB_TOKEN || !owner || !repo) {
      return res.status(500).json({ error: "GITHUB_TOKEN/GH_OWNER/GH_REPO env 필요" });
    }

    const { files } = req.body || {}; // ["suggestions/pending/2025-...json", ...]
    if (!Array.isArray(files) || files.length === 0) return res.status(400).json({ error: "files 배열이 필요합니다." });
    for (const p of files) {
      if (typeof p !== "string" || !p.startsWith(`${suggestionsDir}/`) || p.includes("..")) {
        return res.status(400).json({ error: `잘못된 파일 경로: ${p}` });
      }
    }

    const octokit = new Octokit({ auth: process.env.GITHUB_TOKEN });

    // 1) templates.json 읽기
    const { data: file } = await octokit.request("GET /repos/{owner}/{repo}/contents/{path}", {
      owner, repo, path: templatesPath, ref: branch
    });
    const shaTemplates = file.sha;
    const templates = JSON.parse(Buffer.from(file.content, "base64").toString("utf8"));

    // 2) 제안들 병합
    for (const p of files) {
      const { data: S } = await octokit.request("GET /repos/{owner}/{repo}/contents/{path}", {
        owner, repo, path: p, ref: branch
      });
      const sug = JSON.parse(Buffer.from(S.content, "base64").toString("utf8"));

      if (sug.target === "physical") {
        templates.physical ??= {};
        templates.physical.looks ??= [];
        if (!templates.physical.looks.some(x => x.title === sug.tag && x.text === sug.text)) {
          templates.physical.looks.push({ title: sug.tag, text: sug.text });
        }
      } else {
        templates.overall ??= [];
        const entry = { cat: sug.major, sub: sug.minor || "기타", tag: sug.tag, text: sug.text };
        if (!templates.overall.some(x => x.tag === entry.tag && x.cat === entry.cat && (x.sub || "기타") === entry.sub)) {
          templates.overall.push(entry);
        }
      }
    }

    // 3) templates.json 업데이트
    await octokit.request("PUT /repos/{owner}/{repo}/contents/{path}", {
      owner, repo, path: templatesPath, branch,
      message: `feat(templates): apply ${files.length} suggestion(s)`,
      content: Buffer.from(JSON.stringify(templates, null, 2)).toString("base64"),
      sha: shaTemplates
    });

    // 4) pending 파일 삭제
    for (const p of files) {
      const { data: F } = await octokit.request("GET /repos/{owner}/{repo}/contents/{path}", {
        owner, repo, path: p, ref: branch
      });
      await octokit.request("DELETE /repos/{owner}/{repo}/contents/{path}", {
        owner, repo, path: p, branch, message: `chore(suggest): remove ${p}`, sha: F.sha
      });
    }

    return res.json({ ok: true, applied: files.length });
  } catch (e) {
    console.error(e);
    return res.status(500).json({ error: String(e?.message || e) });
  }
}
