import { signInWithGoogle, signInWithPassword, signUpWithPassword } from '@/app/actions/auth';
import { SiteFooter } from '@/components/site-footer';
import { SiteHeader } from '@/components/site-header';

export default function LoginPage({
  searchParams,
}: {
  searchParams?: { message?: string; error?: string };
}) {
  return (
    <>
      <SiteHeader ctaLabel='Get Started' ctaHref='/create-pet' />
      <main className='container-shell grid min-h-[calc(100vh-180px)] place-items-center py-12'>
        <section className='glass-card w-full max-w-[520px] p-7 md:p-8'>
          <div className='eyebrow'>Welcome to EchoPaws</div>
          <h1 className='page-title mt-4 text-[44px] md:text-[52px]'>Sign in to your companion world</h1>
          <p className='page-subtitle mx-0'>Sign in first, then create your AI pet. The whole flow is lightweight — you can be chatting within 3 minutes.</p>

          <div className='mt-6 grid gap-3'>
            <form action={signInWithGoogle}>
              <button className='subtle-button w-full'>🔎 Sign in with Google</button>
            </form>
            <div className='subtle-button w-full'>✉️ Sign in with Email</div>
          </div>

          <div className='my-5 flex items-center gap-3 text-xs text-muted before:h-px before:flex-1 before:bg-black/10 after:h-px after:flex-1 after:bg-black/10'>
            Or continue with email
          </div>

          {searchParams?.message ? (
            <div className='mt-4 rounded-2xl bg-emerald-50 px-4 py-3 text-sm font-bold text-emerald-800'>
              {searchParams.message}
            </div>
          ) : null}

          {searchParams?.error ? (
            <div className='mt-4 rounded-2xl bg-rose-50 px-4 py-3 text-sm font-bold text-rose-800'>
              {searchParams.error}
            </div>
          ) : null}

          <form action={signInWithPassword} className='grid gap-4'>
            <label className='grid gap-2 text-sm font-bold'>
              Email address
              <input className='input-shell' name='email' type='email' placeholder='name@example.com' />
            </label>
            <label className='grid gap-2 text-sm font-bold'>
              Password
              <input className='input-shell' name='password' type='password' placeholder='Enter your password' />
            </label>
            <label className='grid gap-2 text-sm font-bold'>
              Nickname (optional)
              <input className='input-shell' name='nickname' type='text' placeholder='What should your pet call you' />
            </label>
            <div className='grid gap-3 md:grid-cols-2'>
              <button className='brand-button w-full'>Sign In</button>
              <button formAction={signUpWithPassword} className='subtle-button w-full'>Create Account</button>
            </div>
          </form>

          <div className='mt-4 rounded-2xl bg-emerald-50 px-4 py-3 text-sm font-bold text-emerald-800'>
            MVP stage: connect Supabase Auth first for native Email and Google login support.
          </div>

          <p className='mt-4 text-center text-xs text-muted'>No account yet? Create one to bring your first AI pet to life.</p>
        </section>
      </main>
      <SiteFooter rightText='Recommended Stack: Supabase Auth' />
    </>
  );
}