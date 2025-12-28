import { ChevronDown, Check, X, Phone } from "lucide-react";
import { Link } from "wouter";
import NavbarCream from "@/components/NavbarCream";
import Footer from "@/components/Footer";
import { FAQ_LEGAL, type FaqItem } from "@/content/faqs";

function StyledCivilla({ text }: { text: string }) {
 const parts = text.split(/(civilla(?:'s)?)/gi);
 return (
 <>
 {parts.map((part, i) => 
 /^civilla('s)?$/i.test(part) ? (
 <span key={i} className="italic font-medium">{part}</span>
 ) : (
 <span key={i}>{part}</span>
 )
 )}
 </>
 );
}

function HeroSection() {
 const jumpLinks = [
 { label: "Education Only", href: "#education" },
 { label: "Helpful Examples", href: "#boundaries" },
 { label: "Privacy Basics", href: "#privacy" },
 { label: "Documents & Court Use", href: "#documents" },
 { label: "FAQ", href: "#faq" }
 ];

 return (
 <section 
 className="bg-[#e7ebea] w-full flex flex-col items-center px-5 md:px-16 py-16 md:py-28"
 data-testid="section-hero"
 >
 <div className="flex flex-col gap-8 items-center max-w-container w-full">
 <div className="flex flex-col gap-6 items-center text-center max-w-[768px]">
 <h1 className="font-figtree font-bold text-[clamp(48px,6vw,84px)] leading-[1.1] tracking-[0.01em] text-neutral-darkest" style={{ textWrap: "balance" }}>
 Legal & Compliance
 </h1>
 <p className="font-arimo text-xl leading-[1.6] text-neutral-darkest" style={{ textWrap: "pretty" }}>
 Clear boundaries, plain language, and what <span className="italic font-medium">civilla</span> can—and cannot—do.
 </p>
 </div>
 
 <nav className="flex flex-wrap justify-center gap-x-6 gap-y-3 pt-4" aria-label="On this page">
 {jumpLinks.map((link) => (
 <a
 key={link.href}
 href={link.href}
 className="font-arimo text-base text-neutral-darkest underline underline-offset-4 decoration-neutral-darkest/40 hover:decoration-neutral-darkest transition-colors"
 data-testid={`link-jump-${link.href.slice(1)}`}
 >
 {link.label}
 </a>
 ))}
 </nav>
 </div>
 </section>
 );
}

function EducationSection() {
 return (
 <section 
 id="education"
 className="bg-cream w-full flex flex-col items-center px-5 md:px-16 py-16 md:py-28 scroll-mt-20"
 data-testid="section-education"
 >
 <div className="flex flex-col items-start max-w-container w-full">
 <div className="flex flex-col md:flex-row gap-8 md:gap-20 items-center w-full">
 <div className="flex-1 w-full aspect-[600/640] rounded-2xl overflow-hidden">
 <img 
 src="https://www.figma.com/api/mcp/asset/45617208-0482-4b11-9665-f57d418aec3c"
 alt="Open book representing education"
 className="w-full h-full object-cover"
 />
 </div>
 <div className="flex-1 flex flex-col gap-6 items-start">
 <div className="flex flex-col gap-4 md:gap-6 items-start text-neutral-darkest w-full">
 <h2 className="font-figtree font-bold text-[clamp(36px,5vw,60px)] leading-[1.2] tracking-[0.01em] w-full">
 Education Only. Never Legal Advice.
 </h2>
 <p className="font-arimo text-lg md:text-xl leading-[1.6] w-full">
 <span className="italic font-medium">civilla</span> is an educational and organizational platform. We are not a law firm, we do not provide legal advice, and we do not represent you in court. Using <span className="italic font-medium">civilla</span> does not create an attorney–client relationship.
 </p>
 </div>
 </div>
 </div>
 </div>
 </section>
 );
}

function BoundariesSection() {
 const canItems = [
 "Explain legal terms and common court steps",
 "Help you organize documents, timelines, and evidence",
 "Show general info and options (not recommendations)"
 ];

 const cannotItems = [
 "Tell you what to file, when to file, or what to say in court",
 "Recommend a legal strategy or predict outcomes",
 "Act as your attorney or contact the court for you"
 ];

 return (
 <section 
 id="boundaries"
 className="bg-bush w-full flex flex-col items-center px-5 md:px-16 py-16 md:py-28 scroll-mt-20"
 data-testid="section-boundaries"
 >
 <div className="flex flex-col items-start max-w-container w-full">
 <div className="flex flex-col-reverse md:flex-row gap-8 md:gap-20 items-center w-full">
 <div className="flex-1 flex flex-col gap-6 md:gap-8 items-start">
 <div className="flex flex-col gap-6 items-start w-full">
 <div className="flex flex-col gap-4 md:gap-6 items-start text-white w-full">
 <h2 className="font-figtree font-bold text-[clamp(36px,5vw,60px)] leading-[1.2] tracking-[0.01em] w-full">
 Helpful Examples
 </h2>
 <p className="font-arimo text-lg md:text-xl leading-[1.6] w-full">
 We provide education and organization support—so you can feel informed and prepared.
 </p>
 </div>
 <div className="flex flex-col gap-4 py-2 w-full">
 <span className="font-arimo text-base md:text-lg font-semibold text-white">We can:</span>
 {canItems.map((item, index) => (
 <div key={index} className="flex gap-4 items-start w-full">
 <div className="w-6 h-6 rounded-full bg-white/20 flex items-center justify-center flex-shrink-0 mt-0.5">
 <Check className="w-4 h-4 text-white" />
 </div>
 <span className="font-arimo text-base md:text-lg leading-[1.6] text-white">
 {item}
 </span>
 </div>
 ))}
 <span className="font-arimo text-base md:text-lg font-semibold text-white mt-2">We can't:</span>
 {cannotItems.map((item, index) => (
 <div key={`cannot-${index}`} className="flex gap-4 items-start w-full">
 <div className="w-6 h-6 rounded-full bg-white/20 flex items-center justify-center flex-shrink-0 mt-0.5">
 <X className="w-4 h-4 text-white" />
 </div>
 <span className="font-arimo text-base md:text-lg leading-[1.6] text-white">
 {item}
 </span>
 </div>
 ))}
 </div>
 <p className="font-arimo text-sm leading-[1.6] text-white/70 italic">
 *Education and organization only or representation.
 </p>
 </div>
 </div>
 <div className="flex-1 w-full aspect-[600/640] rounded-2xl overflow-hidden">
 <img 
 src="https://www.figma.com/api/mcp/asset/a8e88eac-3797-4930-8f68-b462609e9e2a"
 alt="Door representing boundaries"
 className="w-full h-full object-cover"
 />
 </div>
 </div>
 </div>
 </section>
 );
}

function PrivacySection() {
 return (
 <section 
 id="privacy"
 className="bg-cream w-full flex flex-col items-center px-5 md:px-16 py-16 md:py-28 scroll-mt-20"
 data-testid="section-privacy"
 >
 <div className="flex flex-col gap-6 items-center max-w-3xl w-full text-center">
 <h2 className="font-figtree font-bold text-[clamp(36px,5vw,60px)] leading-[1.2] tracking-[0.01em] text-neutral-darkest">
 Privacy Basics
 </h2>
 <p className="font-arimo text-lg md:text-xl leading-[1.6] text-neutral-darkest">
 We treat your information with care and limit access to what's needed to operate <span className="italic font-medium">civilla</span>. We do not sell your personal information. For full details, refer to our <Link href="/privacy-policy" className="underline underline-offset-4">Privacy Policy</Link>.
 </p>
 </div>
 </section>
 );
}

function DocumentsSection() {
 return (
 <section 
 id="documents"
 className="bg-[#f2f2f2] w-full flex flex-col items-center px-5 md:px-16 py-16 md:py-28 scroll-mt-20"
 data-testid="section-documents"
 >
 <div className="flex flex-col gap-6 items-center max-w-3xl w-full text-center">
 <h2 className="font-figtree font-bold text-[clamp(36px,5vw,60px)] leading-[1.2] tracking-[0.01em] text-neutral-darkest">
 Documents And Court Use
 </h2>
 <p className="font-arimo text-lg md:text-xl leading-[1.6] text-neutral-darkest">
 Documents generated in <span className="italic font-medium">civilla</span> are educational drafts and may include disclaimers or watermarks. You are responsible for reviewing, editing, and confirming any document meets your local court's rules and filing requirements. If you can, consult a licensed attorney for legal advice.
 </p>
 </div>
 </section>
 );
}

function EmergencySection() {
 return (
 <section 
 className="bg-[#0c2f24] w-full flex flex-col items-center px-5 md:px-16 py-16 md:py-28"
 data-testid="section-emergency"
 >
 <div className="flex flex-col gap-8 items-center max-w-3xl w-full text-center">
 <div className="flex flex-col gap-6">
 <h2 className="font-figtree font-bold text-[clamp(36px,5vw,60px)] leading-[1.2] tracking-[0.01em] text-white">
 <span className="italic font-medium">civilla</span> Is Not An Emergency Service
 </h2>
 <p className="font-arimo text-lg md:text-xl leading-[1.6] text-white">
 If you are in immediate danger, call local emergency services. If you need crisis support, contact local hotlines available in your area.
 </p>
 </div>
 <div className="flex flex-col gap-4 py-2">
 <div className="flex gap-4 items-center justify-center">
 <Phone className="w-6 h-6 text-white flex-shrink-0" />
 <span className="font-arimo text-lg leading-[1.6] text-white">
 Call 911 for emergencies
 </span>
 </div>
 <div className="flex gap-4 items-center justify-center">
 <Phone className="w-6 h-6 text-white flex-shrink-0" />
 <span className="font-arimo text-lg leading-[1.6] text-white">
 Call or text 988 for crisis support (24/7)
 </span>
 </div>
 </div>
 </div>
 </section>
 );
}

function FAQAccordion({ items }: { items: FaqItem[] }) {
 return (
 <div className="divide-y divide-neutral-darkest/10 rounded-2xl border border-neutral-darkest/15 bg-white/40">
 {items.map((item) => (
 <details key={item.id} className="group p-5">
 <summary className="flex cursor-pointer list-none items-center justify-between gap-4">
 <span className="font-arimo text-base sm:text-lg font-semibold text-neutral-darkest">
 <StyledCivilla text={item.q} />
 </span>
 <ChevronDown className="h-5 w-5 opacity-70 transition-transform group-open:rotate-180" aria-hidden="true" />
 </summary>
 <div className="mt-3 font-arimo text-sm sm:text-base leading-relaxed text-neutral-darkest/80">
 <StyledCivilla text={item.a} />
 </div>
 </details>
 ))}
 </div>
 );
}

function FAQSection() {
 return (
 <section 
 id="faq"
 className="bg-[#e7ebea] w-full flex flex-col items-center px-5 md:px-16 py-16 md:py-28 scroll-mt-20"
 data-testid="section-faq"
 >
 <div className="flex flex-col gap-12 md:gap-16 items-center max-w-container w-full">
 <div className="flex flex-col gap-4 items-center max-w-[768px] text-neutral-darkest text-center w-full">
 <h2 className="font-figtree font-bold text-[clamp(36px,5vw,60px)] leading-[1.2] tracking-[0.01em] w-full">
 FAQ
 </h2>
 <p className="font-arimo text-lg md:text-xl leading-[1.6] w-full">
 Answers about how <span className="italic font-medium">civilla</span> works and what it cannot do.
 </p>
 </div>

 <div className="max-w-3xl w-full">
 <FAQAccordion items={FAQ_LEGAL} />
 </div>
 
 <p className="font-arimo text-base md:text-lg leading-[1.6] text-neutral-darkest/70 text-center max-w-2xl">
 Need help finding a lawyer?{" "}
 <a 
 href="https://www.americanbar.org/groups/legal_services/flh-home/flh-bar-directories-and-lawyer-finders/" 
 target="_blank" 
 rel="noopener noreferrer"
 className="underline underline-offset-4 decoration-neutral-darkest/40 hover:decoration-neutral-darkest transition-colors"
 >
 Start with your state bar or local legal aid.
 </a>
 </p>
 </div>
 </section>
 );
}

export default function LegalCompliance() {
 return (
 <div className="min-h-screen flex flex-col">
 <NavbarCream />
 <main className="flex-1">
 <HeroSection />
 <EducationSection />
 <BoundariesSection />
 <PrivacySection />
 <DocumentsSection />
 <EmergencySection />
 <FAQSection />
 </main>
 <Footer />
 </div>
 );
}
