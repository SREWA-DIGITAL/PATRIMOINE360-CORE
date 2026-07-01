import type { ReactNode } from "react";
import {
  Button,
  Container,
  Head,
  Heading,
  Html,
  Section,
  Text,
} from "@react-email/components";
import { config } from "~/config/shelf.config";
import { SUPPORT_EMAIL } from "~/utils/env";
import { LogoForEmail } from "../logo";
import { styles } from "../styles";
import { CustomEmailFooter } from "./custom-footer";

const supportEmail = SUPPORT_EMAIL || "support@patrimoine360.local";

export function EmailCtaButton({
  href,
  label,
}: {
  href: string;
  label: string;
}) {
  return (
    <Button href={href} style={{ ...styles.button, textAlign: "center" }}>
      {label}
    </Button>
  );
}

export function EmailInfoBox({
  children,
  label,
}: {
  children: ReactNode;
  label?: string;
}) {
  return (
    <Section
      style={{
        padding: "16px",
        borderRadius: "8px",
        border: "1px solid #D0D5DD",
        backgroundColor: "#F8FAFC",
        marginBottom: "24px",
      }}
    >
      {label ? (
        <Text
          style={{
            fontSize: "14px",
            fontWeight: "600",
            color: "#475467",
            margin: "0 0 8px 0",
          }}
        >
          {label}
        </Text>
      ) : null}
      <div>{children}</div>
    </Section>
  );
}

export function PatrimoineEmailLayout({
  automaticNotice,
  children,
  customFooter,
  recipientEmail,
  signature,
  title,
}: {
  automaticNotice?: ReactNode;
  children: ReactNode;
  customFooter?: string | null;
  recipientEmail?: string;
  signature?: ReactNode;
  title: string;
}) {
  const { brand, emailPrimaryColor } = config;

  return (
    <Html>
      <Head>
        <title>{title}</title>
      </Head>
      <Container
        style={{ padding: "32px 16px", maxWidth: "600px", margin: "0 auto" }}
      >
        <LogoForEmail />
        <Heading as="h1" style={{ ...styles.h1, marginTop: "24px" }}>
          {title}
        </Heading>
        <div style={{ paddingTop: "8px" }}>{children}</div>
        <Text style={{ marginBottom: "24px", ...styles.p }}>
          {signature ?? (
            <>
              Cordialement,
              <br />
              L'equipe {brand.name}
            </>
          )}
        </Text>
        <CustomEmailFooter footerText={customFooter} />
        {automaticNotice ? (
          automaticNotice
        ) : (
          <Text style={{ fontSize: "14px", color: "#667085" }}>
            Cet e-mail automatique vous a ete adresse par{" "}
            <span style={{ color: emailPrimaryColor, fontWeight: 600 }}>
              {brand.name}
            </span>
            {recipientEmail ? ` a ${recipientEmail}` : ""}. Pour toute question,
            contactez {supportEmail}.
          </Text>
        )}
      </Container>
    </Html>
  );
}
