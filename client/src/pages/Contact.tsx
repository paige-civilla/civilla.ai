import { useMemo, useState } from "react";
import { Mail, Phone, MapPin } from "lucide-react";
import NavbarCream from "@/components/NavbarCream";
import Footer from "@/components/Footer";

const SUPPORT_EMAIL = "Admin@civilla.ai";
const SUPPORT_PHONE_DISPLAY = "+1 (346) 248-4552";
const SUPPORT_PHONE_TEL = "+13462484552";
const SUPPORT_LOCATION = "Idaho Falls, Idaho";

type Reason =
  | "General Support"
  | "Accessibility Help"
  | "Feedback And Ideas"
  | "Organizations And Nonprofits"
  | "Other";

export default function Contact() {
  const [name, setName] = useState("");
  const [email, setEmail] = useState("");
  const [phone, setPhone] = useState("");
  const [reason, setReason] = useState<Reason>("General Support");
  const [message, setMessage] = useState("");
  const [acknowledged, setAcknowledged] = useState(false);
  const [status, setStatus] = useState<"idle" | "sent">("idle");

  const mailtoHref = useMemo(() => {
    const subject = encodeURIComponent(`civilla — ${reason}`);
    const body = encodeURIComponent(
      [
        `Name: ${name || "(not provided)"}`,
        `Email: ${email || "(not provided)"}`,
        `Phone: ${phone || "(not provided)"}`,
        `Reason: ${reason}`,
        "",
        message || "(no message)",
        "",
        "—",
        "Note: civilla is educational and organizational only. This message does not create an attorney-client relationship.",
      ].join("\n")
    );

    return `mailto:${SUPPORT_EMAIL}?subject=${subject}&body=${body}`;
  }, [name, email, phone, reason, message]);

  const canSend = acknowledged && (email.trim().length > 0 || message.trim().length > 0);

  const onSend = (e: React.FormEvent) => {
    e.preventDefault();
    if (!canSend) return;
    window.location.href = mailtoHref;
    setStatus("sent");
  };

  return (
    <div className="min-h-screen flex flex-col bg-cream dark:bg-neutral-darkest text-neutral-darkest dark:text-cream" data-testid="page-contact">
      <NavbarCream />

      {/* Hero Section */}
      <section className="bg-[#e7ebea] dark:bg-neutral-darkest/80 px-5 md:px-16 py-16 md:py-28" data-testid="section-hero">
        <div className="max-w-container mx-auto">
          <div className="flex flex-col gap-6 md:gap-8 items-center text-center max-w-[768px] mx-auto">
            <div className="flex flex-col gap-4 md:gap-6 items-center w-full">
              <h1 className="font-figtree font-bold text-heading-1-mobile md:text-[84px] leading-[1.1] tracking-[0.48px] md:tracking-[0.84px] text-neutral-darkest" style={{ textWrap: "balance" }}>
                We're Here To Help
              </h1>
              <p className="font-arimo text-lg md:text-xl leading-[1.6] text-neutral-darkest" style={{ textWrap: "pretty" }}>
                Reach out anytime. We'll respond with care, respect, and privacy in mind.
              </p>
            </div>
            <a
              href={`mailto:${SUPPORT_EMAIL}`}
              className="bg-bush text-white font-arimo font-bold text-base md:text-lg px-6 py-3 rounded-xl"
              data-testid="button-email-us"
            >
              Email Us
            </a>
          </div>

          {/* Contact Info Cards */}
          <div className="mt-12 grid gap-4 md:grid-cols-3 max-w-4xl mx-auto">
            <div className="bg-cream rounded-2xl p-6 flex flex-col gap-3">
              <Mail className="w-6 h-6 text-neutral-darkest" />
              <div className="flex flex-col gap-1">
                <span className="font-arimo text-xs font-semibold uppercase tracking-wide text-neutral-darkest/60">
                  Email
                </span>
                <a 
                  href={`mailto:${SUPPORT_EMAIL}`} 
                  className="font-arimo text-base md:text-lg font-medium text-neutral-darkest underline underline-offset-4"
                  data-testid="link-email"
                >
                  {SUPPORT_EMAIL}
                </a>
              </div>
            </div>

            <div className="bg-cream rounded-2xl p-6 flex flex-col gap-3">
              <Phone className="w-6 h-6 text-neutral-darkest" />
              <div className="flex flex-col gap-1">
                <span className="font-arimo text-xs font-semibold uppercase tracking-wide text-neutral-darkest/60">
                  Phone
                </span>
                <a 
                  href={`tel:${SUPPORT_PHONE_TEL}`} 
                  className="font-arimo text-base md:text-lg font-medium text-neutral-darkest underline underline-offset-4"
                  data-testid="link-phone"
                >
                  {SUPPORT_PHONE_DISPLAY}
                </a>
              </div>
            </div>

            <div className="bg-cream rounded-2xl p-6 flex flex-col gap-3">
              <MapPin className="w-6 h-6 text-neutral-darkest" />
              <div className="flex flex-col gap-1">
                <span className="font-arimo text-xs font-semibold uppercase tracking-wide text-neutral-darkest/60">
                  Location
                </span>
                <span className="font-arimo text-base md:text-lg font-medium text-neutral-darkest">
                  {SUPPORT_LOCATION}
                </span>
              </div>
            </div>
          </div>

          <p className="mt-8 max-w-3xl mx-auto text-center font-arimo text-sm leading-[1.6] text-neutral-darkest/60">
            <span className="italic font-medium">civilla</span> is educational and organizational only. We do not provide legal advice, and contacting us does not create an attorney-client relationship. If you are in immediate danger, call 911.
          </p>
        </div>
      </section>

      {/* How We Can Help Section */}
      <section className="bg-cream px-5 md:px-16 py-16 md:py-28" data-testid="section-how-we-help">
        <div className="max-w-container mx-auto">
          <h2 className="font-figtree font-bold text-heading-2-mobile md:text-[60px] leading-[1.2] tracking-[0.44px] md:tracking-[0.6px] text-neutral-darkest mb-8 md:mb-12" style={{ textWrap: "balance" }}>
            How We Can Help You
          </h2>
          <div className="grid gap-4 md:grid-cols-2">
            <InfoCard
              title="General Support"
              body="Questions about your account or using the platform."
            />
            <InfoCard
              title="Accessibility Help"
              body="Report a barrier or request an accommodation."
            />
            <InfoCard
              title="Feedback And Ideas"
              body="Tell us what's working and what needs improvement."
            />
            <InfoCard
              title="Organizations And Nonprofits"
              body="Partnerships, referrals, or program collaboration."
            />
          </div>
        </div>
      </section>

      {/* Send Us A Message Section */}
      <section className="bg-[#f2f2f2] px-5 md:px-16 py-16 md:py-28" data-testid="section-form">
        <div className="max-w-container mx-auto">
          <div className="max-w-2xl">
            <h2 className="font-figtree font-bold text-heading-2-mobile md:text-[60px] leading-[1.2] tracking-[0.44px] md:tracking-[0.6px] text-neutral-darkest" style={{ textWrap: "balance" }}>
              Send Us A Message
            </h2>
            <p className="mt-4 font-arimo text-base md:text-xl leading-[1.6] text-neutral-darkest">
              This form opens your email app with a prefilled message (so nothing gets lost).
            </p>

            <form onSubmit={onSend} className="mt-8 flex flex-col gap-5 md:gap-6">
              <div className="grid gap-4 md:grid-cols-2">
                <Field 
                  id="contact-name"
                  label="Name" 
                  value={name} 
                  onChange={setName} 
                  placeholder="Your name" 
                />
                <Field 
                  id="contact-email"
                  label="Email" 
                  value={email} 
                  onChange={setEmail} 
                  placeholder="you@email.com" 
                />
              </div>

              <div className="grid gap-4 md:grid-cols-2">
                <Field
                  id="contact-phone"
                  label="Phone (Optional)"
                  value={phone}
                  onChange={setPhone}
                  placeholder={SUPPORT_PHONE_DISPLAY}
                />

                <div className="flex flex-col gap-2">
                  <label htmlFor="contact-reason" className="font-arimo text-sm md:text-base font-medium leading-[1.6] text-neutral-darkest">
                    Reason
                  </label>
                  <select
                    id="contact-reason"
                    className="bg-white border-2 border-neutral-darkest/20 focus:border-neutral-darkest rounded-xl px-4 py-3 font-arimo text-base md:text-lg text-neutral-darkest outline-none transition-colors"
                    value={reason}
                    onChange={(e) => setReason(e.target.value as Reason)}
                    data-testid="select-reason"
                  >
                    <option value="General Support">General Support</option>
                    <option value="Accessibility Help">Accessibility Help</option>
                    <option value="Feedback And Ideas">Feedback And Ideas</option>
                    <option value="Organizations And Nonprofits">Organizations And Nonprofits</option>
                    <option value="Other">Other</option>
                  </select>
                </div>
              </div>

              <div className="flex flex-col gap-2">
                <label htmlFor="contact-message" className="font-arimo text-sm md:text-base font-medium leading-[1.6] text-neutral-darkest">
                  Message
                </label>
                <textarea
                  id="contact-message"
                  className="bg-white border-2 border-neutral-darkest/20 focus:border-neutral-darkest rounded-xl px-4 py-3 font-arimo text-base md:text-lg text-neutral-darkest outline-none transition-colors min-h-[140px] md:min-h-[180px] resize-y placeholder:text-neutral-darkest/40"
                  value={message}
                  onChange={(e) => setMessage(e.target.value)}
                  placeholder="What's going on? What do you need? What device are you using?"
                  data-testid="textarea-message"
                />
              </div>

              <div className="flex items-start gap-3">
                <input
                  id="contact-ack"
                  type="checkbox"
                  checked={acknowledged}
                  onChange={(e) => setAcknowledged(e.target.checked)}
                  className="mt-1 w-5 h-5 border-2 border-neutral-darkest/20 rounded cursor-pointer"
                  data-testid="checkbox-acknowledge"
                />
                <label htmlFor="contact-ack" className="font-arimo text-sm md:text-base leading-[1.6] text-neutral-darkest cursor-pointer">
                  I understand <span className="italic font-medium">civilla</span> does not provide legal advice.
                </label>
              </div>

              <div className="flex flex-wrap items-center gap-4 mt-2">
                <button
                  type="submit"
                  disabled={!canSend}
                  className="bg-bush text-white font-arimo font-bold text-base md:text-lg px-6 py-3 rounded-xl disabled:opacity-50 disabled:cursor-not-allowed hover:bg-bush/90 transition-colors focus:outline-none focus:ring-2 focus:ring-bush focus:ring-offset-2"
                  data-testid="button-send"
                >
                  Send
                </button>

                <a
                  href={mailtoHref}
                  className="font-arimo font-bold text-base md:text-lg text-neutral-darkest underline underline-offset-4"
                  data-testid="link-open-email"
                >
                  Open In Email Instead
                </a>

                {status === "sent" && (
                  <span className="font-arimo text-sm text-neutral-darkest/60">
                    Email draft opened.
                  </span>
                )}
              </div>
            </form>
          </div>
        </div>
      </section>

      <Footer />
    </div>
  );
}

function InfoCard({ title, body }: { title: string; body: string }) {
  return (
    <div className="bg-[#f2f2f2] rounded-2xl p-6 md:p-8">
      <h3 className="font-figtree font-bold text-xl md:text-[26px] leading-[1.2] tracking-[0.01em] text-neutral-darkest">
        {title}
      </h3>
      <p className="mt-3 font-arimo text-base md:text-lg leading-[1.6] text-neutral-darkest/70">
        {body}
      </p>
    </div>
  );
}

function Field({
  id,
  label,
  value,
  onChange,
  placeholder,
}: {
  id: string;
  label: string;
  value: string;
  onChange: (v: string) => void;
  placeholder?: string;
}) {
  return (
    <div className="flex flex-col gap-2">
      <label htmlFor={id} className="font-arimo text-sm md:text-base font-medium leading-[1.6] text-neutral-darkest">
        {label}
      </label>
      <input
        id={id}
        className="bg-white border-2 border-neutral-darkest/20 focus:border-neutral-darkest rounded-xl px-4 py-3 font-arimo text-base md:text-lg text-neutral-darkest outline-none transition-colors placeholder:text-neutral-darkest/40"
        value={value}
        onChange={(e) => onChange(e.target.value)}
        placeholder={placeholder}
        data-testid={`input-${id.replace('contact-', '')}`}
      />
    </div>
  );
}
