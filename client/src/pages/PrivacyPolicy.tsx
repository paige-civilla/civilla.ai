import { Link } from "wouter";
import NavbarCream from "@/components/NavbarCream";
import Footer from "@/components/Footer";

const LAST_UPDATED = "December 24, 2025";

const privacyContent = [
  {
    id: "information-we-collect",
    title: "1. Information We Collect",
    content: `civilla.ai collects information to help you organize your case and understand family law processes. This includes account details like your email and name, documents you upload, messages you write, and how you use the platform. We also collect technical information such as your IP address and browser type to keep the service running smoothly and secure.`
  },
  {
    id: "your-content",
    title: "2. Your Content And Confidentiality",
    content: `Your case materials—documents, timelines, evidence, and notes—belong to you. We store them securely on encrypted servers and never share them with third parties, sell them, or use them for marketing. You can download or delete your information at any time. We keep your data only as long as your account is active, unless legal requirements ask us to retain it longer.`,
    footer: `We do not use your private content to train public or third-party artificial intelligence models without your explicit consent.`
  },
  {
    id: "how-we-use",
    title: "3. How We Use Your Information",
    content: `We use your information to provide, maintain, and improve the Service. This includes displaying your case materials, generating educational summaries, sending account notifications, and responding to support requests. We may also use aggregated, non-identifying data to understand how people use civilla.ai and improve our features.`
  },
  {
    id: "security",
    title: "4. Security Practices",
    content: `civilla.ai uses industry-standard encryption and security practices to protect your information from unauthorized access. We limit employee access to your data and conduct regular security reviews. However, no system is completely risk-free, and we encourage you to use a strong password and keep your login credentials private.`
  },
  {
    id: "third-party",
    title: "5. Third-Party Services",
    content: `The Service may use third-party providers for hosting, analytics, email delivery, and payment processing. These providers are contractually required to protect your information and may only use it to perform services on our behalf. We do not sell your personal information to advertisers or data brokers.`
  },
  {
    id: "your-rights",
    title: "6. Your Rights And Choices",
    content: `You have the right to access, correct, or delete your personal information. You can download your data or request account deletion through your account settings or by contacting support. If you are in California, the EU, or other jurisdictions with privacy laws, you may have additional rights under applicable law.`
  },
  {
    id: "cookies",
    title: "7. Cookies And Tracking",
    content: `We use cookies and similar technologies to keep you logged in, remember your preferences, and understand how you use the Service. You can control cookies through your browser settings, though some features may not work properly if cookies are disabled.`
  },
  {
    id: "children",
    title: "8. Children's Privacy",
    content: `civilla.ai is not intended for children under 18. We do not knowingly collect personal information from children. If you believe a child has provided us with personal information, please contact us so we can delete it.`
  },
  {
    id: "changes",
    title: "9. Changes To This Policy",
    content: `We may update this policy as our service evolves. We will notify you of significant changes by email or through the platform. Your continued use of civilla.ai after updates means you accept the new terms.`
  },
  {
    id: "contact",
    title: "10. Contact Us",
    content: `If you have questions about how we handle your information, contact us at hello@civilla.ai or through the Contact page.`,
    hasContactLink: true
  }
];

export default function PrivacyPolicy() {
  return (
    <div className="min-h-screen flex flex-col bg-cream dark:bg-neutral-darkest text-neutral-darkest dark:text-cream" data-testid="page-privacy">
      <NavbarCream />
      
      {/* Hero Section */}
      <section className="bg-[#e7ebea] dark:bg-neutral-darkest/80 px-5 md:px-16 py-16 md:py-28" data-testid="section-hero">
        <div className="max-w-container mx-auto">
          <div className="flex flex-col gap-6 md:gap-8 items-center max-w-[768px] mx-auto">
            <div className="flex flex-col gap-4 items-center w-full">
              <div className="flex flex-col gap-4 md:gap-6 items-center w-full text-neutral-darkest text-center">
                <h1 
                  className="font-figtree font-bold text-heading-1-mobile md:text-[84px] leading-[1.1] tracking-[0.48px] md:tracking-[0.84px] w-full"
                  style={{ textWrap: "balance" }}
                  data-testid="text-privacy-title"
                >
                  Privacy Policy
                </h1>
                <p className="font-arimo font-normal text-sm md:text-base leading-[1.6] text-neutral-darkest/70">
                  Civilla LLC (DBA <span className="italic font-medium">civilla.ai</span>)
                </p>
                <p className="font-arimo font-normal text-sm md:text-base leading-[1.6] text-neutral-darkest/70">
                  Last Updated: {LAST_UPDATED}
                </p>
                <p 
                  className="font-arimo font-normal text-base md:text-xl leading-[1.6] w-full mt-2"
                  style={{ textWrap: "pretty" }}
                  data-testid="text-privacy-description"
                >
                  We protect your information with the same care you deserve in this process.
                </p>
              </div>
            </div>
            <Link href="/contact">
              <button 
                className="bg-bush text-white font-arimo font-bold text-base md:text-lg leading-[1.6] px-6 py-3 rounded-xl"
                data-testid="button-contact-support"
              >
                Contact Support
              </button>
            </Link>
          </div>
        </div>
      </section>

      {/* Content Section */}
      <section className="bg-cream px-5 md:px-16 py-16 md:py-28" data-testid="section-content">
        <div className="max-w-container mx-auto">
          <div className="max-w-3xl mx-auto">
            <div className="flex flex-col gap-8 md:gap-10">
              {privacyContent.map((section) => (
                <div key={section.id} id={section.id} className="flex flex-col gap-3 scroll-mt-20">
                  <h2 
                    className="font-figtree font-bold text-xl md:text-2xl leading-[1.2] tracking-[0.01em] text-neutral-darkest"
                    data-testid={`text-${section.id}-title`}
                  >
                    {section.title}
                  </h2>
                  <p 
                    className="font-arimo font-normal text-base md:text-lg leading-[1.6] text-neutral-darkest"
                    style={{ textWrap: "pretty" }}
                  >
                    {section.id === "contact" ? (
                      <>
                        If you have questions about how we handle your information, contact us at{" "}
                        <a 
                          href="mailto:hello@civilla.ai" 
                          className="underline underline-offset-4 decoration-neutral-darkest/40 hover:decoration-neutral-darkest transition-colors"
                        >
                          hello@civilla.ai
                        </a>{" "}
                        or through the{" "}
                        <Link 
                          href="/contact" 
                          className="underline underline-offset-4 decoration-neutral-darkest/40 hover:decoration-neutral-darkest transition-colors"
                        >
                          Contact page
                        </Link>.
                      </>
                    ) : (
                      section.content
                    )}
                  </p>
                  {section.footer && (
                    <p className="font-arimo font-normal text-base md:text-lg leading-[1.6] text-neutral-darkest mt-2">
                      {section.footer}
                    </p>
                  )}
                </div>
              ))}
            </div>
          </div>
        </div>
      </section>

      <Footer />
    </div>
  );
}
