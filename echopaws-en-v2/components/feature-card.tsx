import { ReactNode } from "react";

export function FeatureCard({ icon, title, text }: { icon: ReactNode; title: string; text: string }) {
  return (
    <article className="feature-card">
      <div className="feature-icon">{icon}</div>
      <h3 className="text-xl font-bold tracking-tight">{title}</h3>
      <p className="mt-2 text-sm leading-8 text-muted">{text}</p>
    </article>
  );
}
