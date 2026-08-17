export const metadata = {
  title: "Privacy Policy — Leet9",
  description: "How Leet9 collects, uses, and protects your personal data.",
};

const EFFECTIVE_DATE = "August 17, 2026";
const EMAIL = "privacy@leet9.com";

export default function PrivacyPage() {
  return (
    <div
      style={{
        minHeight: "100vh",
        background: "#07080F",
        fontFamily: "'Outfit', system-ui, sans-serif",
        color: "#F1F3F9",
      }}
    >
      <div
        style={{
          borderBottom: "1px solid rgba(255,255,255,0.06)",
          padding: "18px 32px",
        }}
      >
        <a href="/" style={{ textDecoration: "none" }}>
          <img
            src="/logo-full-whitegradient.png"
            alt="Leet9"
            style={{ height: 28, width: "auto", display: "block" }}
          />
        </a>
      </div>

      <div style={{ maxWidth: 720, margin: "0 auto", padding: "64px 32px 96px" }}>
        <div
          style={{
            fontSize: 11,
            fontWeight: 700,
            color: "rgba(241,243,249,0.3)",
            letterSpacing: "0.1em",
            textTransform: "uppercase",
            marginBottom: 16,
          }}
        >
          Legal
        </div>
        <h1
          style={{
            fontSize: 40,
            fontWeight: 900,
            letterSpacing: "-0.03em",
            margin: "0 0 12px",
            lineHeight: 1.1,
          }}
        >
          Privacy Policy
        </h1>
        <p style={{ fontSize: 14, color: "rgba(241,243,249,0.35)", margin: "0 0 56px" }}>
          Effective date: {EFFECTIVE_DATE}
        </p>

        <Legal>
          <Section title="1. Who We Are">
            <P>
              Leet9 ("we," "our," or "us") operates the gaming identity platform available at{" "}
              <strong>leet9.com</strong>. This Privacy Policy explains how we collect, use, and
              protect your personal data when you use our Service.
            </P>
            <P>
              For privacy-related inquiries, contact us at:{" "}
              <a href={`mailto:${EMAIL}`} style={{ color: "#C8FF00", textDecoration: "none" }}>
                {EMAIL}
              </a>
            </P>
          </Section>

          <Section title="2. Data We Collect">
            <P>We collect the following categories of data:</P>
            <UL>
              <li>
                <strong>Account data:</strong> email address, display name, and profile picture
                (provided at registration or purchase)
              </li>
              <li>
                <strong>Gaming data:</strong> Steam library, playtime, and public profile
                statistics retrieved via Steam's public API
              </li>
              <li>
                <strong>Transaction data:</strong> purchase records and Stripe customer ID
                (we do not store card details)
              </li>
              <li>
                <strong>Usage data:</strong> pages visited, features used, and interactions
                with the platform (via analytics tools)
              </li>
              <li>
                <strong>Technical data:</strong> IP address, browser type, and device
                information collected automatically
              </li>
            </UL>
          </Section>

          <Section title="3. How We Use Your Data">
            <P>We use your data to:</P>
            <UL>
              <li>Provide and improve the Service (profile management, 1v1 comparisons, leaderboards)</li>
              <li>Process payments and issue L9 Points</li>
              <li>Send transactional emails (magic links, purchase confirmations)</li>
              <li>Detect and prevent fraud or abuse</li>
              <li>Comply with legal obligations</li>
            </UL>
            <P>
              We do not sell your personal data to third parties.
            </P>
          </Section>

          <Section title="4. Third-Party Data Processors">
            <P>
              We share your data with the following trusted third-party processors, solely to
              deliver the Service:
            </P>
            <UL>
              <li>
                <strong>Stripe, Inc.</strong> — payment processing. Stripe may collect your
                email, billing information, and IP address to process transactions. Subject to{" "}
                <a
                  href="https://stripe.com/privacy"
                  target="_blank"
                  rel="noopener noreferrer"
                  style={{ color: "#C8FF00", textDecoration: "none" }}
                >
                  Stripe's Privacy Policy
                </a>
                .
              </li>
              <li>
                <strong>Resend</strong> — transactional email delivery (magic links, confirmations).
                Only your email address is shared.
              </li>
              <li>
                <strong>Neon / PostgreSQL</strong> — secure cloud database hosting for account
                and transaction data.
              </li>
              <li>
                <strong>Vercel</strong> — platform hosting and edge delivery.
              </li>
              <li>
                <strong>Valve Corporation (Steam API)</strong> — public gaming data retrieval.
                No personal data is sent to Steam; we only read public profile information.
              </li>
            </UL>
          </Section>

          <Section title="5. Cookies and Analytics">
            <P>
              We use essential cookies to maintain your session and authentication state.
              We may also use privacy-friendly analytics tools (such as Plausible) that
              do not track individuals and do not use advertising cookies.
            </P>
            <P>
              You can disable cookies through your browser settings, though this may affect
              the functionality of the Service.
            </P>
          </Section>

          <Section title="6. Data Retention">
            <P>
              We retain your account data for as long as your account is active. Transaction
              records are kept for the period required by applicable accounting regulations
              (typically 7 years in Italy).
            </P>
            <P>
              You may request deletion of your account and associated data at any time by
              contacting {EMAIL}. Note that transaction records may be retained as required
              by law even after account deletion.
            </P>
          </Section>

          <Section title="7. Your Rights (GDPR)">
            <P>
              If you are located in the European Economic Area, you have the following rights
              under the General Data Protection Regulation (GDPR):
            </P>
            <UL>
              <li><strong>Access:</strong> request a copy of the personal data we hold about you</li>
              <li><strong>Rectification:</strong> correct inaccurate or incomplete data</li>
              <li><strong>Erasure:</strong> request deletion of your data ("right to be forgotten")</li>
              <li><strong>Restriction:</strong> request that we limit how we process your data</li>
              <li><strong>Portability:</strong> receive your data in a structured, machine-readable format</li>
              <li><strong>Objection:</strong> object to processing based on legitimate interests</li>
            </UL>
            <P>
              To exercise any of these rights, contact us at {EMAIL}. We will respond within
              30 days.
            </P>
          </Section>

          <Section title="8. Data Security">
            <P>
              We implement industry-standard security measures to protect your data, including
              encrypted connections (HTTPS/TLS), hashed authentication tokens, and access
              controls on our infrastructure. However, no system is completely secure, and
              we cannot guarantee absolute security.
            </P>
          </Section>

          <Section title="9. Children's Privacy">
            <P>
              The Service is not directed at children under the age of 13. We do not knowingly
              collect personal data from children. If you believe a child has provided us with
              personal data, please contact us at {EMAIL} and we will delete it promptly.
            </P>
          </Section>

          <Section title="10. Changes to This Policy">
            <P>
              We may update this Privacy Policy from time to time. We will notify you of
              significant changes via email or a prominent notice on the platform. We encourage
              you to review this policy periodically.
            </P>
          </Section>

          <Section title="11. Contact">
            <P>
              For any questions or requests regarding this Privacy Policy:{" "}
              <a href={`mailto:${EMAIL}`} style={{ color: "#C8FF00", textDecoration: "none" }}>
                {EMAIL}
              </a>
            </P>
          </Section>
        </Legal>

        <div
          style={{
            marginTop: 48,
            paddingTop: 32,
            borderTop: "1px solid rgba(255,255,255,0.06)",
            display: "flex",
            gap: 24,
            fontSize: 13,
          }}
        >
          <a href="/terms" style={{ color: "rgba(241,243,249,0.4)", textDecoration: "none" }}>
            Terms of Service →
          </a>
          <a href="/" style={{ color: "rgba(241,243,249,0.25)", textDecoration: "none" }}>
            Back to home →
          </a>
        </div>
      </div>
    </div>
  );
}

function Legal({ children }) {
  return <div style={{ display: "flex", flexDirection: "column", gap: 40 }}>{children}</div>;
}

function Section({ title, children }) {
  return (
    <div>
      <h2
        style={{
          fontSize: 18,
          fontWeight: 800,
          letterSpacing: "-0.01em",
          color: "#F1F3F9",
          margin: "0 0 16px",
        }}
      >
        {title}
      </h2>
      <div style={{ display: "flex", flexDirection: "column", gap: 12 }}>{children}</div>
    </div>
  );
}

function P({ children }) {
  return (
    <p style={{ fontSize: 15, color: "rgba(241,243,249,0.6)", lineHeight: 1.75, margin: 0 }}>
      {children}
    </p>
  );
}

function UL({ children }) {
  return (
    <ul
      style={{
        color: "rgba(241,243,249,0.6)",
        lineHeight: 2,
        paddingLeft: 24,
        margin: "12px 0",
        fontSize: 15,
      }}
    >
      {children}
    </ul>
  );
}
