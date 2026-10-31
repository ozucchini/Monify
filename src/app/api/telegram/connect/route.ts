import { NextResponse } from "next/server";
import { randomBytes } from "crypto";
import { z } from "zod";
import { sql } from "@/lib/db";
import { isAuthed } from "@/lib/auth";
import { encrypt, decrypt } from "@/lib/crypto";
import { getMe, setWebhook, deleteWebhook } from "@/lib/telegram/api";

const schema = z.object({ token: z.string().regex(/^\d+:[\w-]{30,}$/, "Token inválido") });

export async function POST(req: Request) {
  if (!(await isAuthed())) return NextResponse.json({ error: "Não autenticado" }, { status: 401 });
  const parsed = schema.safeParse(await req.json());
  if (!parsed.success) return NextResponse.json({ error: parsed.error.issues[0].message }, { status: 400 });
  try {
    const { token } = parsed.data;
    const bot = await getMe(token);
    const secret = randomBytes(24).toString("hex");
    await setWebhook(token, `${process.env.NEXT_PUBLIC_APP_URL}/api/telegram/webhook`, secret);
    await sql`insert into telegram_integration (id, bot_token_enc, bot_username, webhook_secret)
      values (1, ${encrypt(token)}, ${bot.username}, ${secret})
      on conflict (id) do update set bot_token_enc = excluded.bot_token_enc,
        bot_username = excluded.bot_username, webhook_secret = excluded.webhook_secret, chat_id = null`;
    return NextResponse.json({ bot: { username: bot.username, name: bot.first_name } });
  } catch (e) {
    return NextResponse.json({ error: (e as Error).message }, { status: 400 });
  }
}

export async function DELETE() {
  if (!(await isAuthed())) return NextResponse.json({ error: "Não autenticado" }, { status: 401 });
  const [row] = await sql`select bot_token_enc from telegram_integration where id = 1`;
  if (row) await deleteWebhook(decrypt(row.bot_token_enc)).catch(() => {});
  await sql`delete from telegram_integration where id = 1`;
  return NextResponse.json({ ok: true });
}
