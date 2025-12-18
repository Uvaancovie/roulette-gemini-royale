import { GoogleGenerativeAI } from "@google/generative-ai";
import { requireAuth } from './_lib/auth.js';
import { setCorsHeaders, handleOptions } from './_lib/cors.js';

// Initialize Gemini
const genAI = new GoogleGenerativeAI(process.env.VITE_GEMINI_API_KEY || '');

// Local AI fallback - generates dealer-style responses without external API
function generateLocalResponse(prompt) {
  const promptLower = prompt.toLowerCase();
  
  // Spinning phase responses
  if (promptLower.includes('spinning') || promptLower.includes('wheel is spinning')) {
    const spinningResponses = [
      "Round and round she goes... where she stops, nobody knows! 🎰",
      "Fingers crossed! Let's see what Lady Luck has in store! 🤞",
      "The wheel is dancing! Feel that excitement? 💃",
      "Hold your breath... this could be your lucky spin! ✨",
      "Watch it spin! Every revolution could change everything! 🔄",
      "The tension is real! Good luck, my friend! 🍀",
    ];
    return spinningResponses[Math.floor(Math.random() * spinningResponses.length)];
  }
  
  // Win responses
  if (promptLower.includes('won') || promptLower.includes('winner')) {
    const winResponses = [
      "WINNER WINNER! The table is hot tonight! 🔥💰",
      "Ka-CHING! Now THAT'S what I'm talking about! 💵",
      "Look at you go! The Rands are flowing! 🤑",
      "Eish! What a beautiful win! Keep it rolling! 🎉",
      "The ancestors are smiling on you today! 🌟",
      "Haibo! You're on fire! Don't stop now! 🔥",
    ];
    return winResponses[Math.floor(Math.random() * winResponses.length)];
  }
  
  // Loss responses
  if (promptLower.includes('lost') || promptLower.includes('loss')) {
    const lossResponses = [
      "Ag shame! But every spin is a new chance! 🎲",
      "The wheel giveth and the wheel taketh... try again! 💪",
      "Don't worry! Your luck is about to turn around! 🍀",
      "That's casino life, my friend. Next spin could be THE one! ✨",
      "Keep your head up! Champions bounce back! 🏆",
      "Eish, tough break. But fortune favours the brave! 🦁",
    ];
    return lossResponses[Math.floor(Math.random() * lossResponses.length)];
  }
  
  // Strategy/tip responses
  if (promptLower.includes('analysis') || promptLower.includes('probability') || promptLower.includes('tip')) {
    const tipResponses = [
      "ANALYSIS: The wheel has no memory! Each spin is independent.\nSUGGESTION: Mix inside and outside bets for balance.\nCONFIDENCE: 72%",
      "ANALYSIS: Outside bets (Red/Black) have better odds.\nSUGGESTION: Start conservative, build your bankroll.\nCONFIDENCE: 68%",
      "ANALYSIS: Hot numbers are just statistics, not predictions!\nSUGGESTION: Set a budget and stick to it.\nCONFIDENCE: 85%",
      "ANALYSIS: The house edge is 2.7% on European Roulette.\nSUGGESTION: Play for fun, not to get rich!\nCONFIDENCE: 90%",
    ];
    return tipResponses[Math.floor(Math.random() * tipResponses.length)];
  }
  
  // Default responses
  const defaultResponses = [
    "Welcome to Covies Casino! Place your bets and let's roll! 🎰",
    "Ready to test your luck? The wheel awaits! ⭐",
    "Feeling lucky today? Show me what you've got! 💎",
    "The table is set, the stakes are high! Let's play! 🎲",
  ];
  return defaultResponses[Math.floor(Math.random() * defaultResponses.length)];
}

export default async function handler(req, res) {
  setCorsHeaders(res);
  if (handleOptions(req, res)) return;

  if (req.method !== 'POST') {
    return res.status(405).json({ error: 'Method not allowed' });
  }

  const user = await requireAuth(req, res);
  if (!user) return; // Error already sent by requireAuth

  const { prompt } = req.body;
  console.log('Chat request received:', { prompt: prompt?.substring(0, 50) + '...' });
  
  if (!prompt) {
    console.log('No prompt provided');
    return res.status(400).json({ error: "Prompt required" });
  }

  // Check if we have a valid API key (not leaked)
  const apiKey = process.env.VITE_GEMINI_API_KEY;
  if (!apiKey || apiKey.startsWith('AIzaSyDwfU1w')) {
    // Key is either missing or known to be leaked - use local fallback
    console.log('Using local fallback (no valid API key)');
    return res.json({ text: generateLocalResponse(prompt), model: 'local-fallback' });
  }

  try {
    console.log('Calling Gemini API...');

    // Valid model names for Google Generative AI SDK
    const candidateModels = [
      'gemini-1.5-flash-latest',
      'gemini-1.5-pro-latest', 
      'gemini-pro'
    ];

    let lastErr = null;
    let chosenModel = null;
    let generatedText = null;

    for (const candidate of candidateModels) {
      try {
        console.log('Trying model:', candidate);
        const model = genAI.getGenerativeModel({ model: candidate });
        const result = await model.generateContent(prompt);
        const response = await result.response;
        generatedText = response.text();
        chosenModel = candidate;
        console.log('Model succeeded:', candidate);
        break;
      } catch (err) {
        lastErr = err;
        console.warn('Model failed:', candidate, err && err.message ? err.message : err);
        continue;
      }
    }

    if (!chosenModel) {
      console.log('All model attempts failed, using local fallback');
      return res.json({ text: generateLocalResponse(prompt), model: 'local-fallback' });
    }

    console.log('Gemini response received from', chosenModel);
    res.json({ text: generatedText, model: chosenModel });
  } catch (error) {
    console.error('Gemini API error, using local fallback:', error.message);
    res.json({ text: generateLocalResponse(prompt), model: 'local-fallback' });
  }
}
