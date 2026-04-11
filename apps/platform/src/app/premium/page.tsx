'use client'

import { useEffect, useState } from 'react'
import Link from 'next/link'
import { api } from '@/lib/api'
import { isAuthenticated, setAuthUser } from '@/lib/auth'
import {
  ArrowRight,
  BadgeCheck,
  BarChart3,
  Building2,
  Check,
  CircleCheckBig,
  CreditCard,
  Crown,
  HelpCircle,
  Lock,
  MapPin,
  Sparkles,
  X,
  Zap,
} from 'lucide-react'
import Header from '@/components/Header'
import CategoryNav from '@/components/CategoryNav'
import Footer from '@/components/Footer'
import { CmsGate } from '@/components/CmsGate'

type PlanId = 'standard' | 'plus' | 'pro' | 'firma'

interface Plan {
  id: PlanId
  name: string
  tagline: string
  price: number | null
  priceNote: string
  badge: string | null
  highlighted: boolean
  icon: typeof Sparkles
  cta: string
  ctaHref: string
  ctaVariant: 'primary' | 'outline' | 'navy'
  features: string[]
}

const PLANS: Plan[] = [
  {
    id: 'standard',
    name: 'Štandard',
    tagline: 'Pre občasné inzerovanie bez mesačného poplatku.',
    price: 0,
    priceNote: 'Zverejnenie inzerátu podľa platného cenníka kategórie.',
    badge: null,
    highlighted: false,
    icon: Sparkles,
    cta: 'Pridať inzerát',
    ctaHref: '/podat-inzerat',
    ctaVariant: 'outline',
    features: [
      'Základné zaradenie vo vyhľadávaní a kategóriách',
      'Zobrazenie na mape pri vyplnenej lokalite',
      'Štandardná rotácia medzi inzerátmi',
      'Notifikácie o nových správach',
    ],
  },
  {
    id: 'plus',
    name: 'Plus',
    tagline: 'Jeden prioritný inzerát pre lepšiu viditeľnosť.',
    price: 8.99,
    priceNote: 'mesačne, jedna aktívna propagácia v rámci balíka.',
    badge: null,
    highlighted: false,
    icon: Zap,
    cta: 'Vybrať Plus',
    ctaHref: '/podat-inzerat?plan=plus',
    ctaVariant: 'outline',
    features: [
      'Všetko zo Štandardu',
      '1 prioritný inzerát vo výsledkoch',
      'Jemné vizuálne zvýraznenie inzerátu',
      'Lepšia pozícia v rámci mesta a regiónu',
      'Pripomienka pred koncom obdobia',
    ],
  },
  {
    id: 'pro',
    name: 'RentMe Pro',
    tagline: 'Pre aktívnych predajcov, ktorí chcú stabilnú viditeľnosť.',
    price: 16.99,
    priceNote: 'mesačne, až 3 prioritné inzeráty naraz.',
    badge: 'Odporúčané',
    highlighted: true,
    icon: Crown,
    cta: 'Zvoliť Pro',
    ctaHref: '/podat-inzerat?plan=pro',
    ctaVariant: 'primary',
    features: [
      'Všetko z balíka Plus',
      'Až 3 prioritné inzeráty súčasne',
      'Lepšie umiestnenie v kategóriách',
      'Zvýraznenie na mape',
      'Základné štatistiky výkonu',
      'Odznak Pro pri profile',
    ],
  },
  {
    id: 'firma',
    name: 'Firma',
    tagline: 'Pre tímy a firmy s väčším počtom ponúk.',
    price: 39,
    priceNote: 'mesačne, viac inzerátov a firemné funkcie.',
    badge: 'Pre firmy',
    highlighted: false,
    icon: Building2,
    cta: 'Kontaktovať predaj',
    ctaHref: '/join',
    ctaVariant: 'navy',
    features: [
      'Všetko z balíka RentMe Pro',
      'Až 10 prioritných inzerátov',
      'Rozšírený firemný profil',
      'Mesačný report výkonu',
      'Prioritná podpora',
      'Individuálna fakturácia',
    ],
  },
]

const FAQ = [
  {
    q: 'Prečo si zvoliť platený balík?',
    a: 'Štandard je vhodný na základné použitie. Platené balíky zvyšujú viditeľnosť, prinášajú lepšie pozície vo výsledkoch a pomáhajú odlíšiť ponuku od konkurencie.',
  },
  {
    q: 'Ako funguje fakturácia?',
    a: 'Balíky sú mesačné. V tejto verzii ide o demo checkout na otestovanie používateľského toku bez reálneho spracovania platby.',
  },
  {
    q: 'Môžem medzi balíkmi prepínať?',
    a: 'Áno, balík môžete zmeniť podľa aktuálnych potrieb. Vyšší plán sa aktivuje okamžite, nižší plán od ďalšieho obdobia.',
  },
  {
    q: 'Ktorý balík je vhodný pre občasný predaj?',
    a: 'Pre občasný predaj stačí Štandard alebo Plus. RentMe Pro a Firma sú vhodné pre pravidelné inzerovanie vo väčšom objeme.',
  },
]

function formatPriceEUR(n: number | null): string {
  if (n === null) return '—'
  if (n === 0) return '0 €'
  return `${n.toLocaleString('sk-SK', { minimumFractionDigits: 2, maximumFractionDigits: 2 })} €`
}

/** Pri neprihlásenom používateľovi presmerovanie na prihlásenie (redirect späť na cieľ). */
function signInHref(targetPath: string): string {
  return `/signin?redirect=${encodeURIComponent(targetPath)}`
}

function PremiumPageInner() {
  /** null = pred hydráciou klienta (rovnaké správanie ako neprihlásený → signin) */
  const [loggedIn, setLoggedIn] = useState<boolean | null>(null)
  /** Ktorá cenníková karta je vizuálne zvýraznená (klik na kartu alebo na CTA) */
  const [focusedPlanId, setFocusedPlanId] = useState<PlanId>(
    () => PLANS.find((p) => p.highlighted)?.id ?? 'pro',
  )
  const [checkoutOpen, setCheckoutOpen] = useState(false)
  const [checkoutDone, setCheckoutDone] = useState(false)
  const [checkoutSubmitting, setCheckoutSubmitting] = useState(false)
  const [checkoutError, setCheckoutError] = useState<string | null>(null)
  const [checkoutPlanId, setCheckoutPlanId] = useState<PlanId>('pro')
  const [paymentForm, setPaymentForm] = useState({
    fullName: '',
    email: '',
    phone: '',
    cardName: '',
    cardNumber: '',
    exp: '',
    cvc: '',
  })

  const selectedPlan = PLANS.find((p) => p.id === checkoutPlanId) || PLANS[2]

  useEffect(() => {
    setLoggedIn(isAuthenticated())
    const onStorage = () => setLoggedIn(isAuthenticated())
    window.addEventListener('storage', onStorage)
    return () => window.removeEventListener('storage', onStorage)
  }, [])

  const hrefPodatInzerat = loggedIn === true ? '/podat-inzerat' : signInHref('/podat-inzerat')

  useEffect(() => {
    if (!checkoutOpen) return
    const originalOverflow = document.body.style.overflow
    document.body.style.overflow = 'hidden'
    return () => {
      document.body.style.overflow = originalOverflow
    }
  }, [checkoutOpen])

  const openCheckout = (planId: PlanId) => {
    setFocusedPlanId(planId)
    if (!isAuthenticated()) {
      window.location.href = signInHref(`/premium#baliky`)
      return
    }
    setCheckoutPlanId(planId)
    setCheckoutDone(false)
    setCheckoutError(null)
    setCheckoutOpen(true)
  }

  const closeCheckout = () => {
    setCheckoutOpen(false)
    setCheckoutDone(false)
    setCheckoutError(null)
    setCheckoutSubmitting(false)
  }

  const handleCheckoutSubmit = async (e: React.FormEvent<HTMLFormElement>) => {
    e.preventDefault()
    setCheckoutError(null)
    if (!isAuthenticated()) {
      setCheckoutError('Pre aktiváciu balíka sa musíte prihlásiť.')
      return
    }
    const planApi: Record<string, 'PLUS' | 'PRO' | 'FIRMA'> = {
      plus: 'PLUS',
      pro: 'PRO',
      firma: 'FIRMA',
    }
    const apiPlan = planApi[checkoutPlanId]
    if (!apiPlan) {
      setCheckoutError('Neplatný balík.')
      return
    }
    setCheckoutSubmitting(true)
    try {
      const profile = await api.activateDemoSubscription(apiPlan)
      setAuthUser({
        id: profile.id,
        email: profile.email,
        firstName: profile.firstName,
        lastName: profile.lastName,
        role: profile.role,
        gender: profile.gender,
        isCompany: profile.isCompany,
        sellerPlan: profile.sellerPlan,
        sellerPlanValidUntil: profile.sellerPlanValidUntil,
      })
      setCheckoutDone(true)
    } catch (err: unknown) {
      const msg = err instanceof Error ? err.message : 'Aktivácia zlyhala.'
      setCheckoutError(msg)
    } finally {
      setCheckoutSubmitting(false)
    }
  }

  return (
    <div className="min-h-screen bg-surface">
      <Header />
      <CategoryNav />

      {/* Hero */}
      <section className="relative border-b border-white/[0.06] bg-surface">
        <div className="relative mx-auto max-w-[1920px] px-4 py-14 sm:px-6 md:py-16 lg:px-8">
          <nav className="mb-8" aria-label="Drobečková navigácia">
            <ol className="flex flex-wrap items-center gap-2 text-sm text-muted">
              <li>
                <Link href="/" className="transition-colors hover:text-accent-light">
                  Domov
                </Link>
              </li>
              <li aria-hidden className="text-white/25">
                /
              </li>
              <li className="font-medium text-white">Prémiové balíky</li>
            </ol>
          </nav>
          <div className="max-w-3xl">
            <p className="mb-4 inline-flex items-center gap-2 text-[10px] font-semibold uppercase tracking-[0.18em] text-muted">
              <span className="flex h-8 w-8 items-center justify-center rounded-lg border border-white/[0.1] bg-white/[0.04]">
                <BadgeCheck className="h-4 w-4 text-accent" strokeWidth={1.75} aria-hidden />
              </span>
              Profesionálne balíky pre predajcov
            </p>
            <h1 className="text-balance text-3xl font-bold leading-tight tracking-tight text-white sm:text-4xl md:text-5xl">
              Jednoduché a férové{' '}
              <span className="font-serif italic text-accent">ceny</span>
            </h1>
            <p className="mt-5 max-w-2xl text-lg leading-relaxed text-muted">
              Vyberte si plán podľa objemu inzerátov. Každý balík jasne definuje rozsah služieb a zvýšenie viditeľnosti
              vo vyhľadávaní.
            </p>
            <div className="mt-8">
              <Link
                href="#baliky"
                className="inline-flex items-center gap-2 rounded-xl border border-transparent bg-accent px-6 py-3.5 font-semibold text-dark shadow-lg shadow-black/20 transition hover:bg-accent-light"
              >
                Porovnať balíky
                <ArrowRight className="h-4 w-4" aria-hidden />
              </Link>
            </div>
          </div>
        </div>
      </section>

      {/* Value props */}
      <section className="border-t border-white/[0.06] bg-surface py-10">
        <div className="relative z-10 mx-auto max-w-[1920px] px-4 sm:px-6 lg:px-8">
          <div className="grid gap-4 sm:grid-cols-3">
            {[
              {
                title: 'Lepšie umiestnenie',
                text: 'Prioritné pozície vo vyhľadávaní a v kategóriách.',
                icon: MapPin,
              },
              {
                title: 'Čistejší profil',
                text: 'Vizuálne odlíšenie, ktoré pôsobí dôveryhodne a profesionálne.',
                icon: Sparkles,
              },
              {
                title: 'Prehľad výkonu',
                text: 'Od balíka Pro získate základné štatistiky inzerátov.',
                icon: BarChart3,
              },
            ].map((item) => {
              const Icon = item.icon
              return (
                <div
                  key={item.title}
                  className="card card-hover flex flex-col p-5 shadow-lg shadow-black/15 transition-all duration-200"
                >
                  <div className="mb-3 flex h-10 w-10 items-center justify-center rounded-lg border border-accent/25 bg-accent/10 text-accent">
                    <Icon className="h-5 w-5" strokeWidth={1.75} aria-hidden />
                  </div>
                  <h2 className="mb-1 font-semibold text-white">{item.title}</h2>
                  <p className="text-sm leading-relaxed text-muted">{item.text}</p>
                </div>
              )
            })}
          </div>
        </div>
      </section>

      {/* Pricing */}
      <section
        id="baliky"
        className="scroll-mt-24 border-t border-white/[0.06] bg-surface py-14 md:py-20"
      >
        <div className="mx-auto max-w-[1920px] px-4 sm:px-6 lg:px-8">
          <div className="mx-auto mb-14 max-w-2xl text-center">
            <h2 className="mb-3 font-serif text-2xl font-bold text-accent sm:text-3xl">Vyberte si balík</h2>
            <p className="leading-relaxed text-muted">
              Vyberte si balík podľa počtu inzerátov a požadovanej viditeľnosti. Ceny sú uvedené za mesiac.
            </p>
          </div>

          <div className="grid items-stretch gap-6 md:grid-cols-2 lg:gap-5 xl:grid-cols-4">
            {PLANS.map((plan) => {
              const Icon = plan.icon
              const isSelected = focusedPlanId === plan.id
              return (
                <article
                  key={plan.id}
                  role="group"
                  tabIndex={0}
                  aria-selected={isSelected}
                  onClick={(e) => {
                    const t = e.target as HTMLElement
                    if (t.closest('a, button')) return
                    setFocusedPlanId(plan.id)
                  }}
                  onKeyDown={(e) => {
                    if (e.key === 'Enter' || e.key === ' ') {
                      e.preventDefault()
                      if (!(e.target as HTMLElement).closest('a, button')) setFocusedPlanId(plan.id)
                    }
                  }}
                  className={`relative flex cursor-pointer flex-col rounded-2xl border p-6 shadow-lg shadow-black/15 transition-all duration-200 outline-none focus-visible:ring-2 focus-visible:ring-accent/40 ${
                    isSelected
                      ? 'border-accent/45 bg-card ring-1 ring-accent/20'
                      : 'border-white/[0.06] bg-card hover:border-white/[0.12] hover:bg-cardHover'
                  }`}
                >
                  {plan.badge && (
                    <span
                      className={`absolute -top-3 left-1/2 z-10 -translate-x-1/2 whitespace-nowrap rounded-full px-3 py-1 text-xs font-bold uppercase tracking-wide ${
                        isSelected ? 'bg-accent text-dark' : 'border border-white/[0.1] bg-white/[0.06] text-muted'
                      }`}
                    >
                      {plan.badge}
                    </span>
                  )}
                  <div className="mb-4 flex items-start justify-between gap-2">
                    <div>
                      <div className="mb-1 flex items-center gap-2">
                        <span className="flex h-9 w-9 items-center justify-center rounded-lg border border-white/[0.08] bg-dark-100/80">
                          <Icon className={`h-4 w-4 ${isSelected ? 'text-accent' : 'text-white'}`} aria-hidden />
                        </span>
                        <h3 className="text-lg font-bold text-white">{plan.name}</h3>
                      </div>
                      <p className="text-sm leading-snug text-muted">{plan.tagline}</p>
                    </div>
                  </div>

                  <div className="mb-5 border-b border-white/[0.06] pb-5">
                    <div className="flex flex-wrap items-baseline gap-1">
                      <span
                        className={`text-3xl font-bold tabular-nums ${
                          plan.price != null && plan.price > 0 ? 'text-accent' : 'text-white'
                        }`}
                      >
                        {formatPriceEUR(plan.price)}
                      </span>
                      {plan.price !== null && plan.price > 0 && (
                        <span className="text-sm font-medium text-muted">/ mesiac</span>
                      )}
                    </div>
                    <p className="mt-2 text-xs leading-relaxed text-muted">{plan.priceNote}</p>
                  </div>

                  <ul className="mb-6 flex-1 space-y-3">
                    {plan.features.map((f) => (
                      <li key={f} className="flex gap-2.5 text-sm text-gray-200">
                        <span
                          className={`mt-0.5 flex h-5 w-5 shrink-0 items-center justify-center rounded-full ${
                            isSelected ? 'bg-accent text-dark' : 'border border-white/[0.1] bg-white/[0.06] text-white'
                          }`}
                        >
                          <Check className="h-3 w-3" strokeWidth={3} aria-hidden />
                        </span>
                        <span className="leading-snug">{f}</span>
                      </li>
                    ))}
                  </ul>

                  {plan.id === 'standard' ? (
                    <Link
                      href={hrefPodatInzerat}
                      onClick={() => setFocusedPlanId(plan.id)}
                      className={`mt-auto inline-flex w-full items-center justify-center gap-2 rounded-xl px-4 py-3.5 text-sm font-semibold transition ${
                        isSelected
                          ? 'bg-accent text-dark shadow-lg shadow-black/20 shadow-accent/25 hover:bg-accent-light'
                          : plan.ctaVariant === 'navy'
                            ? 'border border-transparent bg-dark-100 text-white hover:bg-dark-300'
                            : 'border-2 border-white/[0.1] bg-transparent text-white hover:border-accent hover:text-accent-light'
                      }`}
                    >
                      {plan.cta}
                      <ArrowRight className="h-4 w-4" aria-hidden />
                    </Link>
                  ) : (
                    <button
                      type="button"
                      onClick={() => openCheckout(plan.id)}
                      className={`mt-auto inline-flex w-full items-center justify-center gap-2 rounded-xl px-4 py-3.5 text-sm font-semibold transition ${
                        isSelected
                          ? 'bg-accent text-dark shadow-lg shadow-black/20 shadow-accent/25 hover:bg-accent-light'
                          : plan.ctaVariant === 'navy'
                            ? 'border border-transparent bg-dark-100 text-white hover:bg-dark-300'
                            : 'border-2 border-white/[0.1] bg-transparent text-white hover:border-accent hover:text-accent-light'
                      }`}
                    >
                      {plan.cta}
                      <ArrowRight className="h-4 w-4" aria-hidden />
                    </button>
                  )}
                </article>
              )
            })}
          </div>

          <p className="mx-auto mt-10 max-w-xl text-center text-sm leading-relaxed text-muted">
            Aktivácia prebieha cez checkout okno po výbere balíka. Aktuálne ide o demo režim bez reálneho spracovania
            platobných údajov.
          </p>
        </div>
      </section>

      {/* Comparison hint */}
      <section className="border-t border-white/[0.06] bg-surface py-14 md:py-20">
        <div className="mx-auto max-w-[1920px] px-4 sm:px-6 lg:px-8">
          <div className="grid items-center gap-10 md:grid-cols-2">
            <div>
              <h2 className="mb-4 text-balance font-serif text-2xl font-bold text-accent sm:text-3xl">
                Čo získate navyše
              </h2>
              <p className="mb-6 leading-relaxed text-muted">
                Každý vyšší balík rozširuje možnosti predchádzajúceho. Prirodzene tak rastie viditeľnosť inzerátov,
                dostupné limity a podpora pre profesionálny predaj.
              </p>
              <ul className="space-y-2 text-sm text-gray-200">
                <li className="flex gap-2">
                  <Check className="mt-0.5 h-4 w-4 shrink-0 text-accent" strokeWidth={2} aria-hidden />
                  Jasné mesačné ceny bez skrytých doplatkov.
                </li>
                <li className="flex gap-2">
                  <Check className="mt-0.5 h-4 w-4 shrink-0 text-accent" strokeWidth={2} aria-hidden />
                  Vyšší balík vždy zahŕňa výhody nižšieho.
                </li>
                <li className="flex gap-2">
                  <Check className="mt-0.5 h-4 w-4 shrink-0 text-accent" strokeWidth={2} aria-hidden />
                  Firemný balík je vhodný pre tímy a väčší objem inzerátov.
                </li>
              </ul>
            </div>
            <div className="card p-6 shadow-lg shadow-black/15 md:p-8">
              <h3 className="mb-4 flex items-center gap-2 text-lg font-semibold text-white">
                <HelpCircle className="h-5 w-5 text-accent" strokeWidth={1.75} aria-hidden />
                Stručný prehľad
              </h3>
              <dl className="space-y-4 text-sm">
                <div className="flex justify-between gap-4 border-b border-white/[0.06] pb-3">
                  <dt className="text-muted">Štandard</dt>
                  <dd className="text-right font-semibold text-white">0 € – základ</dd>
                </div>
                <div className="flex justify-between gap-4 border-b border-white/[0.06] pb-3">
                  <dt className="text-muted">Plus</dt>
                  <dd className="text-right font-semibold tabular-nums text-white">8,99 € / mes.</dd>
                </div>
                <div className="flex justify-between gap-4 border-b border-white/[0.06] pb-3">
                  <dt className="text-muted">RentMe Pro</dt>
                  <dd className="text-right font-semibold tabular-nums text-accent">16,99 € / mes.</dd>
                </div>
                <div className="flex justify-between gap-4">
                  <dt className="text-muted">Firma</dt>
                  <dd className="text-right font-semibold tabular-nums text-white">39 € / mes.</dd>
                </div>
              </dl>
            </div>
          </div>
        </div>
      </section>

      {/* FAQ */}
      <section className="border-t border-white/[0.06] bg-surface py-16 md:py-20">
        <div className="mx-auto max-w-3xl px-4 sm:px-6 lg:px-8">
          <h2 className="mb-10 text-center font-serif text-2xl font-bold text-accent">Často kladené otázky</h2>
          <div className="space-y-4">
            {FAQ.map((item) => (
              <details
                key={item.q}
                className="group card open:shadow-md shadow-lg shadow-black/15 transition-shadow"
              >
                <summary className="flex cursor-pointer list-none items-center justify-between gap-3 p-5 font-semibold text-white">
                  <span>{item.q}</span>
                  <span className="text-xl leading-none text-muted transition-transform group-open:rotate-180">▾</span>
                </summary>
                <p className="border-t border-white/[0.06] px-5 pb-5 pt-3 text-sm leading-relaxed text-muted">{item.a}</p>
              </details>
            ))}
          </div>
        </div>
      </section>

      {/* Bottom CTA */}
      <section className="border-t border-white/[0.06] bg-surface pb-20 pt-4">
        <div className="mx-auto max-w-4xl px-4 sm:px-6 lg:px-8">
          <div className="card card-hover p-8 text-center shadow-lg shadow-black/15 md:p-12">
            <h2 className="mb-3 font-serif text-2xl font-bold text-accent md:text-3xl">Začnite jednoducho</h2>
            <p className="mx-auto mb-8 max-w-lg leading-relaxed text-muted">
              Najprv môžete inzerovať v balíku Štandard. Keď budete potrebovať vyššiu viditeľnosť, prejdete na Plus,
              RentMe Pro alebo Firma.
            </p>
            <div className="flex flex-wrap justify-center gap-3">
              <Link
                href="/join"
                className="inline-flex items-center gap-2 rounded-xl bg-accent px-8 py-3.5 font-semibold text-dark shadow-lg shadow-black/20 transition hover:bg-accent-light"
              >
                Vytvoriť účet
              </Link>
              <Link
                href={hrefPodatInzerat}
                className="inline-flex items-center gap-2 rounded-xl border border-white/[0.12] bg-white/[0.04] px-8 py-3.5 font-semibold text-white transition hover:border-white/[0.18] hover:bg-white/[0.08]"
              >
                Pridať inzerát
              </Link>
            </div>
          </div>
        </div>
      </section>

      {checkoutOpen && (
        <div className="fixed inset-0 z-[120] flex items-center justify-center p-4">
          <button
            type="button"
            aria-label="Zatvoriť checkout"
            className="absolute inset-0 bg-black/45 backdrop-blur-sm"
            onClick={closeCheckout}
          />
          <div className="relative w-full max-w-2xl overflow-hidden rounded-2xl border border-white/[0.08] bg-card shadow-2xl shadow-black/40">
            <div className="flex items-center justify-between border-b border-white/[0.06] px-5 py-4">
              <div>
                <p className="text-xs font-semibold uppercase tracking-wide text-muted">Checkout</p>
                <h3 className="text-lg font-bold text-white">Aktivácia balíka {selectedPlan.name}</h3>
              </div>
              <button
                type="button"
                onClick={closeCheckout}
                className="flex h-9 w-9 items-center justify-center rounded-lg border border-white/[0.1] text-muted transition-colors hover:bg-white/[0.06] hover:text-white"
              >
                <X className="w-4 h-4" aria-hidden />
              </button>
            </div>

            {!checkoutDone ? (
              <form onSubmit={handleCheckoutSubmit} className="p-5 md:p-6">
                <div className="rounded-xl border border-accent/20 bg-accent/10 p-4 mb-5">
                  <p className="text-sm text-accent">
                    Vybraný balík: <strong>{selectedPlan.name}</strong> —{' '}
                    <strong>
                      {formatPriceEUR(selectedPlan.price)}
                      {selectedPlan.price && selectedPlan.price > 0 ? ' / mesiac' : ''}
                    </strong>
                  </p>
                </div>

                {checkoutError && (
                  <div className="mb-4 rounded-xl border border-red-800/30 bg-red-900/20 px-4 py-3 text-sm text-red-400">
                    <p>{checkoutError}</p>
                    {checkoutError.includes('prihlásiť') && (
                      <Link
                        href="/signin?redirect=/premium"
                        className="mt-2 inline-block font-semibold text-red-900 underline hover:no-underline"
                      >
                        Prihlásiť sa
                      </Link>
                    )}
                  </div>
                )}

                <div className="grid sm:grid-cols-2 gap-4">
                  <div>
                    <label className="mb-1.5 block text-xs font-medium text-muted">Meno a priezvisko</label>
                    <input
                      required
                      value={paymentForm.fullName}
                      onChange={(e) => setPaymentForm((p) => ({ ...p, fullName: e.target.value }))}
                      placeholder="Ján Novák"
                      className="w-full rounded-xl border border-white/[0.1] bg-dark-100/50 px-3.5 py-2.5 text-sm text-white outline-none placeholder:text-white/35 focus:border-accent focus:ring-2 focus:ring-accent/25"
                    />
                  </div>
                  <div>
                    <label className="mb-1.5 block text-xs font-medium text-muted">E-mail</label>
                    <input
                      type="email"
                      required
                      value={paymentForm.email}
                      onChange={(e) => setPaymentForm((p) => ({ ...p, email: e.target.value }))}
                      placeholder="jan@firma.sk"
                      className="w-full rounded-xl border border-white/[0.1] bg-dark-100/50 px-3.5 py-2.5 text-sm text-white outline-none placeholder:text-white/35 focus:border-accent focus:ring-2 focus:ring-accent/25"
                    />
                  </div>
                  <div className="sm:col-span-2">
                    <label className="mb-1.5 block text-xs font-medium text-muted">Telefón</label>
                    <input
                      required
                      value={paymentForm.phone}
                      onChange={(e) => setPaymentForm((p) => ({ ...p, phone: e.target.value }))}
                      placeholder="+421 900 123 456"
                      className="w-full rounded-xl border border-white/[0.1] bg-dark-100/50 px-3.5 py-2.5 text-sm text-white outline-none placeholder:text-white/35 focus:border-accent focus:ring-2 focus:ring-accent/25"
                    />
                  </div>
                </div>

                <div className="mt-5 rounded-xl border border-white/[0.1] bg-dark-100/30 p-4">
                  <p className="mb-3 flex items-center gap-2 text-sm font-semibold text-white">
                    <CreditCard className="h-4 w-4 text-accent" aria-hidden />
                    Platobné údaje
                  </p>
                  <div className="grid gap-4 sm:grid-cols-2">
                    <div className="sm:col-span-2">
                      <label className="mb-1.5 block text-xs font-medium text-muted">Meno na karte</label>
                      <input
                        required
                        value={paymentForm.cardName}
                        onChange={(e) => setPaymentForm((p) => ({ ...p, cardName: e.target.value }))}
                        placeholder="JAN NOVAK"
                        className="w-full rounded-xl border border-white/[0.1] bg-dark-100/50 px-3.5 py-2.5 text-sm text-white outline-none placeholder:text-white/35 focus:border-accent focus:ring-2 focus:ring-accent/25"
                      />
                    </div>
                    <div className="sm:col-span-2">
                      <label className="mb-1.5 block text-xs font-medium text-muted">Číslo karty</label>
                      <input
                        required
                        value={paymentForm.cardNumber}
                        onChange={(e) => setPaymentForm((p) => ({ ...p, cardNumber: e.target.value }))}
                        placeholder="4242 4242 4242 4242"
                        className="w-full rounded-xl border border-white/[0.1] bg-dark-100/50 px-3.5 py-2.5 text-sm text-white outline-none placeholder:text-white/35 focus:border-accent focus:ring-2 focus:ring-accent/25"
                      />
                    </div>
                    <div>
                      <label className="mb-1.5 block text-xs font-medium text-muted">Expirácia</label>
                      <input
                        required
                        value={paymentForm.exp}
                        onChange={(e) => setPaymentForm((p) => ({ ...p, exp: e.target.value }))}
                        placeholder="MM/RR"
                        className="w-full rounded-xl border border-white/[0.1] bg-dark-100/50 px-3.5 py-2.5 text-sm text-white outline-none placeholder:text-white/35 focus:border-accent focus:ring-2 focus:ring-accent/25"
                      />
                    </div>
                    <div>
                      <label className="mb-1.5 block text-xs font-medium text-muted">CVC</label>
                      <input
                        required
                        value={paymentForm.cvc}
                        onChange={(e) => setPaymentForm((p) => ({ ...p, cvc: e.target.value }))}
                        placeholder="123"
                        className="w-full rounded-xl border border-white/[0.1] bg-dark-100/50 px-3.5 py-2.5 text-sm text-white outline-none placeholder:text-white/35 focus:border-accent focus:ring-2 focus:ring-accent/25"
                      />
                    </div>
                  </div>
                </div>

                <div className="mt-5 flex flex-wrap items-center justify-between gap-3">
                  <p className="flex items-center gap-1.5 text-xs text-muted">
                    <Lock className="h-3.5 w-3.5 shrink-0" aria-hidden />
                    Demo checkout – údaje karty sa neodosielajú; balík sa uloží na účet.
                  </p>
                  <button
                    type="submit"
                    disabled={checkoutSubmitting}
                    className="inline-flex items-center gap-2 rounded-xl bg-accent px-6 py-3 text-sm font-semibold text-dark shadow-lg shadow-black/20 shadow-accent/20 transition hover:bg-accent-light disabled:opacity-60"
                  >
                    {checkoutSubmitting ? 'Aktivujem…' : 'Zaplatiť a aktivovať'}
                    <ArrowRight className="w-4 h-4" aria-hidden />
                  </button>
                </div>
              </form>
            ) : (
              <div className="p-6 md:p-8">
                <div className="rounded-xl border border-accent/20 bg-accent/10 p-5 text-center">
                  <CircleCheckBig className="w-12 h-12 text-accent mx-auto mb-3" aria-hidden />
                  <h4 className="text-lg font-bold text-accent mb-1">Balík je aktivovaný</h4>
                  <p className="text-sm text-accent">
                    <strong>{selectedPlan.name}</strong> je priradený k vášmu účtu (platnosť 30 dní v demo režime).
                    Vaše najnovšie aktívne inzeráty sú automaticky označené ako prioritné podľa limitu balíka a zobrazia sa
                    vyššie v kategóriách a vo vyhľadávaní.
                  </p>
                </div>
                <div className="mt-5 flex justify-center">
                  <button
                    type="button"
                    onClick={closeCheckout}
                    className="inline-flex items-center gap-2 rounded-xl border border-white/[0.1] bg-white/[0.06] px-6 py-3 text-sm font-semibold text-white transition hover:bg-white/[0.1]"
                  >
                    Zavrieť
                  </button>
                </div>
              </div>
            )}
          </div>
        </div>
      )}

      <Footer />
    </div>
  )
}

export default function PremiumPage() {
  return (
    <CmsGate cmsSlug="premium">
      <PremiumPageInner />
    </CmsGate>
  )
}
