const express = require('express');
const { Op } = require('sequelize');
const adminAuth = require('../middleware/adminAuth');
const User = require('../models/User');
const ResumeAnalysis = require('../models/ResumeAnalysis');

const router = express.Router();

// All routes require admin
router.use(adminAuth);

// GET /api/admin/users - list users with optional search
router.get('/users', async (req, res) => {
  try {
    const { search = '', limit = 50, offset = 0 } = req.query;
    const where = {};
    if (search.trim()) {
      where[Op.or] = [
        { name: { [Op.like]: `%${search.trim()}%` } },
        { email: { [Op.like]: `%${search.trim()}%` } }
      ];
    }
    const { count, rows: users } = await User.findAndCountAll({
      where,
      attributes: ['id', 'name', 'email', 'isVerified', 'createdAt'],
      order: [['createdAt', 'DESC']],
      limit: Math.min(parseInt(limit, 10) || 50, 100),
      offset: Math.max(0, parseInt(offset, 10))
    });
    res.json({ total: count, users });
  } catch (error) {
    console.error('Admin users error:', error);
    res.status(500).json({ error: 'Failed to fetch users' });
  }
});

// GET /api/admin/feedback - list all resume AI feedback with user info
router.get('/feedback', async (req, res) => {
  try {
    const { limit = 50, offset = 0, userId } = req.query;
    const where = userId ? { userId } : {};
    const { count, rows: analyses } = await ResumeAnalysis.findAndCountAll({
      where,
      include: [{
        model: User,
        as: 'User',
        attributes: ['id', 'name', 'email']
      }],
      order: [['createdAt', 'DESC']],
      limit: Math.min(parseInt(limit, 10) || 50, 100),
      offset: Math.max(0, parseInt(offset, 10))
    });
    const list = analyses.map(a => ({
      id: a.id,
      userId: a.userId,
      userName: a.User?.name,
      userEmail: a.User?.email,
      filename: a.filename,
      jobRole: a.jobRole,
      feedback: a.feedback,
      createdAt: a.createdAt
    }));
    res.json({ total: count, feedback: list });
  } catch (error) {
    console.error('Admin feedback error:', error);
    res.status(500).json({ error: 'Failed to fetch feedback' });
  }
});

// GET /api/admin/stats - quick stats for dashboard
router.get('/stats', async (req, res) => {
  try {
    const [userCount, feedbackCount] = await Promise.all([
      User.count(),
      ResumeAnalysis.count()
    ]);
    res.json({
      totalUsers: userCount,
      totalResumeFeedbacks: feedbackCount
    });
  } catch (error) {
    console.error('Admin stats error:', error);
    res.status(500).json({ error: 'Failed to fetch stats' });
  }
});

module.exports = router;
