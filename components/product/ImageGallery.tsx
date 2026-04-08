'use client';

import { useState, useRef, useEffect } from 'react';
import Image from 'next/image';
import { ChevronLeft, ChevronRight, ZoomIn, Play } from 'lucide-react';

type MediaItem = { type: 'image'; url: string } | { type: 'video'; url: string };

interface ImageGalleryProps {
  images: string[];
  videos?: string[];
  altBase: string;
}

export default function ImageGallery({ images, videos = [], altBase }: ImageGalleryProps) {
  const media: MediaItem[] = [
    ...videos.map((url) => ({ type: 'video' as const, url })),
    ...images.map((url) => ({ type: 'image' as const, url })),
  ];

  const [activeIdx, setActiveIdx] = useState(0);
  const [lightbox, setLightbox] = useState(false);
  const videoRef = useRef<HTMLVideoElement>(null);

  useEffect(() => {
    videoRef.current?.play().catch(() => {});
  }, [activeIdx]);

  const prev = () => setActiveIdx((i) => (i - 1 + media.length) % media.length);
  const next = () => setActiveIdx((i) => (i + 1) % media.length);

  const current = media[activeIdx];

  if (media.length === 0) return null;

  return (
    <>
      <div className="flex flex-col gap-4">
        {/* Main display */}
        <div
          className={`relative aspect-square rounded-2xl overflow-hidden bg-stone-50 group ${current.type === 'image' ? 'cursor-zoom-in' : ''}`}
          onClick={() => current.type === 'image' && setLightbox(true)}
        >
          {current.type === 'video' ? (
            <video
              ref={videoRef}
              key={current.url}
              src={current.url}
              autoPlay
              muted
              loop
              playsInline
              className="w-full h-full object-cover"
            />
          ) : (
            <>
              <Image
                src={current.url}
                alt={`${altBase} ${activeIdx + 1}`}
                fill
                sizes="(max-width: 768px) 100vw, 50vw"
                className="object-cover transition-transform duration-500 group-hover:scale-105"
                priority={activeIdx === 0}
              />
              <div className="absolute inset-0 bg-black/0 group-hover:bg-black/10 transition-colors flex items-center justify-center">
                <ZoomIn size={28} className="text-white opacity-0 group-hover:opacity-100 transition-opacity drop-shadow" />
              </div>
            </>
          )}

          {media.length > 1 && (
            <>
              <button
                onClick={(e) => { e.stopPropagation(); prev(); }}
                className="absolute left-3 top-1/2 -translate-y-1/2 w-9 h-9 rounded-full bg-white/80 backdrop-blur-sm flex items-center justify-center hover:bg-white transition-colors shadow-sm"
              >
                <ChevronLeft size={18} />
              </button>
              <button
                onClick={(e) => { e.stopPropagation(); next(); }}
                className="absolute right-3 top-1/2 -translate-y-1/2 w-9 h-9 rounded-full bg-white/80 backdrop-blur-sm flex items-center justify-center hover:bg-white transition-colors shadow-sm"
              >
                <ChevronRight size={18} />
              </button>
            </>
          )}

          {/* Dots */}
          <div className="absolute bottom-3 left-1/2 -translate-x-1/2 flex gap-1.5">
            {media.map((_, i) => (
              <button
                key={i}
                onClick={(e) => { e.stopPropagation(); setActiveIdx(i); }}
                className={`w-2 h-2 rounded-full transition-all ${i === activeIdx ? 'bg-white scale-125' : 'bg-white/50'}`}
              />
            ))}
          </div>
        </div>

        {/* Thumbnails */}
        {media.length > 1 && (
          <div className="flex gap-3 overflow-x-auto pb-1">
            {media.map((item, i) => (
              <button
                key={i}
                onClick={() => setActiveIdx(i)}
                className={`shrink-0 w-20 h-20 rounded-xl overflow-hidden border-2 transition-all relative ${
                  i === activeIdx ? 'border-rose-600 scale-105' : 'border-stone-200 hover:border-rose-300'
                }`}
              >
                {item.type === 'video' ? (
                  <>
                    <video src={item.url} className="w-full h-full object-cover" muted playsInline preload="metadata" />
                    <div className="absolute inset-0 flex items-center justify-center bg-black/20">
                      <Play size={16} className="text-white fill-white" />
                    </div>
                  </>
                ) : (
                  <Image
                    src={item.url}
                    alt={`${altBase} thumbnail ${i + 1}`}
                    width={80}
                    height={80}
                    className="w-full h-full object-cover"
                  />
                )}
              </button>
            ))}
          </div>
        )}
      </div>

      {/* Lightbox */}
      {lightbox && (
        <div
          className="fixed inset-0 z-100 bg-black/90 flex items-center justify-center p-4"
          onClick={() => setLightbox(false)}
        >
          <button
            className="absolute top-4 right-4 w-10 h-10 rounded-full bg-white/10 text-white flex items-center justify-center hover:bg-white/20 transition-colors text-xl"
            onClick={() => setLightbox(false)}
          >
            ✕
          </button>
          <div className="relative w-full max-w-3xl aspect-square" onClick={(e) => e.stopPropagation()}>
            {current.type === 'video' ? (
              <video
                src={current.url}
                autoPlay
                muted
                loop
                playsInline
                controls
                className="w-full h-full object-contain"
              />
            ) : (
              <Image
                src={current.url}
                alt={`${altBase} ${activeIdx + 1}`}
                fill
                className="object-contain"
              />
            )}
            {media.length > 1 && (
              <>
                <button onClick={prev} className="absolute left-2 top-1/2 -translate-y-1/2 w-10 h-10 rounded-full bg-white/10 text-white flex items-center justify-center hover:bg-white/20">
                  <ChevronLeft size={20} />
                </button>
                <button onClick={next} className="absolute right-2 top-1/2 -translate-y-1/2 w-10 h-10 rounded-full bg-white/10 text-white flex items-center justify-center hover:bg-white/20">
                  <ChevronRight size={20} />
                </button>
              </>
            )}
          </div>
        </div>
      )}
    </>
  );
}
