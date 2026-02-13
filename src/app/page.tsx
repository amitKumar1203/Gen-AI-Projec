'use client'

import { useEffect } from 'react'
import { useRouter } from 'next/navigation'
import Link from 'next/link'
import { useAuth } from '@/contexts/AuthContext'

export default function Home() {
  const { user, isLoading } = useAuth()
  const router = useRouter()

  useEffect(() => {
    if (!isLoading && user) {
      router.push('/dashboard')
    }
  }, [user, isLoading, router])

  if (isLoading) {
    return (
      <main className="min-h-screen flex items-center justify-center">
        <div className="gradient-bg" />
        <div className="text-white">Loading...</div>
      </main>
    )
  }

  return (
    <main className="min-h-[100dvh] relative overflow-hidden">
      {/* Background */}
      <div className="gradient-bg" />
      <div className="orb orb-1 hidden sm:block" />
      <div className="orb orb-2 hidden sm:block" />
      <div className="orb orb-3 hidden sm:block" />

      <div className="relative z-10 min-h-[100dvh] flex flex-col">
        {/* Nav */}
        <nav className="px-4 sm:px-6 py-3 sm:py-4">
          <div className="max-w-6xl mx-auto flex items-center justify-between">
            <div className="flex items-center gap-2 sm:gap-3">
              <div className="w-8 h-8 sm:w-10 sm:h-10 rounded-lg sm:rounded-xl bg-gradient-to-br from-violet-500 via-purple-500 to-pink-500 flex items-center justify-center logo-pulse">
                <svg className="w-5 h-5 sm:w-6 sm:h-6 text-white" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M13 10V3L4 14h7v7l9-11h-7z" />
                </svg>
              </div>
              <span className="text-lg sm:text-xl font-bold text-white">AmitAI</span>
            </div>
            <div className="flex items-center gap-2 sm:gap-4">
              <Link
                href="/login"
                className="px-3 sm:px-5 py-1.5 sm:py-2 text-sm sm:text-base text-gray-300 hover:text-white transition-all"
              >
                Login
              </Link>
              <Link
                href="/register"
                className="px-3 sm:px-5 py-1.5 sm:py-2 text-sm sm:text-base bg-gradient-to-r from-violet-600 to-purple-600 text-white rounded-lg sm:rounded-xl hover:from-violet-500 hover:to-purple-500 transition-all btn-glow"
              >
                Get Started
              </Link>
            </div>
          </div>
        </nav>

        {/* Hero */}
        <div className="flex-1 flex items-center justify-center px-4 sm:px-6 py-8">
          <div className="max-w-4xl text-center">
            <div className="inline-flex items-center gap-2 px-3 sm:px-4 py-1.5 sm:py-2 glass rounded-full mb-6 sm:mb-8">
              <span className="w-2 h-2 bg-green-400 rounded-full animate-pulse"></span>
              <span className="text-xs sm:text-sm text-gray-300">Powered by Multiple AI Models</span>
            </div>

            <h1 className="text-3xl sm:text-5xl md:text-7xl font-bold mb-4 sm:mb-6">
              <span className="bg-gradient-to-r from-white via-purple-200 to-pink-200 bg-clip-text text-transparent">
                Your Intelligent
              </span>
              <br />
              <span className="bg-gradient-to-r from-violet-400 via-purple-400 to-pink-400 bg-clip-text text-transparent">
                AI Assistant
              </span>
            </h1>

            <p className="text-base sm:text-xl text-gray-400 max-w-2xl mx-auto mb-8 sm:mb-10 px-4">
              Chat with multiple AI models, analyze your resume with AI-powered feedback, 
              and boost your productivity with AmitAI.
            </p>

            <div className="flex flex-col sm:flex-row items-center justify-center gap-3 sm:gap-4">
              <Link
                href="/register"
                className="w-full sm:w-auto px-6 sm:px-8 py-3 sm:py-4 bg-gradient-to-r from-violet-600 to-purple-600 text-white font-semibold rounded-lg sm:rounded-xl hover:from-violet-500 hover:to-purple-500 transition-all duration-300 btn-glow flex items-center justify-center gap-2"
              >
                Start Free
                <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M13 7l5 5m0 0l-5 5m5-5H6" />
                </svg>
              </Link>
              <Link
                href="/login"
                className="w-full sm:w-auto px-6 sm:px-8 py-3 sm:py-4 glass text-white font-semibold rounded-lg sm:rounded-xl hover:bg-white/10 transition-all duration-300 text-center"
              >
                Sign In
              </Link>
            </div>

            {/* Features */}
            <div className="grid grid-cols-1 sm:grid-cols-3 gap-4 sm:gap-6 mt-12 sm:mt-20 px-2">
              <div className="glass rounded-xl sm:rounded-2xl p-4 sm:p-6 text-left">
                <div className="w-10 h-10 sm:w-12 sm:h-12 rounded-lg sm:rounded-xl bg-gradient-to-br from-blue-500 to-cyan-500 flex items-center justify-center mb-3 sm:mb-4">
                  <svg className="w-5 h-5 sm:w-6 sm:h-6 text-white" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M8 12h.01M12 12h.01M16 12h.01M21 12c0 4.418-4.03 8-9 8a9.863 9.863 0 01-4.255-.949L3 20l1.395-3.72C3.512 15.042 3 13.574 3 12c0-4.418 4.03-8 9-8s9 3.582 9 8z" />
                  </svg>
                </div>
                <h3 className="text-base sm:text-lg font-semibold text-white mb-1 sm:mb-2">Multiple AI Models</h3>
                <p className="text-gray-400 text-xs sm:text-sm">Choose from Llama, Mixtral, GPT-4, and more.</p>
              </div>

              <div className="glass rounded-xl sm:rounded-2xl p-4 sm:p-6 text-left">
                <div className="w-10 h-10 sm:w-12 sm:h-12 rounded-lg sm:rounded-xl bg-gradient-to-br from-purple-500 to-pink-500 flex items-center justify-center mb-3 sm:mb-4">
                  <svg className="w-5 h-5 sm:w-6 sm:h-6 text-white" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12h6m-6 4h6m2 5H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z" />
                  </svg>
                </div>
                <h3 className="text-base sm:text-lg font-semibold text-white mb-1 sm:mb-2">Resume Analyzer</h3>
                <p className="text-gray-400 text-xs sm:text-sm">Get AI-powered feedback on your resume.</p>
              </div>

              <div className="glass rounded-xl sm:rounded-2xl p-4 sm:p-6 text-left">
                <div className="w-10 h-10 sm:w-12 sm:h-12 rounded-lg sm:rounded-xl bg-gradient-to-br from-orange-500 to-red-500 flex items-center justify-center mb-3 sm:mb-4">
                  <svg className="w-5 h-5 sm:w-6 sm:h-6 text-white" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 15v2m-6 4h12a2 2 0 002-2v-6a2 2 0 00-2-2H6a2 2 0 00-2 2v6a2 2 0 002 2zm10-10V7a4 4 0 00-8 0v4h8z" />
                  </svg>
                </div>
                <h3 className="text-base sm:text-lg font-semibold text-white mb-1 sm:mb-2">Secure Auth</h3>
                <p className="text-gray-400 text-xs sm:text-sm">Your data is protected with encryption.</p>
              </div>
            </div>
          </div>
        </div>

        {/* Footer */}
        <footer className="px-4 sm:px-6 py-4 sm:py-6 text-center text-gray-500 text-xs sm:text-sm">
          Built by Amit with Next.js and AI
        </footer>
      </div>
    </main>
  )
}
