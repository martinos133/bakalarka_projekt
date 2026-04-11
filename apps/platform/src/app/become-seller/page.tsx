'use client'

import { useState, useEffect } from 'react'
import Link from 'next/link'
import Image from 'next/image'
import Header from '@/components/Header'
import CategoryNav from '@/components/CategoryNav'
import Footer from '@/components/Footer'
import { CmsGate } from '@/components/CmsGate'
import { isAuthenticated } from '@/lib/auth'
import {
  UserPlus,
  FileEdit,
  UserCheck,
  ShieldCheck,
  MessageCircle,
  ArrowRight,
  CheckCircle2,
  Sparkles,
} from 'lucide-react'

const STEPS = [
  {
    num: 1,
    title: 'Vytvorte účet alebo sa prihláste',
    description:
      'Zaregistrujte sa ako fyzická osoba alebo firma. Stačí e-mail, heslo a základné údaje. Ak už účet máte, jednoducho sa prihláste.',
    icon: UserPlus,
    image: 'https://images.unsplash.com/photo-1551434678-e076c223a692?w=800&q=80',
    cta: 'Registrovať sa',
    href: '/join',
    authRequired: false,
  },
  {
    num: 2,
    title: 'Vytvorte svoj prvý inzerát',
    description:
      'Inzerát môžete vytvoriť až po prihlásení. Najprv vyberiete kategóriu z ponuky, vyplníte špecifikácie a potom názov, popis, cenu a fotky. Lokalita pomôže zákazníkom nájsť vás na mape.',
    icon: FileEdit,
    image: 'https://images.unsplash.com/photo-1460925895917-afdab827c52f?w=800&q=80',
    cta: 'Pridať inzerát',
    href: '/podat-inzerat',
    authRequired: true,
  },
  {
    num: 3,
    title: 'Doplňte profil',
    description:
      'Po prihlásení doplňte profil: meno, fotka, popis toho, čo ponúkate, a kontaktné údaje. Kompletný profil zvyšuje dôveru zákazníkov. Firmy môžu uviesť IČO a DIČ.',
    icon: UserCheck,
    image: 'https://images.unsplash.com/photo-1507003211169-0a1dd7228f2d?w=800&q=80',
    cta: 'Môj profil',
    href: '/dashboard',
    authRequired: true,
  },
  {
    num: 4,
    title: 'Schválenie a publikácia',
    description:
      'Niektoré inzeráty prechádzajú kontrolou pred zverejnením. Po schválení sa zobrazia v vyhľadávaní a na mape. Môžete ich kedykoľvek upraviť alebo deaktivovať.',
    icon: ShieldCheck,
    image: 'https://images.unsplash.com/photo-1552664730-d307ca884978?w=800&q=80',
    cta: null,
    href: null,
    authRequired: false,
  },
  {
    num: 5,
    title: 'Príjem objednávok a komunikácia',
    description:
      'Zákazníci vás kontaktujú cez platformu. Odpovedzte včas, dohodnite detaily a môžete začať spolupracovať. Platby a históriu nájdete v dashboarde – prístupné po prihlásení.',
    icon: MessageCircle,
    image: 'https://images.unsplash.com/photo-1556742049-0cfed4f6a45d?w=800&q=80',
    cta: 'Otvoriť dashboard',
    href: '/dashboard',
    authRequired: true,
  },
]

const BENEFITS = [
  'Jednoduchá registrácia a prehľadný dashboard',
  'Vlastné inzeráty so službami alebo prenájmami',
  'Zobrazenie na mape pre lepšiu viditeľnosť',
  'Správa správ a objednávok na jednom mieste',
  'Podpora pre súkromné osoby aj firmy',
]

export default function BecomeSellerPage() {
  return (
    <CmsGate cmsSlug="become-seller">
      <BecomeSellerDefaultContent />
    </CmsGate>
  )
}

function BecomeSellerDefaultContent() {
  const [loggedIn, setLoggedIn] = useState(false)
  useEffect(() => {
    setLoggedIn(isAuthenticated())
  }, [])

  const getStepHref = (step: (typeof STEPS)[0]) => {
    if (!step.href) return null
    if (!step.authRequired) return step.href
    if (loggedIn) return step.href
    return `/signin?redirect=${encodeURIComponent(step.href)}`
  }

  return (
    <div className="min-h-screen bg-surface">
      <Header />
      <CategoryNav />

      {/* Hero */}
      <section className="relative border-b border-white/[0.06] bg-surface">
        <div className="relative mx-auto max-w-[1920px] px-4 py-16 sm:px-6 md:py-24 lg:px-8">
          <div className="grid items-center gap-12 md:grid-cols-2">
            <div>
              <p className="mb-4 inline-flex items-center gap-2 text-[10px] font-semibold uppercase tracking-[0.18em] text-muted">
                <span className="flex h-8 w-8 items-center justify-center rounded-lg border border-white/[0.1] bg-white/[0.04]">
                  <Sparkles className="h-4 w-4 text-accent" strokeWidth={1.75} aria-hidden />
                </span>
                Stať sa predajcom
              </p>
              <h1 className="mb-6 text-balance text-3xl font-bold tracking-tight text-white sm:text-4xl lg:text-5xl">
                Ponúkajte služby alebo prenájmy a{' '}
                <span className="font-serif italic text-accent">nájdite zákazníkov</span> na jednej platforme
              </h1>
              <p className="mb-8 max-w-xl text-lg leading-relaxed text-muted">
                Jednoduchý postup od registrácie po prvú objednávku. Bez skrytých poplatkov za založenie účtu.
              </p>
              <div className="flex flex-wrap gap-3">
                <Link
                  href="/join"
                  className="inline-flex items-center gap-2 rounded-xl border border-transparent bg-accent px-6 py-3.5 font-semibold text-dark shadow-lg shadow-black/20 transition hover:bg-accent-light"
                >
                  Vytvoriť účet
                  <ArrowRight className="h-5 w-5" aria-hidden />
                </Link>
                <Link
                  href="/signin"
                  className="inline-flex items-center gap-2 rounded-xl border border-white/[0.1] bg-white/[0.04] px-6 py-3.5 font-semibold text-muted transition hover:border-white/[0.14] hover:bg-white/[0.07] hover:text-white"
                >
                  Už mám účet
                </Link>
              </div>
            </div>
            <div className="relative overflow-hidden rounded-2xl border border-white/[0.08] shadow-xl shadow-black/30 ring-1 ring-black/20">
              <Image
                src="https://images.unsplash.com/photo-1522071820081-009f0129c71c?w=1000&q=85"
                alt="Spolupráca a freelancing"
                width={600}
                height={400}
                className="aspect-[4/3] h-auto w-full object-cover"
                priority
                sizes="(max-width: 768px) 100vw, 50vw"
              />
              <div className="pointer-events-none absolute inset-0 bg-gradient-to-t from-black/35 to-transparent" />
            </div>
          </div>
        </div>
      </section>

      {/* How it works */}
      <section className="border-t border-white/[0.06] bg-surface py-16 md:py-24">
        <div className="mx-auto max-w-6xl px-4 sm:px-6 lg:px-8">
          <div className="mb-14 text-center">
            <h2 className="mb-3 font-serif text-2xl text-accent sm:text-3xl">
              Ako začať predávať
            </h2>
            <p className="mx-auto max-w-2xl text-muted">
              Postupujte podľa piatich jednoduchých krokov od registrácie po prvé zákazníky.
            </p>
          </div>

          <div className="space-y-20 md:space-y-28">
            {STEPS.map((step, idx) => {
              const Icon = step.icon
              const isEven = idx % 2 === 0
              return (
                <div
                  key={step.num}
                  className={`grid items-center gap-10 md:grid-cols-2 lg:gap-16 ${!isEven ? 'md:flex-row-reverse' : ''}`}
                >
                  <div className={`card card-hover rounded-2xl p-6 sm:p-8 ${isEven ? '' : 'md:order-2'}`}>
                    <div className="mb-4 flex items-center gap-3">
                      <span className="flex h-10 w-10 shrink-0 items-center justify-center rounded-full bg-accent text-lg font-bold text-dark">
                        {step.num}
                      </span>
                      <h3 className="text-xl font-bold text-white sm:text-2xl">
                        {step.title}
                      </h3>
                    </div>
                    <p className="mb-6 leading-relaxed text-muted">
                      {step.description}
                    </p>
                    {step.cta && getStepHref(step) && (
                      <Link
                        href={getStepHref(step)!}
                        className="inline-flex items-center gap-2 font-semibold text-accent transition hover:text-accent-light"
                      >
                        {step.cta}
                        <ArrowRight className="h-4 w-4" aria-hidden />
                      </Link>
                    )}
                  </div>
                  <div
                    className={`relative overflow-hidden rounded-2xl border border-white/[0.08] shadow-xl shadow-black/30 ring-1 ring-black/20 ${!isEven ? 'md:order-1' : ''}`}
                  >
                    <Image
                      src={step.image}
                      alt={step.title}
                      width={600}
                      height={360}
                      className="aspect-[5/3] h-auto w-full object-cover"
                      sizes="(max-width: 768px) 100vw, 50vw"
                    />
                    <div className="absolute left-4 top-4 flex h-12 w-12 items-center justify-center rounded-xl border border-white/[0.1] bg-dark-200/95 shadow-lg shadow-black/20 backdrop-blur-sm">
                      <Icon className="h-6 w-6 text-accent" aria-hidden />
                    </div>
                  </div>
                </div>
              )
            })}
          </div>
        </div>
      </section>

      {/* Benefits */}
      <section className="border-t border-white/[0.06] bg-surface py-16 md:py-24">
        <div className="mx-auto max-w-4xl px-4 text-center sm:px-6 lg:px-8">
          <h2 className="mb-3 font-serif text-2xl text-accent sm:text-3xl">
            Prečo predávať u nás
          </h2>
          <p className="mx-auto mb-12 max-w-xl text-muted">
            Platforma prispôsobená pre poskytovateľov služieb a prenájmov na Slovensku.
          </p>
          <ul className="mx-auto grid max-w-2xl gap-4 text-left sm:grid-cols-2">
            {BENEFITS.map((item, i) => (
              <li
                key={i}
                className="card card-hover flex items-start gap-3 p-4 text-gray-200"
              >
                <CheckCircle2 className="mt-0.5 h-6 w-6 shrink-0 text-accent" aria-hidden />
                <span>{item}</span>
              </li>
            ))}
          </ul>
        </div>
      </section>

      {/* CTA */}
      <section className="border-t border-white/[0.06] bg-surface py-16 md:py-24">
        <div className="mx-auto max-w-4xl px-4 sm:px-6 lg:px-8">
          <div className="card card-hover p-8 text-center shadow-lg shadow-black/15 sm:p-10">
            <h2 className="mb-4 font-serif text-2xl text-accent sm:text-3xl">
              Začnite ešte dnes
            </h2>
            <p className="mx-auto mb-8 max-w-xl text-muted">
              Vytvorte účet, pridajte prvý inzerát a dajte o sebe vedieť tisícom zákazníkov.
            </p>
            <div className="flex flex-wrap justify-center gap-3">
              <Link
                href="/join"
                className="inline-flex items-center gap-2 rounded-xl border border-transparent bg-accent px-8 py-4 font-semibold text-dark shadow-lg shadow-black/20 transition hover:bg-accent-light"
              >
                Zaregistrovať sa
                <ArrowRight className="h-5 w-5" aria-hidden />
              </Link>
              <Link
                href="/"
                className="inline-flex items-center gap-2 rounded-xl border border-white/[0.1] bg-white/[0.04] px-8 py-4 font-semibold text-muted transition hover:border-white/[0.14] hover:bg-white/[0.07] hover:text-white"
              >
                Späť na domov
              </Link>
            </div>
          </div>
        </div>
      </section>

      <Footer />
    </div>
  )
}
