export function BrandMark({ variant = "civilla" }: { variant?: "civilla" | "civilla.ai" | "www.civilla.ai" }) {
  return <span className="cv-brand">{variant}</span>;
}
