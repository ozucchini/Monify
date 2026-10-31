export const P: Record<string, string> = {
  home: "M3 11l9-8 9 8v9a1 1 0 0 1-1 1h-5v-6H9v6H4a1 1 0 0 1-1-1z",
  list: "M4 6h16M4 12h16M4 18h16",
  up: "M12 19V5m-6 6l6-6 6 6",
  dn: "M12 5v14m-6-6l6 6 6-6",
  tag: "M20 13l-7 7-9-9V4h7z",
  tgt: "M12 12m-9 0a9 9 0 1 0 18 0 9 9 0 1 0-18 0M12 12m-4 0a4 4 0 1 0 8 0 4 4 0 1 0-8 0",
  bar: "M5 21V10m7 11V4m7 17v-8",
  msg: "M21 12a8 8 0 0 1-11.6 7.1L4 20l1-4.6A8 8 0 1 1 21 12z",
  bell: "M6 8a6 6 0 0 1 12 0c0 7 3 8 3 8H3s3-1 3-8M10 20a2 2 0 0 0 4 0",
  cog: "M12 15a3 3 0 1 0 0-6 3 3 0 0 0 0 6M4 12h2m12 0h2M12 4v2m0 12v2",
};

export function Icon({ k, size, stroke, className }: { k: string; size?: number; stroke?: string; className?: string }) {
  return (
    <svg viewBox="0 0 24 24" width={size} height={size} className={className} fill="none" stroke={stroke ?? "currentColor"} strokeWidth={1.8} strokeLinecap="round" strokeLinejoin="round" aria-hidden="true">
      <path d={P[k]} />
    </svg>
  );
}

export const NAV: { label: string; short: string; href: string; icon: string }[] = [
  { label: "Visão geral", short: "Visão", href: "/", icon: "home" },
  { label: "Transações", short: "Transações", href: "/transacoes", icon: "list" },
  { label: "Receitas", short: "Receitas", href: "/receitas", icon: "up" },
  { label: "Despesas", short: "Despesas", href: "/despesas", icon: "dn" },
  { label: "Categorias", short: "Categorias", href: "/categorias", icon: "tag" },
  { label: "Orçamentos", short: "Orçamentos", href: "/orcamentos", icon: "tgt" },
  { label: "Relatórios", short: "Relatórios", href: "/relatorios", icon: "bar" },
  { label: "Assistente Telegram", short: "Telegram", href: "/telegram", icon: "msg" },
  { label: "Configurações", short: "Config.", href: "/configuracoes", icon: "cog" },
];
export const TAB_HREFS = ["/", "/transacoes", "/orcamentos", "/telegram"];
