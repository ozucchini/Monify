import Link from "next/link";
import { getCategories, getOverview, parsePeriod } from "@/lib/dashboard";
import { brl, pct } from "@/lib/format";
import { MONTHS_LONG, todaySP } from "@/lib/date";
import { Icon } from "@/components/icons";
import { FlowChart, Donut } from "@/components/charts";
import { PeriodSelect } from "@/components/PeriodSelect";
import { NewTxButton } from "@/components/NewTxButton";
import { TxTable } from "@/components/TxTable";
import { Chat } from "@/components/Chat";

type Delta = ReturnType<typeof pct>;
function DeltaText({ d, invert = false, suffix = "" }: { d: Delta; invert?: boolean; suffix?: string }) {
  if (!d) return <span className="d" style={{ color: "var(--mut)" }}>sem base de comparação</span>;
  const good = invert ? !d.up : d.up;
  return <span className={`d ${good ? "up" : "dn"}`}>{d.up ? "▲" : "▼"} {d.text}{suffix}</span>;
}

export default async function Overview({ searchParams }: { searchParams: Promise<{ periodo?: string }> }) {
  const period = parsePeriod((await searchParams).periodo);
  const [o, categories] = await Promise.all([getOverview(period), getCategories()]);
  const today = todaySP();
  const vs = period === "mes" ? " vs. mês anterior" : " vs. período anterior";
  const dSaved = pct(o.saved, o.savedPrev), dBal = pct(o.balance, o.balanceBefore);
  const dateLabel = new Date().toLocaleDateString("pt-BR", { weekday: "long", day: "2-digit", month: "long", year: "numeric", timeZone: "America/Sao_Paulo" });
  const mLong = MONTHS_LONG[Number(today.slice(5, 7)) - 1];
  const catSub = period === "mes" ? `${mLong[0].toUpperCase()}${mLong.slice(1)} de ${today.slice(0, 4)}` : period === "3m" ? "Últimos 3 meses" : `Ano de ${today.slice(0, 4)}`;

  const kpis = [
    { label: "Saldo total", value: o.balance, d: dBal, icon: "home", color: "#0297DE", invert: false },
    { label: "Receitas do período", value: o.cur.income, d: pct(o.cur.income, o.prev.income), icon: "up", color: "#0297DE", invert: false },
    { label: "Despesas do período", value: o.cur.expense, d: pct(o.cur.expense, o.prev.expense), icon: "dn", color: "#FC734D", invert: true },
    { label: "Economia do período", value: o.saved, d: dSaved, icon: "tgt", color: "#FC734D", invert: false },
  ];

  return (
    <>
      <div className="top">
        <p className="cap">{dateLabel}</p>
        <div className="act">
          <PeriodSelect value={period} />
          <Link className="bell" href="/transacoes?tipo=pending" title={o.pending ? `${o.pending} pendente(s)` : "Sem notificações"} aria-label="Notificações">
            <Icon k="bell" size={17} stroke="#8C9AA3" />{o.pending > 0 && <b />}
          </Link>
        </div>
      </div>

      <section className="hero">
        <div className="stat"><b className="serif">{brl(o.saved)}</b><span>Economia {period === "mes" ? "deste mês" : "do período"}</span><DeltaText d={dSaved} suffix={vs} /></div>
        <div className="ctr">
          {o.telegram
            ? <span className="pill"><i />Bot do Telegram conectado</span>
            : <span className="pill off"><i /><Link href="/telegram">Conectar bot do Telegram</Link></span>}
          <h1 className="serif">Suas finanças na velocidade da <em>conversa</em></h1>
          <p>Mande uma mensagem ao seu assistente e o gasto entra no painel na hora.</p>
          <div className="cta">
            <NewTxButton categories={categories} today={today} />
            <a className="btn ghost" href="#chat">Falar com o bot</a>
          </div>
        </div>
        <div className="stat r"><b className="serif">{brl(o.balance)}</b><span>Saldo total</span><DeltaText d={dBal} suffix={vs} /></div>
      </section>

      {o.pending > 0 && (
        <div className="flash" role="status" style={{ marginTop: 14 }}>
          {o.pending === 1 ? "1 transação aguarda" : `${o.pending} transações aguardam`} confirmação de categoria. <Link href="/transacoes?tipo=pending" style={{ textDecoration: "underline" }}>Revisar agora</Link>
        </div>
      )}

      <section className="kp">
        {kpis.map((k) => (
          <div className="card" key={k.label}>
            <Icon k={k.icon} size={18} stroke={k.color} className="kpi" />
            <span>{k.label}</span><b>{brl(k.value)}</b>
            <DeltaText d={k.d} invert={k.invert} />
          </div>
        ))}
      </section>

      <section className="g2">
        <div className="card">
          <h2 className="serif">Fluxo financeiro</h2><div className="sub">Receitas e despesas nos últimos 6 meses</div>
          <FlowChart data={o.flow} />
          <div className="leg"><span><i style={{ background: "var(--blue)" }} />Receitas</span><span><i style={{ background: "var(--org)" }} />Despesas</span></div>
        </div>
        <div className="card">
          <h2 className="serif">Para onde foi o dinheiro</h2><div className="sub">{catSub}</div>
          <div className="dw">
            <Donut cats={o.cats} income={o.cur.income} />
            <div className="cl">
              {o.cats.length === 0 && <span className="sub">Sem despesas no período.</span>}
              {o.cats.map((c) => <div key={c.name}><span><i style={{ background: c.color }} />{c.name}</span><b>{brl(c.total)}</b></div>)}
            </div>
          </div>
          <h2 className="serif" style={{ marginTop: 18 }}>Orçamentos</h2><div className="sub">Limites do mês</div>
          {o.budgets.length === 0 && <div className="sub">Nenhum orçamento definido. <Link href="/orcamentos" style={{ textDecoration: "underline" }}>Criar</Link></div>}
          {o.budgets.slice(0, 4).map((b) => {
            const r = b.spent / b.lim, hot = r >= 0.8;
            return (
              <div key={b.category_id}>
                <div className="bm"><span>{b.name}{r > 1 ? " · limite excedido" : hot ? " · atenção" : ""}</span><span style={{ color: "var(--mut)" }}>{brl(b.spent)} / {brl(b.lim)}</span></div>
                <div className="bar"><span style={{ width: `${Math.min(r * 100, 100)}%`, ...(hot ? { background: "linear-gradient(90deg,#FC734D,#FDA48A)" } : {}) }} /></div>
              </div>
            );
          })}
        </div>
      </section>

      <section className="g2">
        <div className="card">
          <h2 className="serif">Últimas transações</h2><div className="sub">Inclui as registradas pelo Telegram · <Link href="/transacoes" style={{ textDecoration: "underline" }}>ver todas</Link></div>
          <TxTable rows={o.recent} />
        </div>
        <div className="card chat" id="chat">
          <h2 className="serif">Assistente Telegram</h2>
          <Chat initial={o.messages} bot={o.telegram?.paired ? o.telegram.username : null} />
        </div>
      </section>
    </>
  );
}
