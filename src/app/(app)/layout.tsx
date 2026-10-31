import { redirect } from "next/navigation";
import { isAuthed } from "@/lib/auth";
import { SideNav, TabBar } from "@/components/NavLinks";
import { LogoutButton } from "@/components/LogoutButton";

export const dynamic = "force-dynamic";

export default async function AppLayout({ children }: { children: React.ReactNode }) {
  if (!(await isAuthed())) redirect("/login");
  return (
    <div className="app">
      <aside>
        <div className="logo serif"><i />Monify</div>
        <SideNav />
        <div className="user">
          <div className="av">M</div>
          <div>Meu painel<small><LogoutButton /></small></div>
        </div>
      </aside>
      <main>{children}</main>
      <TabBar />
    </div>
  );
}
