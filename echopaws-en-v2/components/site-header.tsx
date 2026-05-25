import Link from 'next/link';
import { createServerSupabaseClient, hasSupabaseEnv } from '@/lib/supabase/server';

type SiteHeaderProps = {
  ctaLabel?: string;
  ctaHref?: string;
};

const baseLinks = [
  { href: '/', label: 'Home' },
  { href: '/pets', label: 'Manage Pets' },
  { href: '/create-pet', label: 'Create Pet' },
  { href: '/chat', label: 'Chat' },
  { href: '/memories', label: 'Memories' },
  { href: '/pricing', label: 'Membership' },
];

export async function SiteHeader({ ctaLabel = 'Create My Pet', ctaHref = '/create-pet' }: SiteHeaderProps) {
  let isLoggedIn = false;

  if (hasSupabaseEnv()) {
    const supabase = createServerSupabaseClient();
    const {
      data: { user },
    } = await supabase.auth.getUser();
    isLoggedIn = Boolean(user);
  }

  const links = isLoggedIn ? [...baseLinks, { href: '/account', label: 'Account' }] : [{ href: '/login', label: 'Sign In' }, ...baseLinks];

  return (
    <div className='container-shell sticky top-4 z-20 pt-4'>
      <header className='glass-card flex items-center justify-between rounded-[20px] px-4 py-3 md:px-5'>
        <Link href='/' className='flex items-center gap-3 font-extrabold tracking-tight'>
          <div className='grid h-10 w-10 place-items-center rounded-2xl bg-brand-gradient text-lg text-white shadow-lg shadow-orange-200'>🐾</div>
          <span>EchoPaws</span>
        </Link>

        <nav className='hidden items-center gap-5 text-sm text-muted md:flex'>
          {links.map((link) => (
            <Link key={link.href} href={link.href} className='transition hover:text-ink'>
              {link.label}
            </Link>
          ))}
        </nav>

        <Link href={ctaHref} className='brand-button px-5 py-3 text-sm'>
          {ctaLabel}
        </Link>
      </header>
    </div>
  );
}