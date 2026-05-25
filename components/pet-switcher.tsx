import Link from 'next/link';
import { PetSectionHeader } from '@/components/pet-cards';
import { PetOrderBadge, PrimaryPetBadge, SelectedPetBadge, getPetOrderDescription } from '@/components/pet-ui-badges';

type PetItem = {
  id: string;
  name: string;
  imageUrl: string | null;
  isPrimary?: boolean;
};

type PetSwitcherProps = {
  pets: PetItem[];
  selectedPetId?: string | null;
  basePath: string;
  title?: string;
  description?: string;
  includeAllOption?: boolean;
  allLabel?: string;
  className?: string;
};

function buildHref(basePath: string, petId?: string | null) {
  if (!petId) return basePath;
  const separator = basePath.includes('?') ? '&' : '?';
  return `${basePath}${separator}pet_id=${encodeURIComponent(petId)}`;
}

export function PetSwitcher({
  pets,
  selectedPetId = null,
  basePath,
  title = 'Switch Pet',
  description,
  includeAllOption = false,
  allLabel = 'All Pets',
  className,
}: PetSwitcherProps) {
  if (!pets.length && !includeAllOption) return null;

  return (
    <section className={className}>
      <PetSectionHeader
        title={title}
        description={description}
        titleClassName='text-xl tracking-tight'
        descriptionClassName='mt-1'
        action={
          <Link href='/create-pet' className='subtle-button'>
            Add Pet
          </Link>
        }
      />

      <div className='mt-4 flex flex-wrap gap-3'>
        {includeAllOption ? (
          <Link
            href={buildHref(basePath, null)}
            className={`flex items-center gap-3 rounded-[22px] border px-4 py-3 transition ${
              !selectedPetId
                ? 'border-orange-300 bg-gradient-to-r from-orange-50 to-amber-50 shadow-sm shadow-orange-100'
                : 'border-black/5 bg-white hover:border-orange-200'
            }`}
          >
            <div className='grid h-11 w-11 place-items-center rounded-[16px] bg-white text-xl shadow-sm'>🐾</div>
            <div>
              <div className='text-sm font-bold text-ink'>{allLabel}</div>
              <div className='text-xs text-muted'>View all summaries and memories</div>
            </div>
          </Link>
        ) : null}

        {pets.map((pet, index) => {
          const active = selectedPetId === pet.id || (!selectedPetId && !includeAllOption && pets[0]?.id === pet.id);
          const helperText = getPetOrderDescription(pet.isPrimary);

          return (
            <Link
              key={pet.id}
              href={buildHref(basePath, pet.id)}
              className={`flex items-center gap-3 rounded-[22px] border px-4 py-3 transition ${
                active
                  ? 'border-orange-300 bg-gradient-to-r from-orange-50 to-amber-50 shadow-sm shadow-orange-100'
                  : 'border-black/5 bg-white hover:border-orange-200'
              }`}
            >
              {pet.imageUrl ? (
                <img src={pet.imageUrl} alt={`${pet.name} avatar`} className='h-11 w-11 rounded-[16px] object-cover shadow-sm' />
              ) : (
                <div className='grid h-11 w-11 place-items-center rounded-[16px] bg-white text-xl shadow-sm'>🐶</div>
              )}
              <div>
                <div className='flex flex-wrap items-center gap-2'>
                  <div className='text-sm font-bold text-ink'>{pet.name}</div>
                  <PrimaryPetBadge isPrimary={pet.isPrimary} size='xs' />
                  <SelectedPetBadge show={active} size='xs' />
                  <PetOrderBadge rank={index + 1} />
                </div>
                <div className='text-xs text-muted'>{helperText}</div>
              </div>
            </Link>
          );
        })}
      </div>
    </section>
  );
}