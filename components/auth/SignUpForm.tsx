"use client";

import { FormEvent, useState, useTransition } from "react";
import Link from "next/link";
import { signIn } from "next-auth/react";
import { useRouter } from "next/navigation";

export function SignUpForm() {
  const router = useRouter();
  const [error, setError] = useState("");
  const [isPending, startTransition] = useTransition();

  function onSubmit(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    setError("");
    const form = new FormData(event.currentTarget);
    const email = String(form.get("email") ?? "");
    const password = String(form.get("password") ?? "");
    const workspaceName = String(form.get("workspaceName") ?? "") || "My Workspace";

    startTransition(async () => {
      const response = await fetch("/api/auth/signup", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ email, password, workspaceName }),
      });

      if (!response.ok) {
        const body = (await response.json()) as { error?: string };
        setError(body.error ?? "Could not create account");
        return;
      }

      const result = await signIn("credentials", {
        email,
        password,
        redirect: false,
        callbackUrl: "/desks",
      });

      if (result?.error) {
        setError("Account created, but sign-in failed");
        return;
      }

      router.push("/desks");
      router.refresh();
    });
  }

  return (
    <form onSubmit={onSubmit} className="glass mx-auto flex w-full max-w-sm flex-col gap-4 rounded-xl p-5">
      <div>
        <h1 className="text-xl font-semibold text-[--color-foreground]">Sign up</h1>
        <p className="mt-1 text-sm text-[--color-muted-foreground]">Create your workspace.</p>
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
          autoComplete="new-password"
          minLength={8}
          required
          className="min-h-[44px] rounded-lg border border-white/10 bg-white/5 px-3 text-sm outline-none focus:border-white/20"
        />
      </label>

      <label className="flex flex-col gap-1.5 text-sm text-[--color-foreground]">
        Workspace
        <input
          name="workspaceName"
          type="text"
          autoComplete="organization"
          placeholder="My Workspace"
          className="min-h-[44px] rounded-lg border border-white/10 bg-white/5 px-3 text-sm outline-none placeholder:text-[--color-muted-foreground] focus:border-white/20"
        />
      </label>

      {error && <p className="text-sm text-red-300">{error}</p>}

      <button
        type="submit"
        disabled={isPending}
        className="min-h-[44px] rounded-lg bg-[--color-brand] px-4 text-sm font-medium text-[--color-brand-foreground] disabled:opacity-60"
      >
        {isPending ? "Creating..." : "Create account"}
      </button>

      <p className="text-center text-sm text-[--color-muted-foreground]">
        Already have an account?{" "}
        <Link href="/sign-in" className="text-[--color-foreground] underline underline-offset-4">
          Sign in
        </Link>
      </p>
    </form>
  );
}
