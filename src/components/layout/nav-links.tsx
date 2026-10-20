"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import { clsx } from "clsx";

export function NavLink({ href, children, exact = false }: { href: string; children: React.ReactNode; exact?: boolean }) {
  const pathname = usePathname();
  const active = exact ? pathname === href : pathname === href || pathname.startsWith(`${href}/`);
  return (
    <Link href={href} className={clsx("nav-link no-underline", active && "nav-link-active")} aria-current={active ? "page" : undefined}>
      {children}
    </Link>
  );
}

export function DashLink({ href, children, exact = false }: { href: string; children: React.ReactNode; exact?: boolean }) {
  const pathname = usePathname();
  const active = exact ? pathname === href : pathname === href || pathname.startsWith(`${href}/`);
  return (
    <Link href={href} className={clsx("dash-link", active && "dash-link-active")} aria-current={active ? "page" : undefined}>
      {children}
    </Link>
  );
}
