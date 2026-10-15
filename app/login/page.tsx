import type { Metadata } from "next";
import { Suspense } from "react";
import { AuthForm } from "@/components/auth-form";

export const metadata: Metadata = { title: "Log in" };

export default function LoginPage() {
  return (
    <div className="mx-auto max-w-sm px-4 py-12">
      <Suspense>
        <AuthForm kind="login" />
      </Suspense>
    </div>
  );
}
