import { requireAuth } from './_lib/auth.js';
import { setCorsHeaders, handleOptions } from './_lib/cors.js';

export default async function handler(req, res) {
  setCorsHeaders(res);
  if (handleOptions(req, res)) return;

  if (req.method !== 'PUT') {
    return res.status(405).json({ error: 'Method not allowed' });
  }

  const user = await requireAuth(req, res);
  if (!user) return; // Error already sent by requireAuth

  const { username, age, country, gender, bettingPreferences } = req.body;

  try {
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
}
