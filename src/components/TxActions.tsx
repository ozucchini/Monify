"use client";
import { useState } from "react";
import { useRouter } from "next/navigation";
import type { Category, TxRow } from "@/lib/dashboard";

export function TxActions({ tx, categories }: { tx: TxRow; categories: Category[] }) {
  const router = useRouter();
  const [busy, setBusy] = useState(false);
  const [cat, setCat] = useState(tx.category_id ?? "");
  const opts = categories.filter((c) => c.type === tx.type);

  async function call(method: "PATCH" | "DELETE", body?: object) {
    setBusy(true);
    const res = await fetch(`/api/transactions/${tx.id}`, { method, headers: { "Content-Type": "application/json" }, body: body ? JSON.stringify(body) : undefined });
    setBusy(false);
    if (!res.ok) return alert((await res.json().catch(() => ({}))).error ?? "Não foi possível concluir.");
    router.refresh();
  }

  return (
    <div className="row-act">
      {tx.status === "pending" && (
        <>
          <select aria-label="Categoria" value={cat} onChange={(e) => setCat(e.target.value)}>
            <option value="">{tx.category ?? "Categoria"}</option>
            {opts.map((c) => <option key={c.id} value={c.id}>{c.name}</option>)}
          </select>
          <button className="btn sm" disabled={busy} onClick={() => call("PATCH", { status: "confirmed", ...(cat ? { category_id: cat } : {}) })}>Confirmar</button>
        </>
      )}
      <button className="btn sm ghost danger" disabled={busy} aria-label={`Excluir ${tx.description}`}
        onClick={() => { if (confirm(`Excluir “${tx.description}”?`)) call("DELETE"); }}>Excluir</button>
    </div>
  );
}
