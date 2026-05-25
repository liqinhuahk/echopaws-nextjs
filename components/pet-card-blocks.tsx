import type { ReactNode } from "react";
import { PetActionChip } from "@/components/pet-ui-badges";

export type PetIdentityBlockProps = {
  name: string;
  imageUrl?: string | null;
  subtitle?: string | null;
  badges?: ReactNode;
  rightSlot?: ReactNode;
  imageSize?: "md" | "lg";
  placeholderEmoji?: string;
  className?: string;
  nameClassName?: string;
  subtitleClassName?: string;
  imageClassName?: string;
  imageWrapperClassName?: string;
  contentClassName?: string;
};

export type PetMetricItem = {
  label: string;
  value: ReactNode;
  tone?: "orange" | "slate" | "default";
  cardClassName?: string;
  labelClassName?: string;
  valueClassName?: string;
};

export type PetMetricGridProps = {
  items: PetMetricItem[];
  className?: string;
  columnsClassName?: string;
};

export type PetQuickActionsProps = {
  labels: string[];
  className?: string;
};

function joinClasses(...values: Array<string | false | null | undefined>) {
  return values.filter(Boolean).join(" ");
}

function getMetricToneClassName(tone: NonNullable<PetMetricItem["tone"]>) {
  switch (tone) {
    case "orange":
      return "bg-orange-50 text-orange-950";
    case "slate":
      return "bg-slate-50 text-slate-900";
    case "default":
    default:
      return "border border-black/5 bg-white text-slate-900";
  }
}

function getMetricLabelToneClassName(tone: NonNullable<PetMetricItem["tone"]>) {
  switch (tone) {
    case "orange":
      return "text-orange-700";
    case "slate":
      return "text-slate-600";
    case "default":
    default:
      return "text-muted";
  }
}

export function PetIdentityBlock({
  name,
  imageUrl = null,
  subtitle,
  badges,
  rightSlot,
  imageSize = "md",
  placeholderEmoji = "🐾",
  className,
  nameClassName,
  subtitleClassName,
  imageClassName,
  imageWrapperClassName,
  contentClassName,
}: PetIdentityBlockProps) {
  const imageShellClassName =
    imageSize === "lg"
      ? "h-20 w-20 rounded-[24px]"
      : "h-16 w-16 rounded-[20px]";

  const imageTextClassName = imageSize === "lg" ? "text-4xl" : "text-3xl";

  return (
    <div className={joinClasses("flex items-center gap-4", className)}>
      {imageUrl ? (
        <img
          src={imageUrl}
          alt={`${name} avatar`}
          className={joinClasses(imageShellClassName, "object-cover shadow-sm", imageClassName)}
        />
      ) : (
        <div
          className={joinClasses(
            imageShellClassName,
            imageTextClassName,
            "grid place-items-center bg-gradient-to-br from-amber-100 to-orange-100",
            imageWrapperClassName,
          )}
        >
          {placeholderEmoji}
        </div>
      )}

      <div className={joinClasses("min-w-0 flex-1", contentClassName)}>
        <div className="flex flex-wrap items-center gap-2">
          <div className={joinClasses("truncate font-extrabold", imageSize === "lg" ? "text-2xl" : "text-lg", nameClassName)}>{name}</div>
          {badges}
        </div>
        {subtitle ? <div className={joinClasses("mt-1 text-sm text-muted", subtitleClassName)}>{subtitle}</div> : null}
      </div>

      {rightSlot}
    </div>
  );
}

export function PetMetricGrid({ items, className, columnsClassName = "grid-cols-2" }: PetMetricGridProps) {
  return (
    <div className={joinClasses("grid gap-3", columnsClassName, className)}>
      {items.map((item, index) => {
        const tone = item.tone || "default";
        return (
          <div key={`${item.label}-${index}`} className={joinClasses("rounded-2xl px-4 py-3", getMetricToneClassName(tone), item.cardClassName)}>
            <div className={joinClasses("text-xs font-bold", getMetricLabelToneClassName(tone), item.labelClassName)}>{item.label}</div>
            <div className={joinClasses("mt-1 text-2xl font-extrabold tracking-tight", item.valueClassName)}>{item.value}</div>
          </div>
        );
      })}
    </div>
  );
}

export function PetQuickActions({ labels, className }: PetQuickActionsProps) {
  return (
    <div className={joinClasses("flex flex-wrap gap-2", className)}>
      {labels.map((label) => (
        <PetActionChip key={label} label={label} />
      ))}
    </div>
  );
}
