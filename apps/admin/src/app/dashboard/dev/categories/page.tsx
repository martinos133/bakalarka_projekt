'use client'

import React, { useEffect, useState } from 'react'
import { useRouter } from 'next/navigation'
import { isAuthenticated } from '@/lib/auth'
import Sidebar from '@/components/Sidebar'
import Header from '@/components/Header'
import { api } from '@/lib/api'
import { Category } from '@inzertna-platforma/shared'
import { Plus, Edit, Trash2, X, Save, FolderTree, Image as ImageIcon, FolderPlus, ChevronDown, ChevronRight, GripVertical } from 'lucide-react'

export default function DevCategoriesPage() {
  const router = useRouter()
  const [categories, setCategories] = useState<Category[]>([])
  const [loading, setLoading] = useState(true)
  const [showForm, setShowForm] = useState(false)
  const [editingId, setEditingId] = useState<string | null>(null)
  const [expandedCategories, setExpandedCategories] = useState<Set<string>>(new Set())
  const [showSubcategoryForm, setShowSubcategoryForm] = useState<string | null>(null)
  const [draggedCategoryId, setDraggedCategoryId] = useState<string | null>(null)
  const [draggedOverCategoryId, setDraggedOverCategoryId] = useState<string | null>(null)
  const [formData, setFormData] = useState({
    name: '',
    description: '',
    icon: '',
    color: '',
    image: '',
    isActive: true,
    parentId: '',
  })

  useEffect(() => {
    if (!isAuthenticated()) {
      router.push('/login')
      return
    }
    loadCategories()
  }, [router])

  const loadCategories = async () => {
    try {
      setLoading(true)
      const data = await api.getCategories()
      setCategories(data)
    } catch (error) {
      console.error('Chyba pri načítaní kategórií:', error)
    } finally {
      setLoading(false)
    }
  }

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    
    if (!formData.name.trim()) {
      alert('Názov kategórie je povinný')
      return
    }

    try {
      if (editingId) {
        await api.updateCategory(editingId, formData)
      } else {
        await api.createCategory(formData)
      }

      await loadCategories()
      resetForm()
      // Ak bola vytvorená podkategória, expanduj nadradenú kategóriu
      if (formData.parentId) {
        setExpandedCategories(prev => new Set(prev).add(formData.parentId))
      }
    } catch (error: any) {
      console.error('Chyba pri ukladaní kategórie:', error)
      const errorMessage = error?.message || 'Chyba pri ukladaní kategórie'
      alert(errorMessage)
    }
  }

  const handleEdit = (category: Category) => {
    setFormData({
      name: category.name,
      description: category.description || '',
      icon: category.icon || '',
      color: category.color || '',
      image: category.image || '',
      isActive: category.isActive,
      parentId: (category as any).parentId || '',
    })
    setEditingId(category.id)
    setShowForm(true)
  }

  const handleAddSubcategory = (parentCategory: Category) => {
    setFormData({
      name: '',
      description: '',
      icon: '',
      color: '',
      image: '',
      isActive: true,
      parentId: parentCategory.id,
    })
    setEditingId(null)
    setShowSubcategoryForm(parentCategory.id)
    setExpandedCategories(prev => new Set(prev).add(parentCategory.id))
  }

  const toggleCategory = (categoryId: string) => {
    setExpandedCategories(prev => {
      const newSet = new Set(prev)
      if (newSet.has(categoryId)) {
        newSet.delete(categoryId)
        setShowSubcategoryForm(null)
      } else {
        newSet.add(categoryId)
      }
      return newSet
    })
  }

  const handleSubcategorySubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    
    if (!formData.name.trim()) {
      alert('Názov kategórie je povinný')
      return
    }

    try {
      await api.createCategory(formData)
      await loadCategories()
      const parentId = formData.parentId
      setFormData({
        name: '',
        description: '',
        icon: '',
        color: '',
        image: '',
        isActive: true,
        parentId: '',
      })
      setShowSubcategoryForm(null)
      // Expanduj nadradenú kategóriu, aby sa zobrazila nová podkategória
      if (parentId) {
        setExpandedCategories(prev => new Set(prev).add(parentId))
      }
    } catch (error: any) {
      console.error('Chyba pri ukladaní podkategórie:', error)
      const errorMessage = error?.message || 'Chyba pri ukladaní podkategórie'
      alert(errorMessage)
    }
  }

  const handleMoveCategory = async (categoryId: string, direction: 'up' | 'down', isSubcategory: boolean = false, parentId?: string) => {
    try {
      let sortedCategories: Category[]
      
      if (isSubcategory && parentId) {
        // Pre podkategórie - zoraď len podkategórie tejto hlavnej kategórie
        const parentCategory = categories.find(c => c.id === parentId)
        if (!parentCategory) return
        
        sortedCategories = [...((parentCategory as any).children || [])].sort((a, b) => 
          (a.order || 0) - (b.order || 0)
        )
      } else {
        // Pre hlavné kategórie - zoraď len hlavné kategórie
        sortedCategories = categories
          .filter(c => !c.parentId)
          .sort((a, b) => (a.order || 0) - (b.order || 0))
      }

      const currentIndex = sortedCategories.findIndex(c => c.id === categoryId)
      if (currentIndex === -1) return

      const newIndex = direction === 'up' ? currentIndex - 1 : currentIndex + 1
      if (newIndex < 0 || newIndex >= sortedCategories.length) return

      // Vymeň poradie
      const temp = sortedCategories[currentIndex]
      sortedCategories[currentIndex] = sortedCategories[newIndex]
      sortedCategories[newIndex] = temp

      // Aktualizuj order pre všetky kategórie
      const categoryIds = sortedCategories.map(c => c.id)
      await api.updateCategoryOrder(categoryIds, isSubcategory ? parentId : undefined)
      await loadCategories()
    } catch (error: any) {
      console.error('Chyba pri zmene poradia:', error)
      alert(error?.message || 'Chyba pri zmene poradia')
    }
  }

  const handleDragStart = (e: React.DragEvent, categoryId: string) => {
    setDraggedCategoryId(categoryId)
    e.dataTransfer.effectAllowed = 'move'
    e.dataTransfer.setData('text/html', categoryId)
  }

  const handleDragOver = (e: React.DragEvent, categoryId: string) => {
    e.preventDefault()
    e.dataTransfer.dropEffect = 'move'
    if (draggedCategoryId !== categoryId) {
      setDraggedOverCategoryId(categoryId)
    }
  }

  const handleDragLeave = () => {
    setDraggedOverCategoryId(null)
  }

  const handleDrop = async (e: React.DragEvent, targetCategoryId: string, isSubcategory: boolean = false, parentId?: string) => {
    e.preventDefault()
    setDraggedOverCategoryId(null)

    if (!draggedCategoryId || draggedCategoryId === targetCategoryId) {
      setDraggedCategoryId(null)
      return
    }

    try {
      let sortedCategories: Category[]
      
      if (isSubcategory && parentId) {
        const parentCategory = categories.find(c => c.id === parentId)
        if (!parentCategory) return
        
        sortedCategories = [...((parentCategory as any).children || [])].sort((a, b) => 
          (a.order || 0) - (b.order || 0)
        )
      } else {
        sortedCategories = categories
          .filter(c => !c.parentId)
          .sort((a, b) => (a.order || 0) - (b.order || 0))
      }

      const draggedIndex = sortedCategories.findIndex(c => c.id === draggedCategoryId)
      const targetIndex = sortedCategories.findIndex(c => c.id === targetCategoryId)

      if (draggedIndex === -1 || targetIndex === -1) return

      // Presuň kategóriu na novú pozíciu
      const [removed] = sortedCategories.splice(draggedIndex, 1)
      sortedCategories.splice(targetIndex, 0, removed)

      // Aktualizuj order pre všetky kategórie
      const categoryIds = sortedCategories.map(c => c.id)
      await api.updateCategoryOrder(categoryIds, isSubcategory ? parentId : undefined)
      await loadCategories()
    } catch (error: any) {
      console.error('Chyba pri presúvaní kategórie:', error)
      alert(error?.message || 'Chyba pri presúvaní kategórie')
    } finally {
      setDraggedCategoryId(null)
    }
  }

  const handleDelete = async (id: string) => {
    if (!confirm('Naozaj chcete odstrániť túto kategóriu?')) return
    
    try {
      await api.deleteCategory(id)
      await loadCategories()
    } catch (error) {
      console.error('Chyba pri odstraňovaní kategórie:', error)
      alert('Chyba pri odstraňovaní kategórie')
    }
  }

  const resetForm = () => {
    setFormData({
      name: '',
      description: '',
      icon: '',
      color: '',
      image: '',
      isActive: true,
      parentId: '',
    })
    setEditingId(null)
    setShowForm(false)
  }

  const compressImage = (file: File, maxWidth: number = 800, quality: number = 0.8): Promise<string> => {
    return new Promise((resolve, reject) => {
      const reader = new FileReader()
      reader.readAsDataURL(file)
      reader.onload = (event) => {
        const img = new Image()
        img.src = event.target?.result as string
        img.onload = () => {
          const canvas = document.createElement('canvas')
          let width = img.width
          let height = img.height

          // Zmenšenie obrázka ak je príliš veľký
          if (width > maxWidth) {
            height = (height * maxWidth) / width
            width = maxWidth
          }

          canvas.width = width
          canvas.height = height

          const ctx = canvas.getContext('2d')
          if (!ctx) {
            reject(new Error('Nepodarilo sa vytvoriť canvas context'))
            return
          }

          ctx.drawImage(img, 0, 0, width, height)
          const compressedDataUrl = canvas.toDataURL('image/jpeg', quality)
          resolve(compressedDataUrl)
        }
        img.onerror = reject
      }
      reader.onerror = reject
    })
  }

  const handleImageUpload = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0]
    if (!file) return

    if (!file.type.startsWith('image/')) {
      alert('Prosím vyberte obrázok')
      return
    }

    // Kontrola veľkosti súboru (max 5MB pred kompresiou)
    if (file.size > 5 * 1024 * 1024) {
      alert('Obrázok je príliš veľký. Maximálna veľkosť je 5MB.')
      return
    }

    try {
      const compressedImage = await compressImage(file)
      setFormData({ ...formData, image: compressedImage })
    } catch (error) {
      console.error('Chyba pri kompresii obrázka:', error)
      alert('Chyba pri spracovaní obrázka')
    }
  }

  const removeImage = () => {
    setFormData({ ...formData, image: '' })
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
                <span>Nová kategória</span>
              </button>
            )}
          </div>

          {showForm && (
            <div className="bg-card rounded-lg p-6 border border-dark mb-6" data-form="category-form">
              <div className="flex items-center justify-between mb-4">
                <h2 className="text-xl font-semibold">
                  {editingId ? 'Upraviť kategóriu' : 'Nová kategória'}
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
                      Názov kategórie *
                    </label>
                    <input
                      type="text"
                      required
                      value={formData.name}
                      onChange={(e) => setFormData({ ...formData, name: e.target.value })}
                      placeholder="Napríklad: Autá, Nehnuteľnosti, Elektronika..."
                      className="w-full bg-dark border border-card rounded-lg px-4 py-2 text-white placeholder-gray-500 focus:outline-none focus:border-gray-600 hover:bg-cardHover"
                    />
                  </div>

                  <div>
                    <label className="block text-sm font-medium text-gray-300 mb-2">
                      Nadradená kategória
                      {formData.parentId && (
                        <span className="ml-2 text-xs text-green-400">
                          (Vytvárate podkategóriu)
                        </span>
                      )}
                    </label>
                    <select
                      value={formData.parentId}
                      onChange={(e) => setFormData({ ...formData, parentId: e.target.value })}
                      className="w-full bg-dark border border-card rounded-lg px-4 py-2 text-white focus:outline-none focus:border-gray-600 hover:bg-cardHover"
                    >
                      <option value="">-- Hlavná kategória --</option>
                      {categories
                        .filter((cat) => !cat.parentId && cat.id !== editingId)
                        .map((cat) => (
                          <option key={cat.id} value={cat.id}>
                            {cat.name}
                          </option>
                        ))}
                    </select>
                    {formData.parentId && (
                      <p className="mt-1 text-xs text-gray-400">
                        Táto kategória bude podkategóriou: <span className="text-green-400">{categories.find(c => c.id === formData.parentId)?.name}</span>
                      </p>
                    )}
                  </div>
                </div>

                <div>
                  <label className="block text-sm font-medium text-gray-300 mb-2">
                    Popis
                  </label>
                  <textarea
                    value={formData.description}
                    onChange={(e) => setFormData({ ...formData, description: e.target.value })}
                    rows={3}
                    placeholder="Krátky popis kategórie..."
                    className="w-full bg-dark border border-card rounded-lg px-4 py-2 text-white placeholder-gray-500 focus:outline-none focus:border-gray-600 hover:bg-cardHover"
                  />
                </div>

                <div>
                  <label className="block text-sm font-medium text-gray-300 mb-2">
                    Obrázok kategórie
                  </label>
                  {formData.image ? (
                    <div className="relative inline-block">
                      <img
                        src={formData.image}
                        alt="Preview"
                        className="w-32 h-32 object-cover rounded-lg border border-card"
                      />
                      <button
                        type="button"
                        onClick={removeImage}
                        className="absolute top-1 right-1 bg-red-500 hover:bg-red-600 text-white rounded-full p-1"
                      >
                        <X className="w-4 h-4" />
                      </button>
                    </div>
                  ) : (
                    <div className="border-2 border-dashed border-card rounded-lg p-6 text-center hover:border-gray-600 transition-colors">
                      <input
                        type="file"
                        accept="image/*"
                        onChange={handleImageUpload}
                        className="hidden"
                        id="image-upload"
                      />
                      <label
                        htmlFor="image-upload"
                        className="cursor-pointer flex flex-col items-center"
                      >
                        <ImageIcon className="w-8 h-8 text-gray-400 mb-2" />
                        <span className="text-sm text-gray-400">
                          Kliknite pre nahranie obrázka
                        </span>
                        <span className="text-xs text-gray-500 mt-1">
                          JPG, PNG alebo GIF (max 5MB)
                        </span>
                      </label>
                    </div>
                  )}
                </div>

                <div className="grid grid-cols-2 gap-4">
                  <div>
                    <label className="block text-sm font-medium text-gray-300 mb-2">
                      Ikona (názov z lucide-react)
                    </label>
                    <input
                      type="text"
                      value={formData.icon}
                      onChange={(e) => setFormData({ ...formData, icon: e.target.value })}
                      placeholder="Napríklad: Car, Home, Smartphone..."
                      className="w-full bg-dark border border-card rounded-lg px-4 py-2 text-white placeholder-gray-500 focus:outline-none focus:border-gray-600 hover:bg-cardHover"
                    />
                  </div>

                  <div>
                    <label className="block text-sm font-medium text-gray-300 mb-2">
                      Farba (hex kód)
                    </label>
                    <input
                      type="text"
                      value={formData.color}
                      onChange={(e) => setFormData({ ...formData, color: e.target.value })}
                      placeholder="#3b82f6"
                      className="w-full bg-dark border border-card rounded-lg px-4 py-2 text-white placeholder-gray-500 focus:outline-none focus:border-gray-600 hover:bg-cardHover"
                    />
                  </div>
                </div>

                <div>
                  <label className="flex items-center space-x-2">
                    <input
                      type="checkbox"
                      checked={formData.isActive}
                      onChange={(e) => setFormData({ ...formData, isActive: e.target.checked })}
                      className="w-4 h-4 text-primary bg-dark border-card rounded focus:ring-primary"
                    />
                    <span className="text-sm text-gray-300">Aktívna kategória</span>
                  </label>
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
            ) : categories.length === 0 ? (
              <div className="p-6 text-center text-gray-400">
                <FolderTree className="w-12 h-12 mx-auto mb-4 text-gray-500" />
                <p>Žiadne kategórie</p>
                <p className="text-sm text-gray-500 mt-2">
                  Vytvorte prvú kategóriu kliknutím na tlačidlo "Nová kategória"
                </p>
              </div>
            ) : (
              <div className="p-6 space-y-3">
                {categories
                  .filter((cat) => !cat.parentId)
                  .sort((a, b) => (a.order || 0) - (b.order || 0))
                  .map((category) => {
                    const children = (category as any).children || []
                    const isExpanded = expandedCategories.has(category.id)
                    const showForm = showSubcategoryForm === category.id

                    return (
                      <div 
                        key={category.id} 
                        className={`bg-dark rounded-lg border overflow-hidden transition-all cursor-move ${
                          draggedCategoryId === category.id 
                            ? 'border-primary opacity-50 scale-95' 
                            : draggedOverCategoryId === category.id
                            ? 'border-green-500 border-2 scale-105'
                            : 'border-card'
                        }`}
                        draggable
                        onDragStart={(e) => handleDragStart(e, category.id)}
                        onDragOver={(e) => handleDragOver(e, category.id)}
                        onDragLeave={handleDragLeave}
                        onDrop={(e) => handleDrop(e, category.id)}
                      >
                        {/* Hlavná kategória */}
                        <div className="p-4 hover:bg-cardHover transition-colors">
                          <div className="flex items-center justify-between">
                            <div className="flex items-center space-x-3 flex-1">
                              <div className="cursor-move">
                                <GripVertical className="w-5 h-5 text-gray-500 hover:text-gray-300" />
                              </div>
                              <button
                                onClick={() => toggleCategory(category.id)}
                                className="p-1 hover:bg-card rounded transition-colors"
                                disabled={children.length === 0}
                              >
                                {children.length > 0 ? (
                                  isExpanded ? (
                                    <ChevronDown className="w-4 h-4 text-gray-400" />
                                  ) : (
                                    <ChevronRight className="w-4 h-4 text-gray-400" />
                                  )
                                ) : (
                                  <div className="w-4 h-4" />
                                )}
                              </button>
                              {category.image ? (
                                <img
                                  src={category.image}
                                  alt={category.name}
                                  className="w-10 h-10 object-cover rounded-lg"
                                />
                              ) : (
                                <div className="w-10 h-10 bg-card rounded-lg flex items-center justify-center">
                                  <FolderTree className="w-5 h-5 text-gray-400" />
                                </div>
                              )}
                              <div className="flex-1">
                                <div className="flex items-center space-x-2">
                                  <h3 className="font-semibold text-white">{category.name}</h3>
                                  <span className={`px-2 py-0.5 rounded text-xs font-medium ${
                                    category.isActive 
                                      ? 'bg-green-500/20 text-green-400' 
                                      : 'bg-gray-500/20 text-gray-400'
                                  }`}>
                                    {category.isActive ? 'Aktívna' : 'Neaktívna'}
                                  </span>
                                </div>
                                {category.description && (
                                  <p className="text-sm text-gray-400 mt-1">{category.description}</p>
                                )}
                                <div className="flex items-center space-x-4 mt-2 text-xs text-gray-500">
                                  <span>{category._count?.advertisements || 0} inzerátov</span>
                                  {children.length > 0 && (
                                    <span>{children.length} {children.length === 1 ? 'podkategória' : 'podkategórií'}</span>
                                  )}
                                </div>
                              </div>
                            </div>
                            <div className="flex items-center space-x-2">
                              <button
                                onClick={() => handleAddSubcategory(category)}
                                className="px-3 py-1.5 bg-green-500/20 hover:bg-green-500/30 text-green-400 rounded-lg text-sm flex items-center space-x-1 transition-colors"
                                title="Pridať podkategóriu"
                              >
                                <FolderPlus className="w-4 h-4" />
                                <span>Pridať podkategóriu</span>
                              </button>
                              <button
                                onClick={() => handleEdit(category)}
                                className="p-2 text-blue-400 hover:text-blue-300 hover:bg-cardHover rounded transition-colors"
                                title="Upraviť"
                              >
                                <Edit className="w-4 h-4" />
                              </button>
                              <button
                                onClick={() => handleDelete(category.id)}
                                className="p-2 text-red-400 hover:text-red-300 hover:bg-cardHover rounded transition-colors"
                                title="Odstrániť"
                              >
                                <Trash2 className="w-4 h-4" />
                              </button>
                            </div>
                          </div>
                        </div>

                        {/* Expandovaná sekcia s podkategóriami */}
                        {isExpanded && (
                          <div className="border-t border-card bg-dark/50">
                            {/* Formulár pre pridanie podkategórie */}
                            {showForm && (
                              <div className="p-4 bg-card/50 border-b border-card">
                                <form onSubmit={handleSubcategorySubmit} className="space-y-3">
                                  <div className="flex items-center space-x-2 mb-3">
                                    <FolderPlus className="w-4 h-4 text-green-400" />
                                    <h4 className="font-medium text-white">Nová podkategória pre "{category.name}"</h4>
                                  </div>
                                  <div className="grid grid-cols-2 gap-3">
                                    <input
                                      type="text"
                                      required
                                      value={formData.name}
                                      onChange={(e) => setFormData({ ...formData, name: e.target.value })}
                                      placeholder="Názov podkategórie *"
                                      className="bg-dark border border-card rounded-lg px-3 py-2 text-white placeholder-gray-500 text-sm focus:outline-none focus:border-gray-600"
                                    />
                                    <input
                                      type="text"
                                      value={formData.description}
                                      onChange={(e) => setFormData({ ...formData, description: e.target.value })}
                                      placeholder="Popis (voliteľné)"
                                      className="bg-dark border border-card rounded-lg px-3 py-2 text-white placeholder-gray-500 text-sm focus:outline-none focus:border-gray-600"
                                    />
                                  </div>
                                  <div className="flex items-center justify-end space-x-2">
                                    <button
                                      type="button"
                                      onClick={() => {
                                        setShowSubcategoryForm(null)
                                        setFormData({
                                          name: '',
                                          description: '',
                                          icon: '',
                                          color: '',
                                          image: '',
                                          isActive: true,
                                          parentId: '',
                                        })
                                      }}
                                      className="px-3 py-1.5 border border-card rounded-lg text-gray-300 hover:bg-cardHover text-sm transition-colors"
                                    >
                                      Zrušiť
                                    </button>
                                    <button
                                      type="submit"
                                      className="px-3 py-1.5 bg-primary hover:opacity-90 text-white rounded-lg text-sm flex items-center space-x-1 transition-colors"
                                    >
                                      <Save className="w-3 h-3" />
                                      <span>Vytvoriť</span>
                                    </button>
                                  </div>
                                </form>
                              </div>
                            )}

                            {/* Zoznam podkategórií */}
                            {children.length > 0 && (
                              <div className="p-4 space-y-2">
                                {[...children].sort((a: any, b: any) => (a.order || 0) - (b.order || 0)).map((child: Category) => (
                                  <div
                                    key={child.id}
                                    className={`flex items-center justify-between p-3 rounded-lg transition-all cursor-move ${
                                      draggedCategoryId === child.id 
                                        ? 'bg-primary/20 opacity-50 border-2 border-primary scale-95' 
                                        : draggedOverCategoryId === child.id
                                        ? 'bg-green-500/20 border-2 border-green-500 scale-105'
                                        : 'bg-card/30 hover:bg-card/50'
                                    }`}
                                    draggable
                                    onDragStart={(e) => handleDragStart(e, child.id)}
                                    onDragOver={(e) => handleDragOver(e, child.id)}
                                    onDragLeave={handleDragLeave}
                                    onDrop={(e) => handleDrop(e, child.id, true, category.id)}
                                  >
                                    <div className="flex items-center space-x-3 flex-1">
                                      <div className="cursor-move">
                                        <GripVertical className="w-4 h-4 text-gray-500 hover:text-gray-300" />
                                      </div>
                                      <div className="w-8 h-8 bg-dark rounded-lg flex items-center justify-center">
                                        <FolderTree className="w-4 h-4 text-gray-500" />
                                      </div>
                                      <div className="flex-1">
                                        <div className="flex items-center space-x-2">
                                          <span className="font-medium text-gray-200">{child.name}</span>
                                          <span className={`px-2 py-0.5 rounded text-xs font-medium ${
                                            child.isActive 
                                              ? 'bg-green-500/20 text-green-400' 
                                              : 'bg-gray-500/20 text-gray-400'
                                          }`}>
                                            {child.isActive ? 'Aktívna' : 'Neaktívna'}
                                          </span>
                                        </div>
                                        {child.description && (
                                          <p className="text-xs text-gray-400 mt-1">{child.description}</p>
                                        )}
                                        <span className="text-xs text-gray-500 mt-1">
                                          {child._count?.advertisements || 0} inzerátov
                                        </span>
                                      </div>
                                    </div>
                                    <div className="flex items-center space-x-2">
                                      <button
                                        onClick={() => handleEdit(child)}
                                        className="p-1.5 text-blue-400 hover:text-blue-300 hover:bg-cardHover rounded transition-colors"
                                        title="Upraviť"
                                      >
                                        <Edit className="w-4 h-4" />
                                      </button>
                                      <button
                                        onClick={() => handleDelete(child.id)}
                                        className="p-1.5 text-red-400 hover:text-red-300 hover:bg-cardHover rounded transition-colors"
                                        title="Odstrániť"
                                      >
                                        <Trash2 className="w-4 h-4" />
                                      </button>
                                    </div>
                                  </div>
                                ))}
                              </div>
                            )}

                            {/* Ak nie sú žiadne podkategórie a nie je otvorený formulár */}
                            {children.length === 0 && !showForm && (
                              <div className="p-4 text-center text-gray-500 text-sm">
                                Žiadne podkategórie. Kliknite na "Pridať podkategóriu" pre vytvorenie.
                              </div>
                            )}
                          </div>
                        )}
                      </div>
                    )
                  })}
              </div>
            )}
          </div>
        </main>
      </div>
    </div>
  )
}
