type BrandMarkProps = {
  text?: "civilla" | "civilla.ai" | "www.civilla.ai";
  className?: string;
};

export default function BrandMark({ text = "civilla", className = "" }: BrandMarkProps) {
  const v = String(text).toLowerCase() as BrandMarkProps["text"];

  return (
    <span
      className={`cv-brand ${className}`.trim()}
      aria-label={v}
    >
      {v}
    </span>
  );
}

export { BrandMark };
