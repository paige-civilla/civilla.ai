import NavbarCream from "@/components/NavbarCream";
import Footer from "@/components/Footer";

export default function Login() {
  return (
    <div className="flex flex-col min-h-screen bg-cream">
      <NavbarCream />
      
      <main className="flex-1 flex flex-col items-center justify-center px-5 py-16">
        <div className="max-w-md w-full text-center">
          <h1 className="font-heading font-bold text-heading-2-mobile md:text-heading-2 tracking-[0.44px] md:tracking-[0.6px] text-neutral-darkest mb-6">
            Coming Soon
          </h1>
          <p className="font-sans font-normal text-body-medium leading-[1.6] text-neutral-darkest/80 mb-8">
            Login and account features are on the way. In the meantime, explore what Civilla offers.
          </p>
          <a 
            href="/"
            className="inline-block bg-bush text-white font-sans font-bold text-body-regular px-6 py-2.5 rounded-xl button-inset-shadow"
            data-testid="link-back-home"
          >
            Back to Home
          </a>
        </div>
      </main>
      
      <Footer />
    </div>
  );
}
