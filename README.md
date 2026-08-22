# MindBloom 🌱

A full-stack mental wellness web app that gives people a safe, private, and non-intimidating first step toward taking care of their mental health.

## About

Many people find it hard to take the first step toward mental health support — resources can feel inaccessible or intimidating. MindBloom is a single platform that offers practical self-care guidance, a confidential AI companion, and a private self-assessment tool, so users can check in with themselves and get help that's actually relevant to them.

## Features

- **Self-Care Resources** — practical, actionable tips for managing stress and improving well-being
- **Daily Affirmation Generator** — one click generates a positive, AI-written affirmation to start the day
- **Mental Health Check-In** — a short private survey that scores the user's current state (out of 10) and returns personalized feedback:
  - Low scores → encouragement to seek professional help
  - Mid-range scores → AI-generated resources (books, activities) tailored to the user's answers
- **AI Companion Chatbot** — a confidential, empathetic chatbot available 24/7 as a listening ear

## Tech Stack

**Frontend**
- HTML, CSS, JavaScript
- Tailwind CSS for a responsive, clean UI (desktop + mobile)

**Backend**
- Node.js + Express — handles all requests and keeps API keys secure server-side

**Database**
- MongoDB Atlas — stores check-in survey responses

**AI**
- Google Gemini API — powers the daily affirmations, personalized recommendations, and the companion chatbot (called only from the backend, never exposed to the browser)

## How It Works

1. User lands on a calm, welcoming homepage with self-care tips
2. They can generate a daily affirmation or take the private check-in survey
3. Survey answers are scored and sent to the backend, which returns personalized feedback — and calls the Gemini API for tailored resource suggestions when needed
4. Users can also chat anytime with the AI companion for support

## Getting Started

```bash
# clone the repo
git clone https://github.com/siddhinaikare16/MindBloom.git
cd MindBloom

# install dependencies
npm install

# add your environment variables (Gemini API key, MongoDB URI) in a .env file

# run the server
npm start
```

## Note

MindBloom is a self-care and support tool, not a substitute for professional mental health care. Users showing signs of significant distress are directed to seek professional help.
