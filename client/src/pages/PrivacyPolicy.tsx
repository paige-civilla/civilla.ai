import NavbarCream from "@/components/NavbarCream";
import Footer from "@/components/Footer";

function HeaderSection() {
  return (
    <section className="bg-[#e7ebea] w-full flex flex-col items-center px-5 md:px-16 py-16 md:py-28" data-testid="section-header">
      <div className="flex flex-col items-center max-w-container w-full">
        <div className="flex flex-col gap-6 md:gap-8 items-center max-w-[768px] w-full">
          <div className="flex flex-col gap-4 items-center w-full">
            <div className="flex flex-col gap-4 md:gap-6 items-center text-neutral-darkest text-center w-full">
              <h1 className="cv-h font-heading text-heading-1-mobile md:text-[84px] tracking-[0.48px] md:tracking-[0.84px] w-full">
                Your privacy matters
              </h1>
              <p className="cv-p font-sans text-sm md:text-[20px] w-full">
                We protect your information with the same care you deserve in this process.
              </p>
            </div>
          </div>
          <div className="flex gap-4 items-start">
            <button 
              className="bg-bush text-white font-bold text-sm md:text-body-regular leading-[1.6] px-6 py-2.5 rounded-xl button-inset-shadow relative"
              data-testid="button-read"
            >
              Read
            </button>
            <button 
              className="bg-transparent border-2 border-neutral-darkest text-neutral-darkest font-bold text-sm md:text-body-regular leading-[1.6] px-[22px] py-2 rounded-xl"
              data-testid="button-contact"
            >
              Contact
            </button>
          </div>
        </div>
      </div>
    </section>
  );
}

function ContentSection() {
  return (
    <section className="bg-cream w-full flex flex-col items-center px-5 md:px-16 py-16 md:py-28" data-testid="section-content">
      <div className="flex flex-col items-center max-w-container w-full">
        <div className="flex flex-col gap-4 md:gap-6 items-start max-w-[768px] w-full">
          <h2 className="cv-h font-heading font-bold text-heading-2-mobile md:text-[60px] tracking-[0.44px] md:tracking-[0.6px] leading-[1.2] text-neutral-darkest w-full">
            How we handle your data
          </h2>
          
          <div className="flex flex-col gap-4 items-start w-full">
            <div className="font-sans font-normal text-sm md:text-[18px] leading-[1.6] text-neutral-darkest w-full">
              <p className="mb-4">
                <span className="italic font-medium">civilla</span> collects information to help you organize your case and understand family law processes. This includes account details like your email and name, documents you upload, messages you write, and how you use the platform. We also collect technical information such as your IP address and browser type to keep the service running smoothly and secure.
              </p>
              <p className="mb-4">
                Your case materials—documents, timelines, evidence, and notes—belong to you. We store them securely on encrypted servers and never share them with third parties, sell them, or use them for marketing. You can download or delete your information at any time. We keep your data only as long as your account is active, unless legal requirements ask us to retain it longer.
              </p>
              <p className="mb-4">
                <span className="italic font-medium">civilla</span> uses industry-standard encryption and security practices to protect your information from unauthorized access. We limit employee access to your data and conduct regular security reviews. However, no system is completely risk-free, and we encourage you to use a strong password and keep your login credentials private.
              </p>
              <p>
                We may update this policy as our service evolves. We will notify you of significant changes by email or through the platform. Your continued use of <span className="italic font-medium">civilla</span> after updates means you accept the new terms. If you have questions about how we handle your information, contact us through the support page.
              </p>
            </div>

            <div className="font-sans font-normal text-sm md:text-[18px] leading-[1.6] text-neutral-darkest w-full mt-4">
              <p className="mb-4">
                <span className="italic font-medium">civilla</span> collects information to help you organize your case and understand family law processes. This includes account details like your email and name, documents you upload, messages you write, and how you use the platform. We also collect technical information such as your IP address and browser type to keep the service running smoothly and secure.
              </p>
              <p className="mb-4">
                Your case materials—documents, timelines, evidence, and notes—belong to you. We store them securely on encrypted servers and never share them with third parties, sell them, or use them for marketing. You can download or delete your information at any time. We keep your data only as long as your account is active, unless legal requirements ask us to retain it longer.
              </p>
              <p className="mb-4">
                <span className="italic font-medium">civilla</span> uses industry-standard encryption and security practices to protect your information from unauthorized access. We limit employee access to your data and conduct regular security reviews. However, no system is completely risk-free, and we encourage you to use a strong password and keep your login credentials private.
              </p>
              <p>
                We may update this policy as our service evolves. We will notify you of significant changes by email or through the platform. Your continued use of <span className="italic font-medium">civilla</span> after updates means you accept the new terms. If you have questions about how we handle your information, contact us through the support page.
              </p>
            </div>

            <div className="font-sans font-normal text-sm md:text-[18px] leading-[1.6] text-neutral-darkest w-full mt-4">
              <p className="mb-4">
                <span className="italic font-medium">civilla</span> collects information to help you organize your case and understand family law processes. This includes account details like your email and name, documents you upload, messages you write, and how you use the platform. We also collect technical information such as your IP address and browser type to keep the service running smoothly and secure.
              </p>
              <p className="mb-4">
                Your case materials—documents, timelines, evidence, and notes—belong to you. We store them securely on encrypted servers and never share them with third parties, sell them, or use them for marketing. You can download or delete your information at any time. We keep your data only as long as your account is active, unless legal requirements ask us to retain it longer.
              </p>
              <p className="mb-4">
                <span className="italic font-medium">civilla</span> uses industry-standard encryption and security practices to protect your information from unauthorized access. We limit employee access to your data and conduct regular security reviews. However, no system is completely risk-free, and we encourage you to use a strong password and keep your login credentials private.
              </p>
              <p>
                We may update this policy as our service evolves. We will notify you of significant changes by email or through the platform. Your continued use of <span className="italic font-medium">civilla</span> after updates means you accept the new terms. If you have questions about how we handle your information, contact us through the support page.
              </p>
            </div>
          </div>
        </div>
      </div>
    </section>
  );
}

export default function PrivacyPolicy() {
  return (
    <div className="min-h-screen flex flex-col">
      <NavbarCream />
      <main className="flex-1">
        <HeaderSection />
        <ContentSection />
      </main>
      <Footer />
    </div>
  );
}
