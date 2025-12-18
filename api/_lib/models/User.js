import mongoose from 'mongoose';
import bcrypt from 'bcrypt';

const GameHistorySchema = new mongoose.Schema({
  result: Number,
  wager: Number,
  payout: Number,
  timestamp: { type: Date, default: Date.now }
});

const UserSchema = new mongoose.Schema({
  username: { type: String, required: true, unique: true },
  email: { type: String, required: true, unique: true },
  password: { type: String, required: true },
  age: { type: Number },
  country: { type: String },
  gender: { type: String, enum: ['male', 'female', 'other', 'prefer-not-to-say'], default: 'prefer-not-to-say' },
  bettingPreferences: {
    favoriteBetType: { type: String, default: 'RED' },
    riskTolerance: { type: String, enum: ['low', 'medium', 'high'], default: 'medium' },
    preferredBetAmount: { type: Number, default: 50 },
    favoriteNumbers: [{ type: Number, min: 0, max: 36 }]
  },
  balance: { type: Number, default: 5000 }, // R5,000 welcome bonus (ZAR)
  freeSpins: { type: Number, default: 10 }, // 10 free spins for new players
  totalWon: { type: Number, default: 0 }, // Total winnings for leaderboard
  totalWagered: { type: Number, default: 0 }, // Total amount wagered
  gamesPlayed: { type: Number, default: 0 }, // Total games played
  biggestWin: { type: Number, default: 0 }, // Biggest single win
  referralCode: { type: String, unique: true, sparse: true },
  referredBy: { type: String, default: null },
  surveysCompleted: { type: Number, default: 0 },
  lastDailyBonus: { type: Date, default: null }, // Track daily bonus claims
  vipLevel: { type: Number, default: 1 }, // VIP tier 1-5
  
  // Enhanced fields for serverless-safe rate limiting
  dailySurveysToday: { type: Number, default: 0 },
  lastSurveyReset: { type: Date, default: null },
  dailySharesPerPlatform: { type: Map, of: Number, default: {} }, // { platform: count }
  lastShareReset: { type: Date, default: null },
  
  history: [GameHistorySchema],
  createdAt: { type: Date, default: Date.now },
  lastLogin: { type: Date, default: Date.now }
});

// Hash password before saving
UserSchema.pre('save', async function(next) {
  // Only hash the password if it has been modified (or is new)
  if (!this.isModified('password')) return next();

  try {
    // Hash password with cost of 12
    const salt = await bcrypt.genSalt(12);
    this.password = await bcrypt.hash(this.password, salt);
    next();
  } catch (error) {
    next(error);
  }
});

// Compare password method
UserSchema.methods.comparePassword = async function(candidatePassword) {
  return bcrypt.compare(candidatePassword, this.password);
};

// Generate unique referral code on save
UserSchema.pre('save', function(next) {
  if (!this.referralCode) {
    this.referralCode = this.username.toUpperCase().slice(0, 4) + Math.random().toString(36).substr(2, 4).toUpperCase();
  }
  next();
});

// Method to check and reset daily survey count
UserSchema.methods.checkSurveyLimit = function() {
  const now = new Date();
  const today = new Date(now.getFullYear(), now.getMonth(), now.getDate());
  const lastReset = this.lastSurveyReset ? new Date(this.lastSurveyReset) : null;

  // Reset counter if it's a new day
  if (!lastReset || lastReset < today) {
    this.dailySurveysToday = 0;
    this.lastSurveyReset = now;
  }

  return this.dailySurveysToday < 3; // Max 3 per day
};

// Method to check and reset daily share count per platform
UserSchema.methods.checkShareLimit = function(platform) {
  const now = new Date();
  const today = new Date(now.getFullYear(), now.getMonth(), now.getDate());
  const lastReset = this.lastShareReset ? new Date(this.lastShareReset) : null;

  // Reset counters if it's a new day
  if (!lastReset || lastReset < today) {
    this.dailySharesPerPlatform = new Map();
    this.lastShareReset = now;
  }

  const currentCount = this.dailySharesPerPlatform.get(platform) || 0;
  return currentCount < 2; // Max 2 per day per platform
};

export default mongoose.models.User || mongoose.model('User', UserSchema);
