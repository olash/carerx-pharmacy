"use client";

import Link from "next/link";
import { useActionState, useEffect, useState } from "react";
import { Eye, EyeOff, Mail01, Lock01 } from "@untitledui/icons";
import { signIn, signUp } from "@/actions/auth";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Alert } from "@/components/ui/alert";

/** Read ?next= and ?error= on the client so the auth pages stay fully static. */
function useQuery() {
  const [q, setQ] = useState<{ next?: string; error?: string }>({});
  useEffect(() => {
    const sp = new URLSearchParams(window.location.search);
    // eslint-disable-next-line react-hooks/set-state-in-effect
    setQ({ next: sp.get("next") ?? undefined, error: sp.get("error") ?? undefined });
  }, []);
  return q;
}

const notices: Record<string, string> = {
  link: "That sign-in link has expired. Please log in again.",
  forbidden: "Your account doesn’t have staff access. Sign in with a pharmacist or admin account.",
};

function PasswordInput({ error, autoComplete, hint }: { error?: string; autoComplete: string; hint?: string }) {
  const [show, setShow] = useState(false);
  return (
    <Input
      label="Password"
      name="password"
      type={show ? "text" : "password"}
      autoComplete={autoComplete}
      required
      icon={Lock01}
      placeholder="••••••••"
      error={error}
      hint={hint}
      trailing={
        <button
          type="button"
          onClick={() => setShow((s) => !s)}
          className="rounded p-0.5 text-gray-400 hover:text-gray-600"
          aria-label={show ? "Hide password" : "Show password"}
        >
          {show ? <EyeOff className="size-5" /> : <Eye className="size-5" />}
        </button>
      }
    />
  );
}

export function LoginForm({ area = "site" }: { area?: "site" | "admin" }) {
  const [state, action, pending] = useActionState(signIn, null);
  const { next, error } = useQuery();
  const notice = error ? notices[error] : undefined;
  return (
    <form action={action} className="flex flex-col gap-5">
      {notice && <Alert tone="warning" title={notice} />}
      {state && !state.ok && <Alert tone="error" title={state.error} />}
      <input type="hidden" name="next" value={next ?? ""} />
      <input type="hidden" name="area" value={area} />
      <Input label="Email" name="email" type="email" autoComplete="email" required icon={Mail01} placeholder="you@example.com" />
      <PasswordInput autoComplete="current-password" />
      <Button type="submit" size="lg" loading={pending} className="mt-1 w-full">
        {area === "admin" ? "Sign in to dashboard" : "Log in"}
      </Button>
      {area === "site" && (
        <p className="text-center text-sm text-gray-600">
          Don’t have an account?{" "}
          <Link href={next ? `/signup?next=${encodeURIComponent(next)}` : "/signup"} className="font-semibold text-brand-700 hover:text-brand-800">
            Sign up
          </Link>
        </p>
      )}
    </form>
  );
}

export function SignupForm() {
  const [state, action, pending] = useActionState(signUp, null);
  const { next } = useQuery();
  const fe = state && !state.ok ? state.fieldErrors ?? {} : {};
  if (state?.ok) {
    return <Alert tone="success" title="Almost there!">{state.message}</Alert>;
  }
  return (
    <form action={action} className="flex flex-col gap-5" noValidate>
      {state && !state.ok && !state.fieldErrors && <Alert tone="error" title={state.error} />}
      <input type="hidden" name="next" value={next ?? ""} />
      <Input label="Full name" name="full_name" autoComplete="name" required placeholder="Chiamaka Obi" error={fe.full_name} />
      <Input
        label="Phone number"
        name="phone"
        type="tel"
        autoComplete="tel"
        required
        placeholder="0803 123 4567"
        error={fe.phone}
        hint="We’ll call or WhatsApp you about your orders."
      />
      <Input label="Email" name="email" type="email" autoComplete="email" required icon={Mail01} placeholder="you@example.com" error={fe.email} />
      <PasswordInput autoComplete="new-password" error={fe.password} hint="Must be at least 8 characters." />
      <Button type="submit" size="lg" loading={pending} className="mt-1 w-full">
        Create account
      </Button>
      <p className="text-center text-sm text-gray-600">
        Already have an account?{" "}
        <Link href={next ? `/login?next=${encodeURIComponent(next)}` : "/login"} className="font-semibold text-brand-700 hover:text-brand-800">
          Log in
        </Link>
      </p>
    </form>
  );
}
