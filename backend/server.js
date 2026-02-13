require('dotenv').config();
const express = require('express');
const cors = require('cors');
const { initDatabase } = require('./config/database');
const { setMemoryMode } = require('./utils/users');
const authRoutes = require('./routes/auth');
const chatRoutes = require('./routes/chat');
const resumeRoutes = require('./routes/resume');
const adminRoutes = require('./routes/admin');

const app = express();
const PORT = process.env.PORT || 5000;

// Middleware
app.use(cors({
  origin: [
    'http://localhost:3000',
    'http://localhost:3001',
    'http://localhost:3002',
    'http://localhost:3003',
    'https://rhode-lime-holes-riverside.trycloudflare.com'
  ],
  credentials: true
}));
app.use(express.json());
app.use(express.urlencoded({ extended: true }));

// Routes
app.use('/api/auth', authRoutes);
app.use('/api/chat', chatRoutes);
app.use('/api/resume', resumeRoutes);
app.use('/api/admin', adminRoutes);

// Health check
app.get('/api/health', (req, res) => {
  res.json({ status: 'ok', message: 'AmitAI Backend is running!' });
});

// Error handling middleware
app.use((err, req, res, next) => {
  console.error(err.stack);
  res.status(500).json({ error: 'Something went wrong!' });
});

// Start server with database initialization
const startServer = async () => {
  // Initialize database
  const dbConnected = await initDatabase();
  
  // If DB fails, use in-memory storage
  if (!dbConnected) {
    setMemoryMode(true);
  }
  
  app.listen(PORT, () => {
    console.log(`🚀 AmitAI Backend running on http://localhost:${PORT}`);
    if (!dbConnected) {
      console.log('📝 Note: Using in-memory storage. Data will be lost on restart.');
    }
  });
};

startServer();
