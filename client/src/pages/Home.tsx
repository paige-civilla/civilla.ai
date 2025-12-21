import Navbar from "@/components/Navbar";
import Hero from "@/components/Hero";
import ToolsSection from "@/components/ToolsSection";
import StepsSection from "@/components/StepsSection";
import TestimonialsSection from "@/components/TestimonialsSection";
import FAQSection from "@/components/FAQSection";
import Footer from "@/components/Footer";

export default function Home() {
  return (
    <div className="flex flex-col items-start w-full min-h-screen" data-testid="page-home">
      <Navbar />
      <Hero />
      <ToolsSection />
      <StepsSection />
      <TestimonialsSection />
      <FAQSection />
      <Footer />
    </div>
  );
}
