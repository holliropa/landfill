import styles from "./IconButton.module.css";
import type { ButtonHTMLAttributes, ReactNode } from "react";

type IconButtonSize = "small" | "medium" | "large";
type IconButtonVariant = "primary" | "outlined" | "ghost";
type IconButtonShape = "square" | "rounded" | "circle";

export type IconButtonProps = ButtonHTMLAttributes<HTMLButtonElement> & {
  icon: ReactNode;
  size?: IconButtonSize;
  variant?: IconButtonVariant;
  shape?: IconButtonShape;
  enabled?: boolean;
};

export function IconButton({
  icon,
  size = "medium",
  variant = "primary",
  shape = "rounded",
  type = "button",
  className,
  ...props
}: IconButtonProps) {
  return (
    <button
      type={type}
      className={[
        styles.root,
        styles[size],
        styles[variant],
        styles[shape],
        className,
      ]
        .filter(Boolean)
        .join(" ")}
      {...props}
    >
      <span className={styles.icon}>{icon}</span>
    </button>
  );
}
