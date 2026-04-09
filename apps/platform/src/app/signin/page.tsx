'use client'

import { useState } from 'react'
import { useRouter, useSearchParams } from 'next/navigation'
import Link from 'next/link'
import Header from '@/components/Header'
import Footer from '@/components/Footer'
import { CmsGate } from '@/components/CmsGate'

const API_URL = process.env.NEXT_PUBLIC_API_URL || 'http://localhost:3001'

/** Povolené presmerovanie po prihlásení – len interné cesty */
function safeRedirect(path: string | null): string {
  if (!path || typeof path !== 'string') return '/'
  const p = path.trim()
  if (p.startsWith('/') && !p.startsWith('//')) return p
  return '/'
}

export default function SignInPage() {
  const router = useRouter()
  const searchParams = useSearchParams()
  const redirectTo = safeRedirect(searchParams.get('redirect'))
  const [email, setEmail] = useState('')
  const [password, setPassword] = useState('')
  const [error, setError] = useState('')
  const [loading, setLoading] = useState(false)

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    setError('')
    setLoading(true)

    try {
      const response = await fetch(`${API_URL}/auth/login`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({ email, password }),
      })

      const data = await response.json()

      if (!response.ok) {
        throw new Error(data.message || 'Prihlásenie zlyhalo')
      }

      // Uloženie tokenu do localStorage
      if (data.token) {
        localStorage.setItem('user_token', data.token)
        localStorage.setItem('user_user', JSON.stringify(data.user))
      }

      // Presmerovanie na pôvodnú stránku alebo domov
      router.push(redirectTo)
    } catch (err: any) {
      if (err.message === 'Failed to fetch' || err.name === 'TypeError') {
        setError('Nepodarilo sa pripojiť k API serveru. Skontrolujte, či API server beží.')
      } else {
        setError(err.message || 'Nastala chyba pri prihlásení')
      }
    } finally {
      setLoading(false)
    }
  }

  return (
    <CmsGate cmsSlug="signin" shell="headerFooterOnly">
    <div className="min-h-screen bg-dark">
      <Header />
      <div className="flex items-center justify-center py-12 px-4">
        <div className="w-full max-w-md">
          <div className="bg-dark rounded-lg shadow-lg shadow-black/20 p-8 border border-white/[0.08]">
            <h1 className="text-3xl font-bold text-white mb-2 text-center">
              Prihlásenie
            </h1>
            <p className="text-gray-500 text-center mb-8">
              Prihláste sa do svojho účtu
            </p>

            <form onSubmit={handleSubmit} className="space-y-6">
              {error && (
                <div className="bg-red-900/20 border border-red-800/30 text-red-400 px-4 py-3 rounded">
                  {error}
                </div>
              )}

              <div>
                <label htmlFor="email" className="block text-sm font-medium text-gray-300 mb-2">
                  Email
                </label>
                <input
                  id="email"
                  type="email"
                  value={email}
                  onChange={(e) => setEmail(e.target.value)}
                  required
                  className="w-full px-4 py-3 bg-dark-100 border border-white/10 rounded-lg text-white placeholder-white/40 focus:outline-none focus:ring-2 focus:ring-accent focus:border-transparent"
                  placeholder="vas@email.com"
                />
              </div>

              <div>
                <label htmlFor="password" className="block text-sm font-medium text-gray-300 mb-2">
                  Heslo
                </label>
                <input
                  id="password"
                  type="password"
                  value={password}
                  onChange={(e) => setPassword(e.target.value)}
                  required
                  className="w-full px-4 py-3 bg-dark-100 border border-white/10 rounded-lg text-white placeholder-white/40 focus:outline-none focus:ring-2 focus:ring-accent focus:border-transparent"
                  placeholder="••••••••"
                />
              </div>

              <button
                type="submit"
                disabled={loading}
                className="w-full bg-accent hover:bg-accent-light disabled:bg-gray-700 disabled:cursor-not-allowed text-white font-semibold py-3 px-4 rounded-lg transition duration-200"
              >
                {loading ? 'Prihlasovanie...' : 'Prihlásiť sa'}
              </button>
            </form>

            <div className="mt-6 text-center">
              <p className="text-gray-500">
                Nemáte účet?{' '}
                <Link href="/join" className="text-accent hover:text-accent font-medium">
                  Zaregistrujte sa
                </Link>
              </p>
            </div>
          </div>
        </div>
      </div>
      <Footer />
    </div>
    </CmsGate>
  )
}
