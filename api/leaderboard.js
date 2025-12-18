import dbConnect from './_lib/dbConnect.js';
import User from './_lib/models/User.js';
import { setCorsHeaders, handleOptions } from './_lib/cors.js';

export default async function handler(req, res) {
  setCorsHeaders(res);
  if (handleOptions(req, res)) return;

  if (req.method !== 'GET') {
    return res.status(405).json({ error: 'Method not allowed' });
  }

  await dbConnect();

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
}
