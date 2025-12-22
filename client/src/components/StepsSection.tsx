import React from "react";

type Step = {
  step: string;
  title: React.ReactNode;
  body: React.ReactNode;
  imageSrc?: string;
  imageAlt?: string;
};

function StepCard({
  step,
  title,
  body,
  imageSrc,
  imageAlt,
  className = "",
  showStepLabel = true,
}: Step & { className?: string; showStepLabel?: boolean }) {
  return (
    <div
      className={[
        "rounded-[24px] border-2 border-black bg-[#f6f4ef] overflow-hidden",
        "min-w-0",
        className,
      ].join(" ")}
    >
      <div className="p-8 min-w-0">
        {showStepLabel && (
          <div className="text-sm font-semibold tracking-tight text-neutral-800">
            {step}
          </div>
        )}

        <div className="mt-3 text-4xl md:text-5xl font-black leading-[1.02] tracking-tight min-w-0">
          {title}
        </div>

        <div className="mt-5 text-base md:text-lg leading-relaxed text-neutral-800 min-w-0">
          {body}
        </div>
      </div>

      {imageSrc ? (
        <div className="w-full min-w-0">
          <img
            src={imageSrc}
            alt={imageAlt ?? ""}
            className="block w-full h-auto object-cover"
          />
        </div>
      ) : null}
    </div>
  );
}

export default function StepsSection() {
  const steps: Step[] = [
    {
      step: "Step one",
      title: "Understand your case type and timeline",
      body: (
        <>
          Choose your state and case type to view plain-language education and
          common stages people often see.
        </>
      ),
      imageSrc: "/images/steps/step-1.jpg",
      imageAlt: "Compass on a map",
    },
    {
      step: "Step two",
      title: "Gather and organize your information",
      body: (
        <>
          Add documents, messages, and key events. <em className="cv-brand">civilla</em>{" "}
          organizes what you provide into a clear, reviewable timeline.
        </>
      ),
      imageSrc: "/images/steps/step-2.jpg",
      imageAlt: "Desk with laptop and pencils",
    },
    {
      step: "Step three",
      title: "Information & Guidelines Available to the Public",
      body: (
        <>
          Review statutes, court rules, and educational resources — without advice,
          predictions, or filing instructions.
        </>
      ),
    },
    {
      step: "Step four",
      title: "Prepare with knowledge and clarity",
      body: (
        <>
          Turn information into structure: a calmer record, clearer questions, and
          better next steps for you to decide.
        </>
      ),
    },
  ];

  return (
    <section className="px-6 md:px-10">
      <div className="mx-auto max-w-6xl">
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
          {steps.map((s, idx) => (
            <StepCard
              key={String(s.step) + idx}
              {...s}
              className={idx === 0 ? "md:col-span-2 lg:col-span-3" : ""}
              showStepLabel={idx !== 0}
            />
          ))}
        </div>
      </div>
    </section>
  );
}
