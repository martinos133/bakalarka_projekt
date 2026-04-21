'use client'

import { useState, useEffect, useRef, Suspense, useMemo } from 'react'
import { useRouter, useSearchParams } from 'next/navigation'
import Header from '@/components/Header'
import Footer from '@/components/Footer'
import { CmsArticleView, CmsLoadingView } from '@/components/CmsGate'
import { api } from '@/lib/api'
import { isAuthenticated, getAuthUser, setAuthUser } from '@/lib/auth'
import { User, Building2, Trash2, X, Lock, Mail, Phone, MapPin, Calendar, Crown, Save, Eye, Edit, MessageSquare, Archive, CheckCircle, Paperclip, FileText, Download, Heart, Image as ImageIcon } from 'lucide-react'
import CreateAdvertisementWizard from '@/components/CreateAdvertisementWizard'
import Link from 'next/link'
import { sellerPlanLabel } from '@/lib/sellerPlan'
import { fileToResizedAvatarDataUrl } from '@/lib/avatarResize'
import { useCmsOverride } from '@/lib/useCmsOverride'
import CustomSelect from '@/components/CustomSelect'
import ProfileCalendar from '@/components/ProfileCalendar'
import { parseInquiryDateRangeYmd, CALENDAR_COLOR_BOOKING } from '@inzertna-platforma/shared'

function DashboardPageInner() {
  const router = useRouter()
  const searchParams = useSearchParams()
  const { loading: cmsLoading, page: cmsPage } = useCmsOverride('dashboard')
  const [mounted, setMounted] = useState(false)
  const [activeTab, setActiveTab] = useState<
    'profile' | 'advertisements' | 'favorites' | 'create' | 'messages' | 'calendar'
  >('profile')
  const [calendarRefreshKey, setCalendarRefreshKey] = useState(0)
  /** accept = kalendár + odpoveď, decline = len odmietnutie kupujúcemu */
  const [inquiryOrderBusy, setInquiryOrderBusy] = useState<'accept' | 'decline' | null>(null)
  /** Po akcii skryť panel hneď (reset pri výbere inej správy). */
  const [inquiryOrderPanelHiddenForRootId, setInquiryOrderPanelHiddenForRootId] = useState<string | null>(null)
  const [user, setUser] = useState<any>(null)
  const [advertisements, setAdvertisements] = useState<any[]>([])
  const [favorites, setFavorites] = useState<any[]>([])
  const [messages, setMessages] = useState<any[]>([])
  const [unreadCount, setUnreadCount] = useState(0)
  const [selectedMessage, setSelectedMessage] = useState<any>(null)
  const [conversationMessages, setConversationMessages] = useState<any[]>([])
  const [replyContent, setReplyContent] = useState('')
  const [replyAttachments, setReplyAttachments] = useState<string[]>([])
  const [replySubmitting, setReplySubmitting] = useState(false)
  const [lightboxImage, setLightboxImage] = useState<string | null>(null)
  const [messageFilter, setMessageFilter] = useState<'all' | 'unread' | 'inquiry' | 'system'>('all')
  const [loading, setLoading] = useState(true)
  const [saving, setSaving] = useState(false)
  
  const [profileData, setProfileData] = useState<any>({})
  const [passwordData, setPasswordData] = useState({
    oldPassword: '',
    newPassword: '',
    confirmPassword: '',
  })
  const [categories, setCategories] = useState<any[]>([])
  const [editingAdId, setEditingAdId] = useState<string | null>(null)
  /** Pri novom inzeráti zvyšuje key na CreateAdvertisementWizard = čistý formulár */
  const [createWizardNonce, setCreateWizardNonce] = useState(0)
  const [error, setError] = useState('')
  const [success, setSuccess] = useState('')
  const avatarFileRef = useRef<HTMLInputElement>(null)

  useEffect(() => {
    setMounted(true)
    if (!isAuthenticated()) {
      router.push('/signin')
      return
    }
    loadData()
  }, [router])

  useEffect(() => {
    const tab = searchParams.get('tab')
    if (
      tab === 'messages' ||
      tab === 'profile' ||
      tab === 'advertisements' ||
      tab === 'favorites' ||
      tab === 'create' ||
      tab === 'calendar'
    ) {
      setActiveTab(tab)
    }
  }, [searchParams])

  const loadData = async () => {
    try {
      setLoading(true)
      const [userData, adsData, favData, catsData, messagesData, unreadData] = await Promise.all([
        api.getMyProfile(),
        api.getMyAdvertisements(),
        api.getFavorites(),
        api.getCategories(),
        api.getMessages(),
        api.getUnreadCount(),
      ])
      setUser(userData)
      setProfileData(userData)
      setAuthUser(userData)
      setAdvertisements(adsData)
      setFavorites(favData)
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

  const loadFavorites = async () => {
    try {
      const favData = await api.getFavorites()
      setFavorites(favData)
    } catch (err: any) {
      setError(err.message || 'Chyba pri načítaní obľúbených')
    }
  }

  useEffect(() => {
    if (activeTab === 'messages') {
      loadMessages()
    }
    if (activeTab === 'favorites') {
      loadFavorites()
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [activeTab, messageFilter])

  useEffect(() => {
    setInquiryOrderPanelHiddenForRootId(null)
  }, [selectedMessage?.id])

  const inquiryParsedRange = useMemo(() => {
    if (!conversationMessages.length) return null
    const txt = conversationMessages.map((m: any) => m.content || '').join('\n')
    return parseInquiryDateRangeYmd(txt)
  }, [conversationMessages])

  const inquiryThreadRoot = useMemo(() => {
    if (!conversationMessages.length) return null
    return conversationMessages.find((m: any) => !m.parentId) ?? conversationMessages[0]
  }, [conversationMessages])

  const canConfirmInquiryCalendar = Boolean(
    user?.id && inquiryParsedRange && inquiryThreadRoot && inquiryThreadRoot.recipientId === user.id,
  )

  /**
   * Po odpovedi predajcu (potvrdenie / odmietnutie) už neukazovať panel Prijať/Odmietnuť.
   * Nepoužívame \\b okolo slov s diakritikou – v JS nie je „á“ word char, takže \\bpotvrdená\\b často neplatí.
   */
  const inquirySellerRespondedToOrder = useMemo(() => {
    if (!conversationMessages.length || !user?.id || !inquiryThreadRoot) return false
    const rootId = inquiryThreadRoot.id
    return conversationMessages.some((m: any) => {
      if (m.senderId !== user.id || m.id === rootId) return false
      const c = (m.content || '').trim()
      if (!c) return false
      return (
        /potvrdená|potvrdený|potvrdené/i.test(c) ||
        /nemôžem akceptovať/i.test(c)
      )
    })
  }, [conversationMessages, user?.id, inquiryThreadRoot])

  const handleMessageClick = async (message: any) => {
    try {
      setSelectedMessage(message)
      setReplyContent('')
      setReplyAttachments([])
      if (message.type === 'INQUIRY') {
        const conv = await api.getConversation(message.id)
        setConversationMessages(conv)
        if (message.status === 'UNREAD') {
          await api.markAsRead(message.id)
          loadMessages()
        }
      } else {
        const fullMessage = await api.getMessage(message.id)
        setSelectedMessage(fullMessage)
        setConversationMessages([])
        if (fullMessage.status === 'UNREAD') {
          await api.markAsRead(message.id)
          loadMessages()
        }
      }
    } catch (err: any) {
      setError(err.message || 'Chyba pri načítaní správy')
    }
  }

  const handleReplyFileSelect = (e: React.ChangeEvent<HTMLInputElement>) => {
    const files = e.target.files
    if (!files || replyAttachments.length >= 5) return
    Array.from(files).slice(0, 5 - replyAttachments.length).forEach((file) => {
      if (file.size > 5 * 1024 * 1024) return
      const reader = new FileReader()
      reader.onloadend = () => {
        const result = reader.result as string
        if (result && result.length < 6_000_000) {
          setReplyAttachments((prev) => [...prev, result].slice(0, 5))
        }
      }
      reader.readAsDataURL(file)
    })
    e.target.value = ''
  }

  const handleSendReply = async () => {
    if (!selectedMessage || conversationMessages.length === 0) return
    if (!replyContent.trim() && replyAttachments.length === 0) return
    const rootMsg = conversationMessages.find((m) => !m.parentId) || conversationMessages[0]
    const rootId = rootMsg.id
    try {
      setReplySubmitting(true)
      const newMsg = await api.createReply(rootId, replyContent.trim(), replyAttachments)
      setConversationMessages((prev) => [...prev, newMsg])
      setReplyContent('')
      setReplyAttachments([])
      loadMessages()
    } catch (err: any) {
      setError(err.message || 'Chyba pri odoslaní odpovede')
    } finally {
      setReplySubmitting(false)
    }
  }

  const handleAcceptInquiryOrder = async () => {
    if (!inquiryParsedRange || !canConfirmInquiryCalendar) return
    const adTitle =
      conversationMessages.find((m: any) => m.advertisement?.title)?.advertisement?.title ||
      selectedMessage?.advertisement?.title ||
      selectedMessage?.subject ||
      'Rezervácia'
    const rootMsg = conversationMessages.find((m: any) => !m.parentId) || conversationMessages[0]
    const rootId = rootMsg.id
    const fromSk = new Date(inquiryParsedRange.startYmd + 'T12:00:00.000Z').toLocaleDateString('sk-SK')
    const toSk = new Date(inquiryParsedRange.endYmd + 'T12:00:00.000Z').toLocaleDateString('sk-SK')
    const buyerMsg = conversationMessages.find(
      (m: any) => m.senderId && m.senderId !== user?.id && m.sender,
    ) as { sender?: { firstName?: string; lastName?: string; email?: string } } | undefined
    const buyer =
      buyerMsg?.sender &&
      [buyerMsg.sender.firstName, buyerMsg.sender.lastName].filter(Boolean).join(' ').trim()
        ? `${[buyerMsg.sender.firstName, buyerMsg.sender.lastName].filter(Boolean).join(' ')}${buyerMsg.sender.email ? ` · ${buyerMsg.sender.email}` : ''}`
        : ''
    const descriptionParts = [
      buyer ? `Kupujúci: ${buyer}.` : null,
      'Potvrdené z konverzácie v správach.',
    ].filter(Boolean) as string[]
    try {
      setInquiryOrderBusy('accept')
      setError('')
      await api.createCalendarEvent({
        title: `Rezervácia: ${adTitle}`,
        description: descriptionParts.join(' '),
        date: `${inquiryParsedRange.startYmd}T12:00:00.000Z`,
        endDate: `${inquiryParsedRange.endYmd}T12:00:00.000Z`,
        allDay: true,
        color: CALENDAR_COLOR_BOOKING,
      })
      setInquiryOrderPanelHiddenForRootId(rootId)
      try {
        const replyText = `Vaša rezervácia / objednávka je na termín ${fromSk} – ${toSk} potvrdená. Ďakujem za dôveru.`
        const newMsg = await api.createReply(rootId, replyText, [])
        setConversationMessages((prev) => [...prev, newMsg])
      } catch (replyErr: any) {
        setError(
          replyErr?.message ||
            'Kalendár bol aktualizovaný, ale odpoveď sa nepodarila odoslať – napíšte kupujúcemu ručne.',
        )
      }
      setSuccess(
        'Termín je v kalendári obsadený. Kupujúci uvidí potvrdenie v Správach v tej istej konverzácii.',
      )
      setTimeout(() => setSuccess(''), 5000)
      setCalendarRefreshKey((k) => k + 1)
      loadMessages()
    } catch (err: any) {
      setError(err.message || 'Nepodarilo sa uložiť do kalendára')
    } finally {
      setInquiryOrderBusy(null)
    }
  }

  const handleDeclineInquiryOrder = async () => {
    if (!canConfirmInquiryCalendar || !inquiryParsedRange) return
    if (!confirm('Naozaj chcete odmietnuť túto žiadosť? Kupujúci dostane krátku odpoveď v konverzácii.')) return
    const rootMsg = conversationMessages.find((m: any) => !m.parentId) || conversationMessages[0]
    const rootId = rootMsg.id
    const fromSk = new Date(inquiryParsedRange.startYmd + 'T12:00:00.000Z').toLocaleDateString('sk-SK')
    const toSk = new Date(inquiryParsedRange.endYmd + 'T12:00:00.000Z').toLocaleDateString('sk-SK')
    const body = `Ďakujem za záujem. Žiadosť na termín ${fromSk} – ${toSk} nemôžem akceptovať.`
    try {
      setInquiryOrderBusy('decline')
      setError('')
      const newMsg = await api.createReply(rootId, body, [])
      setConversationMessages((prev) => [...prev, newMsg])
      setInquiryOrderPanelHiddenForRootId(rootId)
      setSuccess('Žiadosť bola odmietnutá a odpoveď odoslaná.')
      setTimeout(() => setSuccess(''), 4500)
      loadMessages()
    } catch (err: any) {
      setError(err.message || 'Nepodarilo sa odoslať odmietnutie')
    } finally {
      setInquiryOrderBusy(null)
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
      INQUIRY: 'bg-accent/15 text-accent',
      SYSTEM: 'bg-dark-100 text-white/90',
      BAN_NOTIFICATION: 'bg-red-100 text-red-400',
      VIOLATION: 'bg-orange-900/25 text-orange-400',
      AD_APPROVED: 'bg-accent/15 text-accent',
      AD_REJECTED: 'bg-red-100 text-red-400',
    }
    return colors[type] || 'bg-dark-100 text-white/90'
  }

  const handleSaveProfile = async () => {
    try {
      setSaving(true)
      setError('')
      const updated = await api.updateMyProfile(profileData)
      setUser(updated)
      setProfileData(updated)
      setAuthUser(updated)
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
      setSuccess('Heslo bolo úspešne zmenené')
      setTimeout(() => setSuccess(''), 3000)
    } catch (err: any) {
      setError(err.message || 'Chyba pri zmene hesla')
    } finally {
      setSaving(false)
    }
  }

  const handleEditAdvertisement = (ad: any) => {
    setEditingAdId(ad.id)
    setActiveTab('create')
  }

  const handleDeleteAdvertisement = async (id: string) => {
    if (!confirm('Naozaj chcete odstrániť tento inzerát?')) return

    try {
      await api.deleteAdvertisement(id)
      setAdvertisements(advertisements.filter(ad => ad.id !== id))
      setEditingAdId((prev) => (prev === id ? null : prev))
      setSuccess('Inzerát bol úspešne odstránený')
      setTimeout(() => setSuccess(''), 3000)
    } catch (err: any) {
      setError(err.message || 'Chyba pri odstraňovaní inzerátu')
    }
  }

  if (cmsLoading) {
    return <CmsLoadingView shell="headerFooterOnly" />
  }
  if (cmsPage) {
    return (
      <CmsArticleView
        shell="headerFooterOnly"
        slug="dashboard"
        title={cmsPage.title}
        content={cmsPage.content}
      />
    )
  }

  if (!mounted || loading) {
    return (
      <div className="min-h-screen bg-dark">
        <Header />
        <div className="flex items-center justify-center min-h-[60vh]">
          <div className="text-gray-500">Načítavam...</div>
        </div>
        <Footer />
      </div>
    )
  }

  return (
    <div className="min-h-screen bg-dark-50">
      <Header />
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        <div className="mb-8">
          <h1 className="text-3xl font-bold text-white">Môj profil</h1>
          <p className="text-gray-500 mt-2">Spravujte svoj profil a inzeráty</p>
        </div>

        {error && (
          <div className="mb-6 bg-red-900/20 border border-red-800/30 text-red-400 px-4 py-3 rounded-lg">
            {error}
          </div>
        )}

        {success && (
          <div className="mb-6 bg-accent/10 border border-accent/20 text-accent px-4 py-3 rounded-lg">
            {success}
          </div>
        )}

        {/* Tabs */}
        <div className="border-b border-white/[0.08] mb-6">
          <nav className="flex space-x-8">
            <button
              onClick={() => setActiveTab('profile')}
              className={`py-4 px-1 border-b-2 font-medium text-sm ${
                activeTab === 'profile'
                  ? 'border-accent text-accent'
                  : 'border-transparent text-gray-500 hover:text-white hover:border-white/15'
              }`}
            >
              Profil
            </button>
            <button
              onClick={() => setActiveTab('advertisements')}
              className={`py-4 px-1 border-b-2 font-medium text-sm ${
                activeTab === 'advertisements'
                  ? 'border-accent text-accent'
                  : 'border-transparent text-gray-500 hover:text-white hover:border-white/15'
              }`}
            >
              Moje inzeráty ({advertisements.length})
            </button>
            <button
              onClick={() => setActiveTab('favorites')}
              className={`py-4 px-1 border-b-2 font-medium text-sm ${
                activeTab === 'favorites'
                  ? 'border-accent text-accent'
                  : 'border-transparent text-gray-500 hover:text-white hover:border-white/15'
              }`}
            >
              Obľúbené inzeráty ({favorites.length})
            </button>
            <button
              onClick={() => {
                setActiveTab('create')
                if (!editingAdId) {
                  setCreateWizardNonce((n) => n + 1)
                }
              }}
              className={`py-4 px-1 border-b-2 font-medium text-sm ${
                activeTab === 'create'
                  ? 'border-accent text-accent'
                  : 'border-transparent text-gray-500 hover:text-white hover:border-white/15'
              }`}
            >
              Pridať inzerát
            </button>
            <button
              type="button"
              onClick={() => setActiveTab('calendar')}
              className={`py-4 px-1 border-b-2 font-medium text-sm inline-flex items-center gap-2 ${
                activeTab === 'calendar'
                  ? 'border-accent text-accent'
                  : 'border-transparent text-gray-500 hover:text-white hover:border-white/15'
              }`}
            >
              <Calendar className="w-4 h-4 shrink-0" aria-hidden />
              Kalendár
            </button>
            <button
              onClick={() => setActiveTab('messages')}
              className={`py-4 px-1 border-b-2 font-medium text-sm relative ${
                activeTab === 'messages'
                  ? 'border-accent text-accent'
                  : 'border-transparent text-gray-500 hover:text-white hover:border-white/15'
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
          <div className="space-y-6">
            {/* Header karta s avatárom */}
            <div className="card p-6 flex flex-col gap-6 sm:flex-row sm:items-center">
              <div className="flex flex-col items-center gap-2">
                {profileData.avatarUrl ? (
                  // eslint-disable-next-line @next/next/no-img-element
                  <img src={profileData.avatarUrl} alt="" className="h-24 w-24 rounded-full border border-white/10 object-cover" />
                ) : (
                  <div className="flex h-24 w-24 items-center justify-center rounded-full border border-white/10 bg-dark-100 text-2xl font-bold text-gray-500">
                    {((profileData.firstName?.[0] || '') + (profileData.lastName?.[0] || '') || '?').toUpperCase()}
                  </div>
                )}
                <input ref={avatarFileRef} type="file" accept="image/jpeg,image/png,image/webp" className="hidden"
                  onChange={async (e) => {
                    const f = e.target.files?.[0]; e.target.value = ''
                    if (!f) return
                    try {
                      const dataUrl = await fileToResizedAvatarDataUrl(f)
                      setSaving(true); setError('')
                      const updated = await api.updateMyProfile({ ...profileData, avatarUrl: dataUrl })
                      setUser(updated); setProfileData(updated); setAuthUser(updated)
                      setSuccess('Profilovka bola uložená.'); setTimeout(() => setSuccess(''), 3000)
                    } catch (err: unknown) { setError(err instanceof Error ? err.message : 'Chyba pri obrázku') }
                    finally { setSaving(false) }
                  }}
                />
                <div className="flex gap-2">
                  <button type="button" onClick={() => avatarFileRef.current?.click()}
                    className="inline-flex items-center gap-1 rounded-lg border border-white/10 bg-dark-100 px-2.5 py-1 text-xs text-white hover:bg-popupHover">
                    <ImageIcon className="h-3 w-3" /> Nahrať
                  </button>
                  {profileData.avatarUrl && (
                    <button type="button" onClick={async () => {
                      try {
                        setSaving(true); setError('')
                        const updated = await api.updateMyProfile({ ...profileData, avatarUrl: null })
                        setUser(updated); setProfileData(updated); setAuthUser(updated)
                        setSuccess('Profilovka bola odstránená.'); setTimeout(() => setSuccess(''), 3000)
                      } catch (err: unknown) { setError(err instanceof Error ? err.message : 'Chyba') }
                      finally { setSaving(false) }
                    }} className="inline-flex items-center gap-1 rounded-lg border border-red-500/30 px-2.5 py-1 text-xs text-red-300 hover:bg-red-950/40">
                      <Trash2 className="h-3 w-3" /> Odstrániť
                    </button>
                  )}
                </div>
              </div>
              <div className="min-w-0 flex-1">
                <h2 className="text-xl font-bold text-white">{profileData.firstName} {profileData.lastName}</h2>
                <p className="mt-0.5 text-sm text-gray-400">{profileData.email}</p>
                <div className="mt-3 flex flex-wrap gap-3">
                  <span className="inline-flex items-center gap-1.5 rounded-lg border border-white/10 bg-dark-100 px-3 py-1.5 text-xs text-gray-300">
                    <Crown className="h-3.5 w-3.5 text-accent" />
                    {sellerPlanLabel(profileData?.sellerPlan)}
                  </span>
                  {profileData?.sellerPlanValidUntil && (
                    <span className="inline-flex items-center gap-1.5 rounded-lg border border-white/10 bg-dark-100 px-3 py-1.5 text-xs text-gray-300">
                      <Calendar className="h-3.5 w-3.5 text-accent" />
                      Platné do {new Date(profileData.sellerPlanValidUntil).toLocaleDateString('sk-SK')}
                    </span>
                  )}
                  {profileData?.createdAt && (
                    <span className="inline-flex items-center gap-1.5 rounded-lg border border-white/10 bg-dark-100 px-3 py-1.5 text-xs text-gray-300">
                      <Calendar className="h-3.5 w-3.5 text-accent" />
                      Člen od {new Date(profileData.createdAt).toLocaleDateString('sk-SK')}
                    </span>
                  )}
                  <Link href="/premium" className="inline-flex items-center gap-1.5 rounded-lg bg-accent px-3 py-1.5 text-xs font-semibold text-dark hover:bg-accent-light">
                    Prémiové balíky
                  </Link>
                </div>
              </div>
            </div>

            {/* Dvojstĺpcový grid */}
            <div className="grid gap-6 lg:grid-cols-2">
              {/* Osobné údaje */}
              <section className="card p-6 space-y-5">
                <h2 className="flex items-center gap-2 text-base font-semibold text-white">
                  <User className="h-5 w-5 text-accent" /> Osobné údaje
                </h2>
                <div className="grid gap-4 sm:grid-cols-2">
                  <div>
                    <label className="mb-1 block text-xs font-medium uppercase tracking-wider text-gray-500">Meno</label>
                    <input value={profileData.firstName || ''} onChange={(e) => setProfileData({ ...profileData, firstName: e.target.value })}
                      className="w-full rounded-lg border border-white/10 bg-dark-100 px-3 py-2 text-sm text-white focus:border-accent/40 focus:outline-none" />
                  </div>
                  <div>
                    <label className="mb-1 block text-xs font-medium uppercase tracking-wider text-gray-500">Priezvisko</label>
                    <input value={profileData.lastName || ''} onChange={(e) => setProfileData({ ...profileData, lastName: e.target.value })}
                      className="w-full rounded-lg border border-white/10 bg-dark-100 px-3 py-2 text-sm text-white focus:border-accent/40 focus:outline-none" />
                  </div>
                </div>
                <div>
                  <label className="mb-1 block text-xs font-medium uppercase tracking-wider text-gray-500">E-mail</label>
                  <div className="relative">
                    <Mail className="pointer-events-none absolute left-3 top-1/2 h-3.5 w-3.5 -translate-y-1/2 text-gray-600" />
                    <input value={profileData.email || ''} readOnly className="w-full rounded-lg border border-white/5 bg-dark-100/50 px-3 py-2 pl-8 text-sm text-gray-400 cursor-default" />
                  </div>
                </div>
                <div className="grid gap-4 sm:grid-cols-2">
                  <div>
                    <label className="mb-1 block text-xs font-medium uppercase tracking-wider text-gray-500">Telefón</label>
                    <div className="relative">
                      <Phone className="pointer-events-none absolute left-3 top-1/2 h-3.5 w-3.5 -translate-y-1/2 text-gray-600" />
                      <input value={profileData.phone || ''} onChange={(e) => setProfileData({ ...profileData, phone: e.target.value })} placeholder="+421…"
                        className="w-full rounded-lg border border-white/10 bg-dark-100 px-3 py-2 pl-8 text-sm text-white focus:border-accent/40 focus:outline-none" />
                    </div>
                  </div>
                  <div>
                    <label className="mb-1 block text-xs font-medium uppercase tracking-wider text-gray-500">Pohlavie</label>
                    <CustomSelect
                      value={profileData.gender || ''}
                      onChange={(v) => setProfileData({ ...profileData, gender: v || undefined })}
                      placeholder="— Neurčené —"
                      options={[
                        { value: '', label: '— Neurčené —' },
                        { value: 'MALE', label: 'Muž' },
                        { value: 'FEMALE', label: 'Žena' },
                        { value: 'OTHER', label: 'Iné' },
                      ]}
                    />
                  </div>
                </div>
              </section>

              {/* Adresa + Firma */}
              <div className="space-y-6">
                <section className="card p-6 space-y-5">
                  <h2 className="flex items-center gap-2 text-base font-semibold text-white">
                    <MapPin className="h-5 w-5 text-accent" /> Adresa
                  </h2>
                  <div>
                    <label className="mb-1 block text-xs font-medium uppercase tracking-wider text-gray-500">Ulica a č. domu</label>
                    <input value={profileData.address || ''} onChange={(e) => setProfileData({ ...profileData, address: e.target.value })}
                      className="w-full rounded-lg border border-white/10 bg-dark-100 px-3 py-2 text-sm text-white focus:border-accent/40 focus:outline-none" />
                  </div>
                  <div className="grid gap-4 sm:grid-cols-3">
                    <div className="sm:col-span-1">
                      <label className="mb-1 block text-xs font-medium uppercase tracking-wider text-gray-500">PSČ</label>
                      <input value={profileData.postalCode || ''} onChange={(e) => setProfileData({ ...profileData, postalCode: e.target.value })} placeholder="010 01"
                        className="w-full rounded-lg border border-white/10 bg-dark-100 px-3 py-2 text-sm text-white focus:border-accent/40 focus:outline-none" />
                    </div>
                    <div className="sm:col-span-2">
                      <label className="mb-1 block text-xs font-medium uppercase tracking-wider text-gray-500">Mesto</label>
                      <input value={profileData.city || ''} onChange={(e) => setProfileData({ ...profileData, city: e.target.value })}
                        className="w-full rounded-lg border border-white/10 bg-dark-100 px-3 py-2 text-sm text-white focus:border-accent/40 focus:outline-none" />
                    </div>
                  </div>
                  <div>
                    <label className="mb-1 block text-xs font-medium uppercase tracking-wider text-gray-500">Krajina</label>
                    <input value={profileData.country || ''} onChange={(e) => setProfileData({ ...profileData, country: e.target.value })} placeholder="Slovensko"
                      className="w-full rounded-lg border border-white/10 bg-dark-100 px-3 py-2 text-sm text-white focus:border-accent/40 focus:outline-none" />
                  </div>
                </section>

                <section className="card p-6 space-y-5">
                  <div className="flex items-center justify-between">
                    <h2 className="flex items-center gap-2 text-base font-semibold text-white">
                      <Building2 className="h-5 w-5 text-accent" /> Firemné údaje
                    </h2>
                    <label className="flex cursor-pointer items-center gap-2 text-xs text-gray-400">
                      <input type="checkbox" checked={!!profileData.isCompany} onChange={(e) => setProfileData({ ...profileData, isCompany: e.target.checked })}
                        className="h-4 w-4 rounded border-white/10 bg-dark-100 text-accent focus:ring-accent" />
                      Som firma / SZČO
                    </label>
                  </div>
                  {profileData.isCompany && (
                    <>
                      <div>
                        <label className="mb-1 block text-xs font-medium uppercase tracking-wider text-gray-500">Názov firmy</label>
                        <input value={profileData.companyName || ''} onChange={(e) => setProfileData({ ...profileData, companyName: e.target.value })}
                          className="w-full rounded-lg border border-white/10 bg-dark-100 px-3 py-2 text-sm text-white focus:border-accent/40 focus:outline-none" />
                      </div>
                      <div className="grid gap-4 sm:grid-cols-2">
                        <div>
                          <label className="mb-1 block text-xs font-medium uppercase tracking-wider text-gray-500">IČO</label>
                          <input value={profileData.companyId || ''} onChange={(e) => setProfileData({ ...profileData, companyId: e.target.value })}
                            className="w-full rounded-lg border border-white/10 bg-dark-100 px-3 py-2 text-sm text-white focus:border-accent/40 focus:outline-none" />
                        </div>
                        <div>
                          <label className="mb-1 block text-xs font-medium uppercase tracking-wider text-gray-500">DIČ</label>
                          <input value={profileData.companyTaxId || ''} onChange={(e) => setProfileData({ ...profileData, companyTaxId: e.target.value })}
                            className="w-full rounded-lg border border-white/10 bg-dark-100 px-3 py-2 text-sm text-white focus:border-accent/40 focus:outline-none" />
                        </div>
                      </div>
                    </>
                  )}
                </section>
              </div>
            </div>

            {/* Uložiť */}
            <div className="flex items-center gap-4">
              <button type="button" disabled={saving} onClick={handleSaveProfile}
                className="inline-flex items-center gap-2 rounded-xl bg-accent px-5 py-2.5 text-sm font-semibold text-dark hover:bg-accent-light disabled:opacity-50">
                <Save className="h-4 w-4" /> {saving ? 'Ukladám…' : 'Uložiť profil'}
              </button>
              <p className="text-xs text-gray-500">Zmeny sa prejavia v celom profile aj pri inzerátoch.</p>
            </div>

            {/* Zmena hesla */}
            <section className="card p-6 space-y-4">
              <h2 className="flex items-center gap-2 text-base font-semibold text-white">
                <Lock className="h-5 w-5 text-accent" /> Zmena hesla
              </h2>
              <div className="grid gap-3 sm:grid-cols-3">
                <input type="password" value={passwordData.oldPassword} onChange={(e) => setPasswordData({ ...passwordData, oldPassword: e.target.value })}
                  placeholder="Súčasné heslo" className="w-full rounded-lg border border-white/10 bg-dark-100 px-3 py-2 text-sm text-white placeholder:text-gray-600 focus:border-accent/40 focus:outline-none [color-scheme:dark]" />
                <input type="password" value={passwordData.newPassword} onChange={(e) => setPasswordData({ ...passwordData, newPassword: e.target.value })}
                  placeholder="Nové heslo (min. 8 znakov)" className="w-full rounded-lg border border-white/10 bg-dark-100 px-3 py-2 text-sm text-white placeholder:text-gray-600 focus:border-accent/40 focus:outline-none [color-scheme:dark]" />
                <input type="password" value={passwordData.confirmPassword} onChange={(e) => setPasswordData({ ...passwordData, confirmPassword: e.target.value })}
                  placeholder="Potvrdenie nového hesla" className="w-full rounded-lg border border-white/10 bg-dark-100 px-3 py-2 text-sm text-white placeholder:text-gray-600 focus:border-accent/40 focus:outline-none [color-scheme:dark]" />
              </div>
              <button type="button" disabled={saving} onClick={handleChangePassword}
                className="inline-flex items-center gap-2 rounded-xl border border-white/10 bg-dark-100 px-4 py-2 text-sm font-medium text-white hover:bg-popupHover disabled:opacity-50">
                {saving ? 'Mením…' : 'Zmeniť heslo'}
              </button>
            </section>
          </div>
        )}

        {/* Advertisements Tab */}
        {activeTab === 'advertisements' && (
          <div className="card">
            <div className="p-6 border-b border-white/[0.06]">
              <h2 className="text-xl font-semibold text-white">Moje inzeráty</h2>
            </div>
            <div className="divide-y divide-white/[0.06]">
              {advertisements.length === 0 ? (
                <div className="p-12 text-center">
                  <p className="text-gray-500 mb-4">Zatiaľ ste nevytvorili žiadne inzeráty</p>
                  <button
                    type="button"
                    onClick={() => {
                      setActiveTab('create')
                      if (!editingAdId) setCreateWizardNonce((n) => n + 1)
                    }}
                    className="px-4 py-2 bg-accent text-white rounded-lg hover:bg-accent-light"
                  >
                    Pridať prvý inzerát
                  </button>
                </div>
              ) : (
                advertisements.map((ad) => (
                  <div key={ad.id} className="p-6 hover:bg-cardHover transition-colors">
                    <div className="flex items-start justify-between">
                      <div className="flex-1">
                        <div className="flex items-center gap-3 mb-2">
                          <h3 className="text-lg font-semibold text-white">{ad.title}</h3>
                          <span className={`px-2 py-1 text-xs rounded-full ${
                            ad.status === 'ACTIVE' ? 'bg-accent/15 text-accent' :
                            ad.status === 'PENDING' ? 'bg-yellow-900/25 text-yellow-400' :
                            ad.status === 'DRAFT' ? 'bg-dark-100 text-white/90' :
                            'bg-red-100 text-red-400'
                          }`}>
                            {ad.status === 'ACTIVE' ? 'Aktívny' :
                             ad.status === 'PENDING' ? 'Čaká na schválenie' :
                             ad.status === 'DRAFT' ? 'Koncept' :
                             'Neaktívny'}
                          </span>
                          {ad.priorityBoosted && ad.status === 'ACTIVE' && (
                            <span className="px-2 py-1 text-xs rounded-full bg-accent/15 text-accent font-medium">
                              Priorita
                            </span>
                          )}
                        </div>
                        <p className="text-gray-500 mb-2 line-clamp-2">{ad.description}</p>
                        <div className="flex items-center gap-4 text-sm text-gray-500">
                          {ad.price && <span>Cena: {ad.price}€</span>}
                          {ad.location && <span>Lokalita: {ad.location}</span>}
                          {ad.category && <span>Kategória: {ad.category.name}</span>}
                        </div>
                      </div>
                      <div className="flex items-center gap-2 ml-4">
                        <Link
                          href={`/inzerat/${ad.id}`}
                          className="p-2 text-accent hover:bg-accent/10 rounded-lg transition-colors"
                          title="Zobraziť"
                        >
                          <Eye className="w-4 h-4" />
                        </Link>
                        <button
                          onClick={() => handleEditAdvertisement(ad)}
                          className="p-2 text-gray-500 hover:bg-cardHover rounded-lg transition-colors"
                          title="Upraviť"
                        >
                          <Edit className="w-4 h-4" />
                        </button>
                        <button
                          onClick={() => handleDeleteAdvertisement(ad.id)}
                          className="p-2 text-red-400 hover:bg-red-900/20 rounded-lg transition-colors"
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

        {/* Favorites Tab */}
        {activeTab === 'favorites' && (
          <div className="card">
            <div className="p-6 border-b border-white/[0.06]">
              <h2 className="text-xl font-semibold text-white">Obľúbené inzeráty</h2>
            </div>
            <div className="divide-y divide-white/[0.06]">
              {favorites.length === 0 ? (
                <div className="p-12 text-center">
                  <Heart className="w-16 h-16 text-gray-300 mx-auto mb-4" />
                  <p className="text-gray-500 mb-4">Zatiaľ nemáte žiadne obľúbené inzeráty</p>
                  <p className="text-sm text-gray-500 mb-4">Kliknite na „Uložiť do obľúbených“ pri inzeráte, ktorý sa vám páči</p>
                  <Link
                    href="/"
                    className="inline-block px-4 py-2 bg-accent text-white rounded-lg hover:bg-accent-light"
                  >
                    Prehľadať inzeráty
                  </Link>
                </div>
              ) : (
                favorites.map((fav: any) => {
                  const ad = fav.advertisement
                  if (!ad) return null
                  return (
                    <div key={fav.id} className="p-6 hover:bg-cardHover transition-colors">
                      <div className="flex items-start justify-between">
                        <div className="flex-1">
                          <div className="flex items-center gap-3 mb-2">
                            <h3 className="text-lg font-semibold text-white">{ad.title}</h3>
                            {ad.status && (
                              <span className={`px-2 py-1 text-xs rounded-full ${
                                ad.status === 'ACTIVE' ? 'bg-accent/15 text-accent' :
                                ad.status === 'PENDING' ? 'bg-yellow-900/25 text-yellow-400' :
                                'bg-dark-100 text-white/90'
                              }`}>
                                {ad.status === 'ACTIVE' ? 'Aktívny' :
                                 ad.status === 'PENDING' ? 'Čaká na schválenie' : 'Neaktívny'}
                              </span>
                            )}
                          </div>
                          <p className="text-gray-500 mb-2 line-clamp-2">{ad.description}</p>
                          <div className="flex items-center gap-4 text-sm text-gray-500">
                            {ad.price && <span>Cena: {ad.price}€</span>}
                            {ad.location && <span>Lokalita: {ad.location}</span>}
                            {ad.category && <span>Kategória: {ad.category.name}</span>}
                          </div>
                        </div>
                        <div className="flex items-center gap-2 ml-4">
                          <Link
                            href={`/inzerat/${ad.id}`}
                            className="p-2 text-accent hover:bg-accent/10 rounded-lg transition-colors"
                            title="Zobraziť"
                          >
                            <Eye className="w-4 h-4" />
                          </Link>
                          <button
                            onClick={async () => {
                              try {
                                await api.removeFavorite(ad.id)
                                setFavorites((prev) => prev.filter((f: any) => f.advertisement?.id !== ad.id))
                              } catch (err: any) {
                                setError(err.message || 'Chyba pri odstránení')
                              }
                            }}
                            className="p-2 text-red-400 hover:bg-red-900/20 rounded-lg transition-colors"
                            title="Odstrániť z obľúbených"
                          >
                            <Heart className="w-4 h-4 fill-current" />
                          </button>
                        </div>
                      </div>
                    </div>
                  )
                })
              )}
            </div>
          </div>
        )}

        {/* Create Advertisement Tab */}
        {activeTab === 'create' && (
          <CreateAdvertisementWizard
            key={editingAdId ? `edit-${editingAdId}` : `new-${createWizardNonce}`}
            categories={categories}
            variant="embed"
            initialEditId={editingAdId}
            onCancelEdit={() => setEditingAdId(null)}
            onComplete={({ mode, advertisement }) => {
              if (mode === 'create') {
                setAdvertisements((prev) => [advertisement, ...prev])
              } else {
                setAdvertisements((prev) =>
                  prev.map((a) => (a.id === advertisement.id ? advertisement : a)),
                )
              }
              setEditingAdId(null)
              setActiveTab('advertisements')
              setSuccess(
                mode === 'create'
                  ? 'Inzerát bol úspešne vytvorený a čaká na schválenie'
                  : 'Inzerát bol úspešne aktualizovaný',
              )
              setTimeout(() => setSuccess(''), 4000)
            }}
          />
        )}

        {/* Messages Tab */}
        {activeTab === 'messages' && (
          <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
            {/* Messages List */}
            <div className="lg:col-span-2 card">
              <div className="p-4 border-b border-white/[0.06] flex items-center justify-between">
                <h2 className="text-lg font-semibold text-white">Správy</h2>
                <div className="flex gap-2">
                  <CustomSelect
                    value={messageFilter}
                    onChange={(v) => setMessageFilter(v as 'all' | 'unread' | 'inquiry' | 'system')}
                    className="min-w-[200px]"
                    options={[
                      { value: 'all', label: 'Všetky' },
                      { value: 'unread', label: 'Neprečítané' },
                      { value: 'inquiry', label: 'Dotazy' },
                      { value: 'system', label: 'Systémové' },
                    ]}
                  />
                </div>
              </div>
              <div className="divide-y divide-white/[0.06] max-h-[600px] overflow-y-auto">
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
                      className={`p-4 cursor-pointer hover:bg-cardHover transition-colors ${
                        message.status === 'UNREAD' ? 'bg-accent/10' : ''
                      } ${selectedMessage?.id === message.id ? 'bg-accent/10' : ''}`}
                    >
                      <div className="flex items-start justify-between">
                        <div className="flex-1">
                          <div className="flex items-center gap-2 mb-1">
                            <span className={`px-2 py-1 rounded text-xs font-medium ${getMessageTypeColor(message.type)}`}>
                              {getMessageTypeLabel(message.type)}
                            </span>
                            {message.status === 'UNREAD' && (
                              <span className="w-2 h-2 bg-accent rounded-full"></span>
                            )}
                          </div>
                          <h3 className="font-medium text-white mb-1">{message.subject}</h3>
                          <p className="text-sm text-gray-500 line-clamp-2">{message.content}</p>
                          {message.advertisement && (
                            <p className="text-xs text-gray-500 mt-1">
                              Inzerát: {message.advertisement.title}
                            </p>
                          )}
                          <p className="text-xs text-gray-500 mt-2">
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
                              className="p-1 text-gray-500 hover:text-accent"
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
                            className="p-1 text-gray-500 hover:text-gray-300"
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
            <div className="lg:col-span-1 card p-6 flex flex-col">
              {selectedMessage ? (
                selectedMessage.type === 'INQUIRY' && conversationMessages.length > 0 ? (
                  /* Chat view pre Dotaz na inzerát */
                  <div className="flex flex-col flex-1 min-h-0">
                    <div className="flex items-center justify-between mb-4">
                      <h3 className="text-lg font-semibold text-white">Konverzácia</h3>
                      <div className="flex items-center gap-2">
                        <button
                          onClick={async () => {
                            const root = conversationMessages.find((m) => !m.parentId) || conversationMessages[0]
                            if (root) {
                              await handleMarkAsArchived(root.id)
                              setSelectedMessage(null)
                              setConversationMessages([])
                            }
                          }}
                          className="p-2 text-gray-500 hover:text-gray-300"
                          title="Archivovať"
                        >
                          <Archive className="w-5 h-5" />
                        </button>
                        <button
                          onClick={() => {
                            setSelectedMessage(null)
                            setConversationMessages([])
                          }}
                          className="p-2 text-gray-500 hover:text-gray-300"
                        >
                          <X className="w-5 h-5" />
                        </button>
                      </div>
                    </div>
                    {conversationMessages[0]?.advertisement && (
                      <div className="mb-3 p-3 bg-dark-50 rounded-lg border border-white/[0.08]">
                        <p className="text-xs font-medium text-gray-500 mb-1">Inzerát:</p>
                        <Link href={`/inzerat/${conversationMessages[0].advertisement.id}`} className="text-sm text-accent hover:underline">
                          {conversationMessages[0].advertisement.title}
                        </Link>
                      </div>
                    )}
                    <div className="flex-1 overflow-y-auto space-y-3 mb-4 max-h-[320px] min-h-[200px]">
                      {conversationMessages.map((msg) => {
                        const isMe = msg.senderId === user?.id
                        return (
                          <div
                            key={msg.id}
                            className={`flex ${isMe ? 'justify-end' : 'justify-start'}`}
                          >
                            <div
                              className={`max-w-[85%] rounded-lg px-4 py-2 ${
                                isMe
                                  ? 'bg-accent text-white'
                                  : 'bg-dark-100 text-white'
                              }`}
                            >
                              {!isMe && msg.sender && (
                                <p className="text-xs font-medium text-gray-500 mb-1">
                                  {msg.sender.firstName} {msg.sender.lastName}
                                </p>
                              )}
                              {msg.content && (
                                <p className="text-sm whitespace-pre-wrap">{msg.content}</p>
                              )}
                              {msg.attachments && msg.attachments.length > 0 && (
                                <div className="mt-2 space-y-2 flex flex-wrap gap-2">
                                  {msg.attachments.map((att: string, i: number) => {
                                    const isImage = /^data:image\//i.test(att)
                                    const mime = att.match(/^data:([^;]+)/)?.[1] || ''
                                    const isPdf = mime.includes('pdf')
                                    const isWord = mime.includes('word') || mime.includes('msword') || mime.includes('document')
                                    return isImage ? (
                                      <button
                                        key={i}
                                        type="button"
                                        onClick={() => setLightboxImage(att)}
                                        className="block rounded-xl overflow-hidden shadow-md hover:shadow-xl transition-all duration-200 ring-1 ring-black/5 hover:ring-black/10 cursor-zoom-in text-left"
                                      >
                                        <img
                                          src={att}
                                          alt={`Fotka ${i + 1}`}
                                          className="max-w-[220px] max-h-[200px] w-auto h-auto object-cover block"
                                        />
                                      </button>
                                    ) : (
                                      <a
                                        key={i}
                                        href={att}
                                        target="_blank"
                                        rel="noopener noreferrer"
                                        download
                                        className={`flex items-center gap-3 px-4 py-3 rounded-xl transition-all duration-200 ${
                                          isMe
                                            ? 'bg-dark-200/95 text-white/90 hover:bg-dark-200 shadow-sm hover:shadow'
                                            : 'bg-dark text-white/90 border border-white/[0.08] hover:border-white/15 hover:shadow-sm'
                                        } min-w-[180px]`}
                                      >
                                        <div className={`flex-shrink-0 w-10 h-10 rounded-lg flex items-center justify-center ${
                                          isMe ? 'bg-[#c9a96e]/15 text-accent' : 'bg-dark-100 text-gray-500'
                                        }`}>
                                          <FileText className="w-5 h-5" />
                                        </div>
                                        <div className="flex-1 min-w-0">
                                          <p className="text-sm font-semibold text-white truncate">
                                            {isPdf ? 'PDF dokument' : isWord ? 'Word dokument' : 'Príloha'}
                                          </p>
                                          <p className="text-xs text-gray-500 flex items-center gap-1 mt-0.5">
                                            <Download className="w-3.5 h-3.5" />
                                            Stiahnuť
                                          </p>
                                        </div>
                                      </a>
                                    )
                                  })}
                                </div>
                              )}
                              <p className={`text-xs mt-2 ${msg.attachments?.length ? 'pt-2 border-t ' + (isMe ? 'border-white/25' : 'border-white/[0.08]') : ''} ${isMe ? 'text-white/85' : 'text-gray-500'}`}>
                                {new Date(msg.createdAt).toLocaleString('sk-SK', {
                                  day: 'numeric',
                                  month: 'short',
                                  hour: '2-digit',
                                  minute: '2-digit',
                                })}
                              </p>
                            </div>
                          </div>
                        )
                      })}
                    </div>
                    {canConfirmInquiryCalendar &&
                      inquiryParsedRange &&
                      !inquirySellerRespondedToOrder &&
                      inquiryOrderPanelHiddenForRootId !== inquiryThreadRoot?.id && (
                      <div className="mb-3 rounded-lg border border-accent/25 bg-accent/5 px-3 py-3 space-y-2">
                        <p className="text-xs text-gray-400">
                          Žiadosť o termín:{' '}
                          <span className="text-white font-medium">
                            {new Date(inquiryParsedRange.startYmd + 'T12:00:00.000Z').toLocaleDateString('sk-SK')} –{' '}
                            {new Date(inquiryParsedRange.endYmd + 'T12:00:00.000Z').toLocaleDateString('sk-SK')}
                          </span>
                        </p>
                        <p className="text-xs text-gray-500">
                          Ste predávajúci: môžete žiadosť prijať (obsadí sa váš kalendár) alebo odmietnuť (bez zmeny v kalendári).
                        </p>
                        <div className="flex flex-col gap-2 sm:flex-row">
                          <button
                            type="button"
                            disabled={inquiryOrderBusy !== null}
                            onClick={() => void handleAcceptInquiryOrder()}
                            className="flex-1 rounded-lg bg-accent px-3 py-2 text-sm font-medium text-white hover:bg-accent-light disabled:opacity-50"
                          >
                            {inquiryOrderBusy === 'accept' ? 'Spracovávam…' : 'Prijať a obsadiť v kalendári'}
                          </button>
                          <button
                            type="button"
                            disabled={inquiryOrderBusy !== null}
                            onClick={() => void handleDeclineInquiryOrder()}
                            className="flex-1 rounded-lg border border-white/15 bg-transparent px-3 py-2 text-sm font-medium text-gray-200 hover:bg-white/[0.06] disabled:opacity-50"
                          >
                            {inquiryOrderBusy === 'decline' ? 'Odosielam…' : 'Odmietnuť'}
                          </button>
                        </div>
                      </div>
                    )}
                    <div className="border-t border-white/[0.08] pt-3">
                      {replyAttachments.length > 0 && (
                        <div className="flex flex-wrap gap-2 mb-2">
                          {replyAttachments.map((att, i) => {
                            const isImg = /^data:image\//i.test(att)
                            const mime = att.match(/^data:([^;]+)/)?.[1] || ''
                            const isPdf = mime.includes('pdf')
                            const isWord = mime.includes('word') || mime.includes('msword')
                            return (
                              <div key={i} className="relative">
                                {isImg ? (
                                  <img
                                    src={att}
                                    alt=""
                                    className="w-20 h-20 object-cover rounded-xl border border-white/[0.08] shadow-sm"
                                  />
                                ) : (
                                  <div className="w-20 h-20 rounded-xl border border-white/[0.08] flex flex-col items-center justify-center bg-dark">
                                    <FileText className="w-8 h-8 text-gray-500" />
                                    <span className="text-xs font-medium text-gray-500 mt-1">{isPdf ? 'PDF' : isWord ? 'Word' : 'Súbor'}</span>
                                  </div>
                                )}
                                <button
                                  type="button"
                                  onClick={() =>
                                    setReplyAttachments((prev) => prev.filter((_, j) => j !== i))
                                  }
                                  className="absolute -top-1 -right-1 w-6 h-6 bg-red-500 text-white rounded-full flex items-center justify-center hover:bg-red-600 shadow-md"
                                >
                                  <X className="w-3.5 h-3.5" />
                                </button>
                              </div>
                            )
                          })}
                        </div>
                      )}
                      <div className="flex gap-2 mb-2">
                        <label className="flex items-center justify-center w-10 h-10 border border-white/10 rounded-lg cursor-pointer hover:bg-cardHover transition-colors flex-shrink-0">
                          <Paperclip className="w-5 h-5 text-gray-500" />
                          <input
                            type="file"
                            multiple
                            accept="image/*,.pdf,.doc,.docx,.txt"
                            onChange={handleReplyFileSelect}
                            className="hidden"
                          />
                        </label>
                        <textarea
                          value={replyContent}
                          onChange={(e) => setReplyContent(e.target.value)}
                          placeholder="Napíšte odpoveď... (môžete pridať fotky alebo súbory)"
                          rows={2}
                          className="flex-1 bg-dark-100 border border-white/10 rounded-lg px-4 py-2 text-white placeholder-white/40 focus:outline-none focus:ring-2 focus:ring-accent focus:border-transparent resize-none text-sm"
                        />
                      </div>
                      <button
                        onClick={handleSendReply}
                        disabled={
                          (!replyContent.trim() && replyAttachments.length === 0) || replySubmitting
                        }
                        className="w-full px-4 py-2 bg-accent hover:bg-accent-light disabled:bg-dark-300 disabled:cursor-not-allowed text-white rounded-lg text-sm font-medium"
                      >
                        {replySubmitting ? 'Odosielam...' : 'Odoslať odpoveď'}
                      </button>
                    </div>
                  </div>
                ) : (
                  /* Statický detail pre ostatné typy správ */
                  <div>
                    <div className="flex items-center justify-between mb-4">
                      <h3 className="text-lg font-semibold text-white">Detail správy</h3>
                      <button
                        onClick={() => {
                          setSelectedMessage(null)
                          setConversationMessages([])
                        }}
                        className="text-gray-500 hover:text-gray-300"
                      >
                        <X className="w-5 h-5" />
                      </button>
                    </div>
                    <div className="mb-4">
                      <span className={`px-2 py-1 rounded text-xs font-medium ${getMessageTypeColor(selectedMessage.type)}`}>
                        {getMessageTypeLabel(selectedMessage.type)}
                      </span>
                    </div>
                    <h4 className="font-medium text-white mb-2">{selectedMessage.subject}</h4>
                    {selectedMessage.sender && (
                      <p className="text-sm text-gray-500 mb-2">
                        Od: {selectedMessage.sender.firstName} {selectedMessage.sender.lastName} ({selectedMessage.sender.email})
                      </p>
                    )}
                    {selectedMessage.advertisement && (
                      <div className="mb-4 p-3 bg-dark-50 rounded-lg border border-white/[0.08]">
                        <p className="text-sm font-medium text-white mb-1">Súvisiaci inzerát:</p>
                        <Link href={`/inzerat/${selectedMessage.advertisement.id}`} className="text-sm text-accent hover:underline">
                          {selectedMessage.advertisement.title}
                        </Link>
                      </div>
                    )}
                    <div className="text-sm text-gray-300 whitespace-pre-wrap mb-4">
                      {selectedMessage.content}
                    </div>
                    {selectedMessage.metadata && (
                      <div className="mb-4 p-3 bg-dark-50 rounded-lg border border-white/[0.08]">
                        <p className="text-xs text-gray-500">
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
                    <p className="text-xs text-gray-500">
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
                          className="flex-1 px-4 py-2 bg-accent hover:bg-accent-light text-white rounded-lg text-sm"
                        >
                          Označiť ako prečítané
                        </button>
                      )}
                      <button
                        onClick={() => handleMarkAsArchived(selectedMessage.id)}
                        className="flex-1 px-4 py-2 border border-white/10 text-gray-300 rounded-lg text-sm hover:bg-cardHover"
                      >
                        Archivovať
                      </button>
                    </div>
                  </div>
                )
              ) : (
                <div className="text-center text-gray-500 py-8">
                  <MessageSquare className="w-12 h-12 mx-auto mb-4 text-gray-300" />
                  <p>Vyberte správu na zobrazenie</p>
                </div>
              )}
            </div>
          </div>
        )}

        {activeTab === 'calendar' && (
          <ProfileCalendar refreshKey={calendarRefreshKey} />
        )}
      </div>

      {/* Lightbox pre obrázky v chate */}
      {lightboxImage && (
        <div
          className="fixed inset-0 z-50 bg-black/90 flex items-center justify-center p-4"
          onClick={() => setLightboxImage(null)}
        >
          <button
            type="button"
            onClick={() => setLightboxImage(null)}
            className="absolute top-4 right-4 p-2 text-white hover:bg-dark-200/10 rounded-lg transition-colors"
            aria-label="Zavrieť"
          >
            <X className="w-8 h-8" />
          </button>
          <img
            src={lightboxImage}
            alt="Zväčšený obrázok"
            className="max-w-full max-h-[90vh] w-auto h-auto object-contain rounded-lg"
            onClick={(e) => e.stopPropagation()}
          />
        </div>
      )}

      <Footer />
    </div>
  )
}

export default function DashboardPage() {
  return (
    <Suspense
      fallback={
        <div className="min-h-screen bg-dark">
          <Header />
          <div className="flex min-h-[60vh] items-center justify-center">
            <div className="text-gray-500">Načítavam...</div>
          </div>
          <Footer />
        </div>
      }
    >
      <DashboardPageInner />
    </Suspense>
  )
}
