"use client";
import Link from "next/link";
import { usePathname } from "next/navigation";
import { Icon, NAV, TAB_HREFS } from "./icons";

const active = (path: string, href: string) => (href === "/" ? path === "/" : path === href || path.startsWith(href + "/"));

export function SideNav() {
  const path = usePathname();
  return (
    <nav aria-label="Principal">
      {NAV.map((n) => (
        <Link key={n.href} href={n.href} className={active(path, n.href) ? "on" : ""} aria-current={active(path, n.href) ? "page" : undefined}>
          <Icon k={n.icon} />
          {n.label}
        </Link>
      ))}
    </nav>
  );
}

export function TabBar() {
  const path = usePathname();
  return (
    <nav className="tabbar" aria-label="Principal (mobile)">
      {NAV.filter((n) => TAB_HREFS.includes(n.href)).map((n) => (
        <Link key={n.href} href={n.href} className={active(path, n.href) ? "on" : ""}>
          <Icon k={n.icon} size={20} />
          {n.short}
        </Link>
      ))}
    </nav>
  );
}
