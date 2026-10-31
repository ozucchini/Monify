"use client";
import { useRef, useState } from "react";
import { useRouter } from "next/navigation";
import type { Category } from "@/lib/dashboard";

const parseBR = (v: string) => {
  const s = v.replace(/[^\d.,]/g, "");
  return Number(s.includes(",") ? s.replace(/\./g, "").replace(",", ".") : s);
};

export function NewTxButton({ categories, today, className = "btn", label = "+ Nova transação" }: { categories: Category[]; today: string; className?: string; label?: string }) {
  const ref = useRef<HTMLDialogElement>(null);
  const router = useRouter();
  const [type, setType] = useState<"expense" | "income">("expense");
  const [err, setErr] = useState("");
  const [busy, setBusy] = useState(false);
  const cats = categories.filter((c) => c.type === type);

  async function submit(e: React.FormEvent<HTMLFormElement>) {
    e.preventDefault();
    const f = new FormData(e.currentTarget);
    const amount = parseBR(String(f.get("amount") ?? ""));
    if (!(amount > 0)) return setErr("Informe um valor maior que zero.");
    setBusy(true); setErr("");
    const res = await fetch("/api/transactions", {
      method: "POST", headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        type, amount, description: String(f.get("description") ?? ""), occurred_on: String(f.get("date")),
        category_id: String(f.get("category") ?? "") || null,
        payment_method: String(f.get("method") ?? "") || null,
      }),
    });
    setBusy(false);
    if (!res.ok) return setErr((await res.json().catch(() => ({}))).error ?? "Erro ao salvar.");
    e.currentTarget.reset(); setType("expense");
    ref.current?.close();
    router.refresh();
  }

  return (
    <>
      <button className={className} onClick={() => { setErr(""); ref.current?.showModal(); }}>{label}</button>
      <dialog ref={ref} aria-labelledby="ntx-t" onClick={(e) => { if (e.target === ref.current) ref.current?.close(); }}>
        <h2 className="serif" id="ntx-t">Nova transação</h2>
        <form onSubmit={submit}>
          <div className="seg field" role="radiogroup" aria-label="Tipo">
            <label><input type="radio" name="type" checked={type === "expense"} onChange={() => setType("expense")} /><span>Despesa</span></label>
            <label><input type="radio" name="type" checked={type === "income"} onChange={() => setType("income")} /><span>Receita</span></label>
          </div>
          <div className="two">
            <label className="field">Valor (R$)<input name="amount" inputMode="decimal" placeholder="0,00" required autoComplete="off" /></label>
            <label className="field">Data<input name="date" type="date" defaultValue={today} required /></label>
          </div>
          <label className="field">Descrição<input name="description" maxLength={120} required placeholder="Ex.: Almoço" autoComplete="off" /></label>
          <div className="two">
            <label className="field">Categoria
              <select name="category" key={type} defaultValue="">
                <option value="">Sem categoria</option>
                {cats.map((c) => <option key={c.id} value={c.id}>{c.name}</option>)}
              </select>
            </label>
            <label className="field">Pagamento (opcional)<input name="method" maxLength={40} placeholder="Pix, cartão…" /></label>
          </div>
          {err && <div className="flash err" role="alert">{err}</div>}
          <div className="dlg-act">
            <button type="button" className="btn ghost" onClick={() => ref.current?.close()}>Cancelar</button>
            <button className="btn" disabled={busy}>{busy ? "Salvando…" : "Salvar"}</button>
          </div>
        </form>
      </dialog>
    </>
  );
}
