// /api/suggest.js
import { Octokit } from "octokit";

const owner = process.env.GH_OWNER;                 // ex) hodewdew-creator
const repo  = process.env.GH_REPO;                  // ex) BS_health_report_editor
const branch = process.env.GH_BRANCH || "main";     // 기본 main
const basePath = process.env.SUGGESTIONS_DIR || "suggestions/pending";

export default async function handler(req, res) {
  try {
    if (req.method !== "POST") return res.status(405).json({ error: "Method not allowed" });
    if (!process.env.GITHUB_TOKEN || !owner || !repo) {
      return res.status(500).json({ error: "GITHUB_TOKEN/GH_OWNER/GH_REPO env 필요" });
    }

    const { target, major, minor, tag, text, proposer } = req.body || {};
    if (!tag || !text || (target === "overall" && !major)) {
      return res.status(400).json({ error: "필수값 누락(태그/설명, [종합소견은 대분류])" });
    }

    const octokit = new Octokit({ auth: process.env.GITHUB_TOKEN });

    const ts = new Date().toISOString().replace(/[:.]/g, "-");
    const filename = `${ts}--${(tag || "tag").replace(/[^a-zA-Z0-9가-힣_-]/g, "_")}.json`;
    const path = `${basePath}/${filename}`;

    const payload = { target, major, minor, tag, text, proposer, ts, source: "webapp" };

    await octokit.request("PUT /repos/{owner}/{repo}/contents/{path}", {
      owner, repo, path,
      message: `chore(suggest): ${tag} (${target})`,
      content: Buffer.from(JSON.stringify(payload, null, 2)).toString("base64"),
      branch
    });

    return res.status(200).json({ ok: true, path });
  } catch (e) {
    console.error(e);
    return res.status(500).json({ error: String(e?.message || e) });
  }
}
