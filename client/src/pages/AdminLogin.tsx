import { Link } from "wouter";
import NavbarCream from "@/components/NavbarCream";
import Footer from "@/components/Footer";

export default function AdminLogin() {
  return (
    <div className="flex flex-col min-h-screen bg-cream dark:bg-neutral-darkest text-neutral-darkest dark:text-cream">
      <NavbarCream />
      
      <section className="bg-[#e7ebea] dark:bg-neutral-darkest/80 w-full flex flex-col items-center px-5 md:px-16 py-16 md:py-28">
        <div className="flex flex-col items-center max-w-container w-full">
          <div className="flex flex-col gap-6 md:gap-8 items-center max-w-[768px] w-full">
            <div className="flex flex-col gap-4 md:gap-6 items-center text-neutral-darkest text-center w-full">
              <h1 className="font-heading font-bold text-heading-1-mobile md:text-[84px] tracking-[0.48px] md:tracking-[0.84px] w-full">
                Admin Login
              </h1>
              <p className="font-sans text-sm md:text-[20px] text-neutral-darkest/80 w-full">
                Admin login is coming soon. This area is reserved for <span className="italic font-medium">civilla</span> team members.
              </p>
            </div>
            <div className="flex gap-4 items-start flex-wrap justify-center">
              <Link href="/">
                <span 
                  className="inline-block bg-bush text-white font-bold text-sm md:text-body-regular leading-[1.6] px-6 py-2.5 rounded-md button-inset-shadow cursor-pointer"
                  data-testid="link-home"
                >
                  Back To Home
                </span>
              </Link>
              <Link href="/contact">
                <span 
                  className="inline-block bg-transparent border-2 border-neutral-darkest text-neutral-darkest font-bold text-sm md:text-body-regular leading-[1.6] px-[22px] py-2 rounded-md cursor-pointer"
                  data-testid="link-contact"
                >
                  Contact Us
                </span>
              </Link>
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
