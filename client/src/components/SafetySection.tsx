import { Mail, MessageCircle, Phone, MapPin } from "lucide-react";

const safetyItems = [
  {
    id: "resources",
    icon: Mail,
    title: "Resources",
    description: "Learn about safety planning",
    link: "Safety & Support",
    href: "/safety-support"
  },
  {
    id: "support",
    icon: MessageCircle,
    title: "Support",
    description: "Reach out anytime",
    link: "support@civilla.ai",
    href: "mailto:support@civilla.ai"
  },
  {
    id: "help",
    icon: Phone,
    title: "Help",
    description: "Visit our Help Center for answers",
    link: "1-800-799-7233",
    href: "tel:1-800-799-7233"
  },
  {
    id: "hotline",
    icon: MapPin,
    title: "Hotline",
    description: "National Domestic Violence Hotline available 24/7",
    link: "Visit our Help Center for answers",
    href: "https://www.thehotline.org"
  }
];

export default function SafetySection() {
  return (
    <section
      className="bg-sage w-full flex flex-col items-center px-5 md:px-16 py-16 md:py-28"
      data-testid="section-safety"
    >
      <div className="flex flex-col gap-12 md:gap-20 items-center max-w-container w-full">
        <div className="flex flex-col gap-4 items-center max-w-content-large w-full text-center">
          <span className="font-sans font-bold text-base text-neutral-darkest">
            Safety
          </span>
          <div className="flex flex-col gap-5 md:gap-6 items-center w-full">
            <h2 className="font-heading font-bold text-heading-2-mobile md:text-heading-2 tracking-[0.44px] md:tracking-[0.6px] text-neutral-darkest">
              In crisis
            </h2>
            <p className="font-sans font-normal text-sm md:text-body-medium leading-[1.6] text-neutral-darkest">
              If you're in immediate danger, call 911. civilla.ai also offers a quick exit button and resources for domestic violence support.
            </p>
          </div>
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
                <a
                  href={item.href}
                  className="font-sans font-normal text-sm md:text-body-regular leading-[1.6] text-neutral-darkest underline underline-offset-2"
                  data-testid={`link-safety-${item.id}`}
                >
                  {item.link}
                </a>
              </div>
            </div>
          ))}
        </div>
      </div>
    </section>
  );
}
