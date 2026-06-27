# post-ig — postagem automática @quermseguros

Posta carrosséis sozinho nos 3 nichos (saúde, seguros, consórcio) via Instagram API.

## Como funciona
- `posts/<nicho>/<NN>/card-0X.jpg` — imagens (link público que o Instagram busca)
- `fila.json` — caderninho: ordem + legenda + `postado` true/false
- `publicar.js` — pega próximo não-postado do nicho → monta carrossel → publica → marca na fila
- `.github/workflows/postar.yml` — roda sozinho **3x/dia**:
  - 09:00 BRT → saúde · 13:00 → seguros · 18:00 → consórcio
- `.github/workflows/refresh-token.yml` — renova o token do Instagram toda semana

## Segredos necessários (Settings → Secrets and variables → Actions)
| Secret | O quê |
|---|---|
| `IG_TOKEN` | token de 60 dias do Instagram (se renova sozinho) |
| `IG_USER_ID` | `17841430994647155` |
| `GH_PAT` | token do GitHub com permissão de gravar Secrets (pra renovar o IG_TOKEN) |

## Rodar manualmente
Actions → "Postar no Instagram" → Run workflow → escolher nicho.

## Música
A API não adiciona música. As trilhas são colocadas manualmente no app depois.
