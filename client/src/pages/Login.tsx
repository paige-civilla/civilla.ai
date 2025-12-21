import { Link } from "wouter";
import NavbarCream from "@/components/NavbarCream";
import Footer from "@/components/Footer";

export default function Login() {
  return (
    <div className="flex flex-col min-h-screen bg-cream">
      <NavbarCream />
      
      <main className="flex-1 mx-auto max-w-3xl px-4 py-12">
        <h1 className="font-heading font-bold text-heading-2-mobile md:text-heading-2 tracking-[0.44px] md:tracking-[0.6px] text-neutral-darkest">
          Login
        </h1>
        <p className="mt-4 font-sans text-body-medium leading-[1.6] text-neutral-darkest/80">
          Login is coming soon. For now, you can explore Civilla and view Plans & Pricing.
        </p>

        <div className="mt-8 flex flex-wrap gap-3">
          <Link href="/plans">
            <span 
              className="inline-block rounded-xl px-5 py-3 font-sans font-bold bg-bush text-white button-inset-shadow cursor-pointer"
              data-testid="link-plans"
            >
              Plans & Pricing
            </span>
          </Link>
          <Link href="/how-civilla-works">
            <span 
              className="inline-block rounded-xl px-5 py-3 font-sans font-bold border-2 border-neutral-darkest text-neutral-darkest cursor-pointer"
              data-testid="link-how-civilla-works"
            >
              How Civilla Works
            </span>
          </Link>
        </div>

        <p className="mt-10 font-sans text-sm text-neutral-darkest/60">
          Educational, Research, And Organizational Support — Not Legal Advice Or Representation.
        </p>
      </main>
      
      <Footer />
    </div>
  );
}
