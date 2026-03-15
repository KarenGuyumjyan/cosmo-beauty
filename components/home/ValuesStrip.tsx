import { useTranslations } from 'next-intl';

const items = [
  { icon: '✨', key: 'quality' },
  { icon: '🌿', key: 'natural' },
  { icon: '🔬', key: 'derma' },
  { icon: '⚡️', key: 'shipping' },
] as const;

export default function ValuesStrip() {
  const t = useTranslations('home.values');

  return (
    <section className="py-20 bg-stone-900 text-white">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-8">
          {items.map(({ icon, key }) => (
            <div key={key} className="text-center">
              <span className="text-4xl mb-4 block">{icon}</span>
              <h3
                className="font-bold text-white mb-2"
                style={{ fontFamily: 'var(--font-display)' }}
              >
                {t(`${key}.title`)}
              </h3>
              <p className="text-stone-400 text-sm leading-relaxed">{t(`${key}.desc`)}</p>
            </div>
          ))}
        </div>
      </div>
    </section>
  );
}
