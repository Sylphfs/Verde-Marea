import type { ButtonHTMLAttributes, ReactNode } from "react";
import Link from "next/link";

/** Склейка классов: отбрасывает falsy-значения. */
export function cn(...classes: Array<string | false | null | undefined>): string {
  return classes.filter(Boolean).join(" ");
}

// --- Кнопки ---
export type ButtonVariant = "primary" | "secondary" | "outline" | "gold" | "danger";
export type ButtonSize = "sm" | "md";

const buttonBase =
  "inline-flex items-center justify-center gap-2 rounded-lg font-medium transition-colors focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-gold disabled:pointer-events-none disabled:opacity-60";

const buttonVariants: Record<ButtonVariant, string> = {
  primary: "bg-forest text-cream hover:bg-forest/90",
  secondary: "border border-forest text-forest hover:bg-forest hover:text-cream",
  outline: "border border-ink/20 text-ink hover:bg-ink/5",
  gold: "bg-gold text-ink hover:bg-gold/90",
  danger: "border border-danger text-danger hover:bg-danger hover:text-cream",
};

const buttonSizes: Record<ButtonSize, string> = {
  sm: "px-3 py-1.5 text-sm",
  md: "px-4 py-2 text-sm",
};

export function buttonStyles(variant: ButtonVariant = "primary", size: ButtonSize = "md"): string {
  return cn(buttonBase, buttonVariants[variant], buttonSizes[size]);
}

interface ButtonProps extends ButtonHTMLAttributes<HTMLButtonElement> {
  variant?: ButtonVariant;
  size?: ButtonSize;
  loading?: boolean;
}

export function Button({
  variant = "primary",
  size = "md",
  loading = false,
  type = "button",
  className,
  children,
  disabled,
  ...rest
}: ButtonProps) {
  return (
    <button
      type={type}
      className={cn(buttonStyles(variant, size), className)}
      disabled={disabled || loading}
      {...rest}
    >
      {loading ? "…" : children}
    </button>
  );
}

export function ButtonLink({
  href,
  variant = "primary",
  size = "md",
  className,
  children,
}: {
  href: string;
  variant?: ButtonVariant;
  size?: ButtonSize;
  className?: string;
  children: ReactNode;
}) {
  return (
    <Link href={href} className={cn(buttonStyles(variant, size), className)}>
      {children}
    </Link>
  );
}

// --- Карточка ---
export function Card({ className, children }: { className?: string; children: ReactNode }) {
  return (
    <div className={cn("rounded-lg border border-ink/10 bg-white px-4 py-3", className)}>
      {children}
    </div>
  );
}

// --- Поле формы ---
export function Field({
  label,
  htmlFor,
  children,
}: {
  label: string;
  htmlFor?: string;
  children: ReactNode;
}) {
  return (
    <label htmlFor={htmlFor} className="block">
      <span className="mb-1 block text-sm text-ink/60">{label}</span>
      {children}
    </label>
  );
}

// --- Сообщение (ошибка / успех / информация) ---
export function Alert({
  variant = "info",
  children,
}: {
  variant?: "error" | "success" | "info";
  children: ReactNode;
}) {
  const styles: Record<"error" | "success" | "info", string> = {
    error: "border-danger/40 bg-danger/10 text-danger",
    success: "border-forest/30 bg-forest/10 text-forest",
    info: "border-gold/50 bg-gold/10 text-ink",
  };
  return <div className={cn("rounded-lg border p-3 text-sm", styles[variant])}>{children}</div>;
}

// --- Пустое состояние ---
export function EmptyState({ title, action }: { title: string; action?: ReactNode }) {
  return (
    <div className="mt-6 rounded-lg border border-dashed border-ink/20 bg-white/50 p-8 text-center">
      <p className="text-ink/60">{title}</p>
      {action ? <div className="mt-4">{action}</div> : null}
    </div>
  );
}

// --- Заголовок страницы (пользовательские экраны) ---
export function PageHeader({ title, subtitle }: { title: string; subtitle?: string }) {
  return (
    <header className="mb-8">
      <h1 className="text-3xl font-semibold text-forest">{title}</h1>
      {subtitle ? <p className="mt-1 text-ink/60">{subtitle}</p> : null}
    </header>
  );
}

// --- Ссылка навигации ---
export const navLinkStyles =
  "rounded-md px-3 py-1.5 text-ink/80 transition-colors hover:bg-ink/5 hover:text-ink";

// --- Общий стиль полей ввода ---
export const inputStyles =
  "rounded-lg border border-ink/20 bg-white px-3 py-2 text-ink placeholder:text-ink/40 focus-visible:outline focus-visible:outline-2 focus-visible:outline-gold";
