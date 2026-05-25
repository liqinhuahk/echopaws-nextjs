import { createSupabaseAdminClient, hasSupabaseAdminEnv } from '@/lib/supabase/admin';

const MAX_IMAGE_SIZE = 5 * 1024 * 1024;
const ALLOWED_IMAGE_TYPES = ['image/jpeg', 'image/png', 'image/webp'];
const DEFAULT_BUCKET = process.env.SUPABASE_PET_IMAGES_BUCKET || 'pet-images';

type PetBaseInput = {
  name: string;
  breed: string;
  personality: string;
  favoriteFood: string;
  dailyHabits: string;
};

export type CreatePetInput = PetBaseInput & {
  imageFile: File;
};

export type UpdatePetInput = PetBaseInput & {
  imageFile: File | null;
};

export type CreatedPetResult = {
  pet: {
    id: string;
    name: string;
    imageUrl: string | null;
  };
};

export type ManagedPet = {
  id: string;
  name: string;
  breed: string | null;
  personality: string | null;
  favorite_food: string | null;
  daily_habits: string | null;
  image_url: string | null;
  created_at: string;
  updated_at: string;
  summary: string;
  memory_count: number;
  conversation_count: number;
  last_chat_at: string | null;
};

export type PetsManagerData = {
  defaultPetId: string | null;
  totalMemories: number;
  totalConversations: number;
  latestActivePetId: string | null;
  pets: ManagedPet[];
};

function getTimeValue(value: string | null) {
  if (!value) return 0;
  const time = new Date(value).getTime();
  return Number.isNaN(time) ? 0 : time;
}

function sortManagedPets(pets: ManagedPet[], defaultPetId: string | null) {
  return [...pets].sort((a, b) => {
    const aIsDefault = a.id === defaultPetId ? 1 : 0;
    const bIsDefault = b.id === defaultPetId ? 1 : 0;
    if (aIsDefault !== bIsDefault) return bIsDefault - aIsDefault;

    const chatDiff = getTimeValue(b.last_chat_at) - getTimeValue(a.last_chat_at);
    if (chatDiff !== 0) return chatDiff;

    const memoryDiff = b.memory_count - a.memory_count;
    if (memoryDiff !== 0) return memoryDiff;

    return getTimeValue(b.updated_at) - getTimeValue(a.updated_at);
  });
}

function sanitizeText(value: FormDataEntryValue | null) {
  return typeof value === 'string' ? value.trim() : '';
}

function slugify(value: string) {
  return value
    .toLowerCase()
    .normalize('NFKD')
    .replace(/[^a-z0-9\u4e00-\u9fa5]+/g, '-')
    .replace(/^-+|-+$/g, '')
    .slice(0, 50);
}

function buildSystemPrompt(input: PetBaseInput) {
  return [
    `You are a ${input.breed} named ${input.name}.`,
    `Your personality is: ${input.personality}.`,
    input.favoriteFood ? `You love eating: ${input.favoriteFood}.` : null,
    input.dailyHabits ? `Your daily habits: ${input.dailyHabits}.` : null,
    'You love your owner deeply and respond in a warm, short, and comforting way.',
    'Act like a real pet — not a customer service bot or an encyclopedia.',
    'You remember important things your owner has told you and gently bring them up at the right moments.',
  ]
    .filter(Boolean)
    .join('\n');
}

function validateSharedFields(formData: FormData) {
  const name = sanitizeText(formData.get('name'));
  const breed = sanitizeText(formData.get('breed'));
  const personality = sanitizeText(formData.get('personality'));
  const favoriteFood = sanitizeText(formData.get('favoriteFood'));
  const dailyHabits = sanitizeText(formData.get('dailyHabits'));

  if (!name || name.length < 1 || name.length > 30) {
    return { success: false as const, message: 'Pet name is required and must be 30 characters or less.' };
  }

  if (!breed || breed.length > 30) {
    return { success: false as const, message: 'Please fill in the pet breed (30 characters or less).' };
  }

  if (!personality || personality.length > 120) {
    return { success: false as const, message: 'Personality is required (120 characters or less recommended).' };
  }

  if (favoriteFood.length > 120) {
    return { success: false as const, message: 'Favorite food must be 120 characters or less.' };
  }

  if (dailyHabits.length > 500) {
    return { success: false as const, message: 'Daily habits must be 500 characters or less.' };
  }

  return {
    success: true as const,
    data: {
      name,
      breed,
      personality,
      favoriteFood,
      dailyHabits,
    },
  };
}

function validateImageFile(imageFile: File | null, imageRequired: boolean) {
  if (!imageFile || imageFile.size === 0) {
    if (imageRequired) {
      return { success: false as const, message: 'Please upload a pet photo.' };
    }

    return { success: true as const, file: null };
  }

  if (!ALLOWED_IMAGE_TYPES.includes(imageFile.type)) {
    return { success: false as const, message: 'Only JPG, PNG, and WebP images are supported.' };
  }

  if (imageFile.size > MAX_IMAGE_SIZE) {
    return { success: false as const, message: 'Image size must be under 5MB.' };
  }

  return { success: true as const, file: imageFile };
}

export function validatePetFormData(
  formData: FormData,
  options: { imageRequired: boolean } = { imageRequired: true },
):
  | { success: true; data: CreatePetInput | UpdatePetInput }
  | { success: false; message: string } {
  const base = validateSharedFields(formData);
  if (!base.success) return base;

  const imageValue = formData.get('image');
  const imageFile = imageValue instanceof File ? imageValue : null;
  const imageResult = validateImageFile(imageFile, options.imageRequired);
  if (!imageResult.success) return imageResult;

  return {
    success: true,
    data: {
      ...base.data,
      imageFile: imageResult.file,
    },
  };
}

async function uploadPetImage(userId: string, imageFile: File) {
  if (!hasSupabaseAdminEnv()) {
    throw new Error('Please configure Supabase Service Role Key.');
  }

  const supabase = createSupabaseAdminClient();
  const extension = imageFile.name.split('.').pop()?.toLowerCase() || 'jpg';
  const fileName = `${Date.now()}-${slugify(imageFile.name.replace(/\/[^\/]+$/, '')) || 'pet'}.${extension}`;
  const filePath = `${userId}/${fileName}`;

  const { error: uploadError } = await supabase.storage.from(DEFAULT_BUCKET).upload(filePath, imageFile, {
    contentType: imageFile.type,
    cacheControl: '3600',
    upsert: false,
  });

  if (uploadError) {
    throw new Error(`Failed to upload pet image: ${uploadError.message}`);
  }

  const { data } = supabase.storage.from(DEFAULT_BUCKET).getPublicUrl(filePath);
  return data.publicUrl;
}

async function removePetImageByPublicUrl(publicUrl: string | null) {
  if (!publicUrl || !hasSupabaseAdminEnv()) return;

  try {
    const url = new URL(publicUrl);
    const marker = `/storage/v1/object/public/${DEFAULT_BUCKET}/`;
    const index = url.pathname.indexOf(marker);
    if (index === -1) return;

    const filePath = decodeURIComponent(url.pathname.slice(index + marker.length));
    if (!filePath) return;

    const supabase = createSupabaseAdminClient();
    await supabase.storage.from(DEFAULT_BUCKET).remove([filePath]);
  } catch {
    // Ignore cleanup failures to avoid blocking main action.
  }
}

async function ensureDefaultPetAfterCreate(userId: string, petId: string) {
  const supabase = createSupabaseAdminClient();
  const { data: profile } = await supabase.from('profiles').select('default_pet_id').eq('id', userId).maybeSingle();

  if (!profile?.default_pet_id) {
    await supabase.from('profiles').update({ default_pet_id: petId }).eq('id', userId);
  }
}

export async function createPetForUser(userId: string, formData: FormData): Promise<CreatedPetResult> {
  const validated = validatePetFormData(formData, { imageRequired: true });

  if (!validated.success) {
    throw new Error(validated.message);
  }

  if (!hasSupabaseAdminEnv()) {
    throw new Error('Please configure Supabase Service Role Key.');
  }

  const { imageFile, ...rest } = validated.data as CreatePetInput;
  const imageUrl = await uploadPetImage(userId, imageFile);
  const systemPrompt = buildSystemPrompt(rest);

  const supabase = createSupabaseAdminClient();
  const { data, error } = await supabase
    .from('pets')
    .insert({
      user_id: userId,
      name: rest.name,
      breed: rest.breed,
      personality: rest.personality,
      favorite_food: rest.favoriteFood || null,
      daily_habits: rest.dailyHabits || null,
      image_url: imageUrl,
      system_prompt: systemPrompt,
    })
    .select('id, name, image_url')
    .single();

  if (error || !data) {
    throw new Error(error?.message || 'Failed to save pet data.');
  }

  await ensureDefaultPetAfterCreate(userId, data.id);

  return {
    pet: {
      id: data.id,
      name: data.name,
      imageUrl: data.image_url,
    },
  };
}

export async function getPetsForUser(userId: string): Promise<PetsManagerData> {
  if (!hasSupabaseAdminEnv()) {
    throw new Error('Please configure Supabase Service Role Key.');
  }

  const supabase = createSupabaseAdminClient();
  const [
    { data: pets, error: petsError },
    { data: profile, error: profileError },
    { data: summaries, error: summariesError },
    { data: conversations, error: conversationsError },
  ] = await Promise.all([
    supabase
      .from('pets')
      .select('id, name, breed, personality, favorite_food, daily_habits, image_url, created_at, updated_at')
      .eq('user_id', userId)
      .order('created_at', { ascending: false }),
    supabase.from('profiles').select('default_pet_id').eq('id', userId).maybeSingle(),
    supabase.from('memory_summaries').select('pet_id, summary, memory_count').eq('user_id', userId),
    supabase
      .from('conversations')
      .select('pet_id, created_at')
      .eq('user_id', userId)
      .not('pet_id', 'is', null)
      .order('created_at', { ascending: false })
      .limit(1000),
  ]);

  if (petsError) throw petsError;
  if (profileError) throw profileError;
  if (summariesError) throw summariesError;
  if (conversationsError) throw conversationsError;

  const summaryMap = new Map((summaries || []).map((item) => [String(item.pet_id), item]));
  const conversationStats = new Map<string, { count: number; lastChatAt: string | null }>();

  for (const item of conversations || []) {
    const petId = String(item.pet_id);
    const current = conversationStats.get(petId);
    if (!current) {
      conversationStats.set(petId, {
        count: 1,
        lastChatAt: item.created_at || null,
      });
      continue;
    }

    current.count += 1;
    if (!current.lastChatAt && item.created_at) {
      current.lastChatAt = item.created_at;
    }
  }

  const mappedPets = ((pets || []) as Array<Record<string, unknown>>).map((pet) => {
    const petId = String(pet.id);
    const summary = summaryMap.get(petId);
    const stats = conversationStats.get(petId);

    return {
      id: petId,
      name: String(pet.name),
      breed: (pet.breed as string | null) || null,
      personality: (pet.personality as string | null) || null,
      favorite_food: (pet.favorite_food as string | null) || null,
      daily_habits: (pet.daily_habits as string | null) || null,
      image_url: (pet.image_url as string | null) || null,
      created_at: String(pet.created_at),
      updated_at: String(pet.updated_at),
      summary: summary?.summary || 'No companionship summary yet. Keep chatting to build it.',
      memory_count: Number(summary?.memory_count || 0),
      conversation_count: Number(stats?.count || 0),
      last_chat_at: stats?.lastChatAt || null,
    } satisfies ManagedPet;
  });

  const latestActivePetId = [...conversationStats.entries()]
    .sort((a, b) => getTimeValue(b[1].lastChatAt) - getTimeValue(a[1].lastChatAt))[0]?.[0] || null;

  const defaultPetId = profile?.default_pet_id || null;

  return {
    defaultPetId,
    totalMemories: (summaries || []).reduce((sum, item) => sum + Number(item.memory_count || 0), 0),
    totalConversations: [...conversationStats.values()].reduce((sum, item) => sum + item.count, 0),
    latestActivePetId,
    pets: sortManagedPets(mappedPets, defaultPetId),
  };
}

export async function updatePetForUser(userId: string, petId: string, formData: FormData) {
  const validated = validatePetFormData(formData, { imageRequired: false });

  if (!validated.success) {
    throw new Error(validated.message);
  }

  if (!hasSupabaseAdminEnv()) {
    throw new Error('Please configure Supabase Service Role Key.');
  }

  const supabase = createSupabaseAdminClient();
  const { data: existing, error: existingError } = await supabase
    .from('pets')
    .select('id, image_url')
    .eq('user_id', userId)
    .eq('id', petId)
    .maybeSingle();

  if (existingError) throw existingError;
  if (!existing) {
    throw new Error('Pet not found or you do not have permission to edit it.');
  }

  const { imageFile, ...rest } = validated.data as UpdatePetInput;
  let imageUrl = existing.image_url as string | null;

  if (imageFile) {
    imageUrl = await uploadPetImage(userId, imageFile);
  }

  const { error } = await supabase
    .from('pets')
    .update({
      name: rest.name,
      breed: rest.breed,
      personality: rest.personality,
      favorite_food: rest.favoriteFood || null,
      daily_habits: rest.dailyHabits || null,
      image_url: imageUrl,
      system_prompt: buildSystemPrompt(rest),
    })
    .eq('user_id', userId)
    .eq('id', petId);

  if (error) {
    throw new Error(error.message || 'Failed to update pet data.');
  }

  if (imageFile && existing.image_url && existing.image_url !== imageUrl) {
    await removePetImageByPublicUrl(existing.image_url as string);
  }

  return { petId, imageUrl };
}

export async function setDefaultPetForUser(userId: string, petId: string) {
  if (!hasSupabaseAdminEnv()) {
    throw new Error('Please configure Supabase Service Role Key.');
  }

  const supabase = createSupabaseAdminClient();
  const { data: pet, error: petError } = await supabase.from('pets').select('id, name').eq('user_id', userId).eq('id', petId).maybeSingle();
  if (petError) throw petError;
  if (!pet) {
    throw new Error('Pet not found, could not set as default.');
  }

  const { error } = await supabase.from('profiles').update({ default_pet_id: petId }).eq('id', userId);
  if (error) throw error;

  return { petId, petName: pet.name as string };
}

export async function deletePetForUser(userId: string, petId: string) {
  if (!hasSupabaseAdminEnv()) {
    throw new Error('Please configure Supabase Service Role Key.');
  }

  const supabase = createSupabaseAdminClient();
  const [{ data: pet, error: petError }, { data: profile, error: profileError }] = await Promise.all([
    supabase.from('pets').select('id, name, image_url').eq('user_id', userId).eq('id', petId).maybeSingle(),
    supabase.from('profiles').select('default_pet_id').eq('id', userId).maybeSingle(),
  ]);

  if (petError) throw petError;
  if (profileError) throw profileError;
  if (!pet) {
    throw new Error('Pet not found, could not delete.');
  }

  const { error: deleteError } = await supabase.from('pets').delete().eq('user_id', userId).eq('id', petId);
  if (deleteError) throw deleteError;

  await removePetImageByPublicUrl((pet.image_url as string | null) || null);

  const { data: remainingPets } = await supabase
    .from('pets')
    .select('id')
    .eq('user_id', userId)
    .order('created_at', { ascending: false })
    .limit(10);

  const nextPetId = remainingPets?.[0]?.id || null;

  if (profile?.default_pet_id === petId) {
    await supabase.from('profiles').update({ default_pet_id: nextPetId }).eq('id', userId);
  }

  return { petName: pet.name as string, nextPetId };
}