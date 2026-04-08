'use client';

import { useRef, useState, useEffect } from 'react';
import { useTranslations } from 'next-intl';
import { Link } from '@/i18n/navigation';
import { ChevronDown, Play, Pause } from 'lucide-react';

export default function VideoHero() {
  const t = useTranslations('home.hero');
  const videoRef = useRef<HTMLVideoElement>(null);
  const [playing, setPlaying] = useState(true);
  const [loaded, setLoaded] = useState(false);

  useEffect(() => {
    const v = videoRef.current;
    if (!v) return;
    const onCanPlay = () => setLoaded(true);
    v.addEventListener('canplay', onCanPlay);
    return () => v.removeEventListener('canplay', onCanPlay);
  }, []);

  const togglePlay = () => {
    const v = videoRef.current;
    if (!v) return;
    if (playing) { v.pause(); setPlaying(false); }
    else { v.play(); setPlaying(true); }
  };

  return (
    <section className="relative w-full h-dvh min-h-150 overflow-hidden">
      {/* Gradient fallback / overlay */}
      <div className="absolute inset-0 bg-linear-to-br from-rose-950 via-stone-900 to-rose-900" />

      {/* Video */}
      <video
        ref={videoRef}
        src="/videos/hero.mp4"
        autoPlay
        muted
        loop
        playsInline
        className={`absolute inset-0 w-full h-full object-cover transition-opacity duration-700 ${
          loaded ? 'opacity-60' : 'opacity-0'
        }`}
      />

      {/* Dark overlay for text contrast */}
      <div className="absolute inset-0 bg-linear-to-b from-black/40 via-black/20 to-black/60" />

      {/* Decorative circles */}
      <div className="absolute top-1/4 right-1/4 w-64 h-64 rounded-full bg-rose-600/20 blur-3xl pointer-events-none" />
      <div className="absolute bottom-1/3 left-1/5 w-80 h-80 rounded-full bg-amber-400/10 blur-3xl pointer-events-none" />

      {/* Content */}
      <div className="relative z-10 flex flex-col items-center justify-center h-full text-center px-4 sm:px-8">
        <div className="animate-fade-in-up" style={{ animationDelay: '0.1s' }}>
          <p className="text-rose-300 text-sm sm:text-base tracking-[0.25em] uppercase font-medium mb-4">
            Morena Cosmetics
          </p>
        </div>
        <h1
          className="text-white text-4xl sm:text-6xl lg:text-7xl font-bold leading-tight mb-6 animate-fade-in-up"
          style={{ fontFamily: 'var(--font-display)', animationDelay: '0.2s' }}
        >
          {t('title')}
        </h1>
        <p
          className="text-stone-300 text-lg sm:text-xl max-w-2xl mx-auto mb-10 leading-relaxed animate-fade-in-up"
          style={{ animationDelay: '0.35s' }}
        >
          {t('subtitle')}
        </p>
        <div
          className="flex flex-col sm:flex-row gap-4 items-center animate-fade-in-up"
          style={{ animationDelay: '0.5s' }}
        >
          <Link
            href="/catalog"
            className="bg-rose-600 hover:bg-rose-700 active:scale-95 text-white font-semibold px-8 py-3.5 rounded-full text-sm sm:text-base transition-all duration-200 shadow-lg shadow-rose-900/40"
          >
            {t('cta')}
          </Link>
          <Link
            href="/about"
            className="border border-white/40 hover:border-white/80 text-white font-medium px-8 py-3.5 rounded-full text-sm sm:text-base transition-all duration-200 backdrop-blur-sm"
          >
            {t('story')}
          </Link>
        </div>
      </div>

      {/* Video play/pause */}
      <button
        onClick={togglePlay}
        className="absolute bottom-8 right-8 z-10 w-10 h-10 rounded-full bg-white/20 backdrop-blur-sm border border-white/30 flex items-center justify-center text-white hover:bg-white/30 transition-colors"
        aria-label={playing ? 'Pause video' : 'Play video'}
      >
        {playing ? <Pause size={16} /> : <Play size={16} />}
      </button>

      {/* Scroll cue */}
      <div className="absolute bottom-8 left-1/2 -translate-x-1/2 z-10 flex flex-col items-center gap-2 animate-fade-in" style={{ animationDelay: '1s' }}>
        <span className="text-white/60 text-xs tracking-widest uppercase">{t('scroll')}</span>
        <ChevronDown size={18} className="text-white/60 animate-bounce" />
      </div>
    </section>
  );
}
