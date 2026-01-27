'use client'

import { useEffect, useState } from 'react'
import { useRouter } from 'next/navigation'
import { isAuthenticated } from '@/lib/auth'
import Sidebar from '@/components/Sidebar'
import Header from '@/components/Header'
import { api } from '@/lib/api'
import { Filter, Category, FilterType } from '@inzertna-platforma/shared'
import { Plus, Edit, Trash2, X, Save, Filter as FilterIcon, ChevronDown, ChevronUp } from 'lucide-react'

export default function DevFiltersPage() {
  const router = useRouter()
  const [filters, setFilters] = useState<Filter[]>([])
  const [categories, setCategories] = useState<Category[]>([])
  const [loading, setLoading] = useState(true)
  const [showForm, setShowForm] = useState(false)
  const [editingId, setEditingId] = useState<string | null>(null)
  const [selectedCategoryId, setSelectedCategoryId] = useState<string>('')
  const [optionsInput, setOptionsInput] = useState('')
  const [formData, setFormData] = useState<{
    name: string
    type: FilterType
    categoryId: string
    description: string
    options: string[]
    isRequired: boolean
    isActive: boolean
    order: number
  }>({
    name: '',
    type: 'TEXT' as FilterType,
    categoryId: '',
    description: '',
    options: [],
    isRequired: false,
    isActive: true,
    order: 0,
  })

  useEffect(() => {
    if (!isAuthenticated()) {
      router.push('/login')
      return
    }
    loadCategories()
    loadFilters()
  }, [router])

  useEffect(() => {
    if (selectedCategoryId) {
      loadFilters(selectedCategoryId)
    } else {
      loadFilters()
    }
  }, [selectedCategoryId])

  const loadCategories = async () => {
    try {
      const data = await api.getCategories()
      setCategories(data)
    } catch (error) {
      console.error('Chyba pri načítaní kategórií:', error)
    }
  }

  const loadFilters = async (categoryId?: string) => {
    try {
      setLoading(true)
      const data = await api.getFilters(categoryId)
      setFilters(data)
    } catch (error) {
      console.error('Chyba pri načítaní filtrov:', error)
    } finally {
      setLoading(false)
    }
  }

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    
    if (!formData.name.trim()) {
      alert('Názov filtru je povinný')
      return
    }

    if (!formData.categoryId) {
      alert('Vyberte kategóriu')
      return
    }

    if (
      (formData.type === 'SELECT' || formData.type === 'MULTISELECT') &&
      formData.options.length === 0
    ) {
      alert('SELECT a MULTISELECT filtre musia mať definované možnosti')
      return
    }

    try {
      if (editingId) {
        await api.updateFilter(editingId, formData)
      } else {
        await api.createFilter(formData)
      }

      await loadFilters(selectedCategoryId || undefined)
      resetForm()
    } catch (error: any) {
      console.error('Chyba pri ukladaní filtru:', error)
      const errorMessage = error?.message || 'Chyba pri ukladaní filtru'
      alert(errorMessage)
    }
  }

  const handleEdit = (filter: Filter) => {
    setFormData({
      name: filter.name,
      type: filter.type as FilterType,
      categoryId: filter.categoryId,
      description: filter.description || '',
      options: filter.options || [],
      isRequired: filter.isRequired,
      isActive: filter.isActive,
      order: filter.order,
    })
    setOptionsInput(filter.options?.join(', ') || '')
    setEditingId(filter.id)
    setShowForm(true)
  }

  const handleDelete = async (id: string) => {
    if (!confirm('Naozaj chcete odstrániť tento filter?')) return
    
    try {
      await api.deleteFilter(id)
      await loadFilters(selectedCategoryId || undefined)
    } catch (error) {
      console.error('Chyba pri odstraňovaní filtru:', error)
      alert('Chyba pri odstraňovaní filtru')
    }
  }

  const resetForm = () => {
    setFormData({
      name: '',
      type: 'TEXT' as FilterType,
      categoryId: selectedCategoryId || '',
      description: '',
      options: [],
      isRequired: false,
      isActive: true,
      order: 0,
    })
    setOptionsInput('')
    setEditingId(null)
    setShowForm(false)
  }

  const handleOptionsChange = (value: string) => {
    setOptionsInput(value)
    const options = value
      .split(',')
      .map(opt => opt.trim())
      .filter(opt => opt.length > 0)
    setFormData({ ...formData, options })
  }

  const moveFilter = async (filterId: string, direction: 'up' | 'down') => {
    const currentFilter = filters.find(f => f.id === filterId)
    if (!currentFilter) return

    const sortedFilters = [...filters].sort((a, b) => a.order - b.order)
    const currentIndex = sortedFilters.findIndex(f => f.id === filterId)
    
    if (direction === 'up' && currentIndex > 0) {
      const prevFilter = sortedFilters[currentIndex - 1]
      await api.updateFilter(filterId, { order: prevFilter.order })
      await api.updateFilter(prevFilter.id, { order: currentFilter.order })
      await loadFilters(selectedCategoryId || undefined)
    } else if (direction === 'down' && currentIndex < sortedFilters.length - 1) {
      const nextFilter = sortedFilters[currentIndex + 1]
      await api.updateFilter(filterId, { order: nextFilter.order })
      await api.updateFilter(nextFilter.id, { order: currentFilter.order })
      await loadFilters(selectedCategoryId || undefined)
    }
  }

  const getFilterTypeLabel = (type: FilterType) => {
    const labels: Record<string, string> = {
      TEXT: 'Text',
      NUMBER: 'Číslo',
      SELECT: 'Výber (jedna možnosť)',
      MULTISELECT: 'Výber (viacero možností)',
      BOOLEAN: 'Áno/Nie',
      DATE: 'Dátum',
      RANGE: 'Rozsah',
    }
    return labels[type] || type
  }

  const filteredFilters = selectedCategoryId
    ? filters.filter(f => f.categoryId === selectedCategoryId)
    : filters

  return (
    <div className="min-h-screen bg-dark text-white flex">
      <Sidebar />
      <div className="flex-1 ml-64">
        <Header />
        <main className="p-6">
          <div className="mb-6 flex items-center justify-between">
            <div className="flex items-center space-x-4">
              <select
                value={selectedCategoryId}
                onChange={(e) => setSelectedCategoryId(e.target.value)}
                className="bg-card border border-dark rounded-lg px-4 py-2 text-white focus:outline-none focus:border-gray-600 hover:bg-cardHover"
              >
                <option value="">Všetky kategórie</option>
                {categories.map((cat) => (
                  <option key={cat.id} value={cat.id}>
                    {cat.name}
                  </option>
                ))}
              </select>
            </div>
            {!showForm && (
              <button
                onClick={() => setShowForm(true)}
                className="bg-primary hover:opacity-90 text-white px-4 py-2 rounded-lg flex items-center space-x-2 transition-colors"
              >
                <Plus className="w-5 h-5" />
                <span>Nový filter</span>
              </button>
            )}
          </div>

          {showForm && (
            <div className="bg-card rounded-lg p-6 border border-dark mb-6">
              <div className="flex items-center justify-between mb-4">
                <h2 className="text-xl font-semibold">
                  {editingId ? 'Upraviť filter' : 'Nový filter'}
                </h2>
                <button
                  onClick={resetForm}
                  className="text-gray-400 hover:text-white transition-colors"
                >
                  <X className="w-5 h-5" />
                </button>
              </div>

              <form onSubmit={handleSubmit} className="space-y-4">
                <div className="grid grid-cols-2 gap-4">
                  <div>
                    <label className="block text-sm font-medium text-gray-300 mb-2">
                      Kategória *
                    </label>
                    <select
                      required
                      value={formData.categoryId}
                      onChange={(e) => setFormData({ ...formData, categoryId: e.target.value })}
                      className="w-full bg-dark border border-card rounded-lg px-4 py-2 text-white focus:outline-none focus:border-gray-600 hover:bg-cardHover"
                    >
                      <option value="">-- Vybrať kategóriu --</option>
                      {categories.map((cat) => (
                        <option key={cat.id} value={cat.id}>
                          {cat.name}
                        </option>
                      ))}
                    </select>
                  </div>

                  <div>
                    <label className="block text-sm font-medium text-gray-300 mb-2">
                      Typ filtru *
                    </label>
                    <select
                      required
                      value={formData.type}
                      onChange={(e) => setFormData({ ...formData, type: e.target.value as FilterType })}
                      className="w-full bg-dark border border-card rounded-lg px-4 py-2 text-white focus:outline-none focus:border-gray-600 hover:bg-cardHover"
                    >
                      <option value="TEXT">Text</option>
                      <option value="NUMBER">Číslo</option>
                      <option value="SELECT">Výber (jedna možnosť)</option>
                      <option value="MULTISELECT">Výber (viacero možností)</option>
                      <option value="BOOLEAN">Áno/Nie</option>
                      <option value="DATE">Dátum</option>
                      <option value="RANGE">Rozsah</option>
                    </select>
                  </div>
                </div>

                <div>
                  <label className="block text-sm font-medium text-gray-300 mb-2">
                    Názov filtru *
                  </label>
                  <input
                    type="text"
                    required
                    value={formData.name}
                    onChange={(e) => setFormData({ ...formData, name: e.target.value })}
                    placeholder="Napríklad: Značka, Model, Rok výroby..."
                    className="w-full bg-dark border border-card rounded-lg px-4 py-2 text-white placeholder-gray-500 focus:outline-none focus:border-gray-600 hover:bg-cardHover"
                  />
                </div>

                <div>
                  <label className="block text-sm font-medium text-gray-300 mb-2">
                    Popis
                  </label>
                  <textarea
                    value={formData.description}
                    onChange={(e) => setFormData({ ...formData, description: e.target.value })}
                    rows={2}
                    placeholder="Krátky popis filtru..."
                    className="w-full bg-dark border border-card rounded-lg px-4 py-2 text-white placeholder-gray-500 focus:outline-none focus:border-gray-600 hover:bg-cardHover"
                  />
                </div>

                {(formData.type === 'SELECT' || formData.type === 'MULTISELECT') && (
                  <div>
                    <label className="block text-sm font-medium text-gray-300 mb-2">
                      Možnosti (oddelené čiarkou) *
                    </label>
                    <input
                      type="text"
                      required
                      value={optionsInput}
                      onChange={(e) => handleOptionsChange(e.target.value)}
                      placeholder="Napríklad: BMW, Audi, Mercedes, Volkswagen"
                      className="w-full bg-dark border border-card rounded-lg px-4 py-2 text-white placeholder-gray-500 focus:outline-none focus:border-gray-600 hover:bg-cardHover"
                    />
                    {formData.options.length > 0 && (
                      <div className="mt-2 flex flex-wrap gap-2">
                        {formData.options.map((opt, idx) => (
                          <span
                            key={idx}
                            className="px-2 py-1 bg-dark border border-card rounded text-sm text-gray-300"
                          >
                            {opt}
                          </span>
                        ))}
                      </div>
                    )}
                  </div>
                )}

                <div className="grid grid-cols-3 gap-4">
                  <div>
                    <label className="flex items-center space-x-2">
                      <input
                        type="checkbox"
                        checked={formData.isRequired}
                        onChange={(e) => setFormData({ ...formData, isRequired: e.target.checked })}
                        className="w-4 h-4 text-primary bg-dark border-card rounded focus:ring-primary"
                      />
                      <span className="text-sm text-gray-300">Povinný</span>
                    </label>
                  </div>

                  <div>
                    <label className="flex items-center space-x-2">
                      <input
                        type="checkbox"
                        checked={formData.isActive}
                        onChange={(e) => setFormData({ ...formData, isActive: e.target.checked })}
                        className="w-4 h-4 text-primary bg-dark border-card rounded focus:ring-primary"
                      />
                      <span className="text-sm text-gray-300">Aktívny</span>
                    </label>
                  </div>

                  <div>
                    <label className="block text-sm font-medium text-gray-300 mb-2">
                      Poradie
                    </label>
                    <input
                      type="number"
                      value={formData.order}
                      onChange={(e) => setFormData({ ...formData, order: parseInt(e.target.value) || 0 })}
                      className="w-full bg-dark border border-card rounded-lg px-4 py-2 text-white focus:outline-none focus:border-gray-600 hover:bg-cardHover"
                    />
                  </div>
                </div>

                <div className="flex justify-end space-x-3 pt-4">
                  <button
                    type="button"
                    onClick={resetForm}
                    className="px-4 py-2 border border-card rounded-lg text-gray-300 hover:bg-cardHover transition-colors"
                  >
                    Zrušiť
                  </button>
                  <button
                    type="submit"
                    className="px-4 py-2 bg-primary hover:opacity-90 text-white rounded-lg flex items-center space-x-2 transition-colors"
                  >
                    <Save className="w-4 h-4" />
                    <span>{editingId ? 'Uložiť zmeny' : 'Vytvoriť'}</span>
                  </button>
                </div>
              </form>
            </div>
          )}

          <div className="bg-card rounded-lg border border-dark">
            {loading ? (
              <div className="p-6 text-center text-gray-400">Načítavam...</div>
            ) : filteredFilters.length === 0 ? (
              <div className="p-6 text-center text-gray-400">
                <FilterIcon className="w-12 h-12 mx-auto mb-4 text-gray-500" />
                <p>Žiadne filtre</p>
                <p className="text-sm text-gray-500 mt-2">
                  {selectedCategoryId
                    ? 'Vytvorte prvý filter pre túto kategóriu'
                    : 'Vyberte kategóriu alebo vytvorte filter'}
                </p>
              </div>
            ) : (
              <div className="overflow-x-auto">
                <table className="w-full">
                  <thead className="bg-dark border-b border-card">
                    <tr>
                      <th className="text-left px-6 py-3 text-sm font-semibold text-gray-300">Poradie</th>
                      <th className="text-left px-6 py-3 text-sm font-semibold text-gray-300">Názov</th>
                      <th className="text-left px-6 py-3 text-sm font-semibold text-gray-300">Kategória</th>
                      <th className="text-left px-6 py-3 text-sm font-semibold text-gray-300">Typ</th>
                      <th className="text-left px-6 py-3 text-sm font-semibold text-gray-300">Status</th>
                      <th className="text-right px-6 py-3 text-sm font-semibold text-gray-300">Akcie</th>
                    </tr>
                  </thead>
                  <tbody>
                    {filteredFilters
                      .sort((a, b) => a.order - b.order)
                      .map((filter) => (
                        <tr key={filter.id} className="border-b border-card hover:bg-dark/50 transition-colors">
                          <td className="px-6 py-4">
                            <div className="flex items-center space-x-2">
                              <button
                                onClick={() => moveFilter(filter.id, 'up')}
                                className="p-1 text-gray-400 hover:text-white"
                                title="Posunúť hore"
                              >
                                <ChevronUp className="w-4 h-4" />
                              </button>
                              <span className="text-gray-300">{filter.order}</span>
                              <button
                                onClick={() => moveFilter(filter.id, 'down')}
                                className="p-1 text-gray-400 hover:text-white"
                                title="Posunúť dole"
                              >
                                <ChevronDown className="w-4 h-4" />
                              </button>
                            </div>
                          </td>
                          <td className="px-6 py-4">
                            <div className="flex items-center space-x-2">
                              <FilterIcon className="w-5 h-5 text-gray-400" />
                              <div>
                                <span className="font-medium">{filter.name}</span>
                                {filter.isRequired && (
                                  <span className="ml-2 text-xs text-red-400">*</span>
                                )}
                                {filter.description && (
                                  <p className="text-xs text-gray-400">{filter.description}</p>
                                )}
                              </div>
                            </div>
                          </td>
                          <td className="px-6 py-4 text-gray-300">
                            {(filter.category as any)?.name || '-'}
                          </td>
                          <td className="px-6 py-4 text-gray-300">
                            {getFilterTypeLabel(filter.type)}
                          </td>
                          <td className="px-6 py-4">
                            <span className={`px-2 py-1 rounded text-xs font-medium ${
                              filter.isActive 
                                ? 'bg-green-500/20 text-green-400' 
                                : 'bg-gray-500/20 text-gray-400'
                            }`}>
                              {filter.isActive ? 'Aktívny' : 'Neaktívny'}
                            </span>
                          </td>
                          <td className="px-6 py-4">
                            <div className="flex items-center justify-end space-x-2">
                              <button
                                onClick={() => handleEdit(filter)}
                                className="p-2 text-blue-400 hover:text-blue-300 hover:bg-cardHover rounded transition-colors"
                                title="Upraviť"
                              >
                                <Edit className="w-4 h-4" />
                              </button>
                              <button
                                onClick={() => handleDelete(filter.id)}
                                className="p-2 text-red-400 hover:text-red-300 hover:bg-cardHover rounded transition-colors"
                                title="Odstrániť"
                              >
                                <Trash2 className="w-4 h-4" />
                              </button>
                            </div>
                          </td>
                        </tr>
                      ))}
                  </tbody>
                </table>
              </div>
            )}
          </div>
        </main>
      </div>
    </div>
  )
}
