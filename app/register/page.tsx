import type { Metadata } from "next";
import { Suspense } from "react";
import { AuthForm } from "@/components/auth-form";

export const metadata: Metadata = { title: "Create an account" };

export default function RegisterPage() {
  return (
    <div className="mx-auto max-w-sm px-4 py-12">
      <Suspense>
        <AuthForm kind="register" />
      </Suspense>
    </div>
  );
}
