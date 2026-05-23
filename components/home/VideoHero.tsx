'use client';

import { useRef, useState, useEffect, useCallback } from 'react';
import { useTranslations } from 'next-intl';
import { Link } from '@/i18n/navigation';
import { ChevronDown, Play, Pause } from 'lucide-react';

const VIDEO_SRC = '/videos/intro.mp4';

export default function VideoHero() {
  const t = useTranslations('home.hero');
  const videoRef = useRef<HTMLVideoElement>(null);
  const [playing, setPlaying] = useState(true);
  const [ready, setReady] = useState(false);
  const [failed, setFailed] = useState(false);

  const tryPlay = useCallback(async () => {
    const v = videoRef.current;
    if (!v) return;
    v.muted = true;
    try {
      await v.play();
      setPlaying(true);
    } catch {
      setPlaying(false);
    }
  }, []);

  const markReady = useCallback(() => {
    setReady(true);
    setFailed(false);
    void tryPlay();
  }, [tryPlay]);

  useEffect(() => {
    const v = videoRef.current;
    if (!v) return;

    v.muted = true;

    if (v.readyState >= HTMLMediaElement.HAVE_CURRENT_DATA) {
      markReady();
    }

    const onLoadedData = () => markReady();
    const onError = () => {
      setFailed(true);
      setReady(false);
      console.error('[VideoHero] Failed to load', VIDEO_SRC);
    };

    v.addEventListener('loadeddata', onLoadedData);
    v.addEventListener('error', onError);

    void tryPlay();

    return () => {
      v.removeEventListener('loadeddata', onLoadedData);
      v.removeEventListener('error', onError);
    };
  }, [markReady, tryPlay]);

  const togglePlay = () => {
    const v = videoRef.current;
    if (!v) return;
    if (playing) {
      v.pause();
      setPlaying(false);
    } else {
      void tryPlay();
    }
  };

  return (
    <section className="relative w-full h-dvh min-h-150 overflow-hidden">
      {/* Fallback gradient (always visible behind video) */}
      <div className="absolute inset-0 z-0 bg-linear-to-br from-rose-950 via-stone-900 to-rose-900" />

      {/* Background video — above gradient, below text overlay */}
      <video
        ref={videoRef}
        src={VIDEO_SRC}
        autoPlay
        muted
        loop
        playsInline
        preload="auto"
        aria-hidden={failed}
        className={`absolute inset-0 z-[1] h-full w-full object-cover transition-opacity duration-700 ${
          ready && !failed ? 'opacity-100' : 'opacity-0'
        }`}
        onLoadedData={markReady}
        onError={() => setFailed(true)}
      />

      {/* Dark overlay for text contrast */}
      <div className="absolute inset-0 z-[2] bg-linear-to-b from-black/40 via-black/20 to-black/60" />

      {/* Decorative circles */}
      <div className="pointer-events-none absolute top-1/4 right-1/4 z-[2] h-64 w-64 rounded-full bg-rose-600/20 blur-3xl" />
      <div className="pointer-events-none absolute bottom-1/3 left-1/5 z-[2] h-80 w-80 rounded-full bg-amber-400/10 blur-3xl" />

      {/* Content */}
      <div className="relative z-10 flex h-full flex-col items-center justify-center px-4 text-center sm:px-8">
        <div className="animate-fade-in-up" style={{ animationDelay: '0.1s' }}>
          <p className="mb-4 text-sm font-medium tracking-[0.25em] text-rose-300 uppercase sm:text-base">
            Morena Cosmetics
          </p>
        </div>
        <h1
          className="animate-fade-in-up mb-6 text-4xl leading-tight font-bold text-white sm:text-6xl lg:text-7xl"
          style={{ fontFamily: 'var(--font-display)', animationDelay: '0.2s' }}
        >
          {t('title')}
        </h1>
        <p
          className="animate-fade-in-up mx-auto mb-10 max-w-2xl text-lg leading-relaxed text-stone-300 sm:text-xl"
          style={{ animationDelay: '0.35s' }}
        >
          {t('subtitle')}
        </p>
        <div
          className="animate-fade-in-up flex flex-col items-center gap-4 sm:flex-row"
          style={{ animationDelay: '0.5s' }}
        >
          <Link
            href="/catalog"
            className="rounded-full bg-rose-600 px-8 py-3.5 text-sm font-semibold text-white shadow-lg shadow-rose-900/40 transition-all duration-200 hover:bg-rose-700 active:scale-95 sm:text-base"
          >
            {t('cta')}
          </Link>
          <Link
            href="/about"
            className="rounded-full border border-white/40 px-8 py-3.5 text-sm font-medium text-white backdrop-blur-sm transition-all duration-200 hover:border-white/80 sm:text-base"
          >
            {t('story')}
          </Link>
        </div>
      </div>

      {/* Play / pause — only when video loaded */}
      {!failed && (
        <button
          type="button"
          onClick={togglePlay}
          className="absolute right-8 bottom-8 z-10 flex h-10 w-10 items-center justify-center rounded-full border border-white/30 bg-white/20 text-white backdrop-blur-sm transition-colors hover:bg-white/30"
          aria-label={playing ? 'Pause video' : 'Play video'}
        >
          {playing ? <Pause size={16} /> : <Play size={16} />}
        </button>
      )}

      {/* Scroll cue */}
      <div
        className="animate-fade-in absolute bottom-8 left-1/2 z-10 flex -translate-x-1/2 flex-col items-center gap-2"
        style={{ animationDelay: '1s' }}
      >
        <span className="text-xs tracking-widest text-white/60 uppercase">{t('scroll')}</span>
        <ChevronDown size={18} className="animate-bounce text-white/60" />
      </div>
    </section>
  );
}
