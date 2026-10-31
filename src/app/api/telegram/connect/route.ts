import { randomBytes, randomInt } from "crypto";
import { z } from "zod";
import { sql } from "@/lib/db";
import { encrypt, decrypt } from "@/lib/crypto";
import { fail, guard, json } from "@/lib/api";
import { getMe, setWebhook, deleteWebhook } from "@/lib/telegram/api";

const schema = z.object({ token: z.string().trim().regex(/^\d+:[\w-]{30,}$/, "Token inválido") });

export async function POST(req: Request) {
  const denied = await guard(); if (denied) return denied;
  const parsed = schema.safeParse(await req.json().catch(() => ({})));
  if (!parsed.success) return fail(parsed.error.issues[0].message);

  const appUrl = (process.env.NEXT_PUBLIC_APP_URL ?? "").replace(/\/+$/, "");
  if (!appUrl.startsWith("https://")) return fail("Defina NEXT_PUBLIC_APP_URL com uma URL pública HTTPS (ngrok em dev, Vercel em produção).");

  try {
    const { token } = parsed.data;
    const bot = await getMe(token);
    const secret = randomBytes(24).toString("hex");
    const pairing = String(randomInt(100000, 1000000));
    await setWebhook(token, `${appUrl}/api/telegram/webhook`, secret);
    await sql`insert into telegram_integration (id, bot_token_enc, bot_username, webhook_secret, pairing_code)
      values (1, ${encrypt(token)}, ${bot.username}, ${secret}, ${pairing})
      on conflict (id) do update set bot_token_enc = excluded.bot_token_enc, bot_username = excluded.bot_username,
        webhook_secret = excluded.webhook_secret, pairing_code = excluded.pairing_code, chat_id = null`;
    return json({ bot: { username: bot.username, name: bot.first_name }, pairing });
  } catch (e) {
    return fail((e as Error).message);
  }
}

export async function DELETE() {
  const denied = await guard(); if (denied) return denied;
  const [row] = await sql`select bot_token_enc from telegram_integration where id = 1`;
  if (row) await deleteWebhook(decrypt(row.bot_token_enc)).catch(() => {});
  await sql`delete from telegram_integration where id = 1`;
  return json({ ok: true });
}
