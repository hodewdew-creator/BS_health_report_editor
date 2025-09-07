// /api/suggest.js
import { Octokit } from "octokit";

const owner = "YOUR_GH_USER_OR_ORG";
const repo  = "YOUR_REPO";
const branch = "main"; // B안이면 "suggestions"
const basePath = "suggestions/pending"; // 쌓일 폴더

export default async function handler(req, res) {
  try {
    if (req.method !== "POST") return res.status(405).json({error:"Method not allowed"});
    const { target, major, minor, tag, text, proposer } = req.body || {};
    if (!tag || !text || (target === "overall" && !major)) {
      return res.status(400).json({ error: "필수값 누락" });
    }
    const octokit = new Octokit({ auth: process.env.GITHUB_TOKEN });

    const ts = new Date().toISOString().replace(/[:.]/g, "-");
    const filename = `${ts}--${(tag || "tag").replace(/[^a-zA-Z0-9가-힣_-]/g,"_")}.json`;

    const payload = JSON.stringify({ target, major, minor, tag, text, proposer, ts }, null, 2);
    const path = `${basePath}/${filename}`;

    await octokit.request("PUT /repos/{owner}/{repo}/contents/{path}", {
      owner, repo, path,
      message: `chore(suggest): ${tag} by ${proposer || "anon"}`,
      content: Buffer.from(payload).toString("base64"),
      branch
    });

    res.status(200).json({ ok: true, path });
  } catch (e) {
    console.error(e);
    res.status(500).json({ error: String(e.message || e) });
  }
}
