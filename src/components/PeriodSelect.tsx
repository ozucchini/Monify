"use client";
import { useRouter } from "next/navigation";
import { PERIODS, type Period } from "@/lib/dashboard";

export function PeriodSelect({ value }: { value: Period }) {
  const router = useRouter();
  return (
    <select aria-label="Período" value={value} onChange={(e) => router.push(e.target.value === "mes" ? "/" : `/?periodo=${e.target.value}`)}>
      {PERIODS.map((p) => <option key={p.value} value={p.value}>{p.label}</option>)}
    </select>
  );
}
