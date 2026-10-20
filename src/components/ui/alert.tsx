import { clsx } from "clsx";
import type { ReactNode } from "react";
import { AlertTriangle, CheckCircle2, Info, ShieldAlert } from "lucide-react";

const config = {
  info: { cls: "border-brand-100 bg-brand-50 text-brand-900", Icon: Info },
  success: { cls: "border-ok-100 bg-ok-100/70 text-ok-700", Icon: CheckCircle2 },
  warning: { cls: "border-warn-100 bg-warn-100/70 text-warn-700", Icon: AlertTriangle },
  danger: { cls: "border-danger-100 bg-danger-100/60 text-danger-700", Icon: ShieldAlert },
} as const;

export function Alert({
  tone = "info",
  title,
  children,
  className,
}: {
  tone?: keyof typeof config;
  title?: string;
  children?: ReactNode;
  className?: string;
}) {
  const { cls, Icon } = config[tone];
  return (
    <div className={clsx("flex gap-3 rounded-xl border px-4 py-3 text-sm", cls, className)} role="status">
      <Icon className="mt-0.5 h-4 w-4 shrink-0" aria-hidden />
      <div className="min-w-0">
        {title ? <p className="font-semibold">{title}</p> : null}
        {children ? <div className={clsx(title && "mt-0.5", "leading-relaxed")}>{children}</div> : null}
      </div>
    </div>
  );
}
