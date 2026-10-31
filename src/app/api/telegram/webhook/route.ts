import { NextResponse } from "next/server";
import { timingSafeEqual } from "crypto";
import { sql } from "@/lib/db";
import { decrypt } from "@/lib/crypto";
import { sendMessage } from "@/lib/telegram/api";
import { processText } from "@/lib/finance/process";

export const dynamic = "force-dynamic";

const same = (a: string, b: string) => {
  const x = Buffer.from(a), y = Buffer.from(b);
  return x.length === y.length && timingSafeEqual(x, y);
};
const ok = () => NextResponse.json({ ok: true });

export async function POST(req: Request) {
  const [integ] = await sql`select * from telegram_integration where id = 1`;
  if (!integ) return NextResponse.json({ ok: false }, { status: 404 });
  if (!same(req.headers.get("x-telegram-bot-api-secret-token") ?? "", integ.webhook_secret))
    return NextResponse.json({ ok: false }, { status: 401 });

  try {
    const update = await req.json();
    const msg = update?.message;
    if (!msg?.text || typeof update.update_id !== "number") return ok();
    const token = decrypt(integ.bot_token_enc);
    const chatId = Number(msg.chat.id);

    // Pareamento: o primeiro chat só vira dono ao enviar "/start <código>" (código mostrado no painel).
    if (!integ.chat_id) {
      const code = String(msg.text).trim().split(/\s+/)[1] ?? "";
      if (!integ.pairing_code || !String(msg.text).startsWith("/start") || !same(code, integ.pairing_code)) {
        await sendMessage(token, chatId, "Para conectar, envie /start seguido do código mostrado no painel do Monify.");
        return ok();
      }
      await sql`update telegram_integration set chat_id = ${chatId}, pairing_code = null where id = 1`;
    } else if (Number(integ.chat_id) !== chatId) {
      return ok(); // outros chats são ignorados
    }

    const ins = await sql`insert into telegram_messages (direction, text, update_id)
      values ('in', ${String(msg.text).slice(0, 500)}, ${update.update_id}) on conflict (update_id) do nothing returning id`;
    if (!ins.length) return ok(); // update repetido

    const isPairing = !integ.chat_id;
    const reply = isPairing
      ? "✅ Bot conectado ao seu painel! Registre gastos em linguagem natural ou use /ajuda."
      : await processText(String(msg.text), `tg:${update.update_id}`);

    await sendMessage(token, chatId, reply);
    await sql`insert into telegram_messages (direction, text) values ('out', ${reply})`;
  } catch (e) {
    // Responder 200 evita que o Telegram reenvie o mesmo update em loop.
    console.error("webhook telegram", e);
  }
  return ok();
}
