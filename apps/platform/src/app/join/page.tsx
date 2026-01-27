'use client'

import { useState, useEffect } from 'react'
import { useRouter } from 'next/navigation'
import Link from 'next/link'
import Header from '@/components/Header'
import Footer from '@/components/Footer'
import { User, Building2, Eye, EyeOff } from 'lucide-react'

const API_URL = process.env.NEXT_PUBLIC_API_URL || 'http://localhost:3001'

export default function JoinPage() {
  const router = useRouter()
  const [isCompany, setIsCompany] = useState(false)
  const [currentStep, setCurrentStep] = useState(1)
  const [formData, setFormData] = useState({
    email: '',
    password: '',
    confirmPassword: '',
    firstName: '',
    lastName: '',
    phone: '',
    dateOfBirth: '',
    gender: '',
    isCompany: false,
    companyName: '',
    companyId: '',
    companyTaxId: '',
    address: '',
    city: '',
    postalCode: '',
    country: 'Slovensko',
  })
  const [error, setError] = useState('')
  const [loading, setLoading] = useState(false)
  const [showPassword, setShowPassword] = useState(false)
  const [showConfirmPassword, setShowConfirmPassword] = useState(false)

  useEffect(() => {
    setFormData(prev => ({ ...prev, isCompany }))
  }, [isCompany])

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    setError('')

    // Validácia hesiel
    if (formData.password !== formData.confirmPassword) {
      setError('Heslá sa nezhodujú')
      return
    }

    if (formData.password.length < 8) {
      setError('Heslo musí mať aspoň 8 znakov')
      return
    }

    // Validácia pre firmy
    if (isCompany) {
      if (!formData.companyName) {
        setError('Názov firmy je povinný')
        return
      }
      if (!formData.companyId) {
        setError('IČO je povinné')
        return
      }
    }

    setLoading(true)

    try {
      const payload: any = {
        email: formData.email,
        password: formData.password,
        firstName: formData.firstName,
        lastName: formData.lastName,
        phone: formData.phone || undefined,
        isCompany: isCompany,
        address: formData.address || undefined,
        city: formData.city || undefined,
        postalCode: formData.postalCode || undefined,
        country: formData.country || undefined,
      }

      if (formData.dateOfBirth) {
        payload.dateOfBirth = formData.dateOfBirth
      }

      if (formData.gender) {
        payload.gender = formData.gender
      }

      if (isCompany) {
        payload.companyName = formData.companyName
        payload.companyId = formData.companyId
        payload.companyTaxId = formData.companyTaxId || undefined
      }

      const response = await fetch(`${API_URL}/auth/register`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify(payload),
      })

      const data = await response.json()

      if (!response.ok) {
        throw new Error(data.message || 'Registrácia zlyhala')
      }

      // Uloženie tokenu do localStorage
      if (data.token) {
        localStorage.setItem('user_token', data.token)
        localStorage.setItem('user_user', JSON.stringify(data.user))
      }

      // Presmerovanie na hlavnú stránku
      router.push('/')
    } catch (err: any) {
      if (err.message === 'Failed to fetch' || err.name === 'TypeError') {
        setError('Nepodarilo sa pripojiť k API serveru. Skontrolujte, či API server beží.')
      } else {
        setError(err.message || 'Nastala chyba pri registrácii')
      }
    } finally {
      setLoading(false)
    }
  }

  const nextStep = () => {
    if (currentStep === 1) {
      if (!formData.email || !formData.password || !formData.confirmPassword) {
        setError('Vyplňte všetky povinné polia')
        return
      }
      if (formData.password !== formData.confirmPassword) {
        setError('Heslá sa nezhodujú')
        return
      }
      if (formData.password.length < 8) {
        setError('Heslo musí mať aspoň 8 znakov')
        return
      }
    }
    setError('')
    setCurrentStep(currentStep + 1)
  }

  const prevStep = () => {
    setError('')
    setCurrentStep(currentStep - 1)
  }

  return (
    <div className="min-h-screen bg-gray-50">
      <Header />
      <div className="flex items-center justify-center py-12 px-4">
        <div className="w-full max-w-3xl">
          <div className="bg-white rounded-lg shadow-xl p-8 border border-gray-200">
            <div className="mb-8">
              <h1 className="text-3xl font-bold text-gray-900 mb-2 text-center">
                Registrácia
              </h1>
              <p className="text-gray-600 text-center mb-6">
                Vytvorte si profesionálny účet
              </p>
              
              {/* Progress Steps */}
              <div className="flex items-center justify-center mb-8">
                <div className="flex items-center">
                  <div className={`flex items-center justify-center w-10 h-10 rounded-full ${currentStep >= 1 ? 'bg-[#1dbf73] text-white' : 'bg-gray-200 text-gray-600'}`}>
                    1
                  </div>
                  <div className={`w-24 h-1 mx-2 ${currentStep >= 2 ? 'bg-[#1dbf73]' : 'bg-gray-200'}`}></div>
                  <div className={`flex items-center justify-center w-10 h-10 rounded-full ${currentStep >= 2 ? 'bg-[#1dbf73] text-white' : 'bg-gray-200 text-gray-600'}`}>
                    2
                  </div>
                  <div className={`w-24 h-1 mx-2 ${currentStep >= 3 ? 'bg-[#1dbf73]' : 'bg-gray-200'}`}></div>
                  <div className={`flex items-center justify-center w-10 h-10 rounded-full ${currentStep >= 3 ? 'bg-[#1dbf73] text-white' : 'bg-gray-200 text-gray-600'}`}>
                    3
                  </div>
                </div>
              </div>
            </div>

            <form onSubmit={handleSubmit} className="space-y-6">
              {error && (
                <div className="bg-red-50 border border-red-200 text-red-700 px-4 py-3 rounded">
                  {error}
                </div>
              )}

              {/* Step 1: Account Type & Basic Info */}
              {currentStep === 1 && (
                <div className="space-y-6">
                  <div>
                    <label className="block text-sm font-semibold text-gray-900 mb-4">
                      Typ účtu *
                    </label>
                    <div className="grid grid-cols-2 gap-4">
                      <button
                        type="button"
                        onClick={() => setIsCompany(false)}
                        className={`p-6 border-2 rounded-lg transition-all ${
                          !isCompany
                            ? 'border-[#1dbf73] bg-green-50'
                            : 'border-gray-200 hover:border-gray-300'
                        }`}
                      >
                        <div className="text-center">
                          <div className="flex justify-center mb-3">
                            <div className={`p-3 rounded-full ${
                              !isCompany ? 'bg-[#1dbf73]' : 'bg-gray-200'
                            }`}>
                              <User className={`w-6 h-6 ${
                                !isCompany ? 'text-white' : 'text-gray-600'
                              }`} />
                            </div>
                          </div>
                          <div className="font-semibold text-gray-900">Súkromná osoba</div>
                          <div className="text-sm text-gray-600 mt-1">Pre jednotlivcov</div>
                        </div>
                      </button>
                      <button
                        type="button"
                        onClick={() => setIsCompany(true)}
                        className={`p-6 border-2 rounded-lg transition-all ${
                          isCompany
                            ? 'border-[#1dbf73] bg-green-50'
                            : 'border-gray-200 hover:border-gray-300'
                        }`}
                      >
                        <div className="text-center">
                          <div className="flex justify-center mb-3">
                            <div className={`p-3 rounded-full ${
                              isCompany ? 'bg-[#1dbf73]' : 'bg-gray-200'
                            }`}>
                              <Building2 className={`w-6 h-6 ${
                                isCompany ? 'text-white' : 'text-gray-600'
                              }`} />
                            </div>
                          </div>
                          <div className="font-semibold text-gray-900">Firma</div>
                          <div className="text-sm text-gray-600 mt-1">Pre spoločnosti</div>
                        </div>
                      </button>
                    </div>
                  </div>

                  <div className="grid grid-cols-2 gap-4">
                    <div>
                      <label htmlFor="firstName" className="block text-sm font-medium text-gray-700 mb-2">
                        {isCompany ? 'Kontaktná osoba - Meno *' : 'Meno *'}
                      </label>
                      <input
                        id="firstName"
                        type="text"
                        value={formData.firstName}
                        onChange={(e) => setFormData({ ...formData, firstName: e.target.value })}
                        required
                        className="w-full px-4 py-3 border border-gray-300 rounded-lg text-gray-900 placeholder-gray-500 focus:outline-none focus:ring-2 focus:ring-[#1dbf73] focus:border-transparent"
                        placeholder="Ján"
                      />
                    </div>

                    <div>
                      <label htmlFor="lastName" className="block text-sm font-medium text-gray-700 mb-2">
                        {isCompany ? 'Kontaktná osoba - Priezvisko *' : 'Priezvisko *'}
                      </label>
                      <input
                        id="lastName"
                        type="text"
                        value={formData.lastName}
                        onChange={(e) => setFormData({ ...formData, lastName: e.target.value })}
                        required
                        className="w-full px-4 py-3 border border-gray-300 rounded-lg text-gray-900 placeholder-gray-500 focus:outline-none focus:ring-2 focus:ring-[#1dbf73] focus:border-transparent"
                        placeholder="Novák"
                      />
                    </div>
                  </div>

                  {isCompany && (
                    <>
                      <div>
                        <label htmlFor="companyName" className="block text-sm font-medium text-gray-700 mb-2">
                          Názov firmy *
                        </label>
                        <input
                          id="companyName"
                          type="text"
                          value={formData.companyName}
                          onChange={(e) => setFormData({ ...formData, companyName: e.target.value })}
                          required={isCompany}
                          className="w-full px-4 py-3 border border-gray-300 rounded-lg text-gray-900 placeholder-gray-500 focus:outline-none focus:ring-2 focus:ring-[#1dbf73] focus:border-transparent"
                          placeholder="Názov spoločnosti s.r.o."
                        />
                      </div>

                      <div className="grid grid-cols-2 gap-4">
                        <div>
                          <label htmlFor="companyId" className="block text-sm font-medium text-gray-700 mb-2">
                            IČO *
                          </label>
                          <input
                            id="companyId"
                            type="text"
                            value={formData.companyId}
                            onChange={(e) => setFormData({ ...formData, companyId: e.target.value })}
                            required={isCompany}
                            className="w-full px-4 py-3 border border-gray-300 rounded-lg text-gray-900 placeholder-gray-500 focus:outline-none focus:ring-2 focus:ring-[#1dbf73] focus:border-transparent"
                            placeholder="12345678"
                          />
                        </div>

                        <div>
                          <label htmlFor="companyTaxId" className="block text-sm font-medium text-gray-700 mb-2">
                            DIČ
                          </label>
                          <input
                            id="companyTaxId"
                            type="text"
                            value={formData.companyTaxId}
                            onChange={(e) => setFormData({ ...formData, companyTaxId: e.target.value })}
                            className="w-full px-4 py-3 border border-gray-300 rounded-lg text-gray-900 placeholder-gray-500 focus:outline-none focus:ring-2 focus:ring-[#1dbf73] focus:border-transparent"
                            placeholder="2020123456"
                          />
                        </div>
                      </div>
                    </>
                  )}

                  <div>
                    <label htmlFor="email" className="block text-sm font-medium text-gray-700 mb-2">
                      Email *
                    </label>
                    <input
                      id="email"
                      type="email"
                      value={formData.email}
                      onChange={(e) => setFormData({ ...formData, email: e.target.value })}
                      required
                      className="w-full px-4 py-3 border border-gray-300 rounded-lg text-gray-900 placeholder-gray-500 focus:outline-none focus:ring-2 focus:ring-[#1dbf73] focus:border-transparent"
                      placeholder="vas@email.com"
                    />
                  </div>

                  <div>
                    <label htmlFor="phone" className="block text-sm font-medium text-gray-700 mb-2">
                      Telefónne číslo *
                    </label>
                    <input
                      id="phone"
                      type="tel"
                      value={formData.phone}
                      onChange={(e) => setFormData({ ...formData, phone: e.target.value })}
                      required
                      className="w-full px-4 py-3 border border-gray-300 rounded-lg text-gray-900 placeholder-gray-500 focus:outline-none focus:ring-2 focus:ring-[#1dbf73] focus:border-transparent"
                      placeholder="+421 912 345 678"
                    />
                  </div>

                  <div className="grid grid-cols-2 gap-4">
                    <div>
                      <label htmlFor="password" className="block text-sm font-medium text-gray-700 mb-2">
                        Heslo *
                      </label>
                      <div className="relative">
                        <input
                          id="password"
                          type={showPassword ? 'text' : 'password'}
                          value={formData.password}
                          onChange={(e) => setFormData({ ...formData, password: e.target.value })}
                          required
                          className="w-full px-4 py-3 pr-12 border border-gray-300 rounded-lg text-gray-900 placeholder-gray-500 focus:outline-none focus:ring-2 focus:ring-[#1dbf73] focus:border-transparent"
                          placeholder="Min. 8 znakov"
                        />
                        <button
                          type="button"
                          onClick={() => setShowPassword(!showPassword)}
                          className="absolute right-3 top-1/2 -translate-y-1/2 text-gray-500 hover:text-gray-700 focus:outline-none"
                          aria-label={showPassword ? 'Skryť heslo' : 'Zobraziť heslo'}
                        >
                          {showPassword ? (
                            <EyeOff className="w-5 h-5" />
                          ) : (
                            <Eye className="w-5 h-5" />
                          )}
                        </button>
                      </div>
                      <p className="text-xs text-gray-500 mt-1">Heslo musí mať aspoň 8 znakov</p>
                    </div>

                    <div>
                      <label htmlFor="confirmPassword" className="block text-sm font-medium text-gray-700 mb-2">
                        Potvrďte heslo *
                      </label>
                      <div className="relative">
                        <input
                          id="confirmPassword"
                          type={showConfirmPassword ? 'text' : 'password'}
                          value={formData.confirmPassword}
                          onChange={(e) => setFormData({ ...formData, confirmPassword: e.target.value })}
                          required
                          className="w-full px-4 py-3 pr-12 border border-gray-300 rounded-lg text-gray-900 placeholder-gray-500 focus:outline-none focus:ring-2 focus:ring-[#1dbf73] focus:border-transparent"
                          placeholder="Zopakujte heslo"
                        />
                        <button
                          type="button"
                          onClick={() => setShowConfirmPassword(!showConfirmPassword)}
                          className="absolute right-3 top-1/2 -translate-y-1/2 text-gray-500 hover:text-gray-700 focus:outline-none"
                          aria-label={showConfirmPassword ? 'Skryť heslo' : 'Zobraziť heslo'}
                        >
                          {showConfirmPassword ? (
                            <EyeOff className="w-5 h-5" />
                          ) : (
                            <Eye className="w-5 h-5" />
                          )}
                        </button>
                      </div>
                    </div>
                  </div>

                  <button
                    type="button"
                    onClick={nextStep}
                    className="w-full bg-[#1dbf73] hover:bg-[#19a463] text-white font-semibold py-3 px-4 rounded-lg transition duration-200"
                  >
                    Pokračovať
                  </button>
                </div>
              )}

              {/* Step 2: Personal Details */}
              {currentStep === 2 && (
                <div className="space-y-6">
                  {!isCompany && (
                    <>
                      <div className="grid grid-cols-2 gap-4">
                        <div>
                          <label htmlFor="dateOfBirth" className="block text-sm font-medium text-gray-700 mb-2">
                            Dátum narodenia
                          </label>
                          <input
                            id="dateOfBirth"
                            type="date"
                            value={formData.dateOfBirth}
                            onChange={(e) => setFormData({ ...formData, dateOfBirth: e.target.value })}
                            max={new Date().toISOString().split('T')[0]}
                            className="w-full px-4 py-3 border border-gray-300 rounded-lg text-gray-900 focus:outline-none focus:ring-2 focus:ring-[#1dbf73] focus:border-transparent"
                          />
                        </div>

                        <div>
                          <label htmlFor="gender" className="block text-sm font-medium text-gray-700 mb-2">
                            Pohlavie
                          </label>
                          <select
                            id="gender"
                            value={formData.gender}
                            onChange={(e) => setFormData({ ...formData, gender: e.target.value })}
                            className="w-full px-4 py-3 border border-gray-300 rounded-lg text-gray-900 focus:outline-none focus:ring-2 focus:ring-[#1dbf73] focus:border-transparent"
                          >
                            <option value="">-- Vybrať --</option>
                            <option value="MALE">Muž</option>
                            <option value="FEMALE">Žena</option>
                            <option value="OTHER">Iné</option>
                          </select>
                        </div>
                      </div>
                    </>
                  )}

                  <div>
                    <label htmlFor="address" className="block text-sm font-medium text-gray-700 mb-2">
                      Adresa
                    </label>
                    <input
                      id="address"
                      type="text"
                      value={formData.address}
                      onChange={(e) => setFormData({ ...formData, address: e.target.value })}
                      className="w-full px-4 py-3 border border-gray-300 rounded-lg text-gray-900 placeholder-gray-500 focus:outline-none focus:ring-2 focus:ring-[#1dbf73] focus:border-transparent"
                      placeholder="Ulica a číslo"
                    />
                  </div>

                  <div className="grid grid-cols-3 gap-4">
                    <div>
                      <label htmlFor="city" className="block text-sm font-medium text-gray-700 mb-2">
                        Mesto
                      </label>
                      <input
                        id="city"
                        type="text"
                        value={formData.city}
                        onChange={(e) => setFormData({ ...formData, city: e.target.value })}
                        className="w-full px-4 py-3 border border-gray-300 rounded-lg text-gray-900 placeholder-gray-500 focus:outline-none focus:ring-2 focus:ring-[#1dbf73] focus:border-transparent"
                        placeholder="Bratislava"
                      />
                    </div>

                    <div>
                      <label htmlFor="postalCode" className="block text-sm font-medium text-gray-700 mb-2">
                        PSČ
                      </label>
                      <input
                        id="postalCode"
                        type="text"
                        value={formData.postalCode}
                        onChange={(e) => setFormData({ ...formData, postalCode: e.target.value })}
                        className="w-full px-4 py-3 border border-gray-300 rounded-lg text-gray-900 placeholder-gray-500 focus:outline-none focus:ring-2 focus:ring-[#1dbf73] focus:border-transparent"
                        placeholder="811 01"
                      />
                    </div>

                    <div>
                      <label htmlFor="country" className="block text-sm font-medium text-gray-700 mb-2">
                        Krajina
                      </label>
                      <select
                        id="country"
                        value={formData.country}
                        onChange={(e) => setFormData({ ...formData, country: e.target.value })}
                        className="w-full px-4 py-3 border border-gray-300 rounded-lg text-gray-900 focus:outline-none focus:ring-2 focus:ring-[#1dbf73] focus:border-transparent"
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

                  <div className="flex gap-4">
                    <button
                      type="button"
                      onClick={prevStep}
                      className="flex-1 bg-gray-200 hover:bg-gray-300 text-gray-900 font-semibold py-3 px-4 rounded-lg transition duration-200"
                    >
                      Späť
                    </button>
                    <button
                      type="button"
                      onClick={nextStep}
                      className="flex-1 bg-[#1dbf73] hover:bg-[#19a463] text-white font-semibold py-3 px-4 rounded-lg transition duration-200"
                    >
                      Pokračovať
                    </button>
                  </div>
                </div>
              )}

              {/* Step 3: Review & Submit */}
              {currentStep === 3 && (
                <div className="space-y-6">
                  <div className="bg-gray-50 rounded-lg p-6 space-y-4">
                    <h3 className="font-semibold text-gray-900 mb-4">Prehľad údajov</h3>
                    
                    <div className="grid grid-cols-2 gap-4 text-sm">
                      <div>
                        <span className="text-gray-600">Typ účtu:</span>
                        <span className="ml-2 font-medium text-gray-900">{isCompany ? 'Firma' : 'Súkromná osoba'}</span>
                      </div>
                      <div>
                        <span className="text-gray-600">Email:</span>
                        <span className="ml-2 font-medium text-gray-900">{formData.email}</span>
                      </div>
                      <div>
                        <span className="text-gray-600">Meno:</span>
                        <span className="ml-2 font-medium text-gray-900">{formData.firstName} {formData.lastName}</span>
                      </div>
                      <div>
                        <span className="text-gray-600">Telefón:</span>
                        <span className="ml-2 font-medium text-gray-900">{formData.phone}</span>
                      </div>
                      {isCompany && (
                        <>
                          <div>
                            <span className="text-gray-600">Názov firmy:</span>
                            <span className="ml-2 font-medium text-gray-900">{formData.companyName}</span>
                          </div>
                          <div>
                            <span className="text-gray-600">IČO:</span>
                            <span className="ml-2 font-medium text-gray-900">{formData.companyId}</span>
                          </div>
                        </>
                      )}
                      {formData.city && (
                        <div>
                          <span className="text-gray-600">Mesto:</span>
                          <span className="ml-2 font-medium text-gray-900">{formData.city}</span>
                        </div>
                      )}
                    </div>
                  </div>

                  <div className="flex gap-4">
                    <button
                      type="button"
                      onClick={prevStep}
                      className="flex-1 bg-gray-200 hover:bg-gray-300 text-gray-900 font-semibold py-3 px-4 rounded-lg transition duration-200"
                    >
                      Späť
                    </button>
                    <button
                      type="submit"
                      disabled={loading}
                      className="flex-1 bg-[#1dbf73] hover:bg-[#19a463] disabled:bg-gray-400 disabled:cursor-not-allowed text-white font-semibold py-3 px-4 rounded-lg transition duration-200"
                    >
                      {loading ? 'Registrácia...' : 'Dokončiť registráciu'}
                    </button>
                  </div>
                </div>
              )}
            </form>

            <div className="mt-6 text-center">
              <p className="text-gray-600">
                Už máte účet?{' '}
                <Link href="/signin" className="text-[#1dbf73] hover:text-[#19a463] font-medium">
                  Prihláste sa
                </Link>
              </p>
            </div>
          </div>
        </div>
      </div>
      <Footer />
    </div>
  )
}
