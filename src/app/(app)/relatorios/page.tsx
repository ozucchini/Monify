import { getMonthlyReport } from "@/lib/dashboard";
import { brl } from "@/lib/format";
import { FlowChart } from "@/components/charts";

export const metadata = { title: "Relatórios" };

export default async function Page() {
  const rows = await getMonthlyReport(12);
  const tot = rows.reduce((s, r) => ({ income: s.income + r.income, expense: s.expense + r.expense }), { income: 0, expense: 0 });
  return (
    <>
      <div className="page-h"><h1 className="serif">Relatórios</h1><p>Últimos 12 meses, apenas transações confirmadas</p></div>
      <div className="card" style={{ marginBottom: 14 }}>
        <FlowChart data={rows.map((r) => ({ ...r, label: r.label.slice(0, 3) }))} />
        <div className="leg"><span><i style={{ background: "var(--blue)" }} />Receitas</span><span><i style={{ background: "var(--org)" }} />Despesas</span></div>
      </div>
      <div className="card tw">
        <table style={{ minWidth: 520 }}>
          <thead><tr><th>Mês</th><th style={{ textAlign: "right" }}>Receitas</th><th style={{ textAlign: "right" }}>Despesas</th><th style={{ textAlign: "right" }}>Economia</th></tr></thead>
          <tbody>
            {[...rows].reverse().map((r) => (
              <tr key={r.key}>
                <td>{r.label}</td>
                <td className="amt" style={{ color: "var(--ok)" }}>{brl(r.income)}</td>
                <td className="amt" style={{ color: "var(--org)" }}>{brl(r.expense)}</td>
                <td className="amt">{brl(r.income - r.expense)}</td>
              </tr>
            ))}
            <tr>
              <td><b>Total</b></td>
              <td className="amt">{brl(tot.income)}</td><td className="amt">{brl(tot.expense)}</td><td className="amt">{brl(tot.income - tot.expense)}</td>
            </tr>
          </tbody>
        </table>
      </div>
    </>
  );
}
