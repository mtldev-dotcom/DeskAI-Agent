"use client";

import { FormEvent, useState, useTransition } from "react";
import Link from "next/link";
import { signIn } from "next-auth/react";
import { useRouter, useSearchParams } from "next/navigation";

export function SignInForm() {
  const router = useRouter();
  const searchParams = useSearchParams();
  const [error, setError] = useState("");
  const [isPending, startTransition] = useTransition();

  function onSubmit(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    setError("");
    const form = new FormData(event.currentTarget);
    const email = String(form.get("email") ?? "");
    const password = String(form.get("password") ?? "");
    const callbackUrl = searchParams.get("callbackUrl") ?? "/desks";

    startTransition(async () => {
      const result = await signIn("credentials", {
        email,
        password,
        redirect: false,
        callbackUrl,
      });

      if (result?.error) {
        setError("Invalid email or password");
        return;
      }

      router.push(result?.url ?? callbackUrl);
      router.refresh();
    });
  }

  return (
    <form onSubmit={onSubmit} className="glass mx-auto flex w-full max-w-sm flex-col gap-4 rounded-xl p-5">
      <div>
        <h1 className="text-xl font-semibold text-[--color-foreground]">Sign in</h1>
        <p className="mt-1 text-sm text-[--color-muted-foreground]">Use your DesksAI account.</p>
      </div>

      <label className="flex flex-col gap-1.5 text-sm text-[--color-foreground]">
        Email
        <input
          name="email"
          type="email"
          autoComplete="email"
          required
          className="min-h-[44px] rounded-lg border border-white/10 bg-white/5 px-3 text-sm outline-none focus:border-white/20"
        />
      </label>

      <label className="flex flex-col gap-1.5 text-sm text-[--color-foreground]">
        Password
        <input
          name="password"
          type="password"
          autoComplete="current-password"
          required
          className="min-h-[44px] rounded-lg border border-white/10 bg-white/5 px-3 text-sm outline-none focus:border-white/20"
        />
      </label>

      {error && <p className="text-sm text-red-300">{error}</p>}

      <button
        type="submit"
        disabled={isPending}
        className="min-h-[44px] rounded-lg bg-[--color-brand] px-4 text-sm font-medium text-[--color-brand-foreground] disabled:opacity-60"
      >
        {isPending ? "Signing in..." : "Sign in"}
      </button>

      <p className="text-center text-sm text-[--color-muted-foreground]">
        No account?{" "}
        <Link href="/sign-up" className="text-[--color-foreground] underline underline-offset-4">
          Sign up
        </Link>
      </p>
    </form>
  );
}
