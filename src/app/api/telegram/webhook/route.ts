import { NextResponse } from "next/server";
import { sql } from "@/lib/db";
import { decrypt } from "@/lib/crypto";
import { sendMessage } from "@/lib/telegram/api";
import { RuleBasedInterpreter } from "@/lib/finance/parser";
import { handleIntent, handleCommand } from "@/lib/finance/handlers";

const interpreter = new RuleBasedInterpreter();

export async function POST(req: Request) {
  const [integ] = await sql`select * from telegram_integration where id = 1`;
  if (!integ) return NextResponse.json({ ok: false }, { status: 404 });
  if (req.headers.get("x-telegram-bot-api-secret-token") !== integ.webhook_secret)
    return NextResponse.json({ ok: false }, { status: 401 });

  const update = await req.json();
  const msg = update?.message;
  if (!msg?.text) return NextResponse.json({ ok: true });

  // Primeiro chat a falar com o bot vira o dono; os demais são ignorados
  if (!integ.chat_id) await sql`update telegram_integration set chat_id = ${msg.chat.id} where id = 1`;
  else if (Number(integ.chat_id) !== msg.chat.id) return NextResponse.json({ ok: true });

  const ins = await sql`insert into telegram_messages (direction, text, update_id)
    values ('in', ${msg.text}, ${update.update_id}) on conflict (update_id) do nothing returning id`;
  if (!ins.length) return NextResponse.json({ ok: true }); // update repetido

  const reply = msg.text.startsWith("/")
    ? await handleCommand(msg.text)
    : await handleIntent(await interpreter.interpret(msg.text), `tg:${update.update_id}`);

  await sendMessage(decrypt(integ.bot_token_enc), msg.chat.id, reply);
  await sql`insert into telegram_messages (direction, text) values ('out', ${reply})`;
  return NextResponse.json({ ok: true });
}
