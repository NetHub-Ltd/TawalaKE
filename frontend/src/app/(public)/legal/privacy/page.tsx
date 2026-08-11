import React from "react";

const PrivacyPolicyPage = () => {
  return (
    <div className="min-h-screen bg-white">
      <div className="max-w-3xl mx-auto px-6 py-16 sm:py-20">
        {/* Header */}
        <div className="mb-12 border-b border-gray-200 pb-8">
          <p className="text-sm font-medium text-emerald-700 mb-3">Legal</p>
          <h1 className="text-3xl sm:text-4xl font-bold tracking-tight text-gray-900">
            Privacy Policy
          </h1>
          <p className="mt-4 text-gray-600">
            <span className="font-medium">Effective Date:</span> 9 August 2026
            <span className="mx-2">·</span>
            <span className="font-medium">Last Updated:</span> 9 August 2026
          </p>
        </div>

        {/* Table of Contents */}
        <nav className="mb-14 p-6 bg-gray-50 rounded-xl border border-gray-100">
          <h2 className="text-sm font-semibold text-gray-900 uppercase tracking-wider mb-4">
            Table of Contents
          </h2>
          <ol className="space-y-2 text-sm text-gray-700">
            <li>
              <a href="#who-we-are" className="hover:text-emerald-700 transition-colors">
                1. Who We Are
              </a>
            </li>
            <li>
              <a href="#data-we-collect" className="hover:text-emerald-700 transition-colors">
                2. Data We Collect
              </a>
            </li>
            <li>
              <a href="#how-we-use-your-data" className="hover:text-emerald-700 transition-colors">
                3. How We Use Your Data
              </a>
            </li>
            <li>
              <a href="#data-sharing" className="hover:text-emerald-700 transition-colors">
                4. Data Sharing
              </a>
            </li>
            <li>
              <a href="#cross-border-transfers" className="hover:text-emerald-700 transition-colors">
                5. Cross-Border Data Transfers
              </a>
            </li>
            <li>
              <a href="#data-retention" className="hover:text-emerald-700 transition-colors">
                6. Data Retention
              </a>
            </li>
            <li>
              <a href="#your-rights" className="hover:text-emerald-700 transition-colors">
                7. Your Rights
              </a>
            </li>
            <li>
              <a href="#security" className="hover:text-emerald-700 transition-colors">
                8. Security
              </a>
            </li>
            <li>
              <a href="#cookies" className="hover:text-emerald-700 transition-colors">
                9. Cookies
              </a>
            </li>
            <li>
              <a href="#childrens-privacy" className="hover:text-emerald-700 transition-colors">
                10. Children’s Privacy
              </a>
            </li>
            <li>
              <a href="#changes" className="hover:text-emerald-700 transition-colors">
                11. Changes to This Policy
              </a>
            </li>
            <li>
              <a href="#contact" className="hover:text-emerald-700 transition-colors">
                12. Contact
              </a>
            </li>
          </ol>
        </nav>

        <div className="prose prose-gray max-w-none">
          {/* Intro */}
          <p className="text-lg text-gray-700 leading-relaxed">
            Tawala is a Business Management System operated by{" "}
            <strong>Nethub</strong> (“Nethub”, “we”, “us”, or “our”), a company
            registered in Kenya. This Privacy Policy explains how we collect,
            use, store, share, and protect personal data when you use the Tawala
            platform and related services (the “Service”).
          </p>
          <p className="mt-4 text-gray-700 leading-relaxed">
            This Policy is issued in accordance with the{" "}
            <strong>Data Protection Act, 2019</strong> of Kenya and other
            applicable laws.
          </p>

          {/* Section 1 */}
          <section id="who-we-are" className="mt-14 scroll-mt-20">
            <h2 className="text-xl font-semibold text-gray-900 mb-4">
              1. Who We Are
            </h2>
            <div className="space-y-3 text-gray-700">
              <p>
                <strong>Legal Entity:</strong> Nethub
              </p>
              <p>
                <strong>Product:</strong> Tawala Business Management System
              </p>
              <p className="mt-4">
                For the purposes of the Data Protection Act, 2019:
              </p>
              <ul className="list-disc pl-6 space-y-2">
                <li>
                  Nethub acts as a <strong>Data Controller</strong> for account
                  data, billing data, platform analytics, service improvement,
                  and aggregated business insights.
                </li>
                <li>
                  Nethub acts as a <strong>Data Processor</strong> when
                  processing Customer Data purely to deliver the core Service on
                  behalf of our customers.
                </li>
              </ul>
              <div className="mt-5 space-y-1">
                <p>
                  <strong>Email:</strong>{" "}
                  <a
                    href="mailto:privacy@nethub.co.ke"
                    className="text-emerald-700 hover:underline"
                  >
                    privacy@nethub.co.ke
                  </a>
                </p>
                <p>
                  <strong>Website:</strong>{" "}
                  <a
                    href="https://nethub.co.ke"
                    target="_blank"
                    rel="noopener noreferrer"
                    className="text-emerald-700 hover:underline"
                  >
                    https://nethub.co.ke
                  </a>
                </p>
                <p>
                  <strong>Physical Address:</strong> [Insert your registered
                  Kenyan address]
                </p>
              </div>
            </div>
          </section>

          {/* Section 2 */}
          <section id="data-we-collect" className="mt-12 scroll-mt-20">
            <h2 className="text-xl font-semibold text-gray-900 mb-4">
              2. Data We Collect
            </h2>

            <h3 className="text-base font-semibold text-gray-900 mt-6 mb-3">
              2.1 Account & Identity Data
            </h3>
            <ul className="list-disc pl-6 space-y-1.5 text-gray-700">
              <li>Full name</li>
              <li>Email address</li>
              <li>Phone number</li>
              <li>Business name and details</li>
              <li>Password (stored hashed)</li>
              <li>Staff PINs (stored hashed and salted)</li>
            </ul>

            <h3 className="text-base font-semibold text-gray-900 mt-6 mb-3">
              2.2 Business & Operational Data (Customer Data)
            </h3>
            <ul className="list-disc pl-6 space-y-1.5 text-gray-700">
              <li>Sales and transaction records</li>
              <li>Invoices and receipts</li>
              <li>Product, service, and inventory data</li>
              <li>Customer records (names, phone numbers, emails)</li>
              <li>Staff records</li>
              <li>Expense records</li>
              <li>Business settings and configurations</li>
            </ul>

            <h3 className="text-base font-semibold text-gray-900 mt-6 mb-3">
              2.3 Technical & Usage Data
            </h3>
            <ul className="list-disc pl-6 space-y-1.5 text-gray-700">
              <li>IP address</li>
              <li>Device and browser information</li>
              <li>Log data and activity timestamps</li>
              <li>Approximate location (derived from IP)</li>
            </ul>

            <h3 className="text-base font-semibold text-gray-900 mt-6 mb-3">
              2.4 Payment Data
            </h3>
            <ul className="list-disc pl-6 space-y-1.5 text-gray-700">
              <li>M-Pesa and other payment references</li>
              <li>We do not store full card details</li>
            </ul>
          </section>

          {/* Section 3 */}
          <section id="how-we-use-your-data" className="mt-12 scroll-mt-20">
            <h2 className="text-xl font-semibold text-gray-900 mb-4">
              3. How We Use Your Data
            </h2>

            <h3 className="text-base font-semibold text-gray-900 mt-6 mb-3">
              3.1 Core Service Delivery
            </h3>
            <ul className="list-disc pl-6 space-y-1.5 text-gray-700">
              <li>Providing, maintaining, and supporting the Tawala platform</li>
              <li>Account creation, authentication, and access management</li>
              <li>Billing and subscription management</li>
              <li>Customer support</li>
            </ul>

            <h3 className="text-base font-semibold text-gray-900 mt-6 mb-3">
              3.2 Service Improvement & Artificial Intelligence
            </h3>
            <p className="text-gray-700 mb-3">
              We may use Customer Data (including transaction and usage data) to:
            </p>
            <ul className="list-disc pl-6 space-y-1.5 text-gray-700">
              <li>Operate, analyse, and improve the Tawala platform</li>
              <li>
                Train and improve our machine learning and artificial
                intelligence models
              </li>
              <li>
                Develop new features and enhance performance, security, and
                usability
              </li>
            </ul>

            <h3 className="text-base font-semibold text-gray-900 mt-6 mb-3">
              3.3 Aggregated and Anonymised Insights
            </h3>
            <p className="text-gray-700 mb-3">
              We may create aggregated, anonymised, or de-identified datasets.
              Once data can no longer reasonably identify an individual or a
              specific business, we may use it for:
            </p>
            <ul className="list-disc pl-6 space-y-1.5 text-gray-700">
              <li>Analytics and benchmarking</li>
              <li>Research and product development</li>
              <li>Business development purposes</li>
            </ul>

            <h3 className="text-base font-semibold text-gray-900 mt-6 mb-3">
              3.4 Relevant Business Opportunities
            </h3>
            <p className="text-gray-700">
              We may use aggregated or anonymised sales and category insights to
              identify potential supply opportunities and present relevant offers
              from wholesalers, distributors, or other business partners to our
              customers.
            </p>
            <p className="mt-4 text-gray-700 font-medium">
              We do not sell Personal Identifiable Information (PII).
              <br />
              We do not share PII with third parties for their independent
              marketing without a lawful basis.
            </p>

            <h3 className="text-base font-semibold text-gray-900 mt-6 mb-3">
              3.5 Legal Bases (Kenya Data Protection Act, 2019)
            </h3>
            <ul className="list-disc pl-6 space-y-1.5 text-gray-700">
              <li>Performance of a contract</li>
              <li>
                Legitimate interests (service improvement, security, aggregated
                insights, and relevant business opportunities)
              </li>
              <li>Legal obligation</li>
              <li>Consent (where required)</li>
            </ul>
          </section>

          {/* Section 4 */}
          <section id="data-sharing" className="mt-12 scroll-mt-20">
            <h2 className="text-xl font-semibold text-gray-900 mb-4">
              4. Data Sharing
            </h2>
            <p className="text-gray-700 mb-3">We may share data with:</p>
            <ul className="list-disc pl-6 space-y-1.5 text-gray-700">
              <li>Payment providers (e.g. M-Pesa, card processors)</li>
              <li>Cloud infrastructure and hosting providers</li>
              <li>Professional advisers under confidentiality</li>
              <li>Government authorities when required by law</li>
              <li>
                Vetted business partners only in aggregated or anonymised form
                for relevant supply opportunities
              </li>
            </ul>
            <p className="mt-4 text-gray-700 font-medium">
              We do not sell personal data.
            </p>
          </section>

          {/* Section 5 */}
          <section id="cross-border-transfers" className="mt-12 scroll-mt-20">
            <h2 className="text-xl font-semibold text-gray-900 mb-4">
              5. Cross-Border Data Transfers
            </h2>
            <p className="text-gray-700">
              Your data is primarily processed in Kenya or in jurisdictions with
              adequate protection. Where data is transferred outside Kenya, we
              apply appropriate safeguards in accordance with the Data Protection
              Act, 2019.
            </p>
          </section>

          {/* Section 6 */}
          <section id="data-retention" className="mt-12 scroll-mt-20">
            <h2 className="text-xl font-semibold text-gray-900 mb-4">
              6. Data Retention
            </h2>
            <ul className="list-disc pl-6 space-y-1.5 text-gray-700">
              <li>Active account data: retained for the life of the account</li>
              <li>
                After termination: available for export for 30 days, then deleted
                or anonymised
              </li>
              <li>
                Financial and transaction records: retained as required by Kenyan
                tax and commercial laws
              </li>
              <li>Aggregated/anonymised data: may be retained indefinitely</li>
            </ul>
          </section>

          {/* Section 7 */}
          <section id="your-rights" className="mt-12 scroll-mt-20">
            <h2 className="text-xl font-semibold text-gray-900 mb-4">
              7. Your Rights
            </h2>
            <p className="text-gray-700 mb-3">
              Under the Data Protection Act, 2019, you have the right to:
            </p>
            <ul className="list-disc pl-6 space-y-1.5 text-gray-700">
              <li>Access your personal data</li>
              <li>Request correction of inaccurate data</li>
              <li>Request deletion (subject to legal retention requirements)</li>
              <li>Object to certain processing</li>
              <li>Request restriction of processing</li>
              <li>Data portability</li>
              <li>Withdraw consent where processing is based on consent</li>
            </ul>
            <p className="mt-4 text-gray-700">
              To exercise these rights, contact us at{" "}
              <a
                href="mailto:privacy@nethub.co.ke"
                className="text-emerald-700 hover:underline"
              >
                privacy@nethub.co.ke
              </a>
              .
            </p>
            <p className="mt-3 text-gray-700">
              You may also lodge a complaint with the{" "}
              <strong>Office of the Data Protection Commissioner (ODPC)</strong>{" "}
              in Kenya.
            </p>
          </section>

          {/* Section 8 */}
          <section id="security" className="mt-12 scroll-mt-20">
            <h2 className="text-xl font-semibold text-gray-900 mb-4">
              8. Security
            </h2>
            <p className="text-gray-700">
              We implement appropriate technical and organisational measures,
              including encryption in transit, hashed credentials, role-based
              access control, audit logging, and regular security reviews.
            </p>
          </section>

          {/* Section 9 */}
          <section id="cookies" className="mt-12 scroll-mt-20">
            <h2 className="text-xl font-semibold text-gray-900 mb-4">
              9. Cookies
            </h2>
            <p className="text-gray-700">
              We use essential cookies for authentication and session management,
              and limited analytics cookies to improve the Service.
            </p>
          </section>

          {/* Section 10 */}
          <section id="childrens-privacy" className="mt-12 scroll-mt-20">
            <h2 className="text-xl font-semibold text-gray-900 mb-4">
              10. Children’s Privacy
            </h2>
            <p className="text-gray-700">
              The Service is not directed at individuals under 18 years of age.
            </p>
          </section>

          {/* Section 11 */}
          <section id="changes" className="mt-12 scroll-mt-20">
            <h2 className="text-xl font-semibold text-gray-900 mb-4">
              11. Changes to This Policy
            </h2>
            <p className="text-gray-700">
              We may update this Privacy Policy from time to time. Significant
              changes will be communicated via email or through the Service.
            </p>
          </section>

          {/* Section 12 */}
          <section id="contact" className="mt-12 scroll-mt-20">
            <h2 className="text-xl font-semibold text-gray-900 mb-4">
              12. Contact
            </h2>
            <div className="text-gray-700 space-y-2">
              <p>
                <strong>Email:</strong>{" "}
                <a
                  href="mailto:privacy@nethub.co.ke"
                  className="text-emerald-700 hover:underline"
                >
                  privacy@nethub.co.ke
                </a>
              </p>
              <p>
                <strong>Website:</strong>{" "}
                <a
                  href="https://nethub.co.ke"
                  target="_blank"
                  rel="noopener noreferrer"
                  className="text-emerald-700 hover:underline"
                >
                  https://nethub.co.ke
                </a>
              </p>
            </div>
          </section>
        </div>

        {/* Footer note */}
        <div className="mt-20 pt-8 border-t border-gray-200">
          <p className="text-sm text-gray-500">
            Tawala is a product operated by Nethub, a company registered in
            Kenya.
          </p>
        </div>
      </div>
    </div>
  );
};

export default PrivacyPolicyPage;