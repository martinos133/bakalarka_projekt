'use client'

import { useState, useEffect } from 'react'
import Link from 'next/link'
import Image from 'next/image'
import Header from '@/components/Header'
import CategoryNav from '@/components/CategoryNav'
import Footer from '@/components/Footer'
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

const DASHBOARD_REDIRECT = '/signin?redirect=/dashboard'

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
      'Inzerát môžete vytvoriť až po prihlásení. V dashboarde potom pridáte názov, kategóriu, popis, cenu a fotky. Vyplňte lokalitu, aby vás zákazníci našli na mape. Inzerát môže byť služba alebo prenájom.',
    icon: FileEdit,
    image: 'https://images.unsplash.com/photo-1460925895917-afdab827c52f?w=800&q=80',
    cta: 'Vytvoriť inzerát',
    href: '/dashboard',
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
    cta: 'Otvorit dashboard',
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
  const [loggedIn, setLoggedIn] = useState(false)
  useEffect(() => {
    setLoggedIn(isAuthenticated())
  }, [])

  const getStepHref = (step: (typeof STEPS)[0]) => {
    if (!step.href) return null
    if (!step.authRequired) return step.href
    return loggedIn ? step.href : DASHBOARD_REDIRECT
  }

  return (
    <div className="min-h-screen bg-white">
      <Header />
      <CategoryNav />

      {/* Hero */}
      <section className="relative bg-gradient-to-br from-gray-50 via-white to-emerald-50/30 overflow-hidden">
        <div className="absolute inset-0 bg-[url('data:image/svg+xml;base64,PHN2ZyB3aWR0aD0iNjAiIGhlaWdodD0iNjAiIHZpZXdCb3g9IjAgMCA2MCA2MCIgeG1sbnM9Imh0dHA6Ly93d3cudzMub3JnLzIwMDAvc3ZnIj48ZyBmaWxsPSJub25lIiBmaWxsLXJ1bGU9ImV2ZW5vZGQiPjxnIGZpbGw9IiMxZGJmNzMiIGZpbGwtb3BhY2l0eT0iMC4wMyI+PHBhdGggZD0iTTM2IDM0djItSDI0di0yaDEyem0wLTR2MkgyNHYtMmgxMnoiLz48L2g+PC9nPjwvc3ZnPg==')] opacity-60" />
        <div className="relative max-w-6xl mx-auto px-4 sm:px-6 lg:px-8 py-16 md:py-24">
          <div className="grid md:grid-cols-2 gap-12 items-center">
            <div>
              <p className="inline-flex items-center gap-2 text-emerald-600 font-medium mb-4">
                <Sparkles className="w-5 h-5" />
                Stať sa predajcom
              </p>
              <h1 className="text-3xl sm:text-4xl lg:text-5xl font-bold text-gray-900 tracking-tight mb-6">
                Ponúkajte služby alebo prenájmy a nájdite zákazníkov na jednej platforme
              </h1>
              <p className="text-lg text-gray-600 mb-8 max-w-xl">
                Jednoduchý postup od registrácie po prvú objednávku. Bez skrytých poplatkov za založenie účtu.
              </p>
              <div className="flex flex-wrap gap-4">
                <Link
                  href="/join"
                  className="inline-flex items-center gap-2 px-6 py-3.5 rounded-lg font-semibold text-white bg-[#1dbf73] hover:bg-[#19a463] transition shadow-lg shadow-[#1dbf73]/25"
                >
                  Vytvoriť účet
                  <ArrowRight className="w-5 h-5" />
                </Link>
                <Link
                  href="/signin"
                  className="inline-flex items-center gap-2 px-6 py-3.5 rounded-lg font-semibold text-gray-700 bg-white border-2 border-gray-200 hover:border-[#1dbf73] hover:text-[#1dbf73] transition"
                >
                  Už mám účet
                </Link>
              </div>
            </div>
            <div className="relative rounded-2xl overflow-hidden shadow-2xl shadow-gray-200/80 ring-1 ring-gray-100">
              <Image
                src="https://images.unsplash.com/photo-1522071820081-009f0129c71c?w=1000&q=85"
                alt="Spolupráca a freelancing"
                width={600}
                height={400}
                className="w-full h-auto object-cover aspect-[4/3]"
                priority
                sizes="(max-width: 768px) 100vw, 50vw"
              />
              <div className="absolute inset-0 bg-gradient-to-t from-black/20 to-transparent" />
            </div>
          </div>
        </div>
      </section>

      {/* How it works */}
      <section className="py-16 md:py-24 bg-white">
        <div className="max-w-6xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="text-center mb-14">
            <h2 className="text-2xl sm:text-3xl font-bold text-gray-900 mb-3">
              Ako začať predávať
            </h2>
            <p className="text-gray-600 max-w-2xl mx-auto">
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
                  className={`grid md:grid-cols-2 gap-10 lg:gap-16 items-center ${!isEven ? 'md:flex-row-reverse' : ''}`}
                >
                  <div className={isEven ? '' : 'md:order-2'}>
                    <div className="flex items-center gap-3 mb-4">
                      <span className="flex items-center justify-center w-10 h-10 rounded-full bg-[#1dbf73] text-white font-bold text-lg">
                        {step.num}
                      </span>
                      <h3 className="text-xl sm:text-2xl font-bold text-gray-900">
                        {step.title}
                      </h3>
                    </div>
                    <p className="text-gray-600 leading-relaxed mb-6">
                      {step.description}
                    </p>
                    {step.cta && getStepHref(step) && (
                      <Link
                        href={getStepHref(step)!}
                        className="inline-flex items-center gap-2 text-[#1dbf73] font-semibold hover:underline"
                      >
                        {step.cta}
                        <ArrowRight className="w-4 h-4" />
                      </Link>
                    )}
                  </div>
                  <div className={`relative rounded-2xl overflow-hidden shadow-xl ring-1 ring-gray-100 ${!isEven ? 'md:order-1' : ''}`}>
                    <Image
                      src={step.image}
                      alt={step.title}
                      width={600}
                      height={360}
                      className="w-full h-auto object-cover aspect-[5/3]"
                      sizes="(max-width: 768px) 100vw, 50vw"
                    />
                    <div className="absolute top-4 left-4 flex items-center justify-center w-12 h-12 rounded-xl bg-white/95 shadow-lg">
                      <Icon className="w-6 h-6 text-[#1dbf73]" />
                    </div>
                  </div>
                </div>
              )
            })}
          </div>
        </div>
      </section>

      {/* Benefits */}
      <section className="py-16 md:py-24 bg-gray-50">
        <div className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8 text-center">
          <h2 className="text-2xl sm:text-3xl font-bold text-gray-900 mb-3">
            Prečo predávať u nás
          </h2>
          <p className="text-gray-600 mb-12 max-w-xl mx-auto">
            Platforma prispôsobená pre poskytovateľov služieb a prenájmov na Slovensku.
          </p>
          <ul className="grid sm:grid-cols-2 gap-4 text-left max-w-2xl mx-auto">
            {BENEFITS.map((item, i) => (
              <li key={i} className="flex items-start gap-3 text-gray-700">
                <CheckCircle2 className="w-6 h-6 text-[#1dbf73] shrink-0 mt-0.5" />
                <span>{item}</span>
              </li>
            ))}
          </ul>
        </div>
      </section>

      {/* CTA */}
      <section className="py-16 md:py-24 bg-[#1dbf73]">
        <div className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8 text-center">
          <h2 className="text-2xl sm:text-3xl font-bold text-white mb-4">
            Začnite ešte dnes
          </h2>
          <p className="text-white/90 mb-8 max-w-xl mx-auto">
            Vytvorte účet, pridajte prvý inzerát a dajte o sebe vedieť tisícom zákazníkom.
          </p>
          <div className="flex flex-wrap justify-center gap-4">
            <Link
              href="/join"
              className="inline-flex items-center gap-2 px-8 py-4 rounded-lg font-semibold text-[#1dbf73] bg-white hover:bg-gray-100 transition shadow-lg"
            >
              Zaregistrovať sa
              <ArrowRight className="w-5 h-5" />
            </Link>
            <Link
              href="/"
              className="inline-flex items-center gap-2 px-8 py-4 rounded-lg font-semibold text-white border-2 border-white/80 hover:bg-white/10 transition"
            >
              Späť na domov
            </Link>
          </div>
        </div>
      </section>

      <Footer />
    </div>
  )
}
