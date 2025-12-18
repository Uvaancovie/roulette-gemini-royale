import { requireAuth } from './_lib/auth.js';
import { setCorsHeaders, handleOptions } from './_lib/cors.js';

export default async function handler(req, res) {
  setCorsHeaders(res);
  if (handleOptions(req, res)) return;

  if (req.method !== 'GET') {
    return res.status(405).json({ error: 'Method not allowed' });
  }

  const user = await requireAuth(req, res);
  if (!user) return; // Error already sent by requireAuth

  try {
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
}
