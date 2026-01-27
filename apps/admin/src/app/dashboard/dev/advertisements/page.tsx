'use client'

import { useEffect, useState } from 'react'
import { useRouter } from 'next/navigation'
import { isAuthenticated } from '@/lib/auth'
import Sidebar from '@/components/Sidebar'
import Header from '@/components/Header'
import { api } from '@/lib/api'
import { Advertisement, AdvertisementStatus, CreateAdvertisementDto } from '@inzertna-platforma/shared'
import { Plus, Edit, Trash2, X, Save, Image as ImageIcon } from 'lucide-react'

export default function DevAdvertisementsPage() {
  const router = useRouter()
  const [advertisements, setAdvertisements] = useState<Advertisement[]>([])
  const [loading, setLoading] = useState(true)
  const [showForm, setShowForm] = useState(false)
  const [editingId, setEditingId] = useState<string | null>(null)
  const [categories, setCategories] = useState<string[]>([])
  const [newCategory, setNewCategory] = useState('')
  const [showNewCategory, setShowNewCategory] = useState(false)
  
  const [formData, setFormData] = useState<CreateAdvertisementDto & { status?: AdvertisementStatus }>({
    title: '',
    description: '',
    price: undefined,
    category: '',
    location: '',
    images: [],
    status: AdvertisementStatus.DRAFT,
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
      
      // Extrahuj unikátne kategórie z inzerátov
      const uniqueCategories = Array.from(
        new Set(data.map((ad: Advertisement) => ad.category).filter(Boolean))
      ) as string[]
      setCategories(uniqueCategories)
    } catch (error) {
      console.error('Chyba pri načítaní inzerátov:', error)
    } finally {
      setLoading(false)
    }
  }

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    try {
      const submitData = {
        ...formData,
        price: formData.price ? parseFloat(formData.price.toString()) : undefined,
        images: formData.images || [],
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

  const handleEdit = (ad: Advertisement) => {
    setFormData({
      title: ad.title,
      description: ad.description,
      price: ad.price,
      category: ad.category || '',
      location: ad.location || '',
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
      category: '',
      location: '',
      images: [],
      status: AdvertisementStatus.DRAFT,
    })
    setEditingId(null)
    setShowForm(false)
    setShowNewCategory(false)
    setNewCategory('')
  }

  const handleCategoryChange = (value: string) => {
    if (value === '__new__') {
      setShowNewCategory(true)
      setFormData({ ...formData, category: '' })
    } else {
      setShowNewCategory(false)
      setFormData({ ...formData, category: value })
    }
  }

  const addNewCategory = () => {
    if (newCategory.trim() && !categories.includes(newCategory.trim())) {
      setCategories([...categories, newCategory.trim()])
      setFormData({ ...formData, category: newCategory.trim() })
      setNewCategory('')
      setShowNewCategory(false)
    }
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
                    <label className="block text-sm font-medium text-gray-300 mb-2">Cena</label>
                    <input
                      type="number"
                      step="0.01"
                      value={formData.price || ''}
                      onChange={(e) => setFormData({ ...formData, price: e.target.value ? parseFloat(e.target.value) : undefined })}
                      className="w-full bg-dark border border-card rounded-lg px-4 py-2 text-white placeholder-gray-500 focus:outline-none focus:border-gray-600 hover:bg-cardHover"
                    />
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
                </div>

                <div>
                  <label className="block text-sm font-medium text-gray-300 mb-2">Kategória</label>
                  <div className="space-y-2">
                    <select
                      value={showNewCategory ? '__new__' : formData.category}
                      onChange={(e) => handleCategoryChange(e.target.value)}
                      className="w-full bg-dark border border-card rounded-lg px-4 py-2 text-white placeholder-gray-500 focus:outline-none focus:border-gray-600 hover:bg-cardHover"
                    >
                      <option value="">-- Vybrať kategóriu --</option>
                      {categories.map((cat) => (
                        <option key={cat} value={cat}>
                          {cat}
                        </option>
                      ))}
                      <option value="__new__">+ Vytvoriť novú kategóriu</option>
                    </select>
                    
                    {showNewCategory && (
                      <div className="flex space-x-2">
                        <input
                          type="text"
                          value={newCategory}
                          onChange={(e) => setNewCategory(e.target.value)}
                          placeholder="Názov novej kategórie"
                          className="flex-1 bg-card border border-dark rounded-lg px-4 py-2 text-white placeholder-gray-500 focus:outline-none focus:border-gray-600 hover:bg-cardHover"
                        />
                        <button
                          type="button"
                          onClick={addNewCategory}
                          className="bg-primary hover:opacity-90 text-white px-4 py-2 rounded-lg transition-colors"
                        >
                          Pridať
                        </button>
                      </div>
                    )}
                  </div>
                </div>

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
                      <th className="text-left px-6 py-3 text-sm font-semibold text-gray-300">Kategória</th>
                      <th className="text-left px-6 py-3 text-sm font-semibold text-gray-300">Cena</th>
                      <th className="text-left px-6 py-3 text-sm font-semibold text-gray-300">Status</th>
                      <th className="text-left px-6 py-3 text-sm font-semibold text-gray-300">Lokalita</th>
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
                        <td className="px-6 py-4 text-gray-300">{ad.category || '-'}</td>
                        <td className="px-6 py-4 text-gray-300">
                          {ad.price ? `${ad.price.toFixed(2)} €` : '-'}
                        </td>
                        <td className="px-6 py-4">
                          <span className={`px-2 py-1 rounded text-xs font-medium ${getStatusColor(ad.status)}`}>
                            {getStatusLabel(ad.status)}
                          </span>
                        </td>
                        <td className="px-6 py-4 text-gray-300">{ad.location || '-'}</td>
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
