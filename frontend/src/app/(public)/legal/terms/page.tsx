import React from "react";

const TermsPage = () => {
  return (
    <div className="min-h-screen bg-white">
      <div className="max-w-3xl mx-auto px-6 py-16 sm:py-20">
        {/* Header */}
        <div className="mb-12 border-b border-gray-200 pb-8">
          <p className="text-sm font-medium text-emerald-700 mb-3">
            Legal
          </p>
          <h1 className="text-3xl sm:text-4xl font-bold tracking-tight text-gray-900">
            Terms of Service
          </h1>
          <p className="mt-4 text-gray-600">
            <span className="font-medium">Effective Date:</span> 9 August 2026
            <span className="mx-2">·</span>
            <span className="font-medium">Last Updated:</span> 9 August 2026
          </p>
        </div>

        {/* Intro */}
        <div className="prose prose-gray max-w-none">
          <p className="text-lg text-gray-700 leading-relaxed">
            These Terms of Service (“Terms”) govern your access to and use of the{" "}
            <strong>Tawala Business Management System</strong> operated by{" "}
            <strong>Nethub</strong> (“Nethub”, “we”, “us”, or “our”), a company
            registered in Kenya. By creating an account or using the Service, you
            agree to these Terms.
          </p>

          {/* Section 1 */}
          <section className="mt-14">
            <h2 className="text-xl font-semibold text-gray-900 mb-4">
              1. Definitions
            </h2>
            <ul className="space-y-3 text-gray-700">
              <li>
                <strong>“Customer” / “you”</strong> means the business or
                individual that registers for the Service.
              </li>
              <li>
                <strong>“User”</strong> means any individual authorised by the
                Customer to access the Service.
              </li>
              <li>
                <strong>“Customer Data”</strong> means all data uploaded,
                generated, or processed through the Service by or on behalf of
                the Customer.
              </li>
              <li>
                <strong>“Service”</strong> means the Tawala Business Management
                System and related services.
              </li>
            </ul>
          </section>

          {/* Section 2 */}
          <section className="mt-12">
            <h2 className="text-xl font-semibold text-gray-900 mb-4">
              2. Eligibility and Account Registration
            </h2>
            <div className="space-y-4 text-gray-700">
              <p>
                <strong>2.1</strong> You must be at least 18 years old and have
                legal capacity to enter into a binding contract under Kenyan law.
              </p>
              <p>
                <strong>2.2</strong> You are responsible for maintaining the
                confidentiality of your account credentials and for all
                activities under your account.
              </p>
              <p>
                <strong>2.3</strong> You must provide accurate and complete
                information and keep it updated.
              </p>
            </div>
          </section>

          {/* Section 3 */}
          <section className="mt-12">
            <h2 className="text-xl font-semibold text-gray-900 mb-4">
              3. Subscription and Billing
            </h2>
            <div className="space-y-4 text-gray-700">
              <p>
                <strong>3.1</strong> The Service is offered under different
                subscription plans. Features and limits are described on our
                pricing page.
              </p>
              <p>
                <strong>3.2</strong> Fees are charged in Kenyan Shillings (KES)
                on a monthly or annual basis.
              </p>
              <p>
                <strong>3.3</strong> Failure to pay may result in suspension or
                termination after a seven (7) day grace period.
              </p>
              <p>
                <strong>3.4</strong> You may upgrade or downgrade your plan.
                Downgrades take effect at the next billing cycle.
              </p>
            </div>
          </section>

          {/* Section 4 */}
          <section className="mt-12">
            <h2 className="text-xl font-semibold text-gray-900 mb-4">
              4. Licence and Acceptable Use
            </h2>
            <div className="space-y-4 text-gray-700">
              <p>
                <strong>4.1</strong> We grant you a limited, non-exclusive,
                non-transferable licence to use the Service for your internal
                business operations.
              </p>
              <p>
                <strong>4.2</strong> You agree not to:
              </p>
              <ul className="list-disc pl-6 space-y-2">
                <li>Use the Service for unlawful purposes</li>
                <li>
                  Attempt unauthorised access to the Service or other customers’
                  data
                </li>
                <li>Reverse engineer or copy the software</li>
                <li>Upload malicious code or interfere with the Service</li>
                <li>
                  Resell or sublicense the Service without our written consent
                </li>
              </ul>
            </div>
          </section>

          {/* Section 5 */}
          <section className="mt-12">
            <h2 className="text-xl font-semibold text-gray-900 mb-4">
              5. Customer Data and Licence Grant
            </h2>
            <div className="space-y-4 text-gray-700">
              <p>
                <strong>5.1</strong> You retain all ownership rights in your
                Customer Data.
              </p>
              <p>
                <strong>5.2</strong> You grant Nethub a worldwide, non-exclusive,
                royalty-free licence to use, process, analyse, store, and create
                derivative works from Customer Data for the following purposes:
              </p>
              <ul className="list-disc pl-6 space-y-2">
                <li>Providing, maintaining, and supporting the Service</li>
                <li>
                  Improving, securing, and developing the Service (including
                  through artificial intelligence and machine learning)
                </li>
                <li>Creating aggregated and anonymised datasets</li>
                <li>
                  Identifying and facilitating relevant business opportunities
                  using aggregated or anonymised insights
                </li>
              </ul>
              <p>
                <strong>5.3</strong> This licence includes the right to use
                aggregated and anonymised data after termination of the Service.
              </p>
              <p>
                <strong>5.4</strong> We will not sell your Personal Identifiable
                Information.
              </p>
            </div>
          </section>

          {/* Section 6 */}
          <section className="mt-12">
            <h2 className="text-xl font-semibold text-gray-900 mb-4">
              6. Service Availability and Support
            </h2>
            <div className="space-y-4 text-gray-700">
              <p>
                <strong>6.1</strong> We aim to maintain high availability but do
                not guarantee uninterrupted access.
              </p>
              <p>
                <strong>6.2</strong> Support is provided according to your
                subscription plan.
              </p>
            </div>
          </section>

          {/* Section 7 */}
          <section className="mt-12">
            <h2 className="text-xl font-semibold text-gray-900 mb-4">
              7. Intellectual Property
            </h2>
            <p className="text-gray-700">
              All rights in the Service, including software, design, trademarks,
              and documentation, remain the exclusive property of Nethub.
            </p>
          </section>

          {/* Section 8 */}
          <section className="mt-12">
            <h2 className="text-xl font-semibold text-gray-900 mb-4">
              8. Confidentiality
            </h2>
            <p className="text-gray-700">
              Each party agrees to keep confidential any non-public information
              received from the other party, except as required to perform
              obligations under these Terms or by law.
            </p>
          </section>

          {/* Section 9 */}
          <section className="mt-12">
            <h2 className="text-xl font-semibold text-gray-900 mb-4">
              9. Limitation of Liability
            </h2>
            <div className="space-y-4 text-gray-700">
              <p>
                <strong>9.1</strong> To the maximum extent permitted by
                applicable law, Nethub shall not be liable for any indirect,
                incidental, special, consequential, or punitive damages, or any
                loss of profits, revenue, data, or business opportunities.
              </p>
              <p>
                <strong>9.2</strong> Our total aggregate liability arising out of
                or related to these Terms shall not exceed the total fees paid by
                you to Nethub in the twelve (12) months preceding the claim.
              </p>
            </div>
          </section>

          {/* Section 10 */}
          <section className="mt-12">
            <h2 className="text-xl font-semibold text-gray-900 mb-4">
              10. Indemnity
            </h2>
            <p className="text-gray-700">
              You agree to indemnify and hold Nethub harmless from any claims,
              losses, or damages arising out of your use of the Service, your
              Customer Data, or your violation of these Terms.
            </p>
          </section>

          {/* Section 11 */}
          <section className="mt-12">
            <h2 className="text-xl font-semibold text-gray-900 mb-4">
              11. Termination
            </h2>
            <div className="space-y-4 text-gray-700">
              <p>
                <strong>11.1</strong> You may terminate your account at any time.
              </p>
              <p>
                <strong>11.2</strong> We may suspend or terminate access if you
                breach these Terms or fail to pay fees when due.
              </p>
              <p>
                <strong>11.3</strong> Upon termination, we will make Customer
                Data available for export for thirty (30) days, after which it
                may be deleted or anonymised (except for aggregated/anonymised
                data and records we are legally required to retain).
              </p>
            </div>
          </section>

          {/* Section 12 */}
          <section className="mt-12">
            <h2 className="text-xl font-semibold text-gray-900 mb-4">
              12. Governing Law and Dispute Resolution
            </h2>
            <div className="space-y-4 text-gray-700">
              <p>
                <strong>12.1</strong> These Terms shall be governed by the laws
                of the Republic of Kenya.
              </p>
              <p>
                <strong>12.2</strong> Any dispute shall first be addressed
                amicably. If unresolved, it shall be referred to arbitration in
                Nairobi in accordance with the Arbitration Act of Kenya.
              </p>
            </div>
          </section>

          {/* Section 13 */}
          <section className="mt-12">
            <h2 className="text-xl font-semibold text-gray-900 mb-4">
              13. Changes to These Terms
            </h2>
            <p className="text-gray-700">
              We may update these Terms from time to time. Continued use of the
              Service after changes constitutes acceptance of the revised Terms.
            </p>
          </section>

          {/* Section 14 */}
          <section className="mt-12">
            <h2 className="text-xl font-semibold text-gray-900 mb-4">
              14. Contact
            </h2>
            <div className="text-gray-700 space-y-2">
              <p>
                <strong>Email:</strong>{" "}
                <a
                  href="mailto:legal@nethub.co.ke"
                  className="text-emerald-700 hover:underline"
                >
                  legal@nethub.co.ke
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

export default TermsPage;