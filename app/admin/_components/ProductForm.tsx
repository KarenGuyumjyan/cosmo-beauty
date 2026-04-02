'use client';

import { useState, useRef } from 'react';
import { categories } from '@/lib/data';
import type { Product as DbProduct } from '@prisma/client';
import { ImagePlus, Film, X, Loader2, GripVertical } from 'lucide-react';

interface ProductFormProps {
  action: (formData: FormData) => Promise<void>;
  product?: DbProduct;
  submitLabel: string;
}

const CATEGORY_OPTIONS = categories.map((c) => ({ value: c.value, label: c.label.en }));

async function uploadFiles(files: FileList): Promise<string[]> {
  const urls: string[] = [];
  for (const file of Array.from(files)) {
    const body = new FormData();
    body.append('file', file);
    const res = await fetch('/api/blob/upload', { method: 'POST', body });
    if (!res.ok) throw new Error('Upload failed');
    const data = await res.json();
    urls.push(data.url);
  }
  return urls;
}

export default function ProductForm({ action, product, submitLabel }: ProductFormProps) {
  const v = product;

  const [images, setImages] = useState<string[]>(v?.images ?? []);
  const [videos, setVideos] = useState<string[]>(v?.videos ?? []);

  const [uploadingImages, setUploadingImages] = useState(false);
  const [uploadingVideos, setUploadingVideos] = useState(false);
  const [imageError, setImageError] = useState('');
  const [videoError, setVideoError] = useState('');

  const [dragIdx, setDragIdx] = useState<number | null>(null);
  const [dragOverIdx, setDragOverIdx] = useState<number | null>(null);

  const imageRef = useRef<HTMLInputElement>(null);
  const videoRef = useRef<HTMLInputElement>(null);

  async function handleImageFiles(files: FileList | null) {
    if (!files || files.length === 0) return;
    setUploadingImages(true);
    setImageError('');
    try {
      const urls = await uploadFiles(files);
      setImages((prev) => [...prev, ...urls]);
    } catch {
      setImageError('Image upload failed. Please try again.');
    } finally {
      setUploadingImages(false);
      if (imageRef.current) imageRef.current.value = '';
    }
  }

  async function handleVideoFiles(files: FileList | null) {
    if (!files || files.length === 0) return;
    setUploadingVideos(true);
    setVideoError('');
    try {
      const urls = await uploadFiles(files);
      setVideos((prev) => [...prev, ...urls]);
    } catch {
      setVideoError('Video upload failed. Please try again.');
    } finally {
      setUploadingVideos(false);
      if (videoRef.current) videoRef.current.value = '';
    }
  }

  function handleImageDrop(targetIdx: number) {
    if (dragIdx === null || dragIdx === targetIdx) return;
    setImages((prev) => {
      const next = [...prev];
      const [moved] = next.splice(dragIdx, 1);
      next.splice(targetIdx, 0, moved);
      return next;
    });
    setDragIdx(null);
    setDragOverIdx(null);
  }

  const uploading = uploadingImages || uploadingVideos;

  return (
    <form action={action} className="space-y-8">
      <input type="hidden" name="images" value={images.join('\n')} />
      <input type="hidden" name="videos" value={videos.join('\n')} />

      {/* Basic info */}
      <div className="bg-white rounded-2xl border border-stone-100 p-6">
        <h2 className="font-semibold text-stone-900 mb-5">Basic Info</h2>
        <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
          <div>
            <label className="label">SKU</label>
            <input name="sku" required defaultValue={v?.sku} className="input" placeholder="CSM-XX-001" />
          </div>
          <div>
            <label className="label">Category</label>
            <select name="category" required defaultValue={v?.category} className="input">
              {CATEGORY_OPTIONS.map((c) => (
                <option key={c.value} value={c.value}>{c.label}</option>
              ))}
            </select>
          </div>
          <div>
            <label className="label">Size</label>
            <input name="size" required defaultValue={v?.size} className="input" placeholder="e.g. 5g, 5ml, 3 pcs" />
          </div>
          <div>
            <label className="label">Price (₽)</label>
            <input name="price" type="number" required min={0} defaultValue={v?.price} className="input" />
          </div>
          <div>
            <label className="label">
              Discounted Price (₽){' '}
              <span className="text-stone-400 font-normal">optional</span>
            </label>
            <input name="discountedPrice" type="number" min={0} defaultValue={v?.discountedPrice ?? ''} className="input" />
          </div>
        </div>

        <div className="flex flex-wrap gap-6 mt-5">
          {(['inStock', 'featured', 'bestseller'] as const).map((flag) => (
            <label key={flag} className="flex items-center gap-2.5 cursor-pointer">
              <input
                name={flag}
                type="checkbox"
                defaultChecked={v ? Boolean(v[flag]) : flag === 'inStock'}
                className="w-4 h-4 accent-rose-600"
              />
              <span className="text-sm font-medium text-stone-700 capitalize">{flag}</span>
            </label>
          ))}
        </div>
      </div>

      {/* Images (drag-and-drop reorder — first image = main) */}
      <div className="bg-white rounded-2xl border border-stone-100 p-6">
        <h2 className="font-semibold text-stone-900 mb-1">Images</h2>
        <p className="text-stone-400 text-xs mb-4">
          Upload JPG / PNG / WebP. Drag to reorder — first image is the main product image.
        </p>

        {images.length > 0 && (
          <div className="flex flex-wrap gap-3 mb-4">
            {images.map((url, i) => (
              <div
                key={url}
                draggable
                onDragStart={() => setDragIdx(i)}
                onDragOver={(e) => { e.preventDefault(); setDragOverIdx(i); }}
                onDragLeave={() => setDragOverIdx(null)}
                onDrop={(e) => { e.preventDefault(); handleImageDrop(i); }}
                onDragEnd={() => { setDragIdx(null); setDragOverIdx(null); }}
                className={`relative group w-24 h-24 rounded-xl overflow-hidden border-2 bg-stone-50 cursor-grab active:cursor-grabbing transition-all ${
                  dragOverIdx === i && dragIdx !== i
                    ? 'border-rose-500 scale-105'
                    : i === 0
                    ? 'border-rose-400'
                    : 'border-stone-200'
                } ${dragIdx === i ? 'opacity-40' : ''}`}
              >
                {/* eslint-disable-next-line @next/next/no-img-element */}
                <img src={url} alt={`image ${i + 1}`} className="w-full h-full object-cover pointer-events-none" />
                <div className="absolute top-1 left-1 bg-black/50 text-white rounded p-0.5 opacity-0 group-hover:opacity-100 transition-opacity">
                  <GripVertical size={12} />
                </div>
                {i === 0 && (
                  <span className="absolute bottom-0 left-0 right-0 text-center text-[10px] font-semibold bg-rose-600 text-white py-0.5">
                    Main
                  </span>
                )}
                <button
                  type="button"
                  onClick={() => setImages((prev) => prev.filter((u) => u !== url))}
                  className="absolute top-1 right-1 bg-black/60 text-white rounded-full p-0.5 opacity-0 group-hover:opacity-100 transition-opacity"
                >
                  <X size={12} />
                </button>
              </div>
            ))}
          </div>
        )}

        <div>
          <input
            ref={imageRef}
            type="file"
            accept="image/jpeg,image/png,image/webp"
            multiple
            className="hidden"
            onChange={(e) => handleImageFiles(e.target.files)}
          />
          <button
            type="button"
            onClick={() => imageRef.current?.click()}
            disabled={uploadingImages}
            className="inline-flex items-center gap-2 px-4 py-2.5 border-2 border-dashed border-stone-300 hover:border-rose-400 rounded-xl text-sm text-stone-500 hover:text-rose-600 transition-colors disabled:opacity-50"
          >
            {uploadingImages ? (
              <><Loader2 size={16} className="animate-spin" /> Uploading…</>
            ) : (
              <><ImagePlus size={16} /> Choose images</>
            )}
          </button>
          {imageError && <p className="mt-2 text-xs text-red-600">{imageError}</p>}
        </div>
      </div>

      {/* Videos */}
      <MediaSection
        title="Videos"
        hint="Upload MP4 / WebM / MOV (max 50 MB). Used for product demo."
        accept="video/mp4,video/webm,video/quicktime"
        items={videos}
        uploading={uploadingVideos}
        error={videoError}
        fileRef={videoRef}
        onFiles={handleVideoFiles}
        onRemove={(url) => setVideos((prev) => prev.filter((u) => u !== url))}
        icon={<Film size={16} />}
        chooseLabel="Choose videos"
        renderPreview={(url, i) => (
          <div key={url} className="relative group w-48 h-28 rounded-xl overflow-hidden border border-stone-200 bg-black">
            <video src={url} className="w-full h-full object-cover" muted playsInline preload="metadata" />
            <button
              type="button"
              onClick={() => setVideos((prev) => prev.filter((u) => u !== url))}
              className="absolute top-1 right-1 bg-black/60 text-white rounded-full p-0.5 opacity-0 group-hover:opacity-100 transition-opacity"
            >
              <X size={12} />
            </button>
            <span className="absolute bottom-1 left-1 text-[10px] font-medium bg-black/60 text-white px-1.5 py-0.5 rounded">
              Video {i + 1}
            </span>
          </div>
        )}
      />

      {/* English */}
      <LocalizedSection lang="English" prefix="En" product={v} />
      {/* Armenian */}
      <LocalizedSection lang="Armenian (HY)" prefix="Hy" product={v} />
      {/* Russian */}
      <LocalizedSection lang="Russian (RU)" prefix="Ru" product={v} />

      {/* Submit */}
      <div className="flex gap-3">
        <button
          type="submit"
          disabled={uploading}
          className="bg-rose-600 hover:bg-rose-700 disabled:opacity-50 text-white font-semibold px-8 py-3 rounded-xl transition-colors"
        >
          {submitLabel}
        </button>
        <a
          href="/admin/products"
          className="px-8 py-3 border border-stone-200 text-stone-600 font-medium rounded-xl hover:bg-stone-50 transition-colors"
        >
          Cancel
        </a>
      </div>
    </form>
  );
}

/* ── Reusable media upload section ────────────────────────────────────────── */

function MediaSection({
  title,
  hint,
  accept,
  items,
  uploading,
  error,
  fileRef,
  onFiles,
  onRemove,
  icon,
  chooseLabel,
  renderPreview,
}: {
  title: string;
  hint: string;
  accept: string;
  items: string[];
  uploading: boolean;
  error: string;
  fileRef: React.RefObject<HTMLInputElement | null>;
  onFiles: (files: FileList | null) => void;
  onRemove: (url: string) => void;
  icon: React.ReactNode;
  chooseLabel: string;
  renderPreview: (url: string, index: number) => React.ReactNode;
}) {

  return (
    <div className="bg-white rounded-2xl border border-stone-100 p-6">
      <h2 className="font-semibold text-stone-900 mb-1">{title}</h2>
      <p className="text-stone-400 text-xs mb-4">{hint}</p>

      {items.length > 0 && (
        <div className="flex flex-wrap gap-3 mb-4">
          {items.map((url, i) => renderPreview(url, i))}
        </div>
      )}

      <div>
        <input
          ref={fileRef}
          type="file"
          accept={accept}
          multiple
          className="hidden"
          onChange={(e) => onFiles(e.target.files)}
        />
        <button
          type="button"
          onClick={() => fileRef.current?.click()}
          disabled={uploading}
          className="inline-flex items-center gap-2 px-4 py-2.5 border-2 border-dashed border-stone-300 hover:border-rose-400 rounded-xl text-sm text-stone-500 hover:text-rose-600 transition-colors disabled:opacity-50"
        >
          {uploading ? (
            <><Loader2 size={16} className="animate-spin" /> Uploading…</>
          ) : (
            <>{icon} {chooseLabel}</>
          )}
        </button>
        {error && <p className="mt-2 text-xs text-red-600">{error}</p>}
      </div>
    </div>
  );
}

/* ── Localized text fields ────────────────────────────────────────────────── */

function LocalizedSection({
  lang,
  prefix,
  product,
}: {
  lang: string;
  prefix: 'En' | 'Hy' | 'Ru';
  product?: DbProduct;
}) {
  return (
    <div className="bg-white rounded-2xl border border-stone-100 p-6">
      <h2 className="font-semibold text-stone-900 mb-5">{lang}</h2>
      <div className="space-y-4">
        <div>
          <label className="label">Name</label>
          <input
            name={`name${prefix}`}
            required
            defaultValue={(product as unknown as Record<string, string>)?.[`name${prefix}`]}
            className="input"
          />
        </div>
        <div>
          <label className="label">Short Description</label>
          <input
            name={`shortDesc${prefix}`}
            required
            defaultValue={(product as unknown as Record<string, string>)?.[`shortDesc${prefix}`]}
            className="input"
          />
        </div>
        <div>
          <label className="label">Full Description</label>
          <textarea
            name={`description${prefix}`}
            required
            rows={4}
            defaultValue={(product as unknown as Record<string, string>)?.[`description${prefix}`]}
            className="input resize-none"
          />
        </div>
      </div>
    </div>
  );
}
