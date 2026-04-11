'use client'

import { Star } from 'lucide-react'

export default function Testimonials() {
  const testimonials = [
    {
      name: 'Alena Nováková',
      role: 'CEO, Tech Startup',
      image: 'https://images.unsplash.com/photo-1494790108377-be9c29b29330?w=100&h=100&fit=crop',
      text: 'RentMe bol pre náš biznis zmenou hry. Našli sme úžasné talenty rýchlo a cenovo dostupne.',
      rating: 5,
    },
    {
      name: 'Peter Horváth',
      role: 'Marketingový riaditeľ',
      image: 'https://images.unsplash.com/photo-1507003211169-0a1dd7228f2d?w=100&h=100&fit=crop',
      text: 'Kvalita práce prevýšila naše očakávania. Vrelo odporúčam!',
      rating: 5,
    },
    {
      name: 'Mária Kováčová',
      role: 'Majiteľka malého podniku',
      image: 'https://images.unsplash.com/photo-1438761681033-6461ffad8d80?w=100&h=100&fit=crop',
      text: 'Našla som perfektného freelancera pre môj projekt. Proces bol hladký a profesionálny.',
      rating: 5,
    },
  ]

  return (
    <section className="border-t border-white/[0.06] bg-surface py-16">
      <div className="mx-auto max-w-[1920px] px-4 sm:px-6 lg:px-8">
        <div className="mb-10 text-center">
          <p className="mb-3 text-xs font-semibold uppercase tracking-[0.2em] text-muted">Referencie</p>
          <h2 className="text-3xl font-bold text-white md:text-4xl">
            Dôvera je našou <span className="font-serif italic text-accent">jedinou menou</span>
          </h2>
        </div>
        <div className="grid grid-cols-1 gap-5 md:grid-cols-3">
          {testimonials.map((testimonial, index) => (
            <article
              key={index}
              className="card card-hover flex h-full flex-col p-6 shadow-lg shadow-black/15 transition-all duration-200"
            >
              <div className="mb-4 flex items-center gap-0.5" aria-label={`Hodnotenie ${testimonial.rating} z 5`}>
                {[...Array(testimonial.rating)].map((_, i) => (
                  <Star key={i} className="h-5 w-5 fill-accent text-accent" aria-hidden />
                ))}
              </div>
              <p className="mb-6 flex-1 text-[15px] italic leading-relaxed text-muted">
                &ldquo;{testimonial.text}&rdquo;
              </p>
              <div className="flex items-center gap-3 border-t border-white/[0.06] pt-5">
                {/* eslint-disable-next-line @next/next/no-img-element */}
                <img
                  src={testimonial.image}
                  alt={testimonial.name}
                  className="h-12 w-12 shrink-0 rounded-full border-2 border-white/[0.1] object-cover ring-2 ring-card"
                />
                <div className="min-w-0">
                  <div className="font-semibold text-white">{testimonial.name}</div>
                  <div className="text-sm text-muted">{testimonial.role}</div>
                </div>
              </div>
            </article>
          ))}
        </div>
      </div>
    </section>
  )
}
