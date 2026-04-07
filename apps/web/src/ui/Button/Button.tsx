import styles from "./Button.module.css";
import {
  type ButtonHTMLAttributes,
  type PropsWithChildren,
  type ReactNode,
} from "react";

type ButtonVariant = "text" | "contained" | "outlined";
type ButtonSize = "small" | "medium" | "large";

export type ButtonProps = PropsWithChildren<
  ButtonHTMLAttributes<HTMLButtonElement>
> & {
  variant?: ButtonVariant;
  size?: ButtonSize;
  fullWidth?: boolean;
  startIcon?: ReactNode;
  endIcon?: ReactNode;
};

export function Button({
  children,
  className,
  variant = "text",
  size = "medium",
  fullWidth = false,
  type = "button",
  startIcon,
  endIcon,
  ...props
}: ButtonProps) {
  return (
    <button
      type={type}
      className={[
        styles.root,
        styles[variant],
        styles[size],
        fullWidth ? styles.fullWidth : "",
        className ?? "",
      ]
        .filter(Boolean)
        .join(" ")}
      {...props}
    >
      <span className={styles.background} />
      <span className={styles.content}>
        {startIcon && <span className={styles.icon}>{startIcon}</span>}
        <span className={styles.label}>{children}</span>
        {endIcon && <span className={styles.icon}>{endIcon}</span>}
      </span>
    </button>
  );
}
