import { requireAuth } from './_lib/auth.js';
import { setCorsHeaders, handleOptions } from './_lib/cors.js';

const validPlatforms = ['whatsapp', 'twitter', 'facebook', 'instagram', 'tiktok'];

export default async function handler(req, res) {
  setCorsHeaders(res);
  if (handleOptions(req, res)) return;

  if (req.method !== 'POST') {
    return res.status(405).json({ error: 'Method not allowed' });
  }

  const user = await requireAuth(req, res);
  if (!user) return; // Error already sent by requireAuth

  const { platform } = req.body;

  if (!platform) return res.status(400).json({ error: "Platform required" });

  if (!validPlatforms.includes(platform.toLowerCase())) {
    return res.status(400).json({ error: "Invalid platform" });
  }

  try {
    // Check share limit using enhanced User model method
    if (!user.checkShareLimit(platform.toLowerCase())) {
      return res.status(429).json({
        error: `Share limit reached for ${platform}. Try again tomorrow!`,
        nextAvailable: new Date(Date.now() + 24 * 60 * 60 * 1000).toISOString()
      });
    }

    const shareReward = 100; // R100 for sharing
    const shareSpins = 1;

    user.balance += shareReward;
    user.freeSpins += shareSpins;

    // Update share count for this platform
    const currentCount = user.dailySharesPerPlatform.get(platform.toLowerCase()) || 0;
    user.dailySharesPerPlatform.set(platform.toLowerCase(), currentCount + 1);

    // Log share in history with special marker
    user.history.push({
      result: -2, // Special marker for share reward
      wager: validPlatforms.indexOf(platform.toLowerCase()), // Platform index
      payout: shareReward,
      timestamp: new Date()
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
}
