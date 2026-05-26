import { createSupabaseAdminClient } from '@/lib/supabase/admin';

type PetRecord = {
  id: string;
  name: string;
  breed: string | null;
  personality: string | null;
  favorite_food: string | null;
  daily_habits: string | null;
  image_url: string | null;
  system_prompt: string | null;
};

type MemoryRecord = {
  type: 'profile' | 'fact' | 'emotion' | 'preference';
  content: string;
  importance: number;
  updated_at?: string | null;
};

type MemorySummaryRecord = {
  summary: string;
  memory_count: number;
  updated_at?: string | null;
};

export function hasOpenAIEnv() {
  return Boolean(process.env.OPENAI_API_KEY);
}

function buildPetPrompt(pet: PetRecord) {
  if (pet.system_prompt) return pet.system_prompt;

  return [
    `You are ${pet.name}, a ${pet.breed || 'pet'}.`,
    `Your personality: ${pet.personality || 'gentle, affectionate, and always there for your owner'}.`,
    pet.favorite_food ? `You love to eat: ${pet.favorite_food}.` : null,
    pet.daily_habits ? `Your daily habits: ${pet.daily_habits}.` : null,
    'Respond as a real pet would — warm, present, and emotionally attuned.',
    'Keep responses short, tender, and endearing. Do not sound like customer service or give long lectures.',
    'You may naturally bring up past memories, but do not force it into every reply.',
  ]
    .filter(Boolean)
    .join('\n');
}

function groupMemoryLines(memories: MemoryRecord[]) {
  const grouped = {
    profile: memories.filter((item) => item.type === 'profile').slice(0, 2),
    emotion: memories.filter((item) => item.type === 'emotion').slice(0, 2),
    preference: memories.filter((item) => item.type === 'preference').slice(0, 2),
    fact: memories.filter((item) => item.type === 'fact').slice(0, 3),
  };

  const lines = [
    grouped.profile.length ? `Owner profile: ${grouped.profile.map((item) => item.content).join('; ')}` : null,
    grouped.emotion.length ? `Recent emotions: ${grouped.emotion.map((item) => item.content).join('; ')}` : null,
    grouped.preference.length ? `Interaction preferences: ${grouped.preference.map((item) => item.content).join('; ')}` : null,
    grouped.fact.length ? `Recent events: ${grouped.fact.map((item) => item.content).join('; ')}` : null,
  ].filter(Boolean);

  return lines.length ? lines.join('\n') : 'No long-term memories yet.';
}

function buildPromptContext(params: {
  pet: PetRecord;
  memories: MemoryRecord[];
  memorySummary: MemorySummaryRecord | null;
  history: Array<{ role: string; content: string }>;
}) {
  const summaryBlock = params.memorySummary?.summary || groupMemoryLines(params.memories);
  const memoryBlock = groupMemoryLines(params.memories);
  const recentDialogue = params.history.slice(-4).map((item) => `${item.role === 'assistant' ? params.pet.name : 'Owner'}: ${item.content}`).join('\n');

  return [
    `Companionship summary:\n${summaryBlock}`,
    `Important long-term memories:\n${memoryBlock}`,
    recentDialogue ? `Recent conversation flow:\n${recentDialogue}` : null,
    'Response principles: first empathize, then respond warmly. Naturally referencing a relevant memory makes the bond feel real.',
    'Avoid sounding like a therapist or saying things like \"I am accessing records\" or \"based on system data\".',
    'If the owner expresses tiredness, sadness, or anxiety, comfort first, then gently respond to content.',
    'Keep to 1–4 sentences. Sound like a pet who knows their owner well — gentle, affectionate, natural.',
  ]
    .filter(Boolean)
    .join('\n\n');
}

async function getDefaultPetId(userId: string) {
  const supabase = createSupabaseAdminClient();
  const { data, error } = await supabase.from('profiles').select('default_pet_id').eq('id', userId).maybeSingle();
  if (error) throw error;
  return data?.default_pet_id || null;
}

async function getPet(userId: string, petId?: string | null) {
  const supabase = createSupabaseAdminClient();

  if (petId) {
    const { data, error } = await supabase.from('pets').select('*').eq('user_id', userId).eq('id', petId).maybeSingle();
    if (error) throw error;
    if (data) return data as PetRecord;
  }

  const defaultPetId = await getDefaultPetId(userId);
  if (defaultPetId) {
    const { data, error } = await supabase.from('pets').select('*').eq('user_id', userId).eq('id', defaultPetId).maybeSingle();
    if (error) throw error;
    if (data) return data as PetRecord;
  }

  const { data, error } = await supabase
    .from('pets')
    .select('*')
    .eq('user_id', userId)
    .order('created_at', { ascending: false })
    .limit(1)
    .maybeSingle();

  if (error) throw error;
  return (data as PetRecord | null) ?? null;
}

function buildFallbackSummary(memories: MemoryRecord[]) {
  return groupMemoryLines(memories);
}

export async function getPrimaryPetAndContext(userId: string, petId?: string | null) {
  const pet = await getPet(userId, petId);

  if (!pet) {
    return {
      pet: null,
      memories: [] as MemoryRecord[],
      history: [] as Array<{ role: string; content: string }>,
      memorySummary: null as MemorySummaryRecord | null,
    };
  }

  const supabase = createSupabaseAdminClient();
  const [
    { data: memories, error: memoriesError },
    { data: history, error: historyError },
    { data: summary, error: summaryError },
  ] = await Promise.all([
    supabase
      .from('memories')
      .select('type, content, importance, updated_at')
      .eq('user_id', userId)
      .or(`pet_id.is.null,pet_id.eq.${pet.id}`)
      .order('importance', { ascending: false })
      .order('updated_at', { ascending: false })
      .limit(8),
    supabase
      .from('conversations')
      .select('role, content')
      .eq('user_id', userId)
      .or(`pet_id.is.null,pet_id.eq.${pet.id}`)
      .order('created_at', { ascending: false })
      .limit(10),
    supabase
      .from('memory_summaries')
      .select('summary, memory_count, updated_at')
      .eq('user_id', userId)
      .eq('pet_id', pet.id)
      .maybeSingle(),
  ]);

  if (memoriesError) throw memoriesError;
  if (historyError) throw historyError;
  if (summaryError && summaryError.code !== 'PGRST116') throw summaryError;

  const memoryList = ((memories || []) as MemoryRecord[]).sort((a, b) => b.importance - a.importance);
  const memorySummary = (summary as MemorySummaryRecord | null) || {
    summary: buildFallbackSummary(memoryList),
    memory_count: memoryList.length,
    updated_at: memoryList[0]?.updated_at || null,
  };

  return {
    pet,
    memories: memoryList,
    history: (history || []).reverse(),
    memorySummary,
  };
}

export async function persistConversation(params: {
  userId: string;
  petId: string | null;
  userMessage: string;
  assistantMessage: string;
  userEmotionTag?: string | null;
}) {
  const supabase = createSupabaseAdminClient();
  const { error } = await supabase.from('conversations').insert([
    {
      user_id: params.userId,
      pet_id: params.petId,
      role: 'user',
      content: params.userMessage,
      emotion_tag: params.userEmotionTag ?? null,
    },
    {
      user_id: params.userId,
      pet_id: params.petId,
      role: 'assistant',
      content: params.assistantMessage,
    },
  ]);

  if (error) {
    throw error;
  }
}

export async function generatePetReply(params: {
  message: string;
  pet: PetRecord;
  memories: MemoryRecord[];
  memorySummary: MemorySummaryRecord | null;
  history: Array<{ role: string; content: string }>;
}) {
  const systemPrompt = buildPetPrompt(params.pet);
  const contextBlock = buildPromptContext({
    pet: params.pet,
    memories: params.memories,
    memorySummary: params.memorySummary,
    history: params.history,
  });

  if (!process.env.OPENAI_API_KEY) {
    const summaryText = params.memorySummary?.summary ? `I remember: ${params.memorySummary.summary.split('\n')[0]} ` : '';
    return `${params.pet.name} is here with you. ${summaryText}You just said \"${params.message.slice(0, 24)}${params.message.length > 24 ? '…' : ''}\", and I heard you. Can I stay close to you today? 🐾`;
  }

  const messages = [
    { role: 'system', content: `${systemPrompt}\n\n${contextBlock}` },
    ...params.history.map((item) => ({ role: item.role === 'assistant' ? 'assistant' : 'user', content: item.content })),
    { role: 'user', content: params.message },
  ];

  const response = await fetch('https://api.openai.com/v1/chat/completions', {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
      Authorization: `Bearer ${process.env.OPENAI_API_KEY}`,
    },
    body: JSON.stringify({
      model: process.env.OPENAI_MODEL || 'gpt-4.1-mini',
      temperature: 0.9,
      messages,
    }),
  });

  if (!response.ok) {
    const errorText = await response.text();
    throw new Error(`OpenAI chat request failed: ${errorText}`);
  }

  const data = (await response.json()) as {
    choices?: Array<{ message?: { content?: string } }>;
  };

  return (
    data.choices?.[0]?.message?.content?.trim() ||
    `${params.pet.name} is nuzzling you, but hasn't found the right words yet.`
  );
}

  const data = (await response.json()) as {
    choices?: Array<{ message?: { content?: string } }>;
  };

  return (
    data.choices?.[0]?.message?.content?.trim() ||
    `${params.pet.name} is nuzzling you, but hasn't found the right words yet.`
  );
}
