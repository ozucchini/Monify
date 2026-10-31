import { TxPage, parseTipo } from "@/components/TxPage";

export const metadata = { title: "Transações" };

export default async function Page({ searchParams }: { searchParams: Promise<{ tipo?: string }> }) {
  const tipo = parseTipo((await searchParams).tipo);
  return <TxPage tipo={tipo} title="Transações" subtitle="Tudo o que entrou e saiu, inclusive pelo Telegram" withFilters />;
}
