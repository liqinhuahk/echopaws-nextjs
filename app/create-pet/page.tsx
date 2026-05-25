import { CreatePetForm } from '@/components/create-pet-form';
import { SiteFooter } from '@/components/site-footer';
import { SiteHeader } from '@/components/site-header';

export default function CreatePetPage({
  searchParams,
}: {
  searchParams?: { error?: string };
}) {
  return (
    <>
      <SiteHeader ctaLabel='Preview Chat' ctaHref='/chat' />
      <main className='container-shell py-10'>
        <div className='eyebrow'>Create Your Pet</div>
        <h1 className='page-title mt-4'>Give your pet a soul that remembers you</h1>
        <p className='page-subtitle mx-0'>This version is fully connected to the pets table and Supabase Storage. On submit, the system validates fields and image, uploads the photo, generates a system prompt, writes to the database, and redirects to chat.</p>

        {searchParams?.error ? (
          <div className='mt-6 rounded-2xl bg-rose-50 px-4 py-3 text-sm font-bold text-rose-800'>
            {searchParams.error}
          </div>
        ) : null}

        <section className='grid gap-6 py-8 lg:grid-cols-[380px_1fr]'>
          <div className='glass-card p-6'>
            <div>
              <h2 className='text-2xl font-bold tracking-tight'>Pet Profile</h2>
              <p className='mt-1 text-sm text-muted'>Required fields are validated server-side to keep the pets table clean and consistent.</p>
            </div>

            <CreatePetForm />
          </div>

          <div className='glass-card p-6'>
            <div>
              <h2 className='text-2xl font-bold tracking-tight'>What happens after you submit</h2>
              <p className='mt-1 text-sm text-muted'>This is no longer a static description — it mirrors the real submission flow.</p>
            </div>

            <div className='mt-5 rounded-[24px] border border-black/5 bg-card-gradient p-6'>
              <div className='text-xs font-extrabold uppercase tracking-[0.08em] text-orange-800'>Create Pet Flow</div>
              <ol className='mt-3 grid gap-3 text-sm leading-8 text-ink'>
                <li>1. Server validates name, breed, personality, image format and size</li>
                <li>2. Image uploads to Supabase Storage bucket pet-images</li>
                <li>3. System prompt auto-generated and written to pets table</li>
                <li>4. Redirects to /chat with success message and pet info</li>
              </ol>
            </div>

            <div className='mt-5 grid gap-3 md:grid-cols-3'>
              <div className='rounded-2xl border border-black/5 bg-white p-4'><strong className='block text-2xl'>5MB</strong><span className='text-sm text-muted'>Max image size</span></div>
              <div className='rounded-2xl border border-black/5 bg-white p-4'><strong className='block text-2xl'>3</strong><span className='text-sm text-muted'>Formats: JPG / PNG / WebP</span></div>
              <div className='rounded-2xl border border-black/5 bg-white p-4'><strong className='block text-2xl'>API</strong><span className='text-sm text-muted'>REST: /api/pets</span></div>
            </div>

            <div className='mt-5 grid gap-4 md:grid-cols-2'>
              <div className='rounded-[24px] border border-black/5 bg-white p-5'>
                <div className='feature-icon'>🧠</div>
                <h3 className='text-lg font-bold'>Auto-Generated Personality</h3>
                <p className='mt-2 text-sm leading-8 text-muted'>Based on breed, personality, food and habits, we auto-generate a ready-to-use pet prompt for chat.</p>
              </div>
              <div className='rounded-[24px] border border-black/5 bg-white p-5'>
                <div className='feature-icon'>☁️</div>
                <h3 className='text-lg font-bold'>Image Stored in DB</h3>
                <p className='mt-2 text-sm leading-8 text-muted'>After upload, the public URL is stored in pets.image_url — the chat page shows it directly.</p>
              </div>
            </div>

            <div className='mt-5 rounded-2xl bg-emerald-50 px-4 py-3 text-sm font-bold text-emerald-800'>
              For a headless setup, call /api/pets with multipart/form-data — the response includes new pet info and redirect URL.
            </div>
          </div>
        </section>
      </main>
      <SiteFooter rightText='Connected: pets table / Storage upload / Server Action / API / Validation / Success redirect' />
    </>
  );
}