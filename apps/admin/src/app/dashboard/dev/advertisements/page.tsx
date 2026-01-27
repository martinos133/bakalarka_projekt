'use client'

import { useEffect, useState } from 'react'
import { useRouter } from 'next/navigation'
import { isAuthenticated } from '@/lib/auth'
import Sidebar from '@/components/Sidebar'
import Header from '@/components/Header'
import { api } from '@/lib/api'
import { Advertisement, AdvertisementStatus, AdvertisementType, CreateAdvertisementDto, Category, ServicePackage, FAQ } from '@inzertna-platforma/shared'
import { Plus, Edit, Trash2, X, Save, Image as ImageIcon } from 'lucide-react'

export default function DevAdvertisementsPage() {
  const router = useRouter()
  const [advertisements, setAdvertisements] = useState<Advertisement[]>([])
  const [loading, setLoading] = useState(true)
  const [showForm, setShowForm] = useState(false)
  const [editingId, setEditingId] = useState<string | null>(null)
  const [categories, setCategories] = useState<Category[]>([])
  
  const [formData, setFormData] = useState<CreateAdvertisementDto & { status?: AdvertisementStatus }>({
    title: '',
    description: '',
    price: undefined,
    type: AdvertisementType.SERVICE,
    categoryId: '',
    location: '',
    postalCode: '',
    images: [],
    status: AdvertisementStatus.DRAFT,
    pricingType: 'FIXED',
    hourlyRate: undefined,
    dailyRate: undefined,
    packages: [],
    deliveryTime: '',
    revisions: '',
    features: [],
    faq: [],
  })
  
  const [newFeature, setNewFeature] = useState('')
  const [newPackage, setNewPackage] = useState<Partial<ServicePackage>>({
    name: '',
    description: '',
    price: undefined,
    deliveryTime: '',
    features: [],
  })
  const [newPackageFeature, setNewPackageFeature] = useState('')
  const [newFAQ, setNewFAQ] = useState<Partial<FAQ>>({
    question: '',
    answer: '',
  })

  useEffect(() => {
    if (!isAuthenticated()) {
      router.push('/login')
      return
    }
    loadAdvertisements()
  }, [router])

  const loadAdvertisements = async () => {
    try {
      setLoading(true)
      const data = await api.getAdvertisements()
      setAdvertisements(data)
    } catch (error) {
      console.error('Chyba pri načítaní inzerátov:', error)
    } finally {
      setLoading(false)
    }
  }

  const loadCategories = async () => {
    try {
      const data = await api.getActiveCategories()
      setCategories(data)
    } catch (error) {
      console.error('Chyba pri načítaní kategórií:', error)
    }
  }

  useEffect(() => {
    if (showForm) {
      loadCategories()
    }
  }, [showForm])

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    try {
      const submitData = {
        ...formData,
        price: formData.price ? parseFloat(formData.price.toString()) : undefined,
        images: formData.images || [],
        categoryId: formData.categoryId || undefined,
      }

      // Odstráň status z create, ak vytvárame nový inzerát
      if (editingId) {
        await api.updateAdvertisement(editingId, submitData)
      } else {
        const { status, ...createData } = submitData
        await api.createAdvertisement(createData)
      }

      await loadAdvertisements()
      resetForm()
    } catch (error: any) {
      console.error('Chyba pri ukladaní inzerátu:', error)
      const errorMessage = error?.message || 'Chyba pri ukladaní inzerátu'
      alert(errorMessage)
    }
  }

  const handleEdit = async (ad: Advertisement) => {
    await loadCategories()
    setFormData({
      title: ad.title,
      description: ad.description,
      price: ad.price,
      categoryId: (ad as any).categoryId || '',
      location: ad.location || '',
      postalCode: ad.postalCode || '',
      images: ad.images || [],
      status: ad.status,
    })
    setEditingId(ad.id)
    setShowForm(true)
  }

  const handleDelete = async (id: string) => {
    if (!confirm('Naozaj chcete odstrániť tento inzerát?')) return
    
    try {
      await api.deleteAdvertisement(id)
      await loadAdvertisements()
    } catch (error) {
      console.error('Chyba pri odstraňovaní inzerátu:', error)
      alert('Chyba pri odstraňovaní inzerátu')
    }
  }

  const resetForm = () => {
    setFormData({
      title: '',
      description: '',
      price: undefined,
      type: AdvertisementType.SERVICE,
      categoryId: '',
      location: '',
      postalCode: '',
      images: [],
      status: AdvertisementStatus.DRAFT,
      pricingType: 'FIXED',
      hourlyRate: undefined,
      dailyRate: undefined,
      packages: [],
      deliveryTime: '',
      revisions: '',
      features: [],
      faq: [],
    })
    setNewFeature('')
    setNewPackage({ name: '', description: '', price: undefined, deliveryTime: '', features: [] })
    setNewPackageFeature('')
    setNewFAQ({ question: '', answer: '' })
    setEditingId(null)
    setShowForm(false)
  }

  const handleImageUpload = (e: React.ChangeEvent<HTMLInputElement>) => {
    const files = e.target.files
    if (!files) return

    const fileArray = Array.from(files)
    const imagePromises = fileArray.map((file) => {
      return new Promise<string>((resolve, reject) => {
        if (!file.type.startsWith('image/')) {
          reject(new Error('Súbor musí byť obrázok'))
          return
        }

        const reader = new FileReader()
        reader.onload = (event) => {
          const result = event.target?.result
          if (typeof result === 'string') {
            resolve(result)
          } else {
            reject(new Error('Chyba pri načítaní obrázka'))
          }
        }
        reader.onerror = () => reject(new Error('Chyba pri načítaní obrázka'))
        reader.readAsDataURL(file)
      })
    })

    Promise.all(imagePromises)
      .then((base64Images) => {
        setFormData({
          ...formData,
          images: [...(formData.images || []), ...base64Images],
        })
      })
      .catch((error) => {
        console.error('Chyba pri nahrávaní obrázkov:', error)
        alert('Chyba pri nahrávaní obrázkov. Uistite sa, že všetky súbory sú obrázky.')
      })

    // Reset input
    e.target.value = ''
  }

  const removeImage = (index: number) => {
    const newImages = [...(formData.images || [])]
    newImages.splice(index, 1)
    setFormData({ ...formData, images: newImages })
  }

  const getStatusColor = (status: AdvertisementStatus) => {
    switch (status) {
      case AdvertisementStatus.ACTIVE:
        return 'bg-green-500/20 text-green-400'
      case AdvertisementStatus.DRAFT:
        return 'bg-gray-500/20 text-gray-400'
      case AdvertisementStatus.INACTIVE:
        return 'bg-yellow-500/20 text-yellow-400'
      case AdvertisementStatus.ARCHIVED:
        return 'bg-red-500/20 text-red-400'
      default:
        return 'bg-gray-500/20 text-gray-400'
    }
  }

  const getStatusLabel = (status: AdvertisementStatus) => {
    switch (status) {
      case AdvertisementStatus.ACTIVE:
        return 'Aktívny'
      case AdvertisementStatus.DRAFT:
        return 'Koncept'
      case AdvertisementStatus.INACTIVE:
        return 'Neaktívny'
      case AdvertisementStatus.ARCHIVED:
        return 'Archivovaný'
      default:
        return status
    }
  }

  return (
    <div className="min-h-screen bg-dark text-white flex">
      <Sidebar />
      <div className="flex-1 ml-64">
        <Header />
        <main className="p-6">
          <div className="mb-6 flex items-center justify-end">
            {!showForm && (
              <button
                onClick={() => setShowForm(true)}
                className="bg-primary hover:opacity-90 text-white px-4 py-2 rounded-lg flex items-center space-x-2 transition-colors"
              >
                <Plus className="w-5 h-5" />
                <span>Nový inzerát</span>
              </button>
            )}
          </div>

          {showForm && (
            <div className="bg-card rounded-lg p-6 border border-dark mb-6">
              <div className="flex items-center justify-between mb-4">
                <h2 className="text-xl font-semibold">
                  {editingId ? 'Upraviť inzerát' : 'Nový inzerát'}
                </h2>
                <button
                  onClick={resetForm}
                  className="text-gray-400 hover:text-white transition-colors"
                >
                  <X className="w-5 h-5" />
                </button>
              </div>

              <form onSubmit={handleSubmit} className="space-y-4">
                <div>
                  <label className="block text-sm font-medium text-gray-300 mb-2">Názov *</label>
                  <input
                    type="text"
                    required
                    value={formData.title}
                    onChange={(e) => setFormData({ ...formData, title: e.target.value })}
                    className="w-full bg-dark border border-card rounded-lg px-4 py-2 text-white placeholder-gray-500 focus:outline-none focus:border-gray-600 hover:bg-cardHover"
                  />
                </div>

                <div>
                  <label className="block text-sm font-medium text-gray-300 mb-2">Popis *</label>
                  <textarea
                    required
                    value={formData.description}
                    onChange={(e) => setFormData({ ...formData, description: e.target.value })}
                    rows={4}
                    className="w-full bg-dark border border-card rounded-lg px-4 py-2 text-white placeholder-gray-500 focus:outline-none focus:border-gray-600 hover:bg-cardHover"
                  />
                </div>

                <div className="grid grid-cols-2 gap-4">
                  <div>
                    <label className="block text-sm font-medium text-gray-300 mb-2">Typ inzerátu *</label>
                    <select
                      required
                      value={formData.type}
                      onChange={(e) => setFormData({ ...formData, type: e.target.value as AdvertisementType })}
                      className="w-full bg-dark border border-card rounded-lg px-4 py-2 text-white focus:outline-none focus:border-gray-600 hover:bg-cardHover"
                    >
                      <option value={AdvertisementType.SERVICE}>Služba</option>
                      <option value={AdvertisementType.RENTAL}>Prenájom</option>
                    </select>
                  </div>

                  <div>
                    <label className="block text-sm font-medium text-gray-300 mb-2">Cena</label>
                    <input
                      type="number"
                      step="0.01"
                      value={formData.price || ''}
                      onChange={(e) => setFormData({ ...formData, price: e.target.value ? parseFloat(e.target.value) : undefined })}
                      className="w-full bg-dark border border-card rounded-lg px-4 py-2 text-white placeholder-gray-500 focus:outline-none focus:border-gray-600 hover:bg-cardHover"
                    />
                  </div>
                </div>

                <div className="grid grid-cols-2 gap-4">
                  <div>
                    <label className="block text-sm font-medium text-gray-300 mb-2">Kategória</label>
                    <select
                      value={formData.categoryId}
                      onChange={(e) => setFormData({ ...formData, categoryId: e.target.value })}
                      className="w-full bg-dark border border-card rounded-lg px-4 py-2 text-white placeholder-gray-500 focus:outline-none focus:border-gray-600 hover:bg-cardHover"
                    >
                      <option value="">-- Vybrať kategóriu --</option>
                      {categories
                        .filter((cat) => !cat.parentId)
                        .map((cat) => (
                          <>
                            <option key={cat.id} value={cat.id}>
                              {cat.name}
                            </option>
                            {(cat as any).children?.map((child: Category) => (
                              <option key={child.id} value={child.id}>
                                &nbsp;&nbsp;└─ {child.name}
                              </option>
                            ))}
                          </>
                        ))}
                    </select>
                  </div>

                  <div>
                    <label className="block text-sm font-medium text-gray-300 mb-2">Lokalita</label>
                    <input
                      type="text"
                      value={formData.location || ''}
                      onChange={(e) => setFormData({ ...formData, location: e.target.value })}
                      className="w-full bg-dark border border-card rounded-lg px-4 py-2 text-white placeholder-gray-500 focus:outline-none focus:border-gray-600 hover:bg-cardHover"
                    />
                  </div>

                  <div>
                    <label className="block text-sm font-medium text-gray-300 mb-2">PSČ</label>
                    <input
                      type="text"
                      value={formData.postalCode || ''}
                      onChange={(e) => setFormData({ ...formData, postalCode: e.target.value })}
                      className="w-full bg-dark border border-card rounded-lg px-4 py-2 text-white placeholder-gray-500 focus:outline-none focus:border-gray-600 hover:bg-cardHover"
                      placeholder="Napríklad: 811 01"
                    />
                  </div>
                </div>

                <p className="text-xs text-gray-400">
                  Ak nemáte kategóriu, vytvorte ju v sekcii <a href="/dashboard/dev/categories" className="text-blue-400 hover:text-blue-300">Kategórie</a>
                </p>

                {/* Service-specific fields */}
                {formData.type === AdvertisementType.SERVICE && (
                  <>
                    <div className="border-t border-card pt-4 mt-4">
                      <h3 className="text-lg font-semibold text-white mb-4">Detaily služby</h3>
                      
                      <div className="grid grid-cols-2 gap-4 mb-4">
                        <div>
                          <label className="block text-sm font-medium text-gray-300 mb-2">Typ sadzby *</label>
                          <select
                            required
                            value={formData.pricingType}
                            onChange={(e) => setFormData({ ...formData, pricingType: e.target.value as any })}
                            className="w-full bg-dark border border-card rounded-lg px-4 py-2 text-white focus:outline-none focus:border-gray-600 hover:bg-cardHover"
                          >
                            <option value="FIXED">Fixná cena</option>
                            <option value="HOURLY">Hodinová sadzba</option>
                            <option value="DAILY">Denná sadzba</option>
                            <option value="PACKAGE">Balíčky</option>
                          </select>
                        </div>

                        {formData.pricingType === 'FIXED' && (
                          <div>
                            <label className="block text-sm font-medium text-gray-300 mb-2">Fixná cena (€) *</label>
                            <input
                              type="number"
                              step="0.01"
                              required
                              value={formData.price || ''}
                              onChange={(e) => setFormData({ ...formData, price: e.target.value ? parseFloat(e.target.value) : undefined })}
                              className="w-full bg-dark border border-card rounded-lg px-4 py-2 text-white placeholder-gray-500 focus:outline-none focus:border-gray-600 hover:bg-cardHover"
                              placeholder="0.00"
                            />
                          </div>
                        )}

                        {formData.pricingType === 'HOURLY' && (
                          <div>
                            <label className="block text-sm font-medium text-gray-300 mb-2">Hodinová sadzba (€/h) *</label>
                            <input
                              type="number"
                              step="0.01"
                              required
                              value={formData.hourlyRate || ''}
                              onChange={(e) => setFormData({ ...formData, hourlyRate: e.target.value ? parseFloat(e.target.value) : undefined })}
                              className="w-full bg-dark border border-card rounded-lg px-4 py-2 text-white placeholder-gray-500 focus:outline-none focus:border-gray-600 hover:bg-cardHover"
                            />
                          </div>
                        )}

                        {formData.pricingType === 'DAILY' && (
                          <div>
                            <label className="block text-sm font-medium text-gray-300 mb-2">Denná sadzba (€/deň) *</label>
                            <input
                              type="number"
                              step="0.01"
                              required
                              value={formData.dailyRate || ''}
                              onChange={(e) => setFormData({ ...formData, dailyRate: e.target.value ? parseFloat(e.target.value) : undefined })}
                              className="w-full bg-dark border border-card rounded-lg px-4 py-2 text-white placeholder-gray-500 focus:outline-none focus:border-gray-600 hover:bg-cardHover"
                            />
                          </div>
                        )}
                      </div>

                      <div className="grid grid-cols-2 gap-4 mb-4">
                        <div>
                          <label className="block text-sm font-medium text-gray-300 mb-2">Čas dodania</label>
                          <input
                            type="text"
                            value={formData.deliveryTime || ''}
                            onChange={(e) => setFormData({ ...formData, deliveryTime: e.target.value })}
                            placeholder="Napríklad: 3-5 dní, 1 týždeň..."
                            className="w-full bg-dark border border-card rounded-lg px-4 py-2 text-white placeholder-gray-500 focus:outline-none focus:border-gray-600 hover:bg-cardHover"
                          />
                        </div>

                        <div>
                          <label className="block text-sm font-medium text-gray-300 mb-2">Revízie</label>
                          <input
                            type="text"
                            value={formData.revisions || ''}
                            onChange={(e) => setFormData({ ...formData, revisions: e.target.value })}
                            placeholder="Napríklad: Neobmedzené, 3 revízie..."
                            className="w-full bg-dark border border-card rounded-lg px-4 py-2 text-white placeholder-gray-500 focus:outline-none focus:border-gray-600 hover:bg-cardHover"
                          />
                        </div>
                      </div>

                      {/* Features */}
                      <div className="mb-4">
                        <label className="block text-sm font-medium text-gray-300 mb-2">Čo je zahrnuté</label>
                        <div className="flex gap-2 mb-2">
                          <input
                            type="text"
                            value={newFeature}
                            onChange={(e) => setNewFeature(e.target.value)}
                            onKeyPress={(e) => {
                              if (e.key === 'Enter') {
                                e.preventDefault()
                                if (newFeature.trim()) {
                                  setFormData({ ...formData, features: [...(formData.features || []), newFeature.trim()] })
                                  setNewFeature('')
                                }
                              }
                            }}
                            placeholder="Pridajte funkciu a stlačte Enter"
                            className="flex-1 bg-dark border border-card rounded-lg px-4 py-2 text-white placeholder-gray-500 focus:outline-none focus:border-gray-600 hover:bg-cardHover"
                          />
                          <button
                            type="button"
                            onClick={() => {
                              if (newFeature.trim()) {
                                setFormData({ ...formData, features: [...(formData.features || []), newFeature.trim()] })
                                setNewFeature('')
                              }
                            }}
                            className="px-4 py-2 bg-primary hover:opacity-90 text-white rounded-lg"
                          >
                            <Plus className="w-4 h-4" />
                          </button>
                        </div>
                        <div className="flex flex-wrap gap-2">
                          {formData.features?.map((feature, idx) => (
                            <span key={idx} className="px-3 py-1 bg-card rounded-lg text-sm text-white flex items-center gap-2">
                              {feature}
                              <button
                                type="button"
                                onClick={() => {
                                  setFormData({ ...formData, features: formData.features?.filter((_, i) => i !== idx) })
                                }}
                                className="text-red-400 hover:text-red-300"
                              >
                                <X className="w-3 h-3" />
                              </button>
                            </span>
                          ))}
                        </div>
                      </div>

                      {/* Packages */}
                      {formData.pricingType === 'PACKAGE' && (
                        <div className="mb-4">
                          <label className="block text-sm font-medium text-gray-300 mb-2">Balíčky služieb</label>
                          <div className="space-y-4 p-4 bg-dark rounded-lg border border-card">
                            <div className="grid grid-cols-2 gap-4">
                              <div>
                                <label className="block text-xs text-gray-400 mb-1">Názov balíčka</label>
                                <input
                                  type="text"
                                  value={newPackage.name || ''}
                                  onChange={(e) => setNewPackage({ ...newPackage, name: e.target.value })}
                                  className="w-full bg-dark border border-card rounded-lg px-3 py-2 text-white text-sm placeholder-gray-500 focus:outline-none focus:border-gray-600"
                                  placeholder="Napríklad: Základný"
                                />
                              </div>
                              <div>
                                <label className="block text-xs text-gray-400 mb-1">Cena (€)</label>
                                <input
                                  type="number"
                                  step="0.01"
                                  value={newPackage.price || ''}
                                  onChange={(e) => setNewPackage({ ...newPackage, price: e.target.value ? parseFloat(e.target.value) : undefined })}
                                  className="w-full bg-dark border border-card rounded-lg px-3 py-2 text-white text-sm placeholder-gray-500 focus:outline-none focus:border-gray-600"
                                />
                              </div>
                            </div>
                            <div>
                              <label className="block text-xs text-gray-400 mb-1">Popis balíčka</label>
                              <textarea
                                value={newPackage.description || ''}
                                onChange={(e) => setNewPackage({ ...newPackage, description: e.target.value })}
                                rows={2}
                                className="w-full bg-dark border border-card rounded-lg px-3 py-2 text-white text-sm placeholder-gray-500 focus:outline-none focus:border-gray-600"
                                placeholder="Popis toho, čo obsahuje tento balíček"
                              />
                            </div>
                            <div className="grid grid-cols-2 gap-4">
                              <div>
                                <label className="block text-xs text-gray-400 mb-1">Čas dodania</label>
                                <input
                                  type="text"
                                  value={newPackage.deliveryTime || ''}
                                  onChange={(e) => setNewPackage({ ...newPackage, deliveryTime: e.target.value })}
                                  className="w-full bg-dark border border-card rounded-lg px-3 py-2 text-white text-sm placeholder-gray-500 focus:outline-none focus:border-gray-600"
                                  placeholder="Napríklad: 3-5 dní"
                                />
                              </div>
                              <div>
                                <label className="block text-xs text-gray-400 mb-1">Funkcie balíčka</label>
                                <div className="flex gap-2">
                                  <input
                                    type="text"
                                    value={newPackageFeature}
                                    onChange={(e) => setNewPackageFeature(e.target.value)}
                                    onKeyPress={(e) => {
                                      if (e.key === 'Enter') {
                                        e.preventDefault()
                                        if (newPackageFeature.trim()) {
                                          setNewPackage({ ...newPackage, features: [...(newPackage.features || []), newPackageFeature.trim()] })
                                          setNewPackageFeature('')
                                        }
                                      }
                                    }}
                                    className="flex-1 bg-dark border border-card rounded-lg px-3 py-2 text-white text-sm placeholder-gray-500 focus:outline-none focus:border-gray-600"
                                    placeholder="Pridajte funkciu"
                                  />
                                  <button
                                    type="button"
                                    onClick={() => {
                                      if (newPackageFeature.trim()) {
                                        setNewPackage({ ...newPackage, features: [...(newPackage.features || []), newPackageFeature.trim()] })
                                        setNewPackageFeature('')
                                      }
                                    }}
                                    className="px-3 py-2 bg-primary hover:opacity-90 text-white rounded-lg text-sm"
                                  >
                                    <Plus className="w-3 h-3" />
                                  </button>
                                </div>
                                <div className="flex flex-wrap gap-1 mt-2">
                                  {newPackage.features?.map((feature, idx) => (
                                    <span key={idx} className="px-2 py-1 bg-card rounded text-xs text-white flex items-center gap-1">
                                      {feature}
                                      <button
                                        type="button"
                                        onClick={() => {
                                          setNewPackage({ ...newPackage, features: newPackage.features?.filter((_, i) => i !== idx) })
                                        }}
                                        className="text-red-400 hover:text-red-300"
                                      >
                                        <X className="w-2 h-2" />
                                      </button>
                                    </span>
                                  ))}
                                </div>
                              </div>
                            </div>
                            <button
                              type="button"
                              onClick={() => {
                                if (newPackage.name && newPackage.price) {
                                  setFormData({ ...formData, packages: [...(formData.packages || []), newPackage as ServicePackage] })
                                  setNewPackage({ name: '', description: '', price: undefined, deliveryTime: '', features: [] })
                                  setNewPackageFeature('')
                                }
                              }}
                              className="w-full px-4 py-2 bg-primary hover:opacity-90 text-white rounded-lg text-sm flex items-center justify-center gap-2"
                            >
                              <Plus className="w-4 h-4" />
                              Pridať balíček
                            </button>
                          </div>
                          <div className="mt-4 space-y-2">
                            {formData.packages?.map((pkg, idx) => (
                              <div key={idx} className="p-3 bg-card rounded-lg border border-dark flex items-start justify-between">
                                <div className="flex-1">
                                  <div className="font-medium text-white">{pkg.name}</div>
                                  <div className="text-sm text-gray-400">{pkg.description}</div>
                                  <div className="text-sm text-gray-300 mt-1">
                                    <span className="font-semibold">{pkg.price}€</span> • {pkg.deliveryTime}
                                  </div>
                                  {pkg.features && pkg.features.length > 0 && (
                                    <div className="flex flex-wrap gap-1 mt-2">
                                      {pkg.features.map((feature, fIdx) => (
                                        <span key={fIdx} className="px-2 py-1 bg-dark rounded text-xs text-gray-300">
                                          {feature}
                                        </span>
                                      ))}
                                    </div>
                                  )}
                                </div>
                                <button
                                  type="button"
                                  onClick={() => {
                                    setFormData({ ...formData, packages: formData.packages?.filter((_, i) => i !== idx) })
                                  }}
                                  className="ml-4 text-red-400 hover:text-red-300"
                                >
                                  <Trash2 className="w-4 h-4" />
                                </button>
                              </div>
                            ))}
                          </div>
                        </div>
                      )}

                      {/* FAQ */}
                      <div className="mb-4">
                        <label className="block text-sm font-medium text-gray-300 mb-2">Často kladené otázky (FAQ)</label>
                        <div className="space-y-2 p-4 bg-dark rounded-lg border border-card">
                          <div>
                            <label className="block text-xs text-gray-400 mb-1">Otázka</label>
                            <input
                              type="text"
                              value={newFAQ.question || ''}
                              onChange={(e) => setNewFAQ({ ...newFAQ, question: e.target.value })}
                              className="w-full bg-dark border border-card rounded-lg px-3 py-2 text-white text-sm placeholder-gray-500 focus:outline-none focus:border-gray-600 mb-2"
                              placeholder="Napríklad: Ako dlho trvá dodanie?"
                            />
                          </div>
                          <div>
                            <label className="block text-xs text-gray-400 mb-1">Odpoveď</label>
                            <textarea
                              value={newFAQ.answer || ''}
                              onChange={(e) => setNewFAQ({ ...newFAQ, answer: e.target.value })}
                              rows={2}
                              className="w-full bg-dark border border-card rounded-lg px-3 py-2 text-white text-sm placeholder-gray-500 focus:outline-none focus:border-gray-600"
                              placeholder="Odpoveď na otázku"
                            />
                          </div>
                          <button
                            type="button"
                            onClick={() => {
                              if (newFAQ.question && newFAQ.answer) {
                                setFormData({ ...formData, faq: [...(formData.faq || []), newFAQ as FAQ] })
                                setNewFAQ({ question: '', answer: '' })
                              }
                            }}
                            className="w-full px-4 py-2 bg-primary hover:opacity-90 text-white rounded-lg text-sm flex items-center justify-center gap-2"
                          >
                            <Plus className="w-4 h-4" />
                            Pridať FAQ
                          </button>
                        </div>
                        <div className="mt-4 space-y-2">
                          {formData.faq?.map((faq, idx) => (
                            <div key={idx} className="p-3 bg-card rounded-lg border border-dark flex items-start justify-between">
                              <div className="flex-1">
                                <div className="font-medium text-white mb-1">{faq.question}</div>
                                <div className="text-sm text-gray-400">{faq.answer}</div>
                              </div>
                              <button
                                type="button"
                                onClick={() => {
                                  setFormData({ ...formData, faq: formData.faq?.filter((_, i) => i !== idx) })
                                }}
                                className="ml-4 text-red-400 hover:text-red-300"
                              >
                                <Trash2 className="w-4 h-4" />
                              </button>
                            </div>
                          ))}
                        </div>
                      </div>
                    </div>
                  </>
                )}

                <div>
                  <label className="block text-sm font-medium text-gray-300 mb-2">Fotky</label>
                  <div className="space-y-4">
                    <div>
                      <label className="flex items-center justify-center w-full h-32 border-2 border-dashed border-card rounded-lg cursor-pointer hover:bg-cardHover transition-colors">
                        <div className="flex flex-col items-center justify-center">
                          <ImageIcon className="w-8 h-8 text-gray-400 mb-2" />
                          <p className="text-sm text-gray-400">
                            Kliknite alebo presuňte obrázky sem
                          </p>
                          <p className="text-xs text-gray-500 mt-1">
                            PNG, JPG, GIF do 10MB
                          </p>
                        </div>
                        <input
                          type="file"
                          multiple
                          accept="image/*"
                          onChange={handleImageUpload}
                          className="hidden"
                        />
                      </label>
                    </div>

                    {formData.images && formData.images.length > 0 && (
                      <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
                        {formData.images.map((image, index) => (
                          <div key={index} className="relative group">
                            <img
                              src={image}
                              alt={`Upload ${index + 1}`}
                              className="w-full h-32 object-cover rounded-lg border border-card"
                            />
                            <button
                              type="button"
                              onClick={() => removeImage(index)}
                              className="absolute top-2 right-2 p-1 bg-red-500 hover:bg-red-600 text-white rounded-full opacity-0 group-hover:opacity-100 transition-opacity"
                            >
                              <X className="w-4 h-4" />
                            </button>
                          </div>
                        ))}
                      </div>
                    )}
                  </div>
                </div>

                <div>
                  <label className="block text-sm font-medium text-gray-300 mb-2">Status</label>
                  <select
                    value={formData.status}
                    onChange={(e) => setFormData({ ...formData, status: e.target.value as AdvertisementStatus })}
                    className="w-full bg-dark border border-card rounded-lg px-4 py-2 text-white placeholder-gray-500 focus:outline-none focus:border-gray-600 hover:bg-cardHover"
                  >
                    <option value={AdvertisementStatus.DRAFT}>Koncept</option>
                    <option value={AdvertisementStatus.ACTIVE}>Aktívny</option>
                    <option value={AdvertisementStatus.INACTIVE}>Neaktívny</option>
                    <option value={AdvertisementStatus.ARCHIVED}>Archivovaný</option>
                  </select>
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
                    <span>Uložiť</span>
                  </button>
                </div>
              </form>
            </div>
          )}

          <div className="bg-card rounded-lg border border-dark">
            {loading ? (
              <div className="p-6 text-center text-gray-400">Načítavam...</div>
            ) : advertisements.length === 0 ? (
              <div className="p-6 text-center text-gray-400">Žiadne inzeráty</div>
            ) : (
              <div className="overflow-x-auto">
                <table className="w-full">
                  <thead className="bg-dark border-b border-card">
                    <tr>
                      <th className="text-left px-6 py-3 text-sm font-semibold text-gray-300">Názov</th>
                      <th className="text-left px-6 py-3 text-sm font-semibold text-gray-300">Typ</th>
                      <th className="text-left px-6 py-3 text-sm font-semibold text-gray-300">Kategória</th>
                      <th className="text-left px-6 py-3 text-sm font-semibold text-gray-300">Cena</th>
                      <th className="text-left px-6 py-3 text-sm font-semibold text-gray-300">Status</th>
                      <th className="text-left px-6 py-3 text-sm font-semibold text-gray-300">Lokalita</th>
                      <th className="text-left px-6 py-3 text-sm font-semibold text-gray-300">PSČ</th>
                      <th className="text-right px-6 py-3 text-sm font-semibold text-gray-300">Akcie</th>
                    </tr>
                  </thead>
                  <tbody>
                    {advertisements.map((ad) => (
                      <tr key={ad.id} className="border-b border-card hover:bg-dark/50 transition-colors">
                        <td className="px-6 py-4">
                          <div className="font-medium">{ad.title}</div>
                          <div className="text-sm text-gray-400 line-clamp-1">{ad.description}</div>
                        </td>
                        <td className="px-6 py-4">
                          <span className={`px-2 py-1 rounded text-xs font-medium ${
                            (ad as any).type === 'SERVICE' || !(ad as any).type
                              ? 'bg-blue-500/20 text-blue-400'
                              : 'bg-purple-500/20 text-purple-400'
                          }`}>
                            {(ad as any).type === 'SERVICE' || !(ad as any).type ? 'Služba' : 'Prenájom'}
                          </span>
                        </td>
                        <td className="px-6 py-4 text-gray-300">{(ad as any).category?.name || '-'}</td>
                        <td className="px-6 py-4 text-gray-300">
                          {ad.price ? `${ad.price.toFixed(2)} €` : '-'}
                        </td>
                        <td className="px-6 py-4">
                          <span className={`px-2 py-1 rounded text-xs font-medium ${getStatusColor(ad.status)}`}>
                            {getStatusLabel(ad.status)}
                          </span>
                        </td>
                        <td className="px-6 py-4 text-gray-300">{ad.location || '-'}</td>
                        <td className="px-6 py-4 text-gray-300">{ad.postalCode || '-'}</td>
                        <td className="px-6 py-4">
                          <div className="flex items-center justify-end space-x-2">
                            <button
                              onClick={() => handleEdit(ad)}
                              className="p-2 text-blue-400 hover:text-blue-300 hover:bg-cardHover rounded transition-colors"
                              title="Upraviť"
                            >
                              <Edit className="w-4 h-4" />
                            </button>
                            <button
                              onClick={() => handleDelete(ad.id)}
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
