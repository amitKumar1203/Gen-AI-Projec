import { NextRequest, NextResponse } from 'next/server'
import Groq from 'groq-sdk'

// Initialize Groq client
const groq = new Groq({
  apiKey: process.env.GROQ_API_KEY,
})

export async function POST(request: NextRequest) {
  try {
    const { message, conversationHistory } = await request.json()

    if (!message) {
      return NextResponse.json(
        { error: 'Message is required' },
        { status: 400 }
      )
    }

    if (!process.env.GROQ_API_KEY) {
      return NextResponse.json(
        { error: 'Groq API key not configured. Please add GROQ_API_KEY to your .env.local file.' },
        { status: 500 }
      )
    }

    // Build messages array with conversation history
    const messages = [
      {
        role: 'system' as const,
        content: `You are AmitAI, a helpful and intelligent AI assistant created by Amit. 
You provide accurate, well-structured, and helpful responses to user questions.
You can help with a wide range of topics including programming, science, history, mathematics, and general knowledge.
When providing code examples, always use proper formatting and explain the code.
Be concise but thorough in your explanations. You are professional, friendly, and knowledgeable.`
      },
      ...(conversationHistory || []).map((msg: { role: string; content: string }) => ({
        role: msg.role as 'user' | 'assistant',
        content: msg.content
      })),
      {
        role: 'user' as const,
        content: message
      }
    ]

    const completion = await groq.chat.completions.create({
      model: 'llama-3.3-70b-versatile',
      messages,
      temperature: 0.7,
      max_tokens: 2000,
    })

    const assistantMessage = completion.choices[0]?.message?.content || 'Sorry, I could not generate a response.'

    return NextResponse.json({
      response: assistantMessage,
      usage: completion.usage
    })

  } catch (error: any) {
    console.error('Groq API Error:', error)
    
    if (error?.status === 401) {
      return NextResponse.json(
        { error: 'Invalid Groq API key. Please check your GROQ_API_KEY in .env.local' },
        { status: 401 }
      )
    }

    if (error?.status === 429) {
      return NextResponse.json(
        { error: 'Rate limit exceeded. Please wait a moment and try again.' },
        { status: 429 }
      )
    }

    return NextResponse.json(
      { error: 'An error occurred while processing your request.' },
      { status: 500 }
    )
  }
}
