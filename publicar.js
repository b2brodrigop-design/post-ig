// Publica o proximo carrossel nao-postado de um nicho no Instagram.
// Uso: node publicar.js <nicho>
// Env: IG_USER_ID, IG_TOKEN, REPO_BASE (ex: https://raw.githubusercontent.com/b2brodrigop-design/quer-ig-auto/main)
// Node 18+ (fetch nativo). Sem dependencias.

import fs from "node:fs";
import path from "node:path";

const API = "https://graph.instagram.com/v23.0";
const FILA = path.join(import.meta.dirname, "fila.json");

const nicho = process.argv[2];
const { IG_USER_ID, IG_TOKEN, REPO_BASE } = process.env;

if (!nicho) { console.error("falta nicho: node publicar.js <nicho>"); process.exit(1); }
if (!IG_USER_ID || !IG_TOKEN || !REPO_BASE) { console.error("faltam env IG_USER_ID / IG_TOKEN / REPO_BASE"); process.exit(1); }

const sleep = (ms) => new Promise(r => setTimeout(r, ms));

async function post(url) {
  const r = await fetch(url, { method: "POST" });
  const j = await r.json();
  if (!r.ok || j.error) throw new Error(JSON.stringify(j.error || j));
  return j;
}

function jpg(name) { return name.replace(/\.png$/i, ".jpg"); }

async function main() {
  const fila = JSON.parse(fs.readFileSync(FILA, "utf-8"));
  const item = fila.find(x => x.nicho === nicho && !x.postado);
  if (!item) { console.log(`nada pendente em ${nicho}`); return; }

  console.log(`Publicando ${nicho}/${item.pasta} (${item.cards.length} cards)`);

  // 1) container de cada card
  const children = [];
  for (const c of item.cards) {
    const imageUrl = `${REPO_BASE}/posts/${nicho}/${item.pasta}/${jpg(c)}`;
    const u = `${API}/${IG_USER_ID}/media?is_carousel_item=true&image_url=${encodeURIComponent(imageUrl)}&access_token=${IG_TOKEN}`;
    const j = await post(u);
    children.push(j.id);
    console.log(`  card ok ${jpg(c)} -> ${j.id}`);
    await sleep(1500);
  }

  // 2) container do carrossel
  const caption = encodeURIComponent(item.legenda || "");
  const cu = `${API}/${IG_USER_ID}/media?media_type=CAROUSEL&children=${children.join(",")}&caption=${caption}&access_token=${IG_TOKEN}`;
  const carousel = await post(cu);
  console.log(`  carrossel -> ${carousel.id}`);
  await sleep(3000);

  // 3) publicar
  const pu = `${API}/${IG_USER_ID}/media_publish?creation_id=${carousel.id}&access_token=${IG_TOKEN}`;
  const pub = await post(pu);
  console.log(`  PUBLICADO -> media id ${pub.id}`);

  // 4) marcar na fila
  item.postado = true;
  item.data = new Date().toISOString().slice(0, 10);
  item.media_id = pub.id;
  fs.writeFileSync(FILA, JSON.stringify(fila, null, 2), "utf-8");
  console.log(`fila.json atualizado: ${nicho}/${item.pasta} postado=true`);
}

main().catch(e => { console.error("ERRO:", e.message); process.exit(1); });
