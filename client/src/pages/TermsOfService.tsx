import { Link } from "wouter";
import NavbarCream from "@/components/NavbarCream";
import Footer from "@/components/Footer";

const LAST_UPDATED = "December 24, 2025";

const termsContent = [
 {
 id: "agreement",
 title: "1. Agreement To These Terms",
 content: `By accessing or using civilla.ai (the "Service"), you agree to these Terms Of Service ("Terms"). If you do not agree, do not use the Service.`
 },
 {
 id: "education-only",
 title: "2. Education Only",
 content: `civilla.ai provides general educational information and tools to help you understand family-court processes and organize your materials. We do not provide legal advice, legal representation, or attorney services. Using the Service does not create an attorney-client relationship.`,
 footer: `civilla.ai is not affiliated with, endorsed by, or connected to any court, judge, government agency, or legal authority. Court rules, procedures, and outcomes vary by jurisdiction and may change.`
 },
 {
 id: "who-for",
 title: "3. Who The Service Is For",
 content: `The Service is intended for adults who can form a binding contract. If you use the Service on behalf of someone else, you represent you are authorized to do so.`
 },
 {
 id: "responsibilities",
 title: "4. Your Responsibilities",
 content: `You agree to:`,
 bullets: [
 "Provide accurate information you submit to the Service",
 "Use your own judgment for decisions and filings",
 "Confirm court rules, deadlines, and requirements with your local court",
 "Keep your login credentials secure"
 ],
 footer: "You are responsible for any action taken under your account."
 },
 {
 id: "accounts",
 title: "5. Accounts And Security",
 content: `Some features require an account. You must not share your account in ways that compromise security. Notify us if you believe your account has been accessed without permission.`
 },
 {
 id: "acceptable-use",
 title: "6. Acceptable Use",
 content: `You agree not to:`,
 bullets: [
 "Use the Service for unlawful purposes",
 "Upload malware or attempt to disrupt the Service",
 "Attempt to access other users' data",
 "Harass, threaten, or abuse others",
 "Misrepresent civilla.ai as a law firm or legal representative"
 ],
 footer: "We may restrict or suspend access if we believe these Terms are violated."
 },
 {
 id: "your-content",
 title: "7. Your Content And Materials",
 content: `You may upload or enter content (for example: notes, documents, timelines, evidence logs). You retain ownership of your content. You grant civilla.ai a limited license to host, process, and display your content only to operate and improve the Service. Do not upload content you do not have the right to use.`
 },
 {
 id: "ai-outputs",
 title: "8. AI And Generated Outputs",
 content: `Some features may generate summaries, drafts, or suggestions. Outputs may be incomplete or inaccurate. You are responsible for reviewing, editing, and verifying anything you rely on or submit to a court or third party.`
 },
 {
 id: "payments",
 title: "9. Payments, Subscriptions, And Trials",
 content: `If you purchase a paid plan:`,
 bullets: [
 "Prices and billing terms will be shown at checkout",
 "Subscriptions renew unless you cancel",
 "Taxes may apply depending on your location"
 ],
 footer: "If you believe you were billed in error, contact support."
 },
 {
 id: "third-party",
 title: "10. Third-Party Services",
 content: `The Service may rely on third-party providers (for example: hosting, analytics, email, payments). We are not responsible for third-party services we do not control.`
 },
 {
 id: "ip",
 title: "11. Intellectual Property",
 content: `The Service, including the design, text, branding, and software, is owned by civilla.ai and its licensors and is protected by law. You may not copy, reverse engineer, or resell the Service except as permitted by law.`
 },
 {
 id: "disclaimers",
 title: "12. Disclaimers",
 content: `THE SERVICE IS PROVIDED "AS IS" AND "AS AVAILABLE." To the maximum extent permitted by law, civilla.ai disclaims warranties of any kind, including merchantability, fitness for a particular purpose, and non-infringement.`
 },
 {
 id: "liability",
 title: "13. Limitations Of Liability",
 content: `To the maximum extent permitted by law:`,
 bullets: [
 "civilla.ai will not be liable for indirect, incidental, special, consequential, or punitive damages",
 "civilla.ai will not be liable for losses resulting from reliance on educational information, generated content, or court outcomes"
 ],
 footer: "If liability cannot be excluded, it is limited to the amount you paid to use the Service in the 12 months before the event giving rise to the claim (or $100 if you have not paid)."
 },
 {
 id: "indemnification",
 title: "14. Indemnification",
 content: `You agree to defend and indemnify civilla.ai from claims arising out of your content, your use of the Service, or your violation of these Terms.`
 },
 {
 id: "termination",
 title: "15. Suspension And Termination",
 content: `You may stop using the Service at any time. We may suspend or terminate access if required by law, for security reasons, or for violations of these Terms.`
 },
 {
 id: "changes",
 title: "16. Changes To These Terms",
 content: `We may update these Terms from time to time. If changes are material, we will provide notice (for example, via email or within the Service). Continued use means you accept the updated Terms.`
 },
 {
 id: "contact",
 title: "17. Contact",
 content: `Questions about these Terms? Contact us at Admin@civilla.ai or through the Contact page.`,
 hasContactLink: true
 }
];

export default function TermsOfService() {
 return (
 <div className="flex flex-col min-h-screen bg-cream dark:bg-neutral-darkest text-neutral-darkest dark:text-cream" data-testid="page-terms">
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
 data-testid="text-terms-title"
 >
 Terms Of Service
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
 data-testid="text-terms-description"
 >
 Please read these terms carefully before using <span className="italic font-medium">civilla.ai</span>
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
 {termsContent.map((section) => (
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
 Questions about these Terms? Contact us at{" "}
 <a 
 href="mailto:Admin@civilla.ai" 
 className="underline underline-offset-4 decoration-neutral-darkest/40 hover:decoration-neutral-darkest transition-colors"
 >
 Admin@civilla.ai
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
 {section.bullets && (
 <ul className="flex flex-col gap-2 pl-1 mt-1">
 {section.bullets.map((bullet, index) => (
 <li key={index} className="flex gap-3 items-start">
 <span className="text-neutral-darkest/60 mt-0.5">•</span>
 <span className="font-arimo text-base md:text-lg leading-[1.6] text-neutral-darkest">
 {bullet}
 </span>
 </li>
 ))}
 </ul>
 )}
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
