import Link from "next/link";
import { Wrench } from "lucide-react";
import { navItems } from "@/data/nav";
import { siteConfig } from "@/config/site";

const YEAR = new Date().getFullYear();

export function Footer() {
  return (
    <footer className="border-t border-white/10 bg-zinc-950">
      <div className="mx-auto flex max-w-6xl flex-col items-center gap-6 px-4 py-10 sm:flex-row sm:justify-between sm:px-6 lg:px-8">
        <Link
          href="/"
          className="flex items-center gap-2 text-[15px] font-semibold tracking-tight text-white"
        >
          <span className="flex h-7 w-7 items-center justify-center rounded-lg bg-gradient-to-br from-violet-500 to-blue-500 text-white">
            <Wrench className="h-3.5 w-3.5" />
          </span>
          {siteConfig.name}
        </Link>

        <nav className="flex flex-wrap items-center justify-center gap-x-6 gap-y-2">
          {navItems.map((item) => (
            <a
              key={item.href}
              href={item.href}
              className="text-sm font-medium text-white/50 transition-colors hover:text-white"
            >
              {item.label}
            </a>
          ))}
        </nav>

        <p className="text-xs text-white/30">
          © {YEAR} {siteConfig.name}. All rights reserved.
        </p>
      </div>
    </footer>
  );
}
