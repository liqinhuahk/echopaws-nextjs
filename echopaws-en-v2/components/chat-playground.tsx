'use client';

import { FormEvent, useMemo, useState } from 'react';

type ChatPlaygroundProps = {
  petId?: string | null;
  initialMessages: Array<{ role: 'user' | 'assistant'; content: string }>;
  initialRemainingLabel: string;
  initialMemorySummary?: string;
};

type UsagePayload = {
  plan: string;
  used: number;
  limit: number | null;
  remaining: number | null;
  vip: boolean;
};

type ChatResponse = {
  error?: string;
  reply?: string;
  usage?: UsagePayload;
  memory?: {
    storedCount: number;
    emotionTag: string | null;
    hints?: string[];
    summary?: string;
  };
};

export function ChatPlayground({
  petId,
  initialMessages,
  initialRemainingLabel,
  initialMemorySummary = '',
}: ChatPlaygroundProps) {
  const [messages, setMessages] = useState(initialMessages);
  const [input, setInput] = useState('');
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [usageLabel, setUsageLabel] = useState(initialRemainingLabel);
  const [memoryHints, setMemoryHints] = useState<string[]>([]);
  const [memorySummary, setMemorySummary] = useState(initialMemorySummary);

  const canSubmit = useMemo(() => input.trim().length > 0 && !loading, [input, loading]);
  const memoriesHref = petId ? `/memories?pet_id=${encodeURIComponent(petId)}` : '/memories';

  async function handleSubmit(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    if (!canSubmit) return;

    const message = input.trim();
    setLoading(true);
    setError(null);
    setMemoryHints([]);
    setMessages((current) => [...current, { role: 'user', content: message }]);
    setInput('');

    try {
      const response = await fetch('/api/chat', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({ message, petId }),
      });

      const data = (await response.json()) as ChatResponse;

      if (!response.ok || !data.reply) {
        throw new Error(data.error || 'Chat request failed. Please try again.');
      }

      setMessages((current) => [...current, { role: 'assistant', content: data.reply! }]);

      if (data.usage) {
        const label = data.usage.vip ? 'VIP — Unlimited Chat' : `${data.usage.remaining ?? 0} / ${data.usage.limit ?? 10} remaining today`;
        setUsageLabel(label);
      }

      if (data.memory?.hints?.length) {
        setMemoryHints(data.memory.hints);
      }

      if (data.memory?.summary) {
        setMemorySummary(data.memory.summary);
      }
    } catch (submitError) {
      const messageText = submitError instanceof Error ? submitError.message : 'Chat request failed. Please try again.';
      setError(messageText);
    } finally {
      setLoading(false);
    }
  }

  return (
    <div>
      <div className='flex flex-wrap items-center gap-3'>
        <div className='rounded-full border border-black/5 bg-white px-3 py-2 text-xs font-bold'>{usageLabel}</div>
        <a href={memoriesHref} className='rounded-full border border-orange-200 bg-orange-50 px-3 py-2 text-xs font-bold text-orange-900 transition hover:bg-orange-100'>
          Open Pet Memory Page
        </a>
      </div>

      {memorySummary ? (
        <div className='mt-4 rounded-[24px] border border-orange-100 bg-gradient-to-r from-amber-50 to-rose-50 px-4 py-3'>
          <div className='text-xs font-bold uppercase tracking-[0.18em] text-orange-700'>Companionship Summary</div>
          <div className='mt-2 whitespace-pre-line text-sm leading-7 text-slate-700'>{memorySummary}</div>
        </div>
      ) : null}

      {memoryHints.length ? (
        <div className='mt-4 rounded-[24px] border border-emerald-100 bg-emerald-50 px-4 py-3'>
          <div className='text-xs font-bold uppercase tracking-[0.18em] text-emerald-700'>New Memory Triggers</div>
          <div className='mt-3 flex flex-wrap gap-2'>
            {memoryHints.map((hint, index) => (
              <span key={`${hint}-${index}`} className='rounded-full bg-white px-3 py-2 text-xs font-semibold text-emerald-900 shadow-sm shadow-emerald-100'>
                Remembered: {hint}
              </span>
            ))}
          </div>
        </div>
      ) : null}

      <div className='mt-5 grid gap-3'>
        {messages.map((message, index) => (
          <div key={`${message.role}-${index}`} className={message.role === 'user' ? 'chat-bubble-user' : 'chat-bubble-ai'}>
            {message.content}
          </div>
        ))}
      </div>

      {error ? <div className='mt-4 rounded-2xl bg-rose-50 px-4 py-3 text-sm font-bold text-rose-800'>{error}</div> : null}

      <form className='mt-5 flex gap-3' onSubmit={handleSubmit}>
        <input
          className='input-shell rounded-full'
          type='text'
          placeholder='Type a message, e.g. I am feeling a little tired today'
          value={input}
          onChange={(event) => setInput(event.target.value)}
        />
        <button className='brand-button whitespace-nowrap disabled:cursor-not-allowed disabled:opacity-60' disabled={!canSubmit}>
          {loading ? 'Sending...' : 'Send'}
        </button>
      </form>
    </div>
  );
}