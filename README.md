# VibeShield Web

Frontend do VibeShield: escaneia um repositório público do GitHub (via API VibeShield) e mostra segredos vazados,
Unicode oculto, dependências inventadas por IA (slopsquatting) e código inseguro, com um prompt de correção por achado.

Stack: Vue 3.5 + TypeScript 5.9 + Vite 8 + Tailwind CSS 4. Testes com Vitest + @vue/test-utils e Playwright.
Todas as versões estão pinadas (sem `^`/`~`, `.npmrc` com `save-exact=true`).

## Rodar

```bash
cp .env.example .env        # ajuste VITE_API_BASE_URL se a API não estiver em localhost:8080
npm ci
npm run dev                 # http://localhost:5173 (a API precisa liberar essa origem em FRONTEND_URL)
```

## Scripts

| Script | O que faz |
|---|---|
| `npm run typecheck` | `vue-tsc --noEmit` |
| `npm run test` | testes unitários (Vitest, jsdom) |
| `npm run build` | build de produção em `dist/` |
| `npm run e2e` | Playwright (Chromium) contra o dev server, com a API mockada por `page.route` |
| `npm run screenshots` | regera `docs/screenshots/desktop-1440.png` e `mobile-375.png` |

Para o E2E na primeira vez: `npx playwright install chromium`.

## Contrato

`docs/CONTRACT.md` é a fonte única. Os tipos ficam em `src/api/types.ts` (escritos à mão a partir do contrato) e o
cliente em `src/api/client.ts`:

- valida a URL com a **mesma regex** do contrato antes de enviar (erro inline perto do campo);
- `POST {VITE_API_BASE_URL}/scans` com timeout de 90 s (`AbortController`);
- traduz cada `error.code` (`INVALID_REPO_URL`, `REPO_NOT_FOUND`, `REPO_TOO_LARGE`, `RATE_LIMITED`, `SCAN_TIMEOUT`…)
  para uma mensagem em pt-BR; falha de rede vira "API fora do ar".

## Estrutura

```
src/
  api/          types.ts (contrato) e client.ts (fetch, validação, erros)
  lib/          formatação, donut, histórico (localStorage), prompts, rótulos e regras
  composables/  useScan (estado idle/loading/error/success + histórico)
  components/   cards do bento (score, achados, donut, CTA, métricas, histórico, estados)
  views/        Metodologia
tests/unit/     Vitest
e2e/            Playwright + fixtures/scan.json (resposta de exemplo no formato do contrato)
```

## Navegação

Hash simples, sem vue-router: `#/scan`, `#/historico`, `#/metodologia`. O histórico guarda os 10 últimos resultados
**só neste navegador** (`localStorage`); se o storage estiver bloqueado ou cheio, a página continua funcionando.

## Acessibilidade

Tokens com contraste AA (`src/style.css`, `@theme`), foco visível de 2 px com offset, alvos de 44 px ou mais,
severidade sempre com ícone + texto, `aria-pressed` nos filtros, `aria-live` no "Copiado", e
`prefers-reduced-motion` desliga as animações. Em telas de até 767 px o trilho vira barra inferior fixa.

## Créditos

Inspiração visual: shot "Fintech Web App UI Design" de Ronas IT no Dribbble (https://dribbble.com/shots/26042215-Fintech-Web-App-UI-Design).
