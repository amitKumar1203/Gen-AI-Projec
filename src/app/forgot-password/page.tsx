'use client'

import { useState } from 'react'
import Link from 'next/link'

const API_URL = typeof window !== 'undefined' && window.location.hostname !== 'localhost' 
  ? 'https://onto-friday-depth-superior.trycloudflare.com/api'
  : 'http://localhost:5000/api'

export default function ForgotPasswordPage() {
  const [email, setEmail] = useState('')
  const [isLoading, setIsLoading] = useState(false)
  const [message, setMessage] = useState('')
  const [error, setError] = useState('')

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    setIsLoading(true)
    setError('')
    setMessage('')

    try {
      const res = await fetch(`${API_URL}/auth/forgot-password`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ email })
      })

      const data = await res.json()
      
      if (res.ok) {
        setMessage(data.message || 'If an account exists, a reset link will be sent')
        setEmail('')
      } else {
        setError(data.error || 'Something went wrong')
      }
    } catch (err) {
      setError('Failed to connect to server')
    } finally {
      setIsLoading(false)
    }
  }

  return (
    <main className="min-h-[100dvh] relative overflow-hidden flex items-center justify-center px-4">
      <div className="gradient-bg" />
      <div className="orb orb-1 hidden sm:block" />
      <div className="orb orb-2 hidden sm:block" />

      <div className="relative z-10 w-full max-w-md">
        <div className="text-center mb-6 sm:mb-8">
          <Link href="/" className="inline-flex items-center gap-2 sm:gap-3 mb-4 sm:mb-6">
            <div className="w-10 h-10 sm:w-12 sm:h-12 rounded-xl sm:rounded-2xl bg-gradient-to-br from-violet-500 via-purple-500 to-pink-500 flex items-center justify-center logo-pulse">
              <svg className="w-6 h-6 sm:w-7 sm:h-7 text-white" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M13 10V3L4 14h7v7l9-11h-7z" />
              </svg>
            </div>
            <span className="text-xl sm:text-2xl font-bold text-white">AmitAI</span>
          </Link>
          <h1 className="text-2xl sm:text-3xl font-bold text-white mb-2">Forgot Password?</h1>
          <p className="text-gray-400 text-sm sm:text-base">Enter your email and we'll send you a reset link</p>
        </div>

        <div className="glass rounded-xl sm:rounded-2xl p-6 sm:p-8">
          {message && (
            <div className="mb-4 px-4 py-3 bg-green-500/20 border border-green-500/30 rounded-lg text-green-300 text-sm">
              {message}
            </div>
          )}
          
          {error && (
            <div className="mb-4 px-4 py-3 bg-red-500/20 border border-red-500/30 rounded-lg text-red-300 text-sm">
              {error}
            </div>
          )}

          <form onSubmit={handleSubmit} className="space-y-4 sm:space-y-5">
            <div>
              <label className="block text-sm font-medium text-gray-300 mb-1.5 sm:mb-2">Email</label>
              <input
                type="email"
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                className="w-full px-3 sm:px-4 py-2.5 sm:py-3 bg-white/5 border border-white/10 rounded-lg sm:rounded-xl text-white placeholder-gray-500 focus:outline-none focus:ring-2 focus:ring-purple-500 text-sm sm:text-base"
                placeholder="Enter your email"
                required
              />
            </div>

            <button
              type="submit"
              disabled={isLoading}
              className="w-full py-2.5 sm:py-3 bg-gradient-to-r from-violet-600 to-purple-600 text-white font-semibold rounded-lg sm:rounded-xl hover:from-violet-500 hover:to-purple-500 disabled:opacity-50 disabled:cursor-not-allowed transition-all btn-glow text-sm sm:text-base"
            >
              {isLoading ? 'Sending...' : 'Send Reset Link'}
            </button>
          </form>

          <div className="mt-6 text-center">
            <Link href="/login" className="text-purple-400 hover:text-purple-300 text-sm">
              ← Back to Login
            </Link>
          </div>
        </div>
      </div>
    </main>
  )
}
