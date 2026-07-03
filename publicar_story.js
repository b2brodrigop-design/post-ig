// Publica a sequência de respostas (Stories) da próxima caixinha não-postada.
// Uso: node publicar_story.js
// Env: IG_USER_ID, IG_TOKEN, REPO_BASE
// Posta cada resposta-*.jpg como um Story (media_type=STORIES), em ordem.

import fs from "node:fs";
import path from "node:path";

const API = "https://graph.instagram.com/v23.0";
const FILA = path.join(import.meta.dirname, "fila_stories.json");

const { IG_USER_ID, IG_TOKEN, REPO_BASE } = process.env;
if (!IG_USER_ID || !IG_TOKEN || !REPO_BASE) { console.error("faltam env IG_USER_ID / IG_TOKEN / REPO_BASE"); process.exit(1); }

const sleep = (ms) => new Promise(r => setTimeout(r, ms));
const jpg = (n) => n.replace(/\.png$/i, ".jpg");

async function post(url, tentativas = 4) {
  let ultimoErro;
  for (let i = 0; i < tentativas; i++) {
    try {
      const r = await fetch(url, { method: "POST" });
      const j = await r.json();
      if (!r.ok || j.error) throw new Error(JSON.stringify(j.error || j));
      return j;
    } catch (e) {
      ultimoErro = e;
      if (i < tentativas - 1) {
        const espera = (i + 1) * 5000;
        console.log(`  tentativa ${i + 1} falhou: ${e.message} -> retry em ${espera / 1000}s`);
        await sleep(espera);
      }
    }
  }
  throw ultimoErro;
}

function salvarFila(fila) {
  fs.writeFileSync(FILA, JSON.stringify(fila, null, 2), "utf-8");
}

async function main() {
  const fila = JSON.parse(fs.readFileSync(FILA, "utf-8"));
  const item = fila.find(x => !x.postado);
  if (!item) { console.log("nenhuma caixinha pendente"); return; }

  const ids = item.media_ids || [];
  console.log(`Caixinha ${item.pasta}: ${item.stories.length} stories (${ids.length} ja postadas antes)`);

  for (let i = ids.length; i < item.stories.length; i++) {
    const s = item.stories[i];
    const imageUrl = `${REPO_BASE}/posts/caixinha/${item.pasta}/${jpg(s)}`;
    const cu = `${API}/${IG_USER_ID}/media?media_type=STORIES&image_url=${encodeURIComponent(imageUrl)}&access_token=${IG_TOKEN}`;
    const c = await post(cu);
    await sleep(2000);
    const pu = `${API}/${IG_USER_ID}/media_publish?creation_id=${c.id}&access_token=${IG_TOKEN}`;
    const p = await post(pu);
    ids.push(p.id);
    item.media_ids = ids;
    salvarFila(fila);
    console.log(`  story ok ${jpg(s)} -> ${p.id}`);
    await sleep(3000);
  }

  item.postado = true;
  item.data = new Date().toISOString().slice(0, 10);
  salvarFila(fila);
  console.log(`fila_stories.json atualizado: caixinha ${item.pasta} postado=true (${ids.length} stories)`);
}

main().catch(e => { console.error("ERRO:", e.message); process.exit(1); });
