"use client";
import { useState } from "react";
import { useRouter } from "next/navigation";

export function LoginForm() {
  const router = useRouter();
  const [err, setErr] = useState("");
  const [busy, setBusy] = useState(false);

  async function submit(e: React.FormEvent<HTMLFormElement>) {
    e.preventDefault();
    setBusy(true); setErr("");
    const password = String(new FormData(e.currentTarget).get("password") ?? "");
    const res = await fetch("/api/login", { method: "POST", headers: { "Content-Type": "application/json" }, body: JSON.stringify({ password }) });
    if (!res.ok) { setBusy(false); return setErr((await res.json().catch(() => ({}))).error ?? "Erro ao entrar."); }
    router.replace("/"); router.refresh();
  }

  return (
    <main className="login">
      <form className="card" onSubmit={submit}>
        <div className="logo serif" style={{ padding: 0 }}><i />Monify</div>
        <h1 className="serif">Bem-vindo de volta</h1>
        <p className="sub" style={{ marginBottom: 18 }}>Digite a senha do seu painel.</p>
        <label className="field">Senha
          <input name="password" type="password" required autoFocus autoComplete="current-password" />
        </label>
        {err && <div className="flash err" role="alert">{err}</div>}
        <button className="btn" disabled={busy} style={{ width: "100%", marginTop: 12 }}>{busy ? "Entrando…" : "Entrar"}</button>
      </form>
    </main>
  );
}
