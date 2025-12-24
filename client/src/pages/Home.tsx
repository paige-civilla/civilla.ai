import Navbar from "@/components/Navbar";
import Hero from "@/components/Hero";
import ToolsSection from "@/components/ToolsSection";
import CTASection from "@/components/CTASection";
import SafetySection from "@/components/SafetySection";
import StepsSection from "@/components/StepsSection";
import TestimonialsSection from "@/components/TestimonialsSection";
import FAQSection from "@/components/FAQSection";
import Footer from "@/components/Footer";

export default function Home() {
  return (
    <div className="flex flex-col items-start w-full min-h-screen" data-testid="page-home">
      <Navbar />
      <Hero 
        titleMaxWidthClass="max-w-[14ch] sm:max-w-[16ch] lg:max-w-[18ch]"
        subtitleMaxWidthClass="max-w-[14ch] sm:max-w-[16ch] lg:max-w-[18ch]"
      />
      <ToolsSection />
      <StepsSection />
      <CTASection />
      <SafetySection />
      <TestimonialsSection />
      <FAQSection />
      <Footer />
    </div>
  );
}
