import { useState } from "react";
import { Button } from "@/components/ui/button";
import { Send } from "lucide-react";

const earlyNotes = [
  {
    id: 1,
    quote: "I needed a calmer way to understand what's typical — without feeling judged or overwhelmed."
  },
  {
    id: 2,
    quote: "Having my notes, messages, and documents in one place made it easier to stay organized."
  },
  {
    id: 3,
    quote: "The plain-language explanations helped me feel less panicked about what comes next."
  }
];

export default function TestimonialsSection() {
  const [name, setName] = useState("");
  const [email, setEmail] = useState("");
  const [message, setMessage] = useState("");

  const handleSubmit = () => {
    if (!message.trim()) return;
    
    const subject = encodeURIComponent("civilla Early Access Feedback");
    const body = encodeURIComponent(
      `Name: ${name || "Not provided"}\nEmail: ${email || "Not provided"}\n\nMessage:\n${message}`
    );
    
    window.location.href = `mailto:support@civilla.ai?subject=${subject}&body=${body}`;
  };

  const isValid = message.trim().length > 0;

  return (
    <section 
      className="bg-cream w-full flex flex-col items-center px-5 md:px-16 py-16 md:py-28"
      data-testid="section-testimonials"
    >
      <div className="flex flex-col gap-12 md:gap-20 items-center max-w-container w-full">
        <div className="flex flex-col gap-5 md:gap-6 items-center text-neutral-darkest text-center max-w-content-large w-full">
          <h2 className="font-heading font-bold text-heading-2-mobile md:text-heading-2 tracking-[0.44px] md:tracking-[0.6px] w-full">
            Early Notes
          </h2>
          <p className="font-sans font-normal text-sm md:text-body-medium leading-[1.6] w-full">
            We're in early access. Here's the kind of feedback we're hearing — and what we're building toward.
          </p>
          <p className="font-sans font-normal text-xs text-neutral-darkest/50 w-full">
            We don't publish feedback without permission.
          </p>
        </div>

        <div className="flex flex-col md:flex-row gap-8 w-full">
          {earlyNotes.map((note) => (
            <div
              key={note.id}
              className="flex-1 flex flex-col gap-6 items-start p-8 bg-cream border-2 border-neutral-darkest rounded-lg"
              data-testid={`note-${note.id}`}
            >
              <p className="font-sans font-normal text-body-medium leading-[1.6] text-neutral-darkest italic">
                "{note.quote}"
              </p>
              <span className="font-sans font-normal text-sm text-neutral-darkest/60">
                Anonymous — Early Access
              </span>
            </div>
          ))}
        </div>

        <div className="w-full max-w-[600px] flex flex-col gap-6 p-8 bg-neutral-lightest rounded-lg border border-neutral-darkest/20">
          <div className="flex flex-col gap-2 text-center">
            <h3 className="font-heading font-bold text-heading-4-mobile md:text-heading-4 tracking-[0.3px] md:tracking-[0.4px] text-neutral-darkest">
              Share Your Thoughts
            </h3>
            <p className="font-sans font-normal text-sm leading-[1.6] text-neutral-darkest/80">
              Your feedback helps us improve <span className="italic font-semibold">civilla</span>. No legal details needed — just what felt helpful or what felt confusing. Please don't include sensitive case details.
            </p>
          </div>

          <div className="flex flex-col gap-4">
            <div className="flex flex-col md:flex-row gap-4">
              <input
                type="text"
                placeholder="Name (optional)"
                value={name}
                onChange={(e) => setName(e.target.value)}
                className="flex-1 px-4 py-2.5 bg-white border border-neutral-darkest/30 rounded-lg font-sans text-sm text-neutral-darkest placeholder:text-neutral-darkest/50 focus:outline-none focus:border-bush"
                data-testid="input-feedback-name"
              />
              <input
                type="email"
                placeholder="Email (optional)"
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                className="flex-1 px-4 py-2.5 bg-white border border-neutral-darkest/30 rounded-lg font-sans text-sm text-neutral-darkest placeholder:text-neutral-darkest/50 focus:outline-none focus:border-bush"
                data-testid="input-feedback-email"
              />
            </div>
            <textarea
              placeholder="Your feedback (required)"
              value={message}
              onChange={(e) => setMessage(e.target.value)}
              rows={4}
              className="w-full px-4 py-2.5 bg-white border border-neutral-darkest/30 rounded-lg font-sans text-sm text-neutral-darkest placeholder:text-neutral-darkest/50 focus:outline-none focus:border-bush resize-none"
              data-testid="input-feedback-message"
            />
          </div>

          <div className="flex flex-col gap-2 items-center">
            <Button
              onClick={handleSubmit}
              disabled={!isValid}
              className="bg-bush text-white rounded-xl px-6 py-2.5 font-sans font-bold text-sm md:text-body-regular button-inset-shadow disabled:opacity-50 disabled:cursor-not-allowed"
              data-testid="button-send-feedback"
            >
              <Send className="w-4 h-4 mr-2" />
              Send Feedback
            </Button>
            <span className="font-sans font-normal text-xs text-neutral-darkest/50">
              This will open your email app.
            </span>
          </div>
        </div>
      </div>
    </section>
  );
}
