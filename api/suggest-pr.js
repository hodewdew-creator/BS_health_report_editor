// /api/suggest-pr.js
function slugify(s=""){return s.toLowerCase().replace(/[^a-z0-9가-힣]+/g,"-").replace(/^-+|-+$/g,"").slice(0,40)||"suggestion";}
export default async function handler(req,res){
  try{
    if(req.method!=="POST")return res.status(405).json({error:"Method not allowed"});
    const token=process.env.GITHUB_TOKEN, owner=process.env.GITHUB_OWNER, repo=process.env.GITHUB_REPO;
    if(!token||!owner||!repo)return res.status(400).json({error:"missing_github_env"});
    const { secret, category, sub, tag, text, notes="", submitter="" } = req.body||{};
    if(process.env.SUGGEST_SECRET && secret!==process.env.SUGGEST_SECRET) return res.status(401).json({error:"unauthorized"});
    if(!tag||!text) return res.status(400).json({error:"tag_and_text_required"});
    const H={"Authorization":`Bearer ${token}`,"Accept":"application/vnd.github+json"};
    let r=await fetch(`https://api.github.com/repos/${owner}/${repo}`,{headers:H}); if(!r.ok)return res.status(r.status).json(await r.json());
    const base=(await r.json()).default_branch;
    r=await fetch(`https://api.github.com/repos/${owner}/${repo}/git/ref/heads/${base}`,{headers:H}); if(!r.ok)return res.status(r.status).json(await r.json());
    const baseSha=(await r.json()).object.sha;
    const now=new Date(), ymd=now.toISOString().slice(0,10), id=`${ymd}-${Date.now()}-${slugify(tag)}`, branch=`suggest/${id}`, path=`suggestions/${ymd}/${id}.json`;
    await fetch(`https://api.github.com/repos/${owner}/${repo}/git/refs`,{method:"POST",headers:H,body:JSON.stringify({ref:`refs/heads/${branch}`,sha:baseSha})});
    const body={id,createdAt:now.toISOString(),category:category||"",sub:sub||"",tag:String(tag).trim(),text:String(text).trim(),notes:String(notes||""),submitter:String(submitter||""),status:"pending"};
    const content=Buffer.from(JSON.stringify(body,null,2),"utf-8").toString("base64");
    r=await fetch(`https://api.github.com/repos/${owner}/${repo}/contents/${encodeURIComponent(path)}`,{method:"PUT",headers:H,body:JSON.stringify({message:`chore: add suggestion ${id}`,content,branch})});
    if(!r.ok)return res.status(r.status).json(await r.json());
    const prTitle=`feat(templates): suggestion ${body.tag}`, prBody=`자동 생성된 템플릿 제안입니다.\n\n- category: ${body.category}\n- sub: ${body.sub}\n- tag: ${body.tag}\n- text: ${body.text}\n- notes: ${body.notes}\n- submitter: ${body.submitter}\n`;
    r=await fetch(`https://api.github.com/repos/${owner}/${repo}/pulls`,{method:"POST",headers:H,body:JSON.stringify({title:prTitle,head:branch,base,body:prBody})});
    const pr=await r.json(); if(!r.ok)return res.status(r.status).json(pr);
    return res.status(200).json({ok:true,pr_url:pr.html_url,branch,path,id});
  }catch(e){console.error(e);return res.status(500).json({error:"server_error"});}
}
