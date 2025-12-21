import { Link } from "wouter";
import NavbarCream from "@/components/NavbarCream";
import Footer from "@/components/Footer";
import termsImage from "@assets/casey-horner-4rDCa5hBlCs-unsplash_1766291139825.jpg";

const tableOfContents = [
  { label: "Heading 2", level: 1, active: true },
  { label: "Heading 3", level: 2, active: false },
  { label: "Heading 4", level: 3, active: false },
  { label: "Heading 5", level: 4, active: false },
  { label: "Heading 6", level: 5, active: false },
];

export default function TermsOfService() {
  return (
    <div className="flex flex-col min-h-screen">
      <NavbarCream />
      
      {/* Hero Section */}
      <section className="bg-[#e7ebea] px-16 py-28">
        <div className="max-w-[1280px] mx-auto">
          <div className="flex flex-col gap-8 items-center max-w-[768px] mx-auto">
            <div className="flex flex-col gap-4 items-center w-full">
              <div className="flex items-center w-full">
                <p 
                  className="font-sans font-bold text-base leading-[1.5] text-neutral-darkest text-center"
                  data-testid="text-tagline"
                >
                  Educational
                </p>
              </div>
              <div className="flex flex-col gap-6 items-center w-full text-neutral-darkest text-center">
                <h1 
                  className="font-heading font-bold text-heading-1 leading-[1.1] tracking-[0.84px] w-full"
                  style={{ textWrap: "balance" }}
                  data-testid="text-terms-title"
                >
                  Terms of service
                </h1>
                <p 
                  className="font-sans font-normal text-body-medium leading-[1.6] w-full"
                  style={{ textWrap: "pretty" }}
                  data-testid="text-terms-description"
                >
                  Please read these terms carefully before using civilla.ai
                </p>
              </div>
            </div>
            <div className="flex gap-4 items-start">
              <button 
                className="bg-bush text-white font-sans font-bold text-body leading-[1.6] px-6 py-2.5 rounded-xl shadow-[0px_1px_2px_0px_rgba(7,5,3,0.05)] relative overflow-hidden"
                data-testid="button-read"
              >
                Read
                <div className="absolute inset-0 pointer-events-none shadow-[inset_0px_32px_24px_0px_rgba(255,255,255,0.05),inset_0px_2px_1px_0px_rgba(255,255,255,0.25),inset_0px_0px_0px_1px_rgba(7,5,3,0.15),inset_0px_-2px_1px_0px_rgba(0,0,0,0.2)] rounded-xl" />
              </button>
              <Link href="/">
                <button 
                  className="bg-transparent border-2 border-neutral-darkest text-neutral-darkest font-sans font-bold text-body leading-[1.6] px-[22px] py-2 rounded-xl"
                  data-testid="button-back"
                >
                  Back
                </button>
              </Link>
            </div>
          </div>
        </div>
      </section>

      {/* Content Section */}
      <section className="bg-[#f2f2f2] px-16 py-28">
        <div className="max-w-[1280px] mx-auto">
          <div className="flex items-start justify-between w-full gap-8">
            {/* Rich Text Content */}
            <div className="flex-1 flex flex-col items-start max-w-[768px]">
              {/* Overview */}
              <div className="pb-4 w-full">
                <h2 
                  className="font-heading font-bold text-heading-2 leading-[1.2] tracking-[0.6px] text-neutral-darkest"
                  style={{ textWrap: "balance" }}
                  data-testid="text-overview-title"
                >
                  Overview
                </h2>
              </div>
              <div className="pb-4 w-full">
                <p 
                  className="font-sans font-bold text-body leading-[1.6] text-neutral-darkest"
                  style={{ textWrap: "pretty" }}
                  data-testid="text-overview-bold"
                >
                  Dolor enim eu tortor urna sed duis nulla. Aliquam vestibulum, nulla odio nisl vitae. In aliquet pellentesque aenean hac vestibulum turpis mi bibendum diam. Tempor integer aliquam in vitae malesuada fringilla.
                </p>
              </div>
              <div className="pb-4 w-full">
                <p 
                  className="font-sans font-normal text-body leading-[1.6] text-neutral-darkest"
                  style={{ textWrap: "pretty" }}
                  data-testid="text-overview-paragraph"
                >
                  Mi tincidunt elit, id quisque ligula ac diam, amet. Vel etiam suspendisse morbi eleifend faucibus eget vestibulum felis. Dictum quis montes, sit sit. Tellus aliquam enim urna, etiam. Mauris posuere vulputate arcu amet, vitae nisi, tellus tincidunt. At feugiat sapien varius id.
                </p>
              </div>

              {/* What civilla.ai is */}
              <div className="py-6 w-full">
                <h3 
                  className="font-heading font-bold text-heading-3 leading-[1.2] tracking-[0.48px] text-neutral-darkest"
                  style={{ textWrap: "balance" }}
                  data-testid="text-what-civilla-title"
                >
                  What civilla.ai is
                </h3>
              </div>
              <div className="pb-4 w-full">
                <p 
                  className="font-sans font-normal text-body leading-[1.6] text-neutral-darkest"
                  style={{ textWrap: "pretty" }}
                  data-testid="text-what-civilla-p1"
                >
                  Eget quis mi enim, leo lacinia pharetra, semper. Eget in volutpat mollis at volutpat lectus velit, sed auctor. Porttitor fames arcu quis fusce augue enim. Quis at habitant diam at. Suscipit tristique risus, at donec. In turpis vel et quam imperdiet. Ipsum molestie aliquet sodales id est ac volutpat.
                </p>
              </div>
              <div className="pb-4 w-full">
                <p 
                  className="font-sans font-normal text-body leading-[1.6] text-neutral-darkest"
                  style={{ textWrap: "pretty" }}
                  data-testid="text-what-civilla-p2"
                >
                  Tristique odio senectus nam posuere ornare leo metus, ultricies. Blandit duis ultricies vulputate morbi feugiat cras placerat elit. Aliquam tellus lorem sed ac. Montes, sed mattis pellentesque suscipit accumsan. Cursus viverra aenean magna risus elementum faucibus molestie pellentesque. Arcu ultricies sed mauris vestibulum.
                </p>
              </div>

              {/* Your responsibilities */}
              <div className="pt-6 pb-5 w-full">
                <h4 
                  className="font-heading font-bold text-heading-4 leading-[1.2] tracking-[0.4px] text-neutral-darkest"
                  style={{ textWrap: "balance" }}
                  data-testid="text-responsibilities-title"
                >
                  Your responsibilities
                </h4>
              </div>
              <div className="pb-4 w-full">
                <p 
                  className="font-sans font-normal text-body leading-[1.6] text-neutral-darkest"
                  style={{ textWrap: "pretty" }}
                  data-testid="text-responsibilities-paragraph"
                >
                  Morbi sed imperdiet in ipsum, adipiscing elit dui lectus. Tellus id scelerisque est ultricies ultricies. Duis est sit sed leo nisl, blandit elit sagittis. Quisque tristique consequat quam sed. Nisl at scelerisque amet nulla purus habitasse.
                </p>
              </div>

              {/* Image with caption */}
              <div className="py-12 w-full flex flex-col gap-2">
                <div className="aspect-[768/480] w-full rounded-2xl overflow-hidden">
                  <img 
                    src={termsImage} 
                    alt="Terms of service illustration" 
                    className="w-full h-full object-cover"
                    data-testid="img-terms-illustration"
                  />
                </div>
                <div className="flex gap-2 items-start w-full">
                  <div className="w-0.5 self-stretch bg-neutral-darkest" />
                  <p 
                    className="flex-1 font-sans font-normal text-body-small leading-[1.6] text-neutral-darkest"
                    data-testid="text-image-caption"
                  >
                    Image caption goes here
                  </p>
                </div>
              </div>

              {/* Educational materials */}
              <div className="pt-5 pb-4 w-full">
                <h5 
                  className="font-heading font-bold text-heading-5 leading-[1.2] tracking-[0.32px] text-neutral-darkest"
                  style={{ textWrap: "balance" }}
                  data-testid="text-educational-title"
                >
                  Educational materials
                </h5>
              </div>
              <div className="pb-4 w-full">
                <p 
                  className="font-sans font-normal text-body leading-[1.6] text-neutral-darkest"
                  style={{ textWrap: "pretty" }}
                  data-testid="text-educational-paragraph"
                >
                  Morbi sed imperdiet in ipsum, adipiscing elit dui lectus. Tellus id scelerisque est ultricies ultricies. Duis est sit sed leo nisl, blandit elit sagittis. Quisque tristique consequat quam sed. Nisl at scelerisque amet nulla purus habitasse.
                </p>
              </div>

              {/* Blockquote */}
              <div className="py-9 w-full">
                <div className="flex gap-5 items-start pl-0 pr-5">
                  <div className="w-0.5 self-stretch bg-neutral-darkest" />
                  <p 
                    className="flex-1 font-sans font-normal italic text-xl leading-7 text-neutral-darkest"
                    data-testid="text-blockquote"
                  >
                    "Ipsum sit mattis nulla quam nulla. Gravida id gravida ac enim mauris id. Non pellentesque congue eget consectetur turpis. Sapien, dictum molestie sem tempor. Diam elit, orci, tincidunt aenean tempus."
                  </p>
                </div>
              </div>

              {/* Limitations of liability */}
              <div className="pt-5 pb-4 w-full">
                <h6 
                  className="font-heading font-bold text-heading-6 leading-[1.2] tracking-[0.26px] text-neutral-darkest"
                  style={{ textWrap: "balance" }}
                  data-testid="text-limitations-title"
                >
                  Limitations of liability
                </h6>
              </div>
              <div className="pb-4 w-full">
                <p 
                  className="font-sans font-normal text-body leading-[1.6] text-neutral-darkest"
                  style={{ textWrap: "pretty" }}
                  data-testid="text-limitations-paragraph"
                >
                  Nunc sed faucibus bibendum feugiat sed interdum. Ipsum egestas condimentum mi massa. In tincidunt pharetra consectetur sed duis facilisis metus. Etiam egestas in nec sed et. Quis lobortis at sit dictum eget nibh tortor commodo cursus.
                </p>
              </div>
            </div>

            {/* Table of Contents Sidebar */}
            <div className="flex flex-col gap-6 items-start w-[320px] shrink-0">
              <h3 
                className="font-heading font-bold text-heading-5 leading-[1.2] tracking-[0.32px] text-neutral-darkest"
                data-testid="text-toc-title"
              >
                Contents
              </h3>
              <div className="flex flex-col items-start w-full">
                {tableOfContents.map((item, index) => {
                  const paddingLeft = item.level === 1 ? "px-4" : 
                                      item.level === 2 ? "px-8" : 
                                      item.level === 3 ? "px-12" : 
                                      item.level === 4 ? "px-16" : "px-20";
                  
                  return (
                    <button
                      key={index}
                      className={`flex items-start py-3 w-full text-left ${paddingLeft} ${
                        item.active 
                          ? "bg-[#f2f2f2] border border-neutral-darkest font-bold" 
                          : "font-normal"
                      }`}
                      data-testid={`button-toc-${index}`}
                    >
                      <span 
                        className={`flex-1 font-sans text-body-medium leading-[1.6] text-neutral-darkest ${
                          item.active ? "font-bold" : "font-normal"
                        }`}
                      >
                        {item.label}
                      </span>
                    </button>
                  );
                })}
              </div>
            </div>
          </div>
        </div>
      </section>

      <Footer />
    </div>
  );
}
