"use client";

import { useState } from "react";
import Link from "next/link";
import { AnimatePresence, motion } from "framer-motion";
import { Menu, Wrench, X } from "lucide-react";
import { navItems } from "@/data/nav";
import { siteConfig } from "@/config/site";
import { buttonVariants } from "@/components/ui/Button";
import { cn } from "@/lib/utils";
import { TRIAL_CTA_HREF } from "@/lib/routes";

export function Navbar() {
  const [open, setOpen] = useState(false);

  return (
    <header className="sticky top-0 z-50 border-b border-zinc-100 bg-white/80 backdrop-blur-md">
      <div className="mx-auto flex h-16 max-w-6xl items-center justify-between px-4 sm:px-6 lg:px-8">
        <Link
          href="/"
          className="flex items-center gap-2 text-[15px] font-semibold tracking-tight text-zinc-900"
        >
          <span className="flex h-7 w-7 items-center justify-center rounded-lg bg-zinc-900 text-white">
            <Wrench className="h-3.5 w-3.5" />
          </span>
          {siteConfig.name}
        </Link>

        <nav className="hidden items-center gap-8 md:flex">
          {navItems.map((item) => (
            <a
              key={item.href}
              href={item.href}
              className="text-sm font-medium text-zinc-600 transition-colors hover:text-zinc-900"
            >
              {item.label}
            </a>
          ))}
        </nav>

        <div className="hidden md:flex">
          {/* TODO: wire to real trial signup once onboarding/Stripe flow is redesigned */}
          <a href={TRIAL_CTA_HREF} className={buttonVariants({ variant: "primary", size: "md" })}>
            Start My Free 30-Day Trial
          </a>
        </div>

        <button
          type="button"
          onClick={() => setOpen((v) => !v)}
          className="flex h-9 w-9 items-center justify-center rounded-lg text-zinc-700 md:hidden"
          aria-label="Toggle menu"
          aria-expanded={open}
        >
          {open ? <X className="h-5 w-5" /> : <Menu className="h-5 w-5" />}
        </button>
      </div>

      <AnimatePresence>
        {open && (
          <motion.div
            initial={{ height: 0, opacity: 0 }}
            animate={{ height: "auto", opacity: 1 }}
            exit={{ height: 0, opacity: 0 }}
            transition={{ duration: 0.2, ease: "easeInOut" }}
            className="overflow-hidden border-t border-zinc-100 md:hidden"
          >
            <div className="flex flex-col gap-1 px-4 py-4">
              {navItems.map((item) => (
                <a
                  key={item.href}
                  href={item.href}
                  onClick={() => setOpen(false)}
                  className="rounded-lg px-3 py-2.5 text-sm font-medium text-zinc-700 hover:bg-zinc-50"
                >
                  {item.label}
                </a>
              ))}
              {/* TODO: wire to real trial signup once onboarding/Stripe flow is redesigned */}
              <a
                href={TRIAL_CTA_HREF}
                onClick={() => setOpen(false)}
                className={cn(
                  buttonVariants({ variant: "primary", size: "md" }),
                  "mt-2 w-full",
                )}
              >
                Start My Free 30-Day Trial
              </a>
            </div>
          </motion.div>
        )}
      </AnimatePresence>
    </header>
  );
}
