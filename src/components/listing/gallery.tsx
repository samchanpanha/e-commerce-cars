"use client";

import { useState } from "react";
import { CarFront, ChevronLeft, ChevronRight } from "lucide-react";
import { clsx } from "clsx";

export type GalleryImage = { id: string; url: string; alt: string | null };

export function Gallery({ images, title }: { images: GalleryImage[]; title: string }) {
  const [index, setIndex] = useState(0);

  if (!images.length) {
    return (
      <div className="grid aspect-[16/10] w-full place-items-center rounded-2xl border border-ink-200 bg-ink-100 text-ink-400">
        <div className="text-center">
          <CarFront className="mx-auto h-10 w-10" aria-hidden />
          <p className="mt-2 text-xs">No photos supplied</p>
        </div>
      </div>
    );
  }

  const current = images[Math.min(index, images.length - 1)];

  return (
    <div>
      <div className="relative overflow-hidden rounded-2xl border border-ink-200 bg-ink-100">
        {/* eslint-disable-next-line @next/next/no-img-element */}
        <img
          src={current.url}
          alt={current.alt ?? `${title} photo ${index + 1}`}
          className="aspect-[16/10] w-full object-cover"
        />
        {images.length > 1 ? (
          <>
            <button
              type="button"
              onClick={() => setIndex((i) => (i - 1 + images.length) % images.length)}
              className="absolute left-2 top-1/2 grid h-10 w-10 -translate-y-1/2 place-items-center rounded-full bg-white/90 text-ink-900 shadow-md hover:bg-white"
              aria-label="Previous photo"
            >
              <ChevronLeft className="h-5 w-5" />
            </button>
            <button
              type="button"
              onClick={() => setIndex((i) => (i + 1) % images.length)}
              className="absolute right-2 top-1/2 grid h-10 w-10 -translate-y-1/2 place-items-center rounded-full bg-white/90 text-ink-900 shadow-md hover:bg-white"
              aria-label="Next photo"
            >
              <ChevronRight className="h-5 w-5" />
            </button>
            <span className="absolute bottom-2.5 right-2.5 rounded-md bg-ink-950/70 px-2 py-1 text-[11px] font-semibold text-white">
              {index + 1} / {images.length}
            </span>
          </>
        ) : null}
      </div>

      {images.length > 1 ? (
        <div className="mt-2.5 flex gap-2 overflow-x-auto pb-1">
          {images.map((img, i) => (
            <button
              key={img.id}
              type="button"
              onClick={() => setIndex(i)}
              className={clsx(
                "relative h-16 w-24 shrink-0 overflow-hidden rounded-lg border-2",
                i === index ? "border-brand-600" : "border-transparent opacity-75 hover:opacity-100",
              )}
              aria-label={`Show photo ${i + 1}`}
              aria-current={i === index}
            >
              {/* eslint-disable-next-line @next/next/no-img-element */}
              <img src={img.url} alt="" className="h-full w-full object-cover" loading="lazy" />
            </button>
          ))}
        </div>
      ) : null}
    </div>
  );
}
