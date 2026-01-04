import Navbar from "@/components/Navbar";
import Hero from "@/components/Hero";
import ToolsSection from "@/components/ToolsSection";
import SafetySection from "@/components/SafetySection";
import StepsSection from "@/components/StepsSection";
import TestimonialsSection from "@/components/TestimonialsSection";
import FAQSection from "@/components/FAQSection";
import Footer from "@/components/Footer";
import { useTheme } from "@/contexts/ThemeContext";

export default function Home() {
  const { theme } = useTheme();
  
  return (
    <div 
      className={`theme-marketing flex flex-col items-start w-full min-h-screen ${theme === "dark" ? "dark" : ""}`} 
      data-testid="page-home"
    >
      <Navbar />
      <Hero />
      <ToolsSection />
      <StepsSection />
      <SafetySection />
      <TestimonialsSection />
      <FAQSection />
      <Footer />
    </div>
  );
}
