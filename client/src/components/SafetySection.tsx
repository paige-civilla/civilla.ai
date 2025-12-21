import { Link } from "wouter";
import { BookOpen, Mail, Phone, Heart } from "lucide-react";

const safetyItems = [
  {
    id: "resources",
    icon: BookOpen,
    title: "Resources",
    description: "Learn about safety planning and find support options in your area.",
    link: "Safety & Support",
    href: "/safety-support",
    isInternal: true
  },
  {
    id: "support",
    icon: Mail,
    title: "Civilla Support",
    description: "For account or site issues (non-emergency), email us anytime.",
    link: "support@civilla.ai",
    href: "mailto:support@civilla.ai",
    isInternal: false
  },
  {
    id: "crisis",
    icon: Phone,
    title: "Crisis Support (U.S.)",
    description: "Call or text 988 for free, confidential support 24/7.",
    link: "988 Suicide & Crisis Lifeline",
    href: "tel:988",
    isInternal: false
  },
  {
    id: "hotline",
    icon: Heart,
    title: "Domestic Violence Support (U.S.)",
    description: "National Domestic Violence Hotline: 1-800-799-7233. Text 'START' to 88788.",
    link: "TheHotline.org",
    href: "https://www.thehotline.org",
    isInternal: false
  }
];

export default function SafetySection() {
  return (
    <section
      className="bg-sage w-full flex flex-col items-center px-5 md:px-16 py-16 md:py-28"
      data-testid="section-safety"
    >
      <div className="flex flex-col gap-12 md:gap-20 items-center max-w-container w-full">
        <div className="flex flex-col gap-5 md:gap-6 items-center max-w-content-large w-full text-center">
          <h2 className="font-heading font-bold text-heading-2-mobile md:text-heading-2 tracking-[0.44px] md:tracking-[0.6px] text-neutral-darkest">
            In Crisis?
          </h2>
          <p className="font-sans font-normal text-sm md:text-body-medium leading-[1.6] text-neutral-darkest">
            If you're in immediate danger, call 911 (or your local emergency number). Civilla is not an emergency service. Use Quick Exit if you need to leave this site quickly, always located at the top right corner of every page.
          </p>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-8 w-full">
          {safetyItems.map((item) => (
            <div
              key={item.id}
              className="flex flex-col gap-6 items-center text-center"
              data-testid={`card-safety-${item.id}`}
            >
              <div className="w-12 h-12 flex items-center justify-center">
                <item.icon className="w-12 h-12 text-neutral-darkest" strokeWidth={1.5} />
              </div>
              <div className="flex flex-col gap-6 items-center w-full">
                <div className="flex flex-col gap-4 items-center w-full">
                  <h3 className="font-heading font-bold text-heading-4-mobile md:text-heading-4 tracking-[0.3px] md:tracking-[0.4px] text-neutral-darkest">
                    {item.title}
                  </h3>
                  <p className="font-sans font-normal text-sm md:text-body-regular leading-[1.6] text-neutral-darkest">
                    {item.description}
                  </p>
                </div>
                {item.isInternal ? (
                  <Link
                    href={item.href}
                    className="font-sans font-normal text-sm md:text-body-regular leading-[1.6] text-neutral-darkest underline underline-offset-2"
                    data-testid={`link-safety-${item.id}`}
                  >
                    {item.link}
                  </Link>
                ) : (
                  <a
                    href={item.href}
                    className="font-sans font-normal text-sm md:text-body-regular leading-[1.6] text-neutral-darkest underline underline-offset-2"
                    target={item.href.startsWith("http") ? "_blank" : undefined}
                    rel={item.href.startsWith("http") ? "noopener noreferrer" : undefined}
                    data-testid={`link-safety-${item.id}`}
                  >
                    {item.link}
                  </a>
                )}
              </div>
            </div>
          ))}
        </div>

        <p className="font-sans font-normal italic text-sm text-neutral-darkest/70 text-center w-full">
          Civilla provides educational, research, and organizational support — not legal advice or representation.
        </p>
      </div>
    </section>
  );
}
