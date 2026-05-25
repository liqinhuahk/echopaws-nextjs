import { redirect } from 'next/navigation';
import { deleteMemoryAction, refreshMemorySummariesAction } from '@/app/actions/memories';
import { PetEmptyStateCard, PetMemoryListCard, PetMemorySummaryCard, PetNoticeBanner, PetPageHeroCard, PetStatsGrid, PetSummaryWorkspaceCard, PetToolbarCard } from '@/components/pet-cards';
import { PetSwitcher } from '@/components/pet-switcher';
import { PrimaryPetBadge } from '@/components/pet-ui-badges';
import { SiteFooter } from '@/components/site-footer';
import { SiteHeader } from '@/components/site-header';
import { getMemoryManagerData } from '@/lib/memory-service';
import { getPetsForUser } from '@/lib/pets';
import { createServerSupabaseClient, hasSupabaseEnv } from '@/lib/supabase/server';

function formatDate(value: string | null) {
  if (!value) return 'Just now';
  return new Intl.DateTimeFormat('en-US', {
    year: 'numeric',
    month: '2-digit',
    day: '2-digit',
    hour: '2-digit',
    minute: '2-digit',
  }).format(new Date(value));
}

const typeLabel: Record<string, string> = {
  profile: 'Owner Profile',
  fact: 'Recent Events',
  emotion: 'Emotional Clues',
  preference: 'Interaction Preferences',
};

export default async function MemoriesPage({
  searchParams,
}: {
  searchParams?: { message?: string; error?: string; pet_id?: string };
}) {
  if (!hasSupabaseEnv()) {
    redirect('/login?error=Please%20configure%20Supabase%20environment%20variables%20first.');
  }

  const supabase = createServerSupabaseClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();

  if (!user) {
    redirect('/login?message=Please%20sign%20in%20first%20to%20view%20memories.');
  }

  const selectedPetId = searchParams?.pet_id || null;
  const [data, petsData] = await Promise.all([getMemoryManagerData(user.id, selectedPetId), getPetsForUser(user.id)]);
  const memoryCount = data.memories.length;
  const summaryCount = data.summaries.length;
  const emotionCount = data.memories.filter((item) => item.type === 'emotion').length;
  const importantCount = data.memories.filter((item) => item.importance >= 4).length;
  const selectedPetName = data.selectedPet?.name || 'All Pets';
  const primaryPetId = petsData.defaultPetId;
  const petOrderMap = new Map(petsData.pets.map((pet, index) => [pet.id, index]));
  const orderedSummaries = [...data.summaries].sort((a, b) => (petOrderMap.get(a.petId) ?? 999) - (petOrderMap.get(b.petId) ?? 999));
  const orderedMemories = [...data.memories].sort((a, b) => {
    const orderA = a.petId ? (petOrderMap.get(a.petId) ?? 998) : 999;
    const orderB = b.petId ? (petOrderMap.get(b.petId) ?? 998) : 999;
    if (orderA !== orderB) return orderA - orderB;
    if (b.importance !== a.importance) return b.importance - a.importance;
    return new Date(b.updatedAt || 0).getTime() - new Date(a.updatedAt || 0).getTime();
  });

  return (
    <>
      <SiteHeader ctaLabel='Back to Chat' ctaHref={selectedPetId ? `/chat?pet_id=${encodeURIComponent(selectedPetId)}` : '/chat'} />
      <main className='container-shell py-10'>
        <PetPageHeroCard
          eyebrow='Memory Center'
          title='EchoPaws Memory Manager'
          description='Now with multi-pet switching. View all pet memories, or switch to a single pet to focus on its summary and long-term memory only.'
          notice={searchParams?.message || searchParams?.error ? (
            <>
              {searchParams?.message ? <PetNoticeBanner tone='success'>{searchParams.message}</PetNoticeBanner> : null}
              {searchParams?.error ? <PetNoticeBanner tone='error' className='mt-3'>{searchParams.error}</PetNoticeBanner> : null}
            </>
          ) : null}
        />

        {data.pets.length ? (
          <PetToolbarCard className='mt-8'>
            <PetSwitcher
              pets={petsData.pets.map((pet) => ({ id: pet.id, name: pet.name, imageUrl: pet.image_url || null, isPrimary: pet.id === petsData.defaultPetId }))}
              selectedPetId={selectedPetId}
              basePath='/memories'
              title='Switch Memory View'
              description='Primary pet is fixed at the top; others sorted by recent activity. Switching to a single pet shows that pet summary plus global memories.'
              includeAllOption
              allLabel='All Pets'
            />
          </PetToolbarCard>
        ) : null}

        <PetStatsGrid
          className='mt-8'
          columnsClassName='md:grid-cols-2 xl:grid-cols-4'
          items={[
            { label: 'Current View', value: selectedPetName, valueClassName: 'mt-3 text-2xl font-extrabold tracking-tight' },
            { label: 'Memories', value: memoryCount },
            { label: 'Summaries', value: summaryCount },
            { label: 'Emotion / High Priority', value: `${emotionCount} / ${importantCount}` },
          ]}
        />

        <section className='mt-8 grid gap-5 lg:grid-cols-[1.05fr_.95fr]'>
          <PetSummaryWorkspaceCard
            title='Companionship Summaries'
            description='After each chat, the system auto-compresses, deduplicates, and updates summaries — so prompts can remember more with less context.'
            action={
              <form action={refreshMemorySummariesAction}>
                {selectedPetId ? <input type='hidden' name='petId' value={selectedPetId} /> : null}
                <button className='subtle-button'>{selectedPetId ? `Update ${selectedPetName} Summary` : 'Refresh All Summaries'}</button>
              </form>
            }
          >
            <div className='grid gap-4'>
              {data.summaries.length ? (
                orderedSummaries.map((summary) => (
                  <PetMemorySummaryCard
                    key={summary.petId}
                    name={summary.petName}
                    imageUrl={summary.petImageUrl}
                    summary={summary.summary}
                    memoryCount={summary.memoryCount}
                    updatedAtText={formatDate(summary.updatedAt)}
                    primary={summary.petId === primaryPetId}
                  />
                ))
              ) : (
                <PetEmptyStateCard
                  className='bg-white'
                  title='No memory summaries yet'
                  description='Go back to chat and interact for a few rounds — the system will auto-generate summaries.'
                  primaryAction={{ label: 'Back to Chat', href: selectedPetId ? `/chat?pet_id=${encodeURIComponent(selectedPetId)}` : '/chat' }}
                />
              )}
            </div>
          </PetSummaryWorkspaceCard>

          <PetSummaryWorkspaceCard
            title='Memory List'
            description='You can delete content you do not want retained. If you are currently viewing a single pet, the list prioritizes that pet and global memories.'
          >
            <PetMemoryListCard
              className='border-none bg-transparent p-0'
              items={orderedMemories.map((memory) => ({
                key: memory.id,
                badges: (
                  <>
                    <span className='rounded-full bg-orange-50 px-3 py-1 text-xs font-bold text-orange-900'>{typeLabel[memory.type] || memory.type}</span>
                    <span className='rounded-full bg-slate-100 px-3 py-1 text-xs font-semibold text-slate-700'>{memory.petName}</span>
                    <PrimaryPetBadge show={Boolean(memory.petId && memory.petId === primaryPetId)} size='md' />
                    <span className='rounded-full bg-amber-100 px-3 py-1 text-xs font-semibold text-amber-900'>Priority {memory.importance}</span>
                  </>
                ),
                content: memory.content,
                meta: `Last updated: ${formatDate(memory.updatedAt)}`,
                action: (
                  <form action={deleteMemoryAction}>
                    <input type='hidden' name='memoryId' value={memory.id} />
                    {selectedPetId ? <input type='hidden' name='petId' value={selectedPetId} /> : null}
                    <button className='rounded-full border border-rose-200 px-3 py-2 text-xs font-bold text-rose-700 transition hover:bg-rose-50'>Delete</button>
                  </form>
                ),
                className: 'bg-white',
              }))}
              emptyState={<PetNoticeBanner tone='warning'>No memories to manage yet. Go to chat and interact with your pet.</PetNoticeBanner>}
            />
          </PetSummaryWorkspaceCard>
        </section>
      </main>
      <SiteFooter rightText='Primary Pet Badge / Primary Pet Sort / Multi-Pet Memory Switch / Memory List Unified' />
    </>
  );
}