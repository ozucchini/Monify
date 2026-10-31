# Monify

Painel financeiro pessoal com assistente no Telegram. Next.js 15 (App Router) + Neon (Postgres serverless).

Você manda “gastei 35 no almoço” para o bot (ou digita no chat do painel) e a transação aparece no dashboard.

## O que tem

- **Dashboard** (`/`): saldo, economia, KPIs com variação, fluxo de 6 meses, gastos por categoria, orçamentos, últimas transações e chat. Seletor de período (mês, 3 meses, ano).
- **Transações / Receitas / Despesas**: lista, nova transação, confirmar pendentes (escolhendo a categoria) e excluir.
- **Categorias**, **Orçamentos** (limite mensal por categoria), **Relatórios** (12 meses) e **Configurações** (exportar CSV, sair).
- **Assistente Telegram**: conecta o bot, pareia o seu chat com um código, comandos `/saldo /gastos /receitas /resumo /ajuda` e linguagem natural.
- Login por senha com cookie assinado (7 dias), token do bot cifrado (AES-256-GCM), webhook validado por segredo e idempotente.

## Configurar

1. **Neon**: crie um banco e rode `db/schema.sql` no SQL Editor. (Opcional, só em banco de testes: `db/seed-demo.sql` para ver o painel preenchido.)
2. `cp .env.example .env.local` e preencha:
   - `DATABASE_URL` (connection string do Neon)
   - `DASHBOARD_PASSWORD` (senha do painel)
   - `AUTH_SECRET` → `openssl rand -hex 32`
   - `TOKEN_ENCRYPTION_KEY` → `openssl rand -base64 32`
   - `NEXT_PUBLIC_APP_URL` → URL pública com HTTPS, sem barra no final
3. `npm install`
4. `npm run dev` (em dev, exponha com `ngrok http 3000` e use a URL https em `NEXT_PUBLIC_APP_URL`).
5. Entre no painel → **Assistente Telegram** → cole o token do @BotFather → envie ao bot o código `/start 123456` mostrado na tela.

## Deploy (Vercel)

Importe o repositório, cadastre as 5 variáveis de ambiente e faça o deploy. Depois, em **Assistente Telegram**, conecte o bot (isso registra o webhook em `/api/telegram/webhook`).

## Scripts

| Comando | O que faz |
| --- | --- |
| `npm run dev` / `build` / `start` | Next.js |
| `npm run typecheck` | TypeScript sem emitir arquivos |
| `npm test` | Testes do interpretador de mensagens (Node 22+, sem dependências) |

## Estrutura

```
db/                    schema.sql, seed-demo.sql
preview/dashboard.html prévia estática original do design
src/app/(app)/         páginas protegidas (visão geral, transações, …)
src/app/api/           login, transações, orçamentos, chat, export, telegram
src/components/        UI (gráficos SVG no servidor, formulários no cliente)
src/lib/finance/       parser (regras), handlers, pipeline único (process.ts)
src/lib/dashboard.ts   todas as consultas do painel
```

## Trocar o interpretador por um LLM

`src/lib/finance/process.ts` usa a interface `MessageInterpreter`. Implemente `interpret(text)` devolvendo um `ParsedIntent` e troque a instância; webhook e chat do painel passam a usar o novo.

## Notas

- Datas e “mês atual” usam o fuso `America/Sao_Paulo`.
- Mensagens sem categoria reconhecida entram como **pendente** e não contam nos totais até serem confirmadas no painel.
- Banco já criado com a versão anterior do schema? Rode: `alter table telegram_integration add column if not exists pairing_code text;`
