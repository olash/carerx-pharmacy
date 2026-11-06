import type { Metadata } from "next";
import { SignupForm } from "@/components/auth/auth-forms";

export const metadata: Metadata = { title: "Create an account" };

export default function SignupPage() {
  return (
    <>
      <h1 className="text-display-xs font-semibold text-gray-900 md:text-display-sm">Create an account</h1>
      <p className="mt-2 text-base text-gray-600">Send drug requests, upload prescriptions and book free consultations.</p>
      <div className="mt-8">
        <SignupForm />
      </div>
    </>
  );
}
