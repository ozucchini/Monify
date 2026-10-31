# Monify — base (backend + banco + Telegram)
Fase 1 entregue: schema Supabase com RLS, cifragem do token, conexão/desconexão do bot,
webhook validado e idempotente, interpretador de mensagens plugável, comandos do bot.

## Configurar
1. Crie um projeto no Supabase e rode `supabase/migrations/0001_init.sql`.
2. `cp .env.example .env.local` e preencha (gere TOKEN_ENCRYPTION_KEY com `openssl rand -base64 32`).
3. Crie o bot no @BotFather e copie o token.
4. O webhook exige URL HTTPS pública (deploy na Vercel ou ngrok em dev).
5. Em Assistente Telegram, cole o token e conecte; mande /start ao bot.

## Pendente (próximas fases)
create-next-app + shadcn, clientes Supabase (`lib/supabase/{server,admin}.ts`),
layout/sidebar, dashboard, transações, orçamentos, relatórios, chat e seed de categorias.
