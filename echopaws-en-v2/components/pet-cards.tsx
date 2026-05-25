import Link from 'next/link';
import type { ReactNode } from 'react';
import { PetIdentityBlock, PetMetricGrid, PetQuickActions, type PetMetricItem } from '@/components/pet-card-blocks';
import { EditingPetBadge, PetOrderBadge, PrimaryPetBadge, PrimaryPetLabelBadge } from '@/components/pet-ui-badges';

export type PetActionVariant = 'primary' | 'secondary' | 'success';

type PetFormAction = (formData: FormData) => void | Promise<void>;

export type PetOverviewCardProps = {
  href: string;
  name: string;
  imageUrl?: string | null;
  breed?: string | null;
  personality?: string | null;
  summary?: string | null;
  memoryCount: number;
  conversationCount: number;
  lastChatText: string;
  primary?: boolean;
  isPrimary?: boolean;
  selected?: boolean;
  isActive?: boolean;
  order?: number;
  rank?: number;
  actions?: string[];
  actionLabels?: string[];
  className?: string;
};

export type PetCardSection = {
  title: ReactNode;
  content: ReactNode;
  action?: ReactNode;
  className?: string;
  headerClassName?: string;
  titleClassName?: string;
  contentClassName?: string;
};

export type PetActionPanelItem = {
  key?: string;
  label?: ReactNode;
  href?: string;
  variant?: PetActionVariant;
  className?: string;
  node?: ReactNode;
};

export type PetSidebarProfileCardProps = {
  name: string;
  imageUrl?: string | null;
  subtitle?: string | null;
  primary?: boolean;
  isPrimary?: boolean;
  primaryLabelMode?: 'simple' | 'detailed';
  placeholderEmoji?: string;
  orderHintText?: ReactNode;
  chips?: ReactNode;
  sections?: PetCardSection[];
  metrics?: PetMetricItem[];
  metricsColumnsClassName?: string;
  footer?: ReactNode;
  className?: string;
  imageClassName?: string;
  imageWrapperClassName?: string;
  nameClassName?: string;
  subtitleClassName?: string;
};

export type PetMemorySummaryCardProps = {
  name: string;
  imageUrl?: string | null;
  summary: string;
  memoryCount: number;
  updatedAtText: string;
  primary?: boolean;
  isPrimary?: boolean;
  className?: string;
  headerAction?: ReactNode;
};

export type PetMemoryListItem = {
  key: string;
  badges?: ReactNode;
  content: ReactNode;
  meta?: ReactNode;
  action?: ReactNode;
  className?: string;
};

export type PetMemoryListCardProps = {
  title?: ReactNode;
  description?: ReactNode;
  titleAction?: ReactNode;
  items: PetMemoryListItem[];
  emptyState: ReactNode;
  className?: string;
  listClassName?: string;
};

export type PetNoticeTone = 'success' | 'error' | 'warning' | 'info';

export type PetNoticeBannerProps = {
  tone?: PetNoticeTone;
  children: ReactNode;
  className?: string;
};

export type PetSectionHeaderProps = {
  title: ReactNode;
  description?: ReactNode;
  action?: ReactNode;
  className?: string;
  titleClassName?: string;
  descriptionClassName?: string;
};

export type PetToolbarCardProps = {
  children: ReactNode;
  className?: string;
};

export type PetSummaryWorkspaceCardProps = {
  title: ReactNode;
  description?: ReactNode;
  action?: ReactNode;
  children: ReactNode;
  className?: string;
  contentClassName?: string;
};

export type PetEditFormCardProps = {
  title: ReactNode;
  description?: ReactNode;
  action: PetFormAction;
  hiddenFields?: ReactNode;
  fields: ReactNode;
  footer?: ReactNode;
  className?: string;
  formClassName?: string;
  encType?: string;
};

export type PetDangerZoneCardProps = {
  title?: ReactNode;
  description: ReactNode;
  action: PetFormAction;
  hiddenFields?: ReactNode;
  buttonLabel: ReactNode;
  className?: string;
  buttonClassName?: string;
};

export type PetChatContextCardProps = {
  title: ReactNode;
  description?: ReactNode;
  badge?: ReactNode;
  chatNode: ReactNode;
  className?: string;
  headerClassName?: string;
};

export type PetPageHeroCardProps = {
  eyebrow: ReactNode;
  title: ReactNode;
  description?: ReactNode;
  notice?: ReactNode;
  actions?: ReactNode;
  className?: string;
};

export type PetStatCardItem = {
  label: ReactNode;
  value: ReactNode;
  description?: ReactNode;
  className?: string;
  valueClassName?: string;
};

export type PetStatsGridProps = {
  items: PetStatCardItem[];
  className?: string;
  columnsClassName?: string;
};

export type PetEmptyStateCardAction = {
  label: ReactNode;
  href: string;
  variant?: 'primary' | 'secondary';
};

export type PetEmptyStateCardProps = {
  title: ReactNode;
  description: ReactNode;
  primaryAction?: PetEmptyStateCardAction;
  secondaryAction?: PetEmptyStateCardAction;
  className?: string;
};

function joinClasses(...values: Array<string | false | null | undefined>) {
  return values.filter(Boolean).join(' ');
}

function getActionClassName(variant: PetActionVariant) {
  switch (variant) {
    case 'secondary':
      return 'subtle-button w-full text-center';
    case 'success':
      return 'w-full rounded-2xl bg-emerald-50 px-4 py-3 text-sm font-bold text-emerald-800';
    case 'primary':
    default:
      return 'brand-button w-full text-center';
  }
}

function getNoticeClassName(tone: PetNoticeTone) {
  switch (tone) {
    case 'error':
      return 'bg-rose-50 text-rose-800';
    case 'warning':
      return 'bg-amber-50 text-amber-900';
    case 'info':
      return 'bg-slate-100 text-slate-800';
    case 'success':
    default:
      return 'bg-emerald-50 text-emerald-800';
  }
}

export function PetActionPanel({ items, className }: { items: PetActionPanelItem[]; className?: string }) {
  return (
    <div className={joinClasses('grid gap-3', className)}>
      {items.map((item, index) => {
        if (item.node) {
          return <div key={item.key || `node-${index}`}>{item.node}</div>;
        }

        if (!item.href || !item.label) {
          return null;
        }

        return (
          <Link
            key={item.key || `link-${index}`}
            href={item.href}
            className={joinClasses(getActionClassName(item.variant || 'secondary'), item.className)}
          >
            {item.label}
          </Link>
        );
      })}
    </div>
  );
}

export function PetOverviewCard({
  href,
  name,
  imageUrl,
  breed,
  personality,
  summary,
  memoryCount,
  conversationCount,
  lastChatText,
  primary,
  isPrimary,
  selected,
  isActive,
  order,
  rank,
  actions,
  actionLabels,
  className,
}: PetOverviewCardProps) {
  const resolvedPrimary = primary ?? isPrimary ?? false;
  const resolvedSelected = selected ?? isActive ?? false;
  const resolvedOrder = order ?? rank ?? 1;
  const resolvedActions = actions ?? actionLabels ?? ['Edit', 'Chat', 'Memories'];

  return (
    <Link
      href={href}
      className={joinClasses(
        'glass-card block p-5 transition',
        resolvedSelected ? 'ring-2 ring-orange-200 shadow-lg shadow-orange-100/60' : 'hover:-translate-y-0.5 hover:shadow-lg hover:shadow-orange-100/40',
        className,
      )}
    >
      <PetIdentityBlock
        name={name}
        imageUrl={imageUrl}
        subtitle={breed || 'No breed set'}
        badges={
          <>
            <PrimaryPetBadge show={resolvedPrimary} />
            <EditingPetBadge show={resolvedSelected} />
          </>
        }
        rightSlot={<PetOrderBadge rank={resolvedOrder} className='px-3 py-1 text-[11px] text-slate-700' />}
      />

      <PetMetricGrid
        className='mt-4'
        items={[
          { label: 'Memories', value: memoryCount, tone: 'orange' },
          { label: 'Chats', value: conversationCount, tone: 'slate' },
        ]}
      />

      <div className='mt-4 text-sm leading-7 text-muted'>
        <div><strong className='text-ink'>Personality:</strong> {personality || 'Not set yet'}</div>
        <div><strong className='text-ink'>Last Chat:</strong> {lastChatText}</div>
        <div><strong className='text-ink'>Sort Order:</strong> {resolvedPrimary ? 'Primary pet — pinned at top' : 'Sorted by recent activity'}</div>
      </div>

      <div className='mt-4 line-clamp-3 rounded-2xl border border-black/5 bg-white px-4 py-3 text-sm leading-7 text-slate-700'>
        {summary || 'No companionship summary yet'}
      </div>

      <PetQuickActions className='mt-4' labels={resolvedActions} />
    </Link>
  );
}

export function PetSidebarProfileCard({
  name,
  imageUrl,
  subtitle,
  primary,
  isPrimary,
  primaryLabelMode = 'simple',
  placeholderEmoji = '🐾',
  orderHintText,
  chips,
  sections = [],
  metrics = [],
  metricsColumnsClassName,
  footer,
  className,
  imageClassName,
  imageWrapperClassName,
  nameClassName,
  subtitleClassName,
}: PetSidebarProfileCardProps) {
  const resolvedPrimary = primary ?? isPrimary ?? false;

  return (
    <div className={joinClasses('rounded-[28px] border border-orange-100 bg-gradient-to-b from-orange-50 to-amber-50 p-5', className)}>
      <PetIdentityBlock
        name={name}
        imageUrl={imageUrl}
        imageSize='lg'
        subtitle={subtitle}
        badges={resolvedPrimary ? (primaryLabelMode === 'detailed' ? <PrimaryPetLabelBadge /> : <PrimaryPetBadge />) : null}
        placeholderEmoji={placeholderEmoji}
        imageClassName={joinClasses('shadow-md shadow-orange-100', imageClassName)}
        imageWrapperClassName={joinClasses('bg-white shadow-sm', imageWrapperClassName)}
        nameClassName={joinClasses('text-2xl', nameClassName)}
        subtitleClassName={subtitleClassName}
      />

      {orderHintText ? <div className='mt-2 text-[11px] font-semibold text-orange-800'>{orderHintText}</div> : null}
      {chips ? <div className='mt-4 flex flex-wrap gap-2'>{chips}</div> : null}

      {sections.length ? (
        <div className='mt-4 grid gap-3'>
          {sections.map((section, index) => (
            <div key={index} className={joinClasses('rounded-2xl bg-white px-4 py-3', section.className)}>
              <div className={joinClasses('flex items-center justify-between gap-3', section.headerClassName)}>
                <strong className={joinClasses('text-sm font-bold text-ink', section.titleClassName)}>{section.title}</strong>
                {section.action}
              </div>
              <div className={joinClasses('mt-2 text-sm leading-7 text-slate-700', section.contentClassName)}>{section.content}</div>
            </div>
          ))}
        </div>
      ) : null}

      {metrics.length ? (
        <PetMetricGrid
          className='mt-4'
          columnsClassName={metricsColumnsClassName || 'md:grid-cols-2 lg:grid-cols-1'}
          items={metrics.map((item) => ({
            ...item,
            cardClassName: joinClasses('border border-black/5 bg-white', item.cardClassName),
          }))}
        />
      ) : null}

      {footer ? <div className='mt-4'>{footer}</div> : null}
    </div>
  );
}

export function PetMemorySummaryCard({
  name,
  imageUrl,
  summary,
  memoryCount,
  updatedAtText,
  primary,
  isPrimary,
  className,
  headerAction,
}: PetMemorySummaryCardProps) {
  const resolvedPrimary = primary ?? isPrimary ?? false;

  return (
    <div className={joinClasses('rounded-[28px] border border-orange-100 bg-gradient-to-r from-amber-50 to-rose-50 p-5', className)}>
      <div className='flex items-start justify-between gap-3'>
        <PetIdentityBlock
          className='min-w-0 flex-1'
          name={name}
          imageUrl={imageUrl}
          subtitle={`${memoryCount} memories · Updated ${updatedAtText}`}
          badges={<PrimaryPetBadge show={resolvedPrimary} size='xs' />}
          imageClassName='h-14 w-14 rounded-[18px]'
          imageWrapperClassName='h-14 w-14 rounded-[18px] bg-white text-2xl'
        />
        {headerAction}
      </div>
      <div className='mt-4 whitespace-pre-line text-sm leading-7 text-slate-700'>{summary}</div>
    </div>
  );
}

export function PetMemoryListCard({
  title,
  description,
  titleAction,
  items,
  emptyState,
  className,
  listClassName,
}: PetMemoryListCardProps) {
  return (
    <div className={joinClasses('rounded-2xl border border-black/5 bg-white p-4', className)}>
      {title || description || titleAction ? (
        <div className='flex items-center justify-between gap-3'>
          <div>
            {title ? <strong>{title}</strong> : null}
            {description ? <div className='mt-1 text-sm leading-7 text-muted'>{description}</div> : null}
          </div>
          {titleAction}
        </div>
      ) : null}

      {items.length ? (
        <div className={joinClasses('mt-3 grid gap-3', listClassName)}>
          {items.map((item) => (
            <div key={item.key} className={joinClasses('rounded-2xl border border-black/5 bg-orange-50/40 px-3 py-3', item.className)}>
              <div className='flex items-start justify-between gap-3'>
                <div className='min-w-0 flex-1'>
                  {item.badges ? <div className='flex flex-wrap items-center gap-2'>{item.badges}</div> : null}
                  <div className='mt-2 text-sm leading-7 text-slate-700'>{item.content}</div>
                  {item.meta ? <div className='mt-2 text-xs text-muted'>{item.meta}</div> : null}
                </div>
                {item.action}
              </div>
            </div>
          ))}
        </div>
      ) : (
        <div className='mt-3'>{emptyState}</div>
      )}
    </div>
  );
}

export function PetEditFormCard({
  title,
  description,
  action,
  hiddenFields,
  fields,
  footer,
  className,
  formClassName,
  encType = 'multipart/form-data',
}: PetEditFormCardProps) {
  return (
    <section className={joinClasses('glass-card p-6', className)}>
      <div>
        <h2 className='text-2xl font-extrabold'>{title}</h2>
        {description ? <p className='mt-2 text-sm leading-7 text-muted'>{description}</p> : null}
      </div>

      <form action={action} className={joinClasses('mt-6 grid gap-4', formClassName)} encType={encType}>
        {hiddenFields}
        {fields}
        {footer}
      </form>
    </section>
  );
}

export function PetDangerZoneCard({
  title = 'Danger Zone',
  description,
  action,
  hiddenFields,
  buttonLabel,
  className,
  buttonClassName,
}: PetDangerZoneCardProps) {
  return (
    <section className={joinClasses('rounded-[28px] border border-rose-100 bg-rose-50 p-5', className)}>
      <h3 className='text-lg font-extrabold text-rose-900'>{title}</h3>
      <div className='mt-2 text-sm leading-7 text-rose-800'>{description}</div>
      <form action={action} className='mt-4'>
        {hiddenFields}
        <button className={joinClasses('rounded-full border border-rose-200 bg-white px-5 py-3 text-sm font-bold text-rose-700 transition hover:bg-rose-100', buttonClassName)}>
          {buttonLabel}
        </button>
      </form>
    </section>
  );
}

export function PetChatContextCard({ title, description, badge, chatNode, className, headerClassName }: PetChatContextCardProps) {
  return (
    <section className={joinClasses('glass-card p-5', className)}>
      <div className={joinClasses('flex items-center justify-between gap-4', headerClassName)}>
        <div>
          <h2 className='text-2xl font-bold tracking-tight'>{title}</h2>
          {description ? <p className='mt-1 text-sm text-muted'>{description}</p> : null}
        </div>
        {badge}
      </div>

      <div className='mt-4'>{chatNode}</div>
    </section>
  );
}

export function PetPageHeroCard({ eyebrow, title, description, notice, actions, className }: PetPageHeroCardProps) {
  return (
    <section className={className}>
      <div className='eyebrow'>{eyebrow}</div>
      <h1 className='page-title mt-4'>{title}</h1>
      {description ? <p className='page-subtitle mx-0'>{description}</p> : null}
      {notice ? <div className='mt-6'>{notice}</div> : null}
      {actions ? <div className='mt-6'>{actions}</div> : null}
    </section>
  );
}

export function PetStatsGrid({ items, className, columnsClassName = 'md:grid-cols-2 xl:grid-cols-4' }: PetStatsGridProps) {
  return (
    <section className={joinClasses('grid gap-4', columnsClassName, className)}>
      {items.map((item, index) => (
        <div key={index} className={joinClasses('glass-card p-5', item.className)}>
          <div className='text-sm font-bold text-muted'>{item.label}</div>
          <div className={joinClasses('mt-2 text-3xl font-extrabold tracking-tight', item.valueClassName)}>{item.value}</div>
          {item.description ? <p className='mt-2 text-sm leading-7 text-muted'>{item.description}</p> : null}
        </div>
      ))}
    </section>
  );
}

export function PetEmptyStateCard({ title, description, primaryAction, secondaryAction, className }: PetEmptyStateCardProps) {
  return (
    <section className={joinClasses('glass-card p-8', className)}>
      <h2 className='text-2xl font-extrabold'>{title}</h2>
      <p className='mt-3 max-w-2xl text-sm leading-8 text-muted'>{description}</p>
      {primaryAction || secondaryAction ? (
        <div className='mt-6 flex flex-wrap gap-3'>
          {primaryAction ? (
            <Link href={primaryAction.href} className={joinClasses('brand-button', primaryAction.variant === 'secondary' && 'subtle-button')}>
              {primaryAction.label}
            </Link>
          ) : null}
          {secondaryAction ? (
            <Link href={secondaryAction.href} className={joinClasses('subtle-button', secondaryAction.variant === 'primary' && 'brand-button')}>
              {secondaryAction.label}
            </Link>
          ) : null}
        </div>
      ) : null}
    </section>
  );
}

export function PetNoticeBanner({ tone = 'success', children, className }: PetNoticeBannerProps) {
  return <div className={joinClasses('rounded-2xl px-4 py-3 text-sm font-bold', getNoticeClassName(tone), className)}>{children}</div>;
}

export function PetSectionHeader({ title, description, action, className, titleClassName, descriptionClassName }: PetSectionHeaderProps) {
  return (
    <div className={joinClasses('flex flex-wrap items-center justify-between gap-3', className)}>
      <div>
        <h2 className={joinClasses('text-2xl font-extrabold', titleClassName)}>{title}</h2>
        {description ? <p className={joinClasses('mt-2 text-sm leading-7 text-muted', descriptionClassName)}>{description}</p> : null}
      </div>
      {action}
    </div>
  );
}

export function PetToolbarCard({ children, className }: PetToolbarCardProps) {
  return <section className={joinClasses('glass-card p-5', className)}>{children}</section>;
}

export function PetSummaryWorkspaceCard({ title, description, action, children, className, contentClassName }: PetSummaryWorkspaceCardProps) {
  return (
    <section className={joinClasses('glass-card p-6', className)}>
      <PetSectionHeader title={title} description={description} action={action} />
      <div className={joinClasses('mt-5', contentClassName)}>{children}</div>
    </section>
  );
}