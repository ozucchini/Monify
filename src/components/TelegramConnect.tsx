"use client";
import { useState } from "react";
import { useRouter } from "next/navigation";

export function TelegramConnect() {
  const router = useRouter();
  const [err, setErr] = useState("");
  const [busy, setBusy] = useState(false);

  async function submit(e: React.FormEvent<HTMLFormElement>) {
    e.preventDefault();
    const token = String(new FormData(e.currentTarget).get("token") ?? "");
    setBusy(true); setErr("");
    const res = await fetch("/api/telegram/connect", { method: "POST", headers: { "Content-Type": "application/json" }, body: JSON.stringify({ token }) });
    setBusy(false);
    if (!res.ok) return setErr((await res.json().catch(() => ({}))).error ?? "Não foi possível conectar.");
    router.refresh();
  }

  return (
    <form onSubmit={submit}>
      <label className="field">Token do bot (criado com o @BotFather)
        <input name="token" type="password" placeholder="123456789:AA…" required autoComplete="off" spellCheck={false} />
      </label>
      {err && <div className="flash err" role="alert">{err}</div>}
      <button className="btn" disabled={busy} style={{ marginTop: 6 }}>{busy ? "Conectando…" : "Conectar bot"}</button>
    </form>
  );
}

export function TelegramDisconnect() {
  const router = useRouter();
  return (
    <button className="btn ghost danger" onClick={async () => {
      if (!confirm("Desconectar o bot? O histórico de transações é mantido.")) return;
      await fetch("/api/telegram/connect", { method: "DELETE" });
      router.refresh();
    }}>Desconectar</button>
  );
}
