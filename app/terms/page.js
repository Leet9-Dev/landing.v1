export const metadata = {
  title: "Terms of Service — Leet9",
  description: "Terms and conditions for using the Leet9 platform.",
};

const EFFECTIVE_DATE = "August 17, 2026";
const EMAIL = "legal@leet9.com";

export default function TermsPage() {
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
          Terms of Service
        </h1>
        <p style={{ fontSize: 14, color: "rgba(241,243,249,0.35)", margin: "0 0 56px" }}>
          Effective date: {EFFECTIVE_DATE}
        </p>

        <Legal>
          <Section title="1. Acceptance of Terms">
            <P>
              By accessing or using the Leet9 platform (the "Service"), available at{" "}
              <strong>leet9.com</strong> and its associated applications, you agree to be bound
              by these Terms of Service. If you do not agree to these terms, please do not use
              the Service.
            </P>
            <P>
              Leet9 reserves the right to update these terms at any time. Changes will be
              communicated via email or a notice on the platform. Continued use of the Service
              after such notification constitutes acceptance of the updated terms.
            </P>
          </Section>

          <Section title="2. Description of Service">
            <P>Leet9 is a gaming identity platform that allows users to:</P>
            <UL>
              <li>Connect their gaming accounts (Steam and other platforms) into a single profile</li>
              <li>Compare gaming statistics with other users via the 1v1 feature</li>
              <li>Earn L9 Points based on their gaming activity</li>
              <li>Participate in leaderboards and community competitions</li>
            </UL>
            <P>
              Certain features — including the detailed 1v1 comparison analysis — are available
              for a one-time fee.
            </P>
          </Section>

          <Section title="3. User Accounts">
            <P>
              Some features require a Leet9 account. An account can be created directly or
              generated automatically upon first purchase (via a magic link sent to the email
              provided at checkout).
            </P>
            <P>
              You are responsible for maintaining the confidentiality of your login credentials
              and for all activities that occur under your account. Please notify us immediately
              of any unauthorized access at {EMAIL}.
            </P>
          </Section>

          <Section title="4. Payments and Refunds">
            <P>
              <strong>Detailed 1v1 analysis:</strong> the cost is <strong>€1.00</strong> per
              comparison. This is a one-time, permanent unlock for the selected pair of profiles.
            </P>
            <P>
              <strong>No refunds:</strong> all payments made on the Service are final and
              non-refundable, unless otherwise required by applicable law or in the case of a
              documented technical error on our part.
            </P>
            <P>
              <strong>Chargebacks:</strong> filing a chargeback with your bank or card issuer
              for a legitimate purchase may result in immediate suspension of your account. We
              strongly encourage you to contact us at {EMAIL} before initiating any dispute.
            </P>
            <P>
              Payments are processed by <strong>Stripe, Inc.</strong> Leet9 does not store
              credit card data. Payment processing is subject to{" "}
              <a
                href="https://stripe.com/legal"
                target="_blank"
                rel="noopener noreferrer"
                style={{ color: "#C8FF00", textDecoration: "none" }}
              >
                Stripe's Terms of Service
              </a>
              .
            </P>
          </Section>

          <Section title="5. L9 Points">
            <P>
              L9 Points are an internal reward system within the Leet9 platform. They:
            </P>
            <UL>
              <li>Have no monetary value and cannot be exchanged for cash</li>
              <li>Are non-transferable between accounts</li>
              <li>May be revoked in case of violation of these terms</li>
              <li>May be modified, suspended, or removed by Leet9 at any time</li>
            </UL>
            <P>
              500 L9 Points are awarded upon completing a first 1v1 detailed analysis purchase,
              as a welcome bonus.
            </P>
          </Section>

          <Section title="6. Steam and Third-Party Platform Data">
            <P>
              The Service accesses public Steam profile data via Valve Corporation's official
              APIs. Use of Steam data is subject to{" "}
              <a
                href="https://store.steampowered.com/subscriber_agreement/"
                target="_blank"
                rel="noopener noreferrer"
                style={{ color: "#C8FF00", textDecoration: "none" }}
              >
                Steam's Subscriber Agreement
              </a>
              . Leet9 is not affiliated with Valve Corporation.
            </P>
            <P>
              Data retrieved from Steam (game library, playtime, statistics) is used solely to
              provide Service features and is never sold to third parties.
            </P>
          </Section>

          <Section title="7. Acceptable Use">
            <P>You agree not to use the Service to:</P>
            <UL>
              <li>Violate any applicable laws or third-party rights</li>
              <li>Attempt to access other users' data without authorization</li>
              <li>Overload or disrupt the Service's infrastructure</li>
              <li>Create fake accounts or impersonate other users</li>
              <li>Perform unauthorized automated scraping of any content</li>
            </UL>
            <P>
              Violations may result in immediate suspension or termination of your account.
            </P>
          </Section>

          <Section title="8. Disclaimer and Limitation of Liability">
            <P>
              The Service is provided "as is" and "as available." Leet9 does not guarantee
              that the Service will be error-free, uninterrupted, or that data will always be
              accurate (as it depends on third-party APIs such as Steam).
            </P>
            <P>
              To the maximum extent permitted by applicable law, Leet9 shall not be liable for
              any indirect, incidental, special, or consequential damages arising from your use
              or inability to use the Service.
            </P>
          </Section>

          <Section title="9. Governing Law">
            <P>
              These terms are governed by Italian law. For any dispute relating to the Service,
              the parties agree to the exclusive jurisdiction of the competent courts in Italy.
            </P>
          </Section>

          <Section title="10. Contact">
            <P>
              For any questions regarding these Terms of Service, please contact us at:{" "}
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
          <a href="/privacy" style={{ color: "rgba(241,243,249,0.4)", textDecoration: "none" }}>
            Privacy Policy →
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
