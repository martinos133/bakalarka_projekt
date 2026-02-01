'use client'

import { useState, useEffect } from 'react'
import { useRouter } from 'next/navigation'
import Header from '@/components/Header'
import Footer from '@/components/Footer'
import { api } from '@/lib/api'
import { isAuthenticated, getAuthUser, setAuthUser } from '@/lib/auth'
import { User, Building2, Eye, EyeOff, Plus, Edit, Trash2, Save, X, Lock, Mail, Phone, MapPin, Calendar, Briefcase, Image as ImageIcon, MessageSquare, Archive, CheckCircle } from 'lucide-react'
import Link from 'next/link'

export default function DashboardPage() {
  const router = useRouter()
  const [mounted, setMounted] = useState(false)
  const [activeTab, setActiveTab] = useState<'profile' | 'advertisements' | 'create' | 'messages'>('profile')
  const [user, setUser] = useState<any>(null)
  const [advertisements, setAdvertisements] = useState<any[]>([])
  const [messages, setMessages] = useState<any[]>([])
  const [unreadCount, setUnreadCount] = useState(0)
  const [selectedMessage, setSelectedMessage] = useState<any>(null)
  const [messageFilter, setMessageFilter] = useState<'all' | 'unread' | 'inquiry' | 'system'>('all')
  const [loading, setLoading] = useState(true)
  const [editing, setEditing] = useState(false)
  const [saving, setSaving] = useState(false)
  const [changingPassword, setChangingPassword] = useState(false)
  const [showPassword, setShowPassword] = useState({ old: false, new: false, confirm: false })
  
  const [profileData, setProfileData] = useState<any>({})
  const [passwordData, setPasswordData] = useState({
    oldPassword: '',
    newPassword: '',
    confirmPassword: '',
  })
  const [adFormData, setAdFormData] = useState({
    title: '',
    description: '',
    price: '',
    categoryId: '',
    location: '',
    postalCode: '',
    type: 'SERVICE',
    images: [] as string[],
    pricingType: 'FIXED',
    hourlyRate: '',
    dailyRate: '',
    packages: [] as any[],
    deliveryTime: '',
    revisions: '',
    features: [] as string[],
    faq: [] as any[],
  })
  const [newFeature, setNewFeature] = useState('')
  const [newPackage, setNewPackage] = useState<any>({
    name: '',
    description: '',
    price: '',
    deliveryTime: '',
    features: [],
  })
  const [newPackageFeature, setNewPackageFeature] = useState('')
  const [newFAQ, setNewFAQ] = useState<any>({
    question: '',
    answer: '',
  })
  const [categories, setCategories] = useState<any[]>([])
  const [error, setError] = useState('')
  const [success, setSuccess] = useState('')

  useEffect(() => {
    setMounted(true)
    if (!isAuthenticated()) {
      router.push('/signin')
      return
    }
    loadData()
  }, [router])

  const loadData = async () => {
    try {
      setLoading(true)
      const [userData, adsData, catsData, messagesData, unreadData] = await Promise.all([
        api.getMyProfile(),
        api.getMyAdvertisements(),
        api.getCategories(),
        api.getMessages(),
        api.getUnreadCount(),
      ])
      setUser(userData)
      setProfileData(userData)
      setAuthUser(userData)
      setAdvertisements(adsData)
      setCategories(catsData)
      setMessages(messagesData)
      setUnreadCount(unreadData.count || 0)
    } catch (err: any) {
      setError(err.message || 'Chyba pri načítaní dát')
    } finally {
      setLoading(false)
    }
  }

  const loadMessages = async () => {
    try {
      const status = messageFilter === 'unread' ? 'UNREAD' : undefined
      const type = messageFilter === 'inquiry' ? 'INQUIRY' : messageFilter === 'system' ? 'SYSTEM' : undefined
      const messagesData = await api.getMessages(status, type)
      setMessages(messagesData)
      const unreadData = await api.getUnreadCount()
      setUnreadCount(unreadData.count || 0)
    } catch (err: any) {
      setError(err.message || 'Chyba pri načítaní správ')
    }
  }

  useEffect(() => {
    if (activeTab === 'messages') {
      loadMessages()
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [activeTab, messageFilter])

  const handleMessageClick = async (message: any) => {
    try {
      const fullMessage = await api.getMessage(message.id)
      setSelectedMessage(fullMessage)
      if (fullMessage.status === 'UNREAD') {
        await api.markAsRead(message.id)
        loadMessages()
      }
    } catch (err: any) {
      setError(err.message || 'Chyba pri načítaní správy')
    }
  }

  const handleMarkAsArchived = async (id: string) => {
    try {
      await api.markAsArchived(id)
      loadMessages()
      if (selectedMessage?.id === id) {
        setSelectedMessage(null)
      }
    } catch (err: any) {
      setError(err.message || 'Chyba pri archivovaní správy')
    }
  }

  const getMessageTypeLabel = (type: string) => {
    const labels: { [key: string]: string } = {
      INQUIRY: 'Dotaz na inzerát',
      SYSTEM: 'Systémová správa',
      BAN_NOTIFICATION: 'Notifikácia o banu',
      VIOLATION: 'Porušenie pravidiel',
      AD_APPROVED: 'Inzerát schválený',
      AD_REJECTED: 'Inzerát zamietnutý',
    }
    return labels[type] || type
  }

  const getMessageTypeColor = (type: string) => {
    const colors: { [key: string]: string } = {
      INQUIRY: 'bg-blue-100 text-blue-800',
      SYSTEM: 'bg-gray-100 text-gray-800',
      BAN_NOTIFICATION: 'bg-red-100 text-red-800',
      VIOLATION: 'bg-orange-100 text-orange-800',
      AD_APPROVED: 'bg-green-100 text-green-800',
      AD_REJECTED: 'bg-red-100 text-red-800',
    }
    return colors[type] || 'bg-gray-100 text-gray-800'
  }

  const handleSaveProfile = async () => {
    try {
      setSaving(true)
      setError('')
      const updated = await api.updateMyProfile(profileData)
      setUser(updated)
      setProfileData(updated)
      setAuthUser(updated)
      setEditing(false)
      setSuccess('Profil bol úspešne aktualizovaný')
      setTimeout(() => setSuccess(''), 3000)
    } catch (err: any) {
      setError(err.message || 'Chyba pri ukladaní profilu')
    } finally {
      setSaving(false)
    }
  }

  const handleChangePassword = async () => {
    if (passwordData.newPassword !== passwordData.confirmPassword) {
      setError('Nové heslá sa nezhodujú')
      return
    }
    if (passwordData.newPassword.length < 8) {
      setError('Nové heslo musí mať aspoň 8 znakov')
      return
    }

    try {
      setSaving(true)
      setError('')
      await api.changePassword(passwordData.oldPassword, passwordData.newPassword)
      setPasswordData({ oldPassword: '', newPassword: '', confirmPassword: '' })
      setChangingPassword(false)
      setSuccess('Heslo bolo úspešne zmenené')
      setTimeout(() => setSuccess(''), 3000)
    } catch (err: any) {
      setError(err.message || 'Chyba pri zmene hesla')
    } finally {
      setSaving(false)
    }
  }

  const handleImageUpload = (e: React.ChangeEvent<HTMLInputElement>) => {
    const files = e.target.files
    if (!files) return

    Array.from(files).forEach((file) => {
      const reader = new FileReader()
      reader.onloadend = () => {
        setAdFormData(prev => ({
          ...prev,
          images: [...prev.images, reader.result as string]
        }))
      }
      reader.readAsDataURL(file)
    })
  }

  const removeImage = (index: number) => {
    setAdFormData(prev => ({
      ...prev,
      images: prev.images.filter((_, i) => i !== index)
    }))
  }

  const handleCreateAdvertisement = async () => {
    if (!adFormData.title || !adFormData.description) {
      setError('Vyplňte všetky povinné polia')
      return
    }

    try {
      setSaving(true)
      setError('')
      const payload: any = {
        title: adFormData.title,
        description: adFormData.description,
        type: adFormData.type,
        price: adFormData.price ? parseFloat(adFormData.price) : undefined,
        categoryId: adFormData.categoryId || undefined,
        location: adFormData.location || undefined,
        postalCode: adFormData.postalCode || undefined,
        images: adFormData.images || [],
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
          payload.packages = adFormData.packages.map(pkg => ({
            ...pkg,
            price: parseFloat(pkg.price),
          }))
        }
        if (adFormData.deliveryTime) payload.deliveryTime = adFormData.deliveryTime
        if (adFormData.revisions) payload.revisions = adFormData.revisions
        if (adFormData.features.length > 0) payload.features = adFormData.features
        if (adFormData.faq.length > 0) payload.faq = adFormData.faq
      }

      const newAd = await api.createAdvertisement(payload)
      setAdvertisements([newAd, ...advertisements])
      setAdFormData({
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
      setNewFeature('')
      setNewPackage({ name: '', description: '', price: '', deliveryTime: '', features: [] })
      setNewPackageFeature('')
      setNewFAQ({ question: '', answer: '' })
      setActiveTab('advertisements')
      setSuccess('Inzerát bol úspešne vytvorený a čaká na schválenie')
      setTimeout(() => setSuccess(''), 3000)
    } catch (err: any) {
      setError(err.message || 'Chyba pri vytváraní inzerátu')
    } finally {
      setSaving(false)
    }
  }

  const handleDeleteAdvertisement = async (id: string) => {
    if (!confirm('Naozaj chcete odstrániť tento inzerát?')) return

    try {
      await api.deleteAdvertisement(id)
      setAdvertisements(advertisements.filter(ad => ad.id !== id))
      setSuccess('Inzerát bol úspešne odstránený')
      setTimeout(() => setSuccess(''), 3000)
    } catch (err: any) {
      setError(err.message || 'Chyba pri odstraňovaní inzerátu')
    }
  }

  if (!mounted || loading) {
    return (
      <div className="min-h-screen bg-white">
        <Header />
        <div className="flex items-center justify-center min-h-[60vh]">
          <div className="text-gray-500">Načítavam...</div>
        </div>
        <Footer />
      </div>
    )
  }

  return (
    <div className="min-h-screen bg-gray-50">
      <Header />
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        <div className="mb-8">
          <h1 className="text-3xl font-bold text-gray-900">Môj profil</h1>
          <p className="text-gray-600 mt-2">Spravujte svoj profil a inzeráty</p>
        </div>

        {error && (
          <div className="mb-6 bg-red-50 border border-red-200 text-red-700 px-4 py-3 rounded-lg">
            {error}
          </div>
        )}

        {success && (
          <div className="mb-6 bg-green-50 border border-green-200 text-green-700 px-4 py-3 rounded-lg">
            {success}
          </div>
        )}

        {/* Tabs */}
        <div className="border-b border-gray-200 mb-6">
          <nav className="flex space-x-8">
            <button
              onClick={() => setActiveTab('profile')}
              className={`py-4 px-1 border-b-2 font-medium text-sm ${
                activeTab === 'profile'
                  ? 'border-[#1dbf73] text-[#1dbf73]'
                  : 'border-transparent text-gray-500 hover:text-gray-700 hover:border-gray-300'
              }`}
            >
              Profil
            </button>
            <button
              onClick={() => setActiveTab('advertisements')}
              className={`py-4 px-1 border-b-2 font-medium text-sm ${
                activeTab === 'advertisements'
                  ? 'border-[#1dbf73] text-[#1dbf73]'
                  : 'border-transparent text-gray-500 hover:text-gray-700 hover:border-gray-300'
              }`}
            >
              Moje inzeráty ({advertisements.length})
            </button>
            <button
              onClick={() => setActiveTab('create')}
              className={`py-4 px-1 border-b-2 font-medium text-sm ${
                activeTab === 'create'
                  ? 'border-[#1dbf73] text-[#1dbf73]'
                  : 'border-transparent text-gray-500 hover:text-gray-700 hover:border-gray-300'
              }`}
            >
              Vytvoriť inzerát
            </button>
            <button
              onClick={() => setActiveTab('messages')}
              className={`py-4 px-1 border-b-2 font-medium text-sm relative ${
                activeTab === 'messages'
                  ? 'border-[#1dbf73] text-[#1dbf73]'
                  : 'border-transparent text-gray-500 hover:text-gray-700 hover:border-gray-300'
              }`}
            >
              Správy
              {unreadCount > 0 && (
                <span className="ml-2 inline-flex items-center justify-center px-2 py-1 text-xs font-bold leading-none text-white bg-red-500 rounded-full">
                  {unreadCount}
                </span>
              )}
            </button>
          </nav>
        </div>

        {/* Profile Tab */}
        {activeTab === 'profile' && (
          <div className="bg-white rounded-lg shadow-sm border border-gray-200 p-6">
            <div className="flex items-center justify-between mb-6">
              <h2 className="text-xl font-semibold text-gray-900">Kontaktné údaje</h2>
              {!editing ? (
                <button
                  onClick={() => setEditing(true)}
                  className="flex items-center gap-2 px-4 py-2 bg-[#1dbf73] text-white rounded-lg hover:bg-[#19a463] transition-colors"
                >
                  <Edit className="w-4 h-4" />
                  Upraviť
                </button>
              ) : (
                <div className="flex gap-2">
                  <button
                    onClick={() => {
                      setEditing(false)
                      setProfileData(user)
                    }}
                    className="px-4 py-2 border border-gray-300 text-gray-700 rounded-lg hover:bg-gray-50 transition-colors"
                  >
                    Zrušiť
                  </button>
                  <button
                    onClick={handleSaveProfile}
                    disabled={saving}
                    className="flex items-center gap-2 px-4 py-2 bg-[#1dbf73] text-white rounded-lg hover:bg-[#19a463] transition-colors disabled:opacity-50"
                  >
                    <Save className="w-4 h-4" />
                    {saving ? 'Ukladám...' : 'Uložiť'}
                  </button>
                </div>
              )}
            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  <Mail className="w-4 h-4 inline mr-2" />
                  Email
                </label>
                <input
                  type="email"
                  value={profileData.email || ''}
                  disabled
                  className="w-full px-4 py-2 border border-gray-300 rounded-lg bg-gray-50 text-gray-600"
                />
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  <Phone className="w-4 h-4 inline mr-2" />
                  Telefónne číslo *
                </label>
                <input
                  type="tel"
                  value={profileData.phone || ''}
                  onChange={(e) => setProfileData({ ...profileData, phone: e.target.value })}
                  disabled={!editing}
                  className="w-full px-4 py-2 border border-gray-300 rounded-lg text-gray-900 disabled:bg-gray-50 disabled:text-gray-600"
                />
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  Meno *
                </label>
                <input
                  type="text"
                  value={profileData.firstName || ''}
                  onChange={(e) => setProfileData({ ...profileData, firstName: e.target.value })}
                  disabled={!editing}
                  className="w-full px-4 py-2 border border-gray-300 rounded-lg text-gray-900 disabled:bg-gray-50 disabled:text-gray-600"
                />
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  Priezvisko *
                </label>
                <input
                  type="text"
                  value={profileData.lastName || ''}
                  onChange={(e) => setProfileData({ ...profileData, lastName: e.target.value })}
                  disabled={!editing}
                  className="w-full px-4 py-2 border border-gray-300 rounded-lg text-gray-900 disabled:bg-gray-50 disabled:text-gray-600"
                />
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  Pohlavie
                </label>
                <select
                  value={profileData.gender || ''}
                  onChange={(e) => setProfileData({ ...profileData, gender: e.target.value || undefined })}
                  disabled={!editing}
                  className="w-full px-4 py-2 border border-gray-300 rounded-lg text-gray-900 disabled:bg-gray-50 disabled:text-gray-600"
                >
                  <option value="">-- Vybrať --</option>
                  <option value="MALE">Muž</option>
                  <option value="FEMALE">Žena</option>
                  <option value="OTHER">Iné</option>
                </select>
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  Typ účtu
                </label>
                <div className="flex gap-4">
                  <label className="flex items-center gap-2 cursor-pointer">
                    <input
                      type="radio"
                      name="isCompany"
                      checked={profileData.isCompany === false}
                      onChange={() => setProfileData({ ...profileData, isCompany: false })}
                      disabled={!editing}
                      className="rounded border-gray-300"
                    />
                    <span className="text-gray-700">Fyzická osoba</span>
                  </label>
                  <label className="flex items-center gap-2 cursor-pointer">
                    <input
                      type="radio"
                      name="isCompany"
                      checked={profileData.isCompany === true}
                      onChange={() => setProfileData({ ...profileData, isCompany: true })}
                      disabled={!editing}
                      className="rounded border-gray-300"
                    />
                    <span className="text-gray-700">Firma</span>
                  </label>
                </div>
              </div>

              {profileData.isCompany && (
                <>
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-2">
                      <Building2 className="w-4 h-4 inline mr-2" />
                      Názov firmy *
                    </label>
                    <input
                      type="text"
                      value={profileData.companyName || ''}
                      onChange={(e) => setProfileData({ ...profileData, companyName: e.target.value })}
                      disabled={!editing}
                      className="w-full px-4 py-2 border border-gray-300 rounded-lg text-gray-900 disabled:bg-gray-50 disabled:text-gray-600"
                    />
                  </div>

                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-2">
                      <Briefcase className="w-4 h-4 inline mr-2" />
                      IČO *
                    </label>
                    <input
                      type="text"
                      value={profileData.companyId || ''}
                      onChange={(e) => setProfileData({ ...profileData, companyId: e.target.value })}
                      disabled={!editing}
                      className="w-full px-4 py-2 border border-gray-300 rounded-lg text-gray-900 disabled:bg-gray-50 disabled:text-gray-600"
                    />
                  </div>
                </>
              )}

              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  <MapPin className="w-4 h-4 inline mr-2" />
                  Adresa
                </label>
                <input
                  type="text"
                  value={profileData.address || ''}
                  onChange={(e) => setProfileData({ ...profileData, address: e.target.value })}
                  disabled={!editing}
                  className="w-full px-4 py-2 border border-gray-300 rounded-lg text-gray-900 disabled:bg-gray-50 disabled:text-gray-600"
                />
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  Mesto
                </label>
                <input
                  type="text"
                  value={profileData.city || ''}
                  onChange={(e) => setProfileData({ ...profileData, city: e.target.value })}
                  disabled={!editing}
                  className="w-full px-4 py-2 border border-gray-300 rounded-lg text-gray-900 disabled:bg-gray-50 disabled:text-gray-600"
                />
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  PSČ
                </label>
                <input
                  type="text"
                  value={profileData.postalCode || ''}
                  onChange={(e) => setProfileData({ ...profileData, postalCode: e.target.value })}
                  disabled={!editing}
                  className="w-full px-4 py-2 border border-gray-300 rounded-lg text-gray-900 disabled:bg-gray-50 disabled:text-gray-600"
                />
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  Krajina
                </label>
                <select
                  value={profileData.country || 'Slovensko'}
                  onChange={(e) => setProfileData({ ...profileData, country: e.target.value })}
                  disabled={!editing}
                  className="w-full px-4 py-2 border border-gray-300 rounded-lg text-gray-900 disabled:bg-gray-50 disabled:text-gray-600"
                >
                  <option value="Slovensko">Slovensko</option>
                  <option value="Česko">Česko</option>
                  <option value="Poľsko">Poľsko</option>
                  <option value="Maďarsko">Maďarsko</option>
                  <option value="Rakúsko">Rakúsko</option>
                  <option value="Nemecko">Nemecko</option>
                </select>
              </div>
            </div>

            {/* Change Password Section */}
            <div className="mt-8 pt-8 border-t border-gray-200">
              <div className="flex items-center justify-between mb-4">
                <h3 className="text-lg font-semibold text-gray-900 flex items-center gap-2">
                  <Lock className="w-5 h-5" />
                  Zmena hesla
                </h3>
                {!changingPassword && (
                  <button
                    onClick={() => setChangingPassword(true)}
                    className="text-[#1dbf73] hover:text-[#19a463] font-medium"
                  >
                    Zmeniť heslo
                  </button>
                )}
              </div>

              {changingPassword && (
                <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-2">
                      Pôvodné heslo
                    </label>
                    <div className="relative">
                      <input
                        type={showPassword.old ? 'text' : 'password'}
                        value={passwordData.oldPassword}
                        onChange={(e) => setPasswordData({ ...passwordData, oldPassword: e.target.value })}
                        className="w-full px-4 py-2 pr-10 border border-gray-300 rounded-lg text-gray-900"
                      />
                      <button
                        type="button"
                        onClick={() => setShowPassword({ ...showPassword, old: !showPassword.old })}
                        className="absolute right-3 top-1/2 -translate-y-1/2 text-gray-500"
                      >
                        {showPassword.old ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
                      </button>
                    </div>
                  </div>

                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-2">
                      Nové heslo
                    </label>
                    <div className="relative">
                      <input
                        type={showPassword.new ? 'text' : 'password'}
                        value={passwordData.newPassword}
                        onChange={(e) => setPasswordData({ ...passwordData, newPassword: e.target.value })}
                        className="w-full px-4 py-2 pr-10 border border-gray-300 rounded-lg text-gray-900"
                      />
                      <button
                        type="button"
                        onClick={() => setShowPassword({ ...showPassword, new: !showPassword.new })}
                        className="absolute right-3 top-1/2 -translate-y-1/2 text-gray-500"
                      >
                        {showPassword.new ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
                      </button>
                    </div>
                  </div>

                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-2">
                      Potvrďte nové heslo
                    </label>
                    <div className="relative">
                      <input
                        type={showPassword.confirm ? 'text' : 'password'}
                        value={passwordData.confirmPassword}
                        onChange={(e) => setPasswordData({ ...passwordData, confirmPassword: e.target.value })}
                        className="w-full px-4 py-2 pr-10 border border-gray-300 rounded-lg text-gray-900"
                      />
                      <button
                        type="button"
                        onClick={() => setShowPassword({ ...showPassword, confirm: !showPassword.confirm })}
                        className="absolute right-3 top-1/2 -translate-y-1/2 text-gray-500"
                      >
                        {showPassword.confirm ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
                      </button>
                    </div>
                  </div>

                  <div className="md:col-span-3 flex gap-2">
                    <button
                      onClick={() => {
                        setChangingPassword(false)
                        setPasswordData({ oldPassword: '', newPassword: '', confirmPassword: '' })
                      }}
                      className="px-4 py-2 border border-gray-300 text-gray-700 rounded-lg hover:bg-gray-50"
                    >
                      Zrušiť
                    </button>
                    <button
                      onClick={handleChangePassword}
                      disabled={saving}
                      className="px-4 py-2 bg-[#1dbf73] text-white rounded-lg hover:bg-[#19a463] disabled:opacity-50"
                    >
                      {saving ? 'Ukladám...' : 'Zmeniť heslo'}
                    </button>
                  </div>
                </div>
              )}
            </div>
          </div>
        )}

        {/* Advertisements Tab */}
        {activeTab === 'advertisements' && (
          <div className="bg-white rounded-lg shadow-sm border border-gray-200">
            <div className="p-6 border-b border-gray-200">
              <h2 className="text-xl font-semibold text-gray-900">Moje inzeráty</h2>
            </div>
            <div className="divide-y divide-gray-200">
              {advertisements.length === 0 ? (
                <div className="p-12 text-center">
                  <p className="text-gray-500 mb-4">Zatiaľ ste nevytvorili žiadne inzeráty</p>
                  <button
                    onClick={() => setActiveTab('create')}
                    className="px-4 py-2 bg-[#1dbf73] text-white rounded-lg hover:bg-[#19a463]"
                  >
                    Vytvoriť prvý inzerát
                  </button>
                </div>
              ) : (
                advertisements.map((ad) => (
                  <div key={ad.id} className="p-6 hover:bg-gray-50 transition-colors">
                    <div className="flex items-start justify-between">
                      <div className="flex-1">
                        <div className="flex items-center gap-3 mb-2">
                          <h3 className="text-lg font-semibold text-gray-900">{ad.title}</h3>
                          <span className={`px-2 py-1 text-xs rounded-full ${
                            ad.status === 'ACTIVE' ? 'bg-green-100 text-green-800' :
                            ad.status === 'PENDING' ? 'bg-yellow-100 text-yellow-800' :
                            ad.status === 'DRAFT' ? 'bg-gray-100 text-gray-800' :
                            'bg-red-100 text-red-800'
                          }`}>
                            {ad.status === 'ACTIVE' ? 'Aktívny' :
                             ad.status === 'PENDING' ? 'Čaká na schválenie' :
                             ad.status === 'DRAFT' ? 'Koncept' :
                             'Neaktívny'}
                          </span>
                        </div>
                        <p className="text-gray-600 mb-2 line-clamp-2">{ad.description}</p>
                        <div className="flex items-center gap-4 text-sm text-gray-500">
                          {ad.price && <span>Cena: {ad.price}€</span>}
                          {ad.location && <span>Lokalita: {ad.location}</span>}
                          {ad.category && <span>Kategória: {ad.category.name}</span>}
                        </div>
                      </div>
                      <div className="flex items-center gap-2 ml-4">
                        <Link
                          href={`/inzerat/${ad.id}`}
                          className="p-2 text-blue-600 hover:bg-blue-50 rounded-lg transition-colors"
                          title="Zobraziť"
                        >
                          <Eye className="w-4 h-4" />
                        </Link>
                        <button
                          onClick={() => handleDeleteAdvertisement(ad.id)}
                          className="p-2 text-red-600 hover:bg-red-50 rounded-lg transition-colors"
                          title="Odstrániť"
                        >
                          <Trash2 className="w-4 h-4" />
                        </button>
                      </div>
                    </div>
                  </div>
                ))
              )}
            </div>
          </div>
        )}

        {/* Create Advertisement Tab */}
        {activeTab === 'create' && (
          <div className="bg-white rounded-lg shadow-sm border border-gray-200 p-6">
            <h2 className="text-xl font-semibold text-gray-900 mb-6">Vytvoriť nový inzerát</h2>

            <div className="space-y-6">
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  Názov inzerátu *
                </label>
                <input
                  type="text"
                  value={adFormData.title}
                  onChange={(e) => setAdFormData({ ...adFormData, title: e.target.value })}
                  className="w-full px-4 py-2 border border-gray-300 rounded-lg text-gray-900"
                  placeholder="Napríklad: Profesionálny web dizajn"
                />
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  Popis *
                </label>
                <textarea
                  value={adFormData.description}
                  onChange={(e) => setAdFormData({ ...adFormData, description: e.target.value })}
                  rows={6}
                  className="w-full px-4 py-2 border border-gray-300 rounded-lg text-gray-900"
                  placeholder="Podrobný popis služby alebo produktu..."
                />
              </div>

              <div className="grid grid-cols-2 gap-4">
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">
                    Typ *
                  </label>
                  <select
                    value={adFormData.type}
                    onChange={(e) => setAdFormData({ ...adFormData, type: e.target.value })}
                    className="w-full px-4 py-2 border border-gray-300 rounded-lg text-gray-900"
                  >
                    <option value="SERVICE">Služba</option>
                    <option value="RENTAL">Prenájom</option>
                  </select>
                </div>

                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">
                    Kategória
                  </label>
                  <select
                    value={adFormData.categoryId}
                    onChange={(e) => setAdFormData({ ...adFormData, categoryId: e.target.value })}
                    className="w-full px-4 py-2 border border-gray-300 rounded-lg text-gray-900"
                  >
                    <option value="">-- Vybrať kategóriu --</option>
                    {categories.map((cat) => (
                      <option key={cat.id} value={cat.id}>{cat.name}</option>
                    ))}
                  </select>
                </div>
              </div>

              <div className="grid grid-cols-2 gap-4">
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">
                    Lokalita
                  </label>
                  <input
                    type="text"
                    value={adFormData.location}
                    onChange={(e) => setAdFormData({ ...adFormData, location: e.target.value })}
                    className="w-full px-4 py-2 border border-gray-300 rounded-lg text-gray-900"
                    placeholder="Napríklad: Bratislava"
                  />
                </div>

                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">
                    PSČ
                  </label>
                  <input
                    type="text"
                    value={adFormData.postalCode}
                    onChange={(e) => setAdFormData({ ...adFormData, postalCode: e.target.value })}
                    className="w-full px-4 py-2 border border-gray-300 rounded-lg text-gray-900"
                    placeholder="Napríklad: 811 01"
                  />
                </div>
              </div>

              {/* Service-specific fields */}
              {adFormData.type === 'SERVICE' && (
                <>
                  <div className="border-t border-gray-200 pt-6 mt-6">
                    <h3 className="text-lg font-semibold text-gray-900 mb-4">Detaily služby</h3>
                    
                    <div className="grid grid-cols-2 gap-4 mb-4">
                      <div>
                        <label className="block text-sm font-medium text-gray-700 mb-2">Typ sadzby *</label>
                        <select
                          required
                          value={adFormData.pricingType}
                          onChange={(e) => setAdFormData({ ...adFormData, pricingType: e.target.value })}
                          className="w-full px-4 py-2 border border-gray-300 rounded-lg text-gray-900 focus:outline-none focus:ring-2 focus:ring-[#1dbf73] focus:border-transparent"
                        >
                          <option value="FIXED">Fixná cena</option>
                          <option value="HOURLY">Hodinová sadzba</option>
                          <option value="DAILY">Denná sadzba</option>
                          <option value="PACKAGE">Balíčky</option>
                        </select>
                      </div>

                      {adFormData.pricingType === 'FIXED' && (
                        <div>
                          <label className="block text-sm font-medium text-gray-700 mb-2">Fixná cena (€) *</label>
                          <input
                            type="number"
                            step="0.01"
                            required
                            value={adFormData.price}
                            onChange={(e) => setAdFormData({ ...adFormData, price: e.target.value })}
                            className="w-full px-4 py-2 border border-gray-300 rounded-lg text-gray-900 placeholder-gray-500 focus:outline-none focus:ring-2 focus:ring-[#1dbf73] focus:border-transparent"
                            placeholder="0.00"
                          />
                        </div>
                      )}

                      {adFormData.pricingType === 'HOURLY' && (
                        <div>
                          <label className="block text-sm font-medium text-gray-700 mb-2">Hodinová sadzba (€/h) *</label>
                          <input
                            type="number"
                            step="0.01"
                            required
                            value={adFormData.hourlyRate}
                            onChange={(e) => setAdFormData({ ...adFormData, hourlyRate: e.target.value })}
                            className="w-full px-4 py-2 border border-gray-300 rounded-lg text-gray-900 placeholder-gray-500 focus:outline-none focus:ring-2 focus:ring-[#1dbf73] focus:border-transparent"
                          />
                        </div>
                      )}

                      {adFormData.pricingType === 'DAILY' && (
                        <div>
                          <label className="block text-sm font-medium text-gray-700 mb-2">Denná sadzba (€/deň) *</label>
                          <input
                            type="number"
                            step="0.01"
                            required
                            value={adFormData.dailyRate}
                            onChange={(e) => setAdFormData({ ...adFormData, dailyRate: e.target.value })}
                            className="w-full px-4 py-2 border border-gray-300 rounded-lg text-gray-900 placeholder-gray-500 focus:outline-none focus:ring-2 focus:ring-[#1dbf73] focus:border-transparent"
                          />
                        </div>
                      )}
                    </div>

                    <div className="grid grid-cols-2 gap-4 mb-4">
                      <div>
                        <label className="block text-sm font-medium text-gray-700 mb-2">Čas dodania</label>
                        <input
                          type="text"
                          value={adFormData.deliveryTime || ''}
                          onChange={(e) => setAdFormData({ ...adFormData, deliveryTime: e.target.value })}
                          placeholder="Napríklad: 3-5 dní, 1 týždeň..."
                          className="w-full px-4 py-2 border border-gray-300 rounded-lg text-gray-900 placeholder-gray-500 focus:outline-none focus:ring-2 focus:ring-[#1dbf73] focus:border-transparent"
                        />
                      </div>

                      <div>
                        <label className="block text-sm font-medium text-gray-700 mb-2">Revízie</label>
                        <input
                          type="text"
                          value={adFormData.revisions || ''}
                          onChange={(e) => setAdFormData({ ...adFormData, revisions: e.target.value })}
                          placeholder="Napríklad: Neobmedzené, 3 revízie..."
                          className="w-full px-4 py-2 border border-gray-300 rounded-lg text-gray-900 placeholder-gray-500 focus:outline-none focus:ring-2 focus:ring-[#1dbf73] focus:border-transparent"
                        />
                      </div>
                    </div>

                    {/* Features */}
                    <div className="mb-4">
                      <label className="block text-sm font-medium text-gray-700 mb-2">Čo je zahrnuté</label>
                      <div className="flex gap-2 mb-2">
                        <input
                          type="text"
                          value={newFeature}
                          onChange={(e) => setNewFeature(e.target.value)}
                          onKeyPress={(e) => {
                            if (e.key === 'Enter') {
                              e.preventDefault()
                              if (newFeature.trim()) {
                                setAdFormData({ ...adFormData, features: [...adFormData.features, newFeature.trim()] })
                                setNewFeature('')
                              }
                            }
                          }}
                          placeholder="Pridajte funkciu a stlačte Enter"
                          className="flex-1 px-4 py-2 border border-gray-300 rounded-lg text-gray-900 placeholder-gray-500 focus:outline-none focus:ring-2 focus:ring-[#1dbf73] focus:border-transparent"
                        />
                        <button
                          type="button"
                          onClick={() => {
                            if (newFeature.trim()) {
                              setAdFormData({ ...adFormData, features: [...adFormData.features, newFeature.trim()] })
                              setNewFeature('')
                            }
                          }}
                          className="px-4 py-2 bg-[#1dbf73] hover:bg-[#19a463] text-white rounded-lg"
                        >
                          <Plus className="w-4 h-4" />
                        </button>
                      </div>
                      <div className="flex flex-wrap gap-2">
                        {adFormData.features.map((feature, idx) => (
                          <span key={idx} className="px-3 py-1 bg-gray-100 rounded-lg text-sm text-gray-900 flex items-center gap-2">
                            {feature}
                            <button
                              type="button"
                              onClick={() => {
                                setAdFormData({ ...adFormData, features: adFormData.features.filter((_, i) => i !== idx) })
                              }}
                              className="text-red-600 hover:text-red-700"
                            >
                              <X className="w-3 h-3" />
                            </button>
                          </span>
                        ))}
                      </div>
                    </div>

                    {/* Packages */}
                    {adFormData.pricingType === 'PACKAGE' && (
                      <div className="mb-4">
                        <label className="block text-sm font-medium text-gray-700 mb-2">Balíčky služieb</label>
                        <div className="space-y-4 p-4 bg-gray-50 rounded-lg border border-gray-200">
                          <div className="grid grid-cols-2 gap-4">
                            <div>
                              <label className="block text-xs text-gray-600 mb-1">Názov balíčka</label>
                              <input
                                type="text"
                                value={newPackage.name || ''}
                                onChange={(e) => setNewPackage({ ...newPackage, name: e.target.value })}
                                className="w-full px-3 py-2 border border-gray-300 rounded-lg text-gray-900 text-sm placeholder-gray-500 focus:outline-none focus:ring-2 focus:ring-[#1dbf73] focus:border-transparent"
                                placeholder="Napríklad: Základný"
                              />
                            </div>
                            <div>
                              <label className="block text-xs text-gray-600 mb-1">Cena (€)</label>
                              <input
                                type="number"
                                step="0.01"
                                value={newPackage.price || ''}
                                onChange={(e) => setNewPackage({ ...newPackage, price: e.target.value })}
                                className="w-full px-3 py-2 border border-gray-300 rounded-lg text-gray-900 text-sm placeholder-gray-500 focus:outline-none focus:ring-2 focus:ring-[#1dbf73] focus:border-transparent"
                              />
                            </div>
                          </div>
                          <div>
                            <label className="block text-xs text-gray-600 mb-1">Popis balíčka</label>
                            <textarea
                              value={newPackage.description || ''}
                              onChange={(e) => setNewPackage({ ...newPackage, description: e.target.value })}
                              rows={2}
                              className="w-full px-3 py-2 border border-gray-300 rounded-lg text-gray-900 text-sm placeholder-gray-500 focus:outline-none focus:ring-2 focus:ring-[#1dbf73] focus:border-transparent"
                              placeholder="Popis toho, čo obsahuje tento balíček"
                            />
                          </div>
                          <div className="grid grid-cols-2 gap-4">
                            <div>
                              <label className="block text-xs text-gray-600 mb-1">Čas dodania</label>
                              <input
                                type="text"
                                value={newPackage.deliveryTime || ''}
                                onChange={(e) => setNewPackage({ ...newPackage, deliveryTime: e.target.value })}
                                className="w-full px-3 py-2 border border-gray-300 rounded-lg text-gray-900 text-sm placeholder-gray-500 focus:outline-none focus:ring-2 focus:ring-[#1dbf73] focus:border-transparent"
                                placeholder="Napríklad: 3-5 dní"
                              />
                            </div>
                            <div>
                              <label className="block text-xs text-gray-600 mb-1">Funkcie balíčka</label>
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
                                  className="flex-1 px-3 py-2 border border-gray-300 rounded-lg text-gray-900 text-sm placeholder-gray-500 focus:outline-none focus:ring-2 focus:ring-[#1dbf73] focus:border-transparent"
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
                                  className="px-3 py-2 bg-[#1dbf73] hover:bg-[#19a463] text-white rounded-lg text-sm"
                                >
                                  <Plus className="w-3 h-3" />
                                </button>
                              </div>
                              <div className="flex flex-wrap gap-1 mt-2">
                                {newPackage.features?.map((feature: string, idx: number) => (
                                  <span key={idx} className="px-2 py-1 bg-gray-200 rounded text-xs text-gray-900 flex items-center gap-1">
                                    {feature}
                                    <button
                                      type="button"
                                      onClick={() => {
                                        setNewPackage({ ...newPackage, features: newPackage.features?.filter((_: any, i: number) => i !== idx) })
                                      }}
                                      className="text-red-600 hover:text-red-700"
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
                                setAdFormData({ ...adFormData, packages: [...adFormData.packages, newPackage] })
                                setNewPackage({ name: '', description: '', price: '', deliveryTime: '', features: [] })
                                setNewPackageFeature('')
                              }
                            }}
                            className="w-full px-4 py-2 bg-[#1dbf73] hover:bg-[#19a463] text-white rounded-lg text-sm flex items-center justify-center gap-2"
                          >
                            <Plus className="w-4 h-4" />
                            Pridať balíček
                          </button>
                        </div>
                        <div className="mt-4 space-y-2">
                          {adFormData.packages.map((pkg, idx) => (
                            <div key={idx} className="p-3 bg-gray-50 rounded-lg border border-gray-200 flex items-start justify-between">
                              <div className="flex-1">
                                <div className="font-medium text-gray-900">{pkg.name}</div>
                                <div className="text-sm text-gray-600">{pkg.description}</div>
                                <div className="text-sm text-gray-700 mt-1">
                                  <span className="font-semibold">{pkg.price}€</span> • {pkg.deliveryTime}
                                </div>
                                {pkg.features && pkg.features.length > 0 && (
                                  <div className="flex flex-wrap gap-1 mt-2">
                                    {pkg.features.map((feature: string, fIdx: number) => (
                                      <span key={fIdx} className="px-2 py-1 bg-white rounded text-xs text-gray-700">
                                        {feature}
                                      </span>
                                    ))}
                                  </div>
                                )}
                              </div>
                              <button
                                type="button"
                                onClick={() => {
                                  setAdFormData({ ...adFormData, packages: adFormData.packages.filter((_, i) => i !== idx) })
                                }}
                                className="ml-4 text-red-600 hover:text-red-700"
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
                      <label className="block text-sm font-medium text-gray-700 mb-2">Často kladené otázky (FAQ)</label>
                      <div className="space-y-2 p-4 bg-gray-50 rounded-lg border border-gray-200">
                        <div>
                          <label className="block text-xs text-gray-600 mb-1">Otázka</label>
                          <input
                            type="text"
                            value={newFAQ.question || ''}
                            onChange={(e) => setNewFAQ({ ...newFAQ, question: e.target.value })}
                            className="w-full px-3 py-2 border border-gray-300 rounded-lg text-gray-900 text-sm placeholder-gray-500 focus:outline-none focus:ring-2 focus:ring-[#1dbf73] focus:border-transparent mb-2"
                            placeholder="Napríklad: Ako dlho trvá dodanie?"
                          />
                        </div>
                        <div>
                          <label className="block text-xs text-gray-600 mb-1">Odpoveď</label>
                          <textarea
                            value={newFAQ.answer || ''}
                            onChange={(e) => setNewFAQ({ ...newFAQ, answer: e.target.value })}
                            rows={2}
                            className="w-full px-3 py-2 border border-gray-300 rounded-lg text-gray-900 text-sm placeholder-gray-500 focus:outline-none focus:ring-2 focus:ring-[#1dbf73] focus:border-transparent"
                            placeholder="Odpoveď na otázku"
                          />
                        </div>
                        <button
                          type="button"
                          onClick={() => {
                            if (newFAQ.question && newFAQ.answer) {
                              setAdFormData({ ...adFormData, faq: [...adFormData.faq, newFAQ] })
                              setNewFAQ({ question: '', answer: '' })
                            }
                          }}
                          className="w-full px-4 py-2 bg-[#1dbf73] hover:bg-[#19a463] text-white rounded-lg text-sm flex items-center justify-center gap-2"
                        >
                          <Plus className="w-4 h-4" />
                          Pridať FAQ
                        </button>
                      </div>
                      <div className="mt-4 space-y-2">
                        {adFormData.faq.map((faq, idx) => (
                          <div key={idx} className="p-3 bg-gray-50 rounded-lg border border-gray-200 flex items-start justify-between">
                            <div className="flex-1">
                              <div className="font-medium text-gray-900 mb-1">{faq.question}</div>
                              <div className="text-sm text-gray-600">{faq.answer}</div>
                            </div>
                            <button
                              type="button"
                              onClick={() => {
                                setAdFormData({ ...adFormData, faq: adFormData.faq.filter((_, i) => i !== idx) })
                              }}
                              className="ml-4 text-red-600 hover:text-red-700"
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
                <label className="block text-sm font-medium text-gray-700 mb-2">Fotky</label>
                <div className="space-y-4">
                  <div>
                    <label className="flex items-center justify-center w-full h-32 border-2 border-dashed border-gray-300 rounded-lg cursor-pointer hover:bg-gray-50 transition-colors">
                      <div className="flex flex-col items-center justify-center">
                        <ImageIcon className="w-8 h-8 text-gray-400 mb-2" />
                        <p className="text-sm text-gray-600">
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

                  {adFormData.images.length > 0 && (
                    <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
                      {adFormData.images.map((image, index) => (
                        <div key={index} className="relative group">
                          <img
                            src={image}
                            alt={`Upload ${index + 1}`}
                            className="w-full h-32 object-cover rounded-lg border border-gray-200"
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

              <div className="flex gap-4">
                <button
                  onClick={handleCreateAdvertisement}
                  disabled={saving}
                  className="flex items-center gap-2 px-6 py-3 bg-[#1dbf73] text-white rounded-lg hover:bg-[#19a463] disabled:opacity-50"
                >
                  <Plus className="w-5 h-5" />
                  {saving ? 'Vytváram...' : 'Vytvoriť inzerát'}
                </button>
              </div>
            </div>
          </div>
        )}

        {/* Messages Tab */}
        {activeTab === 'messages' && (
          <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
            {/* Messages List */}
            <div className="lg:col-span-2 bg-white rounded-lg shadow-sm border border-gray-200">
              <div className="p-4 border-b border-gray-200 flex items-center justify-between">
                <h2 className="text-lg font-semibold text-gray-900">Správy</h2>
                <div className="flex gap-2">
                  <select
                    value={messageFilter}
                    onChange={(e) => setMessageFilter(e.target.value as any)}
                    className="px-3 py-1.5 border border-gray-300 rounded-lg text-sm text-gray-700 focus:outline-none focus:ring-2 focus:ring-[#1dbf73]"
                  >
                    <option value="all">Všetky</option>
                    <option value="unread">Neprečítané</option>
                    <option value="inquiry">Dotazy</option>
                    <option value="system">Systémové</option>
                  </select>
                </div>
              </div>
              <div className="divide-y divide-gray-200 max-h-[600px] overflow-y-auto">
                {messages.length === 0 ? (
                  <div className="p-8 text-center text-gray-500">
                    <MessageSquare className="w-12 h-12 mx-auto mb-4 text-gray-300" />
                    <p>Nemáte žiadne správy</p>
                  </div>
                ) : (
                  messages.map((message) => (
                    <div
                      key={message.id}
                      onClick={() => handleMessageClick(message)}
                      className={`p-4 cursor-pointer hover:bg-gray-50 transition-colors ${
                        message.status === 'UNREAD' ? 'bg-blue-50' : ''
                      } ${selectedMessage?.id === message.id ? 'bg-[#1dbf73]/10' : ''}`}
                    >
                      <div className="flex items-start justify-between">
                        <div className="flex-1">
                          <div className="flex items-center gap-2 mb-1">
                            <span className={`px-2 py-1 rounded text-xs font-medium ${getMessageTypeColor(message.type)}`}>
                              {getMessageTypeLabel(message.type)}
                            </span>
                            {message.status === 'UNREAD' && (
                              <span className="w-2 h-2 bg-blue-500 rounded-full"></span>
                            )}
                          </div>
                          <h3 className="font-medium text-gray-900 mb-1">{message.subject}</h3>
                          <p className="text-sm text-gray-600 line-clamp-2">{message.content}</p>
                          {message.advertisement && (
                            <p className="text-xs text-gray-500 mt-1">
                              Inzerát: {message.advertisement.title}
                            </p>
                          )}
                          <p className="text-xs text-gray-400 mt-2">
                            {new Date(message.createdAt).toLocaleDateString('sk-SK', {
                              year: 'numeric',
                              month: 'long',
                              day: 'numeric',
                              hour: '2-digit',
                              minute: '2-digit',
                            })}
                          </p>
                        </div>
                        <div className="flex gap-2 ml-4">
                          {message.status === 'UNREAD' && (
                            <button
                              onClick={(e) => {
                                e.stopPropagation()
                                api.markAsRead(message.id).then(() => loadMessages())
                              }}
                              className="p-1 text-gray-400 hover:text-blue-600"
                              title="Označiť ako prečítané"
                            >
                              <CheckCircle className="w-4 h-4" />
                            </button>
                          )}
                          <button
                            onClick={(e) => {
                              e.stopPropagation()
                              handleMarkAsArchived(message.id)
                            }}
                            className="p-1 text-gray-400 hover:text-gray-600"
                            title="Archivovať"
                          >
                            <Archive className="w-4 h-4" />
                          </button>
                        </div>
                      </div>
                    </div>
                  ))
                )}
              </div>
            </div>

            {/* Message Detail */}
            <div className="lg:col-span-1 bg-white rounded-lg shadow-sm border border-gray-200 p-6">
              {selectedMessage ? (
                <div>
                  <div className="flex items-center justify-between mb-4">
                    <h3 className="text-lg font-semibold text-gray-900">Detail správy</h3>
                    <button
                      onClick={() => setSelectedMessage(null)}
                      className="text-gray-400 hover:text-gray-600"
                    >
                      <X className="w-5 h-5" />
                    </button>
                  </div>
                  <div className="mb-4">
                    <span className={`px-2 py-1 rounded text-xs font-medium ${getMessageTypeColor(selectedMessage.type)}`}>
                      {getMessageTypeLabel(selectedMessage.type)}
                    </span>
                  </div>
                  <h4 className="font-medium text-gray-900 mb-2">{selectedMessage.subject}</h4>
                  {selectedMessage.sender && (
                    <p className="text-sm text-gray-600 mb-2">
                      Od: {selectedMessage.sender.firstName} {selectedMessage.sender.lastName} ({selectedMessage.sender.email})
                    </p>
                  )}
                  {selectedMessage.advertisement && (
                    <div className="mb-4 p-3 bg-gray-50 rounded-lg border border-gray-200">
                      <p className="text-sm font-medium text-gray-900 mb-1">Súvisiaci inzerát:</p>
                      <Link href={`/inzerat/${selectedMessage.advertisement.id}`} className="text-sm text-[#1dbf73] hover:underline">
                        {selectedMessage.advertisement.title}
                      </Link>
                    </div>
                  )}
                  <div className="text-sm text-gray-700 whitespace-pre-wrap mb-4">
                    {selectedMessage.content}
                  </div>
                  {selectedMessage.metadata && (
                    <div className="mb-4 p-3 bg-gray-50 rounded-lg border border-gray-200">
                      <p className="text-xs text-gray-600">
                        {selectedMessage.metadata.banDuration && (
                          <>
                            Trvanie banu: {selectedMessage.metadata.banDuration === 'permanent' 
                              ? 'Trvalo' 
                              : `${selectedMessage.metadata.banDurationValue} ${
                                  selectedMessage.metadata.banDuration === 'minutes' ? 'minút' :
                                  selectedMessage.metadata.banDuration === 'hours' ? 'hodín' :
                                  selectedMessage.metadata.banDuration === 'days' ? 'dní' :
                                  selectedMessage.metadata.banDuration === 'months' ? 'mesiacov' :
                                  selectedMessage.metadata.banDuration
                                }`}
                            {selectedMessage.metadata.bannedUntil && (
                              <> (do {new Date(selectedMessage.metadata.bannedUntil).toLocaleDateString('sk-SK', {
                                year: 'numeric',
                                month: 'long',
                                day: 'numeric',
                                hour: '2-digit',
                                minute: '2-digit',
                              })})</>
                            )}
                          </>
                        )}
                      </p>
                    </div>
                  )}
                  <p className="text-xs text-gray-400">
                    {new Date(selectedMessage.createdAt).toLocaleDateString('sk-SK', {
                      year: 'numeric',
                      month: 'long',
                      day: 'numeric',
                      hour: '2-digit',
                      minute: '2-digit',
                    })}
                  </p>
                  <div className="mt-4 flex gap-2">
                    {selectedMessage.status === 'UNREAD' && (
                      <button
                        onClick={() => {
                          api.markAsRead(selectedMessage.id).then(() => {
                            loadMessages()
                            setSelectedMessage({ ...selectedMessage, status: 'READ' })
                          })
                        }}
                        className="flex-1 px-4 py-2 bg-[#1dbf73] hover:bg-[#19a463] text-white rounded-lg text-sm"
                      >
                        Označiť ako prečítané
                      </button>
                    )}
                    <button
                      onClick={() => handleMarkAsArchived(selectedMessage.id)}
                      className="flex-1 px-4 py-2 border border-gray-300 text-gray-700 rounded-lg text-sm hover:bg-gray-50"
                    >
                      Archivovať
                    </button>
                  </div>
                </div>
              ) : (
                <div className="text-center text-gray-500 py-8">
                  <MessageSquare className="w-12 h-12 mx-auto mb-4 text-gray-300" />
                  <p>Vyberte správu na zobrazenie</p>
                </div>
              )}
            </div>
          </div>
        )}
      </div>
      <Footer />
    </div>
  )
}
