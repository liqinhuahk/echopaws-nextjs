'use server';

import { redirect } from 'next/navigation';
import { createServerSupabaseClient, hasSupabaseEnv } from '@/lib/supabase/server';
import { createPetForUser, deletePetForUser, setDefaultPetForUser, updatePetForUser } from '@/lib/pets';

function encodeMessage(message: string) {
  return encodeURIComponent(message);
}

function buildPetsRedirect(params: { message?: string; error?: string; petId?: string | null }) {
  const search = new URLSearchParams();
  if (params.petId) search.set('pet_id', params.petId);
  if (params.message) search.set('message', params.message);
  if (params.error) search.set('error', params.error);
  const query = search.toString();
  return query ? `/pets?${query}` : '/pets';
}

function toCreatePetError(message: string) {
  return `/create-pet?error=${encodeMessage(message)}`;
}

async function requireUser() {
  if (!hasSupabaseEnv()) {
    redirect(toCreatePetError('Please configure Supabase environment variables first.'));
  }

  const supabase = createServerSupabaseClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();

  if (!user) {
    redirect('/login?message=' + encodeMessage('Please sign in first to manage pets.'));
  }

  return user;
}

export async function createPetAction(formData: FormData) {
  const user = await requireUser();

  try {
    const result = await createPetForUser(user.id, formData);
    redirect(`/chat?pet_created=1&pet_name=${encodeURIComponent(result.pet.name)}&pet_id=${result.pet.id}`);
  } catch (error) {
    const message = error instanceof Error ? error.message : 'Failed to create pet. Please try again.';
    redirect(toCreatePetError(message));
  }
}

export async function updatePetAction(formData: FormData) {
  const user = await requireUser();
  const petId = String(formData.get('petId') || '').trim();

  if (!petId) {
    redirect(buildPetsRedirect({ error: 'Missing pet ID. Could not update.' }));
  }

  try {
    await updatePetForUser(user.id, petId, formData);
    redirect(buildPetsRedirect({ petId, message: 'Pet profile updated. Changes are now in effect.' }));
  } catch (error) {
    const message = error instanceof Error ? error.message : 'Failed to update pet. Please try again.';
    redirect(buildPetsRedirect({ petId, error: message }));
  }
}

export async function setDefaultPetAction(formData: FormData) {
  const user = await requireUser();
  const petId = String(formData.get('petId') || '').trim();

  if (!petId) {
    redirect(buildPetsRedirect({ error: 'Missing pet ID. Could not set as primary.' }));
  }

  try {
    const result = await setDefaultPetForUser(user.id, petId);
    redirect(buildPetsRedirect({ petId, message: `${result.petName} is now your primary pet and pinned at the top.` }));
  } catch (error) {
    const message = error instanceof Error ? error.message : 'Failed to set primary pet.';
    redirect(buildPetsRedirect({ petId, error: message }));
  }
}

export async function deletePetAction(formData: FormData) {
  const user = await requireUser();
  const petId = String(formData.get('petId') || '').trim();

  if (!petId) {
    redirect(buildPetsRedirect({ error: 'Missing pet ID. Could not delete.' }));
  }

  try {
    const result = await deletePetForUser(user.id, petId);
    redirect(buildPetsRedirect({ petId: result.nextPetId, message: `${result.petName} has been deleted.` }));
  } catch (error) {
    const message = error instanceof Error ? error.message : 'Failed to delete pet. Please try again.';
    redirect(buildPetsRedirect({ petId, error: message }));
  }
}