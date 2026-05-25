type SectionHeadingProps = {
  title: string;
  subtitle: string;
  center?: boolean;
};

export function SectionHeading({ title, subtitle, center = true }: SectionHeadingProps) {
  return (
    <div className={center ? "text-center" : "text-left"}>
      <h2 className="section-title">{title}</h2>
      <p className={center ? "section-subtitle" : "section-subtitle mx-0"}>{subtitle}</p>
    </div>
  );
}
