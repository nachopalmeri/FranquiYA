'use client'

import { useState, useRef, useEffect } from 'react'
import { MessageCircle, X, Send, Loader2, Sparkles } from 'lucide-react'
import { Button } from '@/components/ui/button'
import { cn } from '@/lib/utils'
import { useAuth } from '@/components/layout/auth-provider'

interface Message {
  role: 'user' | 'assistant'
  content: string
}

interface QuickAction {
  label: string
  query: string
}

const API_URL = process.env.NEXT_PUBLIC_API_URL || 'http://localhost:8000/api'

export function ChatWidget() {
  const { user } = useAuth()
  const [isOpen, setIsOpen] = useState(false)
  const [messages, setMessages] = useState<Message[]>([])
  const [input, setInput] = useState('')
  const [loading, setLoading] = useState(false)
  const [quickActions, setQuickActions] = useState<QuickAction[]>([])
  const messagesEndRef = useRef<HTMLDivElement>(null)

  useEffect(() => {
    fetchQuickActions()
  }, [])

  useEffect(() => {
    if (isOpen && messages.length === 0 && user?.franchise_name) {
      setMessages([
        { role: 'assistant', content: `¡Hola! Soy el asistente de ${user.franchise_name}. ¿En qué puedo ayudarte?` }
      ])
    }
  }, [isOpen, user?.franchise_name, messages.length])

  useEffect(() => {
    scrollToBottom()
  }, [messages])

  const scrollToBottom = () => {
    messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' })
  }

  const fetchQuickActions = async () => {
    try {
      const token = localStorage.getItem('token')
      const res = await fetch(`${API_URL}/chat/quick-actions`, {
        headers: { Authorization: `Bearer ${token}` }
      })
      if (res.ok) {
        const data = await res.json()
        setQuickActions(data.actions || [])
      }
    } catch {
      console.error('Failed to fetch quick actions')
    }
  }

  const sendMessage = async (messageText: string = input) => {
    if (!messageText.trim() || loading) return

    const userMessage = messageText.trim()
    setInput('')
    setMessages(prev => [...prev, { role: 'user', content: userMessage }])
    setLoading(true)

    try {
      const token = localStorage.getItem('token')
      const res = await fetch(`${API_URL}/chat`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          Authorization: `Bearer ${token}`
        },
        body: JSON.stringify({ message: userMessage })
      })

      if (res.ok) {
        const data = await res.json()
        setMessages(prev => [...prev, { role: 'assistant', content: data.response }])
      } else {
        setMessages(prev => [...prev, { 
          role: 'assistant', 
          content: 'Error al procesar tu mensaje. Intentá de nuevo.' 
        }])
      }
    } catch {
      setMessages(prev => [...prev, { 
        role: 'assistant', 
        content: 'Error de conexión. Verificá tu conexión a internet.' 
      }])
    } finally {
      setLoading(false)
    }
  }

  const handleKeyPress = (e: React.KeyboardEvent) => {
    if (e.key === 'Enter' && !e.shiftKey) {
      e.preventDefault()
      sendMessage()
    }
  }

  return (
    <>
      {/* Floating Button */}
      <button
        onClick={() => setIsOpen(true)}
        className={cn(
          "fixed bottom-6 right-6 z-50 flex h-14 w-14 items-center justify-center rounded-full",
          "bg-gradient-to-r from-[#E31D2B] to-[#ff4757] text-white shadow-lg shadow-[#E31D2B]/30",
          "hover:scale-110 transition-all duration-200",
          isOpen && "hidden"
        )}
      >
        <MessageCircle className="h-6 w-6" />
      </button>

      {/* Chat Window */}
      {isOpen && (
        <div className={cn(
          "fixed bottom-6 right-6 z-50 flex flex-col",
          "w-[380px] h-[550px] max-h-[80vh]",
          "bg-[#1a1a1a] border border-white/10 rounded-2xl shadow-2xl",
          "overflow-hidden"
        )}>
          {/* Header */}
          <div className="flex items-center justify-between p-4 border-b border-white/10 bg-[#0a0a0a]">
            <div className="flex items-center gap-3">
              <div className="flex h-10 w-10 items-center justify-center rounded-full bg-gradient-to-r from-[#E31D2B] to-[#ff4757]">
                <Sparkles className="h-5 w-5 text-white" />
              </div>
              <div>
                <h3 className="font-semibold text-white">Asistente Grido</h3>
                <p className="text-xs text-gray-400">Powered by Gemini AI</p>
              </div>
            </div>
            <Button
              variant="ghost"
              size="icon"
              onClick={() => setIsOpen(false)}
              className="text-gray-400 hover:text-white"
            >
              <X className="h-5 w-5" />
            </Button>
          </div>

          {/* Messages */}
          <div className="flex-1 overflow-y-auto p-4 space-y-4">
            {messages.map((msg, idx) => (
              <div
                key={idx}
                className={cn(
                  "flex",
                  msg.role === 'user' ? 'justify-end' : 'justify-start'
                )}
              >
                <div className={cn(
                  "max-w-[85%] rounded-2xl px-4 py-3",
                  msg.role === 'user' 
                    ? "bg-[#E31D2B] text-white rounded-br-md" 
                    : "bg-white/5 text-gray-200 rounded-bl-md border border-white/5"
                )}>
                  <p className="text-sm whitespace-pre-wrap">{msg.content}</p>
                </div>
              </div>
            ))}
            
            {loading && (
              <div className="flex justify-start">
                <div className="bg-white/5 border border-white/5 rounded-2xl rounded-bl-md px-4 py-3">
                  <Loader2 className="h-4 w-4 animate-spin text-[#E31D2B]" />
                </div>
              </div>
            )}
            
            <div ref={messagesEndRef} />
          </div>

          {/* Quick Actions */}
          {messages.length <= 2 && quickActions.length > 0 && (
            <div className="px-4 pb-2">
              <div className="flex flex-wrap gap-2">
                {quickActions.slice(0, 3).map((action, idx) => (
                  <button
                    key={idx}
                    onClick={() => sendMessage(action.query)}
                    className="text-xs px-3 py-1.5 rounded-full bg-white/5 border border-white/10 text-gray-300 hover:bg-white/10 hover:text-white transition-colors"
                  >
                    {action.label}
                  </button>
                ))}
              </div>
            </div>
          )}

          {/* Input */}
          <div className="p-4 border-t border-white/10">
            <div className="flex gap-2">
              <input
                type="text"
                value={input}
                onChange={(e) => setInput(e.target.value)}
                onKeyPress={handleKeyPress}
                placeholder="Escribí tu consulta..."
                className="flex-1 bg-white/5 border border-white/10 rounded-xl px-4 py-2.5 text-sm text-white placeholder:text-gray-500 focus:outline-none focus:border-[#E31D2B]/50"
                disabled={loading}
              />
              <Button
                onClick={() => sendMessage()}
                disabled={loading || !input.trim()}
                className="bg-[#E31D2B] hover:bg-[#C41925] px-4"
              >
                <Send className="h-4 w-4" />
              </Button>
            </div>
          </div>
        </div>
      )}
    </>
  )
}
