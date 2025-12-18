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
}
