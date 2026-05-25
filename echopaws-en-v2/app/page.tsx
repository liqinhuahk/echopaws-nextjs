
import { FeatureCard } from '@/components/feature-card';
import { SectionHeading } from '@/components/section-heading';
import { SiteFooter } from '@/components/site-footer';
import { SiteHeader } from '@/components/site-header';

const features = [
  { icon: '🔐', title: 'Secure Sign-Up', text: 'Sign up with Email or Google — quick, easy, and seamless.' },
  { icon: '📸', title: 'Create Your Pet', text: 'Upload a photo and describe your pet’s personality — we create a warm AI companion inspired by them.' },
  { icon: '💬', title: 'AI Pet Chat', text: 'Soft, comforting conversations that feel personal and emotionally connected.' },
  { icon: '🧠', title: 'Long-Term Memory', text: 'Remembers your stories, habits, emotions, and shared moments over time.' },
  { icon: '🌙', title: 'Healing Atmosphere', text: 'Designed to feel warm, calm, and emotionally comforting — never cold or robotic.' },
  { icon: '💎', title: 'Membership Access', text: 'Free tier available. Premium unlocks unlimited chats, deeper memory, and future voice features.' },
];

export default function HomePage() {
  return (
    <>
      <SiteHeader />
      <main>
        <section className='container-shell grid gap-10 pb-8 pt-12 md:grid-cols-[1.08fr_.92fr] md:items-center'>
          <div>
            <div className='eyebrow'>EchoPaws · Emotional AI Companion</div>

            <h1 className='page-title mt-4'>
              Your pet. Forever by your side.
            </h1>

            <p className='page-subtitle mx-0'>
              EchoPaws helps pet lovers create a comforting AI companion inspired by their beloved pets.
              Through memories, conversations, and emotional connection, every interaction feels warm,
              personal, and familiar.
            </p>

            <div className='mt-8 flex flex-wrap gap-4'>
              <a href='/create-pet' className='brand-button'>Create My Pet</a>
              <a href='/chat' className='subtle-button'>Try AI Chat</a>
            </div>

            <div className='mt-7 flex flex-wrap gap-4 text-sm text-muted'>
              <span>✓ Google & Email Login</span>
              <span>✓ Emotional AI Chat</span>
              <span>✓ Long-Term Memory</span>
            </div>
          </div>
        </section>
      </main>

      <SiteFooter />
    </>
  );
}
