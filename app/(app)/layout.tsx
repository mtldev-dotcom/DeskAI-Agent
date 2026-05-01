import { AnimatedBackdrop } from "@/components/visual/AnimatedBackdrop";
import { BottomNav } from "@/components/mobile/BottomNav";

export default function AppLayout({ children }: { children: React.ReactNode }) {
  return (
    <div className="relative flex flex-col min-h-dvh">
      <AnimatedBackdrop />
      <main className="flex-1 pb-16 safe-top">{children}</main>
      <BottomNav />
    </div>
  );
}
