import * as React from "react";
import { Button } from "@react-email/components";
import { emailTheme } from "../email-engine/theme";

export interface EmailButtonProps {
  href: string;
  variant?: "primary" | "secondary" | "gold" | "emerald";
  customColor?: string;
  children: React.ReactNode;
}

export const EmailButton = ({
  href,
  variant = "primary",
  customColor,
  children,
}: EmailButtonProps) => {
  let backgroundColor: string = emailTheme.colors.accentDefault;
  let textColor: string = "#000000";

  if (customColor) {
    backgroundColor = customColor;
  } else if (variant === "emerald") {
    backgroundColor = emailTheme.colors.accentEmerald;
    textColor = "#000000";
  } else if (variant === "gold") {
    backgroundColor = emailTheme.colors.accentGold;
    textColor = "#0c0d12";
  } else if (variant === "secondary") {
    backgroundColor = "#27272a";
    textColor = "#ffffff";
  }

  return (
    <Button
      href={href}
      style={{
        backgroundColor,
        color: textColor,
        textDecoration: "none",
        padding: "14px 28px",
        borderRadius: "8px",
        fontWeight: "bold",
        fontSize: "14px",
        textTransform: "uppercase",
        letterSpacing: "0.05em",
        display: "inline-block",
        textAlign: "center",
      }}
    >
      {children}
    </Button>
  );
};
