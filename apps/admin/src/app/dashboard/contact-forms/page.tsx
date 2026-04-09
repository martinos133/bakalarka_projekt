'use client'

import { useEffect, useState } from 'react'
import { useRouter } from 'next/navigation'
import { isAuthenticated } from '@/lib/auth'
import { api } from '@/lib/api'
import { Reply, X } from 'lucide-react'
import DashboardLayout from '@/components/DashboardLayout'
import Select from '@/components/Select'

interface MessageSender {
  id: string
  email: string
  firstName?: string | null
  lastName?: string | null
}

interface MessageRecipient {
  id: string
  email: string
  firstName?: string | null
  lastName?: string | null
}

interface MessageAdvertisement {
  id: string
  title: string
  images?: string[]
}

interface AdminMessage {
  id: string
  type: string
  subject: string
  content: string
  status: string
  createdAt: string
  readAt?: string | null
  sender?: MessageSender | null
  recipient?: MessageRecipient | null
  advertisement?: MessageAdvertisement | null
}

const TYPE_LABELS: Record<string, string> = {
  INQUIRY: 'Dotaz na inzerát',
  SYSTEM: 'Systémová',
}

const STATUS_LABELS: Record<string, string> = {
  UNREAD: 'Neprečítaná',
  READ: 'Prečítaná',
  ARCHIVED: 'Archivovaná',
}

export default function ContactFormsPage() {
  const router = useRouter()
  const [messages, setMessages] = useState<AdminMessage[]>([])
  const [loading, setLoading] = useState(true)
  const [selectedMessage, setSelectedMessage] = useState<AdminMessage | null>(null)
  const [showDetailModal, setShowDetailModal] = useState(false)
  const [filterStatus, setFilterStatus] = useState<string>('')
  const [filterType, setFilterType] = useState<string>('')

  useEffect(() => {
    if (!isAuthenticated()) {
      router.push('/login')
      return
    }
    loadMessages()
  }, [router, filterStatus, filterType])

  const loadMessages = async () => {
    try {
      setLoading(true)
      const data = await api.getAdminMessages(
        filterStatus || undefined,
        filterType || undefined,
      )
      setMessages(data)
    } catch (error) {
      console.error('Chyba pri načítaní správ:', error)
    } finally {
      setLoading(false)
    }
  }

  const openDetail = (msg: AdminMessage) => {
    setSelectedMessage(msg)
    setShowDetailModal(true)
  }

  const senderLabel = (sender?: MessageSender | null) => {
    if (!sender) return '–'
    const name = [sender.firstName, sender.lastName].filter(Boolean).join(' ')
    return name ? `${name} (${sender.email})` : sender.email
  }

  const recipientLabel = (recipient?: MessageRecipient | null) => {
    if (!recipient) return '–'
    const name = [recipient.firstName, recipient.lastName].filter(Boolean).join(' ')
    return name ? `${name} (${recipient.email})` : recipient.email
  }

  return (
    <DashboardLayout>
          <div className="mb-6">
            <h1 className="text-2xl font-bold text-gray-200">Kontaktné formuláre / Správy</h1>
            <p className="text-sm text-gray-400 mt-1">
              Všetky správy a dotazy na inzeráty. Od koho prišli a komu sú určené. Môžeš odpovedať cez email.
            </p>
          </div>

          <div className="mb-4 flex flex-wrap gap-3 items-center">
            <span className="text-sm text-gray-500">Filter:</span>
            <Select
              value={filterStatus}
              onChange={(val) => setFilterStatus(val)}
              options={[
                { value: '', label: 'Všetky stavy' },
                { value: 'UNREAD', label: 'Neprečítaná' },
                { value: 'READ', label: 'Prečítaná' },
                { value: 'ARCHIVED', label: 'Archivovaná' },
              ]}
              />
            <Select
              value={filterType}
              onChange={(val) => setFilterType(val)}
              options={[
                { value: '', label: 'Všetky typy' },
                { value: 'INQUIRY', label: 'Dotaz na inzerát' },
                { value: 'SYSTEM', label: 'Systémová' },
              ]}
              />
          </div>

          {loading ? (
            <div className="card p-12 text-center text-gray-400">
              Načítavam správy...
            </div>
          ) : messages.length === 0 ? (
            <div className="card p-12 text-center text-gray-500">
              Žiadne správy.
            </div>
          ) : (
            <div className="card overflow-hidden">
              <div className="overflow-x-auto">
                <table className="w-full text-sm">
                  <thead>
                    <tr className="bg-dark/50 text-left text-gray-400">
                      <th className="py-3 px-4 font-medium">Od</th>
                      <th className="py-3 px-4 font-medium">Komu</th>
                      <th className="py-3 px-4 font-medium">Predmet</th>
                      <th className="py-3 px-4 font-medium">Typ</th>
                      <th className="py-3 px-4 font-medium">Stav</th>
                      <th className="py-3 px-4 font-medium text-right">Dátum</th>
                    </tr>
                  </thead>
                  <tbody>
                    {messages.map((msg) => (
                      <tr
                        key={msg.id}
                        onClick={() => openDetail(msg)}
                        className="border-b border-white/[0.06]/50 last:border-0 hover:bg-dark/30 cursor-pointer"
                      >
                        <td className="py-2.5 px-4 text-gray-200">
                          <span className="truncate max-w-[180px] block" title={senderLabel(msg.sender)}>
                            {senderLabel(msg.sender)}
                          </span>
                        </td>
                        <td className="py-2.5 px-4 text-gray-300">
                          <span className="truncate max-w-[180px] block" title={recipientLabel(msg.recipient)}>
                            {recipientLabel(msg.recipient)}
                          </span>
                        </td>
                        <td className="py-2.5 px-4 text-gray-200 font-medium max-w-[200px] truncate" title={msg.subject}>
                          {msg.subject}
                        </td>
                        <td className="py-2.5 px-4 text-gray-400">{TYPE_LABELS[msg.type] || msg.type}</td>
                        <td className="py-2.5 px-4">
                          <span
                            className={
                              msg.status === 'UNREAD'
                                ? 'text-amber-400 font-medium'
                                : msg.status === 'READ'
                                  ? 'text-gray-400'
                                  : 'text-gray-500'
                            }
                          >
                            {STATUS_LABELS[msg.status] || msg.status}
                          </span>
                        </td>
                        <td className="py-2.5 px-4 text-right text-gray-500 tabular-nums">
                          {new Date(msg.createdAt).toLocaleString('sk-SK')}
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            </div>
          )}

          {/* Detail správy + odpovedať */}
          {showDetailModal && selectedMessage && (
            <div className="modal-overlay">
              <div className="modal-panel-lg max-h-[90vh] overflow-hidden flex flex-col">
                <div className="flex items-center justify-between p-4 border-b border-white/[0.06]">
                  <h2 className="text-lg font-semibold text-gray-200">Detail správy</h2>
                  <button
                    onClick={() => { setShowDetailModal(false); setSelectedMessage(null) }}
                    className="p-2 rounded-xl hover:bg-dark/50 text-gray-400 hover:text-gray-200"
                  >
                    <X className="w-5 h-5" />
                  </button>
                </div>
                <div className="p-4 overflow-y-auto space-y-4">
                  <div>
                    <span className="text-xs text-gray-500">Od</span>
                    <p className="text-gray-200 font-medium">{senderLabel(selectedMessage.sender)}</p>
                  </div>
                  <div>
                    <span className="text-xs text-gray-500">Komu</span>
                    <p className="text-gray-200">{recipientLabel(selectedMessage.recipient)}</p>
                  </div>
                  <div>
                    <span className="text-xs text-gray-500">Predmet</span>
                    <p className="text-gray-200 font-medium">{selectedMessage.subject}</p>
                  </div>
                  {selectedMessage.advertisement && (
                    <div>
                      <span className="text-xs text-gray-500">Inzerát</span>
                      <p className="text-gray-200">{selectedMessage.advertisement.title}</p>
                    </div>
                  )}
                  <div>
                    <span className="text-xs text-gray-500">Správa</span>
                    <div className="mt-1 p-3 rounded-xl bg-dark/40 text-gray-200 whitespace-pre-wrap">
                      {selectedMessage.content}
                    </div>
                  </div>
                  <div className="pt-2 flex gap-2">
                    {selectedMessage.sender?.email && (
                      <a
                        href={`mailto:${selectedMessage.sender.email}?subject=Re: ${encodeURIComponent(selectedMessage.subject)}`}
                        className="inline-flex items-center gap-2 px-4 py-2 rounded-xl bg-accent text-gray-100 text-sm font-medium hover:opacity-90"
                      >
                        <Reply className="w-4 h-4" />
                        Odpovedať
                      </a>
                    )}
                  </div>
                </div>
              </div>
            </div>
          )}
        </DashboardLayout>
  )
}
