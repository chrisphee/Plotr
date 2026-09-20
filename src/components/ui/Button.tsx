import { type ButtonHTMLAttributes, type ReactNode } from "react";
import clsx from "clsx";
import "./ui.css";

type Variant =
  | "primary"
  | "primary-on-ink"
  | "secondary"
  | "ghost"
  | "ghost-on-ink"
  | "destructive";

interface ButtonProps extends ButtonHTMLAttributes<HTMLButtonElement> {
  variant?: Variant;
  children: ReactNode;
}

export function Button({ variant = "secondary", className, children, ...rest }: ButtonProps) {
  return (
    <button className={clsx("btn", `btn--${variant}`, className)} {...rest}>
      {children}
    </button>
  );
}

interface IconButtonProps extends ButtonHTMLAttributes<HTMLButtonElement> {
  onInk?: boolean;
  label: string;
  children: ReactNode;
}

export function IconButton({ onInk, label, className, children, ...rest }: IconButtonProps) {
  return (
    <button
      className={clsx("iconbtn", onInk && "iconbtn--on-ink", className)}
      aria-label={label}
      title={label}
      {...rest}
    >
      {children}
    </button>
  );
}
