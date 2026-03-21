'use client';

import Image from 'next/image';
import { Locale } from '@/lib/types';

const CATEGORIES = [
  { image: '/categories/cosmetic-sponges.png', label: { en: 'Sponges',     hy: 'Spongeնер',   ru: 'Спонжи' },   href: '/catalog?cat=cosmetic_sponges' },
  { image: '/categories/lip-pencil.jpg',       label: { en: 'Lip Pencil',  hy: 'Lip Matok',   ru: 'Карандаш' }, href: '/catalog?cat=lip_liner' },
  { image: '/categories/blush.png',            label: { en: 'Blush',       hy: 'Eranger',     ru: 'Румяна' },   href: '/catalog?cat=blush' },
  { image: '/categories/stick.jpg',            label: { en: 'Stick',       hy: 'Stick',       ru: 'Стик' },     href: '/catalog?cat=stick' },
  { image: '/categories/highlighter.jpg',      label: { en: 'Highlighter', hy: 'Lavsatsun',   ru: 'Xайлайтер' }, href: '/catalog?cat=highlighter' },
  { image: '/categories/lip-gloss.jpg',        label: { en: 'Lip Gloss',   hy: 'Lip Blesk',   ru: 'Блеск' },    href: '/catalog?cat=lip_gloss' },
  { image: '/categories/concealer.png',        label: { en: 'Concealer',   hy: 'Konsilyator', ru: 'Консилер' }, href: '/catalog?cat=concealer' },
];

interface CategoryStripProps {
  locale: string;
}

export default function CategoryStrip({ locale }: CategoryStripProps) {
  const l = locale as Locale;

  // Duplicate items so the marquee loops seamlessly
  const items = [...CATEGORIES, ...CATEGORIES];

  return (
    <section className="py-14 overflow-hidden" style={{ background: '#fdf8f0' }}>
      <div className="flex animate-marquee gap-6 md:gap-12" style={{ width: 'max-content' }}>
        {items.map((cat, i) => (
          <a
            key={`${cat.href}-${i}`}
            href={`/${locale}${cat.href}`}
            className="flex flex-col items-center gap-3 w-[148px] md:w-[180px] bg-white rounded-2xl border border-stone-100 hover:border-rose-200 hover:shadow-lg transition-all group overflow-hidden text-center shrink-0"
          >
            <div className="relative w-full overflow-hidden rounded-t-2xl bg-stone-100" style={{ aspectRatio: '1 / 1' }}>
              <Image
                src={cat.image}
                alt={cat.label.en}
                fill
                sizes="148px"
                className="object-cover group-hover:scale-105 transition-transform duration-300"
              />
            </div>
            <span className="pb-3 px-2 text-xs font-semibold text-stone-600 group-hover:text-rose-700 transition-colors">
              {cat.label[l as keyof typeof cat.label]}
            </span>
          </a>
        ))}
      </div>
    </section>
  );
}
