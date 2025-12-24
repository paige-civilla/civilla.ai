import { Mail } from "lucide-react";
import NavbarCream from "@/components/NavbarCream";
import Footer from "@/components/Footer";

export default function Careers() {
  const handleEmailClick = () => {
    window.location.href = "mailto:careers@civilla.ai?subject=Resume Submission";
  };

  return (
    <div className="flex flex-col min-h-screen bg-cream">
      <NavbarCream />
      
      <section className="bg-[#e7ebea] w-full flex flex-col items-center px-5 md:px-16 py-16 md:py-28">
        <div className="flex flex-col items-center max-w-container w-full">
          <div className="flex flex-col gap-6 md:gap-8 items-center max-w-[768px] w-full">
            <div className="flex flex-col gap-4 md:gap-6 items-center text-neutral-darkest text-center w-full">
              <h1 className="font-heading font-bold text-heading-1-mobile md:text-[84px] tracking-[0.48px] md:tracking-[0.84px] w-full">
                Careers
              </h1>
              <p className="font-sans text-sm md:text-[20px] text-neutral-darkest/80 w-full">
                Coming Soon
              </p>
              <p className="font-sans text-sm md:text-[18px] text-neutral-darkest/70 w-full max-w-[600px]">
                We're building something meaningful at <span className="italic font-medium">civilla</span>. If you're passionate about helping families navigate difficult times, we'd love to hear from you.
              </p>
            </div>
            <div className="flex gap-4 items-start flex-wrap justify-center">
              <button 
                onClick={handleEmailClick}
                className="inline-flex items-center gap-2 bg-bush text-white font-bold text-sm md:text-body-regular leading-[1.6] px-6 py-2.5 rounded-md button-inset-shadow cursor-pointer"
                data-testid="button-email-resume"
              >
                <Mail className="w-4 h-4" />
                Email Us Your Resume
              </button>
            </div>
          </div>
        </div>
      </section>

      <main className="flex-1 flex items-center justify-center px-5 py-12">
        <p className="font-sans text-[10px] text-neutral-darkest/60 text-center italic">
          *Educational, Research, And Organizational Support. Not Legal Advice Or Representation.*
        </p>
      </main>
      
      <Footer />
    </div>
  );
}
