import { PetOrderBadge, PetOrderHint, PetUiBadge, getPetOrderDescription } from "@/components/pet-ui-badges";

type PrimaryPetBadgeProps = {
  isPrimary?: boolean;
  label?: string;
  className?: string;
  size?: "xs" | "sm" | "md";
};

export function PrimaryPetBadge({
  isPrimary = true,
  label = "Default Pet",
  className,
  size = "sm",
}: PrimaryPetBadgeProps) {
  if (!isPrimary) return null;
  return <PetUiBadge label={label} tone="orange" size={size} className={className} />;
}

export { PetOrderBadge, PetOrderHint, getPetOrderDescription };
