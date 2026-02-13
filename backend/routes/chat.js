const express = require('express');
const { Op } = require('sequelize');
const Groq = require('groq-sdk');
const OpenAI = require('openai');
const authMiddleware = require('../middleware/auth');
const Conversation = require('../models/Conversation');
const ChatHistory = require('../models/ChatHistory');

const router = express.Router();

// Initialize AI clients
const groq = new Groq({ apiKey: process.env.GROQ_API_KEY });
const openai = new OpenAI({ apiKey: process.env.OPENAI_API_KEY });

// Available models
const MODELS = {
  groq: {
    'llama-3.3-70b': { id: 'llama-3.3-70b-versatile', name: 'Llama 3.3 70B', provider: 'groq' },
    'llama-3.1-8b': { id: 'llama-3.1-8b-instant', name: 'Llama 3.1 8B (Fast)', provider: 'groq' },
    'mixtral-8x7b': { id: 'mixtral-8x7b-32768', name: 'Mixtral 8x7B', provider: 'groq' },
    'gemma2-9b': { id: 'gemma2-9b-it', name: 'Gemma 2 9B', provider: 'groq' },
  },
  openai: {
    'gpt-4': { id: 'gpt-4', name: 'GPT-4', provider: 'openai' },
    'gpt-4-turbo': { id: 'gpt-4-turbo-preview', name: 'GPT-4 Turbo', provider: 'openai' },
    'gpt-3.5-turbo': { id: 'gpt-3.5-turbo', name: 'GPT-3.5 Turbo', provider: 'openai' },
  }
};

// Get available models
router.get('/models', authMiddleware, (req, res) => {
  const allModels = [];
  if (process.env.GROQ_API_KEY) {
    Object.entries(MODELS.groq).forEach(([key, model]) => allModels.push({ key, ...model }));
  }
  if (process.env.OPENAI_API_KEY) {
    Object.entries(MODELS.openai).forEach(([key, model]) => allModels.push({ key, ...model }));
  }
  res.json({ models: allModels });
});

// ==================== Token-based conversation CRUD ====================

// List conversations (token-based pagination: limit, cursor = conversation id)
router.get('/conversations', authMiddleware, async (req, res) => {
  try {
    const limit = Math.min(parseInt(req.query.limit, 10) || 20, 50);
    const cursor = req.query.cursor; // conversation id (UUID)

    const where = { userId: req.user.id };
    if (cursor) {
      const conv = await Conversation.findOne({ where: { id: cursor, userId: req.user.id } });
      if (conv) where.createdAt = { [Op.lt]: conv.createdAt };
    }

    const conversations = await Conversation.findAll({
      where,
      order: [['updatedAt', 'DESC']],
      limit: limit + 1,
      attributes: ['id', 'title', 'createdAt', 'updatedAt']
    });

    const hasMore = conversations.length > limit;
    const list = hasMore ? conversations.slice(0, limit) : conversations;
    const nextCursor = hasMore ? list[list.length - 1].id : null;

    res.json({
      conversations: list.map(c => ({
        token: c.id,
        title: c.title,
        createdAt: c.createdAt,
        updatedAt: c.updatedAt
      })),
      nextCursor,
      hasMore
    });
  } catch (error) {
    console.error('List conversations error:', error);
    res.status(500).json({ error: 'Failed to list conversations' });
  }
});

// Create conversation (returns token)
router.post('/conversations', authMiddleware, async (req, res) => {
  try {
    const { title = 'New Chat' } = req.body;
    const conv = await Conversation.create({
      userId: req.user.id,
      title: title.substring(0, 255)
    });
    res.status(201).json({
      token: conv.id,
      title: conv.title,
      createdAt: conv.createdAt
    });
  } catch (error) {
    console.error('Create conversation error:', error);
    res.status(500).json({ error: 'Failed to create conversation' });
  }
});

// Get one conversation and its messages by token
router.get('/conversations/:token', authMiddleware, async (req, res) => {
  try {
    const { token } = req.params;
    const conv = await Conversation.findOne({
      where: { id: token, userId: req.user.id }
    });

    if (!conv) {
      return res.status(404).json({ error: 'Conversation not found' });
    }

    const messages = await ChatHistory.findAll({
      where: { conversationId: conv.id },
      order: [['createdAt', 'ASC']],
      attributes: ['id', 'role', 'content', 'model', 'createdAt']
    });

    const messageList = (messages || []).map(m => ({
      id: m.id,
      role: m.role,
      content: m.content,
      model: m.model,
      createdAt: m.createdAt
    }));

    res.json({
      token: conv.id,
      title: conv.title,
      createdAt: conv.createdAt,
      updatedAt: conv.updatedAt,
      messages: messageList
    });
  } catch (error) {
    console.error('Get conversation error:', error);
    res.status(500).json({ error: 'Failed to get conversation' });
  }
});

// Update conversation (e.g. title)
router.patch('/conversations/:token', authMiddleware, async (req, res) => {
  try {
    const { token } = req.params;
    const { title } = req.body;
    const conv = await Conversation.findOne({ where: { id: token, userId: req.user.id } });
    if (!conv) return res.status(404).json({ error: 'Conversation not found' });
    if (title != null) conv.title = title.substring(0, 255);
    await conv.save();
    res.json({ token: conv.id, title: conv.title, updatedAt: conv.updatedAt });
  } catch (error) {
    console.error('Update conversation error:', error);
    res.status(500).json({ error: 'Failed to update conversation' });
  }
});

// Delete conversation
router.delete('/conversations/:token', authMiddleware, async (req, res) => {
  try {
    const { token } = req.params;
    const conv = await Conversation.findOne({ where: { id: token, userId: req.user.id } });
    if (!conv) return res.status(404).json({ error: 'Conversation not found' });
    await conv.destroy();
    res.json({ message: 'Conversation deleted' });
  } catch (error) {
    console.error('Delete conversation error:', error);
    res.status(500).json({ error: 'Failed to delete conversation' });
  }
});

// ==================== Chat (token-based: conversationToken required for persistence) ====================

// Send message: body.conversationToken optional; if missing, a new conversation is created
router.post('/', authMiddleware, async (req, res) => {
  try {
    const { message, conversationToken, conversationHistory = [], modelKey = 'llama-3.3-70b' } = req.body;

    if (!message) {
      return res.status(400).json({ error: 'Message is required' });
    }

    let conversation = null;
    if (conversationToken) {
      conversation = await Conversation.findOne({
        where: { id: conversationToken, userId: req.user.id }
      });
      if (!conversation) {
        return res.status(404).json({ error: 'Conversation not found' });
      }
    } else {
      conversation = await Conversation.create({
        userId: req.user.id,
        title: message.substring(0, 80) || 'New Chat'
      });
    }

    const model = MODELS.groq[modelKey] || MODELS.openai[modelKey] || MODELS.groq['llama-3.3-70b'];
    const systemPrompt = `You are AmitAI, a helpful and intelligent AI assistant created by Amit. 
You provide accurate, well-structured, and helpful responses. Be concise but thorough.`;

    const cleanHistory = (conversationHistory || []).map(msg => ({
      role: msg.role,
      content: msg.content
    }));

    const messages = [
      { role: 'system', content: systemPrompt },
      ...cleanHistory,
      { role: 'user', content: message }
    ];

    let response;
    if (model.provider === 'groq') {
      if (!process.env.GROQ_API_KEY) return res.status(500).json({ error: 'Groq API key not configured' });
      const completion = await groq.chat.completions.create({
        model: model.id,
        messages,
        temperature: 0.7,
        max_tokens: 2000,
      });
      response = completion.choices[0]?.message?.content;
    } else if (model.provider === 'openai') {
      if (!process.env.OPENAI_API_KEY) return res.status(500).json({ error: 'OpenAI API key not configured' });
      const completion = await openai.chat.completions.create({
        model: model.id,
        messages,
        temperature: 0.7,
        max_tokens: 2000,
      });
      response = completion.choices[0]?.message?.content;
    }

    const aiResponse = response || 'Sorry, I could not generate a response.';

    await ChatHistory.create({
      conversationId: conversation.id,
      userId: req.user.id,
      role: 'user',
      content: message,
      model: model.name
    });
    await ChatHistory.create({
      conversationId: conversation.id,
      userId: req.user.id,
      role: 'assistant',
      content: aiResponse,
      model: model.name
    });

    // Update conversation title from first user message if still default
    if (conversation.title === 'New Chat' || !conversation.title) {
      conversation.title = message.substring(0, 80) || 'New Chat';
      await conversation.save();
    }

    res.json({
      response: aiResponse,
      model: model.name,
      conversationToken: conversation.id,
      title: conversation.title
    });
  } catch (error) {
    console.error('Chat error:', error);
    if (error?.status === 429) return res.status(429).json({ error: 'Rate limit exceeded. Please try again later.' });
    res.status(500).json({ error: 'Failed to generate response' });
  }
});

// Backward compatibility: flat history (last N messages across all conversations)
router.get('/history', authMiddleware, async (req, res) => {
  try {
    const limit = Math.min(parseInt(req.query.limit, 10) || 100, 200);
    const history = await ChatHistory.findAll({
      where: { userId: req.user.id },
      order: [['createdAt', 'ASC']],
      limit,
      attributes: ['id', 'role', 'content', 'model', 'createdAt', 'conversationId']
    });
    res.json({ history: history.map(h => h.toJSON()) });
  } catch (error) {
    console.error('Get history error:', error);
    res.json({ history: [] });
  }
});

// Clear all history for user (keeps conversations, clears messages in each - or we can delete all conversations)
router.delete('/history', authMiddleware, async (req, res) => {
  try {
    await ChatHistory.destroy({ where: { userId: req.user.id } });
    res.json({ message: 'Chat history cleared' });
  } catch (error) {
    console.error('Clear history error:', error);
    res.status(500).json({ error: 'Failed to clear history' });
  }
});

module.exports = router;
