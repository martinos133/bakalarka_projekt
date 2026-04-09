'use client'

import { useEffect, useMemo, useState } from 'react'
import { useRouter, useSearchParams } from 'next/navigation'
import { isAuthenticated } from '@/lib/auth'
import DashboardLayout from '@/components/DashboardLayout'
import AlertDialog from '@/components/AlertDialog'
import { api } from '@/lib/api'
import { Category, Filter } from '@inzertna-platforma/shared'
import {
  Filter as FilterIcon,
  Plus,
  Edit,
  Trash2,
  Save,
  X,
  Check,
  ChevronUp,
  ChevronDown,
} from 'lucide-react'

type FilterType =
  | 'TEXT'
  | 'NUMBER'
  | 'SELECT'
  | 'MULTISELECT'
  | 'BOOLEAN'
  | 'DATE'
  | 'RANGE'

type FilterFormState = {
  id?: string
  categoryId: string
  name: string
  description: string
  type: FilterType | ''
  optionsInput: string
  isRequired: boolean
  isActive: boolean
  order: number | ''
}

type BatchRow = {
  id: string
  name: string
  type: FilterType | ''
  isRequired: boolean
  optionsInput: string
}

export default function DevFiltersPage() {
  const router = useRouter()
  const searchParams = useSearchParams()

  const [categories, setCategories] = useState<Category[]>([])
  const [filters, setFilters] = useState<Filter[]>([])
  const [loading, setLoading] = useState(true)
  const [saving, setSaving] = useState(false)
  const [selectedCategoryId, setSelectedCategoryId] = useState<string>('')
  const [formOpen, setFormOpen] = useState(false)
  const [showAdvanced, setShowAdvanced] = useState(false)
  const [formState, setFormState] = useState<FilterFormState>({
    categoryId: '',
    name: '',
    description: '',
    type: '',
    optionsInput: '',
    isRequired: false,
    isActive: true,
    order: '',
  })
  const [batchRows, setBatchRows] = useState<BatchRow[]>([])
  const [batchSaving, setBatchSaving] = useState(false)
  const [orderSavingId, setOrderSavingId] = useState<string | null>(null)
  const [alertModal, setAlertModal] = useState<{
    open: boolean
    title: string
    message: string
  }>({
    open: false,
    title: '',
    message: '',
  })

  const categoryIdFromQuery = searchParams?.get('categoryId') || ''
  const showAlert = (message: string, title = 'Upozornenie') => {
    setAlertModal({
      open: true,
      title,
      message,
    })
  }

  useEffect(() => {
    if (!isAuthenticated()) {
      router.push('/login')
      return
    }
    loadData()
  }, [router])

  useEffect(() => {
    if (categoryIdFromQuery) {
      setSelectedCategoryId(categoryIdFromQuery)
    }
  }, [categoryIdFromQuery])

  const loadData = async () => {
    try {
      setLoading(true)
      const [cats, fltrs] = await Promise.all([api.getCategories(), api.getFilters()])
      setCategories(cats)
      setFilters(fltrs)
    } catch (error) {
      console.error('Chyba pri načítaní filtrov alebo kategórií:', error)
    } finally {
      setLoading(false)
    }
  }

  const resetForm = () => {
    setFormState({
      categoryId: selectedCategoryId || '',
      name: '',
      description: '',
      type: '',
      optionsInput: '',
      isRequired: false,
      isActive: true,
      order: '',
    })
    setFormOpen(false)
    setShowAdvanced(false)
  }

  const startEdit = (filter: Filter) => {
    setFormState({
      id: filter.id,
      categoryId: filter.categoryId,
      name: filter.name,
      description: filter.description || '',
      type: (filter.type as FilterType) || 'TEXT',
      optionsInput: (filter.options || []).join(', '),
      isRequired: filter.isRequired,
      isActive: filter.isActive,
      order: filter.order ?? '',
    })
    setFormOpen(true)
    setShowAdvanced(true)
  }

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    if (!formState.categoryId) {
      showAlert('Vyberte kategóriu.')
      return
    }
    if (!formState.name.trim()) {
      showAlert('Názov filtra je povinný.')
      return
    }
    if (!formState.type) {
      showAlert('Vyberte typ filtra.')
      return
    }

    const options =
      formState.type === 'SELECT' || formState.type === 'MULTISELECT'
        ? formState.optionsInput
            .split(',')
            .map((o) => o.trim())
            .filter(Boolean)
        : []

    const payload = {
      categoryId: formState.categoryId,
      name: formState.name.trim(),
      description: formState.description.trim() || undefined,
      type: formState.type,
      options,
      isRequired: formState.isRequired,
      isActive: formState.isActive,
      order: formState.order === '' ? undefined : Number(formState.order),
    }

    try {
      setSaving(true)
      if (formState.id) {
        await api.updateFilter(formState.id, payload)
      } else {
        await api.createFilter(payload)
      }
      await loadData()
      resetForm()
    } catch (error: any) {
      console.error('Chyba pri ukladaní filtra:', error)
      showAlert(error?.message || 'Chyba pri ukladaní filtra', 'Chyba')
    } finally {
      setSaving(false)
    }
  }

  const handleDelete = async (filter: Filter) => {
    if (!confirm(`Naozaj chcete odstrániť filter "${filter.name}"?`)) return
    try {
      await api.deleteFilter(filter.id)
      await loadData()
    } catch (error: any) {
      console.error('Chyba pri odstraňovaní filtra:', error)
      showAlert(error?.message || 'Chyba pri odstraňovaní filtra', 'Chyba')
    }
  }

  const addBatchRow = () => {
    if (!selectedCategoryId) {
      showAlert('Najprv vyberte kategóriu.')
      return
    }
    setBatchRows((prev) => [
      ...prev,
      { id: crypto.randomUUID(), name: '', type: 'TEXT', isRequired: false, optionsInput: '' },
    ])
  }

  const removeBatchRow = (id: string) => {
    setBatchRows((prev) => prev.filter((r) => r.id !== id))
  }

  const updateBatchRow = (id: string, field: keyof BatchRow, value: string | boolean) => {
    setBatchRows((prev) =>
      prev.map((r) => (r.id === id ? { ...r, [field]: value } : r))
    )
  }

  const saveAllBatch = async () => {
    if (!selectedCategoryId) return
    const toSave = batchRows.filter((r) => r.name.trim() && r.type)
    if (toSave.length === 0) {
      showAlert('Pridajte aspoň jeden riadok s názvom a typom.')
      return
    }
    try {
      setBatchSaving(true)
      for (let i = 0; i < toSave.length; i++) {
        const r = toSave[i]
        const options =
          r.type === 'SELECT' || r.type === 'MULTISELECT'
            ? r.optionsInput
                .split(',')
                .map((o) => o.trim())
                .filter(Boolean)
            : []
        await api.createFilter({
          categoryId: selectedCategoryId,
          name: r.name.trim(),
          type: r.type,
          options,
          isRequired: r.isRequired,
          isActive: true,
          order: i,
        })
      }
      setBatchRows([])
      await loadData()
    } catch (error: any) {
      console.error('Chyba pri ukladaní polí:', error)
      showAlert(error?.message || 'Chyba pri ukladaní polí', 'Chyba')
    } finally {
      setBatchSaving(false)
    }
  }

  const filteredFilters = useMemo(() => {
    return filters.filter((f) => !selectedCategoryId || f.categoryId === selectedCategoryId)
  }, [filters, selectedCategoryId])

  const sortedFilteredFilters = useMemo(() => {
    return [...filteredFilters].sort(
      (a, b) =>
        (a.order ?? 0) - (b.order ?? 0) || a.name.localeCompare(b.name, 'sk'),
    )
  }, [filteredFilters])

  const commitFilterOrder = async (filter: Filter, raw: string) => {
    const parsed = parseInt(raw, 10)
    const newOrder = Number.isFinite(parsed) ? Math.max(0, parsed) : 0
    if (newOrder === (filter.order ?? 0)) return
    try {
      setOrderSavingId(filter.id)
      await api.updateFilter(filter.id, { order: newOrder })
      await loadData()
    } catch (error: any) {
      console.error('Chyba pri ukladaní poradia:', error)
      showAlert(error?.message || 'Chyba pri ukladaní poradia', 'Chyba')
    } finally {
      setOrderSavingId(null)
    }
  }

  const moveFilterOrder = async (filterId: string, direction: 'up' | 'down') => {
    const list = sortedFilteredFilters
    const i = list.findIndex((f) => f.id === filterId)
    if (i < 0) return
    const j = direction === 'up' ? i - 1 : i + 1
    if (j < 0 || j >= list.length) return
    const cur = list[i]
    const neigh = list[j]
    const curOrder = cur.order ?? 0
    const neighOrder = neigh.order ?? 0
    const base = Math.min(curOrder, neighOrder)
    try {
      setOrderSavingId(filterId)
      if (curOrder === neighOrder) {
        if (direction === 'up') {
          await api.updateFilter(neigh.id, { order: base + 1 })
          await api.updateFilter(cur.id, { order: base })
        } else {
          await api.updateFilter(neigh.id, { order: base })
          await api.updateFilter(cur.id, { order: base + 1 })
        }
      } else {
        await Promise.all([
          api.updateFilter(cur.id, { order: neighOrder }),
          api.updateFilter(neigh.id, { order: curOrder }),
        ])
      }
      await loadData()
    } catch (error: any) {
      console.error('Chyba pri zmene poradia:', error)
      showAlert(error?.message || 'Chyba pri zmene poradia', 'Chyba')
    } finally {
      setOrderSavingId(null)
    }
  }

  /** Hlavné + podkategórie – špecifikácie sa viažu na presné categoryId (aj listová podkategória). */
  const categoriesForFilterSelect = useMemo(() => {
    const list: { id: string; label: string }[] = []
    const roots = categories
      .filter((c) => !c.parentId)
      .sort((a, b) => (a.order ?? 0) - (b.order ?? 0) || a.name.localeCompare(b.name))
    for (const r of roots) {
      list.push({ id: r.id, label: r.name })
      const subs = categories
        .filter((c) => c.parentId === r.id)
        .sort((a, b) => (a.order ?? 0) - (b.order ?? 0) || a.name.localeCompare(b.name))
      for (const s of subs) {
        list.push({ id: s.id, label: `${r.name} → ${s.name}` })
      }
    }
    return list
  }, [categories])

  const filterTypeLabel = (type: FilterType) => {
    switch (type) {
      case 'TEXT':
        return 'Text'
      case 'NUMBER':
        return 'Číslo'
      case 'SELECT':
        return 'Výber (1 možnosť)'
      case 'MULTISELECT':
        return 'Výber (viac možností)'
      case 'BOOLEAN':
        return 'Áno/Nie'
      case 'DATE':
        return 'Dátum'
      case 'RANGE':
        return 'Rozsah'
      default:
        return type
    }
  }

  return (
    <DashboardLayout>
      <AlertDialog
        open={alertModal.open}
        title={alertModal.title}
        message={alertModal.message}
        onClose={() => setAlertModal((prev) => ({ ...prev, open: false }))}
      />
          <div className="flex items-start justify-between mb-6 gap-4">
            <div>
              <h1 className="text-2xl font-bold">Špecifikácie inzerátov</h1>
              <p className="mt-1 text-sm text-gray-400 max-w-2xl">
                Vyberte kategóriu a pridajte polia (text, číslo, výber, dátum, rozsah…). Tieto údaje potom vyplnia predajcovia pri
                podaní inzerátu v tejto kategórii.
              </p>
            </div>
            <button
              onClick={() => {
                if (!selectedCategoryId) {
                  showAlert('Najprv vyberte kategóriu.')
                  return
                }
                addBatchRow()
              }}
              className="bg-primary hover:opacity-90 text-white px-4 py-2 rounded-xl flex items-center space-x-2 transition-colors"
            >
              <Plus className="w-5 h-5" />
              <span>Pridať pole</span>
            </button>
          </div>

          {/* Výber kategórie */}
          <div className="card p-4 mb-6">
            <div className="flex items-center gap-3 flex-wrap">
              <div className="flex items-center gap-2">
                <FilterIcon className="w-5 h-5 text-gray-400" />
                <span className="text-sm text-gray-300">Kategória</span>
              </div>
              <select
                value={selectedCategoryId}
                onChange={(e) => {
                  setSelectedCategoryId(e.target.value)
                  setFormState((prev) => ({ ...prev, categoryId: e.target.value }))
                }}
                className="bg-white/[0.04] border border-white/[0.06] rounded-xl px-4 py-2.5 text-sm text-white focus:outline-none focus:ring-2 focus:ring-primary/50 focus:border-primary min-w-[260px] transition-shadow"
              >
                <option value="">-- Vyberte kategóriu --</option>
                {categoriesForFilterSelect.map((row) => (
                  <option key={row.id} value={row.id}>
                    {row.label}
                  </option>
                ))}
              </select>
              {!!selectedCategoryId && (
                <span className="text-xs text-gray-500">
                  Spravujete polia pre:{' '}
                  <span className="text-gray-200 font-medium">
                    {categoriesForFilterSelect.find((c) => c.id === selectedCategoryId)?.label}
                  </span>
                </span>
              )}
            </div>
          </div>

          {/* Dávkové pridávanie polí */}
          {selectedCategoryId && !formState.id && (
            <div className="bg-card rounded-xl border border-white/[0.06] overflow-hidden mb-6 shadow-sm">
              <div className="px-6 py-5 border-b border-white/[0.06]">
                <h2 className="text-lg font-semibold text-white">Nové polia (dávka)</h2>
                <p className="text-sm text-gray-400 mt-1">
                  Pridajte viac polí naraz. Vyplňte riadky a uložte všetko jedným klikom.
                </p>
              </div>
              <div className="p-6">
              {batchRows.length === 0 ? (
                <div className="flex flex-col items-center justify-center py-10 px-4 rounded-xl bg-white/[0.02] border border-white/[0.08] border-dashed">
                  <p className="text-gray-400 text-sm text-center max-w-sm">
                    Kliknite „Pridať pole“ v hlavičke stránky alebo na „Pridať riadok“ nižšie a vyplňte názov a typ. Potom uložte všetko naraz.
                  </p>
                  <button
                    type="button"
                    onClick={addBatchRow}
                    className="mt-4 inline-flex items-center gap-2 text-primary hover:text-primary/90 font-medium text-sm transition-colors"
                  >
                    <Plus className="w-4 h-4" />
                    Pridať prvý riadok
                  </button>
                </div>
              ) : (
                <div className="overflow-x-auto rounded-xl border border-white/[0.06]">
                  <table className="w-full text-sm">
                    <thead>
                      <tr className="bg-dark/50 text-left">
                        <th className="py-3 px-4 font-medium text-gray-300">Názov *</th>
                        <th className="py-3 px-4 font-medium text-gray-300 w-44">Typ *</th>
                        <th className="py-3 px-4 font-medium text-gray-300 w-24 text-center">Povinné</th>
                        <th className="py-3 px-4 font-medium text-gray-300 min-w-[200px]">Možnosti</th>
                        <th className="py-3 px-3 w-12"></th>
                      </tr>
                    </thead>
                    <tbody>
                      {batchRows.map((row) => (
                        <tr key={row.id} className="border-t border-white/[0.06]/80 hover:bg-white/[0.02] transition-colors">
                          <td className="py-2.5 px-4 align-middle">
                            <input
                              type="text"
                              value={row.name}
                              onChange={(e) => updateBatchRow(row.id, 'name', e.target.value)}
                              placeholder="napr. Výkon (kW)"
                              className="w-full max-w-xs bg-white/[0.04] border border-white/[0.06] rounded-xl px-3 py-2 text-white placeholder-gray-500 focus:outline-none focus:ring-2 focus:ring-primary/50 focus:border-primary transition-shadow"
                            />
                          </td>
                          <td className="py-2.5 px-4 align-middle">
                            <select
                              value={row.type}
                              onChange={(e) => updateBatchRow(row.id, 'type', e.target.value as FilterType | '')}
                              className="w-full bg-white/[0.04] border border-white/[0.06] rounded-xl px-3 py-2 text-white focus:outline-none focus:ring-2 focus:ring-primary/50 focus:border-primary transition-shadow"
                            >
                              <option value="TEXT">Text</option>
                              <option value="NUMBER">Číslo</option>
                              <option value="SELECT">Výber (1)</option>
                              <option value="MULTISELECT">Výber (viac)</option>
                              <option value="BOOLEAN">Áno/Nie</option>
                              <option value="DATE">Dátum</option>
                              <option value="RANGE">Rozsah</option>
                            </select>
                          </td>
                          <td className="py-2.5 px-4 align-middle text-center">
                            <label className="inline-flex items-center justify-center cursor-pointer rounded focus-within:ring-2 focus-within:ring-primary/30 focus-within:ring-offset-2 focus-within:ring-offset-card">
                              <input
                                type="checkbox"
                                checked={row.isRequired}
                                onChange={(e) => updateBatchRow(row.id, 'isRequired', e.target.checked)}
                                className="sr-only peer"
                              />
                              <span className="flex items-center justify-center w-5 h-5 rounded border-2 border-gray-500 bg-dark text-transparent peer-checked:bg-primary peer-checked:border-primary peer-checked:text-white transition-colors hover:border-gray-400">
                                <Check className="w-3 h-3" strokeWidth={3} />
                              </span>
                            </label>
                          </td>
                          <td className="py-2.5 px-4 align-middle">
                            {(row.type === 'SELECT' || row.type === 'MULTISELECT') ? (
                              <input
                                type="text"
                                value={row.optionsInput}
                                onChange={(e) => updateBatchRow(row.id, 'optionsInput', e.target.value)}
                                placeholder="možnosť1, možnosť2, …"
                                className="w-full max-w-xs bg-white/[0.04] border border-white/[0.06] rounded-xl px-3 py-2 text-white placeholder-gray-500 focus:outline-none focus:ring-2 focus:ring-primary/50 focus:border-primary transition-shadow"
                              />
                            ) : (
                              <span className="text-gray-600 text-xs">—</span>
                            )}
                          </td>
                          <td className="py-2.5 px-3 align-middle">
                            <button
                              type="button"
                              onClick={() => removeBatchRow(row.id)}
                              className="p-1.5 rounded-xl text-gray-400 hover:text-red-400 hover:bg-red-500/10 transition-colors"
                              title="Odstrániť riadok"
                            >
                              <X className="w-4 h-4" />
                            </button>
                          </td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>
              )}
              <div className="flex items-center gap-3 mt-5 pt-4 border-t border-white/[0.06]">
                <button
                  type="button"
                  onClick={addBatchRow}
                  className="inline-flex items-center gap-2 px-4 py-2 rounded-xl border border-card bg-dark/50 text-gray-300 hover:bg-dark hover:text-white transition-colors text-sm font-medium"
                >
                  <Plus className="w-4 h-4" />
                  Pridať riadok
                </button>
                {batchRows.length > 0 && (
                  <button
                    type="button"
                    onClick={saveAllBatch}
                    disabled={batchSaving}
                    className="inline-flex items-center gap-2 px-5 py-2 rounded-xl bg-primary text-white hover:opacity-90 disabled:opacity-50 text-sm font-medium transition-opacity"
                  >
                    {batchSaving ? (
                      <>
                        <span className="inline-block w-4 h-4 border-2 border-white/30 border-t-white rounded-full animate-spin" />
                        Ukladám…
                      </>
                    ) : (
                      <>
                        <Save className="w-4 h-4" />
                        Uložiť všetko
                      </>
                    )}
                  </button>
                )}
              </div>
              </div>
            </div>
          )}

          {/* Formulár (iba pre úpravu existujúceho) */}
          {formOpen && formState.id && (
            <div className="card p-6 mb-6">
              <div className="flex items-center justify-between mb-4">
                <h2 className="text-xl font-semibold">
                  {formState.id ? 'Upraviť pole' : 'Nové pole'}
                </h2>
                <button
                  onClick={resetForm}
                  className="text-gray-400 hover:text-white transition-colors"
                >
                  <X className="w-5 h-5" />
                </button>
              </div>

              <form onSubmit={handleSubmit} className="space-y-4">
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  <div>
                    <label className="block text-sm font-medium text-gray-300 mb-2">
                      Kategória *
                    </label>
                    <select
                      value={formState.categoryId}
                      onChange={(e) =>
                        setFormState((prev) => ({ ...prev, categoryId: e.target.value }))
                      }
                      className="w-full bg-white/[0.04] border border-white/[0.06] rounded-xl px-4 py-2.5 text-white text-sm focus:outline-none focus:ring-2 focus:ring-primary/50 focus:border-primary transition-shadow placeholder-gray-500"
                    >
                      <option value="">Vyberte kategóriu</option>
                      {categoriesForFilterSelect.map((row) => (
                        <option key={row.id} value={row.id}>
                          {row.label}
                        </option>
                      ))}
                    </select>
                    <p className="mt-1.5 text-xs text-gray-500">
                      Polia sa zobrazia pri výbere tejto kategórie pri podaní inzerátu.
                    </p>
                  </div>

                  <div>
                    <label className="block text-sm font-medium text-gray-300 mb-2">
                      Typ poľa *
                    </label>
                    <select
                      value={formState.type}
                      onChange={(e) =>
                        setFormState((prev) => ({
                          ...prev,
                          type: e.target.value as FilterType | '',
                        }))
                      }
                      className="w-full bg-white/[0.04] border border-white/[0.06] rounded-xl px-4 py-2.5 text-white text-sm focus:outline-none focus:ring-2 focus:ring-primary/50 focus:border-primary transition-shadow"
                    >
                      <option value="">Vyberte typ</option>
                      <option value="TEXT">Text</option>
                      <option value="NUMBER">Číslo</option>
                      <option value="SELECT">Výber (1 možnosť)</option>
                      <option value="MULTISELECT">Výber (viac možností)</option>
                      <option value="BOOLEAN">Áno/Nie</option>
                      <option value="DATE">Dátum</option>
                      <option value="RANGE">Rozsah</option>
                    </select>
                  </div>
                </div>

                <div>
                  <label className="block text-sm font-medium text-gray-300 mb-2">
                    Názov poľa *
                  </label>
                  <input
                    type="text"
                    value={formState.name}
                    onChange={(e) =>
                      setFormState((prev) => ({ ...prev, name: e.target.value }))
                    }
                    placeholder="Napríklad: Výkon (kW), Výmera (m²), Počet izieb..."
                    className="w-full bg-white/[0.04] border border-white/[0.06] rounded-xl px-4 py-2.5 text-white placeholder-gray-500 focus:outline-none focus:ring-2 focus:ring-primary/50 focus:border-primary transition-shadow"
                  />
                </div>

                {(formState.type === 'SELECT' ||
                  formState.type === 'MULTISELECT') && (
                  <div>
                    <label className="block text-sm font-medium text-gray-300 mb-2">
                      Možnosti (oddelené čiarkou) *
                    </label>
                    <input
                      type="text"
                      value={formState.optionsInput}
                      onChange={(e) =>
                        setFormState((prev) => ({ ...prev, optionsInput: e.target.value }))
                      }
                      placeholder="Napríklad: Benzín, Nafta, Hybrid, Elektro"
                      className="w-full bg-white/[0.04] border border-white/[0.06] rounded-xl px-4 py-2.5 text-white placeholder-gray-500 focus:outline-none focus:ring-2 focus:ring-primary/50 focus:border-primary transition-shadow"
                    />
                  </div>
                )}

                <div className="flex items-center justify-between gap-3 flex-wrap pt-1">
                  <label className="flex items-center gap-2">
                    <input
                      id="isRequired"
                      type="checkbox"
                      checked={formState.isRequired}
                      onChange={(e) =>
                        setFormState((prev) => ({ ...prev, isRequired: e.target.checked }))
                      }
                      className="w-4 h-4 rounded bg-dark border-card text-primary"
                    />
                    <span className="text-sm text-gray-300">Povinné pole</span>
                  </label>

                  <button
                    type="button"
                    onClick={() => setShowAdvanced((v) => !v)}
                    className="text-sm text-gray-400 hover:text-white transition-colors"
                  >
                    {showAdvanced ? 'Skryť pokročilé' : 'Pokročilé'}
                  </button>
                </div>

                {showAdvanced && (
                  <div className="grid grid-cols-1 md:grid-cols-3 gap-4 pt-4 border-t border-white/[0.06]">
                    <div className="md:col-span-2">
                      <label className="block text-sm font-medium text-gray-300 mb-2">
                        Popis (voliteľné)
                      </label>
                      <textarea
                        value={formState.description}
                        onChange={(e) =>
                          setFormState((prev) => ({ ...prev, description: e.target.value }))
                        }
                        rows={2}
                        placeholder="Krátke vysvetlenie pre tvorcu inzerátu (napr. čo presne má zadať)."
                        className="w-full bg-white/[0.04] border border-white/[0.06] rounded-xl px-4 py-2.5 text-white placeholder-gray-500 focus:outline-none focus:ring-2 focus:ring-primary/50 focus:border-primary transition-shadow"
                      />
                    </div>

                    <div className="space-y-3">
                      <label className="flex items-center gap-2">
                        <input
                          id="isActive"
                          type="checkbox"
                          checked={formState.isActive}
                          onChange={(e) =>
                            setFormState((prev) => ({ ...prev, isActive: e.target.checked }))
                          }
                          className="w-4 h-4 rounded bg-dark border-card text-primary"
                        />
                        <span className="text-sm text-gray-300">Aktívne (zobrazuje sa)</span>
                      </label>

                      <div>
                        <label className="block text-sm font-medium text-gray-300 mb-2">
                          Poradie (voliteľné)
                        </label>
                        <input
                          type="number"
                          value={formState.order}
                          onChange={(e) =>
                            setFormState((prev) => ({
                              ...prev,
                              order: e.target.value === '' ? '' : Number(e.target.value),
                            }))
                          }
                          placeholder="1, 2, 3..."
                          className="w-full bg-white/[0.04] border border-white/[0.06] rounded-xl px-4 py-2.5 text-white placeholder-gray-500 focus:outline-none focus:ring-2 focus:ring-primary/50 focus:border-primary transition-shadow"
                        />
                      </div>
                    </div>
                  </div>
                )}

                <div className="flex justify-end gap-3 pt-2">
                  <button
                    type="button"
                    onClick={resetForm}
                    className="px-4 py-2 border border-card rounded-xl text-gray-300 hover:bg-cardHover transition-colors"
                  >
                    Zrušiť
                  </button>
                  <button
                    type="submit"
                    disabled={saving}
                    className="px-4 py-2 bg-primary hover:opacity-90 disabled:opacity-60 text-white rounded-xl flex items-center space-x-2 transition-colors"
                  >
                    <Save className="w-4 h-4" />
                    <span>{formState.id ? 'Uložiť' : 'Vytvoriť'}</span>
                  </button>
                </div>
              </form>
            </div>
          )}

          {/* Zoznam filtrov */}
          <div className="card">
            {loading ? (
              <div className="p-6 text-center text-gray-400">Načítavam...</div>
            ) : filteredFilters.length === 0 ? (
              <div className="p-6 text-center text-gray-400">
                {!selectedCategoryId
                  ? 'Najprv vyberte kategóriu.'
                  : 'Pre túto kategóriu zatiaľ nemáte žiadne polia.'}
                {!!selectedCategoryId && (
                  <div className="mt-4">
                    <button
                      onClick={addBatchRow}
                      className="bg-primary hover:opacity-90 text-white px-4 py-2 rounded-xl inline-flex items-center gap-2 transition-colors"
                    >
                      <Plus className="w-4 h-4" />
                      Pridať prvé pole
                    </button>
                  </div>
                )}
              </div>
            ) : (
              <div className="overflow-x-auto">
                <table className="w-full text-sm">
                  <thead className="bg-dark border-b border-card">
                    <tr>
                      <th className="text-left px-6 py-3 font-semibold text-gray-300">Názov</th>
                      <th className="text-left px-6 py-3 font-semibold text-gray-300">Typ</th>
                      <th className="text-left px-6 py-3 font-semibold text-gray-300">Povinné</th>
                      <th className="text-left px-6 py-3 font-semibold text-gray-300">Stav</th>
                      <th className="text-left px-6 py-3 font-semibold text-gray-300">Možnosti</th>
                      <th className="text-left px-6 py-3 font-semibold text-gray-300">Poradie</th>
                      <th className="text-right px-6 py-3 font-semibold text-gray-300">Akcie</th>
                    </tr>
                  </thead>
                  <tbody>
                    {sortedFilteredFilters.map((filter, rowIndex) => {
                      const savingOrder = orderSavingId === filter.id
                      return (
                        <tr
                          key={filter.id}
                          className="border-b border-card last:border-0 hover:bg-dark/40 transition-colors"
                        >
                          <td className="px-6 py-3">
                            <div className="font-medium text-white">{filter.name}</div>
                            {filter.description && (
                              <div className="text-xs text-gray-400 mt-0.5">
                                {filter.description}
                              </div>
                            )}
                          </td>
                          <td className="px-6 py-3 text-gray-300">
                            {filterTypeLabel(filter.type)}
                          </td>
                          <td className="px-6 py-3">
                            <span
                              className={`px-2 py-1 rounded text-xs font-medium ${
                                filter.isRequired
                                  ? 'bg-yellow-500/20 text-yellow-300'
                                  : 'bg-gray-600/20 text-gray-300'
                              }`}
                            >
                              {filter.isRequired ? 'Povinné' : 'Nepovinné'}
                            </span>
                          </td>
                          <td className="px-6 py-3">
                            <span
                              className={`px-2 py-1 rounded text-xs font-medium ${
                                filter.isActive
                                  ? 'bg-green-500/20 text-green-400'
                                  : 'bg-red-500/20 text-red-400'
                              }`}
                            >
                              {filter.isActive ? 'Aktívne' : 'Neaktívne'}
                            </span>
                          </td>
                          <td className="px-6 py-3 text-gray-300 max-w-xs">
                            {filter.options && filter.options.length > 0 ? (
                              <div className="text-xs text-gray-300 truncate">
                                {filter.options.join(', ')}
                              </div>
                            ) : (
                              <span className="text-xs text-gray-500">—</span>
                            )}
                          </td>
                          <td className="px-6 py-3">
                            <div className="flex items-center gap-1">
                              <div className="flex flex-col">
                                <button
                                  type="button"
                                  disabled={savingOrder || rowIndex === 0}
                                  onClick={() => moveFilterOrder(filter.id, 'up')}
                                  className="p-0.5 rounded text-gray-400 hover:text-white hover:bg-cardHover disabled:opacity-30 disabled:pointer-events-none"
                                  title="Posunúť vyššie"
                                >
                                  <ChevronUp className="w-4 h-4" />
                                </button>
                                <button
                                  type="button"
                                  disabled={savingOrder || rowIndex >= sortedFilteredFilters.length - 1}
                                  onClick={() => moveFilterOrder(filter.id, 'down')}
                                  className="p-0.5 rounded text-gray-400 hover:text-white hover:bg-cardHover disabled:opacity-30 disabled:pointer-events-none"
                                  title="Posunúť nižšie"
                                >
                                  <ChevronDown className="w-4 h-4" />
                                </button>
                              </div>
                              <input
                                type="number"
                                min={0}
                                step={1}
                                disabled={savingOrder}
                                defaultValue={filter.order ?? 0}
                                key={`${filter.id}-${filter.order ?? 0}`}
                                onBlur={(e) => commitFilterOrder(filter, e.target.value)}
                                onKeyDown={(e) => {
                                  if (e.key === 'Enter') {
                                    ;(e.target as HTMLInputElement).blur()
                                  }
                                }}
                                className="w-16 bg-white/[0.04] border border-white/[0.06] rounded-xl px-2 py-1.5 text-white text-sm tabular-nums focus:outline-none focus:ring-2 focus:ring-primary/50 focus:border-primary disabled:opacity-50"
                              />
                              {savingOrder && (
                                <span className="inline-block w-3.5 h-3.5 border-2 border-gray-500 border-t-primary rounded-full animate-spin shrink-0" />
                              )}
                            </div>
                          </td>
                          <td className="px-6 py-3 text-right">
                            <div className="flex items-center justify-end gap-2">
                              <button
                                onClick={() => startEdit(filter)}
                                className="p-2 text-blue-400 hover:text-blue-300 hover:bg-cardHover rounded transition-colors"
                                title="Upraviť"
                              >
                                <Edit className="w-4 h-4" />
                              </button>
                              <button
                                onClick={() => handleDelete(filter)}
                                className="p-2 text-red-400 hover:text-red-300 hover:bg-cardHover rounded transition-colors"
                                title="Odstrániť"
                              >
                                <Trash2 className="w-4 h-4" />
                              </button>
                            </div>
                          </td>
                        </tr>
                      )
                    })}
                  </tbody>
                </table>
              </div>
            )}
          </div>
        </DashboardLayout>
  )
}

