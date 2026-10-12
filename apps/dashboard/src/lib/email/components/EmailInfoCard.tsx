import * as React from "react";
import { Section, Text } from "@react-email/components";
import { emailTheme } from "../engine/theme";

export interface EmailInfoCardProps {
  title?: string;
  titleColor?: string;
  children: React.ReactNode;
}

export const EmailInfoCard = ({
  title,
  titleColor,
  children,
}: EmailInfoCardProps) => {
  return (
    <Section
      style={{
        backgroundColor: "rgba(255, 255, 255, 0.03)",
        border: `1px solid ${emailTheme.colors.cardBorder}`,
        borderRadius: "8px",
        padding: "20px",
        margin: "24px 0",
      }}
    >
      {title && (
        <Text
          style={{
            margin: "0 0 12px 0",
            fontSize: "12px",
            textTransform: "uppercase",
            letterSpacing: "0.06em",
            fontWeight: 700,
            color: titleColor || emailTheme.colors.accentDefault,
          }}
        >
          {title}
        </Text>
      )}
      {children}
    </Section>
  );
};
