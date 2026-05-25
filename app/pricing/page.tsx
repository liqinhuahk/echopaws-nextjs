import { createVipCheckoutSession, openBillingPortal } from '@/app/actions/billing';
import { SiteFooter } from '@/components/site-footer';
import { SiteHeader } from '@/components/site-header';
import { createServerSupabaseClient, hasSupabaseEnv } from '@/lib/supabase/server';

export default async function PricingPage({
  searchParams,
}: {
  searchParams?: { error?: string; billing?: string; checkout?: string };
}) {
  let isLoggedIn = false;

  if (hasSupabaseEnv()) {
    const supabase = createServerSupabaseClient();
    const {
      data: { user },
    } = await supabase.auth.getUser();
    isLoggedIn = Boolean(user);
  }
  return (
    <>
      <SiteHeader ctaLabel='Upgrade Now' ctaHref='#plans' />
      <main className='container-shell py-10'>
        <section className='text-center'>
          <div className='eyebrow'>Membership</div>
          <h1 className='page-title mt-4'>Pricing designed for deeper companionship</h1>
          <p className='section-subtitle'>EchoPaws membership is not about more messages — it's about being understood. The longer you stay, the more it's worth it.</p>
        </section>

        {searchParams?.error ? (
          <div className='mt-6 rounded-2xl bg-rose-50 px-4 py-3 text-sm font-bold text-rose-800'>{searchParams.error}</div>
        ) : null}
        {searchParams?.billing ? (
          <div className='mt-6 rounded-2xl bg-amber-50 px-4 py-3 text-sm font-bold text-amber-900'>{searchParams.billing}</div>
        ) : null}
        {searchParams?.checkout === 'success' ? (
          <div className='mt-6 rounded-2xl bg-emerald-50 px-4 py-3 text-sm font-bold text-emerald-800'>Payment successful. Next step: use the Stripe webhook to sync membership status to Supabase.</div>
        ) : null}
        {searchParams?.checkout === 'cancelled' ? (
          <div className='mt-6 rounded-2xl bg-amber-50 px-4 py-3 text-sm font-bold text-amber-900'>Subscription cancelled. You can resubscribe anytime to unlock VIP.</div>
        ) : null}

        <section id='plans' className='mt-8 grid gap-5 md:grid-cols-2'>
          <article className='glass-card p-6'>
            <h2 className='text-2xl font-extrabold'>Free Tier</h2>
            <div className='mt-4 flex items-end gap-2'><strong className='text-5xl font-extrabold tracking-[-0.05em]'>$0</strong><span className='mb-1 text-muted'>/ mo</span></div>
            <p className='mt-3 text-sm leading-8 text-muted'>Great for first-time exploration of EchoPaws' emotional atmosphere and core chat experience.</p>
            <ul className='mt-5 grid gap-3 text-sm leading-7'>
              <li>✓ 10 chats per day</li>
              <li>✓ 1 AI pet</li>
              <li>✓ Basic memory capability</li>
              <li>✓ Upload pet profile and photo</li>
            </ul>
            <a href={isLoggedIn ? '/create-pet' : '/login'} className='subtle-button mt-6 w-full'>Try It Free</a>
          </article>

          <article className='glass-card relative overflow-hidden bg-gradient-to-b from-orange-50 to-amber-50 p-6'>
            <div className='absolute right-5 top-5 rounded-full bg-orange-100 px-3 py-2 text-xs font-extrabold text-orange-800'>Recommended</div>
            <h2 className='text-2xl font-extrabold'>VIP Membership</h2>
            <div className='mt-4 flex items-end gap-2'><strong className='text-5xl font-extrabold tracking-[-0.05em]'>$9</strong><span className='mb-1 text-muted'>/ mo</span></div>
            <p className='mt-3 text-sm leading-8 text-muted'>For users who want to build a real long-term emotional bond.</p>
            <ul className='mt-5 grid gap-3 text-sm leading-7'>
              <li>✓ Unlimited chats</li>
              <li>✓ Deeper long-term memory</li>
              <li>✓ Future voice interaction support</li>
              <li>✓ Richer comfort and companionship modes</li>
            </ul>
            <form action={createVipCheckoutSession} className='mt-6'>
              <button className='brand-button w-full'>Subscribe via Stripe</button>
            </form>
            <form action={openBillingPortal} className='mt-3'>
              <button className='subtle-button w-full'>Manage Subscription</button>
            </form>
          </article>
        </section>

        <section className='mt-8 grid gap-5 md:grid-cols-2'>
          <div className='glass-card bg-card-gradient p-6'>
            <div className='text-xs font-extrabold uppercase tracking-[0.08em] text-orange-800'>Why users pay</div>
            <p className='mt-3 text-lg leading-9'>Not because it answers more questions — but because it feels like their pet, uniquely theirs. Value should be built around relationship depth, memory quality, and companionship style, not message count.</p>
          </div>
          <div className='glass-card bg-card-gradient p-6'>
            <div className='text-xs font-extrabold uppercase tracking-[0.08em] text-orange-800'>Technical guidance</div>
            <p className='mt-3 text-lg leading-9'>Stripe handles monthly subscriptions and billing, Supabase syncs membership status. Free tier usage logs to usage_logs. VIP unlocks unlimited chat and premium memory.</p>
          </div>
        </section>
      </main>
      <SiteFooter rightText='Recommended Stack: Stripe + Supabase' />
    </>
  );
}