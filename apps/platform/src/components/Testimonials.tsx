'use client'

import { useCallback, useEffect, useState } from 'react'
import Link from 'next/link'
import { Star, X } from 'lucide-react'
import { api } from '@/lib/api'
import { isAuthenticated } from '@/lib/auth'
import type {
  CreatePlatformTestimonialDto,
  PlatformTestimonialPublic,
} from '@inzertna-platforma/shared'

type DisplayRow = {
  id: string
  source: 'api' | 'static'
  rating: number
  text: string
  name: string
  role: string
  imageUrl: string | null
}

const STATIC_FALLBACK: DisplayRow[] = [
  {
    id: 'static-1',
    source: 'static',
    rating: 5,
    text: 'RentMe bol pre náš biznis zmenou hry. Našli sme úžasné talenty rýchlo a cenovo dostupne.',
    name: 'Alena Nováková',
    role: 'CEO, Tech Startup',
    imageUrl: 'https://images.unsplash.com/photo-1494790108377-be9c29b29330?w=100&h=100&fit=crop',
  },
  {
    id: 'static-2',
    source: 'static',
    rating: 5,
    text: 'Kvalita práce prevýšila naše očakávania. Vrelo odporúčam!',
    name: 'Peter Horváth',
    role: 'Marketingový riaditeľ',
    imageUrl: 'https://images.unsplash.com/photo-1507003211169-0a1dd7228f2d?w=100&h=100&fit=crop',
  },
  {
    id: 'static-3',
    source: 'static',
    rating: 5,
    text: 'Našla som perfektného freelancera pre môj projekt. Proces bol hladký a profesionálny.',
    name: 'Mária Kováčová',
    role: 'Majiteľka malého podniku',
    imageUrl: 'https://images.unsplash.com/photo-1438761681033-6461ffad8d80?w=100&h=100&fit=crop',
  },
]

function mapApi(t: PlatformTestimonialPublic): DisplayRow {
  const a = t.author
  const name = [a.firstName, a.lastName].filter(Boolean).join(' ').trim() || 'Člen platformy'
  let role = 'Člen platformy'
  if (t.roleLabel) role = t.roleLabel
  else if (a.isCompany && a.companyName) role = a.companyName
  return {
    id: t.id,
    source: 'api',
    rating: t.rating,
    text: t.comment,
    name,
    role,
    imageUrl: a.avatarUrl ?? null,
  }
}

function Avatar({ name, imageUrl }: { name: string; imageUrl: string | null }) {
  const initials = name
    .split(/\s+/)
    .map((w) => w[0])
    .filter(Boolean)
    .slice(0, 2)
    .join('')
    .toUpperCase()

  if (imageUrl) {
    return (
      // eslint-disable-next-line @next/next/no-img-element
      <img
        src={imageUrl}
        alt=""
        className="h-12 w-12 shrink-0 rounded-full border-2 border-white/[0.12] object-cover shadow-md shadow-black/40 ring-2 ring-accent/15"
      />
    )
  }

  return (
    <div
      className="flex h-12 w-12 shrink-0 items-center justify-center rounded-full border-2 border-white/[0.1] bg-gradient-to-br from-dark-200 to-dark-300 text-sm font-semibold text-white/90 shadow-md shadow-black/30 ring-2 ring-white/[0.06]"
      aria-hidden
    >
      {initials || '?'}
    </div>
  )
}

export default function Testimonials() {
  const [mounted, setMounted] = useState(false)
  const [rows, setRows] = useState<DisplayRow[]>(STATIC_FALLBACK)
  const [listLoading, setListLoading] = useState(true)
  const [loggedIn, setLoggedIn] = useState(false)
  const [mine, setMine] = useState<PlatformTestimonialPublic | null>(null)
  const [mineLoading, setMineLoading] = useState(false)

  const [rating, setRating] = useState(5)
  const [comment, setComment] = useState('')
  const [roleLabel, setRoleLabel] = useState('')
  const [submitting, setSubmitting] = useState(false)
  const [formError, setFormError] = useState<string | null>(null)
  const [formOk, setFormOk] = useState<string | null>(null)
  const [reviewModalOpen, setReviewModalOpen] = useState(false)

  const loadPublic = useCallback(async () => {
    setListLoading(true)
    try {
      const data = (await api.getPlatformTestimonials()) as PlatformTestimonialPublic[]
      if (Array.isArray(data) && data.length > 0) {
        setRows(data.map(mapApi))
      } else {
        setRows(STATIC_FALLBACK)
      }
    } catch {
      setRows(STATIC_FALLBACK)
    } finally {
      setListLoading(false)
    }
  }, [])

  useEffect(() => {
    setMounted(true)
  }, [])

  useEffect(() => {
    loadPublic()
  }, [loadPublic])

  useEffect(() => {
    if (!mounted) return
    const ok = isAuthenticated()
    setLoggedIn(ok)
    if (!ok) {
      setMine(null)
      return
    }
    setMineLoading(true)
    api
      .getMyPlatformTestimonial()
      .then((t: PlatformTestimonialPublic | null) => {
        setMine(t)
        if (t) {
          setRating(t.rating)
          setComment(t.comment)
          setRoleLabel(t.roleLabel || '')
        } else {
          setRating(5)
          setComment('')
          setRoleLabel('')
        }
      })
      .catch(() => {
        setMine(null)
      })
      .finally(() => setMineLoading(false))
  }, [mounted])

  useEffect(() => {
    if (!reviewModalOpen) return
    const prev = document.body.style.overflow
    document.body.style.overflow = 'hidden'
    return () => {
      document.body.style.overflow = prev
    }
  }, [reviewModalOpen])

  useEffect(() => {
    if (!reviewModalOpen) return
    const onKey = (e: KeyboardEvent) => {
      if (e.key === 'Escape') setReviewModalOpen(false)
    }
    window.addEventListener('keydown', onKey)
    return () => window.removeEventListener('keydown', onKey)
  }, [reviewModalOpen])

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    setFormError(null)
    setFormOk(null)
    if (!loggedIn) return
    setSubmitting(true)
    try {
      const trimmedComment = comment.trim()
      if (mine) {
        const updated = (await api.updatePlatformTestimonial({
          rating,
          comment: trimmedComment,
          roleLabel: roleLabel.trim(),
        })) as PlatformTestimonialPublic
        setMine(updated)
        setFormOk('Referencia bola uložená.')
      } else {
        const body: CreatePlatformTestimonialDto = {
          rating,
          comment: trimmedComment,
        }
        if (roleLabel.trim()) body.roleLabel = roleLabel.trim()
        const created = (await api.createPlatformTestimonial(body)) as PlatformTestimonialPublic
        setMine(created)
        setFormOk('Ďakujeme za vašu referenciu.')
      }
      await loadPublic()
    } catch (err: unknown) {
      const msg = err instanceof Error ? err.message : 'Nepodarilo sa odoslať.'
      setFormError(msg)
    } finally {
      setSubmitting(false)
    }
  }

  const displayRows = rows

  const inputClass =
    'w-full rounded-xl border border-white/[0.08] bg-dark/70 px-4 py-3 text-[15px] leading-relaxed text-white/95 placeholder:text-white/30 shadow-inner shadow-black/20 transition-[border-color,box-shadow] focus:border-accent/45 focus:outline-none focus:ring-2 focus:ring-accent/15'

  return (
    <section className="relative border-t border-white/[0.06] bg-surface py-20 md:py-24">
      <div
        className="pointer-events-none absolute inset-0 bg-[radial-gradient(ellipse_80%_50%_at_50%_-20%,rgba(201,169,110,0.08),transparent)]"
        aria-hidden
      />
      <div className="relative mx-auto max-w-[1920px] px-4 sm:px-6 lg:px-8">
        <div className="mx-auto mb-8 max-w-3xl text-center md:mb-10">
          <p className="mb-4 font-sans text-[11px] font-semibold uppercase tracking-[0.28em] text-muted">
            Referencie
          </p>
          <h2 className="font-sans text-3xl font-semibold leading-tight tracking-tight text-white md:text-4xl md:leading-tight">
            Dôvera je našou{' '}
            <span className="font-serif text-[1.05em] font-normal italic text-accent">jedinou menou</span>
          </h2>
        </div>

        {mounted && (
          <div className="mb-10 text-center md:mb-12">
            {!loggedIn && (
              <p className="font-sans text-sm text-white/55">
                Chcete pridať vlastnú skúsenosť?{' '}
                <Link
                  href="/signin"
                  className="text-accent underline decoration-accent/35 underline-offset-[3px] transition hover:text-accent-light hover:decoration-accent"
                >
                  Prihláste sa
                </Link>
                .
              </p>
            )}
            {loggedIn && (
              <p className="font-sans text-sm text-white/55">
                <button
                  type="button"
                  onClick={() => {
                    setReviewModalOpen(true)
                    setFormError(null)
                    setFormOk(null)
                  }}
                  disabled={mineLoading}
                  className="text-accent underline decoration-accent/35 underline-offset-[3px] transition hover:text-accent-light hover:decoration-accent disabled:cursor-wait disabled:opacity-50"
                >
                  {mineLoading
                    ? 'Načítavam…'
                    : mine
                      ? 'Upraviť referenciu'
                      : 'Napísať recenziu'}
                </button>
              </p>
            )}
          </div>
        )}

        {mounted && loggedIn && reviewModalOpen && (
          <div
            className="fixed inset-0 z-[100] flex items-center justify-center p-4 sm:p-6"
            role="presentation"
          >
            <button
              type="button"
              className="absolute inset-0 bg-black/75 backdrop-blur-sm"
              aria-label="Zavrieť"
              onClick={() => setReviewModalOpen(false)}
            />
            <div
              role="dialog"
              aria-modal="true"
              aria-labelledby="review-modal-title"
              className="relative z-[101] w-full max-w-lg overflow-hidden rounded-2xl border border-white/[0.09] bg-gradient-to-b from-dark-100/98 to-dark/95 shadow-[0_25px_60px_-15px_rgba(0,0,0,0.75)] max-h-[min(90vh,720px)] flex flex-col"
              onClick={(e) => e.stopPropagation()}
            >
              <div
                className="pointer-events-none absolute inset-x-0 top-0 h-px bg-gradient-to-r from-transparent via-accent/35 to-transparent"
                aria-hidden
              />
              <div className="flex shrink-0 items-start justify-between gap-3 border-b border-white/[0.06] px-5 pb-4 pt-5 sm:px-6 sm:pt-6">
                <div className="min-w-0 pr-2 text-left">
                  <h3 id="review-modal-title" className="font-sans text-lg font-semibold tracking-tight text-white">
                    {mine ? 'Vaša referencia' : 'Napíšte referenciu'}
                  </h3>
                  <p className="mt-1 font-sans text-xs text-white/45">
                    Krátka spätná väzba pomôže ostatným používateľom.
                  </p>
                </div>
                <button
                  type="button"
                  onClick={() => setReviewModalOpen(false)}
                  className="rounded-lg p-2 text-white/50 transition hover:bg-white/[0.08] hover:text-white focus:outline-none focus-visible:ring-2 focus-visible:ring-accent/50"
                  aria-label="Zavrieť formulár"
                >
                  <X className="h-5 w-5" aria-hidden />
                </button>
              </div>

              <form onSubmit={handleSubmit} className="flex min-h-0 flex-1 flex-col overflow-y-auto overscroll-contain px-5 pb-6 pt-5 sm:px-6 sm:pb-7">
                <div className="space-y-5">
                  <div>
                    <p className="mb-3 font-sans text-[11px] font-semibold uppercase tracking-[0.2em] text-muted">
                      Hodnotenie
                    </p>
                    <div className="flex gap-1.5" role="group" aria-label="Hodnotenie hviezdičkami">
                      {[1, 2, 3, 4, 5].map((n) => (
                        <button
                          key={n}
                          type="button"
                          onClick={() => setRating(n)}
                          className="rounded-lg p-1 transition-transform hover:scale-110 focus:outline-none focus-visible:ring-2 focus-visible:ring-accent/50 focus-visible:ring-offset-2 focus-visible:ring-offset-[#1a1a1a] active:scale-95"
                          aria-pressed={rating === n}
                          aria-label={`${n} z 5`}
                        >
                          <Star
                            className={`h-7 w-7 transition-colors ${n <= rating ? 'fill-accent text-accent drop-shadow-[0_0_12px_rgba(201,169,110,0.25)]' : 'text-white/20'}`}
                            strokeWidth={n <= rating ? 0 : 1.25}
                            aria-hidden
                          />
                        </button>
                      ))}
                    </div>
                  </div>

                  <div>
                    <label
                      htmlFor="testimonial-comment-modal"
                      className="mb-2 block font-sans text-[11px] font-semibold uppercase tracking-[0.18em] text-muted"
                    >
                      Text (aspoň 10 znakov)
                    </label>
                    <textarea
                      id="testimonial-comment-modal"
                      value={comment}
                      onChange={(e) => setComment(e.target.value)}
                      rows={4}
                      className={`${inputClass} min-h-[120px] resize-y`}
                      placeholder="Ako vám RentMe pomohol?"
                      maxLength={4000}
                      required
                    />
                  </div>

                  <div>
                    <label
                      htmlFor="testimonial-role-modal"
                      className="mb-2 block font-sans text-[11px] font-semibold uppercase tracking-[0.18em] text-muted"
                    >
                      Rola / firma (voliteľné)
                    </label>
                    <input
                      id="testimonial-role-modal"
                      type="text"
                      value={roleLabel}
                      onChange={(e) => setRoleLabel(e.target.value)}
                      className={inputClass}
                      placeholder="napr. CEO, Tech Startup"
                      maxLength={200}
                    />
                  </div>

                  {formError && (
                    <p className="rounded-lg border border-red-500/25 bg-red-500/10 px-3 py-2 font-sans text-sm text-red-300/95">
                      {formError}
                    </p>
                  )}
                  {formOk && (
                    <p className="rounded-lg border border-emerald-500/20 bg-emerald-500/10 px-3 py-2 font-sans text-sm text-emerald-300/95">
                      {formOk}
                    </p>
                  )}

                  <div className="flex flex-col gap-3 pt-1 sm:flex-row sm:justify-end">
                    <button
                      type="button"
                      onClick={() => setReviewModalOpen(false)}
                      className="order-2 rounded-xl border border-white/[0.12] bg-transparent px-4 py-3 font-sans text-sm font-medium text-white/80 transition hover:bg-white/[0.06] sm:order-1 sm:py-2.5"
                    >
                      Zavrieť
                    </button>
                    <button
                      type="submit"
                      disabled={submitting || mineLoading}
                      className="order-1 w-full rounded-xl bg-accent py-3.5 font-sans text-sm font-semibold tracking-wide text-dark shadow-lg shadow-accent/20 transition hover:bg-accent-light hover:shadow-accent/30 active:translate-y-px disabled:cursor-not-allowed disabled:opacity-45 disabled:shadow-none sm:order-2 sm:w-auto sm:min-w-[200px] sm:py-2.5"
                    >
                      {submitting ? 'Odosielam…' : mine ? 'Uložiť zmeny' : 'Odoslať referenciu'}
                    </button>
                  </div>
                </div>
              </form>
            </div>
          </div>
        )}

        <div className="grid grid-cols-1 gap-6 md:grid-cols-3 md:gap-5 lg:gap-6">
          {listLoading
            ? Array.from({ length: 3 }).map((_, i) => (
                <div
                  key={`sk-${i}`}
                  className="flex h-full flex-col overflow-hidden rounded-2xl border border-white/[0.07] bg-dark-100/80 p-6 shadow-xl shadow-black/30"
                >
                  <div className="mb-4 h-5 w-28 animate-pulse rounded-md bg-white/[0.08]" />
                  <div className="mb-6 flex-1 space-y-2.5">
                    <div className="h-3 animate-pulse rounded bg-white/[0.07]" />
                    <div className="h-3 animate-pulse rounded bg-white/[0.07]" />
                    <div className="h-3 w-4/5 animate-pulse rounded bg-white/[0.07]" />
                  </div>
                  <div className="flex gap-3 border-t border-white/[0.06] pt-5">
                    <div className="h-12 w-12 shrink-0 animate-pulse rounded-full bg-white/[0.08]" />
                    <div className="flex-1 space-y-2 pt-1">
                      <div className="h-4 w-32 animate-pulse rounded bg-white/[0.08]" />
                      <div className="h-3 w-24 animate-pulse rounded bg-white/[0.08]" />
                    </div>
                  </div>
                </div>
              ))
            : displayRows.map((testimonial) => (
                <article
                  key={testimonial.id}
                  className="group flex h-full flex-col overflow-hidden rounded-2xl border border-white/[0.08] bg-gradient-to-b from-dark-100/90 to-card/95 p-6 shadow-xl shadow-black/35 transition duration-300 hover:border-white/[0.12] hover:shadow-2xl hover:shadow-black/45 md:p-7"
                >
                  <div
                    className="mb-4 flex items-center gap-0.5"
                    aria-label={`Hodnotenie ${testimonial.rating} z 5`}
                  >
                    {[...Array(testimonial.rating)].map((_, i) => (
                      <Star
                        key={i}
                        className="h-[18px] w-[18px] fill-accent text-accent transition group-hover:scale-105"
                        aria-hidden
                      />
                    ))}
                  </div>
                  <p className="mb-6 flex-1 font-sans text-[15px] italic leading-[1.65] text-white/85">
                    &ldquo;{testimonial.text}&rdquo;
                  </p>
                  <div className="mt-auto flex items-center gap-3.5 border-t border-white/[0.07] pt-5">
                    <Avatar name={testimonial.name} imageUrl={testimonial.imageUrl} />
                    <div className="min-w-0">
                      <div className="font-sans text-[15px] font-semibold tracking-tight text-white">
                        {testimonial.name}
                      </div>
                      <div className="font-sans text-sm text-muted">{testimonial.role}</div>
                    </div>
                  </div>
                </article>
              ))}
        </div>
      </div>
    </section>
  )
}
