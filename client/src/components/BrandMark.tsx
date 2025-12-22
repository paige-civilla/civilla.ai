type BrandMarkProps = {
  text?: string;
  className?: string;
};

export default function BrandMark({ text = "civilla", className = "" }: BrandMarkProps) {
  return (
    <span className={`cv-brand ${className}`.trim()}>
      {String(text).toLowerCase()}
    </span>
  );
}

export { BrandMark };
