import type { Metadata } from "next";
import { LoginForm } from "@/components/auth/auth-forms";

export const metadata: Metadata = { title: "Log in" };

export default function LoginPage() {
  return (
    <>
      <h1 className="font-display text-4xl font-medium leading-tight text-ink md:text-5xl">Welcome back</h1>
      <p className="mt-2 text-base text-gray-600">Log in to track your requests and chat with your pharmacist.</p>
      <div className="mt-8">
        <LoginForm />
      </div>
    </>
  );
}
