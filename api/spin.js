import { requireAuth } from './_lib/auth.js';
import { calculateWinnings } from './_lib/calculateWinnings.js';
import { setCorsHeaders, handleOptions } from './_lib/cors.js';

export default async function handler(req, res) {
  setCorsHeaders(res);
  if (handleOptions(req, res)) return;

  if (req.method !== 'POST') {
    return res.status(405).json({ error: 'Method not allowed' });
  }

  const user = await requireAuth(req, res);
  if (!user) return; // Error already sent by requireAuth

  const { bets, useFreeSpins } = req.body;

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
}
