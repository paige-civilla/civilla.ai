import { useState, useEffect } from "react";
import { Link, useLocation } from "wouter";
import { Menu, X, ChevronRight, User, Moon, Sun, LogOut } from "lucide-react";
import Footer from "@/components/Footer";
import logoDark from "@assets/noBgColor_(1)_1766261333621.png";

const navLinks = [
  { href: "/", label: "Home" },
  { href: "/how-civilla-works", label: "How Civilla Works" },
  { href: "/about-civilla", label: "About Civilla" },
  { href: "/plans", label: "Plans" },
];

const imgPlaceholderImage = "https://www.figma.com/api/mcp/asset/26166652-168b-426b-9744-1082df316ceb";
const imgPlaceholderImage1 = "https://www.figma.com/api/mcp/asset/702bb028-ef73-4469-8a54-d4dd3bdeff03";

function NavbarCream() {
  const [isMenuOpen, setIsMenuOpen] = useState(false);
  const [location] = useLocation();
  const [isDarkMode, setIsDarkMode] = useState(false);

  useEffect(() => {
    const savedTheme = localStorage.getItem("theme");
    if (savedTheme === "dark") {
      setIsDarkMode(true);
      document.documentElement.classList.add("dark");
    }
  }, []);

  const toggleDarkMode = () => {
    setIsDarkMode(!isDarkMode);
    if (!isDarkMode) {
      document.documentElement.classList.add("dark");
      localStorage.setItem("theme", "dark");
    } else {
      document.documentElement.classList.remove("dark");
      localStorage.setItem("theme", "light");
    }
  };

  const handleQuickExit = () => {
    window.location.replace("https://www.google.com");
  };

  return (
    <nav className="bg-cream w-full" data-testid="navbar-cream">
      <div className="h-9 md:h-9 flex items-center justify-center px-3 md:px-6 py-0">
        <div className="flex items-center justify-between gap-4 w-full max-w-container">
          <div className="flex items-center">
            <Link href="/" className="relative h-[30px] w-auto" data-testid="link-logo">
              <img 
                src={logoDark} 
                alt="civilla.ai" 
                className="h-full w-auto object-contain"
              />
            </Link>
          </div>
          <div className="flex items-center justify-center gap-2">
            <button 
              onClick={toggleDarkMode}
              className="p-1.5"
              aria-label="Toggle dark mode"
              data-testid="button-theme-toggle"
            >
              {isDarkMode ? (
                <Sun className="w-4 h-4 text-neutral-darkest" />
              ) : (
                <Moon className="w-4 h-4 text-neutral-darkest" />
              )}
            </button>
            <button 
              className="p-1.5"
              aria-label="User login"
              data-testid="button-user-login"
            >
              <User className="w-4 h-4 text-neutral-darkest" />
            </button>
            <button 
              className="p-1"
              data-testid="button-menu"
              onClick={() => setIsMenuOpen(!isMenuOpen)}
            >
              {isMenuOpen ? (
                <X className="w-4 h-4 text-neutral-darkest" />
              ) : (
                <Menu className="w-4 h-4 text-neutral-darkest" />
              )}
            </button>
            <button 
              onClick={handleQuickExit}
              className="ml-2 p-1.5 rounded-md"
              style={{ background: "linear-gradient(135deg, #2D5A4A 0%, #7B9B8E 50%, #D4A574 100%)" }}
              aria-label="Quick exit"
              data-testid="button-quick-exit"
            >
              <LogOut className="w-4 h-4 text-white" />
            </button>
          </div>
        </div>
      </div>

      {isMenuOpen && (
        <div className="bg-cream border-t border-neutral-darkest/20 px-3 md:px-6 py-4" data-testid="mobile-menu">
          <div className="flex flex-col gap-3 max-w-container mx-auto">
            {navLinks.map((link) => (
              <Link
                key={link.href}
                href={link.href}
                className={`text-neutral-darkest font-bold text-sm leading-[1.6] py-2 px-3 rounded ${
                  location === link.href ? "bg-neutral-darkest/10" : "hover-elevate active-elevate-2"
                }`}
                onClick={() => setIsMenuOpen(false)}
                data-testid={`mobile-link-${link.href.replace("/", "") || "home"}`}
              >
                {link.label}
              </Link>
            ))}
            <button 
              className="text-left text-neutral-darkest font-bold text-sm leading-[1.6] py-2 px-3 rounded hover-elevate active-elevate-2"
              data-testid="mobile-button-login"
            >
              Login
            </button>
          </div>
        </div>
      )}
    </nav>
  );
}

function HeaderSection() {
  return (
    <section className="bg-[#e7ebea] w-full flex flex-col items-center px-16 py-28" data-testid="section-header">
      <div className="flex flex-col items-center max-w-container w-full">
        <div className="flex flex-col gap-8 items-center max-w-[768px] w-full">
          <div className="flex flex-col gap-4 items-center w-full">
            <span className="font-sans font-bold text-[16px] text-neutral-darkest text-center leading-[1.5]">
              Civilla
            </span>
            <div className="flex flex-col gap-6 items-center text-neutral-darkest text-center w-full">
              <h1 className="cv-h font-heading text-[84px] tracking-[0.84px] w-full">
                Why we exist
              </h1>
              <p className="cv-p font-sans text-[20px] w-full">
                Family law is complex. You shouldn't have to face it alone or confused.
              </p>
            </div>
          </div>
          <div className="flex gap-4 items-start">
            <button 
              className="bg-bush text-white font-bold text-sm md:text-body-regular leading-[1.6] px-6 py-2.5 rounded-md button-inset-shadow relative"
              data-testid="button-learn"
            >
              Learn
            </button>
            <button 
              className="bg-transparent border-2 border-neutral-darkest text-neutral-darkest font-bold text-sm md:text-body-regular leading-[1.6] px-6 py-2.5 rounded-md"
              data-testid="button-contact"
            >
              Contact
            </button>
          </div>
        </div>
      </div>
    </section>
  );
}

function TimelineSection() {
  const timelineItems = [
    {
      id: 1,
      title: "Sarah listens to parents in crisis",
      subtitle: "Parents speak first",
      description: "Sarah spent years listening to families navigate family court alone. The same words kept coming back: lost, scared, unsure what comes next.",
      side: "right"
    },
    {
      id: 2,
      title: "First parents test the platform",
      subtitle: "Something had to change",
      description: "The realization was simple but urgent. Parents needed a tool that treated them with respect, explained things clearly, and didn't pretend to be a lawyer.",
      side: "left"
    },
    {
      id: 3,
      title: "Evidence and timeline tools launch",
      subtitle: "Real testing, real feedback",
      description: "We built a rough version and handed it to parents who were actually living this. They told us what worked and what didn't, without holding back.",
      side: "right"
    },
    {
      id: 4,
      title: "Lexi, the research assistant, joins",
      subtitle: "Tools that matter",
      description: "Evidence organizers, timelines, research guides—each one built because a parent said, I need help making sense of this.",
      side: "left"
    }
  ];

  return (
    <section className="bg-cream w-full flex flex-col items-center px-16 py-28" data-testid="section-timeline">
      <div className="flex flex-col gap-20 items-center max-w-container w-full">
        <div className="flex flex-col gap-8 items-center max-w-[768px] w-full">
          <div className="flex flex-col gap-4 items-center w-full">
            <span className="font-sans font-bold text-[16px] text-neutral-darkest text-center leading-[1.5]">
              Journey
            </span>
            <div className="flex flex-col gap-6 items-center text-neutral-darkest text-center w-full">
              <h2 className="cv-h font-heading text-[60px] tracking-[0.6px] leading-[1.2] w-full">
                How Civilla came to be
              </h2>
              <p className="cv-p font-sans text-[20px] w-full">
                We built a rough version and put it in the hands of real parents. Their feedback was honest and shaped everything that came next. They told us what actually helped.
              </p>
            </div>
          </div>
          <div className="flex gap-6 items-center">
            <button 
              className="bg-transparent border-2 border-neutral-darkest text-neutral-darkest font-bold text-sm md:text-body-regular leading-[1.6] px-6 py-2.5 rounded-md"
              data-testid="button-read"
            >
              Read
            </button>
            <button 
              className="flex gap-2 items-center text-neutral-darkest font-bold text-sm md:text-body-regular leading-[1.6]"
              data-testid="button-more"
            >
              More
              <ChevronRight className="w-6 h-6" />
            </button>
          </div>
        </div>

        <div className="flex flex-col items-start w-full">
          {timelineItems.map((item, index) => (
            <div 
              key={item.id}
              className={`flex gap-12 items-start w-full ${item.side === 'right' ? 'justify-end' : ''}`}
              data-testid={`timeline-item-${item.id}`}
            >
              {item.side === 'right' && <div className="flex-1" />}
              
              {item.side === 'left' && (
                <div className="flex-1">
                  <TimelineCard item={item} />
                </div>
              )}
              
              <div className="flex flex-col items-center w-8 self-stretch">
                <div className="flex flex-col flex-1 gap-2 items-center">
                  <div className="bg-neutral-darkest h-10 w-[3px]" />
                  <div className="w-[15px] h-[15px] bg-neutral-darkest rounded-full" />
                  <div className="bg-neutral-darkest flex-1 w-[3px]" />
                </div>
              </div>
              
              {item.side === 'right' && (
                <div className="flex-1">
                  <TimelineCard item={item} />
                </div>
              )}
              
              {item.side === 'left' && <div className="flex-1" />}
            </div>
          ))}
        </div>
      </div>
    </section>
  );
}

function TimelineCard({ item }: { item: { title: string; subtitle: string; description: string } }) {
  return (
    <div className="bg-cream border-2 border-neutral-darkest rounded-2xl p-8 flex flex-col gap-8">
      <div className="flex flex-col gap-6 font-heading font-bold text-neutral-darkest leading-[1.2]">
        <h3 className="cv-h text-[48px] tracking-[0.48px]">{item.title}</h3>
        <h4 className="cv-h text-[40px] tracking-[0.4px]">{item.subtitle}</h4>
      </div>
      <p className="cv-panel-body font-sans text-[20px] text-neutral-darkest leading-[1.6]">
        {item.description}
      </p>
      <div className="flex gap-6 items-center">
        <button 
          className="bg-transparent border-2 border-neutral-darkest text-neutral-darkest font-bold text-sm md:text-body-regular leading-[1.6] px-6 py-2.5 rounded-md"
          data-testid="button-card-read"
        >
          Read
        </button>
        <button 
          className="flex gap-2 items-center text-neutral-darkest font-bold text-sm md:text-body-regular leading-[1.6]"
          data-testid="button-card-more"
        >
          More
          <ChevronRight className="w-6 h-6" />
        </button>
      </div>
    </div>
  );
}

function TeamSection1() {
  return (
    <section className="bg-bush w-full flex flex-col items-center px-16 py-28" data-testid="section-team-1">
      <div className="flex flex-col items-start max-w-container w-full">
        <div className="flex gap-20 items-start w-full">
          <div className="flex-1 aspect-square rounded-2xl overflow-hidden">
            <img 
              src={imgPlaceholderImage} 
              alt="Team" 
              className="w-full h-full object-cover"
            />
          </div>
          <div className="flex-1 flex flex-col gap-6">
            <h2 className="cv-h font-heading font-bold text-[60px] tracking-[0.6px] leading-[1.2] text-white">
              Our team
            </h2>
            <div className="flex flex-col gap-4">
              <p className="cv-panel-body font-sans text-[18px] text-white leading-[1.6]">
                Sarah founded Civilla after years of watching parents navigate family court alone, overwhelmed and unsupported. She believed then, as she does now, that complexity shouldn't mean isolation. Sarah brings a background in education and a deep commitment to making legal processes accessible to everyone.
              </p>
              <p className="cv-panel-body font-sans text-[18px] text-white leading-[1.6]">
                Marcus joined early because he saw his own family in the stories parents were telling. His work in community support and crisis intervention shaped how Civilla thinks about trauma, safety, and meeting people where they are. He ensures every feature we build asks first: will this help someone feel less alone?
              </p>
              <p className="cv-panel-body font-sans text-[18px] text-white leading-[1.6]">
                Jen comes from a background in user research and design. She listens to how parents actually use Civilla, what confuses them, what helps them breathe easier. Her work keeps us honest about whether we're truly making things simpler or just moving the confusion around.
              </p>
            </div>
          </div>
        </div>
      </div>
    </section>
  );
}

function TeamSection2() {
  return (
    <section className="bg-bush w-full flex flex-col items-center px-16 py-28" data-testid="section-team-2">
      <div className="flex flex-col items-start max-w-container w-full">
        <div className="flex gap-20 items-start w-full">
          <div className="flex-1 flex flex-col gap-6">
            <h2 className="cv-h font-heading font-bold text-[60px] tracking-[0.6px] leading-[1.2] text-white">
              Our team
            </h2>
            <div className="flex flex-col gap-4">
              <p className="cv-panel-body font-sans text-[18px] text-white leading-[1.6]">
                Our team is small and intentional. We're not lawyers. We're people who believe that understanding your own case shouldn't require a law degree, and that parents deserve tools built with their dignity in mind. We stay grounded in what parents tell us they need, and we build from there.
              </p>
              <p className="cv-panel-body font-sans text-[18px] text-white leading-[1.6]">
                Every person on this team chose to be here because they believe in the same thing: that family law can be less lonely, less confusing, and more within reach.
              </p>
            </div>
          </div>
          <div className="flex-1 aspect-square rounded-2xl overflow-hidden">
            <img 
              src={imgPlaceholderImage1} 
              alt="Team" 
              className="w-full h-full object-cover"
            />
          </div>
        </div>
      </div>
    </section>
  );
}

function CTASection() {
  return (
    <section className="bg-[#f2f2f2] w-full flex flex-col items-center px-16 py-28" data-testid="section-cta">
      <div className="flex flex-col items-start max-w-container w-full">
        <div className="bg-[#f2f2f2] border-2 border-neutral-darkest rounded-2xl p-16 flex flex-col items-center justify-center w-full">
          <div className="flex flex-col gap-8 items-center max-w-[768px] w-full">
            <div className="flex flex-col gap-6 items-center text-neutral-darkest text-center w-full">
              <h2 className="cv-h font-heading font-bold text-[60px] tracking-[0.6px] leading-[1.2] w-full">
                We want to hear your story
              </h2>
              <p className="cv-p font-sans text-[20px] w-full">
                Your experience matters. Tell us what you need, what's working, and what isn't.
              </p>
            </div>
            <div className="flex gap-4 items-start">
              <button 
                className="bg-bush text-white font-bold text-sm md:text-body-regular leading-[1.6] px-6 py-2.5 rounded-md button-inset-shadow relative"
                data-testid="button-share"
              >
                Share
              </button>
              <button 
                className="bg-transparent border-2 border-neutral-darkest text-neutral-darkest font-bold text-sm md:text-body-regular leading-[1.6] px-6 py-2.5 rounded-md"
                data-testid="button-cta-contact"
              >
                Contact
              </button>
            </div>
          </div>
        </div>
      </div>
    </section>
  );
}

export default function AboutCivilla() {
  return (
    <div className="min-h-screen flex flex-col">
      <NavbarCream />
      <main className="flex-1">
        <HeaderSection />
        <TimelineSection />
        <TeamSection1 />
        <TeamSection2 />
        <CTASection />
      </main>
      <Footer />
    </div>
  );
}
