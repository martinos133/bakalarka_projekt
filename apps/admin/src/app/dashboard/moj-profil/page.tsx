'use client'

import { useEffect, useState, useRef } from 'react'
import { useRouter } from 'next/navigation'
import DashboardLayout from '@/components/DashboardLayout'
import { isAuthenticated, setAuthUser, getAuthUser } from '@/lib/auth'
import { api } from '@/lib/api'
import { fileToResizedAvatarDataUrl } from '@/lib/avatarResize'
import {
  UserCircle, Save, Lock, Image as ImageIcon, Link2, Trash2,
  Mail, Phone, Calendar, Building2, MapPin, Shield, Crown,
} from 'lucide-react'
import Select from '@/components/Select'

const inputCls =
  'w-full rounded-lg border border-white/10 bg-dark-100 px-3 py-2 text-sm text-white focus:border-accent/40 focus:outline-none'
const labelCls = 'mb-1 block text-xs font-medium uppercase tracking-wider text-gray-500'
const readonlyCls =
  'w-full rounded-lg border border-white/5 bg-dark-100/50 px-3 py-2 text-sm text-gray-400 cursor-default'

const genderLabels: Record<string, string> = { MALE: 'Muž', FEMALE: 'Žena', OTHER: 'Iné' }
const planLabels: Record<string, string> = {
  STANDARD: 'Štandard', PLUS: 'Plus', PRO: 'Pro', FIRMA: 'Firma',
}

export default function MojProfilPage() {
  const router = useRouter()
  const fileRef = useRef<HTMLInputElement>(null)
  const [loading, setLoading] = useState(true)
  const [saving, setSaving] = useState(false)
  const [pwSaving, setPwSaving] = useState(false)
  const [message, setMessage] = useState<string | null>(null)
  const [error, setError] = useState<string | null>(null)

  const [email, setEmail] = useState('')
  const [firstName, setFirstName] = useState('')
  const [lastName, setLastName] = useState('')
  const [phone, setPhone] = useState('')
  const [avatarUrl, setAvatarUrl] = useState<string | null>(null)
  const [avatarUrlInput, setAvatarUrlInput] = useState('')
  const [dateOfBirth, setDateOfBirth] = useState('')
  const [gender, setGender] = useState('')
  const [isCompany, setIsCompany] = useState(false)
  const [companyName, setCompanyName] = useState('')
  const [companyId, setCompanyId] = useState('')
  const [companyTaxId, setCompanyTaxId] = useState('')
  const [address, setAddress] = useState('')
  const [city, setCity] = useState('')
  const [postalCode, setPostalCode] = useState('')
  const [country, setCountry] = useState('')

  const [role, setRole] = useState('')
  const [sellerPlan, setSellerPlan] = useState('')
  const [createdAt, setCreatedAt] = useState('')

  const [oldPassword, setOldPassword] = useState('')
  const [newPassword, setNewPassword] = useState('')
  const [confirmPassword, setConfirmPassword] = useState('')

  useEffect(() => {
    if (!isAuthenticated()) { router.push('/login'); return }
    let cancelled = false
    ;(async () => {
      try {
        setLoading(true)
        const p = await api.getMyUserProfile()
        if (cancelled) return
        setEmail(p.email || '')
        setFirstName(p.firstName || '')
        setLastName(p.lastName || '')
        setPhone(p.phone || '')
        setAvatarUrl(typeof p.avatarUrl === 'string' ? p.avatarUrl : null)
        setAvatarUrlInput(typeof p.avatarUrl === 'string' && p.avatarUrl.startsWith('http') ? p.avatarUrl : '')
        setDateOfBirth(p.dateOfBirth ? new Date(p.dateOfBirth).toISOString().slice(0, 10) : '')
        setGender(p.gender || '')
        setIsCompany(!!p.isCompany)
        setCompanyName(p.companyName || '')
        setCompanyId(p.companyId || '')
        setCompanyTaxId(p.companyTaxId || '')
        setAddress(p.address || '')
        setCity(p.city || '')
        setPostalCode(p.postalCode || '')
        setCountry(p.country || '')
        setRole(p.role || '')
        setSellerPlan(p.sellerPlan || '')
        setCreatedAt(p.createdAt || '')
      } catch (e: unknown) {
        if (!cancelled) setError(e instanceof Error ? e.message : 'Nepodarilo sa načítať profil')
      } finally {
        if (!cancelled) setLoading(false)
      }
    })()
    return () => { cancelled = true }
  }, [router])

  const handleSaveProfile = async () => {
    setError(null); setMessage(null)
    try {
      setSaving(true)
      const updated = await api.updateMyUserProfile({
        firstName: firstName.trim() || undefined,
        lastName: lastName.trim() || undefined,
        phone: phone.trim() || undefined,
        avatarUrl: avatarUrl === null ? null : avatarUrl,
        dateOfBirth: dateOfBirth || null,
        gender: gender || null,
        isCompany,
        companyName: companyName.trim() || undefined,
        companyId: companyId.trim() || undefined,
        companyTaxId: companyTaxId.trim() || undefined,
        address: address.trim() || undefined,
        city: city.trim() || undefined,
        postalCode: postalCode.trim() || undefined,
        country: country.trim() || undefined,
      })
      setAuthUser({
        firstName: updated.firstName,
        lastName: updated.lastName,
        avatarUrl: updated.avatarUrl ?? null,
      })
      setMessage('Profil bol uložený.')
      setTimeout(() => setMessage(null), 4000)
    } catch (e: unknown) {
      setError(e instanceof Error ? e.message : 'Uloženie zlyhalo')
    } finally { setSaving(false) }
  }

  const handleApplyUrl = () => {
    const u = avatarUrlInput.trim()
    if (!u) { setError('Zadajte platnú http(s) adresu obrázka.'); return }
    setAvatarUrl(u); setError(null)
    setMessage('URL nastavená — nezabudnite uložiť profil.')
  }

  const handleFile = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const f = e.target.files?.[0]; e.target.value = ''
    if (!f) return; setError(null)
    try {
      const dataUrl = await fileToResizedAvatarDataUrl(f)
      setAvatarUrl(dataUrl); setAvatarUrlInput('')
      setMessage('Obrázok pripravený — kliknite na „Uložiť profil".')
    } catch (err: unknown) {
      setError(err instanceof Error ? err.message : 'Chyba pri spracovaní súboru')
    }
  }

  const handleRemoveAvatar = () => {
    setAvatarUrl(null); setAvatarUrlInput('')
    setMessage('Profilovka bude odstránená po uložení.')
  }

  const handleChangePassword = async () => {
    setError(null); setMessage(null)
    if (newPassword !== confirmPassword) { setError('Nové heslá sa nezhodujú.'); return }
    if (newPassword.length < 8) { setError('Nové heslo musí mať aspoň 8 znakov.'); return }
    try {
      setPwSaving(true)
      await api.changeMyPassword(oldPassword, newPassword)
      setOldPassword(''); setNewPassword(''); setConfirmPassword('')
      setMessage('Heslo bolo zmenené.')
      setTimeout(() => setMessage(null), 4000)
    } catch (e: unknown) {
      setError(e instanceof Error ? e.message : 'Zmena hesla zlyhala')
    } finally { setPwSaving(false) }
  }

  if (loading) {
    return (
      <DashboardLayout>
        <div className="flex min-h-[40vh] items-center justify-center text-gray-500">Načítavam…</div>
      </DashboardLayout>
    )
  }

  const initials = ((firstName?.[0] || '') + (lastName?.[0] || '') || '?').toUpperCase()

  return (
    <DashboardLayout>
      <div className="space-y-6">
        {/* Header s avatárom a info */}
        <div className="card flex flex-col gap-6 p-6 sm:flex-row sm:items-center">
          <div className="flex flex-col items-center gap-2">
            {avatarUrl ? (
              // eslint-disable-next-line @next/next/no-img-element
              <img src={avatarUrl} alt="" className="h-24 w-24 rounded-full border border-white/10 object-cover" />
            ) : (
              <div className="flex h-24 w-24 items-center justify-center rounded-full border border-white/10 bg-popup text-2xl font-bold text-gray-500">
                {initials}
              </div>
            )}
            <input ref={fileRef} type="file" accept="image/jpeg,image/png,image/webp" className="hidden" onChange={handleFile} />
            <div className="flex gap-2">
              <button type="button" onClick={() => fileRef.current?.click()}
                className="inline-flex items-center gap-1 rounded-lg border border-white/10 bg-dark-100 px-2.5 py-1 text-xs text-white hover:bg-popupHover">
                <ImageIcon className="h-3 w-3" /> Nahrať
              </button>
              {avatarUrl && (
                <button type="button" onClick={handleRemoveAvatar}
                  className="inline-flex items-center gap-1 rounded-lg border border-red-500/30 px-2.5 py-1 text-xs text-red-300 hover:bg-[#2a1818]">
                  <Trash2 className="h-3 w-3" /> Odstrániť
                </button>
              )}
            </div>
          </div>

          <div className="min-w-0 flex-1">
            <h1 className="text-xl font-bold text-white">
              {firstName} {lastName}
            </h1>
            <p className="mt-0.5 text-sm text-gray-400">{email}</p>
            <div className="mt-3 flex flex-wrap gap-3">
              <span className="inline-flex items-center gap-1.5 rounded-lg border border-white/10 bg-dark-100 px-3 py-1.5 text-xs text-gray-300">
                <Shield className="h-3.5 w-3.5 text-accent" />
                {role === 'ADMIN' ? 'Administrátor' : 'Používateľ'}
              </span>
              <span className="inline-flex items-center gap-1.5 rounded-lg border border-white/10 bg-dark-100 px-3 py-1.5 text-xs text-gray-300">
                <Crown className="h-3.5 w-3.5 text-accent" />
                {planLabels[sellerPlan] || sellerPlan}
              </span>
              {createdAt && (
                <span className="inline-flex items-center gap-1.5 rounded-lg border border-white/10 bg-dark-100 px-3 py-1.5 text-xs text-gray-300">
                  <Calendar className="h-3.5 w-3.5 text-accent" />
                  Člen od {new Date(createdAt).toLocaleDateString('sk-SK')}
                </span>
              )}
            </div>
          </div>
        </div>

        {error && (
          <div className="rounded-xl border border-red-500/30 bg-[#2a1818] px-4 py-3 text-sm text-red-300">{error}</div>
        )}
        {message && (
          <div className="rounded-xl border border-accent/30 bg-popupRowActive px-4 py-3 text-sm text-accent">{message}</div>
        )}

        {/* Hlavný grid — ľavý a pravý stĺpec */}
        <div className="grid gap-6 lg:grid-cols-2">
          {/* Osobné údaje */}
          <section className="card space-y-5 p-6">
            <h2 className="flex items-center gap-2 text-base font-semibold text-white">
              <UserCircle className="h-5 w-5 text-accent" /> Osobné údaje
            </h2>
            <div className="grid gap-4 sm:grid-cols-2">
              <div>
                <label className={labelCls}>Meno</label>
                <input value={firstName} onChange={(e) => setFirstName(e.target.value)} className={inputCls} />
              </div>
              <div>
                <label className={labelCls}>Priezvisko</label>
                <input value={lastName} onChange={(e) => setLastName(e.target.value)} className={inputCls} />
              </div>
            </div>
            <div>
              <label className={labelCls}>E-mail</label>
              <div className="relative">
                <Mail className="pointer-events-none absolute left-3 top-1/2 h-3.5 w-3.5 -translate-y-1/2 text-gray-600" />
                <input value={email} readOnly className={`${readonlyCls} pl-8`} />
              </div>
            </div>
            <div className="grid gap-4 sm:grid-cols-2">
              <div>
                <label className={labelCls}>Telefón</label>
                <div className="relative">
                  <Phone className="pointer-events-none absolute left-3 top-1/2 h-3.5 w-3.5 -translate-y-1/2 text-gray-600" />
                  <input value={phone} onChange={(e) => setPhone(e.target.value)} placeholder="+421…" className={`${inputCls} pl-8`} />
                </div>
              </div>
              <div>
                <label className={labelCls}>Dátum narodenia</label>
                <input type="date" value={dateOfBirth} onChange={(e) => setDateOfBirth(e.target.value)}
                  className={`${inputCls} [color-scheme:dark]`} />
              </div>
            </div>
            <div>
              <label className={labelCls}>Pohlavie</label>
              <Select
                value={gender}
                onChange={setGender}
                placeholder="— Neurčené —"
                options={[
                  { value: '', label: '— Neurčené —' },
                  { value: 'MALE', label: 'Muž' },
                  { value: 'FEMALE', label: 'Žena' },
                  { value: 'OTHER', label: 'Iné' },
                ]}
              />
            </div>

            <div>
              <label className={labelCls}>Obrázok z URL (voliteľné)</label>
              <div className="flex gap-2">
                <input value={avatarUrlInput} onChange={(e) => setAvatarUrlInput(e.target.value)} placeholder="https://…"
                  className={`${inputCls} min-w-0 flex-1 placeholder:text-gray-600`} />
                <button type="button" onClick={handleApplyUrl}
                  className="inline-flex shrink-0 items-center gap-1 rounded-lg border border-accent/40 bg-popupRowActive px-3 py-2 text-xs font-medium text-accent hover:bg-popupRowHover">
                  <Link2 className="h-3.5 w-3.5" /> Použiť
                </button>
              </div>
            </div>
          </section>

          {/* Pravý stĺpec: Adresa + Firma */}
          <div className="space-y-6">
            <section className="card space-y-5 p-6">
              <h2 className="flex items-center gap-2 text-base font-semibold text-white">
                <MapPin className="h-5 w-5 text-accent" /> Adresa
              </h2>
              <div>
                <label className={labelCls}>Ulica a č. domu</label>
                <input value={address} onChange={(e) => setAddress(e.target.value)} className={inputCls} />
              </div>
              <div className="grid gap-4 sm:grid-cols-3">
                <div className="sm:col-span-1">
                  <label className={labelCls}>PSČ</label>
                  <input value={postalCode} onChange={(e) => setPostalCode(e.target.value)} placeholder="010 01" className={inputCls} />
                </div>
                <div className="sm:col-span-2">
                  <label className={labelCls}>Mesto</label>
                  <input value={city} onChange={(e) => setCity(e.target.value)} className={inputCls} />
                </div>
              </div>
              <div>
                <label className={labelCls}>Krajina</label>
                <input value={country} onChange={(e) => setCountry(e.target.value)} placeholder="Slovensko" className={inputCls} />
              </div>
            </section>

            <section className="card space-y-5 p-6">
              <div className="flex items-center justify-between">
                <h2 className="flex items-center gap-2 text-base font-semibold text-white">
                  <Building2 className="h-5 w-5 text-accent" /> Firemné údaje
                </h2>
                <label className="flex cursor-pointer items-center gap-2 text-xs text-gray-400">
                  <input type="checkbox" checked={isCompany} onChange={(e) => setIsCompany(e.target.checked)}
                    className="h-4 w-4 rounded border-white/10 bg-dark-100 text-accent focus:ring-accent" />
                  Som firma / SZČO
                </label>
              </div>
              {isCompany && (
                <>
                  <div>
                    <label className={labelCls}>Názov firmy</label>
                    <input value={companyName} onChange={(e) => setCompanyName(e.target.value)} className={inputCls} />
                  </div>
                  <div className="grid gap-4 sm:grid-cols-2">
                    <div>
                      <label className={labelCls}>IČO</label>
                      <input value={companyId} onChange={(e) => setCompanyId(e.target.value)} className={inputCls} />
                    </div>
                    <div>
                      <label className={labelCls}>DIČ</label>
                      <input value={companyTaxId} onChange={(e) => setCompanyTaxId(e.target.value)} className={inputCls} />
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
          <p className="text-xs text-gray-500">Zmeny sa prejavia v celom admine aj na platforme.</p>
        </div>

        {/* Zmena hesla */}
        <section className="card space-y-4 p-6">
          <h2 className="flex items-center gap-2 text-base font-semibold text-white">
            <Lock className="h-5 w-5 text-accent" /> Zmena hesla
          </h2>
          <div className="grid gap-3 sm:grid-cols-3">
            <input type="password" value={oldPassword} onChange={(e) => setOldPassword(e.target.value)}
              placeholder="Súčasné heslo" className={`${inputCls} placeholder:text-gray-600`} />
            <input type="password" value={newPassword} onChange={(e) => setNewPassword(e.target.value)}
              placeholder="Nové heslo (min. 8 znakov)" className={`${inputCls} placeholder:text-gray-600`} />
            <input type="password" value={confirmPassword} onChange={(e) => setConfirmPassword(e.target.value)}
              placeholder="Potvrdenie nového hesla" className={`${inputCls} placeholder:text-gray-600`} />
          </div>
          <button type="button" disabled={pwSaving} onClick={handleChangePassword}
            className="inline-flex items-center gap-2 rounded-xl border border-white/10 bg-dark-100 px-4 py-2 text-sm font-medium text-white hover:bg-popupHover disabled:opacity-50">
            {pwSaving ? 'Mením…' : 'Zmeniť heslo'}
          </button>
        </section>
      </div>
    </DashboardLayout>
  )
}
