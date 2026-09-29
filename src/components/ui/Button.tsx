import { type ButtonHTMLAttributes, type ReactNode } from "react";
import clsx from "clsx";
import "./ui.css";

type Variant = "primary" | "secondary" | "ghost" | "accent" | "ink" | "destructive";

interface ButtonProps extends ButtonHTMLAttributes<HTMLButtonElement> {
  variant?: Variant;
  size?: "md" | "lg";
  /** Ghost toggle state, e.g. the Plot Line "List" button. */
  on?: boolean;
  children: ReactNode;
}

export function Button({
  variant = "secondary",
  size = "md",
  on,
  className,
  children,
  ...rest
}: ButtonProps) {
  return (
    <button
      className={clsx("btn", `btn--${variant}`, size === "lg" && "btn--lg", on && "btn--on", className)}
      {...rest}
    >
      {children}
    </button>
  );
}

interface IconButtonProps extends ButtonHTMLAttributes<HTMLButtonElement> {
  label: string;
  children: ReactNode;
}

export function IconButton({ label, className, children, ...rest }: IconButtonProps) {
  return (
    <button className={clsx("iconbtn", className)} aria-label={label} title={label} {...rest}>
      {children}
    </button>
  );
}

export function Kbd({ children }: { children: ReactNode }) {
  return <kbd className="kbd">{children}</kbd>;
}
