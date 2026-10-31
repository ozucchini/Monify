import { getCategorySummary } from "@/lib/dashboard";
import { brl } from "@/lib/format";

export const metadata = { title: "Categorias" };

export default async function Page() {
  const rows = await getCategorySummary();
  const groups = [{ t: "expense", title: "Despesas" }, { t: "income", title: "Receitas" }] as const;
  return (
    <>
      <div className="page-h"><h1 className="serif">Categorias</h1><p>Totais confirmados no mês atual</p></div>
      <div className="g2" style={{ gridTemplateColumns: "1fr 1fr" }}>
        {groups.map((g) => (
          <div className="card" key={g.t}>
            <h2 className="serif">{g.title}</h2><div className="sub">Categoria · transações · total do mês</div>
            <table className="cal">
              <tbody>
                {rows.filter((r) => r.type === g.t).map((r) => (
                  <tr key={r.id}>
                    <td style={{ color: "var(--tx)" }}>{r.name}</td>
                    <td>{r.tx_count} {r.tx_count === 1 ? "transação" : "transações"}</td>
                    <td className="amt">{brl(r.month_total)}</td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        ))}
      </div>
    </>
  );
}
