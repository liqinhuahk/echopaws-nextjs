import { createPetAction } from '@/app/actions/pets';
import { FormSubmitButton } from '@/components/form-submit-button';
import { PetBreedSelect } from '@/components/pet-breed-select';

export function CreatePetForm() {
  return (
    <form action={createPetAction} className='mt-5 grid gap-4' encType='multipart/form-data'>
      <label className='grid gap-2 text-sm font-bold'>
        Name
        <input className='input-shell' name='name' type='text' placeholder='e.g. Max' required maxLength={30} />
      </label>

      <label className='grid gap-2 text-sm font-bold'>
        Breed
        <PetBreedSelect defaultValue='Shiba Inu' />
      </label>

      <label className='grid gap-2 text-sm font-bold'>
        Personality
        <input
          className='input-shell'
          name='personality'
          type='text'
          placeholder='e.g. Playful, clingy, loves belly rubs, afraid of thunder'
          required
          maxLength={120}
        />
      </label>

      <label className='grid gap-2 text-sm font-bold'>
        Favorite Food
        <input className='input-shell' name='favoriteFood' type='text' placeholder='e.g. Chicken breast, freeze-dried treats' maxLength={120} />
      </label>

      <label className='grid gap-2 text-sm font-bold'>
        Daily Habits
        <textarea
          className='input-shell min-h-[120px]'
          name='dailyHabits'
          placeholder='e.g. Loves waiting by the door, sleeps on the couch at night'
          maxLength={500}
        />
      </label>

      <label className='grid gap-2 text-sm font-bold'>
        Upload Photo
        <div className='rounded-[22px] border border-dashed border-orange-300 bg-gradient-to-b from-orange-50 to-amber-50 px-6 py-6 text-center text-amber-900'>
          <div className='text-3xl'>📷</div>
          <p className='mt-3 text-sm font-bold'>Supports JPG / PNG / WebP, max 5MB</p>
          <p className='mt-1 text-xs font-normal text-muted'>Image will be auto-uploaded to Supabase Storage and saved to the pets table</p>
          <input className='input-shell mt-4' name='image' type='file' accept='image/png,image/jpeg,image/webp' required />
        </div>
      </label>

      <FormSubmitButton pendingLabel='Creating pet...'>Save Pet Profile</FormSubmitButton>
    </form>
  );
}