const express = require('express');
const multer = require('multer');
const path = require('path');
const fs = require('fs');
const Groq = require('groq-sdk');
const authMiddleware = require('../middleware/auth');
const ResumeAnalysis = require('../models/ResumeAnalysis');

const router = express.Router();
const groq = new Groq({ apiKey: process.env.GROQ_API_KEY });

// Configure multer for file uploads
const storage = multer.diskStorage({
  destination: (req, file, cb) => {
    const uploadDir = path.join(__dirname, '../uploads');
    if (!fs.existsSync(uploadDir)) {
      fs.mkdirSync(uploadDir, { recursive: true });
    }
    cb(null, uploadDir);
  },
  filename: (req, file, cb) => {
    const uniqueName = `${Date.now()}-${file.originalname}`;
    cb(null, uniqueName);
  }
});

const upload = multer({
  storage,
  limits: { fileSize: 5 * 1024 * 1024 }, // 5MB limit
  fileFilter: (req, file, cb) => {
    const allowedTypes = ['.pdf', '.txt', '.doc', '.docx'];
    const ext = path.extname(file.originalname).toLowerCase();
    if (allowedTypes.includes(ext)) {
      cb(null, true);
    } else {
      cb(new Error('Only PDF, TXT, DOC, and DOCX files are allowed'));
    }
  }
});

// Analyze resume
router.post('/analyze', authMiddleware, upload.single('resume'), async (req, res) => {
  try {
    if (!req.file) {
      return res.status(400).json({ error: 'Please upload a resume file' });
    }

    const { jobRole = 'Software Developer' } = req.body;
    
    // Read file content (for txt files, for PDF you'd need pdf-parse)
    let resumeContent = '';
    const ext = path.extname(req.file.originalname).toLowerCase();
    
    if (ext === '.txt') {
      resumeContent = fs.readFileSync(req.file.path, 'utf-8');
    } else if (ext === '.pdf') {
      // For PDF files, use pdf-parse
      try {
        const pdfParse = require('pdf-parse');
        const dataBuffer = fs.readFileSync(req.file.path);
        const pdfData = await pdfParse(dataBuffer);
        resumeContent = pdfData.text;
      } catch (pdfError) {
        console.error('PDF parsing error:', pdfError);
        resumeContent = 'Unable to parse PDF content. Please try uploading a TXT file.';
      }
    } else {
      resumeContent = 'File type not fully supported. Please upload a PDF or TXT file for best results.';
    }

    // Analyze with AI
    const prompt = `You are an expert HR consultant and career advisor. Analyze the following resume for a ${jobRole} position.

Resume Content:
${resumeContent}

Please provide a comprehensive review including:

1. **Overall Score**: Rate the resume out of 10

2. **Strengths**: List 3-5 strong points of this resume

3. **Areas for Improvement**: List 3-5 things that could be better

4. **Missing Elements**: What's missing that should be added?

5. **ATS Compatibility**: How well would this resume pass Applicant Tracking Systems?

6. **Specific Suggestions**: Provide actionable tips to improve this resume for a ${jobRole} role

7. **Keywords to Add**: Suggest relevant keywords for this role

Be specific, constructive, and helpful in your feedback.`;

    const completion = await groq.chat.completions.create({
      model: 'llama-3.3-70b-versatile',
      messages: [
        { role: 'system', content: 'You are an expert HR consultant providing detailed resume feedback.' },
        { role: 'user', content: prompt }
      ],
      temperature: 0.7,
      max_tokens: 2000,
    });

    const feedback = completion.choices[0]?.message?.content;

    // Save to database for admin panel
    await ResumeAnalysis.create({
      userId: req.user.id,
      filename: req.file.originalname,
      jobRole: jobRole || 'Software Developer',
      feedback
    });

    // Clean up uploaded file
    fs.unlinkSync(req.file.path);

    res.json({
      success: true,
      feedback,
      fileName: req.file.originalname,
      analyzedFor: jobRole
    });

  } catch (error) {
    console.error('Resume analysis error:', error);
    
    // Clean up file if it exists
    if (req.file && fs.existsSync(req.file.path)) {
      fs.unlinkSync(req.file.path);
    }
    
    res.status(500).json({ error: 'Failed to analyze resume' });
  }
});

module.exports = router;
