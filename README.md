# Monify (Neon, uso pessoal)
Fase 1 entregue: schema Supabase com RLS, cifragem do token, conexão/desconexão do bot,
webhook validado e idempotente, interpretador de mensagens plugável, comandos do bot.

## Configurar
1. Neon: crie um banco novo e rode `db/schema.sql` no SQL Editor.
2. `cp .env.example .env.local` e preencha (DATABASE_URL, senha do painel, segredos).
3. `npm i @neondatabase/serverless zod`.
4. URL pública com HTTPS (ngrok em dev, Vercel em produção) em NEXT_PUBLIC_APP_URL.
5. Em Assistente Telegram, cole o token do bot e conecte; envie /start ao bot.
