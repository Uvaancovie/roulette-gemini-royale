import express from 'express';
import mongoose from 'mongoose';
import cors from 'cors';
import dotenv from 'dotenv';
import jwt from 'jsonwebtoken';
import { GoogleGenerativeAI } from "@google/generative-ai";
import User from './models/User.js';

dotenv.config();

const app = express();

// CORS configuration — allow only known frontend origins and handle preflight
const allowedOrigins = [
  'http://localhost:3000',
  'http://localhost:5173',
  'https://roulette-gemini-royale.vercel.app',
  'https://covies-casino.vercel.app'
];

const corsOptions = {
  origin: (origin, callback) => {
    // Allow non-browser requests (no origin) and known origins
    if (!origin || allowedOrigins.includes(origin)) {
      return callback(null, true);
    }
    return callback(null, false);
  },
  methods: ['GET', 'POST', 'PUT', 'DELETE', 'OPTIONS'],
  allowedHeaders: ['Content-Type', 'Authorization'],
  credentials: true,
  optionsSuccessStatus: 200
};

app.use(cors(corsOptions));
app.options('*', cors(corsOptions));

app.use(express.json());

// Connect to MongoDB
mongoose.connect(process.env.MONGO_URI)
  .then(() => console.log('MongoDB Connected'))
  .catch(err => console.error(err));

// Initialize Gemini (Server-side only)
const genAI = new GoogleGenerativeAI(process.env.VITE_GEMINI_API_KEY);

// Helper function to calculate winnings
const calculateWinnings = (bets, winningNumber) => {
  let totalWinnings = 0;
  const winningColor = getNumberColor(winningNumber);

  bets.forEach(bet => {
    let won = false;
    switch (bet.type) {
      case 'STRAIGHT': if (bet.target === winningNumber) won = true; break;
      case 'RED': if (winningColor === 'red') won = true; break;
      case 'BLACK': if (winningColor === 'black') won = true; break;
      case 'EVEN': if (winningNumber !== 0 && winningNumber % 2 === 0) won = true; break;
      case 'ODD': if (winningNumber !== 0 && winningNumber % 2 !== 0) won = true; break;
      case 'LOW': if (winningNumber >= 1 && winningNumber <= 18) won = true; break;
      case 'HIGH': if (winningNumber >= 19 && winningNumber <= 36) won = true; break;
      case 'DOZEN_1': if (winningNumber >= 1 && winningNumber <= 12) won = true; break;
      case 'DOZEN_2': if (winningNumber >= 13 && winningNumber <= 24) won = true; break;
      case 'DOZEN_3': if (winningNumber >= 25 && winningNumber <= 36) won = true; break;
      case 'COLUMN_1': if (winningNumber !== 0 && winningNumber % 3 === 1) won = true; break;
      case 'COLUMN_2': if (winningNumber !== 0 && winningNumber % 3 === 2) won = true; break;
      case 'COLUMN_3': if (winningNumber !== 0 && winningNumber % 3 === 0) won = true; break;
    }
    if (won) {
      totalWinnings += bet.amount + (bet.amount * bet.payoutRatio);
    }
  });

  return totalWinnings;
};

// Helper function for number color
const getNumberColor = (num) => {
  if (num === 0) return 'green';
  const redNumbers = new Set([1, 3, 5, 7, 9, 12, 14, 16, 18, 19, 21, 23, 25, 27, 30, 32, 34, 36]);
  return redNumbers.has(num) ? 'red' : 'black';
};

// Middleware to require authentication
const requireAuth = async (req, res, next) => {
  const authHeader = req.headers.authorization;
  const token = authHeader && authHeader.split(' ')[1]; // Bearer TOKEN

  if (!token) {
    return res.status(401).json({ error: "Authentication required" });
  }

  try {
    const decoded = jwt.verify(token, process.env.JWT_SECRET || 'your-secret-key');
    const user = await User.findById(decoded.userId);
    if (!user) {
      return res.status(401).json({ error: "User not found" });
    }
    req.user = user; // Attach user to request
    next();
  } catch (error) {
    res.status(401).json({ error: "Invalid token" });
  }
};

// --- ENDPOINTS ---

// 1. Register/Login with email and password
app.post('/api/login', async (req, res) => {
  const { email, password, username, age, country, gender, bettingPreferences, referralCode } = req.body;

  if (!email || !password) {
    return res.status(400).json({ error: "Email and password required" });
  }

  try {
    // Try to find user by email
    let user = await User.findOne({ email: email.toLowerCase() });
    let isNewUser = false;

    if (!user) {
      // New user registration
      if (!username || !age || !country) {
        return res.status(400).json({ error: "Username, age, and country required for registration" });
      }

      isNewUser = true;
      user = new User({
        username,
        email: email.toLowerCase(),
        password,
        age: parseInt(age),
        country,
        gender: gender || 'prefer-not-to-say',
        bettingPreferences: bettingPreferences || {
          favoriteBetType: 'RED',
          riskTolerance: 'medium',
          preferredBetAmount: 50,
          favoriteNumbers: []
        }
      });

      // Apply referral bonus if valid code provided
      if (referralCode) {
        const referrer = await User.findOne({ referralCode: referralCode.toUpperCase() });
        if (referrer && referrer.username !== username) {
          user.referredBy = referrer.username;
          user.balance += 1000; // R1,000 extra bonus for being referred
          user.freeSpins += 5; // 5 extra free spins

          // Reward the referrer too
          referrer.balance += 500; // R500 for successful referral
          referrer.freeSpins += 3;
          await referrer.save();
        }
      }

      await user.save();
    } else {
      // Existing user login - verify password
      const isValidPassword = await user.comparePassword(password);
      if (!isValidPassword) {
        return res.status(401).json({ error: "Invalid email or password" });
      }

      // Update last login
      user.lastLogin = new Date();
      await user.save();
    }

    // Generate JWT token
    const token = jwt.sign(
      { userId: user._id, username: user.username },
      process.env.JWT_SECRET || 'your-secret-key',
      { expiresIn: '7d' }
    );

    res.json({
      token,
      user: {
        username: user.username,
        email: user.email,
        age: user.age,
        country: user.country,
        gender: user.gender,
        bettingPreferences: user.bettingPreferences,
        balance: user.balance,
        freeSpins: user.freeSpins,
        totalWon: user.totalWon,
        gamesPlayed: user.gamesPlayed,
        biggestWin: user.biggestWin,
        referralCode: user.referralCode,
        vipLevel: user.vipLevel,
        history: user.history.slice(-10)
      },
      isNewUser
    });
  } catch (error) {
    console.error('Login error:', error);
    if (error.code === 11000) { // Duplicate key error
      res.status(400).json({ error: "Email or username already exists" });
    } else {
      res.status(500).json({ error: "Database error" });
    }
  }
});

// 2. Secure Spin Logic - Now tracks stats for leaderboard
app.post('/api/spin', requireAuth, async (req, res) => {
  const { bets, useFreeSpins } = req.body;
  const user = req.user;

  if (!bets) return res.status(400).json({ error: "Bets required" });

  try {
    // Calculate total wager
    const totalWager = bets.reduce((sum, bet) => sum + bet.amount, 0);

    let usingFreeSpin = false;

    // Check if using free spins
    if (useFreeSpins && user.freeSpins > 0) {
      usingFreeSpin = true;
      user.freeSpins -= 1;
    } else {
      // Regular spin - check balance
      if (user.balance < totalWager) {
        return res.status(400).json({ error: "Insufficient funds" });
      }
      user.balance -= totalWager;
    }

    // Generate Result (Server-side RNG)
    const winningNumber = Math.floor(Math.random() * 37);

    // Calculate Winnings
    const totalWinnings = calculateWinnings(bets, winningNumber);
    const netWin = totalWinnings - (usingFreeSpin ? 0 : totalWager);

    // Update Balance & Stats
    user.balance += totalWinnings;
    user.totalWon += totalWinnings;
    user.totalWagered += usingFreeSpin ? 0 : totalWager;
    user.gamesPlayed += 1;

    if (netWin > user.biggestWin) {
      user.biggestWin = netWin;
    }

    // Update VIP level based on total wagered
    if (user.totalWagered >= 100000) user.vipLevel = 5;
    else if (user.totalWagered >= 50000) user.vipLevel = 4;
    else if (user.totalWagered >= 20000) user.vipLevel = 3;
    else if (user.totalWagered >= 5000) user.vipLevel = 2;

    user.history.push({
      result: winningNumber,
      wager: totalWager,
      payout: totalWinnings
    });

    await user.save();

    res.json({
      balance: user.balance,
      freeSpins: user.freeSpins,
      winningNumber,
      totalWinnings,
      usedFreeSpin: usingFreeSpin,
      vipLevel: user.vipLevel,
      history: user.history.slice(-10)
    });
  } catch (error) {
    console.error('Spin error:', error);
    res.status(500).json({ error: "Spin failed" });
  }
});

// 3. Secure AI Chat Proxy
app.post('/api/chat', requireAuth, async (req, res) => {
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

    // Valid model names for Google Generative AI SDK (June 2025)
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
});

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

// Local fallback for debugging: return a simple analysis without contacting Gemini
app.post('/api/chat-local', (req, res) => {
  const { prompt } = req.body;
  if (!prompt) return res.status(400).json({ error: 'Prompt required' });
  res.json({ text: `LOCAL_FALLBACK: Received prompt - ${String(prompt).slice(0,120)}` });
});

// Check if AI is configured and server status
app.get('/api/ai-health', (req, res) => {
  res.json({
    apiKeyAvailable: !!process.env.VITE_GEMINI_API_KEY,
    mongooseConnected: mongoose.connection.readyState === 1
  });
});

// 4. Get user data (authenticated user only)
app.get('/api/user', requireAuth, async (req, res) => {
  const user = req.user;

  res.json({
    username: user.username,
    email: user.email,
    balance: user.balance,
    freeSpins: user.freeSpins,
    totalWon: user.totalWon,
    gamesPlayed: user.gamesPlayed,
    biggestWin: user.biggestWin,
    referralCode: user.referralCode,
    vipLevel: user.vipLevel,
    lastDailyBonus: user.lastDailyBonus,
    history: user.history.slice(-10)
  });
});

// 5. LEADERBOARD - Top players by various metrics
app.get('/api/leaderboard', async (req, res) => {
  try {
    const { type = 'balance' } = req.query;
    
    let sortField = {};
    switch(type) {
      case 'wins': sortField = { totalWon: -1 }; break;
      case 'games': sortField = { gamesPlayed: -1 }; break;
      case 'bigwin': sortField = { biggestWin: -1 }; break;
      default: sortField = { balance: -1 };
    }
    
    const leaderboard = await User.find({})
      .sort(sortField)
      .limit(20)
      .select('username balance totalWon gamesPlayed biggestWin vipLevel');
    
    res.json({ leaderboard, type });
  } catch (error) {
    console.error('Leaderboard error:', error);
    res.status(500).json({ error: "Failed to fetch leaderboard" });
  }
});

// 6. DAILY BONUS - Claim once per day
app.post('/api/daily-bonus', requireAuth, async (req, res) => {
  const user = req.user;

  try {
    const now = new Date();
    const lastClaim = user.lastDailyBonus ? new Date(user.lastDailyBonus) : null;

    // Check if 24 hours have passed
    if (lastClaim && (now - lastClaim) < 24 * 60 * 60 * 1000) {
      const hoursRemaining = Math.ceil((24 * 60 * 60 * 1000 - (now - lastClaim)) / (60 * 60 * 1000));
      return res.status(400).json({
        error: `Come back in ${hoursRemaining} hours!`,
        nextClaimIn: hoursRemaining
      });
    }

    // Calculate bonus based on VIP level
    const baseBonus = 500; // R500 base
    const vipMultiplier = user.vipLevel;
    const bonusAmount = baseBonus * vipMultiplier;
    const bonusSpins = user.vipLevel; // 1-5 free spins based on VIP

    user.balance += bonusAmount;
    user.freeSpins += bonusSpins;
    user.lastDailyBonus = now;

    await user.save();

    res.json({
      success: true,
      bonusAmount,
      bonusSpins,
      newBalance: user.balance,
      newFreeSpins: user.freeSpins,
      message: `🎁 Daily bonus claimed! R${bonusAmount} + ${bonusSpins} free spins!`
    });
  } catch (error) {
    console.error('Daily bonus error:', error);
    res.status(500).json({ error: "Failed to claim bonus" });
  }
});

// 7. SURVEY REWARDS - Complete surveys for coins (with rate limiting)
app.post('/api/survey-complete', requireAuth, async (req, res) => {
  const { surveyId } = req.body;
  const user = req.user;

  if (!surveyId) return res.status(400).json({ error: "SurveyId required" });

  try {
    // Rate limiting: Max 3 surveys per day
    const now = new Date();
    const today = new Date(now.getFullYear(), now.getMonth(), now.getDate());
    const recentSurveys = user.history.filter(h => {
      const historyDate = new Date(h.timestamp);
      return historyDate >= today && h.result === -1; // Using result -1 to mark survey completions
    });

    if (recentSurveys.length >= 3) {
      return res.status(429).json({
        error: "Survey limit reached. Try again tomorrow!",
        nextAvailable: new Date(today.getTime() + 24 * 60 * 60 * 1000).toISOString()
      });
    }

    // Validate surveyId format (basic validation)
    if (!/^[A-Za-z0-9_-]{8,}$/.test(surveyId)) {
      return res.status(400).json({ error: "Invalid survey ID" });
    }

    // Check if this survey was already completed
    const surveyKey = `survey_${surveyId}`;
    if (user.history.some(h => h.result === -1 && h.wager === 0 && h.payout === parseInt(surveyId.slice(-3)))) {
      return res.status(409).json({ error: "Survey already completed" });
    }

    const surveyReward = 250 + (user.vipLevel * 50); // R250-R500 based on VIP
    const surveySpins = 2;

    user.balance += surveyReward;
    user.freeSpins += surveySpins;
    user.surveysCompleted += 1;

    // Log survey completion in history with special marker
    user.history.push({
      result: -1, // Special marker for survey completion
      wager: 0,
      payout: surveyReward,
      timestamp: now
    });

    await user.save();

    res.json({
      success: true,
      rewardAmount: surveyReward,
      rewardSpins: surveySpins,
      totalSurveysCompleted: user.surveysCompleted,
      newBalance: user.balance,
      newFreeSpins: user.freeSpins,
      message: `Survey completed! R${surveyReward} + ${surveySpins} free spins earned!`
    });
  } catch (error) {
    console.error('Survey reward error:', error);
    res.status(500).json({ error: "Failed to process survey reward" });
  }
});

// 8. SHARE REWARDS - Rewards for social sharing (with rate limiting)
app.post('/api/share-reward', requireAuth, async (req, res) => {
  const { platform } = req.body;
  const user = req.user;

  if (!platform) return res.status(400).json({ error: "Platform required" });

  const validPlatforms = ['whatsapp', 'twitter', 'facebook', 'instagram', 'tiktok'];
  if (!validPlatforms.includes(platform.toLowerCase())) {
    return res.status(400).json({ error: "Invalid platform" });
  }

  try {
    const now = new Date();
    const today = new Date(now.getFullYear(), now.getMonth(), now.getDate());

    // Rate limiting: Max 2 shares per day per platform
    const recentShares = user.history.filter(h => {
      const historyDate = new Date(h.timestamp);
      return historyDate >= today && h.result === -2 && h.wager === validPlatforms.indexOf(platform.toLowerCase());
    });

    if (recentShares.length >= 2) {
      return res.status(429).json({
        error: `Share limit reached for ${platform}. Try again tomorrow!`,
        nextAvailable: new Date(today.getTime() + 24 * 60 * 60 * 1000).toISOString()
      });
    }

    const shareReward = 100; // R100 for sharing
    const shareSpins = 1;

    user.balance += shareReward;
    user.freeSpins += shareSpins;

    // Log share in history with special marker
    user.history.push({
      result: -2, // Special marker for share reward
      wager: validPlatforms.indexOf(platform.toLowerCase()), // Platform index
      payout: shareReward,
      timestamp: now
    });

    await user.save();

    res.json({
      success: true,
      rewardAmount: shareReward,
      rewardSpins: shareSpins,
      platform,
      newBalance: user.balance,
      newFreeSpins: user.freeSpins,
      message: `Thanks for sharing on ${platform}! Enjoy your R${shareReward} + ${shareSpins} free spin!`
    });
  } catch (error) {
    console.error('Share reward error:', error);
    res.status(500).json({ error: "Failed to process share reward" });
  }
});

// Update user profile
app.put('/api/user/profile', requireAuth, async (req, res) => {
  const { username, age, country, gender, bettingPreferences } = req.body;

  try {
    // req.user is already the full user object from requireAuth middleware
    const user = req.user;
    
    if (!user) {
      return res.status(404).json({ error: "User not found" });
    }

    // Update allowed fields
    if (username) user.username = username;
    if (age) user.age = parseInt(age);
    if (country) user.country = country;
    if (gender) user.gender = gender;
    if (bettingPreferences) {
      user.bettingPreferences = {
        favoriteBetType: bettingPreferences.favoriteBetType || user.bettingPreferences.favoriteBetType || 'RED',
        riskTolerance: bettingPreferences.riskTolerance || user.bettingPreferences.riskTolerance || 'medium',
        preferredBetAmount: bettingPreferences.preferredBetAmount || user.bettingPreferences.preferredBetAmount || 50,
        favoriteNumbers: bettingPreferences.favoriteNumbers || user.bettingPreferences.favoriteNumbers || []
      };
    }

    await user.save();

    res.json({
      success: true,
      profile: {
        username: user.username,
        email: user.email,
        age: user.age,
        country: user.country,
        gender: user.gender,
        bettingPreferences: user.bettingPreferences
      }
    });
  } catch (error) {
    console.error('Profile update error:', error);
    if (error.code === 11000) {
      res.status(400).json({ error: "Username already exists" });
    } else {
      res.status(500).json({ error: "Failed to update profile" });
    }
  }
});

// Get user profile
app.get('/api/user/profile', requireAuth, async (req, res) => {
  try {
    const user = req.user;
    res.json({
      profile: {
        username: user.username,
        email: user.email,
        age: user.age,
        country: user.country,
        gender: user.gender,
        bettingPreferences: user.bettingPreferences,
        balance: user.balance,
        freeSpins: user.freeSpins,
        totalWon: user.totalWon,
        gamesPlayed: user.gamesPlayed,
        biggestWin: user.biggestWin,
        referralCode: user.referralCode,
        vipLevel: user.vipLevel,
        history: user.history.slice(-10)
      }
    });
  } catch (error) {
    console.error('Profile fetch error:', error);
    res.status(500).json({ error: "Failed to fetch profile" });
  }
});

const PORT = process.env.PORT || 5003;
app.listen(PORT, () => console.log(`Server running on port ${PORT}`));