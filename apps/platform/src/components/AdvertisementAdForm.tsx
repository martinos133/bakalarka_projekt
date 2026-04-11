'use client'

import type { ChangeEvent, Dispatch, SetStateAction } from 'react'
import { Plus, Save, X, Trash2, Image as ImageIcon } from 'lucide-react'

export type AdFormDataState = {
  title: string
  description: string
  price: string
  categoryId: string
  location: string
  postalCode: string
  type: string
  images: string[]
  pricingType: string
  hourlyRate: string
  dailyRate: string
  packages: any[]
  deliveryTime: string
  revisions: string
  features: string[]
  faq: any[]
}

export type AdvertisementAdFormProps = {
  adFormData: AdFormDataState
  setAdFormData: Dispatch<SetStateAction<AdFormDataState>>
  newFeature: string
  setNewFeature: (v: string) => void
  newPackage: any
  setNewPackage: Dispatch<SetStateAction<any>>
  newPackageFeature: string
  setNewPackageFeature: (v: string) => void
  newFAQ: any
  setNewFAQ: Dispatch<SetStateAction<any>>
  handleImageUpload: (e: ChangeEvent<HTMLInputElement>) => void
  removeImage: (index: number) => void
  onSubmit: () => void
  saving: boolean
  editingId: string | null
  /** `admin` = tmavé polia zladené s admin panelom */
  variant?: 'platform' | 'admin'
}

export default function AdvertisementAdForm({
  adFormData,
  setAdFormData,
  newFeature,
  setNewFeature,
  newPackage,
  setNewPackage,
  newPackageFeature,
  setNewPackageFeature,
  newFAQ,
  setNewFAQ,
  handleImageUpload,
  removeImage,
  onSubmit,
  saving,
  editingId,
  variant = 'platform',
}: AdvertisementAdFormProps) {
  const a = variant === 'admin'
  const c = {
    label: a ? 'block text-sm font-medium text-gray-300 mb-2' : 'block text-sm font-medium text-gray-300 mb-2',
    labelXs: a ? 'block text-xs text-gray-500 mb-1' : 'block text-xs text-gray-500 mb-1',
    input:
      a
        ? 'w-full px-4 py-2.5 rounded-lg border border-card bg-dark text-white placeholder-white/40 focus:outline-none focus:ring-2 focus:ring-accent/35 focus:border-accent/40'
        : 'w-full px-4 py-2 rounded-lg border border-white/10 bg-dark-100 text-white placeholder:text-gray-500 focus:outline-none focus:border-accent/40',
    textarea:
      a
        ? 'w-full px-4 py-2.5 rounded-lg border border-card bg-dark text-white placeholder-white/40 focus:outline-none focus:ring-2 focus:ring-accent/35 focus:border-accent/40'
        : 'w-full px-4 py-2 rounded-lg border border-white/10 bg-dark-100 text-white placeholder:text-gray-500 focus:outline-none focus:border-accent/40',
    inpFocus:
      a
        ? 'w-full px-4 py-2 rounded-lg border border-card bg-dark text-white placeholder-white/40 focus:outline-none focus:ring-2 focus:ring-accent/35 focus:border-accent/40'
        : 'w-full px-4 py-2 rounded-lg border border-white/10 bg-dark-100 text-white placeholder:text-gray-500 focus:outline-none focus:border-accent/40',
    inpSm:
      a
        ? 'w-full px-3 py-2 rounded-lg border border-card bg-dark text-white text-sm placeholder-white/40 focus:outline-none focus:ring-2 focus:ring-accent/35 focus:border-accent/40'
        : 'w-full px-3 py-2 rounded-lg border border-white/10 bg-dark-100 text-white text-sm placeholder:text-gray-500 focus:outline-none focus:border-accent/40',
    flexInp:
      a
        ? 'flex-1 px-4 py-2 rounded-lg border border-card bg-dark text-white placeholder-white/40 focus:outline-none focus:ring-2 focus:ring-accent/35 focus:border-accent/40'
        : 'flex-1 px-4 py-2 rounded-lg border border-white/10 bg-dark-100 text-white placeholder:text-gray-500 focus:outline-none focus:border-accent/40',
    flexInpSm:
      a
        ? 'flex-1 px-3 py-2 rounded-lg border border-card bg-dark text-white text-sm placeholder-white/40 focus:outline-none focus:ring-2 focus:ring-accent/35 focus:border-accent/40'
        : 'flex-1 px-3 py-2 rounded-lg border border-white/10 bg-dark-100 text-white text-sm placeholder:text-gray-500 focus:outline-none focus:border-accent/40',
    secBorder: a ? 'border-t border-card pt-6 mt-6' : 'border-t border-white/[0.08] pt-6 mt-6',
    secTitle: a ? 'text-lg font-semibold text-white mb-4' : 'text-lg font-semibold text-white mb-4',
    hint: 'text-xs text-gray-500 mt-1',
    panel: a ? 'space-y-2 p-4 bg-dark rounded-xl border border-card' : 'space-y-2 p-4 bg-dark-100 rounded-xl border border-white/[0.06]',
    panelLg: a ? 'space-y-4 p-4 bg-dark rounded-xl border border-card' : 'space-y-4 p-4 bg-dark-100 rounded-xl border border-white/[0.06]',
    featureChip: a
      ? 'px-3 py-1 bg-card rounded-lg text-sm text-gray-200 border border-card flex items-center gap-2'
      : 'px-3 py-1 bg-dark-100 rounded-lg text-sm text-white flex items-center gap-2',
    chipSm: a
      ? 'px-2 py-1 bg-card rounded text-xs text-gray-300 border border-card flex items-center gap-1'
      : 'px-2 py-1 bg-dark-200 rounded text-xs text-white flex items-center gap-1',
    pkgList: a
      ? 'p-3 bg-card rounded-xl border border-card flex items-start justify-between'
      : 'p-3 bg-dark-100 rounded-xl border border-white/[0.06] flex items-start justify-between',
    pkgTitle: a ? 'font-medium text-white' : 'font-medium text-white',
    pkgDesc: a ? 'text-sm text-gray-500' : 'text-sm text-gray-500',
    pkgMeta: a ? 'text-sm text-gray-300 mt-1' : 'text-sm text-gray-300 mt-1',
    innerTag: a ? 'px-2 py-1 bg-dark rounded text-xs text-gray-300 border border-card' : 'px-2 py-1 bg-dark rounded text-xs text-gray-300',
    btnPri: a
      ? 'px-4 py-2 bg-primary hover:opacity-90 text-white rounded-lg transition-opacity'
      : 'px-4 py-2 bg-accent hover:bg-accent-light text-white rounded-lg',
    btnPriSm: a
      ? 'px-3 py-2 bg-primary hover:opacity-90 text-white rounded-lg text-sm transition-opacity'
      : 'px-3 py-2 bg-accent hover:bg-accent-light text-white rounded-lg text-sm',
    btnPriWide: a
      ? 'w-full px-4 py-2 bg-primary hover:opacity-90 text-white rounded-lg text-sm flex items-center justify-center gap-2 transition-opacity'
      : 'w-full px-4 py-2 bg-accent hover:bg-accent-light text-white rounded-lg text-sm flex items-center justify-center gap-2',
    danger: a ? 'text-red-400 hover:text-red-300' : 'text-red-400 hover:text-red-700',
    imgBox: a
      ? 'flex items-center justify-center w-full h-32 border-2 border-dashed border-card rounded-lg cursor-pointer hover:bg-card/50 transition-colors'
      : 'flex items-center justify-center w-full h-32 border-2 border-dashed border-white/10 rounded-xl cursor-pointer bg-dark-100 hover:bg-dark-200 transition-colors',
    imgIcon: a ? 'w-8 h-8 text-gray-500 mb-2' : 'w-8 h-8 text-gray-500 mb-2',
    imgText: a ? 'text-sm text-gray-500' : 'text-sm text-gray-500',
    imgSub: a ? 'text-xs text-gray-500 mt-1' : 'text-xs text-gray-500 mt-1',
    imgThumb: a ? 'w-full h-32 object-cover rounded-lg border border-card' : 'w-full h-32 object-cover rounded-xl border border-white/[0.06]',
    submit: a
      ? 'flex items-center gap-2 px-6 py-3 bg-primary text-white rounded-lg hover:opacity-90 disabled:opacity-50 transition-opacity'
      : 'flex items-center gap-2 px-6 py-3 rounded-xl bg-accent text-dark font-semibold hover:bg-accent-light disabled:opacity-50',
    faqQ: a ? 'font-medium text-white mb-1' : 'font-medium text-white mb-1',
    faqA: a ? 'text-sm text-gray-500' : 'text-sm text-gray-500',
  }

  return (
    <>
  <div>
    <label className={c.label}>
      Názov inzerátu *
    </label>
    <input
      type="text"
      value={adFormData.title}
      onChange={(e) => setAdFormData({ ...adFormData, title: e.target.value })}
      className={c.input}
      placeholder="Napríklad: Profesionálny web dizajn"
    />
  </div>

  <div>
    <label className={c.label}>
      Popis *
    </label>
    <textarea
      value={adFormData.description}
      onChange={(e) => setAdFormData({ ...adFormData, description: e.target.value })}
      rows={6}
      className={c.textarea}
      placeholder="Podrobný popis služby alebo produktu..."
    />
  </div>

  <div className="max-w-md">
    <label className={c.label}>
      Typ *
    </label>
    <select
      value={adFormData.type}
      onChange={(e) => setAdFormData({ ...adFormData, type: e.target.value })}
      className={c.input}
    >
      <option value="SERVICE">Služba</option>
      <option value="RENTAL">Prenájom</option>
    </select>
  </div>

  <div className="grid grid-cols-2 gap-4">
    <div>
      <label className={c.label}>
        Lokalita
      </label>
      <input
        type="text"
        value={adFormData.location}
        onChange={(e) => setAdFormData({ ...adFormData, location: e.target.value })}
        className={c.input}
        placeholder="Napríklad: Bratislava, Košice, Nitra"
      />
      <p className={c.hint}>
        Zadajte kraj alebo mesto – inzerát sa podľa lokality zobrazí na mape.
      </p>
    </div>

    <div>
      <label className={c.label}>
        PSČ
      </label>
      <input
        type="text"
        value={adFormData.postalCode}
        onChange={(e) => setAdFormData({ ...adFormData, postalCode: e.target.value })}
        className={c.input}
        placeholder="Napríklad: 811 01"
      />
    </div>
  </div>

  {/* Service-specific fields */}
  {adFormData.type === 'SERVICE' && (
    <>
      <div className={c.secBorder}>
        <h3 className={c.secTitle}>Detaily služby</h3>
        
        <div className="grid grid-cols-2 gap-4 mb-4">
          <div>
            <label className={c.label}>Typ sadzby *</label>
            <select
              required
              value={adFormData.pricingType}
              onChange={(e) => setAdFormData({ ...adFormData, pricingType: e.target.value })}
              className={c.inpFocus}
            >
              <option value="FIXED">Fixná cena</option>
              <option value="HOURLY">Hodinová sadzba</option>
              <option value="DAILY">Denná sadzba</option>
              <option value="PACKAGE">Balíčky</option>
            </select>
          </div>

          {adFormData.pricingType === 'FIXED' && (
            <div>
              <label className={c.label}>Fixná cena (€) *</label>
              <input
                type="number"
                step="0.01"
                required
                value={adFormData.price}
                onChange={(e) => setAdFormData({ ...adFormData, price: e.target.value })}
                className={c.inpFocus}
                placeholder="0.00"
              />
            </div>
          )}

          {adFormData.pricingType === 'HOURLY' && (
            <div>
              <label className={c.label}>Hodinová sadzba (€/h) *</label>
              <input
                type="number"
                step="0.01"
                required
                value={adFormData.hourlyRate}
                onChange={(e) => setAdFormData({ ...adFormData, hourlyRate: e.target.value })}
                className={c.inpFocus}
              />
            </div>
          )}

          {adFormData.pricingType === 'DAILY' && (
            <div>
              <label className={c.label}>Denná sadzba (€/deň) *</label>
              <input
                type="number"
                step="0.01"
                required
                value={adFormData.dailyRate}
                onChange={(e) => setAdFormData({ ...adFormData, dailyRate: e.target.value })}
                className={c.inpFocus}
              />
            </div>
          )}
        </div>

        <div className="grid grid-cols-2 gap-4 mb-4">
          <div>
            <label className={c.label}>Čas dodania</label>
            <input
              type="text"
              value={adFormData.deliveryTime || ''}
              onChange={(e) => setAdFormData({ ...adFormData, deliveryTime: e.target.value })}
              placeholder="Napríklad: 3-5 dní, 1 týždeň..."
              className={c.inpFocus}
            />
          </div>

          <div>
            <label className={c.label}>Revízie</label>
            <input
              type="text"
              value={adFormData.revisions || ''}
              onChange={(e) => setAdFormData({ ...adFormData, revisions: e.target.value })}
              placeholder="Napríklad: Neobmedzené, 3 revízie..."
              className={c.inpFocus}
            />
          </div>
        </div>

        {/* Features */}
        <div className="mb-4">
          <label className={c.label}>Čo je zahrnuté</label>
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
              className={c.flexInp}
            />
            <button
              type="button"
              onClick={() => {
                if (newFeature.trim()) {
                  setAdFormData({ ...adFormData, features: [...adFormData.features, newFeature.trim()] })
                  setNewFeature('')
                }
              }}
              className={c.btnPri}
            >
              <Plus className="w-4 h-4" />
            </button>
          </div>
          <div className="flex flex-wrap gap-2">
            {adFormData.features.map((feature, idx) => (
              <span key={idx} className={c.featureChip}>
                {feature}
                <button
                  type="button"
                  onClick={() => {
                    setAdFormData({ ...adFormData, features: adFormData.features.filter((_, i) => i !== idx) })
                  }}
                  className={c.danger}
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
            <label className={c.label}>Balíčky služieb</label>
            <div className={c.panelLg}>
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <label className={c.labelXs}>Názov balíčka</label>
                  <input
                    type="text"
                    value={newPackage.name || ''}
                    onChange={(e) => setNewPackage({ ...newPackage, name: e.target.value })}
                    className={c.inpSm}
                    placeholder="Napríklad: Základný"
                  />
                </div>
                <div>
                  <label className={c.labelXs}>Cena (€)</label>
                  <input
                    type="number"
                    step="0.01"
                    value={newPackage.price || ''}
                    onChange={(e) => setNewPackage({ ...newPackage, price: e.target.value })}
                    className={c.inpSm}
                  />
                </div>
              </div>
              <div>
                <label className={c.labelXs}>Popis balíčka</label>
                <textarea
                  value={newPackage.description || ''}
                  onChange={(e) => setNewPackage({ ...newPackage, description: e.target.value })}
                  rows={2}
                  className={c.inpSm}
                  placeholder="Popis toho, čo obsahuje tento balíček"
                />
              </div>
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <label className={c.labelXs}>Čas dodania</label>
                  <input
                    type="text"
                    value={newPackage.deliveryTime || ''}
                    onChange={(e) => setNewPackage({ ...newPackage, deliveryTime: e.target.value })}
                    className={c.inpSm}
                    placeholder="Napríklad: 3-5 dní"
                  />
                </div>
                <div>
                  <label className={c.labelXs}>Funkcie balíčka</label>
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
                      className={c.flexInpSm}
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
                      className={c.btnPriSm}
                    >
                      <Plus className="w-3 h-3" />
                    </button>
                  </div>
                  <div className="flex flex-wrap gap-1 mt-2">
                    {newPackage.features?.map((feature: string, idx: number) => (
                      <span key={idx} className={c.chipSm}>
                        {feature}
                        <button
                          type="button"
                          onClick={() => {
                            setNewPackage({ ...newPackage, features: newPackage.features?.filter((_: any, i: number) => i !== idx) })
                          }}
                          className={c.danger}
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
                className={c.btnPriWide}
              >
                <Plus className="w-4 h-4" />
                Pridať balíček
              </button>
            </div>
            <div className="mt-4 space-y-2">
              {adFormData.packages.map((pkg, idx) => (
                <div key={idx} className={c.pkgList}>
                  <div className="flex-1">
                    <div className={c.pkgTitle}>{pkg.name}</div>
                    <div className={c.pkgDesc}>{pkg.description}</div>
                    <div className={c.pkgMeta}>
                      <span className="font-semibold">{pkg.price}€</span> • {pkg.deliveryTime}
                    </div>
                    {pkg.features && pkg.features.length > 0 && (
                      <div className="flex flex-wrap gap-1 mt-2">
                        {pkg.features.map((feature: string, fIdx: number) => (
                          <span key={fIdx} className={c.innerTag}>
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
                    className={`ml-4 ${c.danger}`}
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
          <label className={c.label}>Často kladené otázky (FAQ)</label>
          <div className={c.panel}>
            <div>
              <label className={c.labelXs}>Otázka</label>
              <input
                type="text"
                value={newFAQ.question || ''}
                onChange={(e) => setNewFAQ({ ...newFAQ, question: e.target.value })}
                className={`${c.inpSm} mb-2`}
                placeholder="Napríklad: Ako dlho trvá dodanie?"
              />
            </div>
            <div>
              <label className={c.labelXs}>Odpoveď</label>
              <textarea
                value={newFAQ.answer || ''}
                onChange={(e) => setNewFAQ({ ...newFAQ, answer: e.target.value })}
                rows={2}
                className={c.inpSm}
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
              className={c.btnPriWide}
            >
              <Plus className="w-4 h-4" />
              Pridať FAQ
            </button>
          </div>
          <div className="mt-4 space-y-2">
            {adFormData.faq.map((faq, idx) => (
              <div key={idx} className={c.pkgList}>
                <div className="flex-1">
                  <div className={c.faqQ}>{faq.question}</div>
                  <div className={c.faqA}>{faq.answer}</div>
                </div>
                <button
                  type="button"
                  onClick={() => {
                    setAdFormData({ ...adFormData, faq: adFormData.faq.filter((_, i) => i !== idx) })
                  }}
                  className={`ml-4 ${c.danger}`}
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
    <label className={c.label}>Fotky</label>
    <div className="space-y-4">
      <div>
        <label className={c.imgBox}>
          <div className="flex flex-col items-center justify-center">
            <ImageIcon className={c.imgIcon} />
            <p className={c.imgText}>Kliknite alebo presuňte obrázky sem</p>
            <p className={c.imgSub}>PNG, JPG, GIF do 10MB</p>
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
                className={c.imgThumb}
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
      type="button"
      onClick={onSubmit}
      disabled={saving}
      className={c.submit}
    >
      {editingId ? (
        <>
          <Save className="w-5 h-5" />
          {saving ? 'Ukladám...' : 'Uložiť zmeny'}
        </>
      ) : (
        <>
          <Plus className="w-5 h-5" />
          {saving ? 'Vytváram...' : 'Vytvoriť inzerát'}
        </>
      )}
    </button>
  </div>

    </>
  )
}
