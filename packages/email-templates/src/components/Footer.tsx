import { Hr, Link, Section, Text } from "@react-email/components";
import { brandColors } from "./BrandHeader";

/**
 * Contact info props for Footer - allows customization per deployment
 * Default values are provided but should be updated with real data
 */
type FooterProps = {
  phone?: string;
  email?: string;
  address?: string;
  facebookUrl?: string;
  lineUrl?: string;
};

// Default contact info - TODO: Replace with real Black Living contact data
const DEFAULT_CONTACT = {
  email: "service@blackliving.tw",
  address: "新北市中和區景平路398號2樓",

  facebookUrl:
    "https://www.facebook.com/p/Black-Living%E9%BB%91%E5%93%A5%E5%B1%85%E5%AE%B6-%E9%BB%91%E6%A8%99%E7%8E%8B%E9%A0%82%E7%B4%9A%E5%B8%AD%E5%A4%A2%E6%80%9D%E9%BB%91%E6%A8%99%E5%B0%88%E8%B3%A3-100057144952837/",
  lineUrl: "https://line.me/R/ti/p/@blackking",
} as const;

const styles = {
  container: {
    backgroundColor: brandColors.darkGray,
    padding: "32px 16px",
    textAlign: "center" as const,
  },
  divider: {
    borderColor: "#333333",
    margin: "0 0 24px 0",
  },
  companyName: {
    color: brandColors.gold,
    fontSize: "18px",
    fontFamily: "'Crimson Text', Georgia, serif",
    fontWeight: 600,
    margin: "0 0 4px 0",
    letterSpacing: "1px",
  },
  tagline: {
    color: "#999999",
    fontSize: "12px",
    fontFamily: "'Noto Sans TC', 'Microsoft JhengHei', sans-serif",
    margin: "0 0 20px 0",
  },
  contactSection: {
    margin: "16px 0",
  },
  contactLabel: {
    color: "#666666",
    fontSize: "11px",
    fontFamily: "'Noto Sans TC', 'Microsoft JhengHei', sans-serif",
    margin: "0 0 4px 0",
    textTransform: "uppercase" as const,
    letterSpacing: "1px",
  },
  contactValue: {
    color: "#cccccc",
    fontSize: "14px",
    fontFamily: "'Noto Sans TC', 'Microsoft JhengHei', sans-serif",
    margin: "0 0 12px 0",
    lineHeight: "1.6",
  },
  link: {
    color: brandColors.gold,
    textDecoration: "none",
  },
  socialLinks: {
    margin: "20px 0",
  },
  socialLink: {
    color: "#999999",
    fontSize: "13px",
    fontFamily: "'Noto Sans TC', 'Microsoft JhengHei', sans-serif",
    textDecoration: "none",
    margin: "0 8px",
  },
  copyright: {
    color: "#555555",
    fontSize: "11px",
    fontFamily: "'Noto Sans TC', 'Microsoft JhengHei', sans-serif",
    margin: "24px 0 0 0",
  },
  legalNote: {
    color: "#444444",
    fontSize: "10px",
    fontFamily: "'Noto Sans TC', 'Microsoft JhengHei', sans-serif",
    margin: "8px 0 0 0",
    lineHeight: "1.5",
  },
};

export function Footer({
  email = DEFAULT_CONTACT.email,
  address = DEFAULT_CONTACT.address,
  facebookUrl = DEFAULT_CONTACT.facebookUrl,
  lineUrl = DEFAULT_CONTACT.lineUrl,
}: FooterProps = {}) {
  const currentYear = new Date().getFullYear();

  return (
    <Section style={styles.container}>
      <Hr style={styles.divider} />

      <Text style={styles.companyName}>BLACK LIVING</Text>
      <Text style={styles.tagline}>黑哥居家 ｜ 專營美國席夢思黑標頂級床墊</Text>

      <Section style={styles.contactSection}>
        <Text style={styles.contactLabel}>電子郵件</Text>
        <Text style={styles.contactValue}>
          <Link href={`mailto:${email}`} style={styles.link}>
            {email}
          </Link>
        </Text>

        <Text style={styles.contactLabel}>門市地址</Text>
        <Text style={styles.contactValue}>{address}</Text>
      </Section>

      <Section style={styles.socialLinks}>
        <Link href={facebookUrl} style={styles.socialLink}>
          Facebook
        </Link>

        <Link href={lineUrl} style={styles.socialLink}>
          LINE
        </Link>
      </Section>

      <Text style={styles.copyright}>
        © {currentYear} BlackLiving 黑哥居家. All rights reserved.
      </Text>

      <Text style={styles.legalNote}>
        本郵件由系統自動發送，請勿直接回覆。
        <br />
        如需協助，請聯繫客服專線或至門市洽詢。
      </Text>
    </Section>
  );
}

export type { FooterProps };
