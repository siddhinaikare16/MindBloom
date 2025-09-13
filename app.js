// server.js

// --- Import Packages ---
// const express = require('express');
// const mongoose = require('mongoose');
// const cors = require('cors');
// const axios = require('axios');
// require('dotenv').config();

// --- App Configuration ---
// const app = express();
// const PORT = 3000;
// app.use(cors());
// In app.js
// --- Middleware ---

require('dotenv').config();
const express = require('express');
const mongoose = require('mongoose');
const axios = require('axios');
const cors = require('cors');

const app = express();
const PORT = process.env.PORT || 3000;

// --- Middleware ---
// This is the final fix. It correctly sets up the permissions.
app.use(cors({
    origin: ['http://127.0.0.1:5500', 'http://localhost:5500', null] // 'null' allows direct file opening
}));
app.use(express.json()); // This must come after cors()



const corsOptions = {
    origin: ['http://127.0.0.1:5500', 'http://localhost:5500'], // Allow your Live Server to connect
    methods: ['GET', 'POST'],
    allowedHeaders: ['Content-Type', 'x-admin-password'],
};
app.use(cors(corsOptions));
app.use(express.json());

// --- Environment Variables (from .env file) ---
const MONGODB_URI = process.env.MONGODB_URI;
const GEMINI_API_KEY = process.env.GEMINI_API_KEY;
const ADMIN_PASSWORD = process.env.ADMIN_PASSWORD; // For dashboard access

// --- Database Connection ---
mongoose.connect(MONGODB_URI)
    .then(() => console.log("Successfully connected to MongoDB Atlas!"))
    .catch(err => console.error("Could not connect to MongoDB Atlas.", err));

// --- Database Schema and Model ---
const surveyResponseSchema = new mongoose.Schema({
    age: String, gender: String, income: String, q1: String, q2: String,
    q3: String, q4: String, q5: String, q6: String, q7: String, q8: String,
    q9: String, q10: String, q11: String, q12: String, q13: String,
    createdAt: { type: Date, default: Date.now }
});
const SurveyResponse = mongoose.model('SurveyResponse', surveyResponseSchema);

// --- Helper Function for Google Gemini API Calls ---
async function callGoogleApi(payload) {
    if (!GEMINI_API_KEY) throw new Error("API key not configured.");
    const API_URL = `https://generativelanguage.googleapis.com/v1beta/models/gemini-2.5-flash-preview-05-20:generateContent?key=${GEMINI_API_KEY}`;
    try {
        const response = await axios.post(API_URL, payload);
        return response.data;
    } catch (error) {
        console.error("Error calling Google API:", error.response ? error.response.data : error.message);
        throw new Error("Failed to get a response from the AI model.");
    }
}


// =================================================================
// --- PUBLIC API ENDPOINTS (Called by your main index.html) ---
// =================================================================

// Endpoint for saving a new survey response
app.post('/api/survey', async (req, res) => {
    try {
        const newResponse = new SurveyResponse(req.body);
        await newResponse.save();
        res.status(201).json({ message: "Survey data saved successfully!" });
    } catch (error) {
        res.status(500).json({ error: "Failed to save survey data." });
    }
});

// Endpoint for the AI Chatbot
app.post('/api/chat', async (req, res) => {
    try {
        const { message } = req.body;
        const systemPrompt = "You are a supportive, empathetic AI therapist. Listen without judgment, offer gentle encouragement, and provide kind advice. Use relevant emojis. Always recommend speaking with a real-life professional when appropriate and avoid giving medical advice.";
        const payload = { contents: [{ parts: [{ text: message }] }], systemInstruction: { parts: [{ text: systemPrompt }] } };
        const result = await callGoogleApi(payload);
        const botResponse = result.candidates?.[0]?.content?.parts?.[0]?.text || "I'm sorry, I couldn't process that.";
        res.json({ response: botResponse });
    } catch (error) {
        res.status(500).json({ error: error.message });
    }
});

// Endpoint for Daily Affirmations
app.post('/api/affirmation', async (req, res) => {
    try {
        const systemPrompt = "You are a motivational coach. Provide a concise, single-sentence positive affirmation. Do not include any introduction or extra text.";
        const userPrompt = "Generate a daily positive affirmation. Add a small variation each time.";

        // const payload = { contents: [{ parts: [{ text: "Generate a daily positive affirmation." }] }], systemInstruction: { parts: [{ text: systemPrompt }] } };
        const payload = {
            contents: [{ parts: [{ text: userPrompt }] }],
            systemInstruction: { parts: [{ text: systemPrompt }] }
        };

        const result = await callGoogleApi(payload);
        const affirmation = result.candidates?.[0]?.content?.parts?.[0]?.text || "You are capable of amazing things.";
        res.json({ response: affirmation.trim().replace(/^"|"$/g, '') });
    } catch (error) {
        res.status(500).json({ error: error.message });
    }
});


// =================================================================
// --- ADMIN API ENDPOINT (Called by your dashboard.html) ---
// =================================================================

// This endpoint retrieves all survey data for the admin dashboard.
// It is protected by a simple password check.
app.get('/api/survey-data', async (req, res) => {
    const password = req.headers['x-admin-password'];

    if (password !== ADMIN_PASSWORD) {
        return res.status(401).json({ error: "Unauthorized: Incorrect password." });
    }

    try {
        const allResponses = await SurveyResponse.find().sort({ createdAt: -1 }); // Get newest first
        res.status(200).json(allResponses);
    } catch (error) {
        res.status(500).json({ error: "Failed to fetch survey data." });
    }
});
// --- New Endpoint for Personalized Recommendations ---
app.post('/api/recommendations', async (req, res) => {
    try {
        const surveyResponses = req.body;
        // Create a summary of the user's answers to send to the AI
        const summary = Object.entries(surveyResponses)
            .map(([key, value]) => `- ${key}: ${value}`)
            .join('\n');

        const systemPrompt = "You are a compassionate mental health advisor. Based on the user's survey responses below, provide a short, supportive message and a list of 2-3 specific, helpful recommendations. The recommendations can be books, YouTube videos/channels, or self-care activities. Format the response clearly. For example: 'Book: The Midnight Library by Matt Haig' or 'Activity: Try a 5-minute guided breathing exercise on YouTube.'";

        const userPrompt = `Here are the user's survey responses:\n${summary}`;

        const payload = {
            contents: [{ parts: [{ text: userPrompt }] }],
            systemInstruction: { parts: [{ text: systemPrompt }] }
        };

        const result = await callGoogleApi(payload);
        const recommendations = result.candidates?.[0]?.content?.parts?.[0]?.text || "No recommendations could be generated at this time.";

        res.json({ recommendations });
        // } catch (error) {
        //     res.status(500).json({ error: error.message });
        // }
        // In app.js
    } catch (error) {
        // This will print the detailed error from Google's server to your terminal
        console.error("--- ERROR FETCHING RECOMMENDATIONS ---");
        if (error.response) {
            // The request was made and the server responded with an error
            console.error("Data:", error.response.data);
            console.error("Status:", error.response.status);
        } else if (error.request) {
            // The request was made but no response was received
            console.error("Request:", error.request);
        } else {
            // Something else happened
            console.error('Error Message:', error.message);
        }
        console.error("--- END OF ERROR ---");
        res.status(500).json({ error: "Failed to generate recommendations." });
    }
});

// --- Start Server ---
app.listen(PORT, () => {
    console.log(`Server is running at http://localhost:${PORT}`);
    if (!MONGODB_URI || !GEMINI_API_KEY || !ADMIN_PASSWORD) {
        console.warn('WARNING: One or more required .env variables (MONGODB_URI, GEMINI_API_KEY, ADMIN_PASSWORD) are missing!');
    }
});

