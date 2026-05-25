import Link from 'next/link';
import { redirect } from 'next/navigation';
import { openBillingPortal } from '@/app/actions/billing';
import { signOut } from '@/app/actions/auth';
import { SiteFooter } from '@/components/site-footer';
import { SiteHeader } from '@/components/site-header';
import { getPetsForUser } from '@/lib/pets';
import { createServerSupabaseClient, hasSupabaseEnv } from '@/lib/supabase/server';
import { findSubscriptionByUserId } from '@/lib/subscriptions';

export default async function AccountPage() {
  if (!hasSupabaseEnv()) {
    redirect('/login?error=Please%20configure%20Supabase%20environment%20variables%20first.');
  }

  const supabase = createServerSupabaseClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();

  if (!user) {
    redirect('/login?message=Please%20sign%20in%20to%20view%20your%20account.');
  }

  const displayName = (user.user_metadata?.display_name as string | undefined) || user.email?.split('@')[0] || 'Friend';

  let subscription: Awaited<ReturnType<typeof findSubscriptionByUserId>> | null = null;
  let petOverview: Awaited<ReturnType<typeof getPetsForUser>> | null = null;

  try {
    [subscription, petOverview] = await Promise.all([findSubscriptionByUserId(user.id), getPetsForUser(user.id)]);
  } catch {
    subscription = null;
    petOverview = null;
  }

  const currentPlan = subscription?.plan === 'vip' && ['active', 'trialing', 'past_due'].includes(subscription.status) ? 'VIP' : 'Free';
  const defaultPet = petOverview?.pets.find((pet) => pet.id === petOverview.defaultPetId) || null;

  return (
    <>
      <SiteHeader ctaLabel='Manage Membership' ctaHref='/pricing' />
      <main className='container-shell py-10'>
        <div className='eyebrow'>My Account</div>
        <h1 className='page-title mt-4'>Welcome back, {displayName}</h1>
        <p className='page-subtitle mx-0'>This is your EchoPaws account and membership hub. You can view your login status, manage your Stripe subscription, check your pets and default chat target, and securely sign out.</p>

        <section className='mt-8 grid gap-5 md:grid-cols-[1.1fr_.9fr]'>
          <div className='glass-card p-6'>
            <h2 className='text-2xl font-extrabold'>Account Status</h2>
            <div className='mt-5 grid gap-4 md:grid-cols-3'>
              <div className='rounded-2xl border border-black/5 bg-white p-4'>
                <div className='text-sm font-bold text-muted'>Email</div>
                <div className='mt-2 text-base font-semibold'>{user.email}</div>
              </div>
              <div className='rounded-2xl border border-black/5 bg-white p-4'>
                <div className='text-sm font-bold text-muted'>Current Plan</div>
                <div className='mt-2 text-base font-semibold'>{currentPlan}</div>
                <div className='mt-1 text-xs text-muted'>{subscription ? `Status: ${subscription.status}` : 'No subscription synced yet'}</div>
              </div>
              <div className='rounded-2xl border border-black/5 bg-white p-4'>
                <div className='text-sm font-bold text-muted'>Pets</div>
                <div className='mt-2 text-base font-semibold'>{petOverview?.pets.length || 0}</div>
                <div className='mt-1 text-xs text-muted'>{defaultPet ? `Default: ${defaultPet.name}` : 'No default pet set'}</div>
              </div>
            </div>

            <div className='mt-5 rounded-2xl bg-amber-50 px-4 py-3 text-sm font-bold text-amber-900'>
              This page reads the membership plan from the subscriptions table and the default chat pet from profiles.default_pet_id. Run the latest schema.sql first to see live data here.
            </div>
          </div>

          <div className='glass-card p-6'>
            <h2 className='text-2xl font-extrabold'>Membership & Security</h2>
            <div className='mt-5 grid gap-3'>
              <form action={openBillingPortal}>
                <button className='subtle-button w-full'>Open Stripe Billing Portal</button>
              </form>
              <Link href='/pricing' className='brand-button w-full text-center'>View Membership Plans</Link>
              <Link href='/pets' className='subtle-button w-full text-center'>Manage Pets & Default Target</Link>
              <form action={signOut}>
                <button className='subtle-button w-full'>Sign Out Securely</button>
              </form>
            </div>
          </div>
        </section>
      </main>
      <SiteFooter rightText='Account · Membership · Default Pet · Sign Out' />
    </>
  );
}