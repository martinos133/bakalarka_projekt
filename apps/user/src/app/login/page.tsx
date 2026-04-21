'use client'

import { useState, useEffect } from 'react'
import { useRouter } from 'next/navigation'
import Link from 'next/link'
import { api } from '@/lib/api'
import { isAuthenticated } from '@/lib/auth'

export default function LoginPage() {
  const router = useRouter()
  const [email, setEmail] = useState('')
  const [password, setPassword] = useState('')
  const [error, setError] = useState('')
  const [loading, setLoading] = useState(false)

  // Presmerovanie, ak je používateľ už prihlásený
  useEffect(() => {
    if (isAuthenticated()) {
      router.push('/')
    }
  }, [router])

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    setError('')
    setLoading(true)

    try {
      const data = await api.login({ email, password })

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
        setError(err.message || 'Nastala chyba pri prihlásení')
      }
    } finally {
      setLoading(false)
    }
  }

  return (
    <div className="min-h-screen flex items-center justify-center bg-dark px-4">
      <div className="w-full max-w-sm">
        <div className="text-center mb-8">
          <div className="mb-5 flex justify-center">
            <div className="flex items-center gap-1.5" aria-label="RentMe">
              <span className="text-3xl font-serif italic text-white tracking-tight">RentMe</span>
              <span className="w-2.5 h-2.5 bg-accent rounded-full" aria-hidden></span>
            </div>
          </div>
          <h1 className="text-2xl font-bold text-white tracking-tight">Prihlásenie</h1>
          <p className="text-sm text-muted mt-1">Prihláste sa do svojho účtu</p>
        </div>

        <div className="card p-6">
          <form onSubmit={handleSubmit} className="space-y-5">
            {error && (
              <div className="bg-red-500/10 border border-red-500/20 text-red-300 px-4 py-3 rounded-xl text-sm">
                {error}
              </div>
            )}

            <div>
              <label htmlFor="email" className="block text-sm font-medium text-gray-300 mb-1.5">
                Email
              </label>
              <input
                id="email"
                type="email"
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                suppressHydrationWarning
                required
                className="w-full px-4 py-2.5 bg-white/[0.06] border border-white/[0.06] rounded-xl text-white placeholder-white/35 focus:outline-none focus:border-accent/40 focus:bg-white/[0.08] transition-all text-sm"
                placeholder="vas@email.com"
              />
            </div>

            <div>
              <label htmlFor="password" className="block text-sm font-medium text-gray-300 mb-1.5">
                Heslo
              </label>
              <input
                id="password"
                type="password"
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                suppressHydrationWarning
                required
                className="w-full px-4 py-2.5 bg-white/[0.06] border border-white/[0.06] rounded-xl text-white placeholder-white/35 focus:outline-none focus:border-accent/40 focus:bg-white/[0.08] transition-all text-sm"
                placeholder="••••••••"
              />
            </div>

            <button
              type="submit"
              disabled={loading}
              className="w-full bg-accent hover:bg-accent-light disabled:bg-gray-700 disabled:cursor-not-allowed text-dark font-semibold py-2.5 px-4 rounded-xl transition-all duration-200 text-sm"
            >
              {loading ? 'Prihlasovanie...' : 'Prihlásiť sa'}
            </button>
          </form>

          <div className="mt-6 text-center">
            <p className="text-sm text-white/55">
              Nemáte účet?{' '}
              <Link href="/register" className="text-accent hover:text-accent-light font-medium">
                Zaregistrujte sa
              </Link>
            </p>
          </div>
        </div>
      </div>
    </div>
  )
}
