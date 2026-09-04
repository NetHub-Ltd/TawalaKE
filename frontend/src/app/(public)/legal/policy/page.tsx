import type { Metadata } from "next";
import React from "react";

export const metadata: Metadata = {
  title: "Data Policy",
  description:
    "Tawala data handling, retention, and customer data rights for Kenyan SME businesses. Effective 9 August 2026.",
  alternates: { canonical: "/legal/policy" },
  openGraph: {
    title: "Data Policy | Tawala",
    description:
      "Tawala data handling, retention, and customer data rights for Kenyan SME businesses.",
    url: "https://tawala.nethub.co.ke/legal/policy",
    type: "website",
  },
  robots: { index: true, follow: true },
};

const DataPolicyPage = () => {
  return (
    <div className="min-h-screen bg-white">
      <div className="max-w-3xl mx-auto px-6 py-16 sm:py-20">
        {/* Header */}
        <div className="mb-12 border-b border-gray-200 pb-8">
          <p className="text-sm font-medium text-emerald-700 mb-3">Legal</p>
          <h1 className="text-3xl sm:text-4xl font-bold tracking-tight text-gray-900">
            Data Policy
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
              <a href="#roles" className="hover:text-emerald-700 transition-colors">
                1. Roles and Responsibilities
              </a>
            </li>
            <li>
              <a href="#categories" className="hover:text-emerald-700 transition-colors">
                2. Categories of Data Processed
              </a>
            </li>
            <li>
              <a href="#processing" className="hover:text-emerald-700 transition-colors">
                3. Processing by Nethub
              </a>
            </li>
            <li>
              <a href="#security" className="hover:text-emerald-700 transition-colors">
                4. Data Security
              </a>
            </li>
            <li>
              <a href="#sub-processors" className="hover:text-emerald-700 transition-colors">
                5. Sub-processors
              </a>
            </li>
            <li>
              <a href="#data-subject-rights" className="hover:text-emerald-700 transition-colors">
                6. Data Subject Rights
              </a>
            </li>
            <li>
              <a href="#retention" className="hover:text-emerald-700 transition-colors">
                7. Data Retention and Deletion
              </a>
            </li>
            <li>
              <a href="#breach" className="hover:text-emerald-700 transition-colors">
                8. Data Breach Notification
              </a>
            </li>
            <li>
              <a href="#transfers" className="hover:text-emerald-700 transition-colors">
                9. International Transfers
              </a>
            </li>
            <li>
              <a href="#contact" className="hover:text-emerald-700 transition-colors">
                10. Contact
              </a>
            </li>
          </ol>
        </nav>

        <div className="prose prose-gray max-w-none">
          {/* Intro */}
          <p className="text-lg text-gray-700 leading-relaxed">
            This Data Policy explains how <strong>Nethub</strong> (operating the
            Tawala Business Management System) handles Customer Data and
            clarifies the responsibilities of both Nethub and our customers under
            the Kenya Data Protection Act, 2019.
          </p>

          {/* Section 1 */}
          <section id="roles" className="mt-14 scroll-mt-20">
            <h2 className="text-xl font-semibold text-gray-900 mb-6">
              1. Roles and Responsibilities
            </h2>

            <div className="overflow-x-auto">
              <table className="w-full text-left text-sm border border-gray-200 rounded-lg overflow-hidden">
                <thead className="bg-gray-50 text-gray-700">
                  <tr>
                    <th className="px-4 py-3 font-semibold border-b border-gray-200">
                      Party
                    </th>
                    <th className="px-4 py-3 font-semibold border-b border-gray-200">
                      Role
                    </th>
                    <th className="px-4 py-3 font-semibold border-b border-gray-200">
                      Description
                    </th>
                  </tr>
                </thead>
                <tbody className="text-gray-700">
                  <tr className="border-b border-gray-100">
                    <td className="px-4 py-3 font-medium">Customer</td>
                    <td className="px-4 py-3">Data Controller</td>
                    <td className="px-4 py-3">
                      Determines the purpose and means of processing personal
                      data of their own staff and end-customers
                    </td>
                  </tr>
                  <tr className="border-b border-gray-100">
                    <td className="px-4 py-3 font-medium">Nethub</td>
                    <td className="px-4 py-3">Data Processor</td>
                    <td className="px-4 py-3">
                      Processes Customer Data to deliver the core Tawala Service
                    </td>
                  </tr>
                  <tr>
                    <td className="px-4 py-3 font-medium">Nethub</td>
                    <td className="px-4 py-3">Data Controller</td>
                    <td className="px-4 py-3">
                      Processes data for service improvement, AI/ML, security,
                      aggregated insights, and relevant business opportunities
                    </td>
                  </tr>
                </tbody>
              </table>
            </div>
          </section>

          {/* Section 2 */}
          <section id="categories" className="mt-12 scroll-mt-20">
            <h2 className="text-xl font-semibold text-gray-900 mb-4">
              2. Categories of Data Processed
            </h2>
            <ul className="list-disc pl-6 space-y-1.5 text-gray-700">
              <li>
                Identity and contact data of the Customer’s staff and
                end-customers
              </li>
              <li>Transaction and sales data</li>
              <li>Inventory and product data</li>
              <li>Invoicing and payment records</li>
              <li>System logs and audit trails</li>
            </ul>
          </section>

          {/* Section 3 */}
          <section id="processing" className="mt-12 scroll-mt-20">
            <h2 className="text-xl font-semibold text-gray-900 mb-4">
              3. Processing by Nethub
            </h2>

            <h3 className="text-base font-semibold text-gray-900 mt-6 mb-3">
              3.1 As Data Processor
            </h3>
            <p className="text-gray-700">
              We process Customer Data solely to provide, maintain, and support
              the Tawala Service in accordance with the Customer’s instructions
              and configuration.
            </p>

            <h3 className="text-base font-semibold text-gray-900 mt-6 mb-3">
              3.2 As Data Controller (Secondary Uses)
            </h3>
            <p className="text-gray-700 mb-3">
              Nethub also processes data for the following legitimate purposes:
            </p>
            <ul className="list-disc pl-6 space-y-1.5 text-gray-700">
              <li>
                Improving, securing, and developing the Tawala platform
                (including through artificial intelligence and machine learning)
              </li>
              <li>
                Generating aggregated and anonymised statistics and benchmarks
              </li>
              <li>
                Identifying and facilitating relevant business opportunities
                between customers and vetted third-party suppliers or wholesalers
                using anonymised or aggregated insights
              </li>
            </ul>

            <p className="mt-5 text-gray-700">In all such cases:</p>
            <ul className="list-disc pl-6 space-y-1.5 text-gray-700 mt-2">
              <li>We do not sell Personal Identifiable Information (PII)</li>
              <li>
                We apply appropriate safeguards, including anonymisation and
                aggregation where feasible
              </li>
              <li>
                We process data in accordance with the Kenya Data Protection Act,
                2019
              </li>
            </ul>
          </section>

          {/* Section 4 */}
          <section id="security" className="mt-12 scroll-mt-20">
            <h2 className="text-xl font-semibold text-gray-900 mb-4">
              4. Data Security
            </h2>
            <p className="text-gray-700 mb-3">
              We implement appropriate technical and organisational security
              measures, including:
            </p>
            <ul className="list-disc pl-6 space-y-1.5 text-gray-700">
              <li>Encryption of data in transit</li>
              <li>Hashed and salted storage of passwords and PINs</li>
              <li>Role-based access controls</li>
              <li>Audit logging of sensitive actions</li>
              <li>Regular security assessments and backups</li>
            </ul>
          </section>

          {/* Section 5 */}
          <section id="sub-processors" className="mt-12 scroll-mt-20">
            <h2 className="text-xl font-semibold text-gray-900 mb-4">
              5. Sub-processors
            </h2>
            <p className="text-gray-700">
              We engage sub-processors (such as cloud hosting providers and
              payment processors) to support the Service. We remain responsible
              for their compliance with applicable data protection obligations. A
              current list of sub-processors is available upon request.
            </p>
          </section>

          {/* Section 6 */}
          <section id="data-subject-rights" className="mt-12 scroll-mt-20">
            <h2 className="text-xl font-semibold text-gray-900 mb-4">
              6. Data Subject Rights
            </h2>
            <p className="text-gray-700">
              Where a data subject exercises rights under the Data Protection
              Act, the Customer (as Data Controller) is primarily responsible for
              responding. Nethub will provide reasonable assistance to the
              Customer in fulfilling such requests.
            </p>
          </section>

          {/* Section 7 */}
          <section id="retention" className="mt-12 scroll-mt-20">
            <h2 className="text-xl font-semibold text-gray-900 mb-4">
              7. Data Retention and Deletion
            </h2>
            <ul className="list-disc pl-6 space-y-1.5 text-gray-700">
              <li>
                Active data is retained for the duration of the Customer’s
                subscription
              </li>
              <li>
                Upon termination, Customer Data will be available for export for
                thirty (30) days
              </li>
              <li>
                Thereafter, personal data will be deleted or irreversibly
                anonymised, except where retention is required by Kenyan law
              </li>
              <li>
                Aggregated and anonymised data may be retained indefinitely
              </li>
            </ul>
          </section>

          {/* Section 8 */}
          <section id="breach" className="mt-12 scroll-mt-20">
            <h2 className="text-xl font-semibold text-gray-900 mb-4">
              8. Data Breach Notification
            </h2>
            <p className="text-gray-700">
              In the event of a personal data breach affecting Customer Data, we
              will notify the Customer without undue delay and provide
              information reasonably required for the Customer to meet its own
              obligations under the Data Protection Act, 2019.
            </p>
          </section>

          {/* Section 9 */}
          <section id="transfers" className="mt-12 scroll-mt-20">
            <h2 className="text-xl font-semibold text-gray-900 mb-4">
              9. International Transfers
            </h2>
            <p className="text-gray-700">
              Where Customer Data is transferred outside Kenya, we ensure
              appropriate safeguards are in place in accordance with the Data
              Protection Act, 2019.
            </p>
          </section>

          {/* Section 10 */}
          <section id="contact" className="mt-12 scroll-mt-20">
            <h2 className="text-xl font-semibold text-gray-900 mb-4">
              10. Contact
            </h2>
            <p className="text-gray-700 mb-3">
              For data protection inquiries:
            </p>
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

export default DataPolicyPage;