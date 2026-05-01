"use client";

import { useState } from "react";
import { motion } from "framer-motion";
import { MessageSquare, X } from "lucide-react";
import { ChatStream } from "@/components/chat/ChatStream";

interface AgentOverlayProps {
  deskId: string;
}

export function AgentOverlay({ deskId }: AgentOverlayProps) {
  const [open, setOpen] = useState(true);

  if (!open) {
    return (
      <button
        type="button"
        onClick={() => setOpen(true)}
        className="fixed bottom-20 right-4 z-40 flex h-12 w-12 items-center justify-center rounded-full border border-white/10 bg-white/10 text-[--color-foreground] shadow-lg shadow-black/30 backdrop-blur md:bottom-6"
        aria-label="Open agent"
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
      className="fixed inset-x-3 bottom-20 z-40 flex h-[68dvh] flex-col overflow-hidden rounded-xl border border-white/10 bg-[--color-background]/90 shadow-2xl shadow-black/40 backdrop-blur md:inset-x-auto md:bottom-0 md:right-0 md:top-0 md:h-auto md:w-[400px] md:rounded-none md:border-y-0 md:border-r-0"
    >
      <div className="flex min-h-[52px] items-center justify-between border-b border-white/10 px-3">
        <div className="flex items-center gap-2">
          <MessageSquare size={18} className="text-[--color-brand]" />
          <h2 className="text-sm font-semibold text-[--color-foreground]">Agent</h2>
        </div>
        <button
          type="button"
          onClick={() => setOpen(false)}
          className="flex h-11 w-11 items-center justify-center rounded-lg text-[--color-muted-foreground] hover:bg-white/5 hover:text-[--color-foreground]"
          aria-label="Close agent"
        >
          <X size={18} />
        </button>
      </div>
      <ChatStream deskId={deskId} />
    </motion.aside>
  );
}
