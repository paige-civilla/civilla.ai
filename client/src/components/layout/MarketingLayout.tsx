import { useTheme } from "@/contexts/ThemeContext";
import Navbar from "@/components/Navbar";
import Footer from "@/components/Footer";

interface MarketingLayoutProps {
  children: React.ReactNode;
}

export default function MarketingLayout({ children }: MarketingLayoutProps) {
  const { theme } = useTheme();

  return (
    <div 
      className={`theme-marketing min-h-screen flex flex-col ${theme === "dark" ? "dark" : ""}`}
      data-testid="marketing-layout"
    >
      <Navbar />
      <main className="flex-1 w-full">
        {children}
      </main>
      <Footer />
    </div>
  );
}
