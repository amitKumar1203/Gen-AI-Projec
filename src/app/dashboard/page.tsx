'use client'

import { useState, useRef, useEffect } from 'react'
import { useRouter } from 'next/navigation'
import Link from 'next/link'
import ReactMarkdown from 'react-markdown'
import { useAuth } from '@/contexts/AuthContext'

interface Message {
  role: 'user' | 'assistant'
  content: string
  id: string
}

interface Model {
  key: string
  id: string
  name: string
  provider: string
}

interface ConversationItem {
  token: string
  title: string
  createdAt: string
  updatedAt: string
}

const API_URL = typeof window !== 'undefined' && window.location.hostname !== 'localhost' 
  ? 'https://onto-friday-depth-superior.trycloudflare.com/api'
  : 'http://localhost:5000/api'

export default function DashboardPage() {
  const { user, token, logout, isLoading: authLoading } = useAuth()
  const router = useRouter()
  
  const [activeTab, setActiveTab] = useState<'chat' | 'resume'>('chat')
  const [conversationToken, setConversationToken] = useState<string | null>(null)
  const [conversations, setConversations] = useState<ConversationItem[]>([])
  const [currentTitle, setCurrentTitle] = useState<string>('New Chat')
  const [messages, setMessages] = useState<Message[]>([])
  const [input, setInput] = useState('')
  const [isLoading, setIsLoading] = useState(false)
  const [error, setError] = useState<string | null>(null)
  const [models, setModels] = useState<Model[]>([])
  const [selectedModel, setSelectedModel] = useState('llama-3.3-70b')
  const [showModelSelector, setShowModelSelector] = useState(false)
  const [showMobileMenu, setShowMobileMenu] = useState(false)
  const [showSidebar, setShowSidebar] = useState(false)
  const messagesEndRef = useRef<HTMLDivElement>(null)
  const textareaRef = useRef<HTMLTextAreaElement>(null)

  const [file, setFile] = useState<File | null>(null)
  const [jobRole, setJobRole] = useState('Software Developer')
  const [feedback, setFeedback] = useState('')
  const [isAnalyzing, setIsAnalyzing] = useState(false)
  const [dragActive, setDragActive] = useState(false)
  const fileInputRef = useRef<HTMLInputElement>(null)

  useEffect(() => {
    if (!authLoading && !user) {
      router.push('/login')
    }
  }, [user, authLoading, router])

  useEffect(() => {
    if (token) {
      fetchModels()
      fetchConversations()
    }
  }, [token])

  const fetchConversations = async () => {
    try {
      const res = await fetch(`${API_URL}/chat/conversations`, {
        headers: { Authorization: `Bearer ${token}` }
      })
      const data = await res.json()
      if (data.conversations) setConversations(data.conversations)
    } catch (err) {
      console.error('Failed to fetch conversations:', err)
    }
  }

  const loadConversation = async (convToken: string) => {
    try {
      const res = await fetch(`${API_URL}/chat/conversations/${convToken}`, {
        headers: { Authorization: `Bearer ${token}` }
      })
      const data = await res.json()
      if (!res.ok) throw new Error(data.error)
      setConversationToken(data.token)
      setCurrentTitle(data.title || 'New Chat')
      setMessages((data.messages || []).map((m: any) => ({
        id: m.id.toString(),
        role: m.role,
        content: m.content
      })))
      setShowMobileMenu(false)
    } catch (err) {
      console.error('Failed to load conversation:', err)
      setError('Failed to load conversation')
    }
  }

  const startNewChat = () => {
    setConversationToken(null)
    setCurrentTitle('New Chat')
    setMessages([])
    setError(null)
    setShowMobileMenu(false)
  }

  const deleteCurrentConversation = async () => {
    if (!conversationToken) {
      setMessages([])
      return
    }
    try {
      await fetch(`${API_URL}/chat/conversations/${conversationToken}`, {
        method: 'DELETE',
        headers: { Authorization: `Bearer ${token}` }
      })
      setConversations(prev => prev.filter(c => c.token !== conversationToken))
      startNewChat()
      fetchConversations()
    } catch (err) {
      console.error('Failed to delete conversation:', err)
    }
  }

  useEffect(() => {
    messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' })
  }, [messages])

  useEffect(() => {
    if (textareaRef.current) {
      textareaRef.current.style.height = 'auto'
      textareaRef.current.style.height = `${Math.min(textareaRef.current.scrollHeight, 120)}px`
    }
  }, [input])

  const fetchModels = async () => {
    try {
      const res = await fetch(`${API_URL}/chat/models`, {
        headers: { Authorization: `Bearer ${token}` }
      })
      const data = await res.json()
      if (data.models) setModels(data.models)
    } catch (err) {
      console.error('Failed to fetch models:', err)
    }
  }

  const generateId = () => Math.random().toString(36).substring(7)

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    if (!input.trim() || isLoading) return

    const userMessage = input.trim()
    setInput('')
    setError(null)

    const newUserMessage: Message = { role: 'user', content: userMessage, id: generateId() }
    const newMessages = [...messages, newUserMessage]
    setMessages(newMessages)
    setIsLoading(true)

    try {
      const res = await fetch(`${API_URL}/chat`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          Authorization: `Bearer ${token}`
        },
        body: JSON.stringify({
          message: userMessage,
          conversationToken: conversationToken || undefined,
          conversationHistory: messages.slice(-10),
          modelKey: selectedModel
        }),
      })

      const data = await res.json()
      if (!res.ok) throw new Error(data.error || 'Failed to get response')

      const assistantMessage: Message = { role: 'assistant', content: data.response, id: generateId() }
      setMessages([...newMessages, assistantMessage])
      if (data.conversationToken) {
        setConversationToken(data.conversationToken)
        if (data.title) setCurrentTitle(data.title)
        setConversations(prev => {
          const rest = prev.filter(c => c.token !== data.conversationToken)
          return [{ token: data.conversationToken, title: data.title || 'New Chat', createdAt: '', updatedAt: '' }, ...rest]
        })
        fetchConversations()
      }
    } catch (err: any) {
      setError(err.message || 'Something went wrong')
    } finally {
      setIsLoading(false)
    }
  }

  const handleKeyDown = (e: React.KeyboardEvent) => {
    if (e.key === 'Enter' && !e.shiftKey) {
      e.preventDefault()
      handleSubmit(e)
    }
  }

  const handleDrag = (e: React.DragEvent) => {
    e.preventDefault()
    e.stopPropagation()
    if (e.type === 'dragenter' || e.type === 'dragover') setDragActive(true)
    else if (e.type === 'dragleave') setDragActive(false)
  }

  const handleDrop = (e: React.DragEvent) => {
    e.preventDefault()
    e.stopPropagation()
    setDragActive(false)
    if (e.dataTransfer.files && e.dataTransfer.files[0]) {
      const droppedFile = e.dataTransfer.files[0]
      if (validateFile(droppedFile)) {
        setFile(droppedFile)
        setError(null)
      }
    }
  }

  const validateFile = (file: File): boolean => {
    const allowedTypes = ['application/pdf', 'text/plain', 'application/msword', 'application/vnd.openxmlformats-officedocument.wordprocessingml.document']
    if (!allowedTypes.includes(file.type)) {
      setError('Please upload a PDF, TXT, DOC, or DOCX file')
      return false
    }
    if (file.size > 5 * 1024 * 1024) {
      setError('File size must be less than 5MB')
      return false
    }
    return true
  }

  const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    if (e.target.files && e.target.files[0]) {
      const selectedFile = e.target.files[0]
      if (validateFile(selectedFile)) {
        setFile(selectedFile)
        setError(null)
      }
    }
  }

  const handleAnalyze = async () => {
    if (!file) {
      setError('Please upload a resume file')
      return
    }

    setIsAnalyzing(true)
    setError(null)
    setFeedback('')

    const formData = new FormData()
    formData.append('resume', file)
    formData.append('jobRole', jobRole)

    try {
      const res = await fetch(`${API_URL}/resume/analyze`, {
        method: 'POST',
        headers: { Authorization: `Bearer ${token}` },
        body: formData
      })
      const data = await res.json()
      if (!res.ok) throw new Error(data.error || 'Analysis failed')
      setFeedback(data.feedback)
    } catch (err: any) {
      setError(err.message || 'Failed to analyze resume')
    } finally {
      setIsAnalyzing(false)
    }
  }

  const currentModel = models.find(m => m.key === selectedModel)

  if (authLoading) {
    return (
      <main className="min-h-screen flex items-center justify-center">
        <div className="gradient-bg" />
        <div className="text-white">Loading...</div>
      </main>
    )
  }

  if (!user) return null

  return (
    <main className="min-h-screen relative">
      <div className="gradient-bg" />
      <div className="orb orb-1 hidden sm:block" />
      <div className="orb orb-2 hidden sm:block" />

      <div className="relative z-10 max-w-6xl mx-auto h-[100dvh] flex flex-col min-h-0">
        {/* Header - overflow-visible so dropdown is not clipped */}
        <header className="px-3 sm:px-6 py-3 sm:py-4 shrink-0 overflow-visible">
          <div className="glass rounded-xl sm:rounded-2xl px-3 sm:px-6 py-3 sm:py-4 flex items-center justify-between overflow-visible">
            <div className="flex items-center gap-2 sm:gap-4">
              <div className="w-8 h-8 sm:w-10 sm:h-10 rounded-lg sm:rounded-xl bg-gradient-to-br from-violet-500 via-purple-500 to-pink-500 flex items-center justify-center logo-pulse">
                <svg className="w-4 h-4 sm:w-6 sm:h-6 text-white" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M13 10V3L4 14h7v7l9-11h-7z" />
                </svg>
              </div>
              <div>
                <h1 className="text-base sm:text-xl font-bold text-white">AmitAI</h1>
                <p className="text-[10px] sm:text-xs text-gray-400 truncate max-w-[100px] sm:max-w-none">Welcome, {user.name}</p>
              </div>
            </div>

            {/* Desktop controls */}
            <div className="hidden md:flex items-center gap-3 overflow-visible">
              {activeTab === 'chat' && (
                <div className="relative overflow-visible">
                  <button
                    onClick={() => setShowModelSelector(!showModelSelector)}
                    className="flex items-center gap-2 px-4 py-2 glass rounded-xl hover:bg-white/10 transition-all"
                  >
                    <span className="w-2 h-2 bg-green-400 rounded-full"></span>
                    <span className="text-sm text-gray-300">{currentModel?.name || 'Select Model'}</span>
                    <svg className="w-4 h-4 text-gray-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 9l-7 7-7-7" />
                    </svg>
                  </button>
                  {showModelSelector && (
                    <div className="absolute top-full mt-2 right-0 w-64 glass rounded-xl p-2 z-[100] shadow-xl max-h-[280px] overflow-y-auto">
                      {models.map((model) => (
                        <button
                          key={model.key}
                          onClick={() => { setSelectedModel(model.key); setShowModelSelector(false) }}
                          className={`w-full text-left px-4 py-3 rounded-lg transition-all ${selectedModel === model.key ? 'bg-purple-500/30 text-white' : 'text-gray-300 hover:bg-white/10'}`}
                        >
                          <div className="font-medium">{model.name}</div>
                          <div className="text-xs text-gray-500 capitalize">{model.provider}</div>
                        </button>
                      ))}
                    </div>
                  )}
                </div>
              )}
              <Link href="/admin" className="px-4 py-2 text-sm text-gray-400 hover:text-white transition-all">Admin</Link>
              <button onClick={logout} className="px-4 py-2 text-sm text-gray-400 hover:text-white transition-all">Logout</button>
            </div>

            {/* Mobile menu button */}
            <button onClick={() => setShowMobileMenu(!showMobileMenu)} className="md:hidden p-2 text-gray-400 hover:text-white">
              <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d={showMobileMenu ? "M6 18L18 6M6 6l12 12" : "M4 6h16M4 12h16M4 18h16"} />
              </svg>
            </button>
          </div>

          {/* Mobile dropdown menu */}
          {showMobileMenu && (
            <div className="md:hidden mt-2 glass rounded-xl overflow-hidden">
              {activeTab === 'chat' && (
                <div className="p-3 border-b border-white/10">
                  <p className="text-xs text-gray-500 px-2 mb-2 uppercase tracking-wider">Select Model</p>
                  <div className="max-h-[200px] overflow-y-auto space-y-1 scrollbar-thin">
                    {models.map((model) => (
                      <button
                        key={model.key}
                        onClick={() => { setSelectedModel(model.key); setShowMobileMenu(false) }}
                        className={`w-full text-left px-4 py-3 rounded-lg flex items-center justify-between ${selectedModel === model.key ? 'bg-purple-500/30 text-white' : 'text-gray-300 active:bg-white/10'}`}
                      >
                        <div>
                          <span className="block text-sm font-medium">{model.name}</span>
                          <span className="block text-xs text-gray-500 capitalize">{model.provider}</span>
                        </div>
                        {selectedModel === model.key && (
                          <svg className="w-5 h-5 text-purple-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 13l4 4L19 7" />
                          </svg>
                        )}
                      </button>
                    ))}
                  </div>
                </div>
              )}
              <Link href="/admin" onClick={() => setShowMobileMenu(false)} className="w-full text-left px-6 py-3 text-purple-400 text-sm font-medium flex items-center gap-3 active:bg-white/5">
                Admin Panel
              </Link>
              <button 
                onClick={() => { logout(); setShowMobileMenu(false) }} 
                className="w-full text-left px-6 py-4 text-red-400 text-sm font-medium flex items-center gap-3 active:bg-white/5"
              >
                <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M17 16l4-4m0 0l-4-4m4 4H7m6 4v1a3 3 0 01-3 3H6a3 3 0 01-3-3V7a3 3 0 013-3h4a3 3 0 013 3v1" />
                </svg>
                Logout
              </button>
            </div>
          )}
        </header>

        {/* Tabs + Content - overflow hidden so header dropdown can show */}
        <div className="flex-1 flex flex-col min-h-0 overflow-hidden">
        {/* Tabs */}
        <div className="px-3 sm:px-6 shrink-0">
          <div className="flex gap-1 sm:gap-2">
            <button
              onClick={() => setActiveTab('chat')}
              className={`flex-1 sm:flex-none px-3 sm:px-6 py-2 sm:py-3 rounded-t-lg sm:rounded-t-xl text-sm sm:text-base font-medium transition-all ${activeTab === 'chat' ? 'bg-white/10 text-white border-b-2 border-purple-500' : 'text-gray-400 hover:text-white hover:bg-white/5'}`}
            >
              <span className="flex items-center justify-center gap-1 sm:gap-2">
                <svg className="w-4 h-4 sm:w-5 sm:h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M8 12h.01M12 12h.01M16 12h.01M21 12c0 4.418-4.03 8-9 8a9.863 9.863 0 01-4.255-.949L3 20l1.395-3.72C3.512 15.042 3 13.574 3 12c0-4.418 4.03-8 9-8s9 3.582 9 8z" />
                </svg>
                <span className="hidden xs:inline">Chat</span>
              </span>
            </button>
            <button
              onClick={() => setActiveTab('resume')}
              className={`flex-1 sm:flex-none px-3 sm:px-6 py-2 sm:py-3 rounded-t-lg sm:rounded-t-xl text-sm sm:text-base font-medium transition-all ${activeTab === 'resume' ? 'bg-white/10 text-white border-b-2 border-purple-500' : 'text-gray-400 hover:text-white hover:bg-white/5'}`}
            >
              <span className="flex items-center justify-center gap-1 sm:gap-2">
                <svg className="w-4 h-4 sm:w-5 sm:h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12h6m-6 4h6m2 5H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z" />
                </svg>
                <span className="hidden xs:inline">Resume</span>
                {feedback && <span className="w-2 h-2 bg-green-400 rounded-full"></span>}
              </span>
            </button>
          </div>
        </div>

        {/* Content Area */}
        <div className="flex-1 overflow-hidden px-3 sm:px-6 pb-3 sm:pb-6">
          <div className="glass rounded-xl sm:rounded-2xl rounded-tl-none h-full flex flex-col overflow-hidden">
            
            {/* Chat Tab */}
            {activeTab === 'chat' && (
              <>
                <div className="flex flex-1 min-h-0">
                  {/* Conversations sidebar */}
                  <div className={`${showSidebar ? 'w-56 sm:w-64' : 'w-0'} flex-shrink-0 border-r border-white/10 flex flex-col overflow-hidden transition-all duration-200`}>
                    <div className="p-2 flex items-center justify-between border-b border-white/10 min-h-[44px]">
                      <button
                        onClick={startNewChat}
                        className="flex items-center gap-2 px-3 py-2 rounded-lg bg-purple-500/20 text-purple-300 hover:bg-purple-500/30 text-sm font-medium w-full justify-center"
                      >
                        <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 4v16m8-8H4" />
                        </svg>
                        New Chat
                      </button>
                      <button onClick={() => setShowSidebar(false)} className="p-1.5 text-gray-500 hover:text-white lg:hidden">
                        <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" /></svg>
                      </button>
                    </div>
                    <div className="flex-1 overflow-y-auto p-2 space-y-1 scrollbar-thin">
                      {conversations.map((c) => (
                        <button
                          key={c.token}
                          onClick={() => loadConversation(c.token)}
                          className={`w-full text-left px-3 py-2.5 rounded-lg text-sm truncate transition-all ${conversationToken === c.token ? 'bg-purple-500/30 text-white' : 'text-gray-400 hover:bg-white/10 hover:text-white'}`}
                          title={c.title}
                        >
                          {c.title || 'New Chat'}
                        </button>
                      ))}
                    </div>
                  </div>
                  {!showSidebar && (
                    <button onClick={() => setShowSidebar(true)} className="absolute left-2 top-2 z-10 p-2 rounded-lg bg-white/10 text-gray-400 hover:text-white">
                      <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 6h16M4 12h16M4 18h16" /></svg>
                    </button>
                  )}
                  <div className="flex-1 flex flex-col min-w-0">
                    {/* Chat Header */}
                    {messages.length > 0 && (
                      <div className="flex items-center justify-between px-3 sm:px-6 py-2 border-b border-white/10">
                        <span className="text-xs text-gray-500 truncate flex-1 mr-2">{currentTitle}</span>
                        <button
                          onClick={deleteCurrentConversation}
                          className="text-xs text-red-400 hover:text-red-300 flex items-center gap-1 px-2 py-1 rounded hover:bg-red-500/10 transition-all flex-shrink-0"
                          title="Delete this chat"
                        >
                          <svg className="w-3.5 h-3.5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 7l-.867 12.142A2 2 0 0116.138 21H7.862a2 2 0 01-1.995-1.858L5 7m5 4v6m4-6v6m1-10V4a1 1 0 00-1-1h-4a1 1 0 00-1 1v3M4 7h16" />
                          </svg>
                          Delete
                        </button>
                      </div>
                    )}
                <div className="flex-1 overflow-y-auto p-3 sm:p-6">
                  {messages.length === 0 ? (
                    <div className="h-full flex flex-col items-center justify-center text-center px-4">
                      <div className="w-16 h-16 sm:w-20 sm:h-20 rounded-2xl sm:rounded-3xl bg-gradient-to-br from-violet-500 via-purple-500 to-pink-500 flex items-center justify-center glow-purple mb-4 sm:mb-6">
                        <svg className="w-8 h-8 sm:w-10 sm:h-10 text-white" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M8 12h.01M12 12h.01M16 12h.01M21 12c0 4.418-4.03 8-9 8a9.863 9.863 0 01-4.255-.949L3 20l1.395-3.72C3.512 15.042 3 13.574 3 12c0-4.418 4.03-8 9-8s9 3.582 9 8z" />
                        </svg>
                      </div>
                      <h2 className="text-xl sm:text-3xl font-bold mb-2 sm:mb-3 bg-gradient-to-r from-white via-purple-200 to-pink-200 bg-clip-text text-transparent">
                        Hey {user.name}!
                      </h2>
                      <p className="text-gray-400 max-w-md text-sm sm:text-lg">
                        I'm AmitAI, ready to help you with anything!
                      </p>
                    </div>
                  ) : (
                    <div className="space-y-4 sm:space-y-6 pb-4">
                      {messages.map((message) => (
                        <div key={message.id} className={`flex gap-2 sm:gap-4 message-animate ${message.role === 'user' ? 'justify-end' : 'justify-start'}`}>
                          {message.role === 'assistant' && (
                            <div className="w-8 h-8 sm:w-10 sm:h-10 rounded-lg sm:rounded-xl bg-gradient-to-br from-violet-500 to-pink-500 flex items-center justify-center flex-shrink-0">
                              <svg className="w-4 h-4 sm:w-5 sm:h-5 text-white" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M13 10V3L4 14h7v7l9-11h-7z" />
                              </svg>
                            </div>
                          )}
                          <div className={`max-w-[85%] sm:max-w-[75%] rounded-xl sm:rounded-2xl px-3 sm:px-5 py-2 sm:py-4 ${message.role === 'user' ? 'bg-gradient-to-br from-violet-600 to-purple-700 text-white' : 'bg-white/5 text-gray-100'}`}>
                            {message.role === 'assistant' ? (
                              <div className="prose prose-invert prose-sm max-w-none text-sm sm:text-base">
                                <ReactMarkdown>{message.content}</ReactMarkdown>
                              </div>
                            ) : (
                              <p className="whitespace-pre-wrap text-sm sm:text-base">{message.content}</p>
                            )}
                          </div>
                          {message.role === 'user' && (
                            <div className="w-8 h-8 sm:w-10 sm:h-10 rounded-lg sm:rounded-xl bg-gradient-to-br from-violet-600 to-purple-700 flex items-center justify-center flex-shrink-0">
                              <span className="text-white font-semibold text-sm sm:text-base">{user.name[0]}</span>
                            </div>
                          )}
                        </div>
                      ))}
                      {isLoading && (
                        <div className="flex gap-2 sm:gap-4 justify-start message-animate">
                          <div className="w-8 h-8 sm:w-10 sm:h-10 rounded-lg sm:rounded-xl bg-gradient-to-br from-violet-500 to-pink-500 flex items-center justify-center flex-shrink-0">
                            <svg className="w-4 h-4 sm:w-5 sm:h-5 text-white" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M13 10V3L4 14h7v7l9-11h-7z" />
                            </svg>
                          </div>
                          <div className="bg-white/5 rounded-xl sm:rounded-2xl px-4 py-3">
                            <div className="flex items-center gap-1.5">
                              <div className="typing-dot w-2 h-2 bg-purple-400 rounded-full"></div>
                              <div className="typing-dot w-2 h-2 bg-purple-400 rounded-full"></div>
                              <div className="typing-dot w-2 h-2 bg-purple-400 rounded-full"></div>
                            </div>
                          </div>
                        </div>
                      )}
                      <div ref={messagesEndRef} />
                    </div>
                  )}
                </div>

                {/* Chat Input */}
                <div className="p-3 sm:p-4 border-t border-white/10">
                  {error && <div className="mb-3 px-3 py-2 bg-red-500/20 border border-red-500/30 rounded-lg text-red-300 text-xs sm:text-sm">{error}</div>}
                  <form onSubmit={handleSubmit} className="flex gap-2">
                    <textarea
                      ref={textareaRef}
                      value={input}
                      onChange={(e) => setInput(e.target.value)}
                      onKeyDown={handleKeyDown}
                      placeholder="Ask me anything..."
                      rows={1}
                      className="flex-1 px-3 sm:px-4 py-2.5 sm:py-3 bg-white/5 border border-white/10 text-white placeholder-gray-500 focus:outline-none focus:ring-2 focus:ring-purple-500 resize-none rounded-lg sm:rounded-xl text-sm sm:text-base"
                      disabled={isLoading}
                    />
                    <button
                      type="submit"
                      disabled={!input.trim() || isLoading}
                      className="px-4 sm:px-6 py-2.5 sm:py-3 bg-gradient-to-r from-violet-600 to-purple-600 text-white font-medium rounded-lg sm:rounded-xl hover:from-violet-500 hover:to-purple-500 disabled:opacity-50 disabled:cursor-not-allowed transition-all"
                    >
                      {isLoading ? (
                        <svg className="w-5 h-5 animate-spin" fill="none" viewBox="0 0 24 24">
                          <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4" />
                          <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z" />
                        </svg>
                      ) : (
                        <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M13 7l5 5m0 0l-5 5m5-5H6" />
                        </svg>
                      )}
                    </button>
                  </form>
                </div>
                  </div>
                </div>
              </>
            )}

            {/* Resume Tab */}
            {activeTab === 'resume' && (
              <div className="flex-1 overflow-y-auto p-3 sm:p-6">
                <div className="grid grid-cols-1 lg:grid-cols-2 gap-4 sm:gap-6">
                  {/* Upload Section */}
                  <div className="flex flex-col">
                    <h2 className="text-base sm:text-lg font-semibold text-white mb-3 sm:mb-4">Upload Resume</h2>
                    <div
                      onDragEnter={handleDrag}
                      onDragLeave={handleDrag}
                      onDragOver={handleDrag}
                      onDrop={handleDrop}
                      onClick={() => fileInputRef.current?.click()}
                      className={`min-h-[150px] sm:min-h-[200px] border-2 border-dashed rounded-xl sm:rounded-2xl p-4 sm:p-8 text-center cursor-pointer transition-all flex flex-col items-center justify-center ${dragActive ? 'border-purple-500 bg-purple-500/10' : file ? 'border-green-500/50 bg-green-500/10' : 'border-white/20 hover:border-purple-500/50 hover:bg-white/5'}`}
                    >
                      <input ref={fileInputRef} type="file" accept=".pdf,.txt,.doc,.docx" onChange={handleFileChange} className="hidden" />
                      {file ? (
                        <div className="text-green-400">
                          <svg className="w-10 h-10 sm:w-12 sm:h-12 mx-auto mb-2 sm:mb-3" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12l2 2 4-4m6 2a9 9 0 11-18 0 9 9 0 0118 0z" />
                          </svg>
                          <p className="font-medium text-sm sm:text-base truncate max-w-[200px]">{file.name}</p>
                          <p className="text-xs sm:text-sm text-gray-400 mt-1">Tap to change</p>
                        </div>
                      ) : (
                        <div className="text-gray-400">
                          <svg className="w-10 h-10 sm:w-12 sm:h-12 mx-auto mb-2 sm:mb-3" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M7 16a4 4 0 01-.88-7.903A5 5 0 1115.9 6L16 6a5 5 0 011 9.9M15 13l-3-3m0 0l-3 3m3-3v12" />
                          </svg>
                          <p className="font-medium text-sm sm:text-base">Tap to upload resume</p>
                          <p className="text-xs mt-2 text-gray-500">PDF, TXT, DOC (Max 5MB)</p>
                        </div>
                      )}
                    </div>

                    <div className="mt-3 sm:mt-4">
                      <label className="block text-xs sm:text-sm font-medium text-gray-300 mb-1.5 sm:mb-2">Target Job Role</label>
                      <input
                        type="text"
                        value={jobRole}
                        onChange={(e) => setJobRole(e.target.value)}
                        className="w-full px-3 sm:px-4 py-2.5 sm:py-3 bg-white/5 border border-white/10 rounded-lg sm:rounded-xl text-white placeholder-gray-500 focus:outline-none focus:ring-2 focus:ring-purple-500 text-sm sm:text-base"
                        placeholder="e.g., Software Developer"
                      />
                    </div>

                    {error && activeTab === 'resume' && (
                      <div className="mt-3 px-3 py-2 bg-red-500/20 border border-red-500/30 rounded-lg text-red-300 text-xs sm:text-sm">{error}</div>
                    )}

                    <button
                      onClick={handleAnalyze}
                      disabled={!file || isAnalyzing}
                      className="w-full mt-3 sm:mt-4 py-3 sm:py-4 bg-gradient-to-r from-violet-600 to-purple-600 text-white font-semibold rounded-lg sm:rounded-xl hover:from-violet-500 hover:to-purple-500 disabled:opacity-50 disabled:cursor-not-allowed transition-all flex items-center justify-center gap-2 text-sm sm:text-base"
                    >
                      {isAnalyzing ? (
                        <>
                          <svg className="w-5 h-5 animate-spin" fill="none" viewBox="0 0 24 24">
                            <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4" />
                            <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z" />
                          </svg>
                          Analyzing...
                        </>
                      ) : (
                        <>
                          <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9.663 17h4.673M12 3v1m6.364 1.636l-.707.707M21 12h-1M4 12H3m3.343-5.657l-.707-.707m2.828 9.9a5 5 0 117.072 0l-.548.547A3.374 3.374 0 0014 18.469V19a2 2 0 11-4 0v-.531c0-.895-.356-1.754-.988-2.386l-.548-.547z" />
                          </svg>
                          Analyze Resume
                        </>
                      )}
                    </button>
                  </div>

                  {/* Feedback Section */}
                  <div className="flex flex-col bg-white/5 rounded-xl sm:rounded-2xl p-4 sm:p-6 min-h-[300px]">
                    <h2 className="text-base sm:text-lg font-semibold text-white mb-3 sm:mb-4 flex items-center gap-2">
                      AI Feedback
                      {feedback && <span className="text-[10px] sm:text-xs px-2 py-0.5 bg-green-500/20 text-green-400 rounded-full">Ready</span>}
                    </h2>
                    <div className="flex-1 overflow-y-auto">
                      {feedback ? (
                        <div className="prose prose-invert prose-sm max-w-none text-sm sm:text-base">
                          <ReactMarkdown>{feedback}</ReactMarkdown>
                        </div>
                      ) : (
                        <div className="h-full flex items-center justify-center text-center">
                          <div className="text-gray-500">
                            <svg className="w-12 h-12 sm:w-16 sm:h-16 mx-auto mb-3 sm:mb-4 opacity-50" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M9 12h6m-6 4h6m2 5H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z" />
                            </svg>
                            <p className="text-xs sm:text-sm">Upload resume to get AI feedback</p>
                          </div>
                        </div>
                      )}
                    </div>
                  </div>
                </div>
              </div>
            )}
          </div>
        </div>
        </div>
      </div>
    </main>
  )
}
