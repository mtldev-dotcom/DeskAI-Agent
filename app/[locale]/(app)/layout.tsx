import { BottomNav } from "@/components/mobile/BottomNav";
import { LocaleSwitcher } from "@/components/locale/LocaleSwitcher";
import { AnimatedBackdrop } from "@/components/visual/AnimatedBackdrop";

export default function AppLayout({ children }: { children: React.ReactNode }) {
  return (
    <div className="relative flex min-h-dvh flex-col">
      <AnimatedBackdrop />
      <div className="relative z-10 flex justify-end px-4 pt-3 safe-top">
        <LocaleSwitcher />
      </div>
      <main className="flex-1 pb-16">{children}</main>
      <BottomNav />
    </div>
  );
}
