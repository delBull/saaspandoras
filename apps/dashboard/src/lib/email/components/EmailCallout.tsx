import * as React from "react";
import { Section, Text } from "@react-email/components";
import { emailTheme } from "../engine/theme";

export interface EmailCalloutProps {
  type?: "info" | "warning" | "success";
  children: React.ReactNode;
}

export const EmailCallout = ({
  type = "info",
  children,
}: EmailCalloutProps) => {
  let borderColor: string = emailTheme.colors.cardBorder;
  let bgColor: string = "rgba(255, 255, 255, 0.02)";

  if (type === "warning") {
    borderColor = emailTheme.colors.accentGold;
    bgColor = "rgba(228, 200, 117, 0.08)";
  } else if (type === "success") {
    borderColor = emailTheme.colors.accentEmerald;
    bgColor = "rgba(16, 185, 129, 0.08)";
  }

  return (
    <Section
      style={{
        backgroundColor: bgColor,
        borderLeft: `3px solid ${borderColor}`,
        borderRadius: "4px",
        padding: "14px 18px",
        margin: "20px 0",
      }}
    >
      <Text
        style={{
          margin: 0,
          fontSize: "13px",
          lineHeight: "1.6",
          color: emailTheme.colors.textSecondary,
        }}
      >
        {children}
      </Text>
    </Section>
  );
};
