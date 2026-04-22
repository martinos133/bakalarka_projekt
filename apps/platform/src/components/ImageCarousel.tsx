'use client'

import { useCallback, useEffect, useState } from 'react'
import { ChevronLeft, ChevronRight, X, ZoomIn } from 'lucide-react'

interface ImageCarouselProps {
  images: string[]
  title: string
}

export default function ImageCarousel({ images, title }: ImageCarouselProps) {
  const [currentIndex, setCurrentIndex] = useState(0)
  const [lightbox, setLightbox] = useState(false)

  const goToPrevious = useCallback(() => {
    setCurrentIndex((i) => (i === 0 ? images.length - 1 : i - 1))
  }, [images.length])

  const goToNext = useCallback(() => {
    setCurrentIndex((i) => (i === images.length - 1 ? 0 : i + 1))
  }, [images.length])

  useEffect(() => {
    if (!lightbox) return
    const onKey = (e: KeyboardEvent) => {
      if (e.key === 'Escape') setLightbox(false)
      if (e.key === 'ArrowLeft') goToPrevious()
      if (e.key === 'ArrowRight') goToNext()
    }
    document.addEventListener('keydown', onKey)
    return () => document.removeEventListener('keydown', onKey)
  }, [lightbox, goToPrevious, goToNext])

  useEffect(() => {
    if (!lightbox) return
    const prev = document.body.style.overflow
    document.body.style.overflow = 'hidden'
    return () => {
      document.body.style.overflow = prev
    }
  }, [lightbox])

  if (images.length === 0) return null

  const multi = images.length > 1

  return (
    <>
      <div className="mb-8">
        {/* Main image */}
        <div
          className="group relative aspect-[16/10] cursor-zoom-in overflow-hidden rounded-2xl border border-white/[0.08] bg-transparent"
          onClick={() => setLightbox(true)}
        >
          <img
            src={images[currentIndex]}
            alt={`${title} - obrázok ${currentIndex + 1}`}
            className="h-full w-full object-contain transition-transform duration-300 group-hover:scale-[1.02]"
          />

          {/* Hover overlay */}
          <div className="pointer-events-none absolute inset-0 bg-gradient-to-t from-black/30 via-transparent to-transparent opacity-0 transition-opacity duration-300 group-hover:opacity-100" />

          {/* Zoom hint */}
          <span className="pointer-events-none absolute bottom-4 right-4 flex items-center gap-1.5 rounded-lg bg-black/55 px-3 py-1.5 text-xs font-medium text-white opacity-0 shadow-sm backdrop-blur-md transition-opacity duration-300 group-hover:opacity-100">
            <ZoomIn className="h-3.5 w-3.5" />
            Zväčšiť
          </span>

          {/* Arrows */}
          {multi && (
            <>
              <button
                onClick={(e) => {
                  e.stopPropagation()
                  goToPrevious()
                }}
                className="absolute left-3 top-1/2 z-10 -translate-y-1/2 rounded-full border border-white/20 bg-black/50 p-2 text-white shadow-md backdrop-blur-md transition-all hover:scale-105 hover:bg-black/65"
                aria-label="Predchádzajúci obrázok"
              >
                <ChevronLeft className="h-5 w-5" />
              </button>
              <button
                onClick={(e) => {
                  e.stopPropagation()
                  goToNext()
                }}
                className="absolute right-3 top-1/2 z-10 -translate-y-1/2 rounded-full border border-white/20 bg-black/50 p-2 text-white shadow-md backdrop-blur-md transition-all hover:scale-105 hover:bg-black/65"
                aria-label="Ďalší obrázok"
              >
                <ChevronRight className="h-5 w-5" />
              </button>
            </>
          )}

          {/* Counter */}
          {multi && (
            <div className="absolute bottom-4 left-4 z-10 rounded-lg bg-black/55 px-3 py-1.5 text-xs font-semibold tabular-nums text-white shadow-sm backdrop-blur-md">
              {currentIndex + 1} / {images.length}
            </div>
          )}
        </div>

        {/* Thumbnails */}
        {multi && (
          <div className="mt-3 flex gap-2 overflow-x-auto pb-1 scrollbar-hide">
            {images.map((image, index) => (
              <button
                key={index}
                onClick={() => setCurrentIndex(index)}
                className={`group/thumb relative flex-shrink-0 overflow-hidden rounded-xl transition-all duration-200 ${
                  index === currentIndex
                    ? 'ring-2 ring-accent ring-offset-2 ring-offset-dark'
                    : 'opacity-60 hover:opacity-100'
                }`}
              >
                <img
                  src={image}
                  alt={`${title} - náhľad ${index + 1}`}
                  className="h-[72px] w-[96px] object-cover transition-transform duration-200 group-hover/thumb:scale-105"
                />
              </button>
            ))}
          </div>
        )}
      </div>

      {/* Lightbox */}
      {lightbox && (
        <div
          className="fixed inset-0 z-[1000] flex items-center justify-center bg-transparent p-4"
          onClick={() => setLightbox(false)}
          role="presentation"
        >
          <button
            type="button"
            onClick={() => setLightbox(false)}
            className="absolute right-3 top-3 z-20 rounded-full border border-white/15 bg-black/50 p-2 text-white shadow-lg backdrop-blur-md transition-colors hover:bg-black/65 sm:right-5 sm:top-5"
            aria-label="Zavrieť"
          >
            <X className="h-6 w-6" />
          </button>

          {multi && (
            <>
              <button
                type="button"
                onClick={(e) => {
                  e.stopPropagation()
                  goToPrevious()
                }}
                className="absolute left-2 top-1/2 z-20 -translate-y-1/2 rounded-full border border-white/15 bg-black/50 p-3 text-white shadow-lg backdrop-blur-md transition-colors hover:bg-black/65 sm:left-4"
                aria-label="Predchádzajúci obrázok"
              >
                <ChevronLeft className="h-6 w-6" />
              </button>
              <button
                type="button"
                onClick={(e) => {
                  e.stopPropagation()
                  goToNext()
                }}
                className="absolute right-2 top-1/2 z-20 -translate-y-1/2 rounded-full border border-white/15 bg-black/50 p-3 text-white shadow-lg backdrop-blur-md transition-colors hover:bg-black/65 sm:right-4"
                aria-label="Ďalší obrázok"
              >
                <ChevronRight className="h-6 w-6" />
              </button>
            </>
          )}

          <img
            src={images[currentIndex]}
            alt={`${title} - obrázok ${currentIndex + 1}`}
            className="relative z-10 max-h-[min(92vh,100%)] max-w-[min(96vw,1400px)] rounded-lg object-contain shadow-[0_25px_80px_-12px_rgba(0,0,0,0.45)]"
            onClick={(e) => e.stopPropagation()}
          />

          {multi && (
            <div className="pointer-events-none absolute bottom-4 left-4 z-20 rounded-lg bg-black/50 px-3 py-1.5 text-xs font-semibold tabular-nums text-white shadow-md backdrop-blur-md sm:bottom-6 sm:left-6 sm:px-4 sm:py-2 sm:text-sm">
              {currentIndex + 1} / {images.length}
            </div>
          )}
        </div>
      )}
    </>
  )
}
