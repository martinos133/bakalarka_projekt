'use client'

import { useState, useEffect, useRef, useCallback } from 'react'
import { useRouter } from 'next/navigation'
import { isAuthenticated, getAuthUser } from '@/lib/auth'
import api from '@/lib/api'
import DashboardLayout from '@/components/DashboardLayout'
import {
  Search,
  Send,
  MessageSquarePlus,
  Check,
  CheckCheck,
  ArrowLeft,
  Users,
  Paperclip,
  FileText,
  Image as ImageIcon,
  Film,
  File,
  X,
  Download,
} from 'lucide-react'

interface Partner {
  id: string
  email: string
  firstName?: string
  lastName?: string
  lastLoginAt?: string
}

interface Conversation {
  id: string
  partner: Partner
  lastMessage: {
    content: string
    senderId: string
    createdAt: string
    read: boolean
  } | null
  createdAt: string
}

interface Attachment {
  name: string
  type: string
  size: number
  data: string
}

interface ChatMessage {
  id: string
  content: string
  attachments?: Attachment[] | null
  senderId: string
  sender: Partner
  conversationId: string
  readAt: string | null
  createdAt: string
}

function formatFileSize(bytes: number) {
  if (bytes < 1024) return `${bytes} B`
  if (bytes < 1024 * 1024) return `${(bytes / 1024).toFixed(1)} KB`
  return `${(bytes / (1024 * 1024)).toFixed(1)} MB`
}

function getFileIcon(type: string) {
  if (type.startsWith('image/')) return ImageIcon
  if (type.startsWith('video/')) return Film
  if (type.includes('pdf') || type.includes('document') || type.includes('text')) return FileText
  return File
}

function isOnline(lastLoginAt?: string | null) {
  if (!lastLoginAt) return false
  return Date.now() - new Date(lastLoginAt).getTime() < 5 * 60 * 1000
}

function getInitials(p: Partner) {
  const f = p.firstName?.charAt(0) || ''
  const l = p.lastName?.charAt(0) || ''
  return (f + l).toUpperCase() || p.email.charAt(0).toUpperCase()
}

function getName(p: Partner) {
  if (p.firstName || p.lastName) return `${p.firstName || ''} ${p.lastName || ''}`.trim()
  return p.email
}

function formatTime(date: string) {
  const d = new Date(date)
  return `${String(d.getHours()).padStart(2, '0')}:${String(d.getMinutes()).padStart(2, '0')}`
}

function formatConvDate(date: string) {
  const d = new Date(date)
  const now = new Date()
  const diff = now.getTime() - d.getTime()
  const days = Math.floor(diff / 86400000)

  if (days === 0) return formatTime(date)
  if (days === 1) return 'Včera'
  if (days < 7) return d.toLocaleDateString('sk-SK', { weekday: 'short' })
  return d.toLocaleDateString('sk-SK', { day: 'numeric', month: 'short' })
}

function groupByDate(messages: ChatMessage[]) {
  const groups: { label: string; messages: ChatMessage[] }[] = []
  let currentLabel = ''

  for (const msg of messages) {
    const d = new Date(msg.createdAt)
    const now = new Date()
    const diff = Math.floor((now.getTime() - d.getTime()) / 86400000)
    let label: string

    if (diff === 0) label = 'Dnes'
    else if (diff === 1) label = 'Včera'
    else label = d.toLocaleDateString('sk-SK', { day: 'numeric', month: 'long', year: 'numeric' })

    if (label !== currentLabel) {
      groups.push({ label, messages: [msg] })
      currentLabel = label
    } else {
      groups[groups.length - 1].messages.push(msg)
    }
  }
  return groups
}

export default function TeamChatPage() {
  const router = useRouter()
  const currentUser = getAuthUser()

  const [conversations, setConversations] = useState<Conversation[]>([])
  const [unreadCounts, setUnreadCounts] = useState<Record<string, number>>({})
  const [activeConvId, setActiveConvId] = useState<string | null>(null)
  const [messages, setMessages] = useState<ChatMessage[]>([])
  const [hasMore, setHasMore] = useState(false)
  const [nextCursor, setNextCursor] = useState<string | null>(null)
  const [input, setInput] = useState('')
  const [sending, setSending] = useState(false)
  const [search, setSearch] = useState('')
  const [showNewChat, setShowNewChat] = useState(false)
  const [teamMembers, setTeamMembers] = useState<Partner[]>([])
  const [memberSearch, setMemberSearch] = useState('')
  const [mobileShowChat, setMobileShowChat] = useState(false)
  const [pendingFiles, setPendingFiles] = useState<Attachment[]>([])

  const fileInputRef = useRef<HTMLInputElement>(null)
  const messagesEndRef = useRef<HTMLDivElement>(null)
  const messagesContainerRef = useRef<HTMLDivElement>(null)
  const inputRef = useRef<HTMLTextAreaElement>(null)
  const pollRef = useRef<ReturnType<typeof setInterval> | null>(null)

  useEffect(() => {
    if (!isAuthenticated()) { router.push('/login'); return }
    loadConversations()
    loadUnread()

    const interval = setInterval(() => {
      loadConversations()
      loadUnread()
    }, 5000)

    return () => clearInterval(interval)
  }, [])

  const loadConversations = async () => {
    try {
      const data = await api.getChatConversations()
      setConversations(data)
    } catch {}
  }

  const loadUnread = async () => {
    try {
      const data = await api.getChatUnread()
      setUnreadCounts(data.counts || {})
    } catch {}
  }

  const loadMessages = useCallback(async (convId: string, cursorId?: string) => {
    try {
      const data = await api.getChatMessages(convId, cursorId)
      if (cursorId) {
        setMessages((prev) => [...data.messages, ...prev])
      } else {
        setMessages(data.messages)
      }
      setHasMore(data.hasMore)
      setNextCursor(data.nextCursor)
    } catch {}
  }, [])

  const selectConversation = useCallback(async (convId: string) => {
    setActiveConvId(convId)
    setMessages([])
    setMobileShowChat(true)
    await loadMessages(convId)
    api.markChatRead(convId).catch(() => {})
    loadUnread()

    if (pollRef.current) clearInterval(pollRef.current)
    pollRef.current = setInterval(async () => {
      try {
        const data = await api.getChatMessages(convId)
        setMessages(data.messages)
        setHasMore(data.hasMore)
        setNextCursor(data.nextCursor)
        api.markChatRead(convId).catch(() => {})
        loadUnread()
      } catch {}
    }, 3000)
  }, [loadMessages])

  useEffect(() => {
    return () => {
      if (pollRef.current) clearInterval(pollRef.current)
    }
  }, [])

  useEffect(() => {
    if (messagesEndRef.current) {
      messagesEndRef.current.scrollIntoView({ behavior: 'smooth' })
    }
  }, [messages])

  const handleFileSelect = (e: React.ChangeEvent<HTMLInputElement>) => {
    const files = e.target.files
    if (!files) return

    Array.from(files).forEach((file) => {
      if (file.size > 10 * 1024 * 1024) {
        alert(`Súbor "${file.name}" je príliš veľký (max 10 MB)`)
        return
      }
      const reader = new FileReader()
      reader.onload = () => {
        setPendingFiles((prev) => [
          ...prev,
          { name: file.name, type: file.type, size: file.size, data: reader.result as string },
        ])
      }
      reader.readAsDataURL(file)
    })

    e.target.value = ''
  }

  const removePendingFile = (index: number) => {
    setPendingFiles((prev) => prev.filter((_, i) => i !== index))
  }

  const handleSend = async () => {
    if ((!input.trim() && pendingFiles.length === 0) || !activeConvId || sending) return
    const text = input.trim()
    const files = [...pendingFiles]
    setInput('')
    setPendingFiles([])
    setSending(true)

    try {
      const newMsg = await api.sendChatMessage(
        activeConvId,
        text,
        files.length > 0 ? files : undefined,
      )
      setMessages((prev) => [...prev, newMsg])
      loadConversations()
    } catch {
      setInput(text)
      setPendingFiles(files)
    } finally {
      setSending(false)
      inputRef.current?.focus()
    }
  }

  const handleKeyDown = (e: React.KeyboardEvent) => {
    if (e.key === 'Enter' && !e.shiftKey) {
      e.preventDefault()
      handleSend()
    }
  }

  const startNewChat = async (partnerId: string) => {
    try {
      const conv = await api.createChatConversation(partnerId)
      setShowNewChat(false)
      await loadConversations()
      await selectConversation(conv.id)
    } catch (err) {
      console.error('startNewChat error', err)
    }
  }

  const openNewChatModal = async () => {
    try {
      const members = await api.getChatMembers()
      setTeamMembers(members)
      setShowNewChat(true)
      setMemberSearch('')
    } catch {}
  }

  const activeConv = conversations.find((c) => c.id === activeConvId)
  const filteredConversations = conversations.filter((c) => {
    if (!search) return true
    const name = getName(c.partner).toLowerCase()
    return name.includes(search.toLowerCase()) || c.partner.email.toLowerCase().includes(search.toLowerCase())
  })

  const filteredMembers = teamMembers.filter((m) => {
    if (!memberSearch) return true
    const name = getName(m).toLowerCase()
    return name.includes(memberSearch.toLowerCase()) || m.email.toLowerCase().includes(memberSearch.toLowerCase())
  })

  const messageGroups = groupByDate(messages)

  return (
    <DashboardLayout>
    <div className="h-[calc(100vh-10rem)] flex rounded-2xl overflow-hidden border border-white/[0.06] bg-dark">
      {/* Left panel - Conversations */}
      <div className={`w-full md:w-[360px] flex-shrink-0 flex flex-col bg-card border-r border-white/[0.06] ${mobileShowChat ? 'hidden md:flex' : 'flex'}`}>
        {/* Header */}
        <div className="p-4 border-b border-white/[0.06]">
          <div className="flex items-center justify-between mb-3">
            <h1 className="text-lg font-bold text-white">Správy</h1>
            <button
              onClick={openNewChatModal}
              className="w-9 h-9 rounded-xl bg-accent/10 hover:bg-accent/20 flex items-center justify-center transition-colors"
              title="Nová konverzácia"
            >
              <MessageSquarePlus className="w-4.5 h-4.5 text-accent" />
            </button>
          </div>
          <div className="relative">
            <Search className="absolute left-4 top-1/2 -translate-y-1/2 w-4 h-4 text-muted pointer-events-none" />
            <input
              type="text"
              placeholder="Hľadať konverzáciu..."
              value={search}
              onChange={(e) => setSearch(e.target.value)}
              className="w-full pl-14 pr-3 py-2 text-sm"
              style={{ paddingLeft: '3.75rem' }}
            />
          </div>
        </div>

        {/* Conversation list */}
        <div className="flex-1 overflow-y-auto">
          {filteredConversations.length === 0 ? (
            <div className="flex flex-col items-center justify-center h-full text-center p-6">
              <Users className="w-12 h-12 text-white/10 mb-3" />
              <p className="text-sm text-white/30">
                {conversations.length === 0 ? 'Zatiaľ žiadne konverzácie' : 'Žiadne výsledky'}
              </p>
              <button
                onClick={openNewChatModal}
                className="mt-3 text-sm text-accent hover:text-accent-light transition-colors"
              >
                Začať novú konverzáciu
              </button>
            </div>
          ) : (
            filteredConversations.map((conv) => {
              const isActive = conv.id === activeConvId
              const online = isOnline(conv.partner.lastLoginAt)
              const unread = unreadCounts[conv.id] || 0

              return (
                <button
                  key={conv.id}
                  onClick={() => selectConversation(conv.id)}
                  className={`w-full flex items-center gap-3 px-4 py-3 transition-colors text-left ${
                    isActive ? 'bg-accent/10' : 'hover:bg-white/[0.04]'
                  }`}
                >
                  {/* Avatar */}
                  <div className="relative flex-shrink-0">
                    <div className={`w-11 h-11 rounded-full flex items-center justify-center text-sm font-semibold ${
                      isActive ? 'bg-accent/20 text-accent' : 'bg-white/[0.08] text-white/60'
                    }`}>
                      {getInitials(conv.partner)}
                    </div>
                    {online && (
                      <div className="absolute -bottom-0.5 -right-0.5 w-3.5 h-3.5 rounded-full bg-green-500 border-2 border-card" />
                    )}
                  </div>

                  {/* Info */}
                  <div className="flex-1 min-w-0">
                    <div className="flex items-center justify-between">
                      <span className={`text-sm truncate ${unread > 0 ? 'font-semibold text-white' : 'text-white/80'}`}>
                        {getName(conv.partner)}
                      </span>
                      {conv.lastMessage && (
                        <span className="text-[10px] text-muted flex-shrink-0 ml-2">
                          {formatConvDate(conv.lastMessage.createdAt)}
                        </span>
                      )}
                    </div>
                    <div className="flex items-center justify-between mt-0.5">
                      <p className={`text-xs truncate flex-1 ${unread > 0 ? 'text-white/70 font-medium' : 'text-white/40'}`}>
                        {conv.lastMessage ? (
                          <>
                            {conv.lastMessage.senderId === currentUser?.id && (
                              <span className="inline-flex mr-1 align-text-bottom">
                                {conv.lastMessage.read
                                  ? <CheckCheck className="w-3.5 h-3.5 text-accent inline" />
                                  : <Check className="w-3.5 h-3.5 text-muted inline" />}
                              </span>
                            )}
                            {conv.lastMessage.content}
                          </>
                        ) : (
                          <span className="italic">Začnite konverzáciu</span>
                        )}
                      </p>
                      {unread > 0 && (
                        <span className="ml-2 min-w-[20px] h-5 rounded-full bg-accent text-dark text-[10px] font-bold flex items-center justify-center px-1.5">
                          {unread}
                        </span>
                      )}
                    </div>
                  </div>
                </button>
              )
            })
          )}
        </div>
      </div>

      {/* Right panel - Messages */}
      <div className={`flex-1 flex flex-col bg-dark ${!mobileShowChat && !activeConvId ? 'hidden md:flex' : 'flex'} ${mobileShowChat ? '' : !activeConvId ? '' : 'hidden md:flex'}`}>
        {activeConv ? (
          <>
            {/* Chat header */}
            <div className="flex items-center gap-3 px-5 py-3 border-b border-white/[0.06] bg-card/50 backdrop-blur-sm">
              <button
                onClick={() => { setMobileShowChat(false); setActiveConvId(null) }}
                className="md:hidden w-8 h-8 rounded-lg hover:bg-white/[0.06] flex items-center justify-center"
              >
                <ArrowLeft className="w-4 h-4 text-white/60" />
              </button>
              <div className="relative">
                <div className="w-10 h-10 rounded-full bg-accent/15 flex items-center justify-center text-sm font-semibold text-accent">
                  {getInitials(activeConv.partner)}
                </div>
                {isOnline(activeConv.partner.lastLoginAt) && (
                  <div className="absolute -bottom-0.5 -right-0.5 w-3 h-3 rounded-full bg-green-500 border-2 border-card" />
                )}
              </div>
              <div>
                <p className="text-sm font-semibold text-white">{getName(activeConv.partner)}</p>
                <p className="text-[11px] text-muted">
                  {isOnline(activeConv.partner.lastLoginAt)
                    ? 'Online'
                    : activeConv.partner.lastLoginAt
                      ? `Naposledy ${new Date(activeConv.partner.lastLoginAt).toLocaleString('sk-SK')}`
                      : 'Offline'}
                </p>
              </div>
            </div>

            {/* Messages */}
            <div ref={messagesContainerRef} className="flex-1 overflow-y-auto px-4 py-4 space-y-1 chat-bg">
              {hasMore && (
                <div className="text-center mb-4">
                  <button
                    onClick={() => nextCursor && loadMessages(activeConvId!, nextCursor)}
                    className="text-xs text-accent hover:text-accent-light transition-colors px-4 py-1.5 rounded-full bg-white/[0.04]"
                  >
                    Načítať staršie správy
                  </button>
                </div>
              )}

              {messageGroups.map((group) => (
                <div key={group.label}>
                  <div className="flex items-center justify-center my-4">
                    <span className="px-3 py-1 rounded-full bg-white/[0.06] text-[11px] text-white/40 font-medium">
                      {group.label}
                    </span>
                  </div>
                  {group.messages.map((msg, idx) => {
                    const isMine = msg.senderId === currentUser?.id
                    const isLast = idx === group.messages.length - 1
                    const prevMsg = idx > 0 ? group.messages[idx - 1] : null
                    const showAvatar = !isMine && (!prevMsg || prevMsg.senderId !== msg.senderId)

                    return (
                      <div
                        key={msg.id}
                        className={`flex ${isMine ? 'justify-end' : 'justify-start'} ${prevMsg?.senderId === msg.senderId ? 'mt-0.5' : 'mt-3'}`}
                      >
                        {!isMine && (
                          <div className="w-7 flex-shrink-0 mr-1.5">
                            {showAvatar && (
                              <div className="w-7 h-7 rounded-full bg-white/[0.08] flex items-center justify-center text-[10px] font-semibold text-white/50 mt-0.5">
                                {getInitials(msg.sender)}
                              </div>
                            )}
                          </div>
                        )}
                        <div
                          className={`max-w-[70%] px-3 py-2 rounded-2xl text-sm leading-relaxed relative ${
                            isMine
                              ? 'bg-accent text-dark rounded-br-md'
                              : 'bg-white/[0.08] text-white/90 rounded-bl-md'
                          }`}
                        >
                          {msg.attachments && Array.isArray(msg.attachments) && msg.attachments.length > 0 && (
                            <div className="space-y-1.5 mb-1">
                              {(msg.attachments as Attachment[]).map((att, ai) => {
                                const isImage = att.type?.startsWith('image/')
                                const FileIcon = getFileIcon(att.type)
                                return isImage ? (
                                  <a key={ai} href={att.data} target="_blank" rel="noopener noreferrer" className="block">
                                    <img
                                      src={att.data}
                                      alt={att.name}
                                      className="max-w-[240px] max-h-[200px] rounded-lg object-cover cursor-pointer"
                                    />
                                  </a>
                                ) : (
                                  <a
                                    key={ai}
                                    href={att.data}
                                    download={att.name}
                                    className={`flex items-center gap-2 p-2 rounded-lg transition-colors ${
                                      isMine ? 'bg-dark/10 hover:bg-dark/15' : 'bg-white/[0.06] hover:bg-white/[0.1]'
                                    }`}
                                  >
                                    <FileIcon className={`w-5 h-5 flex-shrink-0 ${isMine ? 'text-dark/60' : 'text-accent'}`} />
                                    <div className="flex-1 min-w-0">
                                      <p className={`text-xs font-medium truncate ${isMine ? 'text-dark/80' : 'text-white/80'}`}>{att.name}</p>
                                      <p className={`text-[10px] ${isMine ? 'text-dark/40' : 'text-white/30'}`}>{formatFileSize(att.size)}</p>
                                    </div>
                                    <Download className={`w-3.5 h-3.5 flex-shrink-0 ${isMine ? 'text-dark/40' : 'text-white/30'}`} />
                                  </a>
                                )
                              })}
                            </div>
                          )}
                          {msg.content && <span className="whitespace-pre-wrap break-words">{msg.content}</span>}
                          <span className={`text-[10px] float-right mt-1 ml-2 ${isMine ? 'text-dark/50' : 'text-white/30'}`}>
                            {formatTime(msg.createdAt)}
                            {isMine && (
                              <span className="inline-flex ml-0.5 align-text-bottom">
                                {msg.readAt
                                  ? <CheckCheck className="w-3.5 h-3.5 text-dark/60 inline" />
                                  : <Check className="w-3.5 h-3.5 text-dark/40 inline" />}
                              </span>
                            )}
                          </span>
                        </div>
                      </div>
                    )
                  })}
                </div>
              ))}
              <div ref={messagesEndRef} />
            </div>

            {/* Input */}
            <div className="border-t border-white/[0.06] bg-card/50 backdrop-blur-sm">
              {/* Pending files preview */}
              {pendingFiles.length > 0 && (
                <div className="px-4 pt-3 flex gap-2 flex-wrap">
                  {pendingFiles.map((f, i) => {
                    const isImage = f.type?.startsWith('image/')
                    const FileIcon = getFileIcon(f.type)
                    return (
                      <div
                        key={i}
                        className="relative group rounded-xl bg-white/[0.06] border border-white/[0.08] overflow-hidden"
                      >
                        {isImage ? (
                          <img src={f.data} alt={f.name} className="h-16 w-16 object-cover" />
                        ) : (
                          <div className="h-16 w-16 flex flex-col items-center justify-center px-1">
                            <FileIcon className="w-5 h-5 text-accent mb-1" />
                            <p className="text-[8px] text-white/50 truncate w-full text-center">{f.name}</p>
                          </div>
                        )}
                        <button
                          onClick={() => removePendingFile(i)}
                          className="absolute -top-1 -right-1 w-5 h-5 rounded-full bg-red-500 text-white flex items-center justify-center opacity-0 group-hover:opacity-100 transition-opacity"
                        >
                          <X className="w-3 h-3" />
                        </button>
                      </div>
                    )
                  })}
                </div>
              )}

              <div className="flex items-end gap-2 px-4 py-3">
                <input
                  ref={fileInputRef}
                  type="file"
                  multiple
                  className="hidden"
                  onChange={handleFileSelect}
                  accept="image/*,video/*,.pdf,.doc,.docx,.xls,.xlsx,.ppt,.pptx,.txt,.zip,.rar"
                />
                <button
                  onClick={() => fileInputRef.current?.click()}
                  className="w-[42px] h-[42px] rounded-2xl flex items-center justify-center flex-shrink-0 bg-white/[0.06] hover:bg-white/[0.1] text-white/50 hover:text-white/80 transition-colors"
                  title="Priložiť súbor"
                >
                  <Paperclip className="w-4.5 h-4.5" />
                </button>
                <textarea
                  ref={inputRef}
                  value={input}
                  onChange={(e) => setInput(e.target.value)}
                  onKeyDown={handleKeyDown}
                  placeholder="Napíšte správu..."
                  rows={1}
                  className="flex-1 resize-none py-2.5 px-4 text-sm max-h-[120px] !rounded-2xl"
                  style={{ minHeight: '42px' }}
                  onInput={(e) => {
                    const el = e.currentTarget
                    el.style.height = 'auto'
                    el.style.height = Math.min(el.scrollHeight, 120) + 'px'
                  }}
                />
                <button
                  onClick={handleSend}
                  disabled={(!input.trim() && pendingFiles.length === 0) || sending}
                  className={`w-[42px] h-[42px] rounded-2xl flex items-center justify-center flex-shrink-0 transition-all ${
                    input.trim() || pendingFiles.length > 0
                      ? 'bg-accent hover:bg-accent-light text-dark'
                      : 'bg-white/[0.06] text-white/20'
                  }`}
                >
                  <Send className="w-4 h-4" />
                </button>
              </div>
            </div>
          </>
        ) : (
          <div className="flex-1 flex flex-col items-center justify-center text-center p-8">
            <div className="w-20 h-20 rounded-full bg-white/[0.04] flex items-center justify-center mb-5">
              <MessageSquarePlus className="w-8 h-8 text-white/15" />
            </div>
            <h2 className="text-lg font-semibold text-white/30 mb-1">Tímový chat</h2>
            <p className="text-sm text-white/20 mb-6 max-w-xs">
              Vyberte konverzáciu alebo začnite novú so členom tímu
            </p>
            <button
              onClick={openNewChatModal}
              className="btn-primary"
            >
              <MessageSquarePlus className="w-4 h-4" />
              Nová konverzácia
            </button>
          </div>
        )}
      </div>

      {/* New chat modal */}
      {showNewChat && (
        <div className="modal-overlay" onClick={() => setShowNewChat(false)}>
          <div className="modal-panel-sm" onClick={(e) => e.stopPropagation()}>
            <div className="px-5 py-4 border-b border-white/[0.06]">
              <h2 className="text-base font-semibold text-white">Nová konverzácia</h2>
              <p className="text-xs text-muted mt-1">Vyberte člena tímu</p>
            </div>

            <div className="p-4">
              <div className="relative mb-3">
                <Search className="absolute left-4 top-1/2 -translate-y-1/2 w-4 h-4 text-muted pointer-events-none" />
                <input
                  type="text"
                  placeholder="Hľadať..."
                  value={memberSearch}
                  onChange={(e) => setMemberSearch(e.target.value)}
                  className="w-full pl-14 pr-3 py-2 text-sm"
                  style={{ paddingLeft: '3.75rem' }}
                  autoFocus
                />
              </div>

              <div className="max-h-[300px] overflow-y-auto space-y-1">
                {filteredMembers.length === 0 ? (
                  <p className="text-sm text-white/30 text-center py-6">Žiadni členovia tímu</p>
                ) : (
                  filteredMembers.map((member) => {
                    const online = isOnline(member.lastLoginAt)
                    return (
                      <button
                        key={member.id}
                        onClick={() => startNewChat(member.id)}
                        className="w-full flex items-center gap-3 px-3 py-2.5 rounded-xl hover:bg-white/[0.06] transition-colors text-left"
                      >
                        <div className="relative">
                          <div className="w-10 h-10 rounded-full bg-white/[0.08] flex items-center justify-center text-sm font-semibold text-white/60">
                            {getInitials(member)}
                          </div>
                          {online && (
                            <div className="absolute -bottom-0.5 -right-0.5 w-3 h-3 rounded-full bg-green-500 border-2 border-card" />
                          )}
                        </div>
                        <div className="flex-1 min-w-0">
                          <p className="text-sm text-white font-medium truncate">{getName(member)}</p>
                          <p className="text-xs text-muted truncate">{member.email}</p>
                        </div>
                        <span className={`text-[10px] ${online ? 'text-green-400' : 'text-white/25'}`}>
                          {online ? 'Online' : 'Offline'}
                        </span>
                      </button>
                    )
                  })
                )}
              </div>
            </div>

            <div className="px-5 py-3 border-t border-white/[0.06] flex justify-end">
              <button onClick={() => setShowNewChat(false)} className="btn-ghost">
                Zavrieť
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
    </DashboardLayout>
  )
}
