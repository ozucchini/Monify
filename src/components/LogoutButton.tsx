"use client";
import { useRouter } from "next/navigation";

export function LogoutButton({ className = "" }: { className?: string }) {
  const router = useRouter();
  return (
    <button
      className={className}
      style={className ? undefined : { background: "none", border: 0, color: "var(--mut)", font: "inherit", fontSize: 12, cursor: "pointer", padding: 0 }}
      onClick={async () => { await fetch("/api/logout", { method: "POST" }); router.replace("/login"); router.refresh(); }}
    >
      Sair
    </button>
  );
}
