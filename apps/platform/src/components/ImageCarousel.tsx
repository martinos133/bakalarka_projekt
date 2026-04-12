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

  if (images.length === 0) return null

  const multi = images.length > 1

  return (
    <>
      <div className="mb-8">
        {/* Main image */}
        <div
          className="group relative aspect-[16/10] cursor-zoom-in overflow-hidden rounded-2xl border border-white/[0.06] bg-black"
          onClick={() => setLightbox(true)}
        >
          <img
            src={images[currentIndex]}
            alt={`${title} - obrázok ${currentIndex + 1}`}
            className="h-full w-full object-contain transition-transform duration-300 group-hover:scale-[1.02]"
          />

          {/* Hover overlay */}
          <div className="pointer-events-none absolute inset-0 bg-gradient-to-t from-black/40 via-transparent to-transparent opacity-0 transition-opacity duration-300 group-hover:opacity-100" />

          {/* Zoom hint */}
          <span className="pointer-events-none absolute bottom-4 right-4 flex items-center gap-1.5 rounded-lg bg-black/60 px-3 py-1.5 text-xs font-medium text-white/80 opacity-0 backdrop-blur-md transition-opacity duration-300 group-hover:opacity-100">
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
                className="absolute left-3 top-1/2 -translate-y-1/2 rounded-full border border-white/[0.1] bg-black/50 p-2 text-white/80 backdrop-blur-md transition-all hover:scale-105 hover:bg-black/70 hover:text-white"
                aria-label="Predchádzajúci obrázok"
              >
                <ChevronLeft className="h-5 w-5" />
              </button>
              <button
                onClick={(e) => {
                  e.stopPropagation()
                  goToNext()
                }}
                className="absolute right-3 top-1/2 -translate-y-1/2 rounded-full border border-white/[0.1] bg-black/50 p-2 text-white/80 backdrop-blur-md transition-all hover:scale-105 hover:bg-black/70 hover:text-white"
                aria-label="Ďalší obrázok"
              >
                <ChevronRight className="h-5 w-5" />
              </button>
            </>
          )}

          {/* Counter */}
          {multi && (
            <div className="absolute bottom-4 left-4 rounded-lg bg-black/60 px-3 py-1.5 text-xs font-semibold tabular-nums text-white/90 backdrop-blur-md">
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
          className="fixed inset-0 z-[1000] flex items-center justify-center bg-black/90 backdrop-blur-sm"
          onClick={() => setLightbox(false)}
        >
          <button
            onClick={() => setLightbox(false)}
            className="absolute right-5 top-5 rounded-full border border-white/10 bg-black/50 p-2 text-white/70 backdrop-blur-md transition-colors hover:bg-black/70 hover:text-white"
            aria-label="Zavrieť"
          >
            <X className="h-6 w-6" />
          </button>

          {multi && (
            <>
              <button
                onClick={(e) => {
                  e.stopPropagation()
                  goToPrevious()
                }}
                className="absolute left-5 top-1/2 -translate-y-1/2 rounded-full border border-white/10 bg-black/50 p-3 text-white/70 backdrop-blur-md transition-colors hover:bg-black/70 hover:text-white"
                aria-label="Predchádzajúci obrázok"
              >
                <ChevronLeft className="h-6 w-6" />
              </button>
              <button
                onClick={(e) => {
                  e.stopPropagation()
                  goToNext()
                }}
                className="absolute right-5 top-1/2 -translate-y-1/2 rounded-full border border-white/10 bg-black/50 p-3 text-white/70 backdrop-blur-md transition-colors hover:bg-black/70 hover:text-white"
                aria-label="Ďalší obrázok"
              >
                <ChevronRight className="h-6 w-6" />
              </button>
            </>
          )}

          <img
            src={images[currentIndex]}
            alt={`${title} - obrázok ${currentIndex + 1}`}
            className="max-h-[85vh] max-w-[90vw] rounded-lg object-contain"
            onClick={(e) => e.stopPropagation()}
          />

          {multi && (
            <div className="absolute bottom-6 left-1/2 -translate-x-1/2 rounded-full bg-black/60 px-4 py-2 text-sm font-semibold tabular-nums text-white/90 backdrop-blur-md">
              {currentIndex + 1} / {images.length}
            </div>
          )}
        </div>
      )}
    </>
  )
}
