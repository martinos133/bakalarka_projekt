'use client'

import { useEffect, useState } from 'react'
import { useRouter } from 'next/navigation'
import { isAuthenticated } from '@/lib/auth'
import { api } from '@/lib/api'
import { Save, Globe, Shield, ChevronDown, ChevronRight } from 'lucide-react'
import DashboardLayout from '@/components/DashboardLayout'
import Select from '@/components/Select'

interface PlatformConfig {
  siteName?: string
  siteDescription?: string
  contactEmail?: string
  contactPhone?: string
  supportEmail?: string
  facebookUrl?: string
  twitterUrl?: string
  instagramUrl?: string
  copyrightText?: string
  defaultLanguage?: string
  topFreelancersTitle?: string
  topFreelancersLimit?: number
}

interface AdminConfig {
  itemsPerPage?: number
  maxUploadSize?: number
  enableNotifications?: boolean
  maintenanceMode?: boolean
}

export default function SettingsPage() {
  const router = useRouter()
  const [loading, setLoading] = useState(true)
  const [saving, setSaving] = useState(false)
  const [successMessage, setSuccessMessage] = useState<string | null>(null)
  const [expandedPlatform, setExpandedPlatform] = useState(true)
  const [expandedAdmin, setExpandedAdmin] = useState(true)

  const [platformConfig, setPlatformConfig] = useState<PlatformConfig>({
    siteName: '',
    siteDescription: '',
    contactEmail: '',
    contactPhone: '',
    supportEmail: '',
    facebookUrl: '',
    twitterUrl: '',
    instagramUrl: '',
    copyrightText: '',
    defaultLanguage: 'sk',
    topFreelancersTitle: 'Top freelanceri',
    topFreelancersLimit: 4,
  })

  const [adminConfig, setAdminConfig] = useState<AdminConfig>({
    itemsPerPage: 20,
    maxUploadSize: 10,
    enableNotifications: true,
    maintenanceMode: false,
  })

  useEffect(() => {
    if (!isAuthenticated()) {
      router.push('/login')
      return
    }
    loadConfig()
  }, [router])

  const loadConfig = async () => {
    try {
      setLoading(true)
      const [platform, admin] = await Promise.all([
        api.getConfig('platform'),
        api.getConfig('admin'),
      ])
      setPlatformConfig((p) => ({ ...p, ...platform }))
      setAdminConfig((a) => ({ ...a, ...admin }))
    } catch (error) {
      console.error('Chyba pri načítaní nastavení:', error)
    } finally {
      setLoading(false)
    }
  }

  const handleSavePlatform = async () => {
    try {
      setSaving(true)
      setSuccessMessage(null)
      await api.updateConfig('platform', platformConfig)
      setSuccessMessage('Nastavenia platformy uložené')
      setTimeout(() => setSuccessMessage(null), 3000)
    } catch (error: any) {
      alert(error?.message || 'Chyba pri ukladaní')
    } finally {
      setSaving(false)
    }
  }

  const handleSaveAdmin = async () => {
    try {
      setSaving(true)
      setSuccessMessage(null)
      await api.updateConfig('admin', adminConfig)
      setSuccessMessage('Nastavenia adminu uložené')
      setTimeout(() => setSuccessMessage(null), 3000)
    } catch (error: any) {
      alert(error?.message || 'Chyba pri ukladaní')
    } finally {
      setSaving(false)
    }
  }

  const updatePlatform = (field: keyof PlatformConfig, value: string | number) => {
    setPlatformConfig((p) => ({ ...p, [field]: value }))
  }

  const updateAdmin = (field: keyof AdminConfig, value: number | boolean) => {
    setAdminConfig((a) => ({ ...a, [field]: value }))
  }

  if (loading) {
    return (
      <DashboardLayout>
            <div className="text-gray-400">Načítavam...</div>
          </DashboardLayout>
    )
  }

  return (
    <DashboardLayout>
          <div className="mb-6">
            <h1 className="text-2xl font-bold mb-2">Nastavenia</h1>
            <p className="text-gray-400">
              Konfigurácia platformy a admin panelu
            </p>
          </div>

          {successMessage && (
            <div className="mb-6 px-4 py-3 bg-[#1dbf73]/20 border border-[#1dbf73] rounded-xl text-[#1dbf73] flex items-center gap-2">
              <Save className="w-5 h-5 flex-shrink-0" />
              <span>{successMessage}</span>
            </div>
          )}

          {/* Platform settings */}
          <div className="card overflow-hidden mb-6">
            <button
              onClick={() => setExpandedPlatform(!expandedPlatform)}
              className="w-full flex items-center gap-3 p-4 bg-dark/50 hover:bg-dark/70 transition-colors text-left"
            >
              {expandedPlatform ? (
                <ChevronDown className="w-5 h-5 text-gray-400" />
              ) : (
                <ChevronRight className="w-5 h-5 text-gray-400" />
              )}
              <Globe className="w-5 h-5 text-[#1dbf73]" />
              <span className="font-semibold">Nastavenia platformy</span>
            </button>
            {expandedPlatform && (
              <div className="p-6 space-y-4">
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  <div>
                    <label className="block text-gray-400 text-sm mb-2">Názov stránky</label>
                    <input
                      type="text"
                      value={platformConfig.siteName || ''}
                      onChange={(e) => updatePlatform('siteName', e.target.value)}
                      className="input px-3 py-2 text-white"
                      placeholder="RentMe"
                    />
                  </div>
                  <div>
                    <label className="block text-gray-400 text-sm mb-2">Popis stránky</label>
                    <input
                      type="text"
                      value={platformConfig.siteDescription || ''}
                      onChange={(e) => updatePlatform('siteDescription', e.target.value)}
                      className="input px-3 py-2 text-white"
                      placeholder="Inzertná platforma pre služby a prenájom"
                    />
                  </div>
                  <div>
                    <label className="block text-gray-400 text-sm mb-2">Kontaktný e-mail</label>
                    <input
                      type="email"
                      value={platformConfig.contactEmail || ''}
                      onChange={(e) => updatePlatform('contactEmail', e.target.value)}
                      className="input px-3 py-2 text-white"
                      placeholder="info@rentme.sk"
                    />
                  </div>
                  <div>
                    <label className="block text-gray-400 text-sm mb-2">Telefón</label>
                    <input
                      type="text"
                      value={platformConfig.contactPhone || ''}
                      onChange={(e) => updatePlatform('contactPhone', e.target.value)}
                      className="input px-3 py-2 text-white"
                      placeholder="+421 ..."
                    />
                  </div>
                  <div>
                    <label className="block text-gray-400 text-sm mb-2">E-mail podpory</label>
                    <input
                      type="email"
                      value={platformConfig.supportEmail || ''}
                      onChange={(e) => updatePlatform('supportEmail', e.target.value)}
                      className="input px-3 py-2 text-white"
                      placeholder="podpora@rentme.sk"
                    />
                  </div>
                  <div>
                    <label className="block text-gray-400 text-sm mb-2">Copyright text</label>
                    <input
                      type="text"
                      value={platformConfig.copyrightText || ''}
                      onChange={(e) => updatePlatform('copyrightText', e.target.value)}
                      className="input px-3 py-2 text-white"
                      placeholder="© RentMe International Ltd. 2024"
                    />
                  </div>
                  <div>
                    <label className="block text-gray-400 text-sm mb-2">Facebook URL</label>
                    <input
                      type="url"
                      value={platformConfig.facebookUrl || ''}
                      onChange={(e) => updatePlatform('facebookUrl', e.target.value)}
                      className="input px-3 py-2 text-white"
                      placeholder="https://facebook.com/..."
                    />
                  </div>
                  <div>
                    <label className="block text-gray-400 text-sm mb-2">Twitter URL</label>
                    <input
                      type="url"
                      value={platformConfig.twitterUrl || ''}
                      onChange={(e) => updatePlatform('twitterUrl', e.target.value)}
                      className="input px-3 py-2 text-white"
                      placeholder="https://twitter.com/..."
                    />
                  </div>
                  <div>
                    <label className="block text-gray-400 text-sm mb-2">Instagram URL</label>
                    <input
                      type="url"
                      value={platformConfig.instagramUrl || ''}
                      onChange={(e) => updatePlatform('instagramUrl', e.target.value)}
                      className="input px-3 py-2 text-white"
                      placeholder="https://instagram.com/..."
                    />
                  </div>
                  <div>
                    <label className="block text-gray-400 text-sm mb-2">Predvolený jazyk</label>
                    <Select
                      value={platformConfig.defaultLanguage || 'sk'}
                      onChange={(val) => updatePlatform('defaultLanguage', val)}
                      options={[
                        { value: 'sk', label: 'Slovenčina' },
                        { value: 'en', label: 'English' },
                        { value: 'cs', label: 'Čeština' },
                      ]}
                      />
                  </div>
                  <div className="md:col-span-2 border-t border-white/[0.06] pt-4 mt-4">
                    <h3 className="text-white font-medium mb-3">Sekcia Top freelanceri</h3>
                    <p className="text-gray-500 text-sm mb-3">
                      Zobrazuje používateľov s aktívnymi inzerátmi (zoradených podľa počtu inzerátov)
                    </p>
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                      <div>
                        <label className="block text-gray-400 text-sm mb-2">Názov sekcie</label>
                        <input
                          type="text"
                          value={platformConfig.topFreelancersTitle || ''}
                          onChange={(e) =>
                            updatePlatform('topFreelancersTitle', e.target.value)
                          }
                          className="input px-3 py-2 text-white"
                          placeholder="Top freelanceri"
                        />
                      </div>
                      <div>
                        <label className="block text-gray-400 text-sm mb-2">
                          Počet zobrazených (1–12)
                        </label>
                        <input
                          type="number"
                          min={1}
                          max={12}
                          value={platformConfig.topFreelancersLimit ?? 4}
                          onChange={(e) => {
                            const val = parseInt(e.target.value, 10)
                            updatePlatform(
                              'topFreelancersLimit',
                              isNaN(val) ? 4 : Math.min(12, Math.max(1, val))
                            )
                          }}
                          className="input px-3 py-2 text-white"
                        />
                      </div>
                    </div>
                  </div>
                </div>
                <button
                  onClick={handleSavePlatform}
                  disabled={saving}
                  className="flex items-center gap-2 px-4 py-2 bg-[#1dbf73] text-white rounded-xl hover:bg-[#19a463] transition-colors disabled:opacity-50"
                >
                  <Save className="w-4 h-4" />
                  Uložiť nastavenia platformy
                </button>
              </div>
            )}
          </div>

          {/* Admin settings */}
          <div className="card overflow-hidden">
            <button
              onClick={() => setExpandedAdmin(!expandedAdmin)}
              className="w-full flex items-center gap-3 p-4 bg-dark/50 hover:bg-dark/70 transition-colors text-left"
            >
              {expandedAdmin ? (
                <ChevronDown className="w-5 h-5 text-gray-400" />
              ) : (
                <ChevronRight className="w-5 h-5 text-gray-400" />
              )}
              <Shield className="w-5 h-5 text-[#1dbf73]" />
              <span className="font-semibold">Nastavenia adminu</span>
            </button>
            {expandedAdmin && (
              <div className="p-6 space-y-4">
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  <div>
                    <label className="block text-gray-400 text-sm mb-2">
                      Počet položiek na stránku
                    </label>
                    <input
                      type="number"
                      min={5}
                      max={100}
                      value={adminConfig.itemsPerPage || 20}
                      onChange={(e) =>
                        updateAdmin('itemsPerPage', parseInt(e.target.value) || 20)
                      }
                      className="input px-3 py-2 text-white"
                    />
                  </div>
                  <div>
                    <label className="block text-gray-400 text-sm mb-2">
                      Max. veľkosť uploadu (MB)
                    </label>
                    <input
                      type="number"
                      min={1}
                      max={100}
                      value={adminConfig.maxUploadSize || 10}
                      onChange={(e) =>
                        updateAdmin('maxUploadSize', parseInt(e.target.value) || 10)
                      }
                      className="input px-3 py-2 text-white"
                    />
                  </div>
                  <div className="flex items-center gap-3">
                    <input
                      type="checkbox"
                      id="enableNotifications"
                      checked={adminConfig.enableNotifications ?? true}
                      onChange={(e) =>
                        updateAdmin('enableNotifications', e.target.checked)
                      }
                      className="w-4 h-4 rounded bg-white/[0.06] border-white/[0.1]"
                    />
                    <label htmlFor="enableNotifications" className="text-gray-300">
                      Povoliť notifikácie
                    </label>
                  </div>
                  <div className="flex items-center gap-3">
                    <input
                      type="checkbox"
                      id="maintenanceMode"
                      checked={adminConfig.maintenanceMode ?? false}
                      onChange={(e) =>
                        updateAdmin('maintenanceMode', e.target.checked)
                      }
                      className="w-4 h-4 rounded bg-white/[0.06] border-white/[0.1]"
                    />
                    <label htmlFor="maintenanceMode" className="text-gray-300">
                      Režim údržby (skryje platformu)
                    </label>
                  </div>
                </div>
                <button
                  onClick={handleSaveAdmin}
                  disabled={saving}
                  className="flex items-center gap-2 px-4 py-2 bg-[#1dbf73] text-white rounded-xl hover:bg-[#19a463] transition-colors disabled:opacity-50"
                >
                  <Save className="w-4 h-4" />
                  Uložiť nastavenia adminu
                </button>
              </div>
            )}
          </div>
        </DashboardLayout>
  )
}
