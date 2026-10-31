import { NextResponse } from "next/server";
import { checkPassword, startSession } from "@/lib/auth";

export async function POST(req: Request) {
  const { password } = await req.json().catch(() => ({}));
  if (typeof password !== "string" || !checkPassword(password))
    return NextResponse.json({ error: "Senha incorreta" }, { status: 401 });
  await startSession();
  return NextResponse.json({ ok: true });
}
