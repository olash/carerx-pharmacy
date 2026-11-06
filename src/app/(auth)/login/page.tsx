import type { Metadata } from "next";
import { LoginForm } from "@/components/auth/auth-forms";

export const metadata: Metadata = { title: "Log in" };

export default function LoginPage() {
  return (
    <>
      <h1 className="text-display-xs font-semibold text-gray-900 md:text-display-sm">Welcome back</h1>
      <p className="mt-2 text-base text-gray-600">Log in to track your requests and chat with your pharmacist.</p>
      <div className="mt-8">
        <LoginForm />
      </div>
    </>
  );
}
