import { useState } from "react";
import { ChevronRight, Check } from "lucide-react";
import NavbarCream from "@/components/NavbarCream";
import Footer from "@/components/Footer";

export default function Accessibility() {
  const [formData, setFormData] = useState({
    name: "",
    email: "",
    pageUrl: typeof window !== "undefined" ? window.location.href : "",
    deviceBrowser: "",
    description: ""
  });

  const handleInputChange = (e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement>) => {
    const { name, value } = e.target;
    setFormData(prev => ({ ...prev, [name]: value }));
  };

  const handleSubmitReport = (e: React.FormEvent) => {
    e.preventDefault();
    
    const subject = encodeURIComponent("Accessibility issue report");
    const body = encodeURIComponent(
      `Name: ${formData.name || "Not provided"}\n` +
      `Email: ${formData.email}\n` +
      `Page URL: ${formData.pageUrl || "Not provided"}\n` +
      `Device/Browser: ${formData.deviceBrowser || "Not provided"}\n\n` +
      `What happened:\n${formData.description}`
    );
    
    window.location.href = `mailto:hello@civilla.ai?subject=${subject}&body=${body}`;
  };

  const accessibilityFeatures = [
    "Keyboard navigation support (tab, enter, escape where appropriate)",
    "Visible focus states",
    "Screen-reader-friendly structure (headings, labels, landmarks)",
    "Readable typography and contrast-aware styling",
    "Reduced-motion support when your device requests it"
  ];

  return (
    <div className="min-h-screen flex flex-col" data-testid="page-accessibility">
      <NavbarCream />

      {/* Hero Section */}
      <section className="bg-[#e7ebea] py-16 md:py-28 px-5 md:px-16" data-testid="section-hero">
        <div className="max-w-container mx-auto">
          <div className="flex flex-col gap-6 md:gap-8 items-center text-center max-w-[768px] mx-auto">
            <div className="flex flex-col gap-4 md:gap-6 items-center w-full">
              <h1 className="font-figtree font-bold text-heading-1-mobile md:text-[84px] leading-[1.1] tracking-[0.48px] md:tracking-[0.84px] text-neutral-darkest" style={{ textWrap: "balance" }}>
                Accessibility Matters
              </h1>
              <p className="font-arimo text-lg md:text-xl leading-[1.6] text-neutral-darkest" style={{ textWrap: "pretty" }}>
                <span className="italic font-medium">civilla</span> is designed to be usable for as many people as possible—regardless of ability, device, or circumstance.
              </p>
            </div>
            <a 
              href="#report" 
              className="flex items-center gap-2 font-arimo font-bold text-base md:text-lg text-neutral-darkest underline underline-offset-4 decoration-neutral-darkest/40 hover:decoration-neutral-darkest transition-colors"
              data-testid="link-report-issue"
            >
              Report an accessibility issue
              <ChevronRight className="w-5 h-5" />
            </a>
          </div>
        </div>
      </section>

      {/* What We're Doing Section */}
      <section className="bg-cream py-16 md:py-28 px-5 md:px-16" data-testid="section-what-we-do">
        <div className="max-w-container mx-auto">
          <div className="flex flex-col gap-8 md:gap-12 max-w-3xl">
            <div className="flex flex-col gap-4 md:gap-6">
              <h2 className="font-figtree font-bold text-heading-2-mobile md:text-[60px] leading-[1.2] tracking-[0.44px] md:tracking-[0.6px] text-neutral-darkest" style={{ textWrap: "balance" }}>
                What We're Doing For Accessibility
              </h2>
              <p className="font-arimo text-base md:text-xl leading-[1.6] text-neutral-darkest">
                We design with accessibility in mind and continually improve based on real feedback.
              </p>
            </div>
            
            <ul className="flex flex-col gap-4">
              {accessibilityFeatures.map((feature, index) => (
                <li key={index} className="flex gap-4 items-start">
                  <div className="w-6 h-6 rounded-full bg-bush/20 flex items-center justify-center flex-shrink-0 mt-0.5">
                    <Check className="w-4 h-4 text-bush" />
                  </div>
                  <span className="font-arimo text-base md:text-lg leading-[1.6] text-neutral-darkest">
                    {feature}
                  </span>
                </li>
              ))}
            </ul>
            
            <p className="font-arimo text-sm md:text-base leading-[1.6] text-neutral-darkest/80 italic">
              We strive to meet WCAG 2.1 AA guidelines. If something isn't working for you, tell us—we'll fix it.
            </p>
          </div>
        </div>
      </section>

      {/* Request Accommodations Section */}
      <section className="bg-[#0c2f24] py-16 md:py-28 px-5 md:px-16" data-testid="section-accommodations">
        <div className="max-w-container mx-auto">
          <div className="flex flex-col gap-6 md:gap-8 max-w-3xl">
            <div className="flex flex-col gap-4 md:gap-6">
              <h2 className="font-figtree font-bold text-heading-2-mobile md:text-[60px] leading-[1.2] tracking-[0.44px] md:tracking-[0.6px] text-white" style={{ textWrap: "balance" }}>
                Request Accommodations
              </h2>
              <p className="font-arimo text-base md:text-xl leading-[1.6] text-white">
                If you need an accommodation to use <span className="italic font-medium">civilla</span>, email us and tell us what would help.
              </p>
            </div>
            <a 
              href="mailto:hello@civilla.ai?subject=Accessibility%20accommodation%20request"
              className="flex items-center gap-2 font-arimo font-bold text-base md:text-lg text-white underline underline-offset-4 decoration-white/40 hover:decoration-white transition-colors w-fit"
              data-testid="link-accommodation-email"
            >
              hello@civilla.ai
              <ChevronRight className="w-5 h-5" />
            </a>
          </div>
        </div>
      </section>

      {/* Report an Accessibility Issue Section */}
      <section 
        id="report" 
        className="bg-cream py-16 md:py-28 px-5 md:px-16 scroll-mt-20" 
        data-testid="section-report"
      >
        <div className="max-w-container mx-auto">
          <div className="flex flex-col gap-8 md:gap-12 max-w-2xl">
            <div className="flex flex-col gap-4 md:gap-6">
              <h2 className="font-figtree font-bold text-heading-2-mobile md:text-[60px] leading-[1.2] tracking-[0.44px] md:tracking-[0.6px] text-neutral-darkest" style={{ textWrap: "balance" }}>
                Report An Accessibility Issue
              </h2>
              <p className="font-arimo text-base md:text-xl leading-[1.6] text-neutral-darkest">
                Tell us what isn't working so we can fix it.
              </p>
            </div>

            <form onSubmit={handleSubmitReport} className="flex flex-col gap-5 md:gap-6">
              <div className="flex flex-col gap-2">
                <label 
                  htmlFor="report-name" 
                  className="font-arimo text-sm md:text-base font-medium leading-[1.6] text-neutral-darkest"
                >
                  Name <span className="font-normal text-neutral-darkest/60">(optional)</span>
                </label>
                <input 
                  type="text"
                  id="report-name"
                  name="name"
                  value={formData.name}
                  onChange={handleInputChange}
                  className="bg-white border-2 border-neutral-darkest/20 focus:border-neutral-darkest rounded-xl px-4 py-3 font-arimo text-base md:text-lg text-neutral-darkest outline-none transition-colors"
                  aria-describedby="report-name-hint"
                  data-testid="input-name"
                />
                <span id="report-name-hint" className="sr-only">Your name helps us follow up personally</span>
              </div>

              <div className="flex flex-col gap-2">
                <label 
                  htmlFor="report-email" 
                  className="font-arimo text-sm md:text-base font-medium leading-[1.6] text-neutral-darkest"
                >
                  Email <span className="text-red-600">*</span>
                </label>
                <input 
                  type="email"
                  id="report-email"
                  name="email"
                  value={formData.email}
                  onChange={handleInputChange}
                  required
                  className="bg-white border-2 border-neutral-darkest/20 focus:border-neutral-darkest rounded-xl px-4 py-3 font-arimo text-base md:text-lg text-neutral-darkest outline-none transition-colors"
                  aria-describedby="report-email-hint"
                  data-testid="input-email"
                />
                <span id="report-email-hint" className="font-arimo text-xs md:text-sm text-neutral-darkest/60">
                  We'll use this to follow up with you
                </span>
              </div>

              <div className="flex flex-col gap-2">
                <label 
                  htmlFor="report-page" 
                  className="font-arimo text-sm md:text-base font-medium leading-[1.6] text-neutral-darkest"
                >
                  Page you were on <span className="font-normal text-neutral-darkest/60">(optional)</span>
                </label>
                <input 
                  type="text"
                  id="report-page"
                  name="pageUrl"
                  value={formData.pageUrl}
                  onChange={handleInputChange}
                  placeholder="e.g., /dashboard or homepage"
                  className="bg-white border-2 border-neutral-darkest/20 focus:border-neutral-darkest rounded-xl px-4 py-3 font-arimo text-base md:text-lg text-neutral-darkest outline-none transition-colors placeholder:text-neutral-darkest/40"
                  data-testid="input-page"
                />
              </div>

              <div className="flex flex-col gap-2">
                <label 
                  htmlFor="report-device" 
                  className="font-arimo text-sm md:text-base font-medium leading-[1.6] text-neutral-darkest"
                >
                  Device and browser <span className="font-normal text-neutral-darkest/60">(optional)</span>
                </label>
                <input 
                  type="text"
                  id="report-device"
                  name="deviceBrowser"
                  value={formData.deviceBrowser}
                  onChange={handleInputChange}
                  placeholder="e.g., iPhone 14, Safari"
                  className="bg-white border-2 border-neutral-darkest/20 focus:border-neutral-darkest rounded-xl px-4 py-3 font-arimo text-base md:text-lg text-neutral-darkest outline-none transition-colors placeholder:text-neutral-darkest/40"
                  data-testid="input-device"
                />
              </div>

              <div className="flex flex-col gap-2">
                <label 
                  htmlFor="report-description" 
                  className="font-arimo text-sm md:text-base font-medium leading-[1.6] text-neutral-darkest"
                >
                  What happened <span className="text-red-600">*</span>
                </label>
                <textarea 
                  id="report-description"
                  name="description"
                  value={formData.description}
                  onChange={handleInputChange}
                  required
                  placeholder="Describe the accessibility issue you encountered"
                  className="bg-white border-2 border-neutral-darkest/20 focus:border-neutral-darkest rounded-xl px-4 py-3 font-arimo text-base md:text-lg text-neutral-darkest outline-none transition-colors placeholder:text-neutral-darkest/40 min-h-[140px] md:min-h-[180px] resize-y"
                  aria-describedby="report-description-hint"
                  data-testid="input-description"
                />
                <span id="report-description-hint" className="font-arimo text-xs md:text-sm text-neutral-darkest/60">
                  Include details like what you were trying to do and what went wrong
                </span>
              </div>

              <button 
                type="submit"
                className="bg-bush text-white font-arimo font-bold text-base md:text-lg px-6 py-3 rounded-xl w-fit mt-2 hover:bg-bush/90 transition-colors focus:outline-none focus:ring-2 focus:ring-bush focus:ring-offset-2"
                data-testid="button-submit-report"
              >
                Email This Report
              </button>
            </form>
          </div>
        </div>
      </section>

      <Footer />
    </div>
  );
}

{/*
================================================================================
ACCESSIBILITY TESTING CHECKLIST (Internal Dev Reference)
================================================================================

Before releasing changes to this page or the broader app, run through:

1. KEYBOARD-ONLY NAVIGATION TEST
   - Tab through entire page without using mouse
   - Verify all interactive elements are reachable
   - Check that focus order is logical (top to bottom, left to right)
   - Ensure focus is visible on all elements
   - Test Enter/Space to activate buttons and links
   - Test Escape to close any modals or dropdowns

2. SCREEN READER TEST
   - macOS/iOS: Use VoiceOver (Cmd+F5 to toggle)
   - Windows: Use NVDA (free) or Windows Narrator
   - Verify headings are announced correctly and in order
   - Verify form labels are read before inputs
   - Check that images have meaningful alt text
   - Ensure landmarks (main, nav, footer) are announced

3. LIGHTHOUSE ACCESSIBILITY AUDIT
   - Open Chrome DevTools > Lighthouse tab
   - Run accessibility-only audit
   - Aim for score of 90+ 
   - Address any flagged issues

4. REDUCED MOTION TEST
   - Enable "Reduce motion" in OS accessibility settings
   - Verify animations are disabled or minimized
   - Check that prefers-reduced-motion media query is respected

5. COLOR CONTRAST CHECK
   - Use browser extension or DevTools to verify contrast ratios
   - Text should meet 4.5:1 for normal text, 3:1 for large text
   - Interactive elements should have sufficient contrast

================================================================================
*/}
