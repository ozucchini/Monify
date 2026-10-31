"use client";
import { useState } from "react";
import { useRouter } from "next/navigation";
import type { Category } from "@/lib/dashboard";

export function BudgetForm({ categories }: { categories: Category[] }) {
  const router = useRouter();
  const [err, setErr] = useState("");
  const [busy, setBusy] = useState(false);

  async function submit(e: React.FormEvent<HTMLFormElement>) {
    e.preventDefault();
    const f = new FormData(e.currentTarget);
    const raw = String(f.get("limit")).replace(/[^\d.,]/g, "");
    const limit = Number(raw.includes(",") ? raw.replace(/\./g, "").replace(",", ".") : raw);
    if (!(limit > 0)) return setErr("Informe um limite maior que zero.");
    setBusy(true); setErr("");
    const res = await fetch("/api/budgets", { method: "PUT", headers: { "Content-Type": "application/json" }, body: JSON.stringify({ category_id: f.get("category"), monthly_limit: limit }) });
    setBusy(false);
    if (!res.ok) return setErr((await res.json().catch(() => ({}))).error ?? "Erro ao salvar.");
    e.currentTarget.reset(); router.refresh();
  }

  return (
    <form onSubmit={submit}>
      <div className="two">
        <label className="field">Categoria
          <select name="category" required defaultValue="">
            <option value="" disabled>Escolha…</option>
            {categories.filter((c) => c.type === "expense").map((c) => <option key={c.id} value={c.id}>{c.name}</option>)}
          </select>
        </label>
        <label className="field">Limite mensal (R$)<input name="limit" inputMode="decimal" placeholder="1.200,00" required autoComplete="off" /></label>
      </div>
      {err && <div className="flash err" role="alert">{err}</div>}
      <button className="btn" disabled={busy} style={{ marginTop: 8 }}>{busy ? "Salvando…" : "Salvar orçamento"}</button>
    </form>
  );
}

export function BudgetDelete({ categoryId, name }: { categoryId: string; name: string }) {
  const router = useRouter();
  return (
    <button className="btn sm ghost danger" aria-label={`Remover orçamento de ${name}`}
      onClick={async () => {
        if (!confirm(`Remover o orçamento de ${name}?`)) return;
        await fetch("/api/budgets", { method: "DELETE", headers: { "Content-Type": "application/json" }, body: JSON.stringify({ category_id: categoryId }) });
        router.refresh();
      }}>Remover</button>
  );
}
