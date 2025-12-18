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

  const { surveyId } = req.body;

  if (!surveyId) return res.status(400).json({ error: "SurveyId required" });

  try {
    // Check survey limit using enhanced User model method
    if (!user.checkSurveyLimit()) {
      return res.status(429).json({
        error: "Survey limit reached. Try again tomorrow!",
        nextAvailable: new Date(Date.now() + 24 * 60 * 60 * 1000).toISOString()
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
    user.dailySurveysToday += 1;

    // Log survey completion in history with special marker
    user.history.push({
      result: -1, // Special marker for survey completion
      wager: 0,
      payout: surveyReward,
      timestamp: new Date()
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
}
