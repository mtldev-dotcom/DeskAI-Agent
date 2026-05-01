"use client";

import { useState } from "react";
import { motion } from "framer-motion";
import { MessageSquare, X } from "lucide-react";
import { useTranslations } from "next-intl";
import { ChatStream } from "@/components/chat/ChatStream";

interface AgentOverlayProps {
  deskId: string;
}

export function AgentOverlay({ deskId }: AgentOverlayProps) {
  const [open, setOpen] = useState(true);
  const t = useTranslations("agent");

  if (!open) {
    return (
      <button
        type="button"
        onClick={() => setOpen(true)}
        className="fixed bottom-20 right-4 z-50 flex h-12 w-12 items-center justify-center rounded-full border border-white/10 bg-white/10 text-[--color-foreground] shadow-lg shadow-black/30 backdrop-blur"
        aria-label={t("open")}
      >
        <MessageSquare size={20} />
      </button>
    );
  }

  return (
    <motion.aside
      initial={{ y: 40, opacity: 0 }}
      animate={{ y: 0, opacity: 1 }}
      exit={{ y: 40, opacity: 0 }}
      className="fixed inset-x-3 bottom-20 z-50 flex h-[72dvh] flex-col overflow-hidden rounded-[1.75rem] border border-white/10 bg-[linear-gradient(180deg,rgba(7,10,17,0.94),rgba(5,8,14,0.98))] shadow-[0_30px_90px_rgba(0,0,0,0.46)] backdrop-blur-2xl md:inset-x-auto md:bottom-6 md:right-5 md:top-5 md:h-auto md:w-[430px] md:rounded-[2rem]"
    >
      <div className="pointer-events-none absolute inset-x-0 top-0 h-24 bg-[radial-gradient(circle_at_top,rgba(87,181,255,0.18),transparent_70%)]" />
      <div className="relative flex min-h-[72px] items-center justify-between border-b border-white/10 px-4">
        <div className="flex items-center gap-3">
          <div className="flex h-11 w-11 items-center justify-center rounded-2xl border border-cyan-300/15 bg-cyan-300/10 text-cyan-100 shadow-[0_8px_30px_rgba(87,181,255,0.16)]">
            <MessageSquare size={18} className="text-cyan-200" />
          </div>
          <div>
            <div className="text-[11px] font-medium uppercase tracking-[0.24em] text-white/40">Live Assistant</div>
            <h2 className="text-base font-semibold text-[--color-foreground]">{t("title")}</h2>
          </div>
        </div>
        <button
          type="button"
          onClick={() => setOpen(false)}
          className="flex h-11 w-11 items-center justify-center rounded-2xl text-[--color-muted-foreground] transition-colors hover:bg-white/5 hover:text-[--color-foreground]"
          aria-label={t("close")}
        >
          <X size={18} />
        </button>
      </div>
      <ChatStream deskId={deskId} />
    </motion.aside>
  );
}
