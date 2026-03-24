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

/** Značková námorná modrá + zelené akcenty platformy */
const NAVY = 'text-[#0c1a2e]'
const NAVY_BG = 'bg-[#0c1a2e]'

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
    tagline: 'Vhodné na prvé skúsenosti a občasné ponuky.',
    price: 0,
    priceNote: 'Zverejnenie inzerátu podľa platného cenníka kategórie.',
    badge: null,
    highlighted: false,
    icon: Sparkles,
    cta: 'Pridať inzerát',
    ctaHref: '/podat-inzerat',
    ctaVariant: 'outline',
    features: [
      'Základné zaradenie do kategórie a vyhľadávania',
      'Zobrazenie na mape pri vyplnenej lokalite',
      'Štandardná rotácia medzi ostatnými inzerátmi',
      'Notifikácie o správach v rámci účtu',
    ],
  },
  {
    id: 'plus',
    name: 'Plus',
    tagline: 'Jeden inzerát výraznejšie v popredí.',
    price: 8.99,
    priceNote: 'mesačne, jedna aktívna propagácia v rámci balíka.',
    badge: null,
    highlighted: false,
    icon: Zap,
    cta: 'Vybrať Plus',
    ctaHref: '/podat-inzerat?plan=plus',
    ctaVariant: 'outline',
    features: [
      'Všetko zo balíka Štandard',
      '1× mesačne zvýraznenie inzerátu vo výsledkoch (vyššia pozícia)',
      'Jemný vizuálny odlišovač v zozname výsledkov',
      'Prednostné zobrazenie v rámci vášho mesta / regiónu',
      'E-mailové pripomienky pred koncom obdobia propagácie',
    ],
  },
  {
    id: 'pro',
    name: 'RentMe Pro',
    tagline: 'Najlepší pomer viditeľnosti a ceny pre aktívnych predajcov.',
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
      'Až 3 inzeráty s prioritným zaradením súčasne',
      'Výraznejšie miesto v hornej časti výsledkov v kategórii',
      'Priorita na mape (väčší vizuál, lepšia čitateľnosť)',
      'Základné štatistiky: zobrazenia a kliky na detail',
      'Odznak dôvery „Pro predajca“ pri profile',
    ],
  },
  {
    id: 'firma',
    name: 'Firma',
    tagline: 'Pre tímy a firmy s väčším objemom ponúk.',
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
      'Až 10 aktívnych inzerátov s prioritným režimom',
      'Rozšírený firemný profil (logo, IČO, kontakty)',
      'Export prehľadov a mesačný report výkonu',
      'Prioritná e-mailová podpora do 24 hodín',
      'Možnosť individuálnej fakturácie (po dohode)',
    ],
  },
]

const FAQ = [
  {
    q: 'Prečo platiť za balík, keď môžem inzerovať zadarmo?',
    a: 'Základné zverejnenie zostáva dostupné pre každého. Prémiové balíky riešia konkurenciu vo výsledkoch – viac zobrazení, lepšia pozícia a dôvera zákazníkov pri rozhodovaní.',
  },
  {
    q: 'Ako fungujú platby a viazanosť?',
    a: 'Balíky sú koncipované ako mesačný predplatný model s jasným rozsahom. Presné podmienky fakturácie a spôsob úhrady vám potvrdíme pred aktiváciou; pripravujeme platobné rozhranie priamo v účte.',
  },
  {
    q: 'Môžem medzi balíkmi prepínať?',
    a: 'Áno. Upgrade je možný kedykoľvek; pri zmene na nižší balík sa rozdiely prejavia od nasledujúceho fakturačného obdobia, aby ste nestratili už zaplatené výhody.',
  },
  {
    q: 'Čo ak predávam len občas?',
    a: 'Pre občasné ponuky stačí balík Štandard alebo krátkodobý Plus. Pre pravidelnú aktivitu sa oplatí RentMe Pro – lepšia viditeľnosť viacerých ponúk naraz.',
  },
]

function formatPriceEUR(n: number | null): string {
  if (n === null) return '—'
  if (n === 0) return '0 €'
  return `${n.toLocaleString('sk-SK', { minimumFractionDigits: 2, maximumFractionDigits: 2 })} €`
}

export default function PremiumPage() {
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
    if (!checkoutOpen) return
    const originalOverflow = document.body.style.overflow
    document.body.style.overflow = 'hidden'
    return () => {
      document.body.style.overflow = originalOverflow
    }
  }, [checkoutOpen])

  const openCheckout = (planId: PlanId) => {
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
    <div className="min-h-screen bg-[#f4f6f9]">
      <Header />
      <CategoryNav />

      {/* Hero */}
      <section className={`relative ${NAVY_BG} text-white overflow-hidden`}>
        <div
          className="pointer-events-none absolute inset-0 opacity-[0.07]"
          style={{
            backgroundImage: `url("data:image/svg+xml,%3Csvg width='60' height='60' viewBox='0 0 60 60' xmlns='http://www.w3.org/2000/svg'%3E%3Cg fill='none' fill-rule='evenodd'%3E%3Cg fill='%23ffffff' fill-opacity='1'%3E%3Cpath d='M36 34v2H24v-2h12zm0-4v2H24v-2h12z'/%3E%3C/g%3E%3C/g%3E%3C/svg%3E")`,
          }}
          aria-hidden
        />
        <div className="absolute top-0 right-0 w-[min(100%,480px)] h-80 bg-gradient-to-bl from-emerald-500/20 to-transparent rounded-bl-[100%] blur-3xl" aria-hidden />
        <div className="relative max-w-6xl mx-auto px-4 sm:px-6 lg:px-8 py-16 md:py-20">
          <nav className="mb-8" aria-label="Drobečková navigácia">
            <ol className="flex flex-wrap items-center gap-2 text-sm text-white/60">
              <li>
                <Link href="/" className="hover:text-white transition-colors">
                  Domov
                </Link>
              </li>
              <li aria-hidden className="text-white/30">
                /
              </li>
              <li className="text-white font-medium">Prémiové balíky</li>
            </ol>
          </nav>
          <div className="max-w-3xl">
            <p className="inline-flex items-center gap-2 text-emerald-400 font-semibold text-sm uppercase tracking-widest mb-4">
              <BadgeCheck className="w-4 h-4" aria-hidden />
              Pre predajcov a poskytovateľov služieb
            </p>
            <h1 className="text-3xl sm:text-4xl md:text-5xl font-bold tracking-tight text-balance leading-tight">
              Prémiové balíky, ktoré dávajú zmysel
            </h1>
            <p className="mt-5 text-lg text-white/80 leading-relaxed max-w-2xl">
              Získajte vyššiu viditeľnosť, profesionálny dojem a lepšie výsledky pri predaji služieb alebo prenájmu.
              Ceny sú nastavené tak, aby sa oplatili jednotlivcovi aj firme – od prvého inzerátu po desiatky ponúk.
            </p>
            <div className="mt-8 flex flex-wrap gap-3">
              <Link
                href="#baliky"
                className="inline-flex items-center gap-2 px-6 py-3.5 rounded-xl font-semibold text-[#0c1a2e] bg-white hover:bg-gray-100 transition shadow-lg shadow-black/20"
              >
                Porovnať balíky
                <ArrowRight className="w-4 h-4" aria-hidden />
              </Link>
              <Link
                href="/podat-inzerat"
                className="inline-flex items-center gap-2 px-6 py-3.5 rounded-xl font-semibold text-white border border-white/30 hover:bg-white/10 transition"
              >
                Pridať inzerát
              </Link>
            </div>
          </div>
        </div>
      </section>

      {/* Value props */}
      <section className="max-w-6xl mx-auto px-4 sm:px-6 lg:px-8 -mt-8 relative z-10">
        <div className="grid sm:grid-cols-3 gap-4">
          {[
            {
              title: 'Lepšia pozícia',
              text: 'Prioritné zaradenie tam, kde zákazníci hľadajú – vo výsledkoch aj na mape.',
              icon: MapPin,
            },
            {
              title: 'Menej hluku',
              text: 'Vizuálne zvýraznenie a odznaky pomáhajú odlíšiť vašu ponuku od konkurencie.',
              icon: Sparkles,
            },
            {
              title: 'Merať výkon',
              text: 'Od balíka Pro máte prehľad o záujme – zobrazenia a kliky na váš inzerát.',
              icon: BarChart3,
            },
          ].map((item) => {
            const Icon = item.icon
            return (
              <div
                key={item.title}
                className="rounded-2xl bg-white border border-gray-200/90 p-5 shadow-sm hover:shadow-md transition-shadow"
              >
                <div className="w-10 h-10 rounded-xl bg-[#0c1a2e]/5 flex items-center justify-center mb-3">
                  <Icon className="w-5 h-5 text-[#0c1a2e]" aria-hidden />
                </div>
                <h2 className={`font-semibold ${NAVY} mb-1`}>{item.title}</h2>
                <p className="text-sm text-gray-600 leading-relaxed">{item.text}</p>
              </div>
            )
          })}
        </div>
      </section>

      {/* Pricing */}
      <section id="baliky" className="max-w-6xl mx-auto px-4 sm:px-6 lg:px-8 py-16 md:py-24 scroll-mt-24">
        <div className="text-center max-w-2xl mx-auto mb-14">
          <h2 className={`text-2xl sm:text-3xl font-bold ${NAVY} mb-3`}>Vyberte si balík</h2>
          <p className="text-gray-600 leading-relaxed">
            Štyri úrovne – od nezáväzného štartu až po firemné riešenie. Všetky ceny sú s DPH a za kalendárny mesiac
            používania služieb v rozsahu uvedenom pri balíku.
          </p>
        </div>

        <div className="grid md:grid-cols-2 xl:grid-cols-4 gap-6 lg:gap-5 items-stretch">
          {PLANS.map((plan) => {
            const Icon = plan.icon
            const isPro = plan.highlighted
            return (
              <article
                key={plan.id}
                className={`relative flex flex-col rounded-2xl border bg-white p-6 shadow-sm transition-all ${
                  isPro
                    ? 'border-emerald-500/60 shadow-xl shadow-emerald-500/10 ring-2 ring-emerald-500/30 scale-[1.02] xl:scale-105 z-[1]'
                    : 'border-gray-200/90 hover:border-gray-300 hover:shadow-md'
                }`}
              >
                {plan.badge && (
                  <span
                    className={`absolute -top-3 left-1/2 -translate-x-1/2 text-xs font-bold uppercase tracking-wide px-3 py-1 rounded-full whitespace-nowrap ${
                      isPro ? 'bg-emerald-500 text-white shadow-md' : 'bg-[#0c1a2e] text-white'
                    }`}
                  >
                    {plan.badge}
                  </span>
                )}
                <div className="flex items-start justify-between gap-2 mb-4">
                  <div>
                    <div className="flex items-center gap-2 mb-1">
                      <span className="w-9 h-9 rounded-lg bg-gray-100 flex items-center justify-center">
                        <Icon className={`w-4 h-4 ${isPro ? 'text-emerald-600' : 'text-[#0c1a2e]'}`} aria-hidden />
                      </span>
                      <h3 className={`text-lg font-bold ${NAVY}`}>{plan.name}</h3>
                    </div>
                    <p className="text-sm text-gray-600 leading-snug">{plan.tagline}</p>
                  </div>
                </div>

                <div className="mb-5 pb-5 border-b border-gray-100">
                  <div className="flex items-baseline gap-1 flex-wrap">
                    <span className={`text-3xl font-bold tabular-nums ${NAVY}`}>
                      {formatPriceEUR(plan.price)}
                    </span>
                    {plan.price !== null && plan.price > 0 && (
                      <span className="text-gray-500 text-sm font-medium">/ mesiac</span>
                    )}
                  </div>
                  <p className="text-xs text-gray-500 mt-2 leading-relaxed">{plan.priceNote}</p>
                </div>

                <ul className="space-y-3 flex-1 mb-6">
                  {plan.features.map((f) => (
                    <li key={f} className="flex gap-2.5 text-sm text-gray-700">
                      <span
                        className={`mt-0.5 flex h-5 w-5 shrink-0 items-center justify-center rounded-full ${
                          isPro ? 'bg-emerald-500 text-white' : 'bg-[#0c1a2e] text-white'
                        }`}
                      >
                        <Check className="w-3 h-3" strokeWidth={3} aria-hidden />
                      </span>
                      <span className="leading-snug">{f}</span>
                    </li>
                  ))}
                </ul>

                {plan.id === 'standard' ? (
                  <Link
                    href={plan.ctaHref}
                    className={`mt-auto inline-flex w-full items-center justify-center gap-2 rounded-xl py-3.5 px-4 text-sm font-semibold transition ${
                      plan.ctaVariant === 'primary'
                        ? 'text-white bg-[#1dbf73] hover:bg-[#19a463] shadow-lg shadow-[#1dbf73]/25'
                        : plan.ctaVariant === 'navy'
                          ? 'text-white bg-[#0c1a2e] hover:bg-[#152a45] border border-transparent'
                          : 'text-[#0c1a2e] bg-white border-2 border-gray-200 hover:border-[#1dbf73] hover:text-[#1dbf73]'
                    }`}
                  >
                    {plan.cta}
                    <ArrowRight className="w-4 h-4" aria-hidden />
                  </Link>
                ) : (
                  <button
                    type="button"
                    onClick={() => openCheckout(plan.id)}
                    className={`mt-auto inline-flex w-full items-center justify-center gap-2 rounded-xl py-3.5 px-4 text-sm font-semibold transition ${
                      plan.ctaVariant === 'primary'
                        ? 'text-white bg-[#1dbf73] hover:bg-[#19a463] shadow-lg shadow-[#1dbf73]/25'
                        : plan.ctaVariant === 'navy'
                          ? 'text-white bg-[#0c1a2e] hover:bg-[#152a45] border border-transparent'
                          : 'text-[#0c1a2e] bg-white border-2 border-gray-200 hover:border-[#1dbf73] hover:text-[#1dbf73]'
                    }`}
                  >
                    {plan.cta}
                    <ArrowRight className="w-4 h-4" aria-hidden />
                  </button>
                )}
              </article>
            )
          })}
        </div>

        <p className="text-center text-sm text-gray-500 mt-10 max-w-xl mx-auto leading-relaxed">
          Aktivácia prebieha priamo cez checkout popup po kliknutí na tlačidlo balíka. Aktuálne je to demo platobného
          procesu na otestovanie UX.
        </p>
      </section>

      {/* Comparison hint */}
      <section className={`${NAVY_BG} text-white`}>
        <div className="max-w-6xl mx-auto px-4 sm:px-6 lg:px-8 py-14 md:py-20">
          <div className="grid md:grid-cols-2 gap-10 items-center">
            <div>
              <h2 className="text-2xl sm:text-3xl font-bold mb-4 text-balance">
                Logika cien: platíte za viditeľnosť, nie za „tajné“ funkcie
              </h2>
              <p className="text-white/75 leading-relaxed mb-6">
                Štandard pokrýva férové zaradenie pre každého. Plus pridáva cielené zvýraznenie jednej ponuky. RentMe
                Pro je optimalizovaný pre tých, ktorí súťažia o zákazníka aktívne – viac inzerátov, dáta a dôveryhodný
                profil. Firma spája objem, reporting a podporu pre tímy.
              </p>
              <ul className="space-y-2 text-sm text-white/85">
                <li className="flex gap-2">
                  <Check className="w-4 h-4 text-emerald-400 shrink-0 mt-0.5" aria-hidden />
                  Žiadne skryté poplatky za založenie účtu alebo základný inzerát.
                </li>
                <li className="flex gap-2">
                  <Check className="w-4 h-4 text-emerald-400 shrink-0 mt-0.5" aria-hidden />
                  Vyšší balík vždy obsahuje výhody nižších – nič neduplikujete zbytočne.
                </li>
                <li className="flex gap-2">
                  <Check className="w-4 h-4 text-emerald-400 shrink-0 mt-0.5" aria-hidden />
                  Firemný balík možno prispôsobiť – viac inzerátov alebo faktúra na IČO.
                </li>
              </ul>
            </div>
            <div className="rounded-2xl bg-white/5 border border-white/10 p-6 md:p-8 backdrop-blur-sm">
              <h3 className="font-semibold text-lg mb-4 flex items-center gap-2">
                <HelpCircle className="w-5 h-5 text-emerald-400" aria-hidden />
                Stručný prehľad
              </h3>
              <dl className="space-y-4 text-sm">
                <div className="flex justify-between gap-4 border-b border-white/10 pb-3">
                  <dt className="text-white/70">Štandard</dt>
                  <dd className="font-semibold text-right">0 € – základ</dd>
                </div>
                <div className="flex justify-between gap-4 border-b border-white/10 pb-3">
                  <dt className="text-white/70">Plus</dt>
                  <dd className="font-semibold text-right tabular-nums">8,99 € / mes.</dd>
                </div>
                <div className="flex justify-between gap-4 border-b border-white/10 pb-3">
                  <dt className="text-white/70">RentMe Pro</dt>
                  <dd className="font-semibold text-right text-emerald-400 tabular-nums">16,99 € / mes.</dd>
                </div>
                <div className="flex justify-between gap-4">
                  <dt className="text-white/70">Firma</dt>
                  <dd className="font-semibold text-right tabular-nums">39 € / mes.</dd>
                </div>
              </dl>
            </div>
          </div>
        </div>
      </section>

      {/* FAQ */}
      <section className="max-w-3xl mx-auto px-4 sm:px-6 lg:px-8 py-16 md:py-20">
        <h2 className={`text-2xl font-bold ${NAVY} text-center mb-10`}>Často kladené otázky</h2>
        <div className="space-y-4">
          {FAQ.map((item) => (
            <details
              key={item.q}
              className="group rounded-2xl border border-gray-200 bg-white p-5 shadow-sm open:shadow-md transition-shadow"
            >
              <summary className="font-semibold text-gray-900 cursor-pointer list-none flex items-center justify-between gap-3">
                <span>{item.q}</span>
                <span className="text-gray-400 group-open:rotate-180 transition-transform text-xl leading-none">
                  ▾
                </span>
              </summary>
              <p className="mt-3 text-sm text-gray-600 leading-relaxed border-t border-gray-100 pt-3">{item.a}</p>
            </details>
          ))}
        </div>
      </section>

      {/* Bottom CTA */}
      <section className="pb-20">
        <div className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="rounded-3xl bg-gradient-to-br from-emerald-500 to-emerald-600 p-8 md:p-12 text-center text-white shadow-xl shadow-emerald-500/20">
            <h2 className="text-2xl md:text-3xl font-bold mb-3">Pripravení zarobiť na svojej ponuke?</h2>
            <p className="text-white/90 max-w-lg mx-auto mb-8 leading-relaxed">
              Začnite inzerátom alebo sa zaregistrujte – prémiový balík si môžete zvoliť, keď budete chcieť viac
              pozornosti.
            </p>
            <div className="flex flex-wrap justify-center gap-3">
              <Link
                href="/join"
                className="inline-flex items-center gap-2 px-8 py-3.5 rounded-xl font-semibold text-emerald-600 bg-white hover:bg-gray-50 transition shadow-lg"
              >
                Vytvoriť účet
              </Link>
              <Link
                href="/podat-inzerat"
                className="inline-flex items-center gap-2 px-8 py-3.5 rounded-xl font-semibold text-white border-2 border-white/80 hover:bg-white/10 transition"
              >
                Podať inzerát
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
            className="absolute inset-0 bg-[#0c1a2e]/65 backdrop-blur-[2px]"
            onClick={closeCheckout}
          />
          <div className="relative w-full max-w-2xl rounded-2xl bg-white border border-gray-200 shadow-2xl overflow-hidden">
            <div className="px-5 py-4 border-b border-gray-100 flex items-center justify-between">
              <div>
                <p className="text-xs font-semibold uppercase tracking-wide text-gray-500">Checkout</p>
                <h3 className="text-lg font-bold text-[#0c1a2e]">Aktivácia balíka {selectedPlan.name}</h3>
              </div>
              <button
                type="button"
                onClick={closeCheckout}
                className="w-9 h-9 rounded-lg border border-gray-200 text-gray-500 hover:text-gray-700 hover:bg-gray-50 flex items-center justify-center"
              >
                <X className="w-4 h-4" aria-hidden />
              </button>
            </div>

            {!checkoutDone ? (
              <form onSubmit={handleCheckoutSubmit} className="p-5 md:p-6">
                <div className="rounded-xl border border-emerald-100 bg-emerald-50 p-4 mb-5">
                  <p className="text-sm text-emerald-800">
                    Vybraný balík: <strong>{selectedPlan.name}</strong> —{' '}
                    <strong>
                      {formatPriceEUR(selectedPlan.price)}
                      {selectedPlan.price && selectedPlan.price > 0 ? ' / mesiac' : ''}
                    </strong>
                  </p>
                </div>

                {checkoutError && (
                  <div className="mb-4 rounded-xl border border-red-200 bg-red-50 px-4 py-3 text-sm text-red-800">
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
                    <label className="block text-xs font-medium text-gray-500 mb-1.5">Meno a priezvisko</label>
                    <input
                      required
                      value={paymentForm.fullName}
                      onChange={(e) => setPaymentForm((p) => ({ ...p, fullName: e.target.value }))}
                      placeholder="Ján Novák"
                      className="w-full border border-gray-200 rounded-xl px-3.5 py-2.5 text-sm text-gray-900 focus:ring-2 focus:ring-[#1dbf73]/30 focus:border-[#1dbf73] outline-none"
                    />
                  </div>
                  <div>
                    <label className="block text-xs font-medium text-gray-500 mb-1.5">E-mail</label>
                    <input
                      type="email"
                      required
                      value={paymentForm.email}
                      onChange={(e) => setPaymentForm((p) => ({ ...p, email: e.target.value }))}
                      placeholder="jan@firma.sk"
                      className="w-full border border-gray-200 rounded-xl px-3.5 py-2.5 text-sm text-gray-900 focus:ring-2 focus:ring-[#1dbf73]/30 focus:border-[#1dbf73] outline-none"
                    />
                  </div>
                  <div className="sm:col-span-2">
                    <label className="block text-xs font-medium text-gray-500 mb-1.5">Telefón</label>
                    <input
                      required
                      value={paymentForm.phone}
                      onChange={(e) => setPaymentForm((p) => ({ ...p, phone: e.target.value }))}
                      placeholder="+421 900 123 456"
                      className="w-full border border-gray-200 rounded-xl px-3.5 py-2.5 text-sm text-gray-900 focus:ring-2 focus:ring-[#1dbf73]/30 focus:border-[#1dbf73] outline-none"
                    />
                  </div>
                </div>

                <div className="mt-5 rounded-xl border border-gray-200 p-4">
                  <p className="text-sm font-semibold text-[#0c1a2e] mb-3 flex items-center gap-2">
                    <CreditCard className="w-4 h-4 text-[#1dbf73]" aria-hidden />
                    Platobné údaje
                  </p>
                  <div className="grid sm:grid-cols-2 gap-4">
                    <div className="sm:col-span-2">
                      <label className="block text-xs font-medium text-gray-500 mb-1.5">Meno na karte</label>
                      <input
                        required
                        value={paymentForm.cardName}
                        onChange={(e) => setPaymentForm((p) => ({ ...p, cardName: e.target.value }))}
                        placeholder="JAN NOVAK"
                        className="w-full border border-gray-200 rounded-xl px-3.5 py-2.5 text-sm text-gray-900 focus:ring-2 focus:ring-[#1dbf73]/30 focus:border-[#1dbf73] outline-none"
                      />
                    </div>
                    <div className="sm:col-span-2">
                      <label className="block text-xs font-medium text-gray-500 mb-1.5">Číslo karty</label>
                      <input
                        required
                        value={paymentForm.cardNumber}
                        onChange={(e) => setPaymentForm((p) => ({ ...p, cardNumber: e.target.value }))}
                        placeholder="4242 4242 4242 4242"
                        className="w-full border border-gray-200 rounded-xl px-3.5 py-2.5 text-sm text-gray-900 focus:ring-2 focus:ring-[#1dbf73]/30 focus:border-[#1dbf73] outline-none"
                      />
                    </div>
                    <div>
                      <label className="block text-xs font-medium text-gray-500 mb-1.5">Expirácia</label>
                      <input
                        required
                        value={paymentForm.exp}
                        onChange={(e) => setPaymentForm((p) => ({ ...p, exp: e.target.value }))}
                        placeholder="MM/RR"
                        className="w-full border border-gray-200 rounded-xl px-3.5 py-2.5 text-sm text-gray-900 focus:ring-2 focus:ring-[#1dbf73]/30 focus:border-[#1dbf73] outline-none"
                      />
                    </div>
                    <div>
                      <label className="block text-xs font-medium text-gray-500 mb-1.5">CVC</label>
                      <input
                        required
                        value={paymentForm.cvc}
                        onChange={(e) => setPaymentForm((p) => ({ ...p, cvc: e.target.value }))}
                        placeholder="123"
                        className="w-full border border-gray-200 rounded-xl px-3.5 py-2.5 text-sm text-gray-900 focus:ring-2 focus:ring-[#1dbf73]/30 focus:border-[#1dbf73] outline-none"
                      />
                    </div>
                  </div>
                </div>

                <div className="mt-5 flex items-center justify-between gap-3 flex-wrap">
                  <p className="text-xs text-gray-500 flex items-center gap-1.5">
                    <Lock className="w-3.5 h-3.5" aria-hidden />
                    Demo checkout – údaje karty sa neodosielajú; balík sa uloží na účet.
                  </p>
                  <button
                    type="submit"
                    disabled={checkoutSubmitting}
                    className="inline-flex items-center gap-2 px-6 py-3 rounded-xl text-sm font-semibold text-white bg-[#1dbf73] hover:bg-[#19a463] transition shadow-lg shadow-[#1dbf73]/20 disabled:opacity-60"
                  >
                    {checkoutSubmitting ? 'Aktivujem…' : 'Zaplatiť a aktivovať'}
                    <ArrowRight className="w-4 h-4" aria-hidden />
                  </button>
                </div>
              </form>
            ) : (
              <div className="p-6 md:p-8">
                <div className="rounded-xl border border-emerald-200 bg-emerald-50 p-5 text-center">
                  <CircleCheckBig className="w-12 h-12 text-emerald-600 mx-auto mb-3" aria-hidden />
                  <h4 className="text-lg font-bold text-emerald-900 mb-1">Balík je aktivovaný</h4>
                  <p className="text-sm text-emerald-800">
                    <strong>{selectedPlan.name}</strong> je priradený k vášmu účtu (platnosť 30 dní v demo režime).
                    Vaše najnovšie aktívne inzeráty sú automaticky označené ako prioritné podľa limitu balíka a zobrazia sa
                    vyššie v kategóriách a vo vyhľadávaní.
                  </p>
                </div>
                <div className="mt-5 flex justify-center">
                  <button
                    type="button"
                    onClick={closeCheckout}
                    className="inline-flex items-center gap-2 px-6 py-3 rounded-xl text-sm font-semibold text-white bg-[#0c1a2e] hover:bg-[#152a45] transition"
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
