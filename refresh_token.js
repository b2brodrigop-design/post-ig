// Renova o token de 60 dias do Instagram (ig_refresh_token).
// Imprime SO o token novo no stdout (pra Action capturar e regravar no Secret).
// Env: IG_TOKEN
const tok = process.env.IG_TOKEN;
if (!tok) { console.error("falta IG_TOKEN"); process.exit(1); }

const url = `https://graph.instagram.com/refresh_access_token?grant_type=ig_refresh_token&access_token=${tok}`;
const r = await fetch(url);
const j = await r.json();
if (!r.ok || j.error || !j.access_token) {
  console.error("ERRO refresh:", JSON.stringify(j.error || j));
  process.exit(1);
}
// expires_in em segundos -> dias (so pro log no stderr)
console.error(`token renovado, expira em ~${Math.round(j.expires_in/86400)} dias`);
process.stdout.write(j.access_token);
