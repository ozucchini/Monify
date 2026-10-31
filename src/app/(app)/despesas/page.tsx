import { TxPage } from "@/components/TxPage";

export const metadata = { title: "Despesas" };

export default function Page() {
  return <TxPage tipo="expense" title="Despesas" subtitle="Dinheiro que saiu" />;
}
