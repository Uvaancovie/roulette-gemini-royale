import dbConnect from './_lib/dbConnect.js';
import User from './_lib/models/User.js';
import jwt from 'jsonwebtoken';
import { setCorsHeaders, handleOptions } from './_lib/cors.js';

export default async function handler(req, res) {
  setCorsHeaders(res);
  if (handleOptions(req, res)) return;

  if (req.method !== 'POST') {
    return res.status(405).json({ error: 'Method not allowed' });
  }

  await dbConnect();

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
}
