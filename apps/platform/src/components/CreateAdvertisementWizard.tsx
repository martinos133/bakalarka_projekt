'use client'

import { useCallback, useEffect, useMemo, useRef, useState, type ChangeEvent } from 'react'
import { ChevronLeft, Search } from 'lucide-react'
import { api } from '@/lib/api'
import { getCoordsFromLocation } from '@/lib/mapRegions'
import CategorySpecificationsForm from './dashboard/CategorySpecificationsForm'
import AdvertisementAdForm, { type AdFormDataState } from './AdvertisementAdForm'
import type { Filter } from '@inzertna-platforma/shared'

type Phase = 'root' | 'sub' | 'form'

function sortByOrder(a: { order?: number }, b: { order?: number }) {
  return (a.order || 0) - (b.order || 0)
}

function activeChildrenOf(root: any): any[] {
  return (root?.children?.filter((c: any) => c.status === 'ACTIVE') || []).slice().sort(sortByOrder)
}

function rootsFrom(categories: any[]) {
  return categories.filter((c) => !c.parentId && c.status === 'ACTIVE').sort(sortByOrder)
}

function findCategoryNode(categories: any[], id: string): any | null {
  for (const c of categories) {
    if (c.id === id) return c
    for (const ch of c.children || []) {
      if (ch.id === id) return ch
    }
  }
  return null
}

function CategoryVisualTile({
  cat,
  selected,
  onSelect,
  tileVariant = 'platform',
}: {
  cat: any
  selected: boolean
  onSelect: () => void
  tileVariant?: 'platform' | 'admin'
}) {
  const accent = cat.color?.trim() || (tileVariant === 'admin' ? 'rgb(59,130,246)' : '#c9a96e')
  const isAdmin = tileVariant === 'admin'
  return (
    <button
      type="button"
      onClick={onSelect}
      className={
        isAdmin
          ? `group flex flex-col items-center rounded-xl border-2 bg-card px-2 py-5 text-center transition-all focus:outline-none focus-visible:ring-2 focus-visible:ring-primary ${
              selected
                ? 'border-primary shadow-lg shadow-black/20 shadow-primary/10 ring-2 ring-primary/25'
                : 'border-card hover:border-primary/40 hover:bg-cardHover'
            }`
          : `group flex flex-col items-center rounded-2xl border-2 bg-dark px-2 py-5 text-center shadow-sm transition-all hover:shadow-md focus:outline-none focus-visible:ring-2 focus-visible:ring-[#c9a96e] ${
              selected ? 'border-accent ring-2 ring-[#c9a96e]/25' : 'border-white/80 hover:border-[#c9a96e]/40'
            }`
      }
    >
      <div
        className="mb-3 flex h-[72px] w-[72px] items-center justify-center overflow-hidden rounded-2xl sm:h-20 sm:w-20"
        style={{ backgroundColor: `${accent}22` }}
      >
        {cat.image ? (
          <img src={cat.image} alt="" className="h-full w-full object-cover" />
        ) : cat.icon ? (
          <span className="text-4xl leading-none sm:text-[2.75rem]" aria-hidden>
            {cat.icon}
          </span>
        ) : (
          <span className="text-xl font-bold sm:text-2xl" style={{ color: accent }}>
            {(cat.name || '?').charAt(0).toUpperCase()}
          </span>
        )}
      </div>
      <span
        className={`line-clamp-2 text-sm font-semibold leading-tight sm:text-base ${isAdmin ? 'text-white' : 'text-white'}`}
      >
        {cat.name}
      </span>
    </button>
  )
}

const emptyAdForm = (): AdFormDataState => ({
  title: '',
  description: '',
  price: '',
  categoryId: '',
  location: '',
  postalCode: '',
  type: 'SERVICE',
  images: [],
  pricingType: 'FIXED',
  hourlyRate: '',
  dailyRate: '',
  packages: [],
  deliveryTime: '',
  revisions: '',
  features: [],
  faq: [],
})

export type CreateAdvertisementWizardProps = {
  categories: any[]
  /** `admin` = tmavý vizuál zladený s admin panelom (CEO / interná správa) */
  variant?: 'embed' | 'page' | 'admin'
  initialEditId?: string | null
  /** Predvýber podľa slug (z URL napr. z kategórnej stránky) */
  initialCategorySlug?: string | null
  onCancelEdit?: () => void
  onComplete?: (payload: { mode: 'create' | 'update'; advertisement: any }) => void
}

export default function CreateAdvertisementWizard({
  categories,
  variant = 'embed',
  initialEditId = null,
  initialCategorySlug = null,
  onCancelEdit,
  onComplete,
}: CreateAdvertisementWizardProps) {
  const isAdmin = variant === 'admin'
  const appliedInitialSlug = useRef(false)
  const [phase, setPhase] = useState<Phase>('root')
  const [rootId, setRootId] = useState<string | null>(null)
  const [subId, setSubId] = useState<string | null>(null)
  const [categoryQuery, setCategoryQuery] = useState('')

  const [adFormData, setAdFormData] = useState<AdFormDataState>(emptyAdForm)
  const [specificationValues, setSpecificationValues] = useState<Record<string, unknown>>({})
  const [categoryFilters, setCategoryFilters] = useState<Filter[]>([])
  const [newFeature, setNewFeature] = useState('')
  const [newPackage, setNewPackage] = useState<any>({
    name: '',
    description: '',
    price: '',
    deliveryTime: '',
    features: [],
  })
  const [newPackageFeature, setNewPackageFeature] = useState('')
  const [newFAQ, setNewFAQ] = useState<any>({ question: '', answer: '' })

  const [saving, setSaving] = useState(false)
  const [error, setError] = useState('')
  const [success, setSuccess] = useState('')
  const [editingId, setEditingId] = useState<string | null>(null)

  const roots = useMemo(() => rootsFrom(categories), [categories])
  const filteredRoots = useMemo(() => {
    const q = categoryQuery.trim().toLowerCase()
    if (!q) return roots
    return roots.filter((r) => r.name?.toLowerCase().includes(q))
  }, [roots, categoryQuery])

  const selectedRoot = useMemo(
    () => (rootId ? roots.find((r) => r.id === rootId) || null : null),
    [roots, rootId],
  )
  const subcategories = useMemo(() => (selectedRoot ? activeChildrenOf(selectedRoot) : []), [selectedRoot])

  const effectiveCategoryId = useMemo(() => {
    if (phase !== 'form') return null
    return subId || rootId || adFormData.categoryId || null
  }, [phase, subId, rootId, adFormData.categoryId])

  useEffect(() => {
    if (phase !== 'form' || !effectiveCategoryId) {
      if (phase !== 'form') setCategoryFilters([])
      return
    }
    setAdFormData((prev) =>
      prev.categoryId === effectiveCategoryId ? prev : { ...prev, categoryId: effectiveCategoryId },
    )
    let cancelled = false
    api
      .getActiveFilters(effectiveCategoryId)
      .then((rows) => {
        if (!cancelled) setCategoryFilters(Array.isArray(rows) ? rows : [])
      })
      .catch(() => {
        if (!cancelled) setCategoryFilters([])
      })
    return () => {
      cancelled = true
    }
  }, [phase, effectiveCategoryId])

  const resetNewAdFlow = useCallback(() => {
    setPhase('root')
    setRootId(null)
    setSubId(null)
    setCategoryQuery('')
    setAdFormData(emptyAdForm())
    setSpecificationValues({})
    setCategoryFilters([])
    setNewFeature('')
    setNewPackage({ name: '', description: '', price: '', deliveryTime: '', features: [] })
    setNewPackageFeature('')
    setNewFAQ({ question: '', answer: '' })
    setEditingId(null)
    setError('')
  }, [])

  useEffect(() => {
    if (!initialEditId) return
    let cancelled = false
    ;(async () => {
      try {
        setError('')
        const fullAd = await api.getAdvertisement(initialEditId)
        if (cancelled) return
        const catId = fullAd.categoryId || fullAd.category?.id || ''
        const node = catId ? findCategoryNode(categories, catId) : null
        if (node?.parentId) {
          setRootId(node.parentId)
          setSubId(node.id)
        } else if (catId) {
          setRootId(catId)
          setSubId(null)
        } else {
          setRootId(null)
          setSubId(null)
        }
        setAdFormData({
          title: fullAd.title || '',
          description: fullAd.description || '',
          price: fullAd.price != null ? String(fullAd.price) : '',
          categoryId: catId,
          location: fullAd.location || '',
          postalCode: fullAd.postalCode || '',
          type: fullAd.type || 'SERVICE',
          images: fullAd.images || [],
          pricingType: fullAd.pricingType || 'FIXED',
          hourlyRate: fullAd.hourlyRate != null ? String(fullAd.hourlyRate) : '',
          dailyRate: fullAd.dailyRate != null ? String(fullAd.dailyRate) : '',
          packages: fullAd.packages || [],
          deliveryTime: fullAd.deliveryTime || '',
          revisions: fullAd.revisions || '',
          features: fullAd.features || [],
          faq: fullAd.faq || [],
        })
        const specs = fullAd.specifications
        setSpecificationValues(
          specs && typeof specs === 'object' && !Array.isArray(specs)
            ? { ...(specs as Record<string, unknown>) }
            : {},
        )
        setEditingId(fullAd.id)
        setPhase('form')
      } catch (e: any) {
        if (!cancelled) setError(e?.message || 'Chyba pri načítaní inzerátu')
      }
    })()
    return () => {
      cancelled = true
    }
  }, [initialEditId, categories])

  useEffect(() => {
    if (appliedInitialSlug.current || initialEditId || !initialCategorySlug?.trim() || categories.length === 0) {
      return
    }
    const slug = initialCategorySlug.trim().toLowerCase()
    const roots = rootsFrom(categories)
    for (const r of roots) {
      if (r.slug?.toLowerCase() === slug) {
        setRootId(r.id)
        setSubId(null)
        const kids = activeChildrenOf(r)
        if (kids.length > 0) {
          setPhase('sub')
        } else {
          setPhase('form')
          setAdFormData((prev) => ({ ...prev, categoryId: r.id }))
        }
        appliedInitialSlug.current = true
        return
      }
      for (const ch of activeChildrenOf(r)) {
        if (ch.slug?.toLowerCase() === slug) {
          setRootId(r.id)
          setSubId(ch.id)
          setPhase('form')
          setAdFormData((prev) => ({ ...prev, categoryId: ch.id }))
          appliedInitialSlug.current = true
          return
        }
      }
    }
  }, [initialCategorySlug, categories, initialEditId])

  const handleImageUpload = (e: ChangeEvent<HTMLInputElement>) => {
    const files = e.target.files
    if (!files) return
    Array.from(files).forEach((file) => {
      const reader = new FileReader()
      reader.onloadend = () => {
        setAdFormData((prev) => ({
          ...prev,
          images: [...prev.images, reader.result as string],
        }))
      }
      reader.readAsDataURL(file)
    })
  }

  const removeImage = (index: number) => {
    setAdFormData((prev) => ({
      ...prev,
      images: prev.images.filter((_, i) => i !== index),
    }))
  }

  const handleSubmit = async () => {
    if (!editingId && phase !== 'form') {
      setError('Dokončite výber kategórie')
      return
    }
    if (!adFormData.categoryId) {
      setError('Vyberte kategóriu')
      return
    }
    if (!adFormData.title?.trim() || !adFormData.description?.trim()) {
      setError('Vyplňte názov a popis')
      return
    }

    try {
      setSaving(true)
      setError('')
      const coords = getCoordsFromLocation(adFormData.location || null)
      const payload: any = {
        title: adFormData.title,
        description: adFormData.description,
        type: adFormData.type,
        price: adFormData.price ? parseFloat(adFormData.price) : undefined,
        categoryId: adFormData.categoryId || undefined,
        location: adFormData.location || undefined,
        postalCode: adFormData.postalCode || undefined,
        images: adFormData.images || [],
        specifications: specificationValues,
      }
      if (coords) {
        payload.latitude = coords[0]
        payload.longitude = coords[1]
      }
      if (adFormData.type === 'SERVICE') {
        payload.pricingType = adFormData.pricingType
        if (adFormData.pricingType === 'FIXED' && adFormData.price) {
          payload.price = parseFloat(adFormData.price)
        }
        if (adFormData.pricingType === 'HOURLY' && adFormData.hourlyRate) {
          payload.hourlyRate = parseFloat(adFormData.hourlyRate)
        }
        if (adFormData.pricingType === 'DAILY' && adFormData.dailyRate) {
          payload.dailyRate = parseFloat(adFormData.dailyRate)
        }
        if (adFormData.pricingType === 'PACKAGE' && adFormData.packages.length > 0) {
          payload.packages = adFormData.packages.map((pkg) => ({
            ...pkg,
            price: parseFloat(pkg.price),
          }))
        }
        if (adFormData.deliveryTime) payload.deliveryTime = adFormData.deliveryTime
        if (adFormData.revisions) payload.revisions = adFormData.revisions
        if (adFormData.features.length > 0) payload.features = adFormData.features
        if (adFormData.faq.length > 0) payload.faq = adFormData.faq
      }

      if (editingId) {
        const updated = await api.updateAdvertisement(editingId, payload)
        resetNewAdFlow()
        onCancelEdit?.()
        if (onComplete) {
          onComplete({ mode: 'update', advertisement: updated })
        } else {
          setSuccess('Inzerát bol úspešne aktualizovaný')
          setTimeout(() => setSuccess(''), 4000)
        }
      } else {
        const newAd = await api.createAdvertisement(payload)
        resetNewAdFlow()
        if (onComplete) {
          onComplete({ mode: 'create', advertisement: newAd })
        } else {
          setSuccess('Inzerát bol vytvorený a čaká na schválenie')
          setTimeout(() => setSuccess(''), 4000)
        }
      }
    } catch (err: any) {
      setError(err.message || 'Chyba pri ukladaní inzerátu')
    } finally {
      setSaving(false)
    }
  }

  const goRoot = () => {
    setPhase('root')
    setSubId(null)
    setError('')
  }

  const goSub = () => {
    setPhase('sub')
    setSubId(null)
    setError('')
  }

  const continueFromRoot = () => {
    if (!rootId) {
      setError('Vyberte kategóriu')
      return
    }
    setError('')
    const root = roots.find((r) => r.id === rootId)
    const kids = root ? activeChildrenOf(root) : []
    if (kids.length > 0) {
      setPhase('sub')
      return
    }
    setSubId(null)
    setAdFormData((prev) => ({ ...prev, categoryId: rootId! }))
    setPhase('form')
  }

  const continueFromSub = () => {
    if (!subId) {
      setError('Vyberte podkategóriu')
      return
    }
    setError('')
    setAdFormData((prev) => ({ ...prev, categoryId: subId }))
    setPhase('form')
  }

  const shellClass = isAdmin
    ? 'rounded-xl border border-card bg-card p-6 shadow-xl shadow-black/30 shadow-black/20 sm:p-8'
    : variant === 'page'
      ? 'rounded-3xl border border-accent/20 bg-dark-200/90 p-6 shadow-lg shadow-black/20 backdrop-blur-sm sm:p-8'
      : 'rounded-lg border border-white/[0.08] bg-dark p-6 shadow-sm'

  const categoryPanelClass = isAdmin
    ? 'rounded-xl border border-dark bg-dark p-6 sm:p-8'
    : variant === 'page'
      ? 'rounded-3xl border border-accent/20 bg-dark-50 p-6 sm:p-8'
      : 'rounded-2xl border border-white/[0.06] bg-dark-50 p-6'

  return (
    <div className={shellClass}>
      <div className="mb-6 flex flex-col gap-4 sm:flex-row sm:items-start sm:justify-between">
        <div>
          <h2
            className={`text-xl font-semibold sm:text-2xl ${isAdmin ? 'tracking-tight text-white' : 'text-white'}`}
          >
            {isAdmin
              ? editingId
                ? 'Úprava inzerátu'
                : 'Nový inzerát'
              : editingId
                ? 'Upraviť inzerát'
                : 'Podať inzerát'}
          </h2>
          <p className={`mt-1 text-sm leading-relaxed ${isAdmin ? 'text-gray-500' : 'text-gray-500'}`}>
            {isAdmin
              ? 'Rovnaký postup ako na webe: kategória → špecifikácie → údaje. Špecifikácie vychádzajú z vášho nastavenia v sekcii Špecifikácie.'
              : 'Vyberte kategóriu podľa toho, čo ponúkate – špecifikácie sa načítajú z nastavení administrátora.'}
          </p>
        </div>
        {editingId && onCancelEdit && (
          <button
            type="button"
            onClick={() => {
              resetNewAdFlow()
              onCancelEdit()
            }}
            className={
              isAdmin
                ? 'shrink-0 rounded-lg border border-card bg-dark px-4 py-2 text-sm text-gray-200 transition-colors hover:border-primary/40 hover:text-white'
                : 'shrink-0 rounded-lg border border-white/10 px-4 py-2 text-sm text-gray-300 hover:bg-dark-200/[0.04]'
            }
          >
            Zrušiť úpravu
          </button>
        )}
      </div>

      {!editingId && (
        <div className="mb-8 flex flex-wrap items-center gap-2 sm:gap-3">
          {(['root', 'sub', 'form'] as const).map((step, i) => {
            const labels = { root: 'Kategória', sub: 'Podkategória', form: 'Údaje inzerátu' }
            const active =
              (step === 'root' && phase === 'root') ||
              (step === 'sub' && phase === 'sub') ||
              (step === 'form' && phase === 'form')
            const passed =
              (step === 'root' && (phase === 'sub' || phase === 'form')) ||
              (step === 'sub' && phase === 'form')
            const skipSub = step === 'sub' && selectedRoot && activeChildrenOf(selectedRoot).length === 0
            if (skipSub) return null
            return (
              <div key={step} className="flex items-center gap-2">
                {i > 0 && (
                  <div
                    className={`hidden h-px w-6 sm:block ${isAdmin ? 'bg-card' : 'bg-dark-200'}`}
                  />
                )}
                <div
                  className={
                    isAdmin
                      ? `rounded-full px-3 py-1.5 text-xs font-semibold sm:text-sm ${
                          active
                            ? 'bg-primary text-white shadow-sm'
                            : passed
                              ? 'bg-primary/20 text-accent-light'
                              : 'bg-dark text-gray-500 ring-1 ring-card'
                        }`
                      : `rounded-full px-3 py-1.5 text-xs font-semibold sm:text-sm ${
                          active
                            ? 'bg-accent text-white'
                            : passed
                              ? 'bg-[#c9a96e]/15 text-[#148a55]'
                              : 'bg-dark-100 text-gray-500'
                        }`
                  }
                >
                  {labels[step]}
                </div>
              </div>
            )
          })}
        </div>
      )}

      {error ? (
        <div
          className={
            isAdmin
              ? 'mb-4 rounded-lg border border-red-500/40 bg-red-950/40 px-4 py-3 text-sm text-red-200'
              : 'mb-4 rounded-lg border border-red-800/30 bg-red-900/20 px-4 py-3 text-sm text-red-400'
          }
        >
          {error}
        </div>
      ) : null}
      {success ? (
        <div
          className={
            isAdmin
              ? 'mb-4 rounded-lg border border-accent/30 bg-accent/10 px-4 py-3 text-sm text-accent-light'
              : 'mb-4 rounded-lg border border-accent/20 bg-accent/10 px-4 py-3 text-sm text-accent'
          }
        >
          {success}
        </div>
      ) : null}

      {phase === 'root' && !editingId && (
        <div className={categoryPanelClass}>
          <div className="mb-6 flex flex-col gap-4 sm:flex-row sm:items-end sm:justify-between">
            <div>
              <h3 className={`text-lg font-semibold ${isAdmin ? 'text-white' : 'text-white'}`}>
                Vyberte hlavnú kategóriu
              </h3>
              <p className={`text-sm ${isAdmin ? 'text-gray-500' : 'text-gray-500'}`}>
                Zobrazujú sa len aktívne kategórie z administrácie.
              </p>
            </div>
            <div className="relative max-w-md flex-1">
              <Search
                className={`absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 ${isAdmin ? 'text-gray-500' : 'text-gray-500'}`}
              />
              <input
                type="search"
                value={categoryQuery}
                onChange={(e) => setCategoryQuery(e.target.value)}
                placeholder="Hľadať kategóriu..."
                className={
                  isAdmin
                    ? 'w-full rounded-xl border border-card bg-card py-2.5 pl-10 pr-4 text-sm text-white placeholder:text-gray-500 focus:border-accent/40 focus:outline-none focus:ring-2 focus:ring-primary/25'
                    : 'w-full rounded-xl border border-orange-100 bg-dark py-2.5 pl-10 pr-4 text-sm text-white placeholder:text-gray-400 focus:border-accent focus:outline-none focus:ring-2 focus:ring-[#c9a96e]/25'
                }
              />
            </div>
          </div>

          {filteredRoots.length === 0 ? (
            <p className={`text-center text-sm ${isAdmin ? 'text-amber-200/90' : 'text-amber-800'}`}>
              {roots.length === 0
                ? 'Žiadne aktívne kategórie. Pridajte ich v administrácii.'
                : 'Žiadna kategória nezodpovedá hľadaniu.'}
            </p>
          ) : (
            <div className="grid grid-cols-2 gap-3 sm:grid-cols-3 md:grid-cols-4 lg:grid-cols-5">
              {filteredRoots.map((cat) => (
                <CategoryVisualTile
                  key={cat.id}
                  cat={cat}
                  tileVariant={isAdmin ? 'admin' : 'platform'}
                  selected={rootId === cat.id}
                  onSelect={() => {
                    if (cat.id !== rootId) {
                      setSubId(null)
                      setSpecificationValues({})
                    }
                    setRootId(cat.id)
                    setError('')
                  }}
                />
              ))}
            </div>
          )}

          <div className="mt-8 flex justify-end">
            <button
              type="button"
              onClick={continueFromRoot}
              className={
                isAdmin
                  ? 'rounded-xl bg-primary px-8 py-3 text-sm font-semibold text-white shadow-lg shadow-black/20 shadow-primary/20 transition hover:opacity-90'
                  : 'rounded-xl bg-accent px-8 py-3 text-sm font-semibold text-white shadow-sm transition hover:bg-accent-light'
              }
            >
              Pokračovať
            </button>
          </div>
        </div>
      )}

      {phase === 'sub' && !editingId && (
        <div className={categoryPanelClass}>
          <button
            type="button"
            onClick={goRoot}
            className={`mb-6 inline-flex items-center gap-2 text-sm font-medium ${isAdmin ? 'text-gray-300 hover:text-white' : 'text-gray-300 hover:text-white'}`}
          >
            <ChevronLeft className="h-4 w-4" />
            Späť na kategórie
          </button>
          <h3 className={`mb-1 text-lg font-semibold ${isAdmin ? 'text-white' : 'text-white'}`}>
            Vyberte podkategóriu
          </h3>
          <p className={`mb-6 text-sm ${isAdmin ? 'text-gray-500' : 'text-gray-500'}`}>
            Kategória:{' '}
            <span className={`font-semibold ${isAdmin ? 'text-white' : 'text-white/90'}`}>{selectedRoot?.name}</span>
          </p>
          <div className="grid grid-cols-2 gap-3 sm:grid-cols-3 md:grid-cols-4">
            {subcategories.map((cat: any) => (
              <CategoryVisualTile
                key={cat.id}
                cat={cat}
                tileVariant={isAdmin ? 'admin' : 'platform'}
                selected={subId === cat.id}
                onSelect={() => {
                  setSubId(cat.id)
                  setError('')
                }}
              />
            ))}
          </div>
          <div className="mt-8 flex justify-end">
            <button
              type="button"
              onClick={continueFromSub}
              className={
                isAdmin
                  ? 'rounded-xl bg-primary px-8 py-3 text-sm font-semibold text-white shadow-lg shadow-black/20 shadow-primary/20 transition hover:opacity-90'
                  : 'rounded-xl bg-accent px-8 py-3 text-sm font-semibold text-white shadow-sm transition hover:bg-accent-light'
              }
            >
              Pokračovať k inzerátu
            </button>
          </div>
        </div>
      )}

      {phase === 'form' && (
        <div className="space-y-6">
          {!editingId && (
            <div
              className={`flex flex-wrap items-center gap-3 border-b pb-5 ${isAdmin ? 'border-card' : 'border-white/[0.06]'}`}
            >
              <button
                type="button"
                onClick={() => {
                  setError('')
                  if (subcategories.length > 0) goSub()
                  else goRoot()
                }}
                className={
                  isAdmin
                    ? 'inline-flex items-center gap-2 rounded-xl border border-card bg-dark px-4 py-2 text-sm font-medium text-gray-200 transition hover:border-primary/40 hover:text-white'
                    : 'inline-flex items-center gap-2 rounded-xl border border-white/[0.08] bg-dark px-4 py-2 text-sm font-medium text-gray-300 shadow-sm hover:bg-dark-200/[0.04]'
                }
              >
                <ChevronLeft className="h-4 w-4" />
                Zmeniť kategóriu
              </button>
              <div className="flex flex-wrap gap-2">
                {selectedRoot && (
                  <span
                    className={`rounded-full px-3 py-1 text-sm font-medium ${
                      isAdmin ? 'bg-card text-gray-100 ring-1 ring-card' : 'bg-dark-100 text-white/90'
                    }`}
                  >
                    {selectedRoot.name}
                  </span>
                )}
                {subId && (
                  <span
                    className={`rounded-full px-3 py-1 text-sm font-medium ${
                      isAdmin ? 'bg-primary/15 text-accent-light ring-1 ring-primary/30' : 'bg-accent/10 text-[#148a55]'
                    }`}
                  >
                    {findCategoryNode(categories, subId)?.name || 'Podkategória'}
                  </span>
                )}
              </div>
            </div>
          )}

          <div
            className={
              isAdmin
                ? 'rounded-xl border border-card bg-dark p-6'
                : 'rounded-2xl border border-white/[0.08] bg-gradient-to-b from-white to-gray-50/50 p-6'
            }
          >
            <h3 className={`text-lg font-semibold ${isAdmin ? 'text-white' : 'text-white'}`}>Špecifikácie</h3>
            <p className={`mt-1 text-sm ${isAdmin ? 'text-gray-500' : 'text-gray-500'}`}>
              Polia podľa zvolenej kategórie. Povinné polia sú označené hviezdičkou.
            </p>
            <div className="mt-5">
              <CategorySpecificationsForm
                variant={isAdmin ? 'admin' : 'platform'}
                filters={categoryFilters}
                values={specificationValues}
                onChange={(slug, v) =>
                  setSpecificationValues((prev) => {
                    const next = { ...prev, [slug]: v }
                    if (v === undefined || v === '') delete next[slug]
                    return next
                  })
                }
              />
            </div>
          </div>

          <AdvertisementAdForm
            variant={isAdmin ? 'admin' : 'platform'}
            adFormData={adFormData}
            setAdFormData={setAdFormData}
            newFeature={newFeature}
            setNewFeature={setNewFeature}
            newPackage={newPackage}
            setNewPackage={setNewPackage}
            newPackageFeature={newPackageFeature}
            setNewPackageFeature={setNewPackageFeature}
            newFAQ={newFAQ}
            setNewFAQ={setNewFAQ}
            handleImageUpload={handleImageUpload}
            removeImage={removeImage}
            onSubmit={handleSubmit}
            saving={saving}
            editingId={editingId}
          />
        </div>
      )}
    </div>
  )
}
