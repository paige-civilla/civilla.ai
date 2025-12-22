import { useState } from "react";
import { ChevronRight, Mail, Phone, MapPin, ChevronDown } from "lucide-react";
import NavbarCream from "@/components/NavbarCream";
import Footer from "@/components/Footer";

const timelineItems = [
  {
    title: "General support",
    description: "Your thoughts help us build a better tool. We'd love to hear what's working and what could improve."
  },
  {
    title: "Accessibility needs",
    description: "If you represent a shelter, nonprofit, or organization, we have options to discuss with you."
  },
  {
    title: "Feedback and ideas",
    description: "Questions about how civilla works or need help navigating the platform"
  },
  {
    title: "Organizations and nonprofits",
    description: "Accessibility concerns, feature requests, or suggestions to make civilla better"
  }
];

export default function Contact() {
  const [selectedOption, setSelectedOption] = useState("");
  const [selectedRole, setSelectedRole] = useState("");
  const [agreedDisclaimer, setAgreedDisclaimer] = useState(false);

  return (
    <div className="min-h-screen flex flex-col bg-[#fcfbf9]">
      <NavbarCream />
      
      {/* Hero Section */}
      <section className="bg-[#e7ebea] px-5 md:px-16 py-16 md:py-28">
        <div className="max-w-[1280px] mx-auto">
          <div className="flex flex-col items-center max-w-[768px] mx-auto gap-6 md:gap-8">
            <div className="flex flex-col items-center gap-4 w-full">
              <div className="flex flex-col items-center gap-4 md:gap-6 text-center text-neutral-darkest w-full">
                <h1 className="font-figtree font-bold text-heading-1-mobile md:text-[84px] leading-[1.1] tracking-[0.48px] md:tracking-[0.84px] w-full" style={{ textWrap: "balance" }}>
                  We're here to help
                </h1>
                <p className="font-arimo font-normal text-sm md:text-xl leading-[1.6] w-full" style={{ textWrap: "pretty" }}>
                  <span className="italic font-medium">civilla</span> is committed to supporting you with compassion, privacy, and respect. Reach out anytime.
                </p>
              </div>
            </div>
            <div className="flex gap-4">
              <button 
                className="bg-[#0f3b2e] text-white font-arimo font-bold text-sm md:text-lg leading-[1.6] px-6 py-2.5 rounded-xl relative"
                style={{
                  boxShadow: "0px 1px 2px 0px rgba(7,5,3,0.05), inset 0px 32px 24px 0px rgba(255,255,255,0.05), inset 0px 2px 1px 0px rgba(255,255,255,0.25), inset 0px 0px 0px 1px rgba(7,5,3,0.15), inset 0px -2px 1px 0px rgba(0,0,0,0.2)"
                }}
                data-testid="button-contact"
              >
                Contact
              </button>
              <button 
                className="bg-transparent border-2 border-neutral-darkest text-neutral-darkest font-arimo font-bold text-sm md:text-lg leading-[1.6] px-[22px] py-2 rounded-xl"
                data-testid="button-learn-more"
              >
                Learn More
              </button>
            </div>
          </div>
        </div>
      </section>

      {/* How We Can Help Section */}
      <section className="bg-[#fcfbf9] px-5 md:px-16 py-16 md:py-28">
        <div className="max-w-[1280px] mx-auto">
          <div className="flex flex-col md:flex-row gap-12 md:gap-20">
            {/* Left Column */}
            <div className="flex-1 flex flex-col gap-6 md:gap-8">
              <div className="flex flex-col gap-4">
                <h2 className="font-figtree font-bold text-heading-2-mobile md:text-[60px] leading-[1.2] tracking-[0.44px] md:tracking-[0.6px] text-neutral-darkest" style={{ textWrap: "balance" }}>
                  How we can help you
                </h2>
              </div>
              <div className="flex items-center gap-6">
                <button 
                  className="bg-transparent border-2 border-neutral-darkest text-neutral-darkest font-arimo font-bold text-sm md:text-lg leading-[1.6] px-[22px] py-2 rounded-xl"
                  data-testid="button-explore"
                >
                  Explore
                </button>
                <button 
                  className="flex items-center gap-2 font-arimo font-bold text-sm md:text-lg leading-[1.6] text-neutral-darkest rounded-xl"
                  data-testid="button-arrow"
                >
                  Arrow
                  <ChevronRight className="w-6 h-6" />
                </button>
              </div>
            </div>

            {/* Right Column - Timeline */}
            <div className="flex-1 flex flex-col gap-4">
              {timelineItems.map((item, index) => (
                <div key={index} className="flex gap-6 md:gap-10">
                  {/* Icon and Line */}
                  <div className="flex flex-col items-center gap-4">
                    <div className="w-10 h-10 md:w-12 md:h-12 flex items-center justify-center">
                      <svg width="36" height="40" viewBox="0 0 36 40" fill="none" xmlns="http://www.w3.org/2000/svg">
                        <path d="M18 0L35.3205 10V30L18 40L0.679491 30V10L18 0Z" fill="#070503"/>
                      </svg>
                    </div>
                    {index < timelineItems.length - 1 && (
                      <div className="w-0 h-[60px] md:h-[100px] border-l border-neutral-darkest" />
                    )}
                  </div>
                  {/* Content */}
                  <div className="flex-1 flex flex-col gap-3 md:gap-4 text-neutral-darkest">
                    <h3 className="font-figtree font-bold text-xl md:text-[26px] leading-[1.2] tracking-[0.01em]">
                      {item.title}
                    </h3>
                    <p className="font-arimo font-normal text-sm md:text-lg leading-[1.6]" style={{ textWrap: "pretty" }}>
                      {item.description}
                    </p>
                  </div>
                </div>
              ))}
            </div>
          </div>
        </div>
      </section>

      {/* Contact Form Section */}
      <section className="bg-[#f2f2f2] px-5 md:px-16 py-16 md:py-28">
        <div className="max-w-[1280px] mx-auto">
          <div className="flex flex-col md:flex-row gap-12 md:gap-20">
            {/* Left Column - Contact Info */}
            <div className="flex-1 flex flex-col gap-6 md:gap-8">
              <div className="flex flex-col gap-4">
                <div className="flex flex-col gap-4 md:gap-6 text-neutral-darkest">
                  <h2 className="font-figtree font-bold text-heading-2-mobile md:text-[60px] leading-[1.2] tracking-[0.44px] md:tracking-[0.6px]" style={{ textWrap: "balance" }}>
                    Send us a message
                  </h2>
                  <p className="font-arimo font-normal text-sm md:text-xl leading-[1.6]" style={{ textWrap: "pretty" }}>
                    Tell us what's on your mind. We read every message and respond with care.
                  </p>
                </div>
              </div>
              <div className="flex flex-col gap-3 md:gap-4 py-2">
                <div className="flex items-start gap-3 md:gap-4">
                  <Mail className="w-5 h-5 md:w-6 md:h-6 text-neutral-darkest" />
                  <a href="mailto:email@example.com" className="font-arimo font-normal text-sm md:text-lg leading-[1.6] text-neutral-darkest underline">
                    email@example.com
                  </a>
                </div>
                <div className="flex items-start gap-3 md:gap-4">
                  <Phone className="w-5 h-5 md:w-6 md:h-6 text-neutral-darkest" />
                  <a href="tel:+15550000000" className="font-arimo font-normal text-sm md:text-lg leading-[1.6] text-neutral-darkest underline">
                    +1 (555) 000-0000
                  </a>
                </div>
                <div className="flex items-start gap-3 md:gap-4">
                  <MapPin className="w-5 h-5 md:w-6 md:h-6 text-neutral-darkest" />
                  <p className="font-arimo font-normal text-sm md:text-lg leading-[1.6] text-neutral-darkest">
                    123 Sample St, Sydney NSW 2000 AU
                  </p>
                </div>
              </div>
            </div>

            {/* Right Column - Form */}
            <div className="flex-1 flex flex-col gap-4 md:gap-6">
              {/* Name and Email Row */}
              <div className="flex flex-col md:flex-row gap-4 md:gap-6">
                <div className="flex-1 flex flex-col gap-2">
                  <label className="font-arimo font-normal text-sm md:text-lg leading-[1.6] text-neutral-darkest">
                    Name
                  </label>
                  <input 
                    type="text"
                    className="bg-transparent border-2 border-neutral-darkest rounded-xl px-3 py-2 font-arimo text-sm md:text-lg"
                    data-testid="input-name"
                  />
                </div>
                <div className="flex-1 flex flex-col gap-2">
                  <label className="font-arimo font-normal text-sm md:text-lg leading-[1.6] text-neutral-darkest">
                    Email
                  </label>
                  <input 
                    type="email"
                    className="bg-transparent border-2 border-neutral-darkest rounded-xl px-3 py-2 font-arimo text-sm md:text-lg"
                    data-testid="input-email"
                  />
                </div>
              </div>

              {/* Message and Phone Row */}
              <div className="flex flex-col md:flex-row gap-4 md:gap-6">
                <div className="flex-1 flex flex-col gap-2">
                  <label className="font-arimo font-normal text-sm md:text-lg leading-[1.6] text-neutral-darkest">
                    Message
                  </label>
                  <input 
                    type="text"
                    className="bg-transparent border-2 border-neutral-darkest rounded-xl px-3 py-2 font-arimo text-sm md:text-lg"
                    data-testid="input-message-short"
                  />
                </div>
                <div className="flex-1 flex flex-col gap-2">
                  <label className="font-arimo font-normal text-sm md:text-lg leading-[1.6] text-neutral-darkest">
                    Phone number
                  </label>
                  <input 
                    type="tel"
                    className="bg-transparent border-2 border-neutral-darkest rounded-xl px-3 py-2 font-arimo text-sm md:text-lg"
                    data-testid="input-phone"
                  />
                </div>
              </div>

              {/* Select Dropdown */}
              <div className="flex flex-col gap-2">
                <label className="font-arimo font-normal text-sm md:text-lg leading-[1.6] text-neutral-darkest">
                  What brings you here?
                </label>
                <div className="relative">
                  <select
                    value={selectedOption}
                    onChange={(e) => setSelectedOption(e.target.value)}
                    className="w-full bg-transparent border-2 border-neutral-darkest rounded-xl px-3 py-2 font-arimo text-sm md:text-lg appearance-none cursor-pointer"
                    data-testid="select-reason"
                  >
                    <option value="">Select one...</option>
                    <option value="general">General inquiry</option>
                    <option value="support">Technical support</option>
                    <option value="feedback">Feedback</option>
                    <option value="partnership">Partnership</option>
                  </select>
                  <ChevronDown className="absolute right-3 top-1/2 -translate-y-1/2 w-5 h-5 md:w-6 md:h-6 text-neutral-darkest pointer-events-none" />
                </div>
              </div>

              {/* Radio Buttons */}
              <div className="flex flex-col gap-3 md:gap-4 py-3 md:py-4">
                <p className="font-arimo font-normal text-sm md:text-lg leading-[1.6] text-neutral-darkest">
                  How would you describe yourself?
                </p>
                <div className="flex flex-col gap-3">
                  <div className="flex flex-col md:flex-row gap-3 md:gap-6">
                    <label className="flex-1 flex items-center gap-3 cursor-pointer">
                      <input 
                        type="radio" 
                        name="role" 
                        value="self-represented"
                        checked={selectedRole === "self-represented"}
                        onChange={(e) => setSelectedRole(e.target.value)}
                        className="w-[18px] h-[18px] border-2 border-neutral-darkest rounded-full appearance-none checked:bg-neutral-darkest"
                        data-testid="radio-self-represented"
                      />
                      <span className="font-arimo font-normal text-sm md:text-lg leading-[1.6] text-neutral-darkest">
                        Self-represented parent
                      </span>
                    </label>
                    <label className="flex-1 flex items-center gap-3 cursor-pointer">
                      <input 
                        type="radio" 
                        name="role" 
                        value="nonprofit"
                        checked={selectedRole === "nonprofit"}
                        onChange={(e) => setSelectedRole(e.target.value)}
                        className="w-[18px] h-[18px] border-2 border-neutral-darkest rounded-full appearance-none checked:bg-neutral-darkest"
                        data-testid="radio-nonprofit"
                      />
                      <span className="font-arimo font-normal text-sm md:text-lg leading-[1.6] text-neutral-darkest">
                        Nonprofit or shelter
                      </span>
                    </label>
                  </div>
                  <div className="flex flex-col md:flex-row gap-3 md:gap-6">
                    <label className="flex-1 flex items-center gap-3 cursor-pointer">
                      <input 
                        type="radio" 
                        name="role" 
                        value="researcher"
                        checked={selectedRole === "researcher"}
                        onChange={(e) => setSelectedRole(e.target.value)}
                        className="w-[18px] h-[18px] border-2 border-neutral-darkest rounded-full appearance-none checked:bg-neutral-darkest"
                        data-testid="radio-researcher"
                      />
                      <span className="font-arimo font-normal text-sm md:text-lg leading-[1.6] text-neutral-darkest">
                        Researcher or educator
                      </span>
                    </label>
                    <label className="flex-1 flex items-center gap-3 cursor-pointer">
                      <input 
                        type="radio" 
                        name="role" 
                        value="legal"
                        checked={selectedRole === "legal"}
                        onChange={(e) => setSelectedRole(e.target.value)}
                        className="w-[18px] h-[18px] border-2 border-neutral-darkest rounded-full appearance-none checked:bg-neutral-darkest"
                        data-testid="radio-legal"
                      />
                      <span className="font-arimo font-normal text-sm md:text-lg leading-[1.6] text-neutral-darkest">
                        Legal professional
                      </span>
                    </label>
                  </div>
                  <div className="flex flex-col md:flex-row gap-3 md:gap-6">
                    <label className="flex-1 flex items-center gap-3 cursor-pointer">
                      <input 
                        type="radio" 
                        name="role" 
                        value="community"
                        checked={selectedRole === "community"}
                        onChange={(e) => setSelectedRole(e.target.value)}
                        className="w-[18px] h-[18px] border-2 border-neutral-darkest rounded-full appearance-none checked:bg-neutral-darkest"
                        data-testid="radio-community"
                      />
                      <span className="font-arimo font-normal text-sm md:text-lg leading-[1.6] text-neutral-darkest">
                        Community partner
                      </span>
                    </label>
                    <label className="flex-1 flex items-center gap-3 cursor-pointer">
                      <input 
                        type="radio" 
                        name="role" 
                        value="other"
                        checked={selectedRole === "other"}
                        onChange={(e) => setSelectedRole(e.target.value)}
                        className="w-[18px] h-[18px] border-2 border-neutral-darkest rounded-full appearance-none checked:bg-neutral-darkest"
                        data-testid="radio-other"
                      />
                      <span className="font-arimo font-normal text-sm md:text-lg leading-[1.6] text-neutral-darkest">
                        Other
                      </span>
                    </label>
                  </div>
                </div>
              </div>

              {/* Message Textarea */}
              <div className="flex flex-col gap-2">
                <label className="font-arimo font-normal text-sm md:text-lg leading-[1.6] text-neutral-darkest">
                  Message
                </label>
                <textarea 
                  placeholder="Share what's on your mind. We read and respond to every message with care and respect. Your privacy matters to us, and reaching out does not create an attorney-client relationship."
                  className="bg-transparent border-2 border-neutral-darkest rounded-xl p-3 font-arimo text-sm md:text-lg h-[140px] md:h-[180px] resize-none placeholder:text-neutral-darkest/60"
                  data-testid="textarea-message"
                />
              </div>

              {/* Checkbox */}
              <div className="flex items-center gap-2 pb-3 md:pb-4">
                <input 
                  type="checkbox"
                  checked={agreedDisclaimer}
                  onChange={(e) => setAgreedDisclaimer(e.target.checked)}
                  className="w-[18px] h-[18px] border-2 border-neutral-darkest rounded appearance-none checked:bg-neutral-darkest cursor-pointer"
                  data-testid="checkbox-disclaimer"
                />
                <span className="font-arimo font-normal text-sm md:text-base leading-[1.6] text-neutral-darkest">
                  I understand this is not legal advice
                </span>
              </div>

              {/* Submit Button */}
              <button 
                className="bg-[#0f3b2e] text-white font-arimo font-bold text-sm md:text-lg leading-[1.6] px-6 py-2.5 rounded-xl relative self-start"
                style={{
                  boxShadow: "0px 1px 2px 0px rgba(7,5,3,0.05), inset 0px 32px 24px 0px rgba(255,255,255,0.05), inset 0px 2px 1px 0px rgba(255,255,255,0.25), inset 0px 0px 0px 1px rgba(7,5,3,0.15), inset 0px -2px 1px 0px rgba(0,0,0,0.2)"
                }}
                data-testid="button-send"
              >
                Send
              </button>
            </div>
          </div>
        </div>
      </section>

      <Footer />
    </div>
  );
}
