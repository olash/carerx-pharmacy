import type { ComponentProps, FC, ReactNode } from "react";
import { cn } from "@/lib/utils";

type Icon = FC<{ className?: string }>;

export function Label({ className, children, required, ...props }: ComponentProps<"label"> & { required?: boolean }) {
  return (
    <label className={cn("text-sm font-medium text-gray-700", className)} {...props}>
      {children}
      {required && <span className="ml-0.5 text-brand-600">*</span>}
    </label>
  );
}

export function Hint({ error, children, id }: { error?: boolean; children: ReactNode; id?: string }) {
  return (
    <p id={id} className={cn("text-sm", error ? "text-error-600" : "text-gray-600")}>
      {children}
    </p>
  );
}

const fieldBase =
  "w-full rounded-lg bg-white text-base text-gray-900 shadow-xs ring-1 ring-inset ring-gray-300 placeholder:text-gray-500 outline-none transition duration-100 focus:ring-2 focus:ring-brand-600 disabled:cursor-not-allowed disabled:bg-gray-50 disabled:text-gray-500 aria-invalid:ring-error-300 aria-invalid:focus:ring-error-500 sm:text-sm";

export type FieldProps = {
  label?: ReactNode;
  hint?: ReactNode;
  error?: string;
  required?: boolean;
  wrapperClassName?: string;
};

function Field({
  id,
  label,
  hint,
  error,
  required,
  wrapperClassName,
  children,
}: FieldProps & { id: string; children: ReactNode }) {
  return (
    <div className={cn("flex flex-col gap-1.5", wrapperClassName)}>
      {label && (
        <Label htmlFor={id} required={required}>
          {label}
        </Label>
      )}
      {children}
      {error ? (
        <Hint error id={`${id}-error`}>
          {error}
        </Hint>
      ) : hint ? (
        <Hint id={`${id}-hint`}>{hint}</Hint>
      ) : null}
    </div>
  );
}

export function Input({
  id,
  name,
  label,
  hint,
  error,
  required,
  wrapperClassName,
  className,
  icon: Icon,
  trailing,
  ...props
}: FieldProps & ComponentProps<"input"> & { icon?: Icon; trailing?: ReactNode }) {
  const fieldId = id ?? name ?? "field";
  return (
    <Field id={fieldId} label={label} hint={hint} error={error} required={required} wrapperClassName={wrapperClassName}>
      <div className="relative flex items-center">
        {Icon && <Icon className="pointer-events-none absolute left-3 size-5 text-gray-500" />}
        <input
          id={fieldId}
          name={name}
          required={required}
          aria-invalid={error ? true : undefined}
          aria-describedby={error ? `${fieldId}-error` : hint ? `${fieldId}-hint` : undefined}
          className={cn(fieldBase, "h-10 px-3", Icon && "pl-10", trailing && "pr-10", className)}
          {...props}
        />
        {trailing && <div className="absolute right-3 flex items-center">{trailing}</div>}
      </div>
    </Field>
  );
}

export function Textarea({
  id,
  name,
  label,
  hint,
  error,
  required,
  wrapperClassName,
  className,
  ...props
}: FieldProps & ComponentProps<"textarea">) {
  const fieldId = id ?? name ?? "field";
  return (
    <Field id={fieldId} label={label} hint={hint} error={error} required={required} wrapperClassName={wrapperClassName}>
      <textarea
        id={fieldId}
        name={name}
        required={required}
        aria-invalid={error ? true : undefined}
        className={cn(fieldBase, "min-h-24 resize-y px-3 py-2.5", className)}
        {...props}
      />
    </Field>
  );
}

export function Select({
  id,
  name,
  label,
  hint,
  error,
  required,
  wrapperClassName,
  className,
  children,
  ...props
}: FieldProps & ComponentProps<"select">) {
  const fieldId = id ?? name ?? "field";
  return (
    <Field id={fieldId} label={label} hint={hint} error={error} required={required} wrapperClassName={wrapperClassName}>
      <div className="relative">
        <select
          id={fieldId}
          name={name}
          required={required}
          aria-invalid={error ? true : undefined}
          className={cn(fieldBase, "h-10 appearance-none pl-3 pr-10", className)}
          {...props}
        >
          {children}
        </select>
        <svg
          className="pointer-events-none absolute right-3 top-1/2 size-5 -translate-y-1/2 text-gray-500"
          viewBox="0 0 20 20"
          fill="none"
          aria-hidden
        >
          <path d="m5 7.5 5 5 5-5" stroke="currentColor" strokeWidth="1.67" strokeLinecap="round" strokeLinejoin="round" />
        </svg>
      </div>
    </Field>
  );
}

export function Checkbox({
  label,
  hint,
  className,
  id,
  name,
  ...props
}: Omit<ComponentProps<"input">, "type"> & { label: ReactNode; hint?: ReactNode }) {
  const fieldId = id ?? name;
  return (
    <label htmlFor={fieldId} className={cn("flex cursor-pointer items-start gap-3", className)}>
      <input
        id={fieldId}
        name={name}
        type="checkbox"
        className="peer mt-0.5 size-4 shrink-0 cursor-pointer appearance-none rounded border border-gray-300 bg-white bg-center bg-no-repeat transition checked:border-brand-600 checked:bg-brand-600 checked:bg-[url('data:image/svg+xml;utf8,<svg%20xmlns=%22http://www.w3.org/2000/svg%22%20viewBox=%220%200%2014%2014%22%20fill=%22none%22><path%20d=%22M11.667%203.5%205.25%209.917%202.333%207%22%20stroke=%22white%22%20stroke-width=%221.75%22%20stroke-linecap=%22round%22%20stroke-linejoin=%22round%22/></svg>')] focus-visible:ring-focus outline-none"
        {...props}
      />
      <span className="flex flex-col">
        <span className="text-sm font-medium text-gray-700">{label}</span>
        {hint && <span className="text-sm text-gray-600">{hint}</span>}
      </span>
    </label>
  );
}

export function Toggle({
  label,
  hint,
  id,
  name,
  className,
  ...props
}: Omit<ComponentProps<"input">, "type"> & { label?: ReactNode; hint?: ReactNode }) {
  const fieldId = id ?? name;
  return (
    <label htmlFor={fieldId} className={cn("inline-flex cursor-pointer items-start gap-3", className)}>
      <span className="relative mt-0.5 inline-flex">
        <input id={fieldId} name={name} type="checkbox" role="switch" className="peer sr-only" {...props} />
        <span className="h-5 w-9 rounded-full bg-gray-100 ring-1 ring-inset ring-gray-200 transition peer-checked:bg-brand-600 peer-checked:ring-brand-600 peer-focus-visible:ring-focus" />
        <span className="absolute left-0.5 top-0.5 size-4 rounded-full bg-white shadow-sm transition peer-checked:translate-x-4" />
      </span>
      {(label || hint) && (
        <span className="flex flex-col">
          {label && <span className="text-sm font-medium text-gray-700">{label}</span>}
          {hint && <span className="text-sm text-gray-600">{hint}</span>}
        </span>
      )}
    </label>
  );
}
