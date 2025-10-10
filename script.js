// script.js

document.addEventListener('DOMContentLoaded', () => {
    // --- SERVER URL ---
    // All backend requests will go to this address.
    const SERVER_URL = 'http://localhost:4000';

    // --- Mobile Menu Toggle ---
    const menuButton = document.getElementById('menu-button');
    const mobileMenu = document.getElementById('mobile-menu');
    if (menuButton && mobileMenu) {
        menuButton.addEventListener('click', () => {
            mobileMenu.classList.toggle('hidden');
        });
    }

    // --- Survey Logic ---
    const surveyContainer = document.getElementById('survey-container');
    if (surveyContainer) {
        const surveyQuestions = [
            { q: "What is your age?", type: "input", key: "age", placeholder: "Enter your age" },
            { q: "What is your Gender?", key: "gender", options: [{ emoji: "♂️", label: "Male" }, { emoji: "♀️", label: "Female" }, { emoji: "⚪", label: "Other" }] },
            { q: "What is your family's monthly income (INR)?", type: "input", key: "income", placeholder: "E.g., 30000" },
            { q: "How often do you feel Overwhelmed?", key: "q1", options: [{ emoji: "😄", label: "Rarely", score: 4 }, { emoji: "😐", label: "Sometimes", score: 3 }, { emoji: "😟", label: "Often", score: 2 }, { emoji: "😫", label: "Always", score: 1 }] },
            { q: "How well do you sleep at night?", key: "q2", options: [{ emoji: "😴", label: "Very well", score: 4 }, { emoji: "🙂", label: "Okay", score: 3 }, { emoji: "😕", label: "Poorly", score: 2 }, { emoji: "😵", label: "I struggle", score: 1 }] },
            { q: "How is your appetite lately?", key: "q3", options: [{ emoji: "🍽️", label: "Good", score: 4 }, { emoji: "😐", label: "Average", score: 3 }, { emoji: "😒", label: "Low", score: 2 }, { emoji: "😞", label: "Very low", score: 1 }] },
            { q: "Do you feel interested in daily activities?", key: "q4", options: [{ emoji: "😊", label: "Always", score: 4 }, { emoji: "🙂", label: "Mostly", score: 3 }, { emoji: "😐", label: "Sometimes", score: 2 }, { emoji: "😔", label: "Rarely", score: 1 }] },
            { q: "Do you feel anxious or nervous?", key: "q5", options: [{ emoji: "😌", label: "Never", score: 4 }, { emoji: "😟", label: "Sometimes", score: 3 }, { emoji: "😰", label: "Frequently", score: 2 }, { emoji: "😱", label: "Constantly", score: 1 }] },
            { q: "How often do you feel sad?", key: "q6", options: [{ emoji: "😊", label: "Rarely", score: 4 }, { emoji: "😐", label: "Sometimes", score: 3 }, { emoji: "😢", label: "Often", score: 2 }, { emoji: "😭", label: "All the time", score: 1 }] },
            { q: "Do you feel energetic throughout the day?", key: "q7", options: [{ emoji: "⚡", label: "Yes", score: 4 }, { emoji: "🙂", label: "Mostly", score: 3 }, { emoji: "😴", label: "Rarely", score: 2 }, { emoji: "😩", label: "No", score: 1 }] },
            { q: "Do you feel socially connected?", key: "q8", options: [{ emoji: "👥", label: "Yes", score: 4 }, { emoji: "🙂", label: "Somewhat", score: 3 }, { emoji: "😐", label: "Not much", score: 2 }, { emoji: "😞", label: "Very isolated", score: 1 }] },
            { q: "Do you have support from family/friends?", key: "q9", options: [{ emoji: "🤗", label: "Always", score: 4 }, { emoji: "🙂", label: "Mostly", score: 3 }, { emoji: "😐", label: "Sometimes", score: 2 }, { emoji: "😔", label: "Not at all", score: 1 }] },
            { q: "Are you able to concentrate well?", key: "q10", options: [{ emoji: "🎯", label: "Yes", score: 4 }, { emoji: "🙂", label: "Sometimes", score: 3 }, { emoji: "😕", label: "Rarely", score: 2 }, { emoji: "😵", label: "Not at all", score: 1 }] },
            { q: "How do you feel about your future?", key: "q11", options: [{ emoji: "🌟", label: "Hopeful", score: 4 }, { emoji: "😐", label: "Neutral", score: 3 }, { emoji: "😟", label: "Worried", score: 2 }, { emoji: "😞", label: "Hopeless", score: 1 }] },
            { q: "How often do you feel angry or frustrated?", key: "q12", options: [{ emoji: "😌", label: "Rarely", score: 4 }, { emoji: "😠", label: "Sometimes", score: 3 }, { emoji: "😡", label: "Often", score: 2 }, { emoji: "🤬", label: "Very often", score: 1 }] },
            { q: "Do you enjoy your own company?", key: "q13", options: [{ emoji: "😊", label: "Yes", score: 4 }, { emoji: "🙂", label: "Sometimes", score: 3 }, { emoji: "😐", label: "Not much", score: 2 }, { emoji: "😞", label: "No", score: 1 }] },
        ];

        let currentQuestionIndex = 0;
        const surveyResponses = {};
        const questionCard = document.getElementById('question-card');
        const questionText = document.getElementById('question-text');
        const optionsContainer = document.getElementById('options-container');
        const surveyComplete = document.getElementById('survey-complete');
        const scoreTitle = document.getElementById('score-title');
        const scoreMessage = document.getElementById('score-message');
        const scoreResources = document.getElementById('score-resources');
        const resourceList = document.getElementById('resource-list');
        const retakeButton = document.getElementById('retake-button');
        
        const calculateScore = () => {
            let totalScore = 0;
            let questionsWithScores = 0;
            surveyQuestions.forEach(q => {
                if (q.options && surveyResponses[q.key]) {
                    const selectedOption = q.options.find(opt => opt.label === surveyResponses[q.key]);
                    if (selectedOption && typeof selectedOption.score !== 'undefined') {
                        totalScore += selectedOption.score;
                        questionsWithScores++;
                    }
                }
            });
            return questionsWithScores === 0 ? 0 : Math.round((totalScore / (questionsWithScores * 4)) * 10);
        };

        const renderResultScreen = async () => {
            document.getElementById('question-card').classList.add('hidden');
            const finalScore = calculateScore();
            scoreTitle.textContent = `Your Check-In Score: ${finalScore}/10`;

            if (finalScore <= 4) {
                scoreMessage.innerHTML = 'Your responses suggest you may be going through a difficult time. It is a sign of great strength to seek help. We strongly recommend speaking with a mental health professional.<a href="https://www.google.com/maps/search/therapists+near+me" target="_blank" class="text-indigo-600 underline"> <br>🔍 Find doctors near you </br></a>' ;
                scoreResources.classList.add('hidden');
            } else if (finalScore <= 7) {
                scoreMessage.textContent = 'Thank you for checking in with yourself. Here are some personalized resources that might be helpful for you right now.';
                await getRecommendations();
                scoreResources.classList.remove('hidden');
            } else {
                scoreMessage.textContent = "You're doing well—thank you for taking the time to check in with your mental health. Keep prioritizing your well-being! 🎉";
                scoreResources.classList.add('hidden');
            }
        };

        const getRecommendations = async () => {
            resourceList.innerHTML = '<p class="text-gray-500">Generating personalized suggestions...</p>';
            try {
                const response = await fetch(`${SERVER_URL}/api/recommendations`, {
                    method: 'POST',
                    headers: { 'Content-Type': 'application/json' },
                    body: JSON.stringify(surveyResponses),
                });
                if (!response.ok) throw new Error('Network response was not ok');
                const data = await response.json();
                const items = data.recommendations.split('\n').filter(line => line.trim() !== '');

                resourceList.innerHTML = items.map(item => {
                    let trimmed = item.replace(/(\*\*|^\s*-\s*|\*\s*)/g, '').trim();
                    if (trimmed.toLowerCase().startsWith("book:")) {
                        const query = encodeURIComponent(trimmed.substring(5).trim());
                        return `<p>📚 <a href="https://www.google.com/search?q=${query}" target="_blank" class="text-indigo-600 hover:underline">${trimmed}</a></p>`;
                    } else if (trimmed.toLowerCase().startsWith("activity:")) {
                         const query = encodeURIComponent(trimmed.substring(9).trim());
                        return `<p>🏃‍♂️ <a href="https://www.google.com/search?q=${query}" target="_blank" class="text-indigo-600 hover:underline">${trimmed}</a></p>`;
                    } else if (trimmed.toLowerCase().startsWith("youtube:")) {
                        const query = encodeURIComponent(trimmed.substring(8).trim());
                        return `<p>📺 <a href="https://www.youtube.com/results?search_query=${query}" target="_blank" class="text-indigo-600 hover:underline">${trimmed}</a></p>`;
                    } else {
                        return `<p>${item}</p>`;
                    }
                }).join('');
            } catch (error) {
                resourceList.innerHTML = '<p class="text-red-500">Could not generate recommendations at this time.</p>';
                console.error("Recommendation Error:", error);
            }
        };

        const renderQuestion = () => {
            if (currentQuestionIndex < surveyQuestions.length) {
                const q = surveyQuestions[currentQuestionIndex];
                questionText.textContent = q.q;
                optionsContainer.innerHTML = '';

                if (q.type === 'input') {
                    optionsContainer.className = 'flex flex-col items-center gap-4';
                    const input = `<input type="text" id="survey-input" placeholder="${q.placeholder}" class="w-full max-w-sm p-3 rounded-lg border border-gray-300 text-center text-lg">`;
                    const button = `<button id="next-btn" class="mt-4 bg-indigo-600 text-white font-semibold py-3 px-8 rounded-full">Next</button>`;
                    optionsContainer.innerHTML = input + button;
                    document.getElementById('next-btn').addEventListener('click', () => {
                        const val = document.getElementById('survey-input').value.trim();
                        if (val) {
                            surveyResponses[q.key] = val;
                            currentQuestionIndex++;
                            renderQuestion();
                        }
                    });
                } else {
                    optionsContainer.className = 'grid sm:grid-cols-2 gap-6';
                    q.options.forEach(opt => {
                        const card = document.createElement('div');
                        card.className = 'bg-gray-50 p-6 rounded-xl cursor-pointer hover:bg-indigo-100 text-center';
                        card.innerHTML = `<span class="text-5xl block mb-2">${opt.emoji}</span><p class="font-medium text-lg">${opt.label}</p>`;
                        card.addEventListener('click', () => {
                            surveyResponses[q.key] = opt.label;
                            currentQuestionIndex++;
                            renderQuestion();
                        });
                        optionsContainer.appendChild(card);
                    });
                }
            } else {
                questionCard.classList.add('hidden');
                surveyComplete.classList.remove('hidden');
                renderResultScreen();
                saveSurveyData(surveyResponses);
            }
        };
        
        retakeButton.addEventListener('click', () => {
            currentQuestionIndex = 0;
            Object.keys(surveyResponses).forEach(key => delete surveyResponses[key]);
            surveyComplete.classList.add('hidden');
            questionCard.classList.remove('hidden');
            renderQuestion();
        });
        
        const saveSurveyData = async (responses) => {
            try {
                await fetch(`${SERVER_URL}/api/survey`, {
                    method: 'POST',
                    headers: { 'Content-Type': 'application/json' },
                    body: JSON.stringify(responses),
                });
            } catch (error) {
                console.error("Could not save survey data:", error);
            }
        };

        renderQuestion();
    }

    // --- AI Chatbot Logic ---
    const chatbotContainer = document.getElementById('chatbot-container');
    if (chatbotContainer) {
        const chatForm = document.getElementById('chat-form');
        const chatMessages = document.getElementById('chat-messages');
        const chatInput = document.getElementById('chat-input');

        const addMessage = (sender, text) => {
            const messageDiv = document.createElement('div');
            messageDiv.className = `chat-message ${sender} p-4 rounded-xl max-w-[80%]`;
            messageDiv.textContent = text;
            chatMessages.appendChild(messageDiv);
            chatMessages.scrollTop = chatMessages.scrollHeight;
        };

        const handleChatSubmit = async (e) => {
            e.preventDefault();
            const userMessage = chatInput.value.trim();
            if (!userMessage) return;
            
            addMessage('user', userMessage);
            chatInput.value = '';
            
            const typingIndicator = document.createElement('div');
            typingIndicator.className = 'chat-message bot p-4 rounded-xl max-w-[80%] animate-pulse';
            typingIndicator.textContent = '...';
            chatMessages.appendChild(typingIndicator);
            chatMessages.scrollTop = chatMessages.scrollHeight;

            try {
                const response = await fetch(`${SERVER_URL}/api/chat`, {
                    method: 'POST',
                    headers: { 'Content-Type': 'application/json' },
                    body: JSON.stringify({ message: userMessage })
                });
                if (!response.ok) throw new Error('Network response was not ok');
                const data = await response.json();
                typingIndicator.remove();
                addMessage('bot', data.response);
            } catch (error) {
                typingIndicator.remove();
                addMessage('bot', 'Sorry, I am having trouble connecting right now. Please try again later.');
                console.error("Chatbot Error:", error);
            }
        };

        chatForm.addEventListener('submit', handleChatSubmit);
    }

    // --- Daily Affirmation Logic ---
    const generateAffirmationButton = document.getElementById('generate-affirmation');
    if (generateAffirmationButton) {
        const affirmationText = document.getElementById('affirmation-text');
        generateAffirmationButton.addEventListener('click', async () => {
            const originalText = generateAffirmationButton.textContent;
            generateAffirmationButton.textContent = 'Generating...';
            generateAffirmationButton.disabled = true;
            try {
                const response = await fetch(`${SERVER_URL}/api/affirmation`, { method: 'POST' });
                const data = await response.json();
                affirmationText.textContent = data.response;
            } catch (error) {
                affirmationText.textContent = "Could not generate an affirmation right now.";
            } finally {
                generateAffirmationButton.textContent = originalText;
                generateAffirmationButton.disabled = false;
            }
        });
        // Generate one on page load
        generateAffirmationButton.click();
    }
});
