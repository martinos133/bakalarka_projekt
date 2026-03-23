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
}: AdvertisementAdFormProps) {
  return (
    <>
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

  <div className="max-w-md">
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
        placeholder="Napríklad: Bratislava, Košice, Nitra"
      />
      <p className="text-xs text-gray-500 mt-1">
        Zadajte kraj alebo mesto – inzerát sa podľa lokality zobrazí na mape.
      </p>
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
      type="button"
      onClick={onSubmit}
      disabled={saving}
      className="flex items-center gap-2 px-6 py-3 bg-[#1dbf73] text-white rounded-lg hover:bg-[#19a463] disabled:opacity-50"
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
