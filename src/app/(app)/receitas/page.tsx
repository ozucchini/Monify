import { TxPage } from "@/components/TxPage";

export const metadata = { title: "Receitas" };

export default function Page() {
  return <TxPage tipo="income" title="Receitas" subtitle="Dinheiro que entrou" />;
}
