import Link from 'next/link';
import { redirect } from 'next/navigation';
import { deletePetAction, setDefaultPetAction, updatePetAction } from '@/app/actions/pets';
import { FloatingToast } from '@/components/floating-toast';
import { FormSubmitButton } from '@/components/form-submit-button';
import { PetBreedSelect } from '@/components/pet-breed-select';
import { PetActionPanel, PetDangerZoneCard, PetEditFormCard, PetEmptyStateCard, PetNoticeBanner, PetOverviewCard, PetPageHeroCard, PetSidebarProfileCard, PetStatsGrid, PetToolbarCard } from '@/components/pet-cards';
import { PetSwitcher } from '@/components/pet-switcher';
import { PetOrderHint } from '@/components/pet-ui-badges';
import { SiteFooter } from '@/components/site-footer';
import { SiteHeader } from '@/components/site-header';
import { getPetsForUser } from '@/lib/pets';
import { createServerSupabaseClient, hasSupabaseEnv } from '@/lib/supabase/server';

function formatDate(value: string | null) {
  if (!value) return 'Not chatted yet';

  return new Intl.DateTimeFormat('en-US', {
    year: 'numeric',
    month: '2-digit',
    day: '2-digit',
    hour: '2-digit',
    minute: '2-digit',
  }).format(new Date(value));
}

export default async function PetsPage({
  searchParams,
}: {
  searchParams?: { pet_id?: string; message?: string; error?: string };
}) {
  if (!hasSupabaseEnv()) {
    redirect('/login?error=Please%20configure%20Supabase%20environment%20variables%20first.');
  }

  const supabase = createServerSupabaseClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();

  if (!user) {
    redirect('/login?message=Please%20sign%20in%20first%20to%20manage%20your%20pets.');
  }

  const data = await getPetsForUser(user.id);
  const selectedPetId = searchParams?.pet_id || data.defaultPetId || data.pets[0]?.id || null;
  const selectedPet = data.pets.find((pet) => pet.id === selectedPetId) || data.pets[0] || null;
  const latestActivePet = data.pets.find((pet) => pet.id === data.latestActivePetId) || null;

  return (
    <>
      <SiteHeader ctaLabel='Create New Pet' ctaHref='/create-pet' />
      <FloatingToast message={searchParams?.message || null} tone='success' />
      <FloatingToast message={searchParams?.error || null} tone='error' />

      <main className='container-shell py-10'>
        <PetPageHeroCard
          eyebrow='Pet Manager'
          title='Manage Your EchoPaws Companions'
          description='This page is a full pet management center. Switch pets quickly, view chat activity, memory counts, and companionship summaries per pet. Edit, set as primary, or delete directly from here.'
        />

        <PetStatsGrid
          className='mt-8'
          items={[
            {
              label: 'Total Pets',
              value: data.pets.length,
              description: `You have created ${data.pets.length} switchable companion${data.pets.length !== 1 ? 's' : ''}.`,
            },
            {
              label: 'Total Memories',
              value: data.totalMemories,
              description: 'Memories accumulated across all pets. Continuously influences response warmth.',
            },
            {
              label: 'Total Conversations',
              value: data.totalConversations,
              description: 'Used to tell which pet is most frequently accompanied, and to observe interaction depth.',
            },
            {
              label: 'Most Active',
              value: latestActivePet?.name || 'Not chatted yet',
              valueClassName: 'mt-2 text-2xl font-extrabold tracking-tight',
              description: latestActivePet?.last_chat_at ? `Last interaction: ${formatDate(latestActivePet.last_chat_at)}` : 'Start chatting and this will show the most recently active pet.',
            },
          ]}
        />

        {data.pets.length ? (
          <PetToolbarCard className='mt-8'>
            <PetSwitcher
              pets={data.pets.map((pet) => ({ id: pet.id, name: pet.name, imageUrl: pet.image_url, isPrimary: pet.id === data.defaultPetId }))}
              selectedPetId={selectedPetId}
              basePath='/pets'
              title='Switch Pet to Edit'
              description={`You have ${data.pets.length} pet${data.pets.length !== 1 ? 's' : ''}. The primary pet stays at the top; others are sorted by recent interaction, memory, and update time. After switching, the right panel loads that pet's full settings.`}
            />
          </PetToolbarCard>
        ) : null}

        {!selectedPet ? (
          <PetEmptyStateCard
            className='mt-8'
            title='No pets created yet'
            description='Create your first pet and this becomes your multi-pet management hub — view summaries, memory, and chat activity for each companion.'
            primaryAction={{ label: 'Create Your First Pet', href: '/create-pet' }}
          />
        ) : (
          <>
            <section className='mt-8 grid gap-4 md:grid-cols-2 xl:grid-cols-3'>
              {data.pets.map((pet, index) => {
                const active = pet.id === selectedPet.id;
                const isDefault = pet.id === data.defaultPetId;

                return (
                  <PetOverviewCard
                    key={pet.id}
                    href={`/pets?pet_id=${encodeURIComponent(pet.id)}`}
                    name={pet.name}
                    imageUrl={pet.image_url}
                    breed={pet.breed}
                    personality={pet.personality}
                    summary={pet.summary}
                    memoryCount={pet.memory_count}
                    conversationCount={pet.conversation_count}
                    lastChatText={formatDate(pet.last_chat_at)}
                    primary={isDefault}
                    selected={active}
                    order={index + 1}
                  />
                );
              })}
            </section>

            <section className='mt-8 grid gap-5 lg:grid-cols-[360px_1fr]'>
              <aside className='glass-card p-6'>
                <PetSidebarProfileCard
                  name={selectedPet.name}
                  imageUrl={selectedPet.image_url}
                  subtitle={`${selectedPet.breed || 'Breed not set'} · ${selectedPet.personality || 'Personality not set'}`}
                  primary={data.defaultPetId === selectedPet.id}
                  primaryLabelMode='detailed'
                  orderHintText={`Ordering: ${selectedPet.id === data.defaultPetId ? 'Primary pet — fixed at top' : 'Sorted by recent activity'}`}
                  sections={[
                    {
                      title: 'Lifestyle Info',
                      content: (
                        <>
                          <strong>Loves:</strong> {selectedPet.favorite_food || 'Not set yet'}
                          <br />
                          <strong>Habit:</strong> {selectedPet.daily_habits || 'Not set yet'}
                        </>
                      ),
                    },
                    {
                      title: 'Companionship Summary',
                      content: <div className='whitespace-pre-line'>{selectedPet.summary}</div>,
                      contentClassName: 'mt-2 whitespace-pre-line text-sm leading-7 text-slate-700',
                    },
                  ]}
                  metrics={[
                    { label: 'Memories', value: selectedPet.memory_count },
                    { label: 'Chats', value: selectedPet.conversation_count },
                    { label: 'Sort Position', value: <PetOrderHint isPrimary={selectedPet.id === data.defaultPetId} className='text-sm font-semibold text-slate-700' />, valueClassName: 'mt-2 text-sm font-semibold text-slate-700' },
                    { label: 'Created', value: formatDate(selectedPet.created_at), valueClassName: 'mt-2 text-sm font-semibold text-slate-700' },
                    { label: 'Last Chat', value: formatDate(selectedPet.last_chat_at), valueClassName: 'mt-2 text-sm font-semibold text-slate-700' },
                  ]}
                  footer={
                    <PetActionPanel
                      items={[
                        {
                          key: 'chat',
                          label: 'Start chat with this pet',
                          href: `/chat?pet_id=${encodeURIComponent(selectedPet.id)}`,
                          variant: 'primary',
                        },
                        {
                          key: 'memory',
                          label: 'View this pet memory',
                          href: `/memories?pet_id=${encodeURIComponent(selectedPet.id)}`,
                          variant: 'secondary',
                        },
                        data.defaultPetId !== selectedPet.id
                          ? {
                              key: 'set-default',
                              node: (
                                <form action={setDefaultPetAction}>
                                  <input type='hidden' name='petId' value={selectedPet.id} />
                                  <button className='subtle-button w-full'>Set as Primary Pet</button>
                                </form>
                              ),
                            }
                          : {
                              key: 'default-active',
                              node: <PetNoticeBanner tone='success'>This is your primary pet — it stays fixed at the top.</PetNoticeBanner>,
                            },
                        {
                          key: 'tips',
                          node: (
                            <div className='rounded-[24px] border border-black/5 bg-white p-5'>
                              <h3 className='text-base font-extrabold'>Management Tips</h3>
                              <ul className='mt-3 grid gap-2 text-sm leading-7 text-muted'>
                                <li>• The primary pet becomes the default chat target when no pet_id is specified, and stays fixed at the top of the manager.</li>
                                <li>• Updating personality, habits, and preferences syncs to the prompt for all future conversations.</li>
                                <li>• Deleting a pet also removes its chat history and memories.</li>
                              </ul>
                            </div>
                          ),
                        },
                      ]}
                    />
                  }
                />
              </aside>

              <div className='grid gap-6'>
                <PetEditFormCard
                  title='Edit Pet Profile'
                  description='Change name, breed, personality, preferences, and habits. You can also upload a new avatar. If you skip the image, the current photo stays. These changes sync directly to the chat character settings.'
                  action={updatePetAction}
                  hiddenFields={<input type='hidden' name='petId' value={selectedPet.id} />}
                  fields={
                    <>
                      <label className='grid gap-2 text-sm font-bold'>
                        Name
                        <input className='input-shell' name='name' type='text' required maxLength={30} defaultValue={selectedPet.name} />
                      </label>

                      <label className='grid gap-2 text-sm font-bold'>
                        Breed
                        <PetBreedSelect defaultValue={selectedPet.breed || 'Other'} />
                      </label>

                      <label className='grid gap-2 text-sm font-bold'>
                        Personality
                        <input className='input-shell' name='personality' type='text' required maxLength={120} defaultValue={selectedPet.personality || ''} />
                      </label>

                      <label className='grid gap-2 text-sm font-bold'>
                        Favorite Food
                        <input className='input-shell' name='favoriteFood' type='text' maxLength={120} defaultValue={selectedPet.favorite_food || ''} />
                      </label>

                      <label className='grid gap-2 text-sm font-bold'>
                        Daily Habits
                        <textarea className='input-shell min-h-[120px]' name='dailyHabits' maxLength={500} defaultValue={selectedPet.daily_habits || ''} />
                      </label>

                      <label className='grid gap-2 text-sm font-bold'>
                        Change Photo
                        <div className='rounded-[22px] border border-dashed border-orange-300 bg-gradient-to-b from-orange-50 to-amber-50 px-6 py-6 text-center text-amber-900'>
                          <div className='text-3xl'>🖼️</div>
                          <p className='mt-3 text-sm font-bold'>Leave empty to keep current photo. Upload a new one to replace the avatar.</p>
                          <p className='mt-1 text-xs font-normal text-muted'>Supports JPG / PNG / WebP, max 5MB</p>
                          <input className='input-shell mt-4' name='image' type='file' accept='image/png,image/jpeg,image/webp' />
                        </div>
                      </label>
                    </>
                  }
                  footer={
                    <div className='grid gap-3 md:grid-cols-2'>
                      <FormSubmitButton pendingLabel='Updating pet info...'>Save Changes</FormSubmitButton>
                      <Link href={`/chat?pet_id=${encodeURIComponent(selectedPet.id)}`} className='subtle-button text-center'>
                        Preview Chat
                      </Link>
                    </div>
                  }
                />

                <PetDangerZoneCard
                  description='After deletion, this pet chat history, summary, and related memories will all be removed. If this was the primary pet, the system will automatically use another remaining pet as the new primary. If there is no remaining pet, the default will be cleared.'
                  action={deletePetAction}
                  hiddenFields={<input type='hidden' name='petId' value={selectedPet.id} />}
                  buttonLabel='Delete This Pet'
                />
              </div>
            </section>
          </>
        )}
      </main>

      <SiteFooter rightText='Pet Overview / Primary Pet Sort / Save Toast / Quick Switching' />
    </>
  );
}