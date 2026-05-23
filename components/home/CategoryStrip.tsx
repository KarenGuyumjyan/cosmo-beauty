'use client';

import Image from 'next/image';
import { Locale, Category } from '@/lib/types';
import { getCategoryLabel } from '@/lib/data';

interface CategoryItem {
  image: string;
  category: Category;
  href: string;
}

const CATEGORIES: CategoryItem[] = [
  { image: '/categories/cosmetic-sponges.png', category: 'cosmetic_sponges', href: '/catalog?cat=cosmetic_sponges' },
  { image: '/categories/lip-pencil.jpg',       category: 'lip_liner',        href: '/catalog?cat=lip_liner' },
  { image: '/categories/blush.png',            category: 'blush',            href: '/catalog?cat=blush' },
  { image: '/categories/stick.jpg',            category: 'stick',            href: '/catalog?cat=stick' },
  { image: '/categories/highlighter.jpg',      category: 'highlighter',      href: '/catalog?cat=highlighter' },
  { image: '/categories/lip-gloss.jpg',        category: 'lip_gloss',        href: '/catalog?cat=lip_gloss' },
  { image: '/categories/concealer.png',        category: 'concealer',        href: '/catalog?cat=concealer' },
];

interface CategoryStripProps {
  locale: string;
}

export default function CategoryStrip({ locale }: CategoryStripProps) {
  const l = locale as Locale;

  // Duplicate items so the marquee loops seamlessly.
  const items = [...CATEGORIES, ...CATEGORIES];

  return (
    <section className="py-14 overflow-hidden" style={{ background: '#fdf8f0' }}>
      <div className="flex animate-marquee gap-6 md:gap-12" style={{ width: 'max-content' }}>
        {items.map((cat, i) => {
          const label = getCategoryLabel(cat.category, l);
          return (
            <a
              key={`${cat.category}-${i}`}
              href={`/${locale}${cat.href}`}
              className="flex flex-col items-center gap-3 w-[148px] md:w-[180px] bg-white rounded-2xl border border-stone-100 hover:border-rose-200 hover:shadow-lg transition-all group overflow-hidden text-center shrink-0"
            >
              <div className="relative w-full overflow-hidden rounded-t-2xl bg-stone-100" style={{ aspectRatio: '1 / 1' }}>
                <Image
                  src={cat.image}
                  alt={label}
                  fill
                  sizes="(max-width: 768px) 148px, 180px"
                  className="object-cover group-hover:scale-105 transition-transform duration-300"
                />
              </div>
              <span className="pb-3 px-2 text-xs font-semibold text-stone-600 group-hover:text-rose-700 transition-colors">
                {label}
              </span>
            </a>
          );
        })}
      </div>
    </section>
  );
}
