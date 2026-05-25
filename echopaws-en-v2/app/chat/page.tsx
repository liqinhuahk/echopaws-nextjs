import Link from 'next/link';
import { PetChatContextCard, PetEmptyStateCard, PetMemoryListCard, PetNoticeBanner, PetPageHeroCard, PetSidebarProfileCard, PetToolbarCard } from '@/components/pet-cards';
import { ChatPlayground } from '@/components/chat-playground';
import { PetSwitcher } from '@/components/pet-switcher';
import { getPetOrderDescription } from '@/components/pet-ui-badges';
import { SiteFooter } from '@/components/site-footer';
import { SiteHeader } from '@/components/site-header';
import { getChatAccessState } from '@/lib/chat-access';
import { getPrimaryPetAndContext } from '@/lib/chat-service';
import { getPetsForUser } from '@/lib/pets';
import { createServerSupabaseClient, hasSupabaseEnv } from '@/lib/supabase/server';

const fallbackMessages = [
  { role: 'user' as const, content: 'Hey Max! What did you do today?' },
  { role: 'assistant' as const, content: 'I waited for you by the window again today. You seemed tired yesterday — I hope you can rest a bit sooner today 🐶' },
  { role: 'user' as const, content: 'I am feeling a little down today.' },
  { role: 'assistant' as const, content: 'Then let me just stay close to you for a while. You always handle things on your own, and I remember that — so today I want to hold you a little tighter.' },
];

type PetCard = {
  id: string;
  name: string;
  imageUrl: string | null;
  isPrimary?: boolean;
};

export default async function ChatPage({
  searchParams,
}: {
  searchParams?: { pet_created?: string; pet_name?: string; pet_id?: string };
}) {
  const selectedPetId = searchParams?.pet_id || null;

  let petId: string | null = selectedPetId;
  let petName = 'Max';
  let petBreed = 'Shiba Inu';
  let petPersonality = 'Playful · Clingy · Afraid of thunder';
  let favoriteFood = 'Chicken breast';
  let dailyHabit = 'Waiting for you at the door';
  let petImageUrl: string | null = null;
  let memorySummary = 'Owner is Alex. Likes bedtime chats. Has been a bit tired lately at work.';
  let emotionSummary = 'Last 3 days: a bit tired. Needs more comforting responses.';
  let usageLabel = '10 / 10 remaining today';
  let usageDetail = 'Free tier: 10 conversations per day';
  let vipHint = 'VIP unlocks unlimited chat, voice companion, and deeper long-term memory.';
  let initialMessages = fallbackMessages;
  let hasPet = false;
  let visibleMemories: Array<{ type: string; content: string }> = [];
  let pets: PetCard[] = [];
  let selectedPetIsPrimary = false;
  let selectedPetOrderLabel = getPetOrderDescription(false);

  if (hasSupabaseEnv()) {
    try {
      const supabase = createServerSupabaseClient();
      const {
        data: { user },
      } = await supabase.auth.getUser();

      if (user) {
        const [petsData, accessState, context] = await Promise.all([
          getPetsForUser(user.id),
          getChatAccessState(user.id),
          getPrimaryPetAndContext(user.id, selectedPetId),
        ]);

        pets = petsData.pets.map((pet) => ({
          id: pet.id,
          name: pet.name,
          imageUrl: pet.image_url || null,
          isPrimary: pet.id === petsData.defaultPetId,
        }));

        if (context.pet) {
          hasPet = true;
          petId = context.pet.id;
          petName = context.pet.name || petName;
          petBreed = context.pet.breed || petBreed;
          petPersonality = context.pet.personality || petPersonality;
          favoriteFood = context.pet.favorite_food || favoriteFood;
          dailyHabit = context.pet.daily_habits || dailyHabit;
          petImageUrl = context.pet.image_url || null;

          const selectedPetMeta = pets.find((pet) => pet.id === context.pet?.id);
          selectedPetIsPrimary = Boolean(selectedPetMeta?.isPrimary);
          selectedPetOrderLabel = getPetOrderDescription(selectedPetIsPrimary);
        }

        visibleMemories = context.memories.slice(0, 4).map((item) => ({ type: item.type, content: item.content }));

        if (context.memorySummary?.summary) {
          memorySummary = context.memorySummary.summary;
        } else if (context.memories.length > 0) {
          memorySummary = context.memories.map((item) => item.content).slice(0, 2).join('. ');
        }

        const emotionMemory = context.memories.find((item) => item.type === 'emotion');
        if (emotionMemory?.content) {
          emotionSummary = emotionMemory.content;
        }

        if (context.history.length > 0) {
          initialMessages = context.history
            .filter((item) => item.role === 'user' || item.role === 'assistant')
            .map((item) => ({
              role: item.role === 'assistant' ? 'assistant' : 'user',
              content: item.content,
            }));
        }

        if (accessState.vip) {
          usageLabel = 'VIP — Unlimited Chat';
          usageDetail = 'VIP active: all pets have unlimited conversations.';
          vipHint = 'You are a VIP — none of your pets have daily message limits.';
        } else {
          usageLabel = `${accessState.remaining ?? 0} / ${accessState.limit ?? 10} remaining today`;
          usageDetail = `Used ${accessState.used} times today. Free tier: ${accessState.limit ?? 10} per day (shared across account).`;
        }
      }
    } catch {
      // Fallback to preview content when env or data are incomplete.
    }
  }

  return (
    <>
      <SiteHeader ctaLabel='Upgrade to VIP' ctaHref='/pricing' />
      <main className='container-shell py-10'>
        <PetPageHeroCard
          eyebrow='AI Pet Chat'
          title='It does not just answer you — it stays with you.'
          description='This version supports multi-pet switching. You can switch between pets on the same account. Each pet has its own profile, chat history, companionship summary, and long-term memory.'
          notice={searchParams?.pet_created === '1' ? (
            <PetNoticeBanner tone='success'>
              {searchParams.pet_name ? `Pet ${searchParams.pet_name} created. You can start chatting now.` : 'Pet created. You can start chatting now.'}
            </PetNoticeBanner>
          ) : null}
        />

        {pets.length > 0 ? (
          <PetToolbarCard className='mt-8'>
            <PetSwitcher
              pets={pets}
              selectedPetId={petId}
              basePath='/chat'
              title='Switch Chat Pet'
              description={`You have ${pets.length} pet${pets.length !== 1 ? 's' : ''}. The primary pet stays at the top; others are ordered by recent activity. Switching loads that pet's own chat context and memory.`}
            />
          </PetToolbarCard>
        ) : null}

        {!hasPet ? (
          <PetEmptyStateCard
            className='mt-8'
            title='No pet profile yet'
            description='Create your first pet to see a real avatar, breed, personality, preferences, and memory content. You can keep adding more pets and switch freely.'
            primaryAction={{ label: 'Create Your First Pet', href: '/create-pet' }}
          />
        ) : (
          <section className='grid gap-5 py-8 lg:grid-cols-[320px_1fr]'>
            <aside className='glass-card p-5'>
              <PetSidebarProfileCard
                name={petName}
                imageUrl={petImageUrl}
                subtitle={`${petBreed} · ${petPersonality}`}
                primary={selectedPetIsPrimary}
                placeholderEmoji='🐶'
                orderHintText={`Ordering: ${selectedPetOrderLabel}`}
                imageWrapperClassName='bg-gradient-to-br from-amber-200 to-orange-200'
                nameClassName='text-xl'
                subtitleClassName='text-xs'
                chips={
                  <>
                    <span className='tag-chip'>Loves: {favoriteFood}</span>
                    <span className='tag-chip'>Habit: {dailyHabit}</span>
                  </>
                }
                sections={[
                  {
                    title: 'Pet Info',
                    content: (
                      <>
                        Name: {petName}
                        <br />
                        Breed: {petBreed}
                        <br />
                        Personality: {petPersonality}
                        <br />
                        Order: {selectedPetOrderLabel}
                      </>
                    ),
                    contentClassName: 'mt-2 text-sm leading-7 text-muted',
                  },
                  {
                    title: 'Companionship Summary',
                    action: (
                      <Link href={petId ? `/memories?pet_id=${encodeURIComponent(petId)}` : '/memories'} className='text-xs font-bold text-orange-700 hover:text-orange-900'>
                        Manage Memory →
                      </Link>
                    ),
                    content: memorySummary,
                    contentClassName: 'mt-2 whitespace-pre-line text-sm leading-7 text-muted',
                  },
                  {
                    title: 'Emotional State',
                    content: emotionSummary,
                    contentClassName: 'mt-2 text-sm leading-7 text-muted',
                  },
                  {
                    title: 'Chat Quota',
                    content: usageDetail,
                    contentClassName: 'mt-2 text-sm leading-7 text-muted',
                  },
                ]}
                footer={
                  <>
                    <PetMemoryListCard
                      title='Recent Active Memories'
                      items={visibleMemories.map((item, index) => ({
                        key: `${item.type}-${index}`,
                        badges: <span className='rounded-full bg-orange-100 px-3 py-1 text-xs font-bold text-orange-900'>{item.type}</span>,
                        content: item.content,
                        className: 'bg-orange-50 border-none',
                      }))}
                      emptyState={<div className='text-sm leading-7 text-muted'>No active memories yet. Chat a few more times and the system will start building companionship context.</div>}
                    />
                    <PetNoticeBanner tone='warning'>{vipHint}</PetNoticeBanner>
                  </>
                }
              />
            </aside>

            <PetChatContextCard
              title={<>Chat with {petName}</>}
              description={`You are seeing ${petName}'s dedicated chat context. Switching to another pet will also switch the conversation history and memory summary.`}
              badge={<div className='rounded-full bg-orange-50 px-4 py-2 text-xs font-bold text-orange-800'>{usageLabel}</div>}
              chatNode={
                <ChatPlayground
                  petId={petId}
                  initialMessages={initialMessages}
                  initialRemainingLabel={usageLabel}
                  initialMemorySummary={memorySummary}
                />
              }
            />
          </section>
        )}
      </main>
      <SiteFooter rightText='Primary Pet Badge / Primary Pet Priority Sort / Multi-Pet Switching / Memory Hints' />
    </>
  );
}