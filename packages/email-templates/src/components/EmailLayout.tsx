import {
  Body,
  Container,
  Font,
  Head,
  Html,
  Preview,
} from "@react-email/components";
import { BrandHeader, brandColors } from "./BrandHeader";
import { Footer } from "./Footer";

type EmailLayoutProps = {
  children: React.ReactNode;
  preview: string;
  title?: string;
  logoUrl?: string;
};

const styles = {
  body: {
    backgroundColor: "#f5f5f5",
    fontFamily:
      "'Noto Sans TC', 'Microsoft JhengHei', 'Helvetica Neue', sans-serif",
    margin: 0,
    padding: "20px 0",
    WebkitFontSmoothing: "antialiased" as const,
    MozOsxFontSmoothing: "grayscale" as const,
  },
  container: {
    backgroundColor: brandColors.white,
    margin: "0 auto",
    maxWidth: "600px",
    minWidth: "320px",
    borderRadius: "8px",
    overflow: "hidden",
    boxShadow: "0 4px 12px rgba(0, 0, 0, 0.1)",
  },
  content: {
    padding: "32px 24px",
  },
};

export function EmailLayout({
  children,
  preview,
  title = "Black Living 黑哥居家",
  logoUrl,
}: EmailLayoutProps) {
  return (
    <Html lang="zh-TW">
      <Head>
        <title>{title}</title>
        <Font
          fallbackFontFamily="Georgia"
          fontFamily="Crimson Text"
          fontStyle="normal"
          fontWeight={400}
          webFont={{
            url: "https://fonts.gstatic.com/s/crimsontext/v19/wlp2gwHKFkZgtmSR3NB0oRJfbwhT.woff2",
            format: "woff2",
          }}
        />
        <Font
          fallbackFontFamily="sans-serif"
          fontFamily="Noto Sans TC"
          fontStyle="normal"
          fontWeight={400}
          webFont={{
            url: "https://fonts.gstatic.com/s/notosanstc/v35/-nFuOG829Oofr2wohFbTp9iFOQ.woff2",
            format: "woff2",
          }}
        />
        <meta content="width=device-width, initial-scale=1.0" name="viewport" />
      </Head>
      <Preview>{preview}</Preview>
      <Body style={styles.body}>
        <Container style={styles.container}>
          <BrandHeader logoUrl={logoUrl} />
          <div style={styles.content}>{children}</div>
          <Footer />
        </Container>
      </Body>
    </Html>
  );
}
