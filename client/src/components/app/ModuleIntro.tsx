import { Info } from "lucide-react";

interface ModuleIntroProps {
  title: string;
  paragraphs: string[];
  bullets?: string[];
  caution?: string;
}

export default function ModuleIntro({ title, paragraphs, bullets, caution }: ModuleIntroProps) {
  return (
    <div 
      className="w-full bg-white border border-[#A2BEC2] rounded-lg p-4 sm:p-6 mb-6"
      data-testid="module-intro"
    >
      <div className="flex items-start gap-3">
        <div className="flex-shrink-0 w-8 h-8 rounded-full bg-[#A2BEC2]/20 flex items-center justify-center">
          <Info className="w-4 h-4 text-[#314143]" />
        </div>
        <div className="flex-1 min-w-0">
          <h2 className="font-heading font-semibold text-lg text-[#243032] mb-2" data-testid="module-intro-title">
            {title}
          </h2>
          <div className="space-y-2">
            {paragraphs.map((p, idx) => (
              <p key={idx} className="font-sans text-sm text-[#243032]/80 leading-relaxed">
                {p}
              </p>
            ))}
          </div>
          {bullets && bullets.length > 0 && (
            <ul className="mt-3 space-y-1.5">
              {bullets.map((b, idx) => (
                <li key={idx} className="font-sans text-sm text-[#243032]/80 flex items-start gap-2">
                  <span className="text-[#A2BEC2] mt-1">•</span>
                  <span>{b}</span>
                </li>
              ))}
            </ul>
          )}
          {caution && (
            <p className="mt-3 font-sans text-xs text-[#243032]/60 italic">
              {caution}
            </p>
          )}
        </div>
      </div>
    </div>
  );
}
