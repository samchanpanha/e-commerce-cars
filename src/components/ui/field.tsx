import { clsx } from "clsx";
import type { InputHTMLAttributes, ReactNode, SelectHTMLAttributes, TextareaHTMLAttributes } from "react";

export function Field({
  label,
  htmlFor,
  hint,
  error,
  required,
  children,
  className,
}: {
  label?: ReactNode;
  htmlFor?: string;
  hint?: ReactNode;
  error?: string | null;
  required?: boolean;
  children: ReactNode;
  className?: string;
}) {
  return (
    <div className={clsx("min-w-0", className)}>
      {label ? (
        <label htmlFor={htmlFor} className="label">
          {label}
          {required ? <span className="ml-1 text-danger-600" aria-hidden>*</span> : null}
        </label>
      ) : null}
      {children}
      {error ? (
        <p className="mt-1 text-xs font-medium text-danger-700" role="alert">{error}</p>
      ) : hint ? (
        <p className="hint">{hint}</p>
      ) : null}
    </div>
  );
}

export function TextInput({ className, ...props }: InputHTMLAttributes<HTMLInputElement>) {
  return <input className={clsx("input", className)} {...props} />;
}

export function Select({ className, children, ...props }: SelectHTMLAttributes<HTMLSelectElement>) {
  return (
    <select className={clsx("select", className)} {...props}>
      {children}
    </select>
  );
}

export function Textarea({ className, ...props }: TextareaHTMLAttributes<HTMLTextAreaElement>) {
  return <textarea className={clsx("textarea", className)} {...props} />;
}
