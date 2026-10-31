import { brl } from "@/lib/format";

const W = 640, H = 220, L = 40, B = 28;
// arredonda o teto para um múltiplo de 3 "redondo" (ex.: 7.850 -> 9.000) para os 4 traços da grade
const niceMax = (v: number) => {
  if (v <= 0) return 3000;
  const raw = v * 1.05;
  const unit = 10 ** Math.floor(Math.log10(raw / 3));
  return Math.ceil(raw / (3 * unit)) * 3 * unit;
};

export function FlowChart({ data }: { data: { label: string; income: number; expense: number }[] }) {
  const mx = niceMax(Math.max(...data.flatMap((d) => [d.income, d.expense])));
  const n = data.length - 1 || 1;
  const x = (i: number) => L + (i * (W - L - 28)) / n;
  const y = (v: number) => H - B - (v / mx) * (H - B - 12);
  const path = (k: "income" | "expense") => data.map((d, i) => `${i ? "L" : "M"}${x(i)} ${y(d[k])}`).join(" ");
  const ticks = [0, 1, 2, 3].map((i) => (mx / 3) * i);
  const k = (v: number) => (v >= 1000 ? `${+(v / 1000).toFixed(1)}k` : String(Math.round(v)));
  const empty = data.every((d) => !d.income && !d.expense);
  return (
    <svg className="flow" viewBox={`0 0 ${W} ${H}`} width="100%" role="img" aria-label="Receitas e despesas dos últimos 6 meses">
      <defs>
        <linearGradient id="gb" x1="0" y1="0" x2="0" y2="1">
          <stop offset="0" stopColor="#0297DE" stopOpacity=".35" />
          <stop offset="1" stopColor="#0297DE" stopOpacity="0" />
        </linearGradient>
      </defs>
      {ticks.map((v) => (
        <g key={v}>
          <line x1={L} x2={W - 10} y1={y(v)} y2={y(v)} stroke="rgba(255,255,255,.07)" />
          <text x={0} y={y(v) + 4}>{k(v)}</text>
        </g>
      ))}
      {data.map((d, i) => <text key={d.label + i} x={x(i)} y={H - 8} textAnchor="middle">{d.label}</text>)}
      <path d={`${path("income")} L${x(n)} ${y(0)} L${x(0)} ${y(0)}Z`} fill="url(#gb)" />
      <path d={path("income")} fill="none" stroke="#0297DE" strokeWidth={2.5} strokeLinejoin="round" />
      <path d={path("expense")} fill="none" stroke="#FC734D" strokeWidth={2.5} strokeLinejoin="round" />
      {data.map((d, i) => (
        <g key={i}>
          <circle cx={x(i)} cy={y(d.income)} r={3.5} fill="#0297DE"><title>{`${d.label}: ${brl(d.income)}`}</title></circle>
          <circle cx={x(i)} cy={y(d.expense)} r={3.5} fill="#FC734D"><title>{`${d.label}: ${brl(d.expense)}`}</title></circle>
        </g>
      ))}
      {empty && <text x={W / 2} y={H / 2 - 10} textAnchor="middle">Sem movimentações ainda</text>}
    </svg>
  );
}

export function Donut({ cats, income }: { cats: { name: string; total: number; color: string }[]; income: number }) {
  const tot = cats.reduce((s, c) => s + c.total, 0);
  const C = 2 * Math.PI * 44;
  let acc = 0;
  return (
    <svg viewBox="0 0 120 120" width={140} height={140} role="img" aria-label="Gastos por categoria">
      <circle cx={60} cy={60} r={44} fill="none" stroke="rgba(255,255,255,.07)" strokeWidth={13} />
      <g transform="rotate(-90 60 60)">
        {tot > 0 && cats.map((c) => {
          const l = (c.total / tot) * C, o = -acc;
          acc += l;
          return (
            <circle key={c.name} cx={60} cy={60} r={44} fill="none" stroke={c.color} strokeWidth={13}
              strokeDasharray={`${Math.max(l - 2, 0.5)} ${C - l + 2}`} strokeDashoffset={o}>
              <title>{`${c.name}: ${brl(c.total)}`}</title>
            </circle>
          );
        })}
      </g>
      <text x={60} y={64} textAnchor="middle" style={{ fill: "#fff", fontSize: 11, fontWeight: 600 }}>
        {income > 0 ? `${Math.round((tot / income) * 100)}% da renda` : tot > 0 ? "—" : "Sem gastos"}
      </text>
    </svg>
  );
}
