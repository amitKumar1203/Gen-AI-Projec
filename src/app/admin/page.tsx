'use client'

import { useState, useEffect } from 'react'
import { useRouter } from 'next/navigation'
import Link from 'next/link'
import ReactMarkdown from 'react-markdown'
import { useAuth } from '@/contexts/AuthContext'

const API_URL = typeof window !== 'undefined' && window.location.hostname !== 'localhost'
  ? 'https://onto-friday-depth-superior.trycloudflare.com/api'
  : 'http://localhost:5000/api'

export default function AdminPage() {
  const { user, token, logout, isLoading: authLoading } = useAuth()
  const router = useRouter()
  const [activeTab, setActiveTab] = useState<'stats' | 'users' | 'feedback'>('stats')
  const [stats, setStats] = useState<{ totalUsers: number; totalResumeFeedbacks: number } | null>(null)
  const [users, setUsers] = useState<any[]>([])
  const [usersTotal, setUsersTotal] = useState(0)
  const [feedbackList, setFeedbackList] = useState<any[]>([])
  const [feedbackTotal, setFeedbackTotal] = useState(0)
  const [userSearch, setUserSearch] = useState('')
  const [searchInput, setSearchInput] = useState('')
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState('')
  const [accessDenied, setAccessDenied] = useState(false)
  const [expandedFeedbackId, setExpandedFeedbackId] = useState<number | null>(null)

  useEffect(() => {
    if (!authLoading && !user) {
      router.push('/login')
      return
    }
    if (token && user) checkAdminAndLoad()
  }, [token, user, authLoading, router])

  const checkAdminAndLoad = async () => {
    try {
      const res = await fetch(`${API_URL}/admin/stats`, {
        headers: { Authorization: `Bearer ${token}` }
      })
      if (res.status === 403) {
        setAccessDenied(true)
        return
      }
      if (!res.ok) throw new Error('Failed to load')
      const data = await res.json()
      setStats(data)
    } catch (e) {
      setAccessDenied(true)
    }
  }

  const loadUsers = async () => {
    if (!token) return
    setLoading(true)
    setError('')
    try {
      const params = new URLSearchParams()
      if (userSearch) params.set('search', userSearch)
      params.set('limit', '50')
      const res = await fetch(`${API_URL}/admin/users?${params}`, {
        headers: { Authorization: `Bearer ${token}` }
      })
      if (!res.ok) throw new Error('Failed to fetch users')
      const data = await res.json()
      setUsers(data.users)
      setUsersTotal(data.total)
    } catch (e: any) {
      setError(e.message || 'Error')
    } finally {
      setLoading(false)
    }
  }

  const loadFeedback = async () => {
    if (!token) return
    setLoading(true)
    setError('')
    try {
      const res = await fetch(`${API_URL}/admin/feedback?limit=100`, {
        headers: { Authorization: `Bearer ${token}` }
      })
      if (!res.ok) throw new Error('Failed to fetch feedback')
      const data = await res.json()
      setFeedbackList(data.feedback)
      setFeedbackTotal(data.total)
    } catch (e: any) {
      setError(e.message || 'Error')
    } finally {
      setLoading(false)
    }
  }

  useEffect(() => {
    if (activeTab === 'users' && token && !accessDenied) loadUsers()
  }, [activeTab, token, userSearch, accessDenied])

  useEffect(() => {
    if (activeTab === 'feedback' && token && !accessDenied) loadFeedback()
  }, [activeTab, token, accessDenied])

  if (authLoading) {
    return (
      <main className="min-h-screen flex items-center justify-center bg-slate-950">
        <div className="text-white">Loading...</div>
      </main>
    )
  }

  if (!user) return null

  if (accessDenied) {
    return (
      <main className="min-h-screen flex items-center justify-center bg-slate-950 px-4">
        <div className="glass rounded-2xl p-8 max-w-md text-center">
          <h1 className="text-xl font-bold text-white mb-2">Admin Access Denied</h1>
          <p className="text-gray-400 mb-4">Your account does not have admin access.</p>
          <Link href="/dashboard" className="text-purple-400 hover:text-purple-300">Back to Dashboard</Link>
        </div>
      </main>
    )
  }

  return (
    <main className="min-h-screen bg-slate-950 text-white">
      <div className="gradient-bg" />
      <div className="relative z-10 max-w-6xl mx-auto p-4 sm:p-6">
        <header className="flex flex-wrap items-center justify-between gap-4 mb-6">
          <div className="flex items-center gap-3">
            <Link href="/dashboard" className="text-gray-400 hover:text-white">← Dashboard</Link>
            <h1 className="text-xl sm:text-2xl font-bold">Admin Panel</h1>
          </div>
          <div className="flex items-center gap-2">
            <span className="text-sm text-gray-400">{user.email}</span>
            <button onClick={logout} className="px-3 py-1.5 text-sm text-red-400 hover:bg-red-500/10 rounded-lg">Logout</button>
          </div>
        </header>

        <div className="flex gap-2 mb-6 border-b border-white/10 pb-2">
          {(['stats', 'users', 'feedback'] as const).map((tab) => (
            <button
              key={tab}
              onClick={() => setActiveTab(tab)}
              className={`px-4 py-2 rounded-lg text-sm font-medium capitalize ${activeTab === tab ? 'bg-purple-500/30 text-white' : 'text-gray-400 hover:text-white'}`}
            >
              {tab === 'stats' ? 'Overview' : tab === 'users' ? 'Users' : 'AI Feedback'}
            </button>
          ))}
        </div>

        {error && <div className="mb-4 p-3 bg-red-500/20 border border-red-500/30 rounded-lg text-red-300 text-sm">{error}</div>}

        {activeTab === 'stats' && stats && (
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            <div className="glass rounded-xl p-6">
              <p className="text-gray-400 text-sm mb-1">Total Users</p>
              <p className="text-3xl font-bold text-white">{stats.totalUsers}</p>
            </div>
            <div className="glass rounded-xl p-6">
              <p className="text-gray-400 text-sm mb-1">Resume AI Feedbacks</p>
              <p className="text-3xl font-bold text-white">{stats.totalResumeFeedbacks}</p>
            </div>
          </div>
        )}

        {activeTab === 'users' && (
          <div className="space-y-4">
            <div className="flex flex-col sm:flex-row gap-2">
              <input
                type="text"
                value={searchInput}
                onChange={(e) => setSearchInput(e.target.value)}
                onKeyDown={(e) => e.key === 'Enter' && setUserSearch(searchInput)}
                placeholder="Search by name or email..."
                className="flex-1 px-4 py-2 bg-white/5 border border-white/10 rounded-lg text-white placeholder-gray-500 focus:outline-none focus:ring-2 focus:ring-purple-500"
              />
              <button onClick={() => setUserSearch(searchInput)} className="px-4 py-2 bg-purple-600 rounded-lg hover:bg-purple-500">Search</button>
            </div>
            {loading ? <p className="text-gray-400">Loading...</p> : (
              <div className="glass rounded-xl overflow-hidden">
                <div className="overflow-x-auto">
                  <table className="w-full text-left">
                    <thead>
                      <tr className="border-b border-white/10">
                        <th className="px-4 py-3 text-sm font-medium text-gray-400">Name</th>
                        <th className="px-4 py-3 text-sm font-medium text-gray-400">Email</th>
                        <th className="px-4 py-3 text-sm font-medium text-gray-400">Joined</th>
                      </tr>
                    </thead>
                    <tbody>
                      {users.map((u) => (
                        <tr key={u.id} className="border-b border-white/5 hover:bg-white/5">
                          <td className="px-4 py-3 text-white">{u.name}</td>
                          <td className="px-4 py-3 text-gray-300">{u.email}</td>
                          <td className="px-4 py-3 text-gray-500 text-sm">{new Date(u.createdAt).toLocaleDateString()}</td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>
                <p className="px-4 py-2 text-xs text-gray-500">Total: {usersTotal}</p>
              </div>
            )}
          </div>
        )}

        {activeTab === 'feedback' && (
          <div className="space-y-4">
            {loading ? <p className="text-gray-400">Loading...</p> : (
              <div className="space-y-3">
                <p className="text-sm text-gray-500">Total: {feedbackTotal} resume analyses</p>
                {feedbackList.map((item) => (
                  <div key={item.id} className="glass rounded-xl overflow-hidden">
                    <button
                      onClick={() => setExpandedFeedbackId(expandedFeedbackId === item.id ? null : item.id)}
                      className="w-full px-4 py-3 flex flex-wrap items-center justify-between gap-2 text-left hover:bg-white/5"
                    >
                      <div className="flex flex-wrap items-center gap-3">
                        <span className="font-medium text-white">{item.userName || '—'}</span>
                        <span className="text-gray-400 text-sm">{item.userEmail}</span>
                        <span className="text-gray-500 text-xs">{item.jobRole}</span>
                        <span className="text-gray-500 text-xs">{item.filename}</span>
                      </div>
                      <span className="text-xs text-gray-500">{new Date(item.createdAt).toLocaleString()}</span>
                      <span className="text-purple-400 text-sm">{expandedFeedbackId === item.id ? '▼ Hide' : '▶ Show AI feedback'}</span>
                    </button>
                    {expandedFeedbackId === item.id && (
                      <div className="px-4 pb-4 pt-0 border-t border-white/10">
                        <div className="prose prose-invert prose-sm max-w-none mt-3 text-gray-300">
                          <ReactMarkdown>{item.feedback}</ReactMarkdown>
                        </div>
                      </div>
                    )}
                  </div>
                ))}
                {feedbackList.length === 0 && <p className="text-gray-500">No resume feedback yet.</p>}
              </div>
            )}
          </div>
        )}
      </div>
    </main>
  )
}
