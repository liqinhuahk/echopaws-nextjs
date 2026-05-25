type BadgeTone = 'orange' | 'emerald' | 'slate' | 'amber';
type BadgeSize = 'xs' | 'sm' | 'md';

type PetUiBadgeProps = {
  label: string;
  tone?: BadgeTone;
  size?: BadgeSize;
  className?: string;
};

type ConditionalPetUiBadgeProps = {
  show?: boolean;
  isPrimary?: boolean;
  className?: string;
  size?: BadgeSize;
};

type PetOrderBadgeProps = {
  rank: number;
  className?: string;
};

type PetOrderHintProps = {
  isPrimary?: boolean;
  prefix?: string;
  className?: string;
};

type PetActionChipProps = {
  label: string;
  className?: string;
};

function joinClasses(...values: Array<string | false | null | undefined>) {
  return values.filter(Boolean).join(' ');
}

function getToneClassName(tone: BadgeTone) {
  switch (tone) {
    case 'emerald':
      return 'bg-emerald-100 text-emerald-800';
    case 'slate':
      return 'bg-slate-100 text-slate-700';
    case 'amber':
      return 'bg-amber-100 text-amber-900';
    case 'orange':
    default:
      return 'bg-orange-100 text-orange-900';
  }
}

function getSizeClassName(size: BadgeSize) {
  switch (size) {
    case 'xs':
      return 'px-2.5 py-1 text-[10px]';
    case 'md':
      return 'px-3 py-1 text-xs';
    case 'sm':
    default:
      return 'px-3 py-1 text-[11px]';
  }
}

export function getPetOrderDescription(isPrimary?: boolean) {
  return isPrimary ? 'Primary pet — pinned at top' : 'Sorted by recent activity';
}

export function PetUiBadge({ label, tone = 'orange', size = 'sm', className }: PetUiBadgeProps) {
  return (
    <span className={joinClasses('rounded-full font-bold', getToneClassName(tone), getSizeClassName(size), className)}>
      {label}
    </span>
  );
}

export function PrimaryPetBadge({ show, isPrimary, className, size = 'sm' }: ConditionalPetUiBadgeProps) {
  const visible = show ?? isPrimary ?? true;
  if (!visible) return null;
  return <PetUiBadge label='Primary' tone='orange' size={size} className={className} />;
}

export function PrimaryPetLabelBadge({ show, isPrimary, className, size = 'md' }: ConditionalPetUiBadgeProps) {
  const visible = show ?? isPrimary ?? true;
  if (!visible) return null;
  return <PetUiBadge label='Primary Pet · Default Chat' tone='orange' size={size} className={className} />;
}

export function SelectedPetBadge({ show = true, className, size = 'xs' }: ConditionalPetUiBadgeProps) {
  if (!show) return null;
  return <PetUiBadge label='Selected' tone='emerald' size={size} className={className} />;
}

export function EditingPetBadge({ show = true, className, size = 'sm' }: ConditionalPetUiBadgeProps) {
  if (!show) return null;
  return <PetUiBadge label='Editing' tone='emerald' size={size} className={className} />;
}

export function PetOrderBadge({ rank, className }: PetOrderBadgeProps) {
  return <PetUiBadge label={`#${rank}`} tone='slate' size='xs' className={className} />;
}

export function PetOrderHint({ isPrimary, prefix = '', className }: PetOrderHintProps) {
  return <span className={className}>{`${prefix}${getPetOrderDescription(isPrimary)}`}</span>;
}

export function PetActionChip({ label, className }: PetActionChipProps) {
  return <PetUiBadge label={label} tone='orange' size='md' className={joinClasses('bg-orange-50 text-orange-800', className)} />;
}