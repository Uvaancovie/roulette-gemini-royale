import { requireAuth } from './_lib/auth.js';
import { setCorsHeaders, handleOptions } from './_lib/cors.js';

export default async function handler(req, res) {
  setCorsHeaders(res);
  if (handleOptions(req, res)) return;

  if (req.method !== 'POST') {
    return res.status(405).json({ error: 'Method not allowed' });
  }

  const user = await requireAuth(req, res);
  if (!user) return; // Error already sent by requireAuth

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
}
