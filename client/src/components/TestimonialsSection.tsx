const starsUrl = "https://www.figma.com/api/mcp/asset/ca481a6f-0f8a-4197-929c-aef1e47a5dc7";
const avatar1Url = "https://www.figma.com/api/mcp/asset/2e7ae576-1874-41f5-b7be-8c73fba2de6d";
const avatar2Url = "https://www.figma.com/api/mcp/asset/cf06e763-e8ab-4041-a636-22bec0763d17";
const avatar3Url = "https://www.figma.com/api/mcp/asset/5167be0f-94b0-4a6f-b9d0-d3dcab3e17d3";

const testimonials = [
  {
    id: 1,
    quote: "\"I went from total confusion to actually understanding what my case needed.\"",
    name: "Sarah M.",
    role: "Self-represented parent",
    avatar: avatar1Url
  },
  {
    id: 2,
    quote: "\"civilla.ai helped me organize three years of messages into something a judge could follow.\"",
    name: "James T.",
    role: "Self-represented parent",
    avatar: avatar2Url
  },
  {
    id: 3,
    quote: "\"The plain language explanations took away so much of the panic I was carrying.\"",
    name: "Maria L.",
    role: "Self-represented parent",
    avatar: avatar3Url
  }
];

export default function TestimonialsSection() {
  return (
    <section 
      className="bg-cream w-full flex flex-col items-center px-5 md:px-16 py-16 md:py-28"
      data-testid="section-testimonials"
    >
      <div className="flex flex-col gap-12 md:gap-20 items-center max-w-container w-full">
        <div className="flex flex-col gap-5 md:gap-6 items-center text-neutral-darkest text-center max-w-content-large w-full">
          <h2 className="font-heading font-bold text-heading-2-mobile md:text-heading-2 tracking-[0.44px] md:tracking-[0.6px] w-full">
            What people are saying
          </h2>
          <p className="font-sans font-normal text-sm md:text-body-medium leading-[1.6] w-full">
            civilla.ai was built for people going through one of the hardest moments of their lives. Here's what they have to say.
          </p>
        </div>

        <div className="flex flex-col md:flex-row gap-8 w-full">
          {testimonials.map((testimonial) => (
            <div
              key={testimonial.id}
              className="flex-1 flex flex-col gap-6 items-start p-8 bg-cream border-2 border-neutral-darkest rounded-lg"
              data-testid={`testimonial-${testimonial.id}`}
            >
              <div className="flex flex-col gap-6 items-start">
                <img src={starsUrl} alt="5 stars" className="h-[19px] w-[116px]" />
                <p className="font-sans font-normal text-body-medium leading-[1.6] text-neutral-darkest">
                  {testimonial.quote}
                </p>
              </div>
              <div className="flex gap-4 items-center w-full">
                <img 
                  src={testimonial.avatar} 
                  alt={testimonial.name} 
                  className="w-12 h-12 rounded-full object-cover"
                />
                <div className="flex flex-1 flex-col items-start text-neutral-darkest text-body-regular leading-[1.6]">
                  <span className="font-sans font-bold w-full">{testimonial.name}</span>
                  <span className="font-sans font-normal w-full">{testimonial.role}</span>
                </div>
              </div>
            </div>
          ))}
        </div>
      </div>
    </section>
  );
}
