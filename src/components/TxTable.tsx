import { brl } from "@/lib/format";
import { fmtDate } from "@/lib/date";
import type { Category, TxRow } from "@/lib/dashboard";
import { TxActions } from "./TxActions";

export function TxTable({ rows, categories, actions = false }: { rows: TxRow[]; categories?: Category[]; actions?: boolean }) {
  if (!rows.length) return <div className="empty">Nenhuma transação por aqui ainda.</div>;
  return (
    <div className="tw">
      <table className={actions ? "" : "slim"} style={actions ? { minWidth: 720 } : undefined}>
        <thead>
          <tr>
            <th>Descrição</th><th>Categoria</th><th className={actions ? "" : "hm"}>Data</th><th className={actions ? "" : "hm"}>Status</th>
            <th style={{ textAlign: "right" }}>Valor</th>
            {actions && <th style={{ textAlign: "right" }}>Ações</th>}
          </tr>
        </thead>
        <tbody>
          {rows.map((t) => (
            <tr key={t.id}>
              <td>{t.description}{t.source === "telegram" && <span title="Registrada pelo Telegram" style={{ color: "var(--mut)" }}> ✈</span>}{t.status === "pending" && !actions && <span className="pm st pe"> · pendente</span>}</td>
              <td><span className="tag">{t.category ?? "Sem categoria"}</span></td>
              <td className={actions ? "" : "hm"} style={{ color: "var(--mut)" }}>{fmtDate(t.date)}</td>
              <td className={`st ${t.status === "confirmed" ? "ok" : "pe"} ${actions ? "" : "hm"}`}>{t.status === "confirmed" ? "Confirmado" : "Pendente"}</td>
              <td className="amt" style={{ color: t.type === "income" ? "var(--ok)" : "var(--org)" }}>
                {t.type === "income" ? "+" : "−"} {brl(t.amount)}
              </td>
              {actions && <td><TxActions tx={t} categories={categories ?? []} /></td>}
            </tr>
          ))}
        </tbody>
      </table>
    </div>
  );
}
