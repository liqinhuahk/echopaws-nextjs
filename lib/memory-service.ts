import { createSupabaseAdminClient } from '@/lib/supabase/admin';

type MemoryType = 'profile' | 'fact' | 'emotion' | 'preference';

type MemoryCandidate = {
  type: MemoryType;
  content: string;
  importance: number;
};import { createSupabaseAdminClient } from '@/lib/supabase/admin';

type MemoryType = 'profile' | 'fact' | 'emotion' | 'preference';

type MemoryCandidate = {
  type: MemoryType;
  content: string;
  importance: number;
};

type MemoryRow = {
  id: string;
  user_id: string;
  pet_id: string | null;
  type: MemoryType;
  content: string;
  importance: number;
  created_at?: string | null;
  updated_at?: string | null;
  last_used_at?: string | null;
};

type MemorySummaryRow = {
  id?: string;
  user_id?: string;
  pet_id: string;
  summary: string;
  memory_count: number;
  updated_at?: string | null;
};

type MemoryManagerItem = {
  id: string;
  petId: string | null;
  petName: string;
  petImageUrl: string | null;
  type: MemoryType;
  content: string;
  importance: number;
  updatedAt: string | null;
};

type MemoryManagerSummary = {
  petId: string;
  petName: string;
  petImageUrl: string | null;
  summary: string;
  memoryCount: number;
  updatedAt: string | null;
};

function normalizeText(value: string) {
  return value.replace(/\n+/g, ' ').trim();
}

function normalizeForComparison(value: string) {
  return normalizeText(value)
    .replace(/[.!?,，,、;;:::@#$%^&*()（）]/g, '')
    .toLowerCase();
}

function clampImportance(value: number) {
  return Math.max(1, Math.min(5, Math.round(value)));
}

export function inferEmotionTag(message: string) {
  const text = message.toLowerCase();

  if (
    /(unhappy|sad|upset|down|depressed|heartbroken|low|melancholy|gloomy)/
      .test(text)
  )
    return 'sad';
  if (/(tired|exhausted|wiped|beat|need sleep|so sleepy|fatigued)/.test(text))
    return 'tired';
  if (
    /(anxious|nervous|worried|tense|stressed|overwhelmed|panic)/.test(text)
  )
    return 'anxious';
  if (
    /(pressure|stress|annoyed|frustrated|irritated|burned out)/.test(text)
  )
    return 'stressed';
  if (/(happy|joy|excited|glad|cheerful|wonderful|amazing)/.test(text))
    return 'happy';
  if (/(angry|mad|furious|annoyed|frustrated|hate it)/.test(text))
    return 'angry';
  if (/(lonely|alone|miss you|wish someone was here|need company)/.test(text))
    return 'lonely';

  return null;
}

function heuristicCandidates(message: string): MemoryCandidate[] {
  const text = normalizeText(message);
  const candidates: MemoryCandidate[] = [];

  const emotionTag = inferEmotionTag(text);
  if (emotionTag === 'sad') {
    candidates.push({
      type: 'emotion',
      content:
        'The owner has been feeling down lately and needs gentle comfort.',
      importance: 5,
    });
  }
  if (emotionTag === 'tired') {
    candidates.push({
      type: 'emotion',
      content:
        'The owner has been tired recently and may need companionship and reminders to rest.',
      importance: 4,
    });
  }
  if (emotionTag === 'anxious' || emotionTag === 'stressed') {
    candidates.push({
      type: 'emotion',
      content:
        'The owner has been under pressure or anxious and needs reassurance.',
      importance: 5,
    });
  }
  if (emotionTag === 'happy') {
    candidates.push({
      type: 'emotion',
      content:
        'The owner has been in a good mood lately, a lively and cheerful interaction style is appropriate.',
      importance: 3,
    });
  }

  const nameMatch = text.match(
    /my name is ([a-zA-Z\u4e00-\u9fa5][a-zA-Z0-9\u4e00-\u9fa5_]{0,12})/i
  );
  if (nameMatch) {
    candidates.push({
      type: 'profile',
      content: `The owner's name is ${nameMatch[1]}.`,
      importance: 5,
    });
  }

  const likeMatch = text.match(/i(?: really)? like (.{1,32})/i);
  if (likeMatch) {
    candidates.push({
      type: 'preference',
      content: `The owner likes ${normalizeText(likeMatch[1]).replace(
        /[.!?,]+$/,
        ''
      )}.`,
      importance: 4,
    });
  }

  const fearMatch = text.match(/i(?:'m)? (?:a little )?afraid of (.{1,32})/i);
  if (fearMatch) {
    candidates.push({
      type: 'fact',
      content: `The owner is afraid of ${normalizeText(fearMatch[1]).replace(
        /[.!?,]+$/,
        ''
      )}.`,
      importance: 4,
    });
  }

  if (
    /(at night|before bed|bedtime|evening).*(chat|talk|company|with me)/i.test(
      text
    ) ||
    /(chat|talk|company|with me).*(night|bed|evening)/i.test(text)
  ) {
    candidates.push({
      type: 'preference',
      content:
        'The owner likes to have company and chat at night or before bed.',
      importance: 4,
    });
  }

  if (
    /(tomorrow|today|next week|this weekend).*(exam|test|interview|meeting|moving|travel|conference|presentation)/i.test(
      text
    )
  ) {
    const trimmed = text.replace(/[.!?,]+$/, '');
    candidates.push({
      type: 'fact',
      content: `The owner mentioned a near-term event: ${trimmed}.`,
      importance: 4,
    });
  }

  return compressCandidates(candidates).slice(0, 4);
}

function compressCandidates(candidates: MemoryCandidate[]) {
  const map = new Map<string, MemoryCandidate>();

  for (const candidate of candidates) {
    const content = normalizeText(candidate.content);
    if (!content) continue;

    const key = `${candidate.type}:${normalizeForComparison(content)}`;
    const previous = map.get(key);

    if (
      !previous ||
      previous.importance < candidate.importance ||
      previous.content.length < content.length
    ) {
      map.set(key, {
        type: candidate.type,
        content,
        importance: clampImportance(candidate.importance),
      });
    }
  }

  return Array.from(map.values()).sort(
    (a, b) =>
      b.importance - a.importance || a.content.length - b.content.length
  );
}

// Call Gemini API for memory extraction
async function callGemini(prompt: string, systemInstruction?: string) {
  const model = process.env.GEMINI_MODEL || 'gemini-2.0-flash';
  const endpoint = `https://generativelanguage.googleapis.com/v1beta/models/${model}:generateContent`;

  const contents: Array<{ role?: string; parts: Array<{ text?: string }> }> = [];

  if (systemInstruction) {
    contents.push({
      role: 'user',
      parts: [{ text: systemInstruction }],
    });
  }

  contents.push({
    role: 'user',
    parts: [{ text: prompt }],
  });

  const response = await fetch(
    `${endpoint}?key=${process.env.GEMINI_API_KEY}`,
    {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({
        contents,
        generationConfig: {
          temperature: 0.3,
          maxOutputTokens: 1024,
        },
      }),
    }
  );

  if (!response.ok) {
    const errorText = await response.text();
    throw new Error(`Gemini API failed: ${errorText}`);
  }

  const data = (await response.json()) as {
    candidates?: Array<{
      content?: { parts?: Array<{ text?: string }> };
    }>;
  };

  return data.candidates?.[0]?.content?.parts?.[0]?.text?.trim() || '';
}

async function aiExtractCandidates(params: {
  userMessage: string;
  assistantMessage: string;
}): Promise<MemoryCandidate[]> {
  if (!process.env.GEMINI_API_KEY) {
    return heuristicCandidates(params.userMessage);
  }

  const systemInstruction =
    'You only output a JSON object, format: {\"memories\": [{\"type\": \"emotion\", \"content\": \"...\", \"importance\": 1-5}]}. Output nothing else.';

  const prompt = [
    'You are a memory extractor. From the following conversation, extract only memories that have long-term companionship value.',
    'Output must be a JSON object with format: {\"memories\": [{\"type\": \"...\", \"content\": \"...\", \"importance\": 1-5}]}.',
    'type must be one of: profile / fact / emotion / preference.',
    'content should be in English, concise, third-person, suitable for long-term storage.',
    'Avoid extracting one-off chitchat, greetings, or content without companionship value.',
    'If there is nothing worth remembering, output: {\"memories\": []}.',
    '',
    `User message: ${params.userMessage}`,
    `Pet reply: ${params.assistantMessage}`,
  ].join('\n');

  const raw = await callGemini(prompt, systemInstruction);

  try {
    const parsed = JSON.parse(raw) as {
      memories?: Array<{
        type?: string;
        content?: string;
        importance?: number;
      }>;
    };
    const memories = (parsed.memories || [])
      .filter((item) => item.type && item.content)
      .map((item) => ({
        type: (
          ['profile', 'fact', 'emotion', 'preference'].includes(item.type || '')
            ? item.type
            : 'fact'
        ) as MemoryType,
        content: normalizeText(item.content || ''),
        importance: clampImportance(Number(item.importance || 3)),
      }))
      .filter((item) => item.content.length > 0);

    return memories.length
      ? compressCandidates(memories).slice(0, 4)
      : heuristicCandidates(params.userMessage);
  } catch {
    return heuristicCandidates(params.userMessage);
  }
}

function buildHeuristicSummary(memories: MemoryRow[], petName?: string | null) {
  if (!memories.length) {
    return `${petName || 'This pet'} has not yet formed stable long-term memories.`;
  }

  const pick = (type: MemoryType, count = 2) =>
    memories
      .filter((item) => item.type === type)
      .slice(0, count)
      .map((item) => item.content);

  const profile = pick('profile', 1);
  const emotion = pick('emotion', 2);
  const preference = pick('preference', 2);
  const fact = pick('fact', 2);

  const lines = [
    profile.length ? `Owner profile: ${profile.join('; ')}` : null,
    emotion.length ? `Recent emotions: ${emotion.join('; ')}` : null,
    preference.length
      ? `Interaction preferences: ${preference.join('; ')}`
      : null,
    fact.length ? `Recent events: ${fact.join('; ')}` : null,
  ].filter(Boolean);

  return lines.join('\n');
}

async function aiBuildSummary(params: {
  memories: MemoryRow[];
  petName?: string | null;
}) {
  if (!process.env.GEMINI_API_KEY) {
    return buildHeuristicSummary(params.memories, params.petName);
  }

  const memoryList = params.memories
    .slice(0, 18)
    .map(
      (item) =>
        `- [${item.type}] ${item.content} (importance: ${item.importance})`
    )
    .join('\n');

  const prompt = [
    `Pet name: ${params.petName || 'Unnamed pet'}`,
    'Please summarize the following memories in 4 lines or fewer, in English, suitable for a long-term companionship prompt:',
    memoryList,
    '',
    'Priority: owner profile, recent emotions, interaction preferences, recent events.',
    'Do not use odd formatting. Do not mention databases, systems, or models.',
  ].join('\n');

  const systemInstruction =
    'You are a memory summarizer for a companionship AI. Output only the summary text, no explanation.';

  return normalizeText(
    (await callGemini(prompt, systemInstruction)) ||
      buildHeuristicSummary(params.memories, params.petName)
  );
}

async function fetchScopedMemories(userId: string, petId: string) {
  const supabase = createSupabaseAdminClient();
  const { data, error } = await supabase
    .from('memories')
    .select(
      'id, user_id, pet_id, type, content, importance, created_at, updated_at, last_used_at'
    )
    .eq('user_id', userId)
    .or(`pet_id.is.null,pet_id.eq.${petId}`)
    .order('importance', { ascending: false })
    .order('updated_at', { ascending: false })
    .limit(80);

  if (error) throw error;
  return (data || []) as MemoryRow[];
}

async function dedupeExistingMemories(memories: MemoryRow[]) {
  const grouped = new Map<string, MemoryRow[]>();

  for (const memory of memories) {
    const key = `${memory.type}:${normalizeForComparison(memory.content)}`;
    const rows = grouped.get(key) || [];
    rows.push(memory);
    grouped.set(key, rows);
  }

  const deleteIds: string[] = [];
  const kept: MemoryRow[] = [];

  for (const rows of grouped.values()) {
    const sorted = [...rows].sort((a, b) => {
      if (b.importance !== a.importance) return b.importance - a.importance;
      return (
        new Date(b.updated_at || b.created_at || 0).getTime() -
        new Date(a.updated_at || a.created_at || 0).getTime()
      );
    });

    kept.push(sorted[0]);
    if (sorted.length > 1) {
      deleteIds.push(...sorted.slice(1).map((item) => item.id));
    }
  }

  if (deleteIds.length) {
    const supabase = createSupabaseAdminClient();
    const { error } = await supabase
      .from('memories')
      .delete()
      .in('id', deleteIds);
    if (error) throw error;
  }

  return kept.sort(
    (a, b) =>
      b.importance - a.importance ||
      new Date(b.updated_at || b.created_at || 0).getTime() -
        new Date(a.updated_at || a.created_at || 0).getTime()
  );
}

export async function refreshMemorySummary(params: {
  userId: string;
  petId: string | null;
  petName?: string | null;
}) {
  if (!params.petId) {
    return { summary: '', memoryCount: 0 };
  }

  const supabase = createSupabaseAdminClient();
  const deduped = await dedupeExistingMemories(
    await fetchScopedMemories(params.userId, params.petId)
  );
  const summary = await aiBuildSummary({ memories: deduped, petName: params.petName });

  const payload = {
    user_id: params.userId,
    pet_id: params.petId,
    summary,
    memory_count: deduped.length,
    window_days: 30,
  };

  const { error } = await supabase
    .from('memory_summaries')
    .upsert(payload, { onConflict: 'user_id,pet_id' });
  if (error) throw error;

  return {
    summary,
    memoryCount: deduped.length,
  };
}

export async function extractAndStoreMemories(params: {
  userId: string;
  petId: string | null;
  petName?: string | null;
  userMessage: string;
  assistantMessage: string;
}) {
  const supabase = createSupabaseAdminClient();
  const candidates = compressCandidates(
    await aiExtractCandidates({
      userMessage: params.userMessage,
      assistantMessage: params.assistantMessage,
    })
  );

  if (!candidates.length) {
    const summaryResult = params.petId
      ? await refreshMemorySummary({
          userId: params.userId,
          petId: params.petId,
          petName: params.petName,
        })
      : { summary: '', memoryCount: 0 };
    return {
      storedCount: 0,
      emotionTag: inferEmotionTag(params.userMessage),
      memoryHints: [] as string[],
      summary: summaryResult.summary,
    };
  }

  const { data: existing, error: existingError } = await supabase
    .from('memories')
    .select(
      'id, user_id, pet_id, type, content, importance, created_at, updated_at'
    )
    .eq('user_id', params.userId)
    .or(
      params.petId
        ? `pet_id.is.null,pet_id.eq.${params.petId}`
        : 'pet_id.is.null'
    )
    .order('updated_at', { ascending: false })
    .limit(40);

  if (existingError) {
    throw existingError;
  }

  const existingMap = new Map(
    (existing || []).map((item) => [
      `${item.type}:${normalizeForComparison(item.content)}`,
      item as MemoryRow,
    ])
  );

  const inserts: Array<{
    user_id: string;
    pet_id: string | null;
    type: MemoryType;
    content: string;
    importance: number;
  }> = [];
  const updates: Array<{ id: string; importance: number }> = [];
  const hints: string[] = [];

  for (const candidate of candidates) {
    const key = `${candidate.type}:${normalizeForComparison(candidate.content)}`;
    const matched = existingMap.get(key);

    if (matched) {
      const nextImportance = Math.max(matched.importance || 1, candidate.importance);
      updates.push({ id: matched.id, importance: nextImportance });
      hints.push(candidate.content);
      continue;
    }

    inserts.push({
      user_id: params.userId,
      pet_id: params.petId,
      type: candidate.type,
      content: candidate.content,
      importance: candidate.importance,
    });
    hints.push(candidate.content);
  }

  if (inserts.length) {
    const { error } = await supabase.from('memories').insert(inserts);
    if (error) throw error;
  }

  for (const update of updates) {
    const { error } = await supabase
      .from('memories')
      .update({
        importance: update.importance,
        last_used_at: new Date().toISOString(),
      })
      .eq('id', update.id);
    if (error) throw error;
  }

  const summaryResult = params.petId
    ? await refreshMemorySummary({
        userId: params.userId,
        petId: params.petId,
        petName: params.petName,
      })
    : { summary: '', memoryCount: 0 };

  return {
    storedCount: inserts.length + updates.length,
    emotionTag: inferEmotionTag(params.userMessage),
    memoryHints: compressCandidates(
      hints.map((content) => ({
        type: 'fact' as MemoryType,
        content,
        importance: 3,
      }))
    )
      .map((item) => item.content)
      .slice(0, 3),
    summary: summaryResult.summary,
  };
}

export async function getMemoryManagerData(
  userId: string,
  selectedPetId?: string | null
) {
  const supabase = createSupabaseAdminClient();

  const memoryQuery = supabase
    .from('memories')
    .select('id, pet_id, type, content, importance, updated_at')
    .eq('user_id', userId)
    .order('importance', { ascending: false })
    .order('updated_at', { ascending: false })
    .limit(200);

  if (selectedPetId) {
    memoryQuery.or(`pet_id.is.null,pet_id.eq.${selectedPetId}`);
  }

  const summaryQuery = supabase
    .from('memory_summaries')
    .select('pet_id, summary, memory_count, updated_at')
    .eq('user_id', userId)
    .order('updated_at', { ascending: false });

  if (selectedPetId) {
    summaryQuery.eq('pet_id', selectedPetId);
  }

  const [
    { data: pets, error: petsError },
    { data: memories, error: memoriesError },
    { data: summaries, error: summariesError },
  ] = await Promise.all([
    supabase
      .from('pets')
      .select('id, name, image_url')
      .eq('user_id', userId)
      .order('created_at', { ascending: false }),
    memoryQuery,
    summaryQuery,
  ]);

  if (petsError) throw petsError;
  if (memoriesError) throw memoriesError;
  if (summariesError) throw summariesError;

  const petMap = new Map((pets || []).map((pet) => [pet.id, pet]));

  const memoryItems: MemoryManagerItem[] = (memories || []).map((memory) => ({
    id: memory.id,
    petId: memory.pet_id,
    petName: memory.pet_id
      ? petMap.get(memory.pet_id)?.name || 'Unknown Pet'
      : 'Global Memory',
    petImageUrl: memory.pet_id
      ? petMap.get(memory.pet_id)?.image_url || null
      : null,
    type: memory.type as MemoryType,
    content: memory.content,
    importance: memory.importance,
    updatedAt: memory.updated_at || null,
  }));

  const summaryItems: MemoryManagerSummary[] = (summaries || []).map(
    (summary) => ({
      petId: summary.pet_id,
      petName: petMap.get(summary.pet_id)?.name || 'Unknown Pet',
      petImageUrl: petMap.get(summary.pet_id)?.image_url || null,
      summary: summary.summary,
      memoryCount: summary.memory_count,
      updatedAt: summary.updated_at || null,
    })
  );

  const selectedPet = selectedPetId
    ? (pets || []).find((pet) => pet.id === selectedPetId) || null
    : null;

  return {
    pets: (pets || []).map((pet) => ({
      id: pet.id,
      name: pet.name,
      imageUrl: pet.image_url || null,
    })),
    selectedPet: selectedPet
      ? {
          id: selectedPet.id,
          name: selectedPet.name,
          imageUrl: selectedPet.image_url || null,
        }
      : null,
    memories: memoryItems,
    summaries: summaryItems,
  };
}

export async function deleteMemoryById(params: {
  userId: string;
  memoryId: string;
}) {
  const supabase = createSupabaseAdminClient();
  const { data: memory, error: fetchError } = await supabase
    .from('memories')
    .select('id, pet_id')
    .eq('id', params.memoryId)
    .eq('user_id', params.userId)
    .maybeSingle();

  if (fetchError) throw fetchError;
  if (!memory) return { deleted: false };

  const { error: deleteError } = await supabase
    .from('memories')
    .delete()
    .eq('id', params.memoryId)
    .eq('user_id', params.userId);
  if (deleteError) throw deleteError;

  if (memory.pet_id) {
    const { data: petRow } = await supabase
      .from('pets')
      .select('name')
      .eq('id', memory.pet_id)
      .maybeSingle();
    await refreshMemorySummary({
      userId: params.userId,
      petId: memory.pet_id,
      petName: petRow?.name || null,
    });
  } else {
    await rebuildAllMemorySummariesForUser(params.userId);
  }

  return { deleted: true };
}

export async function rebuildAllMemorySummariesForUser(userId: string) {
  const supabase = createSupabaseAdminClient();
  const { data: pets, error } = await supabase
    .from('pets')
    .select('id, name')
    .eq('user_id', userId);
  if (error) throw error;

  for (const pet of pets || []) {
    await refreshMemorySummary({
      userId,
      petId: pet.id,
      petName: pet.name || null,
    });
  }

  return { count: (pets || []).length };
}

export async function rebuildPetMemorySummary(params: {
  userId: string;
  petId: string;
}) {
  const supabase = createSupabaseAdminClient();
  const { data: pet, error } = await supabase
    .from('pets')
    .select('id, name')
    .eq('user_id', params.userId)
    .eq('id', params.petId)
    .maybeSingle();
  if (error) throw error;
  if (!pet) return { count: 0 };

  await refreshMemorySummary({
    userId: params.userId,
    petId: pet.id,
    petName: pet.name || null,
  });
  return { count: 1, petName: pet.name || null };
}

type MemoryRow = {
  id: string;
  user_id: string;
  pet_id: string | null;
  type: MemoryType;
  content: string;
  importance: number;
  created_at?: string | null;
  updated_at?: string | null;
  last_used_at?: string | null;
};

type MemorySummaryRow = {
  id?: string;
  user_id?: string;
  pet_id: string;
  summary: string;
  memory_count: number;
  updated_at?: string | null;
};

type MemoryManagerItem = {
  id: string;
  petId: string | null;
  petName: string;
  petImageUrl: string | null;
  type: MemoryType;
  content: string;
  importance: number;
  updatedAt: string | null;
};

type MemoryManagerSummary = {
  petId: string;
  petName: string;
  petImageUrl: string | null;
  summary: string;
  memoryCount: number;
  updatedAt: string | null;
};

function normalizeText(value: string) {
  return value.replace(/\n+/g, ' ').trim();
}

function normalizeForComparison(value: string) {
  return normalizeText(value).replace(/[.!?,，,、;;:::@#$%^&*()（）]/g, '').toLowerCase();
}

function clampImportance(value: number) {
  return Math.max(1, Math.min(5, Math.round(value)));
}

// Emotion inference from English text
export function inferEmotionTag(message: string) {
  const text = message.toLowerCase();

  if (/(unhappy|sad|upset|down|depressed|heartbroken|low|melancholy|gloomy)/.test(text)) return 'sad';
  if (/(tired|exhausted|wiped|beat|need sleep|so sleepy|fatigued)/.test(text)) return 'tired';
  if (/(anxious|nervous|worried|tense|stressed|overwhelmed|panic)/.test(text)) return 'anxious';
  if (/(pressure|stress|pressure|annoyed|frustrated|irritated|burned out)/.test(text)) return 'stressed';
  if (/(happy|joy|excited|glad|cheerful|wonderful|amazing)/.test(text)) return 'happy';
  if (/(angry|mad|furious|annoyed|frustrated|hate it)/.test(text)) return 'angry';
  if (/(lonely|alone|miss you|wish someone was here|need company)/.test(text)) return 'lonely';

  return null;
}

function heuristicCandidates(message: string): MemoryCandidate[] {
  const text = normalizeText(message);
  const candidates: MemoryCandidate[] = [];

  const emotionTag = inferEmotionTag(text);
  if (emotionTag === 'sad') {
    candidates.push({ type: 'emotion', content: 'The owner has been feeling down lately and needs gentle comfort.', importance: 5 });
  }
  if (emotionTag === 'tired') {
    candidates.push({ type: 'emotion', content: 'The owner has been tired recently and may need companionship and reminders to rest.', importance: 4 });
  }
  if (emotionTag === 'anxious' || emotionTag === 'stressed') {
    candidates.push({ type: 'emotion', content: 'The owner has been under pressure or anxious and needs reassurance.', importance: 5 });
  }
  if (emotionTag === 'happy') {
    candidates.push({ type: 'emotion', content: 'The owner has been in a good mood lately, a lively and cheerful interaction style is appropriate.', importance: 3 });
  }

  const nameMatch = text.match(/my name is ([a-zA-Z\u4e00-\u9fa5][a-zA-Z0-9\u4e00-\u9fa5_]{0,12})/i);
  if (nameMatch) {
    candidates.push({ type: 'profile', content: `The owner's name is ${nameMatch[1]}.`, importance: 5 });
  }

  const likeMatch = text.match(/i(?: really)? like (.{1,32})/i);
  if (likeMatch) {
    candidates.push({ type: 'preference', content: `The owner likes ${normalizeText(likeMatch[1]).replace(/[.!?,]+$/, '')}.`, importance: 4 });
  }

  const fearMatch = text.match(/i(?:'m)? (?:a little )?afraid of (.{1,32})/i);
  if (fearMatch) {
    candidates.push({ type: 'fact', content: `The owner is afraid of ${normalizeText(fearMatch[1]).replace(/[.!?,]+$/, '')}.`, importance: 4 });
  }

  if (/(at night|before bed|bedtime|evening).*(chat|talk|company|with me)/i.test(text) || /(chat|talk|company|with me).*(night|bed|evening)/i.test(text)) {
    candidates.push({ type: 'preference', content: 'The owner likes to have company and chat at night or before bed.', importance: 4 });
  }

  if (/(tomorrow|today|next week|this weekend).*(exam|test|interview|meeting|moving|travel|conference|presentation)/i.test(text)) {
    const trimmed = text.replace(/[.!?,]+$/, '');
    candidates.push({ type: 'fact', content: `The owner mentioned a near-term event: ${trimmed}.`, importance: 4 });
  }

  return compressCandidates(candidates).slice(0, 4);
}

function compressCandidates(candidates: MemoryCandidate[]) {
  const map = new Map<string, MemoryCandidate>();

  for (const candidate of candidates) {
    const content = normalizeText(candidate.content);
    if (!content) continue;

    const key = `${candidate.type}:${normalizeForComparison(content)}`;
    const previous = map.get(key);

    if (!previous || previous.importance < candidate.importance || previous.content.length < content.length) {
      map.set(key, {
        type: candidate.type,
        content,
        importance: clampImportance(candidate.importance),
      });
    }
  }

  return Array.from(map.values()).sort((a, b) => b.importance - a.importance || a.content.length - b.content.length);
}

async function aiExtractCandidates(params: {
  userMessage: string;
  assistantMessage: string;
}): Promise<MemoryCandidate[]> {
  if (!process.env.OPENAI_API_KEY) {
    return heuristicCandidates(params.userMessage);
  }

  const prompt = [
    'You are a memory extractor. From the following conversation exchange, extract only memories that have long-term companionship value.',
    'Output must be a JSON array, each element containing: type, content, importance.',
    'type must be one of: profile / fact / emotion / preference.',
    'content should be in English, concise, third-person, suitable for long-term storage.',
    'Avoid extracting one-off chitchat, greetings, or content without companionship value.',
    'If there is nothing worth remembering, output [].',
    `User message: ${params.userMessage}`,
    `Pet reply: ${params.assistantMessage}`,
  ].join('\n');

  const response = await fetch('https://api.openai.com/v1/chat/completions', {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
      Authorization: `Bearer ${process.env.OPENAI_API_KEY}`,
    },
    body: JSON.stringify({
      model: process.env.OPENAI_MODEL || 'gpt-4o-mini',
      temperature: 0.2,
      response_format: { type: 'json_object' },
      messages: [
        {
          role: 'system',
          content: 'You only output a JSON object, format: {\"memories\": [{\"type\": \"emotion\", \"content\": \"...\", \"importance\": 1-5}]}.',
        },
        {
          role: 'user',
          content: prompt,
        },
      ],
    }),
  });

  if (!response.ok) {
    return heuristicCandidates(params.userMessage);
  }

  const data = (await response.json()) as {
    choices?: Array<{ message?: { content?: string } }>;
  };

  const raw = data.choices?.[0]?.message?.content;
  if (!raw) {
    return heuristicCandidates(params.userMessage);
  }

  try {
    const parsed = JSON.parse(raw) as { memories?: Array<{ type?: string; content?: string; importance?: number }> };
    const memories = (parsed.memories || [])
      .filter((item) => item.type && item.content)
      .map((item) => ({
        type: (['profile', 'fact', 'emotion', 'preference'].includes(item.type || '') ? item.type : 'fact') as MemoryType,
        content: normalizeText(item.content || ''),
        importance: clampImportance(Number(item.importance || 3)),
      }))
      .filter((item) => item.content.length > 0);

    return memories.length ? compressCandidates(memories).slice(0, 4) : heuristicCandidates(params.userMessage);
  } catch {
    return heuristicCandidates(params.userMessage);
  }
}

function buildHeuristicSummary(memories: MemoryRow[], petName?: string | null) {
  if (!memories.length) {
    return `${petName || 'This pet'} has not yet formed stable long-term memories.`;
  }

  const pick = (type: MemoryType, count = 2) =>
    memories
      .filter((item) => item.type === type)
      .slice(0, count)
      .map((item) => item.content);

  const profile = pick('profile', 1);
  const emotion = pick('emotion', 2);
  const preference = pick('preference', 2);
  const fact = pick('fact', 2);

  const lines = [
    profile.length ? `Owner profile: ${profile.join('; ')}` : null,
    emotion.length ? `Recent emotions: ${emotion.join('; ')}` : null,
    preference.length ? `Interaction preferences: ${preference.join('; ')}` : null,
    fact.length ? `Recent events: ${fact.join('; ')}` : null,
  ].filter(Boolean);

  return lines.join('\n');
}

async function aiBuildSummary(params: { memories: MemoryRow[]; petName?: string | null }) {
  if (!process.env.OPENAI_API_KEY) {
    return buildHeuristicSummary(params.memories, params.petName);
  }

  const memoryList = params.memories
    .slice(0, 18)
    .map((item) => `- [${item.type}] ${item.content} (importance: ${item.importance})`)
    .join('\n');

  const response = await fetch('https://api.openai.com/v1/chat/completions', {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
      Authorization: `Bearer ${process.env.OPENAI_API_KEY}`,
    },
    body: JSON.stringify({
      model: process.env.OPENAI_MODEL || 'gpt-4o-mini',
      temperature: 0.3,
      messages: [
        {
          role: 'system',
          content: [
            'You are a memory summarizer for a companionship AI.',
            'Compress memories into 4 lines or fewer, in English, suitable for use in a long-term companionship prompt.',
            'Prioritize: owner profile, recent emotions, interaction preferences, recent events.',
            'Do not use odd formatting beyond bullet points. Do not mention databases, systems, or models.',
          ].join('\n'),
        },
        {
          role: 'user',
          content: `Pet name: ${params.petName || 'Unnamed pet'}\nPlease summarize the following memories:\n${memoryList}`,
        },
      ],
    }),
  });

  if (!response.ok) {
    return buildHeuristicSummary(params.memories, params.petName);
  }

  const data = (await response.json()) as {
    choices?: Array<{ message?: { content?: string } }>;
  };

  return normalizeText(data.choices?.[0]?.message?.content || buildHeuristicSummary(params.memories, params.petName));
}

async function fetchScopedMemories(userId: string, petId: string) {
  const supabase = createSupabaseAdminClient();
  const { data, error } = await supabase
    .from('memories')
    .select('id, user_id, pet_id, type, content, importance, created_at, updated_at, last_used_at')
    .eq('user_id', userId)
    .or(`pet_id.is.null,pet_id.eq.${petId}`)
    .order('importance', { ascending: false })
    .order('updated_at', { ascending: false })
    .limit(80);

  if (error) throw error;
  return (data || []) as MemoryRow[];
}

async function dedupeExistingMemories(memories: MemoryRow[]) {
  const grouped = new Map<string, MemoryRow[]>();

  for (const memory of memories) {
    const key = `${memory.type}:${normalizeForComparison(memory.content)}`;
    const rows = grouped.get(key) || [];
    rows.push(memory);
    grouped.set(key, rows);
  }

  const deleteIds: string[] = [];
  const kept: MemoryRow[] = [];

  for (const rows of grouped.values()) {
    const sorted = [...rows].sort((a, b) => {
      if (b.importance !== a.importance) return b.importance - a.importance;
      return new Date(b.updated_at || b.created_at || 0).getTime() - new Date(a.updated_at || a.created_at || 0).getTime();
    });

    kept.push(sorted[0]);
    if (sorted.length > 1) {
      deleteIds.push(...sorted.slice(1).map((item) => item.id));
    }
  }

  if (deleteIds.length) {
    const supabase = createSupabaseAdminClient();
    const { error } = await supabase.from('memories').delete().in('id', deleteIds);
    if (error) throw error;
  }

  return kept.sort((a, b) => b.importance - a.importance || new Date(b.updated_at || b.created_at || 0).getTime() - new Date(a.updated_at || b.created_at || 0).getTime());
}

export async function refreshMemorySummary(params: { userId: string; petId: string | null; petName?: string | null }) {
  if (!params.petId) {
    return { summary: '', memoryCount: 0 };
  }

  const supabase = createSupabaseAdminClient();
  const deduped = await dedupeExistingMemories(await fetchScopedMemories(params.userId, params.petId));
  const summary = await aiBuildSummary({ memories: deduped, petName: params.petName });

  const payload = {
    user_id: params.userId,
    pet_id: params.petId,
    summary,
    memory_count: deduped.length,
    window_days: 30,
  };

  const { error } = await supabase.from('memory_summaries').upsert(payload, { onConflict: 'user_id,pet_id' });
  if (error) throw error;

  return {
    summary,
    memoryCount: deduped.length,
  };
}

export async function extractAndStoreMemories(params: {
  userId: string;
  petId: string | null;
  petName?: string | null;
  userMessage: string;
  assistantMessage: string;
}) {
  const supabase = createSupabaseAdminClient();
  const candidates = compressCandidates(
    await aiExtractCandidates({
      userMessage: params.userMessage,
      assistantMessage: params.assistantMessage,
    }),
  );

  if (!candidates.length) {
    const summaryResult = params.petId
      ? await refreshMemorySummary({ userId: params.userId, petId: params.petId, petName: params.petName })
      : { summary: '', memoryCount: 0 };
    return {
      storedCount: 0,
      emotionTag: inferEmotionTag(params.userMessage),
      memoryHints: [] as string[],
      summary: summaryResult.summary,
    };
  }

  const { data: existing, error: existingError } = await supabase
    .from('memories')
    .select('id, user_id, pet_id, type, content, importance, created_at, updated_at')
    .eq('user_id', params.userId)
    .or(params.petId ? `pet_id.is.null,pet_id.eq.${params.petId}` : 'pet_id.is.null')
    .order('updated_at', { ascending: false })
    .limit(40);

  if (existingError) {
    throw existingError;
  }

  const existingMap = new Map(
    (existing || []).map((item) => [`${item.type}:${normalizeForComparison(item.content)}`, item as MemoryRow]),
  );

  const inserts: Array<{ user_id: string; pet_id: string | null; type: MemoryType; content: string; importance: number }> = [];
  const updates: Array<{ id: string; importance: number }> = [];
  const hints: string[] = [];

  for (const candidate of candidates) {
    const key = `${candidate.type}:${normalizeForComparison(candidate.content)}`;
    const matched = existingMap.get(key);

    if (matched) {
      const nextImportance = Math.max(matched.importance || 1, candidate.importance);
      updates.push({ id: matched.id, importance: nextImportance });
      hints.push(candidate.content);
      continue;
    }

    inserts.push({
      user_id: params.userId,
      pet_id: params.petId,
      type: candidate.type,
      content: candidate.content,
      importance: candidate.importance,
    });
    hints.push(candidate.content);
  }

  if (inserts.length) {
    const { error } = await supabase.from('memories').insert(inserts);
    if (error) throw error;
  }

  for (const update of updates) {
    const { error } = await supabase
      .from('memories')
      .update({ importance: update.importance, last_used_at: new Date().toISOString() })
      .eq('id', update.id);
    if (error) throw error;
  }

  const summaryResult = params.petId
    ? await refreshMemorySummary({ userId: params.userId, petId: params.petId, petName: params.petName })
    : { summary: '', memoryCount: 0 };

  return {
    storedCount: inserts.length + updates.length,
    emotionTag: inferEmotionTag(params.userMessage),
    memoryHints: compressCandidates(
      hints.map((content) => ({ type: 'fact' as MemoryType, content, importance: 3 })),
    )
      .map((item) => item.content)
      .slice(0, 3),
    summary: summaryResult.summary,
  };
}

export async function getMemoryManagerData(userId: string, selectedPetId?: string | null) {
  const supabase = createSupabaseAdminClient();

  const memoryQuery = supabase
    .from('memories')
    .select('id, pet_id, type, content, importance, updated_at')
    .eq('user_id', userId)
    .order('importance', { ascending: false })
    .order('updated_at', { ascending: false })
    .limit(200);

  if (selectedPetId) {
    memoryQuery.or(`pet_id.is.null,pet_id.eq.${selectedPetId}`);
  }

  const summaryQuery = supabase
    .from('memory_summaries')
    .select('pet_id, summary, memory_count, updated_at')
    .eq('user_id', userId)
    .order('updated_at', { ascending: false });

  if (selectedPetId) {
    summaryQuery.eq('pet_id', selectedPetId);
  }

  const [{ data: pets, error: petsError }, { data: memories, error: memoriesError }, { data: summaries, error: summariesError }] =
    await Promise.all([
      supabase.from('pets').select('id, name, image_url').eq('user_id', userId).order('created_at', { ascending: false }),
      memoryQuery,
      summaryQuery,
    ]);

  if (petsError) throw petsError;
  if (memoriesError) throw memoriesError;
  if (summariesError) throw summariesError;

  const petMap = new Map((pets || []).map((pet) => [pet.id, pet]));

  const memoryItems: MemoryManagerItem[] = (memories || []).map((memory) => ({
    id: memory.id,
    petId: memory.pet_id,
    petName: memory.pet_id ? petMap.get(memory.pet_id)?.name || 'Unknown Pet' : 'Global Memory',
    petImageUrl: memory.pet_id ? petMap.get(memory.pet_id)?.image_url || null : null,
    type: memory.type as MemoryType,
    content: memory.content,
    importance: memory.importance,
    updatedAt: memory.updated_at || null,
  }));

  const summaryItems: MemoryManagerSummary[] = (summaries || []).map((summary) => ({
    petId: summary.pet_id,
    petName: petMap.get(summary.pet_id)?.name || 'Unknown Pet',
    petImageUrl: petMap.get(summary.pet_id)?.image_url || null,
    summary: summary.summary,
    memoryCount: summary.memory_count,
    updatedAt: summary.updated_at || null,
  }));

  const selectedPet = selectedPetId ? (pets || []).find((pet) => pet.id === selectedPetId) || null : null;

  return {
    pets: (pets || []).map((pet) => ({ id: pet.id, name: pet.name, imageUrl: pet.image_url || null })),
    selectedPet: selectedPet ? { id: selectedPet.id, name: selectedPet.name, imageUrl: selectedPet.image_url || null } : null,
    memories: memoryItems,
    summaries: summaryItems,
  };
}

export async function deleteMemoryById(params: { userId: string; memoryId: string }) {
  const supabase = createSupabaseAdminClient();
  const { data: memory, error: fetchError } = await supabase.from('memories').select('id, pet_id').eq('id', params.memoryId).eq('user_id', params.userId).maybeSingle();

  if (fetchError) throw fetchError;
  if (!memory) return { deleted: false };

  const { error: deleteError } = await supabase.from('memories').delete().eq('id', params.memoryId).eq('user_id', params.userId);
  if (deleteError) throw deleteError;

  if (memory.pet_id) {
    const { data: petRow } = await supabase.from('pets').select('name').eq('id', memory.pet_id).maybeSingle();
    await refreshMemorySummary({ userId: params.userId, petId: memory.pet_id, petName: petRow?.name || null });
  } else {
    await rebuildAllMemorySummariesForUser(params.userId);
  }

  return { deleted: true };
}

export async function rebuildAllMemorySummariesForUser(userId: string) {
  const supabase = createSupabaseAdminClient();
  const { data: pets, error } = await supabase.from('pets').select('id, name').eq('user_id', userId);
  if (error) throw error;

  for (const pet of pets || []) {
    await refreshMemorySummary({ userId, petId: pet.id, petName: pet.name || null });
  }

  return { count: (pets || []).length };
}

export async function rebuildPetMemorySummary(params: { userId: string; petId: string }) {
  const supabase = createSupabaseAdminClient();
  const { data: pet, error } = await supabase.from('pets').select('id, name').eq('user_id', params.userId).eq('id', params.petId).maybeSingle();
  if (error) throw error;
  if (!pet) return { count: 0 };

  await refreshMemorySummary({ userId: params.userId, petId: pet.id, petName: pet.name || null });
  return { count: 1, petName: pet.name || null };
}
