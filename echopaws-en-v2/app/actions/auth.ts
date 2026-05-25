'use server';

import { redirect } from 'next/navigation';
import { createServerSupabaseClient, hasSupabaseEnv } from '@/lib/supabase/server';
import { getSiteUrl } from '@/lib/stripe';

function toMessage(path: string, key: string, value: string) {
  return `${path}?${key}=${encodeURIComponent(value)}`;
}

export async function signInWithPassword(formData: FormData) {
  if (!hasSupabaseEnv()) {
    redirect(toMessage('/login', 'error', 'Please configure Supabase environment variables first.'));
  }

  const email = String(formData.get('email') || '').trim();
  const password = String(formData.get('password') || '');

  if (!email || !password) {
    redirect(toMessage('/login', 'error', 'Please enter your email and password.'));
  }

  const supabase = createServerSupabaseClient();
  const { error } = await supabase.auth.signInWithPassword({ email, password });

  if (error) {
    redirect(toMessage('/login', 'error', error.message));
  }

  redirect('/account');
}

export async function signUpWithPassword(formData: FormData) {
  if (!hasSupabaseEnv()) {
    redirect(toMessage('/login', 'error', 'Please configure Supabase environment variables first.'));
  }

  const email = String(formData.get('email') || '').trim();
  const password = String(formData.get('password') || '');
  const nickname = String(formData.get('nickname') || '').trim();

  if (!email || !password) {
    redirect(toMessage('/login', 'error', 'Email and password are required to sign up.'));
  }

  const supabase = createServerSupabaseClient();
  const { error } = await supabase.auth.signUp({
    email,
    password,
    options: {
      emailRedirectTo: `${getSiteUrl()}/auth/callback?next=/account`,
      data: {
        display_name: nickname,
      },
    },
  });

  if (error) {
    redirect(toMessage('/login', 'error', error.message));
  }

  redirect(toMessage('/login', 'message', 'Account created! Please check your email to verify your account.'));
}

export async function signInWithGoogle() {
  if (!hasSupabaseEnv()) {
    redirect(toMessage('/login', 'error', 'Please configure Supabase environment variables first.'));
  }

  const supabase = createServerSupabaseClient();
  const { data, error } = await supabase.auth.signInWithOAuth({
    provider: 'google',
    options: {
      redirectTo: `${getSiteUrl()}/auth/callback?next=/account`,
    },
  });

  if (error || !data.url) {
    redirect(toMessage('/login', 'error', error?.message || 'Failed to start Google sign-in.'));
  }

  redirect(data.url);
}

export async function signOut() {
  if (!hasSupabaseEnv()) {
    redirect('/login');
  }

  const supabase = createServerSupabaseClient();
  await supabase.auth.signOut();
  redirect('/login?message=You have been signed out safely.');
}