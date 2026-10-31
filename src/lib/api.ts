import { NextResponse } from "next/server";
import { isAuthed } from "@/lib/auth";

export const json = (data: unknown, status = 200) => NextResponse.json(data, { status });
export const fail = (error: string, status = 400) => NextResponse.json({ error }, { status });

/** Retorna uma resposta 401 quando não autenticado, ou null quando está tudo certo. */
export async function guard() {
  return (await isAuthed()) ? null : fail("Não autenticado", 401);
}
