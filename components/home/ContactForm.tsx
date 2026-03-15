'use client';

import { useState } from 'react';
import { useTranslations } from 'next-intl';
import { Phone, User, CheckCircle2 } from 'lucide-react';

const PREFIX = '+7';

function formatPhone(raw: string): string {
  // Strip everything except digits
  const digits = raw.replace(/\D/g, '');
  // Remove leading 7 or 8 if user typed the country code themselves
  const local = digits.startsWith('7') ? digits.slice(1) : digits;
  const d = local.slice(0, 10);

  // Format: +7 (XXX) XXX-XX-XX
  let result = PREFIX;
  if (d.length > 0) result += ' (' + d.slice(0, 3);
  if (d.length >= 3) result += ') ' + d.slice(3, 6);
  if (d.length >= 6) result += '-' + d.slice(6, 8);
  if (d.length >= 8) result += '-' + d.slice(8, 10);
  return result;
}

export default function ContactForm() {
  const t = useTranslations('contactForm');

  const [name, setName] = useState('');
  const [phone, setPhone] = useState('');
  const [submitted, setSubmitted] = useState(false);

  const handlePhoneChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    setPhone(formatPhone(e.target.value));
  };

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!name.trim() || !phone.trim()) return;
    setSubmitted(true);
  };

  return (
    <section className="py-20 bg-gradient-to-br from-rose-50 via-white to-stone-50 relative overflow-hidden">
      {/* Decorative blobs */}
      <div className="absolute -top-24 -right-24 w-72 h-72 bg-rose-100 rounded-full opacity-40 blur-3xl pointer-events-none" />
      <div className="absolute -bottom-24 -left-24 w-72 h-72 bg-pink-100 rounded-full opacity-40 blur-3xl pointer-events-none" />

      <div className="relative max-w-xl mx-auto px-4 text-center">
        <p className="text-rose-500 text-xs tracking-widest uppercase font-semibold mb-3">
          {t('badge')}
        </p>
        <h2
          className="text-3xl sm:text-4xl font-bold text-stone-900 mb-3"
          style={{ fontFamily: 'var(--font-display)' }}
        >
          {t('title')}
        </h2>
        <p className="text-stone-500 text-sm sm:text-base leading-relaxed mb-10">
          {t('subtitle')}
        </p>

        {submitted ? (
          <div className="flex flex-col items-center gap-4 py-10 animate-fade-in">
            <div className="w-16 h-16 rounded-full bg-rose-100 flex items-center justify-center">
              <CheckCircle2 size={36} className="text-rose-500" />
            </div>
            <p className="text-xl font-bold text-stone-800">{t('success')}</p>
            <p className="text-stone-500 text-sm">{t('successSub')}</p>
          </div>
        ) : (
          <form
            onSubmit={handleSubmit}
            className="bg-white rounded-3xl shadow-xl shadow-rose-100/60 border border-rose-100 p-8 flex flex-col gap-4"
          >
            {/* Name */}
            <div className="relative">
              <User
                size={16}
                className="absolute left-4 top-1/2 -translate-y-1/2 text-stone-400 pointer-events-none"
              />
              <input
                type="text"
                required
                value={name}
                onChange={(e) => setName(e.target.value)}
                placeholder={t('namePlaceholder')}
                className="w-full pl-10 pr-4 py-3.5 rounded-xl border border-stone-200 text-sm text-stone-800 placeholder-stone-400 bg-stone-50 focus:outline-none focus:border-rose-400 focus:ring-2 focus:ring-rose-100 transition-colors"
              />
            </div>

            {/* Phone */}
            <div className="relative">
              <Phone
                size={16}
                className="absolute left-4 top-1/2 -translate-y-1/2 text-stone-400 pointer-events-none"
              />
              <input
                type="tel"
                required
                value={phone}
                onChange={handlePhoneChange}
                onFocus={() => { if (!phone) setPhone(PREFIX); }}
                onBlur={() => { if (phone === PREFIX) setPhone(''); }}
                placeholder={`${PREFIX} (___) ___-__-__`}
                maxLength={18}
                className="w-full pl-10 pr-4 py-3.5 rounded-xl border border-stone-200 text-sm text-stone-800 placeholder-stone-400 bg-stone-50 focus:outline-none focus:border-rose-400 focus:ring-2 focus:ring-rose-100 transition-colors"
              />
            </div>

            <button
              type="submit"
              className="mt-2 w-full bg-rose-600 hover:bg-rose-700 active:scale-[.98] text-white font-semibold py-3.5 rounded-xl transition-all shadow-lg shadow-rose-200"
            >
              {t('submit')}
            </button>
          </form>
        )}
      </div>
    </section>
  );
}
