"use client";

import { FlaskConical } from "lucide-react";
import Link from "next/link";
import { useRouter, useSearchParams } from "next/navigation";
import { useState } from "react";
import { errorMessage, useData } from "@/components/data-provider";
import { Button, buttonVariants } from "@/components/ui/button";
import { cn } from "@/lib/utils";

const input = "h-11 w-full rounded-lg border border-input bg-background px-3 text-sm outline-none focus-visible:border-ring focus-visible:ring-3 focus-visible:ring-ring/30";

function safeNext(value: string | null): string {
  // Only allow same-site relative paths after login.
  return value && value.startsWith("/") && !value.startsWith("//") ? value : "/account";
}

export function AuthForm({ kind }: { kind: "login" | "register" }) {
  const { api, mode, refreshViewer } = useData();
  const router = useRouter();
  const next = safeNext(useSearchParams().get("next"));
  const [name, setName] = useState("");
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [error, setError] = useState("");
  const [busy, setBusy] = useState(false);
  const [checkEmail, setCheckEmail] = useState(false);
  const title = kind === "login" ? "Log in" : "Create an account";

  if (mode === "demo") {
    return (
      <div className="space-y-4">
        <h1 className="text-2xl font-semibold tracking-tight">{title}</h1>
        <div className="rounded-xl border border-amber-300 bg-amber-50 p-4 text-sm text-amber-950">
          <p className="flex items-center gap-1.5 font-medium"><FlaskConical className="size-4" aria-hidden="true" /> Demo mode</p>
          <p className="mt-1">
            Real {kind === "login" ? "login" : "registration"} needs Supabase to be configured (see the README). Until then you&apos;re
            using a demo account, <strong>Alex Morgan</strong>, and everything you do is saved only in this browser.
          </p>
        </div>
        <Link href={next} className={cn(buttonVariants(), "h-11 w-full")}>Continue as the demo user</Link>
      </div>
    );
  }

  async function submit(e: React.FormEvent) {
    e.preventDefault();
    if (busy) return;
    if (kind === "register" && name.trim().length < 2) return setError("Enter your name.");
    if (!/^\S+@\S+\.\S+$/.test(email)) return setError("Enter a valid email address.");
    if (password.length < 8) return setError("Use a password of at least 8 characters.");
    setBusy(true);
    setError("");
    try {
      if (kind === "login") {
        await api.signIn(email, password);
      } else {
        const { needsConfirmation } = await api.signUp(email, password, name.trim());
        if (needsConfirmation) {
          setCheckEmail(true);
          return;
        }
      }
      await refreshViewer();
      router.push(next);
    } catch (err) {
      setError(errorMessage(err));
    } finally {
      setBusy(false);
    }
  }

  if (checkEmail) {
    return (
      <div role="status" className="space-y-2">
        <h1 className="text-2xl font-semibold tracking-tight">Check your email</h1>
        <p className="text-muted-foreground">We sent a confirmation link to {email}. Open it, then log in.</p>
      </div>
    );
  }

  return (
    <form onSubmit={submit} className="space-y-4" noValidate>
      <h1 className="text-2xl font-semibold tracking-tight">{title}</h1>
      {kind === "register" && (
        <label className="block space-y-1.5 text-sm">
          <span className="font-medium">Name</span>
          <input value={name} onChange={(e) => setName(e.target.value)} autoComplete="name" className={input} />
        </label>
      )}
      <label className="block space-y-1.5 text-sm">
        <span className="font-medium">Email</span>
        <input type="email" value={email} onChange={(e) => setEmail(e.target.value)} autoComplete="email" className={input} />
      </label>
      <label className="block space-y-1.5 text-sm">
        <span className="font-medium">Password</span>
        <input type="password" value={password} onChange={(e) => setPassword(e.target.value)}
          autoComplete={kind === "login" ? "current-password" : "new-password"} className={input} />
      </label>
      {error && <p role="alert" className="text-sm text-destructive">{error}</p>}
      <Button type="submit" className="h-11 w-full" disabled={busy}>{busy ? "Please wait…" : title}</Button>
      <p className="text-center text-sm text-muted-foreground">
        {kind === "login" ? (
          <>New to Brollow? <Link href={`/register?next=${encodeURIComponent(next)}`} className="font-medium text-primary underline">Create an account</Link></>
        ) : (
          <>Already have an account? <Link href={`/login?next=${encodeURIComponent(next)}`} className="font-medium text-primary underline">Log in</Link></>
        )}
      </p>
    </form>
  );
}
