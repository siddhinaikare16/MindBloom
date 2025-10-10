// server.js

require('dotenv').config();
const express = require('express');
const mongoose = require('mongoose');
const axios = require('axios');
const cors = require('cors');
const path = require('path');
const bcrypt = require('bcryptjs'); // pure JS bcrypt (easier to install)
const jwt = require('jsonwebtoken');

const app = express();
const PORT = process.env.PORT || 4000;

app.use(cors()); // allow all origins for dev
app.use(express.json());
app.use(express.static(path.join(__dirname))); // serve your static files

// --- env ---
const MONGODB_URI = process.env.MONGODB_URI || '';
const GEMINI_API_KEY = process.env.GEMINI_API_KEY || '';
const ADMIN_PASSWORD = process.env.ADMIN_PASSWORD || 'admin_password_here';
const JWT_SECRET = process.env.JWT_SECRET || 'supersecretjwtkey';

// --- DB connect ---
mongoose.connect(MONGODB_URI, {
  useNewUrlParser: true,
  useUnifiedTopology: true
})
  .then(() => console.log('✅ Connected to MongoDB Atlas'))
  .catch(err => console.warn('⚠️ MongoDB connection warning:', err.message));

// --- Schemas ---
const surveyResponseSchema = new mongoose.Schema({
  age: String, gender: String, income: String,
  q1:String,q2:String,q3:String,q4:String,q5:String,q6:String,q7:String,q8:String,q9:String,q10:String,q11:String,q12:String,q13:String,
  createdAt:{ type: Date, default: Date.now }
});
const SurveyResponse = mongoose.model('SurveyResponse', surveyResponseSchema);

const userSchema = new mongoose.Schema({
  fullName: { type: String, required: true },
  email:    { type: String, required: true, unique: true },
  password: { type: String, required: true }
});
const User = mongoose.model('User', userSchema);

const forumPostSchema = new mongoose.Schema({
  title: String,
  name: String,
  content: String,
  category: String,
  likes: { type: Number, default: 0 },
  createdAt: { type: Date, default: Date.now }
});
const ForumPost = mongoose.model('ForumPost', forumPostSchema);

// --- Helper: Google API (graceful) ---
async function callGoogleApi(payload) {
  if (!GEMINI_API_KEY) {
    console.warn('GEMINI_API_KEY not set — AI endpoints will return fallback responses.');
    return null;
  }
  const API_URL = `https://generativelanguage.googleapis.com/v1beta/models/gemini-2.0-flash:generateContent?key=${GEMINI_API_KEY}`;


  try {
    const response = await axios.post(API_URL, payload, { headers: { 'Content-Type': 'application/json' }});
    return response.data;
  } catch (err) {
    console.error('Error calling Google API:', err.response?.data || err.message);
    return null;
  }
}

// --- JWT middleware ---
function authMiddleware(req, res, next) {
  const authHeader = req.headers['authorization'];
  if (!authHeader) return res.status(401).json({ message: 'No token provided' });
  const token = authHeader.split(' ')[1];
  if (!token) return res.status(401).json({ message: 'Invalid token format' });

  jwt.verify(token, JWT_SECRET, (err, decoded) => {
    if (err) return res.status(403).json({ message: 'Invalid or expired token' });
    req.user = decoded;
    next();
  });
}

// ----------------- AUTH -----------------

// Signup
app.post('/api/signup', async (req, res) => {
  try {
    const { fullName, email, password } = req.body;
    if (!fullName || !email || !password) return res.status(400).json({ message: 'Missing fields' });

    const existing = await User.findOne({ email });
    if (existing) return res.status(400).json({ message: 'Email already registered' });

    const hashed = await bcrypt.hash(password, 10);
    const u = new User({ fullName, email, password: hashed });
    await u.save();
    return res.status(201).json({ message: 'User registered successfully' });
  } catch (err) {
    console.error('Signup error:', err.message);
    return res.status(500).json({ message: 'Server error during signup' });
  }
});

// Login
app.post('/api/login', async (req, res) => {
  try {
    const { email, password } = req.body;
    if (!email || !password) return res.status(400).json({ message: 'Missing fields' });

    const user = await User.findOne({ email });
    if (!user) return res.status(400).json({ message: 'Invalid email or password' });
    const ok = await bcrypt.compare(password, user.password);
    if (!ok) return res.status(400).json({ message: 'Invalid email or password' });

    const token = jwt.sign({ userId: user._id, email: user.email }, JWT_SECRET, { expiresIn: '2h' });
    return res.json({ message: 'Login successful', token, user: { fullName: user.fullName, email: user.email } });
  } catch (err) {
    console.error('Login error:', err.message);
    return res.status(500).json({ message: 'Server error during login' });
  }
});

// ----------------- PROTECTED ROUTES -----------------

// Dashboard data
app.get('/api/dashboard-data', authMiddleware, async (req, res) => {
  try {
    const user = await User.findById(req.user.userId).select('-password');
    const surveyCount = await SurveyResponse.countDocuments();
    return res.json({ message: `Welcome ${user?.fullName || req.user.email}`, surveyCount, user });
  } catch (err) {
    console.error('Dashboard error:', err.message);
    return res.status(500).json({ error: 'Failed to load dashboard data' });
  }
});

// Forum API Routes
// FIXED: Changed routes from /api/forum-posts to /api/forum to match the frontend
app.get('/api/forum', authMiddleware, async (req, res) => {
  try {
    const posts = await ForumPost.find().sort({ createdAt: -1 }).limit(200);
    res.json({ success: true, posts });
  } catch (err) {
    console.error('Fetch forum posts error:', err.message);
    res.status(500).json({ success: false, error: 'Failed to fetch posts' });
  }
});

app.post('/api/forum', authMiddleware, async (req, res) => {
  try {
    const { title, name, content, category } = req.body;
    if (!title || !content) return res.status(400).json({ success: false, message: 'Title and content required' });
    const post = new ForumPost({ title, name: name || 'Anonymous', content, category });
    await post.save();
    res.status(201).json({ success: true, post });
  } catch (err) {
    console.error('Create forum post error:', err.message);
    res.status(500).json({ success: false, message: 'Failed to create post' });
  }
});

app.post('/api/forum/:id/like', authMiddleware, async (req, res) => {
  try {
    const post = await ForumPost.findById(req.params.id);
    if (!post) return res.status(404).json({ success: false, message: 'Post not found' });
    post.likes = (post.likes || 0) + 1;
    await post.save();
    res.json({ success: true, likes: post.likes });
  } catch (err) {
    console.error('Like post error:', err.message);
    res.status(500).json({ success: false, message: 'Failed to like post' });
  }
});


// ----------------- SURVEY / AI / AFFIRMATION -----------------
// ... (rest of your routes are unchanged)
app.post('/api/survey', async (req, res) => {
  try {
    const newResponse = new SurveyResponse(req.body);
    await newResponse.save();
    res.status(201).json({ message: 'Survey data saved successfully!' });
  } catch (err) {
    console.error('Survey save error:', err.message);
    res.status(500).json({ error: 'Failed to save survey data.' });
  }
});

app.post('/api/chat', async (req, res) => {
  try {
    const { message } = req.body;
    if (!message) return res.status(400).json({ error: 'No message provided' });

    const systemPrompt = "You are a supportive, empathetic AI therapist. Listen without judgment... (shortened)";

    const payload = { contents: [{ parts: [{ text: message }] }], systemInstruction: { parts: [{ text: systemPrompt }] } };
    const result = await callGoogleApi(payload);

    if (result) {
      const botResponse = result.candidates?.[0]?.content?.parts?.[0]?.text || "Sorry, couldn't process that.";
      return res.json({ response: botResponse });
    } else {
      return res.json({ response: "I'm here to listen — AI service temporarily unavailable. Try again later." });
    }
  } catch (err) {
    console.error('Chat error:', err.message);
    res.status(500).json({ error: 'Chatbot failed' });
  }
});

// Daily Affirmations
app.post("/api/affirmation", async (req, res) => {
  try {
    const systemPrompt =
      "You are a motivational coach. Provide a concise, single-sentence positive affirmation. Do not include any introduction or extra text.";
    const userPrompt =
      "Generate a daily positive affirmation. Add a small variation each time.";

    const payload = {
      contents: [{ parts: [{ text: userPrompt }] }],
      systemInstruction: { parts: [{ text: systemPrompt }] },
    };

    const result = await callGoogleApi(payload);
    const affirmation =
      result.candidates?.[0]?.content?.parts?.[0]?.text ||
      "You are capable of amazing things.";
    res.json({ response: affirmation.trim().replace(/^"|"$/g, "") });
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
});

// ===========================
// --- MOOD TRACKING API ---
// ===========================

const moodSchema = new mongoose.Schema({
  userId: String,
  mood: String,
  note: String,
  createdAt: { type: Date, default: Date.now }
});
const Mood = mongoose.model("Mood", moodSchema);

// Save a mood entry
app.post("/api/mood", authMiddleware, async (req, res) => {
  try {
    const { mood, note } = req.body;
    const entry = new Mood({ userId: req.user.userId, mood, note });
    await entry.save();
    res.status(201).json({ message: "Mood saved successfully!" });
  } catch (err) {
    console.error("Save mood error:", err.message);
    res.status(500).json({ error: "Failed to save mood." });
  }
});

// Get last 7 days of moods (for graph)
app.get("/api/mood", authMiddleware, async (req, res) => {
  try {
    const entries = await Mood.find({ userId: req.user.userId })
      .sort({ createdAt: -1 })
      .limit(7);
    res.json(entries.reverse()); // return oldest→latest for graph
  } catch (err) {
    console.error("Fetch mood error:", err.message);
    res.status(500).json({ error: "Failed to fetch mood data." });
  }
});


// --- start server ---
app.listen(PORT, () => {
  console.log(`🚀 Server running at http://localhost:${PORT}`);
  if (!MONGODB_URI) console.warn('⚠️ .env MONGODB_URI not set — DB features will fail.');
  if (!JWT_SECRET) console.warn('⚠️ .env JWT_SECRET not set — tokens use fallback.');
  if (!GEMINI_API_KEY) console.warn('⚠️ .env GEMINI_API_KEY not set — AI endpoints will use fallback messages.');
});
